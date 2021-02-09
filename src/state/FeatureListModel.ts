import { computed, toJS } from 'mobx';
import {
  model,
  Model,
  modelAction,
  prop,
  undoMiddleware,
  UndoStore,
  withoutUndo,
} from 'mobx-keystone';
import type { UndoManager } from 'mobx-keystone';
import { point, featureCollection } from '@turf/helpers';
import difference from 'lodash/difference';
import flatten from 'lodash/flatten';
import filter from 'lodash/filter';
import remove from 'lodash/remove';
import type { Position, GeoJsonProperties } from 'geojson';

import { globalToLocalIndices } from '../util/collections';
import { FeatureModel } from './FeatureModel';
import type {
  DraggablePosition,
  EditableFeature,
  EditableGeometryType,
  RenderFeatureCollection,
  RenderPointFeatureCollection,
  RenderNonPointFeatureCollection,
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
   * Add a vertex to the feature currently being edited
   * @param vertex The new vertex for the feature
   * @param index The index at which to insert the vertex. See [[FeatureModel.addVertex]]
   */
  @modelAction
  addVertex(vertex: Position, index: number = -1) {
    if (this.rawGeometryEditableFeature) {
      this.rawGeometryEditableFeature.addVertex(vertex, index);
    } else {
      console.warn('No editable features to modify.');
    }
  }

  /**
   * Call this function to reset the undo/redo history at the end of
   * a geometry modification session.
   * Ensures that all geometry is marked as "finished".
   */
  @modelAction
  endEditingSession() {
    withoutUndo(() => {
      /**
       * Finalize all geometry
       * Note that this step is done before clearing the undo/redo history.
       */
      this.features.forEach((val, index) => {
        if (!val.isCompleteFeature) {
          console.warn(
            `Feature at index ${index} with model ID ${val.$modelId} is not a complete ${val.finalType}.`
          );
        }
        if (
          val.stage !== FeatureLifecycleStage.SelectMultiple &&
          val.stage !== FeatureLifecycleStage.SelectSingle
        ) {
          val.stage = FeatureLifecycleStage.View;
        }
      });
    });
    this.clearHistory();
  }

  /**
   * Call this function to reset the undo/redo history, such as at the start of
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
   * Whether at least one of the undo or redo history is not empty
   */
  @computed
  get canUndoOrRedo(): boolean {
    if (this.undoManager) {
      return this.undoManager.canUndo || this.undoManager.canRedo;
    }
    return false;
  }

  /**
   * Whether the undo and redo histories are both empty
   */
  @computed
  get cannotUndoAndRedo(): boolean {
    return !this.canUndo && !this.canRedo;
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
   * Returns any point features that should be rendered in the "cold" map layer.
   */
  @computed
  get coldPointFeatures(): RenderPointFeatureCollection {
    return featureCollection(
      flatten(this.features.map((feature) => feature.coldPointFeatures))
    );
  }

  /**
   * Returns any non-point features that should be rendered in the "cold" map layer.
   */
  @computed
  get coldNonPointFeatures(): RenderNonPointFeatureCollection {
    return featureCollection(
      flatten(this.features.map((feature) => feature.coldNonPointFeatures))
    );
  }

  /**
   * Add a new GeoJSON point feature to the collection of features.
   *
   * @param position Coordinates for the new point
   * @param finalType The desired type of geometry that the feature
   *                  will become when more vertices are added
   */
  @modelAction
  addNewPoint(position: Position, finalType: EditableGeometryType = 'Point') {
    const internalAddPoint = () => {
      this.features.push(
        new FeatureModel({
          stage: FeatureLifecycleStage.NewShape,
          geojson: point(position),
          finalType,
        })
      );
    };
    if (finalType === 'Point') {
      // Point drawing mode does not have undo functionality
      withoutUndo(internalAddPoint);
    } else {
      internalAddPoint();
    }
  }

  /**
   * Remove all new features
   */
  @modelAction
  discardNewFeatures() {
    withoutUndo(() => {
      // Search for all features that are not new
      const arr = remove(
        this.features,
        (val) => val.stage === FeatureLifecycleStage.NewShape
      );
      if (arr.length === 0) {
        console.warn('There are no new features to discard.');
      } else {
        if (arr.length > 1) {
          console.warn('Multiple new features were discarded.');
        }
      }
    });
  }

  /**
   * Retrieve the current new feature
   */
  @computed
  private get rawNewFeature(): FeatureModel | undefined {
    const arr = filter(
      this.features,
      (val) => val.stage === FeatureLifecycleStage.NewShape
    );
    if (arr.length > 1) {
      console.warn(
        'There are multiple new features. Only the first will be returned.'
      );
    }
    return arr[0];
  }

  /**
   * Whether there is a new feature yet to be confirmed
   */
  @computed
  get hasNewFeature(): boolean {
    return !!this.rawNewFeature;
  }

  /**
   * Whether there is a new feature yet to be confirmed,
   * and it is a complete shape
   */
  @computed
  get hasCompleteNewFeature(): boolean {
    return !!this.rawNewFeature && this.rawNewFeature.isCompleteFeature;
  }

  /**
   * Put all new features into the view state
   */
  @modelAction
  confirmNewFeatures() {
    withoutUndo(() => {
      const feature = this.rawNewFeature;
      if (feature) {
        if (!feature.isCompleteFeature) {
          console.warn(
            `Feature with model ID ${feature.$modelId} is not a complete ${feature.finalType}.`
          );
        }
        feature.stage = FeatureLifecycleStage.View;
      } else {
        console.warn('There are no new features to confirm.');
      }
    });
  }

  /**
   * Retrieve the feature whose geometry can be edited
   */
  @computed
  private get rawGeometryEditableFeature(): FeatureModel | undefined {
    const arr = filter(this.features, (val) => val.isGeometryEditableFeature);
    if (arr.length > 1) {
      console.warn(
        'There are multiple feature in a geometry editing stage. Only the first will be returned.'
      );
    }
    return arr[0];
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
   * Retrieve the (complete) feature whose metadata is currently being edited
   */
  @computed
  private get draftMetadataFeature(): FeatureModel | undefined {
    const arr = filter(
      this.features,
      (val) =>
        val.stage === FeatureLifecycleStage.EditMetadata ||
        (val.stage === FeatureLifecycleStage.NewShape && val.isCompleteFeature)
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
    withoutUndo(() => {
      if (this.draftMetadataFeature) {
        this.draftMetadataFeature.geojson.properties = data;
      } else {
        console.warn('There are no features with draft metadata.');
      }
    });
  }

  /**
   * Toggle the multiple selection mode status of the given feature
   *
   * @param id Feature ID
   */
  @modelAction
  toggleMultiSelectFeature(id: RnmgeID) {
    withoutUndo(() => {
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
    });
  }

  /**
   * Toggle the single selection mode status of the given feature
   *
   * @param id Feature ID
   */
  @modelAction
  toggleSingleSelectFeature(id: RnmgeID) {
    withoutUndo(() => {
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
    });
  }

  /**
   * Deactivate the single or multi-selection status of all features
   */
  @modelAction
  deselectAll() {
    withoutUndo(() => {
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
    });
  }

  /**
   * Put selected features into a geometry editing lifecycle stage
   */
  @modelAction
  selectedToEditable() {
    withoutUndo(() => {
      this.features.forEach((val) => {
        if (val.stage === FeatureLifecycleStage.SelectMultiple) {
          val.stage = FeatureLifecycleStage.EditShape;
        }
      });
    });
  }

  /**
   * Put features in a geometry editing lifecycle stage into a selected stage
   */
  @modelAction
  editableToSelectMultiple() {
    withoutUndo(() => {
      this.features.forEach((val) => {
        if (val.stage === FeatureLifecycleStage.EditShape) {
          val.stage = FeatureLifecycleStage.SelectMultiple;
        }
      });
    });
  }

  /**
   * Put any single selected feature into a geometry metadata editing lifecycle stage
   */
  @modelAction
  selectedToEditMetadata() {
    withoutUndo(() => {
      if (this.rawFocusedFeature) {
        this.rawFocusedFeature.stage = FeatureLifecycleStage.EditMetadata;
      }
    });
  }

  /**
   * Put any feature in a geometry metadata editing lifecycle stage into a selected lifecycle stage
   */
  @modelAction
  draftMetadataToSelected() {
    withoutUndo(() => {
      if (this.draftMetadataFeature) {
        this.draftMetadataFeature.stage = FeatureLifecycleStage.SelectSingle;
      }
    });
  }

  /**
   * Delete features in a selected lifecycle stage
   */
  @modelAction
  deleteSelected() {
    this.features = difference(this.features, this.rawSelectedFeatures);
  }
}
