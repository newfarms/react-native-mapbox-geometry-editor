import * as React from 'react';
import { useContext } from 'react';
import { observer } from 'mobx-react-lite';
import { StyleSheet } from 'react-native';
import { Surface } from 'react-native-paper';

import { DeleteControl, FinishControl, UndoControl } from './actionControls';
import { StoreContext } from '../../../state/StoreContext';
import { InteractionMode } from '../../../state/ControlsModel';

/**
 * @ignore
 */
const styles = StyleSheet.create({
  topToolbox: {
    position: 'absolute',
    backgroundColor: 'transparent',
  },
  bottomToolbox: {
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

  let bottomToolbox = null;
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
        bottomToolbox = (
          <Surface style={styles.bottomToolbox}>
            <UndoControl />
            <DeleteControl />
          </Surface>
        );
      }
  }
  let topToolbox = null;
  if (features.canUndo) {
    topToolbox = (
      <Surface style={styles.topToolbox}>
        <FinishControl />
      </Surface>
    );
  }

  return (
    <>
      {topToolbox}
      {bottomToolbox}
    </>
  );
}

/**
 * Renderable MobX wrapper for [[_UndoControl]]
 */
export const ActionToolbox = observer(_ActionToolbox);
