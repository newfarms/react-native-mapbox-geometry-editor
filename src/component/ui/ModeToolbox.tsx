import React from 'react';
import { StyleSheet } from 'react-native';
import { Surface } from 'react-native-paper';

import { DragPointControl, DrawPointControl } from './modeControls';

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
export function ModeToolbox() {
  return (
    <Surface style={styles.toolbox}>
      <DrawPointControl />
      <DragPointControl />
    </Surface>
  );
}
