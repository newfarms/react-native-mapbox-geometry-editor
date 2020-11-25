import { model, Model, modelAction, prop } from 'mobx-keystone';
import last from 'lodash/last';

import { ConfirmationModel } from './ConfirmationModel';
import { featureListContext } from './ModelContexts';
import { FeatureLifecycleStage } from '../type/geometry';

/**
 * Possible geometry editing modes
 */
export enum InteractionMode {
  /**
   * Reposition points of the shape being edited
   */
  DragPoint = 'DRAGPOINT',
  /**
   * Draw new point features
   */
  DrawPoint = 'DRAWPOINT',
  /**
   * Edit metadata associated with a shape
   */
  EditMetadata = 'EDITMETADATA',
  /**
   * Add shapes to the set of shapes selected for editing
   */
  SelectMultiple = 'SELECTMULTIPLE',
  /**
   * Select a shape to view its metadata or set it as
   * the active shape for future editing
   */
  SelectSingle = 'SELECTSINGLE',
}

/**
 * Whether or not the editing mode can involve modifying geometry,
 * including metadata
 * @param mode An editing mode
 */
function isGeometryModificationMode(mode: InteractionMode) {
  return !(
    mode === InteractionMode.SelectMultiple ||
    mode === InteractionMode.SelectSingle
  );
}

/**
 * The default geometry editing mode
 */
const defaultInteractionMode = InteractionMode.SelectSingle;

/**
 * State of geometry editing controls and functions
 * for applying control actions
 */
@model('reactNativeMapboxGeometryEditor/ControlsModel')
export class ControlsModel extends Model({
  /**
   * The currently active editing mode
   */
  mode: prop<InteractionMode>(defaultInteractionMode, {
    setterAction: true,
  }),
  /**
   * A description of any operation that the user
   * is asked to confirm or cancel
   */
  confimation: prop<ConfirmationModel | null>(() => null),
}) {
  /**
   * Set the editing mode to `mode`, or restore the default editing mode
   * if `mode` is the current editing mode
   */
  @modelAction
  toggleMode(mode: InteractionMode) {
    if (this.confimation) {
      console.warn(
        `Attempt to change editing mode from ${this.mode} to ${mode} while there is an active confirmation request.`
      );
      return;
    }

    // Enclose editing sessions in "transactions"
    const features = featureListContext.get(this);
    if (isGeometryModificationMode(mode)) {
      if (this.mode === mode) {
        features?.endEditingSession();
      } else if (isGeometryModificationMode(this.mode)) {
        features?.clearHistory();
      } else {
        features?.clearHistory();
      }
    } else {
      if (isGeometryModificationMode(this.mode)) {
        features?.endEditingSession();
      }
    }

    if (this.mode === mode) {
      this.mode = defaultInteractionMode;
    } else {
      this.mode = mode;

      // TODO
      // Placeholder code that makes all point features draggable.
      // To be removed when selection modes are implemented.
      if (this.mode === InteractionMode.DragPoint) {
        featureListContext.get(this)?.features?.forEach((val) => {
          if (val.geojson.geometry.type === 'Point') {
            val.stage = FeatureLifecycleStage.EditShape;
          }
        });
      }
    }
  }

  /**
   * Restore the default editing mode
   */
  @modelAction
  private setDefaultMode() {
    this.toggleMode(this.mode);
  }

  /**
   * Confirm the current commit or cancel operation
   */
  @modelAction
  confirm() {
    if (this.confimation) {
      // Cancel operation
      switch (this.mode) {
        case InteractionMode.DragPoint:
          this.rollback();
          break;
        case InteractionMode.DrawPoint:
          featureListContext.get(this)?.features.pop();
          break;
        case InteractionMode.EditMetadata:
          this.rollback();
          break;
        case InteractionMode.SelectMultiple:
        case InteractionMode.SelectSingle:
          console.warn(`There are no actions to cancel.`);
          break;
      }
      this.confimation = null;
    } else {
      // Commit operation
      switch (this.mode) {
        case InteractionMode.DragPoint:
          this.setDefaultMode();
          break;
        case InteractionMode.DrawPoint:
          {
            const feature = last(featureListContext.get(this)?.features);
            if (feature) {
              feature.stage = FeatureLifecycleStage.View;
            }
          }
          break;
        case InteractionMode.EditMetadata:
          this.setDefaultMode();
          break;
        case InteractionMode.SelectMultiple:
        case InteractionMode.SelectSingle:
          console.warn(`There are no actions to confirm.`);
          break;
      }
    }
  }

  /**
   * Cancel the current commit or cancel operation
   */
  @modelAction
  cancel() {
    if (this.confimation) {
      this.confimation = null;
    } else {
      switch (this.mode) {
        case InteractionMode.DragPoint:
          this.confimation = new ConfirmationModel({
            message: 'Discard position changes?',
          });
          break;
        case InteractionMode.DrawPoint:
          this.confimation = new ConfirmationModel({
            message: 'Discard this point and its details?',
          });
          break;
        case InteractionMode.EditMetadata:
          this.confimation = new ConfirmationModel({
            message: 'Discard changes to data?',
          });
          break;
        case InteractionMode.SelectMultiple:
        case InteractionMode.SelectSingle:
          console.warn(`There are no actions to request confirmation for.`);
          break;
      }
    }
  }

  /**
   * Rollback geometry or metadata modifications
   */
  @modelAction
  private rollback() {
    featureListContext.get(this)?.rollbackEditingSession();
  }
}
