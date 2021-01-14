import * as React from 'react';
import { useContext } from 'react';
import { observer } from 'mobx-react-lite';
import { StyleSheet } from 'react-native';
import { Surface } from 'react-native-paper';

import { DeleteControl, UndoControl } from './actionControls';
import { StoreContext } from '../../../state/StoreContext';
import { InteractionMode } from '../../../state/ControlsModel';

/**
 * @ignore
 */
const styles = StyleSheet.create({
  toolbox: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
});

/**
 * A set of action buttons, the contents of which depend on the current
 * user interface state. In some cases, nothing will be rendered.
 */
function _ActionToolbox() {
  const { controls, features } = useContext(StoreContext);

  switch (controls.mode) {
    case InteractionMode.DragPoint:
      break;
    case InteractionMode.DrawPoint:
      break;
    case InteractionMode.EditMetadata:
      break;
    case InteractionMode.SelectMultiple:
    case InteractionMode.SelectSingle:
      if (features.selectedFeaturesCount > 0 || features.canUndo) {
        return (
          <Surface style={styles.toolbox}>
            <UndoControl />
            <DeleteControl />
          </Surface>
        );
      }
  }
  return null;
}

/**
 * Renderable MobX wrapper for [[_UndoControl]]
 */
export const ActionToolbox = observer(_ActionToolbox);
