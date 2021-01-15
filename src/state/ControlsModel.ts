import { computed, toJS } from 'mobx';
import { model, Model, modelAction, prop } from 'mobx-keystone';
import type { OnPressEvent } from '@react-native-mapbox-gl/maps';
import type { Position, GeoJsonProperties } from 'geojson';

import { ConfirmationModel, ConfirmationReason } from './ConfirmationModel';
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
  /**
   * The user interface can set this property as-needed to inform the controller
   * that there are unsaved changes somewhere.
   * When it is `true`, the controller will warn about unsaved changes.
   */
  isDirty: prop<boolean>(false, {
    setterAction: true,
  }),
  /**
   * Geometry metadata to be saved.
   */
  pendingMetadata: prop<GeoJsonProperties>(() => null, {
    setterAction: true,
  }),
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
    /**
     * Check for potential bugs
     */
    if (this.confirmation && this.mode !== InteractionMode.EditMetadata) {
      console.warn(
        `Attempt to change editing mode from ${this.mode} to ${mode} while there is an active confirmation request.`
      );
      return;
    }
    const features = featureListContext.get(this);
    if (features?.canUndo) {
      console.warn(
        `Attempt to change editing mode from ${this.mode} to ${mode} while the undo history is not empty.`
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
        // Deselect the feature unless its metadata is to be edited
        if (mode !== InteractionMode.EditMetadata) {
          features?.deselectAll();
        }
        break;
    }

    // Enclose editing sessions in "transactions"
    if (isGeometryModificationMode(this.mode)) {
      features?.endEditingSession();
    } else {
      // Make sure the redo history is clear
      features?.clearHistory();
    }

    /**
     * Discard dirty state
     */
    if (this.isDirty) {
      console.warn(
        `Dirty state is present while changing from mode ${this.mode} to mode ${mode}.`
      );
    }
    this.isDirty = false;
    if (this.pendingMetadata) {
      console.warn(
        `Pending metadata encountered while changing from mode ${this.mode} to mode ${mode}.`
      );
    }
    this.clearMetadata();

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
  private setDefaultMode() {
    this.toggleMode(this.mode);
  }

  /**
   * Save a copy of `pendingMetadata` to the [[FeatureListModel]]
   * and clear both `pendingMetadata` and `isDirty`.
   */
  @modelAction
  private saveMetadata() {
    if (this.pendingMetadata) {
      /**
       * The `toJS` call ensures that the object is copied instead of
       * passed by reference.
       * See also https://mobx-keystone.js.org/references for how to
       * properly pass by reference if desired.
       */
      featureListContext
        .get(this)
        ?.setDraftMetadata(toJS(this.pendingMetadata));
    } else {
      console.warn(`There is no pending metadata to save.`);
    }
    this.clearMetadata();
  }

  /**
   * Clear both `pendingMetadata` and `isDirty`.
   */
  @modelAction
  private clearMetadata() {
    this.pendingMetadata = null;
    this.isDirty = false;
  }

  /**
   * Confirm the current commit or cancel operation
   * This function is also used as a "Done" button callback
   * for open pages.
   */
  @modelAction
  confirm() {
    this._confirm(false);
  }

  /**
   * An internal version of [[confirm]] that accepts more arguments
   *
   * @param force If `true`, skip opening any confirmation dialogs and immediately
   *              confirm the current operation.
   */
  @modelAction
  private _confirm(force?: boolean) {
    if (this.confirmation) {
      // This is a state change to a confirmation dialog
      switch (this.mode) {
        case InteractionMode.DragPoint:
          featureListContext.get(this)?.clearHistory();
          break;
        case InteractionMode.DrawPoint:
          // Discard the new point and close the metadata creation page
          featureListContext.get(this)?.discardNewFeatures();
          this.clearMetadata();
          this.isPageOpen = false;
          break;
        case InteractionMode.EditMetadata:
          switch (this.confirmation.reason) {
            case ConfirmationReason.Basic:
              console.warn(
                `Unexpected confirmation reason, ${this.confirmation.reason}, for editing mode ${this.mode}.`
              );
              break;
            case ConfirmationReason.Commit:
              this.saveMetadata();
              break;
            case ConfirmationReason.Discard:
              break;
          }
          this.clearMetadata();
          this.setDefaultMode();
          break;
        case InteractionMode.SelectMultiple:
        case InteractionMode.SelectSingle:
          featureListContext.get(this)?.clearHistory();
          break;
      }
      this.confirmation = null;
    } else {
      // This is a state change in the absence of a confirmation dialog
      switch (this.mode) {
        case InteractionMode.DrawPoint:
          {
            // Save the new point
            const features = featureListContext.get(this);
            this.saveMetadata();
            features?.confirmNewFeatures();
            this.isPageOpen = false;
          }
          break;
        case InteractionMode.EditMetadata:
          if (!force && this.isDirty) {
            this.confirmation = new ConfirmationModel({
              message: 'Do you wish to save changes?',
              reason: ConfirmationReason.Commit,
            });
          } else {
            this.setDefaultMode();
          }
          break;
        case InteractionMode.DragPoint:
        case InteractionMode.SelectMultiple:
        case InteractionMode.SelectSingle:
          if (this.mode === InteractionMode.SelectSingle && this.isPageOpen) {
            this.isPageOpen = false;
          } else if (featureListContext.get(this)?.canUndo) {
            this.confirmation = new ConfirmationModel({
              message:
                'Do you wish to save changes and clear the editing history?',
              reason: ConfirmationReason.Commit,
            });
          } else {
            console.warn(`There are no actions to confirm.`);
          }
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
      // Dismiss confirmation dialog
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
          if (this.isDirty) {
            this.confirmation = new ConfirmationModel({
              message: 'Discard changes to data?',
              reason: ConfirmationReason.Discard,
            });
          } else {
            this.setDefaultMode();
          }
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
        this._confirm(true);
      }
    }
    return !!this.confirmation;
  }

  /**
   * Undo the last geometry modification
   */
  @modelAction
  undo() {
    featureListContext.get(this)?.undo();
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
   * Delete selected geometry
   */
  @modelAction
  delete() {
    featureListContext.get(this)?.deleteSelected();
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
