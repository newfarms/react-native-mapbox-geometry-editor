import { observer } from 'mobx-react-lite';
import React, { useCallback, useContext } from 'react';
import { ToggleButton } from 'react-native-paper';

import { InteractionMode } from '../../state/ControlsModel';
import { StoreContext } from '../../state/StoreContext';

/**
 * Create a toggle button that enables and disables an editing mode
 * @param mode The editing mode
 * @param icon The icon to apply to the toggle button
 * @return A React component for rendering an editing mode toggle button
 */
function makeModeControl(mode: InteractionMode, icon: string) {
  return observer(() => {
    const { controls } = useContext(StoreContext).store;

    const onPress = useCallback(() => {
      controls.toggleMode(mode);
    }, [controls]);
    let status: 'unchecked' | 'checked' = 'unchecked';
    if (controls.mode === mode) {
      status = 'checked';
    }

    return (
      <ToggleButton
        icon={icon}
        onPress={onPress}
        value={mode}
        status={status}
      />
    );
  });
}

/**
 * Active points dragging editing mode control button
 */
export const DragPointControl = makeModeControl(
  InteractionMode.DragPoint,
  'circle-edit-outline'
);
/**
 * Active points addition editing mode control button
 */
export const DrawPointControl = makeModeControl(
  InteractionMode.DrawPoint,
  'plus-circle'
);