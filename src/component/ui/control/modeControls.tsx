import { observer } from 'mobx-react-lite';
import { action } from 'mobx';
import { useContext, useMemo } from 'react';
import { ToggleButton } from 'react-native-paper';

import { ControlsModel, InteractionMode } from '../../../state/ControlsModel';
import { StoreContext } from '../../../state/StoreContext';

/**
 * A function that toggles the current mode of the geometry editor
 * @param controls
 * @param mode: the mode to swap the geometry editor into
 * @returns the function to call the mode toggle action
 */
export function useOnPressControl(
  controls: ControlsModel | null,
  mode: InteractionMode
) {
  return action('mode_control_press', () => {
    controls?.toggleMode(mode);
  });
}

/**
 * A function that calls an edit
 * @param controls
 * @returns the function to call the edit action
 */
export function useOnPressEditControl(controls: ControlsModel | null) {
  return action('edit_control_press', () => {
    controls?.toggleMode(InteractionMode.EditVertices);
  });
}
/**
 * A function that calls a select top shape action
 * @param controls
 * @returns the function to call the select top shape action
 */
export function useSelectTopShapeControl(controls: ControlsModel | null) {
  return action('mode_control_select_top_shape', () => {
    controls?.selectTopShape();
  });
}

/**
 * Create a toggle button that enables and disables an editing mode
 * @param mode The editing mode
 * @param icon The icon to apply to the toggle button
 * @return A React component for rendering an editing mode toggle button
 */
export function makeModeControl(mode: InteractionMode, icon: string) {
  return observer(() => {
    const { controls } = useContext(StoreContext);

    let status: 'unchecked' | 'checked' = 'unchecked';
    if (controls.mode === mode) {
      status = 'checked';
    }

    return (
      <ToggleButton
        icon={icon}
        onPress={useOnPressControl(controls, mode)}
        value={mode}
        status={status}
      />
    );
  });
}

/**
 * Point drawing editing mode control button
 */
export const DrawPointControl = makeModeControl(
  InteractionMode.DrawPoint,
  'plus-circle'
);
/**
 * Polygon drawing editing mode control button
 */
export const DrawPolygonControl = makeModeControl(
  InteractionMode.DrawPolygon,
  'shape-polygon-plus'
);
/**
 * Polyline drawing editing mode control button
 */
export const DrawPolylineControl = makeModeControl(
  InteractionMode.DrawPolyline,
  'vector-polyline-plus'
);
/**
 * Multi-selection editing mode control button
 */
export const SelectControl = makeModeControl(
  InteractionMode.SelectMultiple,
  'cursor-pointer'
);

/**
 * A geometry editing mode toggle button.
 *
 * When the controller is in a selection mode, the button activates the
 * appropriate editing mode for the type of selected geometry. If there
 * is no appropriate combination of selected geometry, the button is disabled.
 *
 * When the controller is in an editing mode, the button acts as a cancel button.
 *
 * Otherwise the button is disabled.
 */
function _ShapeEditControl() {
  const { controls, features } = useContext(StoreContext);

  // Button enabled/disabled state
  let enabled = false;
  // Any editing mode that pressing the button will activate
  let nextMode:
    | null
    | InteractionMode.DragPoint
    | InteractionMode.EditVertices = null;
  if (controls.hasSelectionMode) {
    if (features.hasSelectedPointsOnly) {
      nextMode = InteractionMode.DragPoint;
      enabled = true;
    } else if (features.hasOneSelectedComplexShapeOnly) {
      nextMode = InteractionMode.EditVertices;
      enabled = true;
    }
  } else if (controls.hasShapeModificationMode) {
    enabled = true;
  }

  // Button press handler
  const onPress = useMemo(
    () =>
      action('edit_control_press', () => {
        if (nextMode) {
          controls.toggleMode(nextMode);
        } else {
          controls.cancel();
        }
      }),
    [controls, nextMode]
  );
  let status: 'unchecked' | 'checked' = 'unchecked';
  if (controls.hasShapeModificationMode) {
    status = 'checked';
  }

  return (
    <ToggleButton
      icon="circle-edit-outline"
      onPress={onPress}
      disabled={!enabled}
      status={status}
    />
  );
}

/**
 * Renderable MobX wrapper for {@link _ShapeEditControl}
 */
export const ShapeEditControl = observer(_ShapeEditControl);
