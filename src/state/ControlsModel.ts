import { model, Model, modelAction, prop } from 'mobx-keystone';
import type { OnPressEvent } from '@react-native-mapbox-gl/maps';
import type { Position } from 'geojson';

import { ConfirmationModel } from './ConfirmationModel';
import { featureListContext } from './ModelContexts';
import type { MapPressPayload } from '../type/events';

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
    const features = featureListContext.get(this);
    // Whether this is a deactivation of the current mode
    const isToggle = this.mode === mode;

    // Execute cleanup actions specific to individual outgoing editing modes
    switch (this.mode) {
      case InteractionMode.DragPoint:
        break;
      case InteractionMode.DrawPoint:
        break;
      case InteractionMode.EditMetadata:
        break;
      case InteractionMode.SelectMultiple:
        // Deselect all features unless they are to be edited
        if (mode !== InteractionMode.DragPoint) {
          features?.deselectAll();
        }
        break;
      case InteractionMode.SelectSingle:
        features?.deselectAll();
        break;
    }

    // Enclose editing sessions in "transactions"
    if (isGeometryModificationMode(this.mode)) {
      features?.endEditingSession();
    }
    if (
      isGeometryModificationMode(mode) &&
      !isGeometryModificationMode(this.mode)
    ) {
      features?.clearHistory();
    }

    // Change the editing mode
    if (isToggle) {
      this.mode = defaultInteractionMode;
    } else {
      // Execute actions specific to individual incoming editing modes
      switch (mode) {
        case InteractionMode.DragPoint:
          // Make all selected shapes editable
          features?.selectedToEditable();
          break;
        case InteractionMode.DrawPoint:
          break;
        case InteractionMode.EditMetadata:
          break;
        case InteractionMode.SelectMultiple:
          break;
        case InteractionMode.SelectSingle:
          break;
      }

      // Save the new editing mode
      this.mode = mode;
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
          featureListContext.get(this)?.discardNewFeatures();
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
          featureListContext.get(this)?.confirmNewFeatures();
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

  /**
   * Add a new point feature
   * @param coordinates The coordinates of the feature
   */
  @modelAction
  private addNewPoint(coordinates: Position) {
    // Draw a new point at the location
    const features = featureListContext.get(this);
    // Do nothing if there already is a draft point
    if (features && !features.draftMetadataGeoJSON) {
      features.addNewPoint(coordinates);
    }
  }

  /**
   * Touch event handler for geometry in the cold layer. See [[ColdGeometry]]
   *
   * @param e The features that were pressed, and information about the location pressed
   */
  @modelAction
  onPressColdGeometry(e: OnPressEvent) {
    if (this.confimation) {
      console.warn(
        `The map cannot be interacted with while there is an active confirmation request.`
      );
      return;
    }
    switch (this.mode) {
      case InteractionMode.DragPoint:
        // Ignore
        break;
      case InteractionMode.DrawPoint:
        this.addNewPoint([e.coordinates.longitude, e.coordinates.latitude]);
        break;
      case InteractionMode.EditMetadata:
        // Ignore
        // This case shouldn't occur unless a metadata editing interface is slow to open
        break;
      case InteractionMode.SelectMultiple:
        if (e.features.length > 0) {
          // Select all non-cluster features at the location
          for (let feature of e.features) {
            const id = feature?.properties?.rnmgeID; // Clusters do not have this property
            if (id) {
              featureListContext.get(this)?.toggleMultiSelectFeature(id);
            }
          }
        }
        break;
      case InteractionMode.SelectSingle:
        if (e.features.length > 0) {
          // Select the first non-cluster feature at the location
          for (let feature of e.features) {
            const id = feature?.properties?.rnmgeID; // Clusters do not have this property
            if (id) {
              featureListContext.get(this)?.toggleSingleSelectFeature(id);
            }
          }
        }
        break;
    }
  }

  /**
   * Executes the appropriate action in response to a map touch event
   *
   * @param e Event payload
   * @return A boolean indicating whether or not the event was fully-handled
   */
  @modelAction
  handleMapPress(e: MapPressPayload) {
    if (this.confimation) {
      console.warn(
        `The map cannot be interacted with while there is an active confirmation request.`
      );
      return true;
    }

    switch (this.mode) {
      case InteractionMode.DragPoint:
        return false; // Ignore
      case InteractionMode.DrawPoint:
        // Draw a new point
        this.addNewPoint(e.geometry.coordinates);
        return true;
      case InteractionMode.EditMetadata:
        return false; // Ignore
      case InteractionMode.SelectMultiple:
        return false; // Ignore
      case InteractionMode.SelectSingle:
        // Close all metadata preview annotations
        featureListContext.get(this)?.deselectAll();
        return true;
    }
  }
}
