import { computed } from 'mobx';
import { model, Model, modelAction, prop } from 'mobx-keystone';

import { featureListContext } from './ModelContexts';

/**
 * Possible geometry editing modes
 */
export enum InteractionMode {
  /**
   * Reposition active points of the shape being edited
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
 * as opposed to allowing metadata changes or permitting no modifications of any kind.
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
  mode: prop<InteractionMode>(defaultInteractionMode, {
    setterAction: true,
  }),
}) {
  /**
   * Whether active points are currently draggable
   */
  @computed
  get isDragPointEnabled() {
    return this.mode === InteractionMode.DragPoint;
  }

  /**
   * Set the editing mode to `mode`, or restore the default editing mode
   * if `mode` is the current editing mode
   */
  @modelAction
  toggleMode(mode: InteractionMode) {
    // Enclose editing sessions in "transactions"
    if (
      isGeometryModificationMode(mode) ||
      isGeometryModificationMode(this.mode)
    ) {
      featureListContext.get(this)?.beginOrEndEditingSession();
    }
    if (this.mode === mode) {
      this.mode = defaultInteractionMode;
    } else {
      this.mode = mode;
    }
  }

  /**
   * Finish a geometry modification session
   */
  @modelAction
  confirmEdits() {
    if (!isGeometryModificationMode(this.mode)) {
      console.warn('Called outside of an editing mode.');
    }
    if (this.mode !== defaultInteractionMode) {
      this.mode = defaultInteractionMode;
      featureListContext.get(this)?.beginOrEndEditingSession();
    }
  }

  /**
   * Undo one geometry modification
   */
  @modelAction
  undo() {
    featureListContext.get(this)?.undo();
  }
}
