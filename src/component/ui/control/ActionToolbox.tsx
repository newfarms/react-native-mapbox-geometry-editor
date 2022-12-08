import { useContext } from 'react';
import { observer } from 'mobx-react-lite';
import { StyleSheet } from 'react-native';
import { Surface } from 'react-native-paper';

import {
  DeleteControl,
  FinishControl,
  RollbackControl,
  RedoControl,
  UndoControl,
} from './actionControls';
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
 * Finish and rollback action buttons, which appear together
 */
function TopToolbox() {
  return (
    <Surface style={styles.topToolbox}>
      <FinishControl />
      <RollbackControl />
    </Surface>
  );
}

/**
 * A set of action buttons, the contents of which depend on the current
 * user interface state. In some cases, nothing will be rendered.
 */
function _ActionToolbox() {
  const { controls, features } = useContext(StoreContext);

  let bottomToolbox = null;
  let topToolbox = null;
  switch (controls.mode) {
    case InteractionMode.EditMetadata:
    case InteractionMode.DrawPoint:
      break;
    case InteractionMode.DragPoint:
    case InteractionMode.DrawPolygon:
    case InteractionMode.DrawPolyline:
      if (features.canUndoOrRedo) {
        bottomToolbox = (
          <Surface style={styles.bottomToolbox}>
            <RedoControl />
            <UndoControl />
          </Surface>
        );
        topToolbox = <TopToolbox />;
      }
      break;
    case InteractionMode.EditVertices:
      bottomToolbox = (
        <Surface style={styles.bottomToolbox}>
          <RedoControl />
          <UndoControl />
          <DeleteControl />
        </Surface>
      );
      if (features.canUndoOrRedo) {
        topToolbox = <TopToolbox />;
      }
      break;
    case InteractionMode.SelectMultiple:
    case InteractionMode.SelectSingle:
      if (controls.canDelete || features.canUndo) {
        bottomToolbox = (
          <Surface style={styles.bottomToolbox}>
            <UndoControl />
            <DeleteControl />
          </Surface>
        );
        if (features.canUndo) {
          topToolbox = <TopToolbox />;
        }
      }
  }

  return (
    <>
      {topToolbox}
      {bottomToolbox}
    </>
  );
}

/**
 * Renderable MobX wrapper for {@link _UndoControl}
 */
export const ActionToolbox = observer(_ActionToolbox);
