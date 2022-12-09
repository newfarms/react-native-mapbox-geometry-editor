import { useContext } from 'react';
import { observer } from 'mobx-react-lite';
import { StyleSheet } from 'react-native';
import { Surface } from 'react-native-paper';

import {
  DrawPointControl,
  DrawPolygonControl,
  DrawPolylineControl,
  ShapeEditControl,
  SelectControl,
} from './modeControls';
import { InteractionMode } from '../../../state/ControlsModel';
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
 * A component that unconditionally renders editing mode controls
 * as a group of buttons.
 */
export function ModeToolboxButtons() {
  return (
    <Surface style={styles.toolbox}>
      <DrawPointControl />
      <DrawPolygonControl />
      <DrawPolylineControl />
      <ShapeEditControl />
      <SelectControl />
    </Surface>
  );
}

/**
 * A component that renders editing mode controls, as a group of buttons,
 * when appropriate given the user interface state.
 * @return Renderable React node
 */
export function _ModeToolbox() {
  const { controls, features } = useContext(StoreContext);

  let toolbox = null;
  if (!features.canUndo || !features.canRedo) {
    switch (controls.mode) {
      case InteractionMode.DragPoint:
      case InteractionMode.DrawPolygon:
      case InteractionMode.DrawPolyline:
      case InteractionMode.EditVertices:
        if (features.cannotUndoAndRedo) {
          toolbox = <ModeToolboxButtons />;
        }
        break;
      case InteractionMode.DrawPoint:
        toolbox = <ModeToolboxButtons />;
        break;
      case InteractionMode.EditMetadata:
        break;
      case InteractionMode.SelectMultiple:
      case InteractionMode.SelectSingle:
        /**
         * There is no redo button for un-deleting features,
         * so the redo history is irrelevant.
         */
        if (!features.canUndo) {
          toolbox = <ModeToolboxButtons />;
        }
        break;
    }
  }
  return toolbox;
}

/**
 * Renderable MobX wrapper for {@link _ModeToolbox}
 */
export const ModeToolbox = observer(_ModeToolbox);
