import { computed, toJS } from 'mobx';
import { model, Model, modelAction, prop } from 'mobx-keystone';
import { OnPressEvent } from '@rnmapbox/maps/lib/typescript/types/OnPressEvent';
import type { Position, GeoJsonProperties } from 'geojson';

import { eventPosition, pickTopmostFeature } from '../util/interaction';
import { ConfirmationModel, ConfirmationReason } from './ConfirmationModel';
import { DelayedLockModel } from './util/DelayedLockModel';
import { featureListContext } from './ModelContexts';
import { MetadataInteraction } from '../type/metadata';
import type { MapPressPayload } from '../type/events';
import {
  CoordinateRole,
  FeatureLifecycleStage,
  LineStringRole,
  RnmgeID,
} from '../type/geometry';
import type { EditableFeature } from '../type/geometry';

/**
 * Possible geometry editing modes
 */
export enum InteractionMode {
  /**
   * Reposition point geometry
   */
  DragPoint = 'DRAGPOINT',
  /**
   * Draw new point features
   */
  DrawPoint = 'DRAWPOINT',
  /**
   * Draw a new polygon
   */
  DrawPolygon = 'DRAWPOLYGON',
  /**
   * Draw a new polyline (line string)
   */
  DrawPolyline = 'DRAWPOLYLINE',
  /**
   * Edit metadata associated with a shape
   */
  EditMetadata = 'EDITMETADATA',
  /**
   * Edit compound shape vertices
   */
  EditVertices = 'EDITVERTICES',
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
 * or geometry metadata.
 * @param mode An editing mode
 */
function isFeatureModificationMode(mode: InteractionMode) {
  return !(
    mode === InteractionMode.EditMetadata ||
    mode === InteractionMode.SelectMultiple ||
    mode === InteractionMode.SelectSingle
  );
}

/**
 * Whether or not the editing mode involves selecting geometry
 * @param mode An editing mode
 */
function isSelectionMode(
  mode: InteractionMode
): mode is InteractionMode.SelectMultiple | InteractionMode.SelectSingle {
  return (
    mode === InteractionMode.SelectMultiple ||
    mode === InteractionMode.SelectSingle
  );
}

/**
 * Map a selection editing mode to a selection geometry lifecycle stage
 * @param mode The editing mode
 * @return The corresponding geometry lifecycle stage
 */
function selectionModeToSelectionStage(
  mode: InteractionMode.SelectMultiple | InteractionMode.SelectSingle
): FeatureLifecycleStage.SelectMultiple | FeatureLifecycleStage.SelectSingle {
  switch (mode) {
    case InteractionMode.SelectMultiple:
      return FeatureLifecycleStage.SelectMultiple;
    case InteractionMode.SelectSingle:
      return FeatureLifecycleStage.SelectSingle;
  }
}

/**
 * Whether or not the editing mode involves modifying existing geometry
 * @param mode An editing mode
 */
function isShapeModificationMode(mode: InteractionMode) {
  return (
    mode === InteractionMode.DragPoint || mode === InteractionMode.EditVertices
  );
}

/**
 * The default geometry editing mode
 */
const DEFAULT_INTERACTION_MODE = InteractionMode.SelectSingle;

/**
 * State of geometry editing controls and functions
 * for applying control actions
 */
@model('reactNativeMapboxGeometryEditor/ControlsModel')
export class ControlsModel extends Model({
  /**
   * The currently active editing mode
   */
  mode: prop<InteractionMode>(DEFAULT_INTERACTION_MODE),
  /**
   * The previous editing mode
   */
  prevMode: prop<InteractionMode>(DEFAULT_INTERACTION_MODE),
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
   * Whether there is a custom UI for the Geometry Editor
   */
  isCustomUI: prop<boolean | undefined>(false),
  /**
   * The user interface can set this property as-needed to inform the controller
   * that there are unsaved changes somewhere.
   * When it is `true`, the controller will warn about unsaved changes.
   */
  isDirty: prop<boolean>(false).withSetter(),
  /**
   * Geometry metadata to be saved.
   */
  pendingMetadata: prop<GeoJsonProperties>(() => null).withSetter(),
  /**
   * A lock that prevents touch events from being handled while the user is dragging
   * something on the map. For some reason, a fast drag action on Android sometimes
   * generates both drag and touch events in Mapbox.
   */
  draggingLock: prop<DelayedLockModel>(() => new DelayedLockModel({})),
  /**
   * Information about any currently selected vertex
   */
  selectedVertex: prop<{
    /**
     * The ID of the {@link FeatureModel} to which the vertex belongs
     */
    id: RnmgeID;
    /**
     * The index of the vertex in the feature
     */
    index: number;
  } | null>(() => null),
}) {
  /**
   * Retrieve the {@link MetadataInteraction} corresponding to current user interface state
   */
  @computed
  get metadataInteraction(): MetadataInteraction {
    switch (this.mode) {
      case InteractionMode.DragPoint:
      case InteractionMode.EditVertices:
        break;
      case InteractionMode.DrawPoint:
      case InteractionMode.DrawPolygon:
      case InteractionMode.DrawPolyline:
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
    return MetadataInteraction.ViewPreview;
  }

  /**
   * Return whether the current editing mode is a selection mode
   */
  @computed
  get hasSelectionMode() {
    return isSelectionMode(this.mode);
  }

  /**
   * Return whether the current editing mode is a geometry modification mode
   */
  @computed
  get hasShapeModificationMode() {
    return isShapeModificationMode(this.mode);
  }

  /**
   * Return whether there is a selected vertex
   */
  @computed
  get hasSelectedVertex() {
    return !!this.selectedVertex;
  }

  /**
   * Return whether the {@link delete} action can be performed
   */
  @computed
  get canDelete() {
    const features = featureListContext.get(this);
    switch (this.mode) {
      case InteractionMode.EditVertices:
        return this.hasSelectedVertex && features?.canRemoveVertex;
      case InteractionMode.SelectMultiple:
      case InteractionMode.SelectSingle: {
        let count = features?.selectedFeaturesCount;
        if (count) {
          return count > 0;
        } else {
          return false;
        }
      }
      case InteractionMode.DragPoint:
      case InteractionMode.DrawPoint:
      case InteractionMode.DrawPolygon:
      case InteractionMode.DrawPolyline:
      case InteractionMode.EditMetadata:
        return false;
    }
  }

  /**
   * Return whether it is appropriate for geometry to be imported
   * or exported (`false`), or whether an editing session is in progress
   * such that it is not appropriate to import or export geometry (`true`).
   */
  @computed
  get isEditing() {
    const features = featureListContext.get(this);
    if (features) {
      switch (this.mode) {
        case InteractionMode.SelectMultiple:
        case InteractionMode.SelectSingle:
          return features.canUndo;
        case InteractionMode.EditVertices:
        case InteractionMode.DragPoint:
        case InteractionMode.DrawPoint:
        case InteractionMode.DrawPolygon:
        case InteractionMode.DrawPolyline:
        case InteractionMode.EditMetadata:
          return true;
      }
    }
    return true;
  }

  /**
   * Set the editing mode to `mode`, or restore the default editing mode
   * if `mode` is the current editing mode
   *
   * @param mode The next editing mode
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
      case InteractionMode.EditVertices:
        // Select the features that were being edited
        if (isSelectionMode(mode)) {
          features?.editableToSelected(selectionModeToSelectionStage(mode));
        }
        break;
      case InteractionMode.DrawPoint:
      case InteractionMode.DrawPolygon:
      case InteractionMode.DrawPolyline:
        break;
      case InteractionMode.EditMetadata:
        features?.draftMetadataToSelected();
        break;
      case InteractionMode.SelectMultiple:
        // Deselect all features unless they are to be edited
        if (!isShapeModificationMode(mode)) {
          features?.deselectAll();
        }
        break;
      case InteractionMode.SelectSingle:
        // Deselect the feature unless it is to be edited
        if (
          mode !== InteractionMode.EditMetadata &&
          !isShapeModificationMode(mode)
        ) {
          features?.deselectAll();
        }
        break;
    }

    // Enclose editing sessions in "transactions"
    if (isFeatureModificationMode(this.mode)) {
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

    this.deselectVertex();

    this.draggingLock.unlockNow();

    // Change the editing mode
    this.prevMode = this.mode;
    if (isToggle) {
      this.mode = DEFAULT_INTERACTION_MODE;
    } else {
      // Execute actions specific to individual incoming editing modes
      switch (mode) {
        case InteractionMode.DragPoint:
          features?.selectedPointsToEditable();
          break;
        case InteractionMode.DrawPoint:
        case InteractionMode.DrawPolygon:
        case InteractionMode.DrawPolyline:
          break;
        case InteractionMode.EditVertices:
          features?.selectedComplexShapeToEditable();
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
   * Select the given vertex, if this object is in an appropriate editing mode
   *
   * @param id Feature ID
   * @param index The index of the vertex in the feature
   */
  @modelAction
  private selectVertex(id: RnmgeID, index: number) {
    switch (this.mode) {
      case InteractionMode.EditVertices:
        this.selectedVertex = {
          id,
          index,
        };
        break;
      case InteractionMode.DragPoint:
      case InteractionMode.DrawPoint:
      case InteractionMode.DrawPolygon:
      case InteractionMode.DrawPolyline:
      case InteractionMode.EditMetadata:
      case InteractionMode.SelectMultiple:
      case InteractionMode.SelectSingle:
        break;
    }
  }

  /**
   * Clear the selected vertex
   */
  @modelAction
  deselectVertex() {
    this.selectedVertex = null;
  }

  /**
   * Save a copy of `pendingMetadata` to the {@link FeatureListModel}
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
   * An internal version of {@link confirm} that accepts more arguments
   *
   * @param force If `true`, skip opening any confirmation dialogs that would
   *              normally prevent a page from being closed, and immediately
   *              confirm the current operation.
   */
  @modelAction
  private _confirm(force?: boolean) {
    const features = featureListContext.get(this);
    if (this.confirmation) {
      // This is a state change to a confirmation dialog
      switch (this.mode) {
        case InteractionMode.DrawPoint:
          // Discard the new point and close the metadata creation page
          features?.discardNewFeatures();
          this.clearMetadata();
          this.isPageOpen = false;
          break;
        case InteractionMode.DrawPolygon:
        case InteractionMode.DrawPolyline:
          if (this.isPageOpen) {
            console.warn(
              `A confirmation dialog should not be open when a page is open in editing mode ${this.mode}.`
            );
          } else {
            // User is confirming a cancel dialog while drawing the shape
            features?.rollbackEditingSession();
            features?.clearHistory();
            this.clearMetadata(); // Clear any metadata entered up to now
            this.confirmation = null; // Otherwise there will be a warning about changing the editing mode while there is a confirmation request open
            this.setDefaultMode(); // Exit shape drawing mode
          }
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
        case InteractionMode.DragPoint:
        case InteractionMode.EditVertices:
        case InteractionMode.SelectMultiple:
        case InteractionMode.SelectSingle:
          switch (this.confirmation.reason) {
            case ConfirmationReason.Basic:
              console.warn(
                `Unexpected confirmation reason, ${this.confirmation.reason}, for editing mode ${this.mode}.`
              );
              break;
            case ConfirmationReason.Commit:
              features?.clearHistory();
              break;
            case ConfirmationReason.Discard:
              features?.rollbackEditingSession();
              features?.clearHistory();
              break;
          }
          if (isShapeModificationMode(this.mode)) {
            // Move back to selection mode
            this.confirmation = null;
            this.exitShapeModificationMode();
          }
          break;
      }
      this.confirmation = null;
    } else {
      // This is a state change in the absence of a confirmation dialog
      switch (this.mode) {
        case InteractionMode.DrawPoint:
          this.saveMetadata();
          features?.confirmNewFeatures();
          this.isPageOpen = false;
          break;
        case InteractionMode.DrawPolygon:
        case InteractionMode.DrawPolyline:
          if (this.isCustomUI) {
            features?.confirmNewFeatures();
            features?.clearHistory();
            this.setDefaultMode();
          } else if (this.isPageOpen) {
            // User has finished entering metadata
            this.saveMetadata();
            this.clearMetadata(); // Clear draft metadata
            features?.confirmNewFeatures();
            features?.clearHistory();
            this.isPageOpen = false;
            // The user can only draw one shape before returning to view mode
            this.setDefaultMode();
          } else {
            // User is ready to enter metadata
            this.openPage(); // Open the metadata creation page
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
        case InteractionMode.EditVertices:
          if (features?.canUndoOrRedo && this.isCustomUI) {
            features?.clearHistory();
            this.confirmation = null;
            this.exitShapeModificationMode();
            break;
          } else if (features?.canUndoOrRedo && !force) {
            this.confirmation = new ConfirmationModel({
              message:
                'Do you wish to save changes and clear the editing history?',
              reason: ConfirmationReason.Commit,
            });
          } else if (force) {
            break;
          } else {
            console.warn(`There are no actions to confirm.`);
          }
          break;
        case InteractionMode.SelectMultiple:
        case InteractionMode.SelectSingle:
          if (this.isCustomUI) {
            features?.clearHistory();
            this.confirmation = null;
            this.exitShapeModificationMode();
            break;
          }
          if (this.mode === InteractionMode.SelectSingle && this.isPageOpen) {
            this.isPageOpen = false;
          } else if (features?.canUndo) {
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
      const features = featureListContext.get(this);

      switch (this.mode) {
        case InteractionMode.DrawPoint:
          if (this.isCustomUI) {
            break;
          }
          this.confirmation = new ConfirmationModel({
            message: 'Discard this point and its details?',
          });
          break;
        case InteractionMode.DrawPolygon:
        case InteractionMode.DrawPolyline:
          if (this.isCustomUI) {
            features?.rollbackEditingSession();
            features?.clearHistory();
            this.clearMetadata(); // Clear any metadata entered up to now
            break;
          } else if (this.isPageOpen) {
            // User goes back to drawing from metadata entry
            this.isPageOpen = false;
          } else {
            // User is cancelling the entire drawing operation and metadata entry
            if (features?.canUndo) {
              if (this.mode === InteractionMode.DrawPolygon) {
                this.confirmation = new ConfirmationModel({
                  message: 'Discard this polygon?',
                });
              } else if (this.mode === InteractionMode.DrawPolyline) {
                this.confirmation = new ConfirmationModel({
                  message: 'Discard this polyline?',
                });
              } else {
                throw new Error(
                  `There is no branch for the current editing mode, ${this.mode}, for customizing the confirmation dialog.`
                );
              }
            } else if (features?.canRedo) {
              this.confirmation = new ConfirmationModel({
                message: 'Discard changes that could be redone?',
              });
            } else {
              console.warn(`There are no actions to cancel.`);
            }
          }
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
        case InteractionMode.DragPoint:
        case InteractionMode.EditVertices:
          if (this.isCustomUI) {
            features?.rollbackEditingSession();
            features?.clearHistory();
            this.exitShapeModificationMode();
            break;
          } else if (features?.canUndo) {
            this.confirmation = new ConfirmationModel({
              message: 'Discard all changes and clear the editing history?',
              reason: ConfirmationReason.Discard,
            });
          } else if (features?.canRedo) {
            this.confirmation = new ConfirmationModel({
              message: 'Discard changes that could be redone?',
              reason: ConfirmationReason.Discard,
            });
          } else {
            // There are no actions to cancel
            this.exitShapeModificationMode();
          }
          break;
        case InteractionMode.SelectMultiple:
        case InteractionMode.SelectSingle:
          if (this.mode === InteractionMode.SelectSingle && this.isPageOpen) {
            this.isPageOpen = false;
          } else if (features?.canUndo) {
            this.confirmation = new ConfirmationModel({
              message: 'Discard all changes and clear the editing history?',
              reason: ConfirmationReason.Discard,
            });
          }
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
   * Move from a shape modification mode back to a selection mode
   */
  @modelAction
  private exitShapeModificationMode() {
    if (this.hasShapeModificationMode) {
      if (!isSelectionMode(this.prevMode)) {
        console.warn(
          `Mode ${this.mode} did not follow a selection mode, but followed ${this.prevMode}.`
        );
        this.toggleMode(InteractionMode.SelectMultiple);
      } else {
        this.toggleMode(this.prevMode);
      }
    } else {
      console.warn(`Unexpected mode ${this.mode}.`);
    }
  }

  /**
   * Redo the last geometry modification
   */
  @modelAction
  redo() {
    this.deselectVertex();
    featureListContext.get(this)?.redo();
  }

  /**
   * Undo the last geometry modification
   */
  @modelAction
  undo() {
    this.deselectVertex();
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
      case InteractionMode.EditVertices:
        console.warn(`The current editing mode, ${this.mode}, has no pages.`);
        break;
      case InteractionMode.DrawPoint:
        // Open metadata creation page
        this.isPageOpen = true;
        break;
      case InteractionMode.DrawPolygon:
      case InteractionMode.DrawPolyline:
        // Open metadata creation page if the shape is complete
        if (featureListContext.get(this)?.hasCompleteNewFeature) {
          this.isPageOpen = true;
        } else {
          console.warn(
            `There is no complete new shape for which to add metadata.`
          );
        }
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
   * Delete selected geometry or vertices
   */
  @modelAction
  delete() {
    const features = featureListContext.get(this);
    switch (this.mode) {
      case InteractionMode.EditVertices:
        if (this.hasSelectedVertex) {
          features?.removeVertex(this.selectedVertex?.index as number);
          this.deselectVertex();
        } else {
          console.warn(`No vertex is selected.`);
        }
        break;
      case InteractionMode.SelectMultiple:
      case InteractionMode.SelectSingle:
        features?.deleteSelected();
        if (this.isCustomUI) {
          features?.clearHistory();
        }
        break;
      case InteractionMode.DragPoint:
      case InteractionMode.DrawPoint:
      case InteractionMode.DrawPolygon:
      case InteractionMode.DrawPolyline:
      case InteractionMode.EditMetadata:
        console.warn(
          `The current editing mode, ${this.mode} does not have a delete action.`
        );
        break;
    }
  }

  /**
   * Import features into the features store, cancel any active editing
   * operations, and return to the default editing mode.
   *
   * @param features The new features
   * @param options Options controlling the import operation
   */
  @modelAction
  importFeatures(
    features: Array<EditableFeature>,
    options: {
      /**
       * Whether the features should be added to (`false`), or replace (`true`),
       * the features currently in the features store.
       */
      replace: boolean;
    }
  ) {
    const featureStore = featureListContext.get(this);
    if (featureStore) {
      // Reset all editing state
      this.cancel(true);
      this.isPageOpen = false;
      this.setDefaultMode();
      this.prevMode = this.mode;

      featureStore.importFeatures(features, options);
    }
  }

  /**
   * Signal that the user has started a drag interaction,
   * and so touch events should be ignored.
   */
  @modelAction
  startDrag() {
    this.draggingLock.lockNow();
  }

  /**
   * Signal that the user has stopped a drag interaction,
   * and so touch events can be handled after a delay
   * during which previously queued spurious touch events are ignored.
   */
  @modelAction
  endDrag() {
    this.draggingLock.unlockAfterDelay(200);
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
    if (features && !features.hasNewFeature) {
      features.addNewPoint(coordinates);
      if (this.isCustomUI) {
        this.confirm();
      } else {
        // The metadata creation page must now open
        this.openPage();
      }
    }
  }

  /**
   * Add a new vertex to a shape, or as the first vertex of a new shape
   * @param coordinates The coordinates of the vertex
   * @param finalType The type of shape to be created, if a new shape does not exist
   */
  @modelAction
  private addNewVertex(
    coordinates: Position,
    finalType: 'LineString' | 'Polygon'
  ) {
    const features = featureListContext.get(this);
    if (features) {
      if (features.hasNewFeature) {
        // Not the first vertex
        features.addVertex(coordinates);
      } else {
        // Add the first vertex
        features.addNewPoint(coordinates, finalType);
      }
    }
  }

  /**
   * Common error-checking and editing mode-independent control flow
   * for touch handler functions
   * @return `true` if the touch event has been fully-handled
   */
  @modelAction
  private onPressCommonHandling() {
    if (this.draggingLock.isLocked) {
      return true;
    }
    if (this.confirmation) {
      console.warn(
        `The map or geometry cannot be interacted with while there is an active confirmation request.`
      );
      return true;
    }
    if (this.isPageOpen) {
      console.warn(
        `The map or geometry cannot be interacted with while there is an open page.`
      );
      return true;
    }
    /**
     * If a vertex is selected, just deselect it rather than also performing
     * another action
     */
    if (this.hasSelectedVertex) {
      this.deselectVertex();
      return true;
    }
    return false;
  }

  /**
   * Touch event handler for geometry in the cold layer. See {@link ColdGeometry}
   *
   * @param e The features that were pressed, and information about the location pressed
   */
  @modelAction
  onPressColdGeometry(e: OnPressEvent) {
    if (this.onPressCommonHandling()) {
      return;
    }
    const features = featureListContext.get(this);

    switch (this.mode) {
      case InteractionMode.DragPoint:
      case InteractionMode.EditVertices:
        // Ignore - Editable geometry is not rendered in the cold layers
        break;
      case InteractionMode.DrawPoint:
        this.addNewPoint(eventPosition(e));
        break;
      case InteractionMode.DrawPolygon:
        this.addNewVertex(eventPosition(e), 'Polygon');
        break;
      case InteractionMode.DrawPolyline:
        this.addNewVertex(eventPosition(e), 'LineString');
        break;
      case InteractionMode.EditMetadata:
        // Ignore
        // This case shouldn't occur unless a metadata editing interface is slow to open
        break;
      case InteractionMode.SelectMultiple:
      case InteractionMode.SelectSingle:
        if (features) {
          let id = pickTopmostFeature(e, features);
          if (typeof id === 'string') {
            if (this.mode === InteractionMode.SelectMultiple) {
              features?.toggleMultiSelectFeature(id);
            } else if (this.mode === InteractionMode.SelectSingle) {
              features?.toggleSingleSelectFeature(id);
            } else {
              throw new Error(
                `There is no branch for the current editing mode, ${this.mode}, for selecting features.`
              );
            }
          }
        }
        break;
    }
  }

  /**
   * Touch event handler for geometry in the hot layer. See {@link HotGeometry}
   *
   * @param e The features that were pressed, and information about the location pressed
   */
  @modelAction
  onPressHotGeometry(e: OnPressEvent) {
    if (this.onPressCommonHandling()) {
      return;
    }
    const features = featureListContext.get(this);

    switch (this.mode) {
      case InteractionMode.DragPoint:
      case InteractionMode.DrawPoint:
      case InteractionMode.EditMetadata:
      case InteractionMode.SelectMultiple:
      case InteractionMode.SelectSingle:
        // Ignore the touch
        break;
      case InteractionMode.DrawPolygon:
        // Add new vertices to a new polygon or close the polygon
        if (e.features.length > 0) {
          /**
           * Prevent creating overlapping vertices by ensuring, if the user
           * touches the polygon to create a vertex in its interior, that
           * a vertex is only created if the user has not also touched another vertex.
           */
          let vertexTouched = false;
          let polygonTouched = false;
          for (let feature of e.features) {
            const id = feature?.properties?.rnmgeID; // Note that Mapbox clusters do not have this property
            if (id) {
              if (
                feature.properties?.rnmgeStage ===
                FeatureLifecycleStage.NewShape
              ) {
                /**
                 * For some reason, this touch handler is passed features with `null` geometry,
                 * hence the '?' in `feature.geometry?.type`
                 */
                if (feature.geometry?.type === 'Point') {
                  vertexTouched = true;
                  /**
                   * If the first vertex of a polygon was touched, and the polygon is complete,
                   * save the polygon.
                   */
                  if (
                    feature.properties?.rnmgeRole ===
                    CoordinateRole.PolygonStart
                  ) {
                    // If the polygon is fully-formed, send the user on to metadata entry
                    if (features?.hasCompleteNewFeature && !this.isCustomUI) {
                      this.confirm();
                    }
                  }
                } else if (feature.geometry?.type === 'Polygon') {
                  polygonTouched = true;
                }
              } else {
                console.warn(
                  `Feature in the hot layer with lifecycle stage ${feature.properties?.rnmgeStage} encountered in editing mode ${this.mode}.`
                );
              }
            }
          }
          if (polygonTouched && !vertexTouched) {
            // Allow the user to add vertices such that the polygon becomes concave
            this.addNewVertex(eventPosition(e), 'Polygon');
          }
        }
        break;
      case InteractionMode.DrawPolyline:
        // Ignore the touch to avoid creating overlapping vertices or self-intersections in a polyline
        break;
      case InteractionMode.EditVertices:
        /**
         * Two possible actions can be performed:
         * - Split an edge of an existing shape by adding a new vertex
         * - Select a vertex
         */
        if (e.features.length > 0) {
          /**
           * Prevent creating overlapping vertices by ensuring that a vertex
           * is only created if the user has not also touched an existing vertex.
           */
          let vertexTouched = false;
          let vertexIndex: number | null = null;
          // ID of the shape that was touched, or whose edge was touched
          let shapeID: RnmgeID | null = null;
          let point = eventPosition(e);
          for (let feature of e.features) {
            // Filter to features that were created by this library
            const id = feature?.properties?.rnmgeID;
            if (id) {
              // Filter to parts of the shape being edited
              if (
                feature.properties?.rnmgeStage ===
                FeatureLifecycleStage.EditShape
              ) {
                /**
                 * For some reason, this touch handler is passed features with `null` geometry
                 */
                if (feature.geometry) {
                  if (shapeID) {
                    if (id !== shapeID) {
                      console.warn(
                        `Multiple editable features with IDs ${shapeID} and ${id}.`
                      );
                    }
                  } else {
                    shapeID = id;
                  }
                  if (feature.geometry?.type === 'Point') {
                    // Touched a vertex of the shape that is being edited
                    if (typeof feature.properties?.rnmgeIndex === 'number') {
                      vertexIndex = feature.properties.rnmgeIndex;
                    }
                    vertexTouched = true;
                    break;
                  } else if (
                    feature.geometry?.type === 'LineString' ||
                    feature.geometry?.type === 'Polygon'
                  ) {
                    // Filter out holes
                    if (
                      feature?.properties?.rnmgeRole ===
                      LineStringRole.PolygonHole
                    ) {
                      shapeID = null;
                      break;
                    }
                  }
                }
              } else {
                console.warn(
                  `Feature in the hot layer with lifecycle stage ${feature.properties?.rnmgeStage} encountered in editing mode ${this.mode}.`
                );
              }
            }
          }
          if (shapeID) {
            if (vertexTouched) {
              if (typeof vertexIndex === 'number') {
                this.selectVertex(shapeID, vertexIndex);
              }
            } else {
              /**
               * We allow vertices to be added when the user touched the interior
               * of a polygon, and did not touch any of its edges, because it can
               * be difficult for the user to trigger a touch event on a thin edge.
               *
               * The drawback is that the user might sometimes be confused when they touch
               * the interior of a polygon and their touch causes a change to the polygon
               * far away from the location that they touch. The nearest edge to their touch,
               * where the new vertex is placed, may even be outside of the screen area.
               *
               * Another approach is to either increase the width of rendered polygon edges,
               * or to create a hit zone within the polygon that is restricted to areas closer
               * to the edges. Wide edges may be unattractive, and an invisible hit zone
               * may be confusing. From an implementation standpoint, a screen-space hit zone
               * is more difficult to implement, because world space to screen space
               * conversion functions are only accessible through the `MapboxGL.MapView` object.
               */
              features?.addVertexToNearestSegment(point);
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
  handleMapPress(e: MapPressPayload): boolean {
    if (this.onPressCommonHandling()) {
      return true;
    }

    switch (this.mode) {
      case InteractionMode.DragPoint:
      case InteractionMode.EditVertices:
        return false; // Ignore
      case InteractionMode.DrawPoint:
        // Draw a new point
        this.addNewPoint(e.geometry.coordinates);
        return true;
      case InteractionMode.DrawPolygon:
        this.addNewVertex(e.geometry.coordinates, 'Polygon');
        return true;
      case InteractionMode.DrawPolyline:
        this.addNewVertex(e.geometry.coordinates, 'LineString');
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

  /**
   * Select the top geometry that has been imported to the Geometry Editing Library
   * without having to tap on it
   */
  @modelAction
  selectTopShape() {
    const features = featureListContext.get(this);
    switch (this.mode) {
      case InteractionMode.DragPoint:
      case InteractionMode.EditVertices:
      case InteractionMode.DrawPoint:
      case InteractionMode.DrawPolygon:
      case InteractionMode.DrawPolyline:
      case InteractionMode.EditMetadata:
        // Ignore
        // We only want to select the shape if we are in select mode
        break;
      case InteractionMode.SelectMultiple:
      case InteractionMode.SelectSingle:
        //if there is a feature
        if (features && features.features.length > 0) {
          //get the id of the top feature
          let id = features?.features[0].$modelId;
          //select the top feature
          if (this.mode === InteractionMode.SelectMultiple) {
            features?.toggleSingleSelectFeature(id);
          } else if (this.mode === InteractionMode.SelectSingle) {
            features?.toggleSingleSelectFeature(id);
          } else {
            throw new Error(
              `There is no branch for the current editing mode, ${this.mode}, for selecting features.`
            );
          }
        } else {
          throw new Error(
            `There is not exactly one shape in the feature to select in selectOnlyShape.`
          );
        }
        break;
    }
  }
}
