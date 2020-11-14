import { computed } from 'mobx';
import { model, Model, modelAction, prop } from 'mobx-keystone';

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
 * The default geometry editing mode
 */
const defaultInteractionMode = InteractionMode.SelectSingle;

/**
 * State of geometry editing controls
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
    if (this.mode === mode) {
      this.mode = defaultInteractionMode;
    } else {
      this.mode = mode;
    }
  }
}
