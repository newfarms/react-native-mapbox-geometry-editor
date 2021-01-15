import * as React from 'react';
import { useContext } from 'react';
import { observer } from 'mobx-react-lite';
import { StyleSheet } from 'react-native';
import { Surface } from 'react-native-paper';

import {
  DragPointControl,
  DrawPointControl,
  SelectControl,
} from './modeControls';
import { StoreContext } from '../../../state/StoreContext';

/**
 * @ignore
 */
const styles = StyleSheet.create({
  toolbox: {
    position: 'absolute',
  },
});

/**
 * A component that renders editing mode controls
 * as a group of buttons.
 * @return Renderable React node
 */
export function _ModeToolbox() {
  const { features } = useContext(StoreContext);

  if (features.canUndo) {
    return null;
  } else {
    return (
      <Surface style={styles.toolbox}>
        <DrawPointControl />
        <DragPointControl />
        <SelectControl />
      </Surface>
    );
  }
}

/**
 * Renderable MobX wrapper for [[_ModeToolbox]]
 */
export const ModeToolbox = observer(_ModeToolbox);
