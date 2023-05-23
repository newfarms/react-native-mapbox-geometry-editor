import { useContext } from 'react';
import { observer } from 'mobx-react-lite';
import { action } from 'mobx';

import { ActionButton } from '../../util/ActionButton';
import { StoreContext } from '../../../state/StoreContext';
import { ControlsModel, InteractionMode } from '../../../state/ControlsModel';

/**
 * A function that calls a redo action
 * @param controls
 * @returns the function to call the redo action
 */
export function useOnPressRedoControl(controls: ControlsModel | null) {
  return action('redo_control_press', () => {
    controls?.redo();
  });
}

/**
 * A function that calls an undo action
 * @param controls
 * @returns the function to call the undo action
 */
export function useOnPressUndoControl(controls: ControlsModel | null) {
  return action('undo_control_press', () => {
    controls?.undo();
  });
}

/**
 * A function that calls a delete action
 * @param controls
 * @returns the function to call the delete action
 */
export function useOnPressDeleteControl(controls: ControlsModel | null) {
  return action('delete_control_press', () => {
    controls?.delete();
  });
}

/**
 * A function that calls a confirm action
 * @param controls
 * @returns the function to call the confirm action
 */
export function useOnPressFinishControl(controls: ControlsModel | null) {
  return action('finish_control_press', () => {
    controls?.confirm();
  });
}

/**
 * A function that calls a cancel action
 * @param controls
 * @returns the function to call the cancel action
 */
export function useOnPressCancelControl(controls: ControlsModel | null) {
  return action('rollback_control_press', () => {
    controls?.cancel();
  });
}

/**
 * A component that renders a redo control
 */
function _RedoControl() {
  const { controls, features } = useContext(StoreContext);

  return (
    <ActionButton
      icon="redo"
      disabled={!features.canRedo}
      onPress={useOnPressRedoControl(controls)}
    />
  );
}

/**
 * Renderable MobX wrapper for {@link _RedoControl}
 */
export const RedoControl = observer(_RedoControl);

/**
 * A component that renders an undo control
 */
function _UndoControl() {
  const { controls, features } = useContext(StoreContext);

  return (
    <ActionButton
      icon="undo"
      disabled={!features.canUndo}
      onPress={useOnPressUndoControl(controls)}
    />
  );
}

/**
 * Renderable MobX wrapper for {@link _UndoControl}
 */
export const UndoControl = observer(_UndoControl);

/**
 * A component that renders a control for deleting geometry or pieces of geometry
 */
function _DeleteControl() {
  const { controls } = useContext(StoreContext);

  const enabled = controls.canDelete;

  // Choose the icon based on the enabled/disabled status
  let icon = 'delete-outline';
  if (!enabled) {
    icon = 'delete-off-outline';
  }

  return (
    <ActionButton
      icon={icon}
      disabled={!enabled}
      onPress={useOnPressDeleteControl(controls)}
    />
  );
}

/**
 * Renderable MobX wrapper for {@link _DeleteControl}
 */
export const DeleteControl = observer(_DeleteControl);

/**
 * A component that renders a finish control for saving
 * all changes at the end of a self-contained editing task.
 */
function _FinishControl() {
  const { controls, features } = useContext(StoreContext);

  /**
   * Disable when there are no changes to save or discard
   */
  let disabled = features.cannotUndoAndRedo;
  switch (controls.mode) {
    case InteractionMode.DragPoint:
    case InteractionMode.DrawPoint:
    case InteractionMode.EditVertices:
    case InteractionMode.EditMetadata:
      break;
    case InteractionMode.DrawPolygon:
    case InteractionMode.DrawPolyline:
      // Complex shapes cannot be saved until they are well-formed
      disabled = disabled || !features.hasCompleteNewFeature;
      break;
    case InteractionMode.SelectMultiple:
    case InteractionMode.SelectSingle:
      // The redo history is irrelevant because there is no redo action available
      disabled = !features.canUndo;
      break;
  }

  return (
    <ActionButton
      icon="check"
      disabled={disabled}
      onPress={useOnPressFinishControl(controls)}
    />
  );
}

/**
 * Renderable MobX wrapper for {@link _FinishControl}
 */
export const FinishControl = observer(_FinishControl);

/**
 * A component that renders a rollback control for discarding all changes
 * at the end of a self-contained editing task, and for discarding the redo
 * history as well.
 */
function _RollbackControl() {
  const { controls } = useContext(StoreContext);
  /**
   * The button is always enabled because it should always be possible for the user
   * to escape the current editing context. The rest of the user interface is responsible
   * for rendering this button only when it makes sense.
   */
  return (
    <ActionButton
      icon="cancel"
      disabled={false}
      onPress={useOnPressCancelControl(controls)}
    />
  );
}

/**
 * Renderable MobX wrapper for {@link _RollbackControl}
 */
export const RollbackControl = observer(_RollbackControl);
