import React, { useContext, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { action } from 'mobx';

import { ActionButton } from '../../util/ActionButton';
import { StoreContext } from '../../../state/StoreContext';

/**
 * A component that renders an undo control
 */
function _UndoControl() {
  const { controls, features } = useContext(StoreContext);
  // Button press callback
  const onPress = useMemo(
    () =>
      action('undo_control_press', () => {
        controls.undo();
      }),
    [controls]
  );

  const enabled = features.canUndo;

  return <ActionButton icon="undo" disabled={!enabled} onPress={onPress} />;
}

/**
 * Renderable MobX wrapper for [[_UndoControl]]
 */
export const UndoControl = observer(_UndoControl);

/**
 * A component that renders a control for deleting geometry
 */
function _DeleteControl() {
  const { controls, features } = useContext(StoreContext);
  // Button press callback
  const onPress = useMemo(
    () =>
      action('delete_control_press', () => {
        controls.delete();
      }),
    [controls]
  );

  /**
   * The control is enabled only if geometry is selected
   */
  const enabled = features.selectedFeaturesCount > 0;

  // Choose the icon based on the enabled/disabled status
  let icon = 'delete-outline';
  if (!enabled) {
    icon = 'delete-off-outline';
  }

  return <ActionButton icon={icon} disabled={!enabled} onPress={onPress} />;
}

/**
 * Renderable MobX wrapper for [[_DeleteControl]]
 */
export const DeleteControl = observer(_DeleteControl);

/**
 * A component that renders a finish control
 */
function _FinishControl() {
  const { controls, features } = useContext(StoreContext);
  // Button press callback
  const onPress = useMemo(
    () =>
      action('finish_control_press', () => {
        controls.confirm();
      }),
    [controls]
  );

  const enabled = features.canUndo;

  return <ActionButton icon="check" disabled={!enabled} onPress={onPress} />;
}

/**
 * Renderable MobX wrapper for [[_FinishControl]]
 */
export const FinishControl = observer(_FinishControl);
