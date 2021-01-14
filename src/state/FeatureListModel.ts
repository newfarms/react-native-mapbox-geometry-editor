import { computed, toJS } from 'mobx';
import {
  model,
  Model,
  modelAction,
  prop,
  undoMiddleware,
  UndoStore,
} from 'mobx-keystone';
import type { UndoManager } from 'mobx-keystone';
import { point, featureCollection } from '@turf/helpers';
import flatten from 'lodash/flatten';
import filter from 'lodash/filter';
import type { Position, GeoJsonProperties } from 'geojson';

import { globalToLocalIndices } from '../util/collections';
import { FeatureModel } from './FeatureModel';
import type {
  DraggablePosition,
  EditableFeature,
  RenderFeatureCollection,
  RnmgeID,
} from '../type/geometry';
import { FeatureLifecycleStage } from '../type/geometry';

/**
 * A collection of editable GeoJSON features
 */
@model('reactNativeMapboxGeometryEditor/FeatureListModel')
export class FeatureListModel extends Model({
  /**
   * Initial contents of the collection
   */
  features: prop<Array<FeatureModel>>(() => []),
  /**
   * Saved undo middleware state.
   * This data allows [[FeatureListModel]] to attach and dispose of undo middleware
   * as needed without losing the undo history. Since undo middleware is a function,
   * it is not possible to store the undo middleware itself in the state tree.
   * It is stored as runtime data, using a class property. It may seem that doing so
   * would require [changing the Babel configuration for MobX](https://mobx.js.org/installation.html#use-spec-compliant-transpilation-for-class-properties),
   * which does not presently work well in React Native
   * (https://github.com/facebook/react-native/issues/21154).
   * In reality, it doesn't matter, because runtime data does not need to be observable.
   */
  undoData: prop<UndoStore>(() => new UndoStore({})),
}) {
  private undoManager: UndoManager | null = null;
  /**
   * Set up the undo history
   */
  onInit() {
    this.undoManager = undoMiddleware(this, this.undoData);
    /**
     * There is no need to call `undoManager.dispose()` because
     * `undoManager` will be garbage-collected along with this
     * object, as it only refers to this object.
     * See https://mobx.js.org/reactions.html#mem-leak-example
     */
  }

  /**
   * Re-position a point in the list of points currently being edited
   * @param position The new position for the point
   * @param index The index of the point in the list of points being edited. See [[draggablePositions]]
   */
  @modelAction
  dragPosition(position: Position, index: number) {
    /**
     * Look up the underlying feature in the list of features,
     * corresponding to the index into the list of draggable points
     */
    const { innerIndex, outerIndex } = globalToLocalIndices(index, (i) => {
      if (i >= this.features.length) {
        return null;
      }
      return this.features[i].draggablePositions.length;
    });
    /**
     * Ask the feature to update the point, given the computed index
     * of the point in that feature.
     */
    this.features[outerIndex].dragPosition(position, innerIndex);
  }

  /**
   * Call this function to reset the undo/redo history at the end of
   * a geometry modification session.
   * Ensures that all geometry is marked as "finished".
   */
  @modelAction
  endEditingSession() {
    /**
     * Finalize all geometry
     * Note that this step is done before clearing the undo/redo history.
     */
    this.features.forEach((val) => {
      val.stage = FeatureLifecycleStage.View;
    });
    this.clearHistory();
  }

  /**
   * Call this function to reset the undo/redo history at the start of
   * a geometry modification session.
   */
  @modelAction
  clearHistory() {
    this.undoManager?.clearRedo();
    this.undoManager?.clearUndo();
  }

  /**
   * Revert to the beginning of the undo history (i.e. the start of the current
   * geometry modification session).
   */
  @modelAction
  rollbackEditingSession() {
    if (!this.undoManager?.canUndo) {
      console.warn('No changes to rollback.');
    }
    while (this.undoManager?.canUndo) {
      this.undoManager?.undo();
    }
  }

  /**
   * Whether there are changes that can be undone
   */
  @computed
  get canUndo(): boolean {
    if (this.undoManager) {
      return this.undoManager.canUndo;
    }
    return false;
  }

  /**
   * Revert the last geometry modification
   */
  @modelAction
  undo() {
    if (this.undoManager?.canUndo) {
      this.undoManager?.undo();
    } else {
      console.warn('No changes to undo.');
    }
  }

  /**
   * Whether there are changes that can be redone
   */
  @computed
  get canRedo(): boolean {
    if (this.undoManager) {
      return this.undoManager.canRedo;
    }
    return false;
  }

  /**
   * Re-apply the last reverted geometry modification
   */
  @modelAction
  redo() {
    if (this.undoManager?.canRedo) {
      this.undoManager?.redo();
    } else {
      console.warn('No changes to redo.');
    }
  }

  /**
   * Computes the list of draggable points (points currently being edited)
   * by concatenating the coordinates of all currently editable features.
   */
  @computed
  get draggablePositions(): Array<DraggablePosition> {
    /**
     * Empty arrays will be removed by `flatten`, but their removal
     * does not cause problems for [[dragPosition]], because [[globalToLocalIndices]]
     * can handle zero-length sub-collections.
     */
    return flatten(this.features.map((feature) => feature.draggablePositions));
  }

  /**
   * Returns any features that should be rendered in the "hot" map layer.
   */
  @computed
  get hotFeatures(): RenderFeatureCollection {
    return featureCollection(
      flatten(this.features.map((feature) => feature.hotFeatures))
    );
  }

  /**
   * Returns any features that should be rendered in the "cold" map layer.
   */
  @computed
  get coldFeatures(): RenderFeatureCollection {
    return featureCollection(
      flatten(this.features.map((feature) => feature.coldFeatures))
    );
  }

  /**
   * Add a new GeoJSON point feature to the collection of features.
   *
   * @param position Coordinates for the new point
   */
  @modelAction
  addNewPoint(position: Position) {
    this.features.push(
      new FeatureModel({
        stage: FeatureLifecycleStage.NewShape,
        geojson: point(position),
      })
    );
  }

  /**
   * Remove all new features
   */
  @modelAction
  discardNewFeatures() {
    // Search for all features that are not new
    const arr = filter(
      this.features,
      (val) => val.stage !== FeatureLifecycleStage.NewShape
    );
    if (arr.length === this.features.length) {
      console.warn('There are no new features to discard.');
    } else {
      if (arr.length < this.features.length - 1) {
        console.warn('There are multiple new features that will be discarded.');
      }
      this.features = arr;
    }
  }

  /**
   * Put all new features into the view state
   */
  @modelAction
  confirmNewFeatures() {
    const arr = filter(
      this.features,
      (val) => val.stage === FeatureLifecycleStage.NewShape
    );
    if (arr.length > 0) {
      if (arr.length > 1) {
        console.warn('There are multiple new features.');
      }
      arr.forEach((feature) => {
        feature.stage = FeatureLifecycleStage.View;
      });
    } else {
      console.warn('There are no new features to confirm.');
    }
  }

  /**
   * Retrieve the feature currently single-selected
   */
  @computed
  private get rawFocusedFeature(): FeatureModel | undefined {
    const arr = filter(
      this.features,
      (val) => val.stage === FeatureLifecycleStage.SelectSingle
    );
    if (arr.length > 1) {
      console.warn(
        'There are multiple single-selected features. Only the first will be returned.'
      );
    }
    return arr[0];
  }

  /**
   * Retrieve all features in a selected state
   */
  @computed
  private get rawSelectedFeatures(): Array<FeatureModel> {
    const arr = filter(
      this.features,
      (val) =>
        val.stage === FeatureLifecycleStage.SelectSingle ||
        val.stage === FeatureLifecycleStage.SelectMultiple
    );
    return arr;
  }

  /**
   * Count of features in a selected state
   */
  @computed
  get selectedFeaturesCount(): number {
    return this.rawSelectedFeatures.length;
  }

  /**
   * Retrieve a non-observable copy of the GeoJSON feature currently
   * single-selected, if one exists.
   */
  @computed
  get focusedFeature():
    | {
        /**
         * The GeoJSON feature
         */
        geojson: EditableFeature;
        /**
         * The ID of the corresponding [[FeatureModel]]
         */
        id: RnmgeID;
      }
    | undefined {
    const feature = this.rawFocusedFeature;
    if (feature) {
      return {
        geojson: toJS(feature.geojson),
        id: feature.$modelId,
      };
    }
    return undefined;
  }

  /**
   * Retrieve the feature whose metadata is currently being edited
   */
  @computed
  private get draftMetadataFeature(): FeatureModel | undefined {
    const arr = filter(
      this.features,
      (val) =>
        val.stage === FeatureLifecycleStage.EditMetadata ||
        val.stage === FeatureLifecycleStage.NewShape
    );
    if (arr.length > 1) {
      console.warn(
        'There are multiple features with draft metadata. Only the first will be returned.'
      );
    }
    return arr[0];
  }

  /**
   * Retrieve any GeoJSON feature whose metadata is currently
   * to be edited
   */
  @computed
  get draftMetadataGeoJSON(): EditableFeature | undefined {
    if (this.draftMetadataFeature) {
      return this.draftMetadataFeature.geojson;
    }
    return undefined;
  }

  /**
   * Update any metadata currently being edited
   *
   * @param data New metadata
   */
  @modelAction
  setDraftMetadata(data: GeoJsonProperties) {
    if (this.draftMetadataFeature) {
      this.draftMetadataFeature.geojson.properties = data;
    } else {
      console.warn('There are no features with draft metadata.');
    }
  }

  /**
   * Toggle the multiple selection mode status of the given feature
   *
   * @param id Feature ID
   */
  @modelAction
  toggleMultiSelectFeature(id: RnmgeID) {
    const arr = filter(this.features, (val) => val.$modelId === id);
    if (arr.length > 0) {
      // This check is present in case IDs are generated by the client application or the user in the future
      if (arr.length > 1) {
        console.warn(
          `There are multiple features with the same ID "${id}". Only the first will be used.`
        );
      }
      const feature = arr[0];
      if (feature.stage === FeatureLifecycleStage.View) {
        feature.stage = FeatureLifecycleStage.SelectMultiple;
      } else if (feature.stage === FeatureLifecycleStage.SelectMultiple) {
        feature.stage = FeatureLifecycleStage.View;
      } else {
        console.warn(
          `Feature with the ID "${id}" is in an inappropriate stage for toggling multi-selection, ${feature.stage}.`
        );
      }
    } else {
      console.warn(`There are no features with the ID "${id}".`);
    }
  }

  /**
   * Toggle the single selection mode status of the given feature
   *
   * @param id Feature ID
   */
  @modelAction
  toggleSingleSelectFeature(id: RnmgeID) {
    const arr = filter(this.features, (val) => val.$modelId === id);
    if (arr.length > 0) {
      // This check is present in case IDs are generated by the client application or the user in the future
      if (arr.length > 1) {
        console.warn(
          `There are multiple features with the same ID "${id}". Only the first will be used.`
        );
      }
      const feature = arr[0];
      if (feature.stage === FeatureLifecycleStage.View) {
        // Deselect all other features
        this.deselectAll();
        feature.stage = FeatureLifecycleStage.SelectSingle;
      } else if (feature.stage === FeatureLifecycleStage.SelectSingle) {
        feature.stage = FeatureLifecycleStage.View;
      } else {
        console.warn(
          `Feature with the ID "${id}" is in an inappropriate stage for toggling single-selection, ${feature.stage}.`
        );
      }
    } else {
      console.warn(`There are no features with the ID "${id}".`);
    }
  }

  /**
   * Deactivate the single or multi-selection status of all features
   */
  @modelAction
  deselectAll() {
    /**
     * This class could be optimized in the future by storing a list
     * of selected features, so that it is not necessary to iterate
     * over all features when processing selected features.
     */
    this.features.forEach((val) => {
      if (
        val.stage === FeatureLifecycleStage.SelectMultiple ||
        val.stage === FeatureLifecycleStage.SelectSingle
      ) {
        val.stage = FeatureLifecycleStage.View;
      }
    });
  }

  /**
   * Put selected features into a geometry editing lifecycle stage
   */
  @modelAction
  selectedToEditable() {
    this.features.forEach((val) => {
      if (val.stage === FeatureLifecycleStage.SelectMultiple) {
        val.stage = FeatureLifecycleStage.EditShape;
      }
    });
  }

  /**
   * Put any single selected feature into a geometry metadata editing lifecycle stage
   */
  @modelAction
  selectedToEditMetadata() {
    if (this.rawFocusedFeature) {
      this.rawFocusedFeature.stage = FeatureLifecycleStage.EditMetadata;
    }
  }

  /**
   * Put any feature in a geometry metadata editing lifecycle stage into a selected lifecycle stage
   */
  @modelAction
  draftMetadataToSelected() {
    if (this.draftMetadataFeature) {
      this.draftMetadataFeature.stage = FeatureLifecycleStage.SelectSingle;
    }
  }
}
