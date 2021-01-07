import { computed } from 'mobx';
import { model, Model, modelAction, prop } from 'mobx-keystone';
import type { OnPressEvent } from '@react-native-mapbox-gl/maps';
import type { Position } from 'geojson';

import { ConfirmationModel } from './ConfirmationModel';
import { featureListContext } from './ModelContexts';
import { MetadataInteraction } from '../type/metadata';
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
 * Whether or not the editing mode can involve modifying geometry
 * @param mode An editing mode
 */
function isGeometryModificationMode(mode: InteractionMode) {
  return !(
    mode === InteractionMode.EditMetadata ||
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
  mode: prop<InteractionMode>(defaultInteractionMode),
  /**
   * A description of any operation that the user
   * is asked to confirm or cancel
   */
  confirmation: prop<ConfirmationModel | null>(() => null),
  /**
   * Whether there is a large modal or page open to show something
   * other than the map.
   */
  isPageOpen: prop<boolean>(false),
}) {
  /**
   * Retrieve the [[MetadataInteraction]] corresponding to current user interface state
   */
  @computed
  get metadataInteraction(): MetadataInteraction {
    switch (this.mode) {
      case InteractionMode.DragPoint:
        break;
      case InteractionMode.DrawPoint:
        return MetadataInteraction.Create;
      case InteractionMode.EditMetadata:
        return MetadataInteraction.Edit;
      case InteractionMode.SelectMultiple:
        break;
      case InteractionMode.SelectSingle:
        if (this.isPageOpen) {
          return MetadataInteraction.ViewDetails;
        } else {
          return MetadataInteraction.ViewPreview;
        }
    }
    console.warn(
      `Metadata interactions are irrelevant to the current interaction mode, ${this.mode}`
    );
    return MetadataInteraction.ViewPreview;
  }

  /**
   * Set the editing mode to `mode`, or restore the default editing mode
   * if `mode` is the current editing mode
   */
  @modelAction
  toggleMode(mode: InteractionMode) {
    if (this.confirmation && this.mode !== InteractionMode.EditMetadata) {
      console.warn(
        `Attempt to change editing mode from ${this.mode} to ${mode} while there is an active confirmation request.`
      );
      return;
    }
    /**
     * The transition between geometry metadata view and edit operations occurs
     * while a metadata display/edit page remains open.
     * Other transitions between editing modes either occur when no pages are open,
     * or are not performed using `toggleMode()`. If they happen regardless,
     * assume that something has mistakenly let the map display instead
     * of the open page. Therefore, clean up the abandoned page.
     */
    if (
      this.isPageOpen &&
      !(
        (this.mode === InteractionMode.EditMetadata &&
          mode === InteractionMode.EditMetadata) ||
        (this.mode === InteractionMode.SelectSingle &&
          mode === InteractionMode.EditMetadata)
      )
    ) {
      console.warn(
        `Changing editing mode from ${this.mode} to ${mode} while a page is open.`
      );
      // Force-close any open pages
      this.notifyOfPageClose();
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
        features?.draftMetadataToSelected();
        break;
      case InteractionMode.SelectMultiple:
        // Deselect all features unless they are to be edited
        if (mode !== InteractionMode.DragPoint) {
          features?.deselectAll();
        }
        break;
      case InteractionMode.SelectSingle:
        if (mode !== InteractionMode.EditMetadata) {
          features?.deselectAll();
        }
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
          features?.selectedToEditMetadata();
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
  setDefaultMode() {
    this.toggleMode(this.mode);
  }

  /**
   * Confirm the current commit or cancel operation
   * This function is also used as a "Done" button callback
   * for open pages.
   */
  @modelAction
  confirm() {
    if (this.confirmation) {
      // Cancel operation
      switch (this.mode) {
        case InteractionMode.DragPoint:
          this.rollback();
          break;
        case InteractionMode.DrawPoint:
          featureListContext.get(this)?.discardNewFeatures();
          this.isPageOpen = false;
          break;
        case InteractionMode.EditMetadata:
          this.setDefaultMode();
          break;
        case InteractionMode.SelectMultiple:
        case InteractionMode.SelectSingle:
          console.warn(`There are no actions to cancel.`);
          break;
      }
      this.confirmation = null;
    } else {
      // Commit operation
      switch (this.mode) {
        case InteractionMode.DragPoint:
          this.setDefaultMode();
          break;
        case InteractionMode.DrawPoint:
          featureListContext.get(this)?.confirmNewFeatures();
          this.isPageOpen = false;
          break;
        case InteractionMode.EditMetadata:
          this.setDefaultMode();
          break;
        case InteractionMode.SelectMultiple:
          console.warn(`There are no actions to confirm.`);
          break;
        case InteractionMode.SelectSingle:
          this.isPageOpen = false;
          break;
      }
    }
  }

  /**
   * Cancel the current commit or cancel operation.
   * This function is also used as a "Close" button callback
   * for open pages.
   *
   * @param force If `true`, skip opening any confirmation dialogs and immediately
   *              cancel the current operation.
   * @return Whether the cancellation is complete (`true`), or has yet to be confirmed (`false`).
   *         If the function returns `false`, it is not safe to close an open page, for example,
   *         or the user may lose unsaved changes.
   */
  @modelAction
  cancel(force?: boolean): boolean {
    if (this.confirmation) {
      this.confirmation = null;
    } else {
      switch (this.mode) {
        case InteractionMode.DragPoint:
          this.confirmation = new ConfirmationModel({
            message: 'Discard position changes?',
          });
          break;
        case InteractionMode.DrawPoint:
          this.confirmation = new ConfirmationModel({
            message: 'Discard this point and its details?',
          });
          break;
        case InteractionMode.EditMetadata:
          this.confirmation = new ConfirmationModel({
            message: 'Discard changes to data?',
          });
          break;
        case InteractionMode.SelectMultiple:
          console.warn('There are no actions to request confirmation for.');
          break;
        case InteractionMode.SelectSingle:
          // There is no operation to cancel, but close any open page
          this.isPageOpen = false;
          break;
      }
      /**
       * Force cancellation by confirming the cancel dialog
       */
      if (force && this.confirmation) {
        this.confirm();
      }
    }
    return !!this.confirmation;
  }

  /**
   * Open a page appropriate to the current state
   */
  @modelAction
  openPage() {
    if (this.confirmation) {
      console.warn(
        `A page cannot be opened while there is an active confirmation request.`
      );
      return;
    }
    if (this.isPageOpen) {
      console.warn(`There is already an open page.`);
      return;
    }

    switch (this.mode) {
      case InteractionMode.DragPoint:
        console.warn(`The current editing mode, ${this.mode}, has no pages.`);
        break;
      case InteractionMode.DrawPoint:
        // Open metadata creation page
        this.isPageOpen = true;
        break;
      case InteractionMode.EditMetadata:
        // This case should not occur as a page should already be open for viewing metadata
        console.warn(
          `The current editing mode, ${this.mode}, should not need to open a new page.`
        );
        break;
      case InteractionMode.SelectMultiple:
        console.warn(`TODO: For future use selecting overlapping geometry.`);
        break;
      case InteractionMode.SelectSingle:
        // Open metadata details view
        this.isPageOpen = true;
        break;
    }
  }

  /**
   * Notify the controller that a page has been unexpectedly closed
   */
  @modelAction
  notifyOfPageClose() {
    /**
     * Some cleanup routines will call this function before they have
     * a chance to be notified that the page was already intentionally closed,
     * so check if the page is already closed.
     */
    if (this.isPageOpen) {
      this.cancel(true);
      this.isPageOpen = false;
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
      // The metadata creation page must now open
      this.openPage();
    }
  }

  /**
   * Touch event handler for geometry in the cold layer. See [[ColdGeometry]]
   *
   * @param e The features that were pressed, and information about the location pressed
   */
  @modelAction
  onPressColdGeometry(e: OnPressEvent) {
    if (this.confirmation) {
      console.warn(
        `Map geometry cannot be interacted with while there is an active confirmation request.`
      );
      return;
    }
    if (this.isPageOpen) {
      console.warn(
        `The map geometry cannot be interacted with while there is an open page.`
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
    if (this.confirmation) {
      console.warn(
        `The map cannot be interacted with while there is an active confirmation request.`
      );
      return true;
    }
    if (this.isPageOpen) {
      console.warn(
        `The map cannot be interacted with while there is an open page.`
      );
      return;
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
