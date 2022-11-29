import { action, toJS } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useCallback, useContext, useMemo } from 'react';
import { View } from 'react-native';
import type { ViewStyle } from 'react-native';
import MapboxGL from '@rnmapbox/maps';

import { StoreContext } from '../../state/StoreContext';
import { StyleContext } from '../StyleContext';
import type { PointAnnotationPayload } from '../../type/events';
import type { DraggablePointStyle } from '../../type/style';

/**
 * Generate additional style parameters needed to create a circular point annotation
 * @param inStyle Point style parameters
 * @return `PointAnnotation` rendering props
 */
function pointStyleToPointAnnotationStyle(
  inStyle: DraggablePointStyle
): ViewStyle {
  const {
    radius,
    color,
    opacity = 1.0,
    strokeWidth = 0,
    strokeColor,
  } = inStyle;
  return {
    alignItems: 'center',
    backgroundColor: color,
    borderColor: strokeColor,
    borderRadius: radius / 2,
    borderWidth: strokeWidth,
    height: radius,
    justifyContent: 'center',
    opacity,
    overflow: 'hidden',
    width: radius,
  };
}

/**
 * A renderer for a point in a list of points
 * @param props Point annotation properties
 * @return Renderable React node
 */
function _SinglePoint(props: {
  /**
   * The index of the draggable point to render
   */
  readonly index: number;
}) {
  const { controls, features } = useContext(StoreContext);
  const { index: inputIndex } = props;
  const draggablePosition = features.draggablePositions[inputIndex];
  const isSelected =
    controls.selectedVertex?.index === draggablePosition.index &&
    controls.selectedVertex?.id === draggablePosition.id;
  // Layer ID for Mapbox
  const id = `pointAnnotation${inputIndex}`;
  /**
   * While the point is being dragged, touch events must be ignored.
   */
  const onDragStart = useMemo(
    () =>
      action('draggable_points_drag_start', () => {
        controls.startDrag();
      }),
    [controls]
  );
  /**
   * When the point is dragged, its new coordinates need to be saved to the store
   */
  const onDragEndWithIndex = useMemo(
    () =>
      action('draggable_points_drag_end', (e: PointAnnotationPayload) => {
        features.dragPosition(
          e.geometry.coordinates,
          draggablePosition.id,
          draggablePosition.index
        );
        controls.endDrag();
      }),
    [controls, features, draggablePosition]
  );

  /**
   * Choose styles for points based on the current user interaction
   * context, in combination with data associated with the points
   */
  const { styleGenerators } = useContext(StyleContext);

  /**
   * Dynamic styling depending on whether the point is a selected vertex
   */
  let protoStyle: DraggablePointStyle | null = null;
  if (isSelected) {
    protoStyle = styleGenerators.selectedVertex(
      draggablePosition.role,
      draggablePosition.feature
    );
  } else {
    protoStyle = styleGenerators.draggablePoint(
      draggablePosition.role,
      draggablePosition.feature
    );
  }

  /**
   * Render a map point annotation.
   * `toJS` is needed here because `MapboxGL.PointAnnotation` is not an observer.
   * See https://mobx.js.org/react-integration.html#dont-pass-observables-into-components-that-arent-observer
   *
   * Note that there is no need to use the `onDeselected` prop of
   * `MapboxGL.PointAnnotation`, because `ControlsModel` will take care of
   * deselecting vertices following user interactions with other objects.
   */
  return (
    <MapboxGL.PointAnnotation
      id={id}
      coordinate={toJS(draggablePosition.coordinates)}
      draggable={true}
      onDragStart={onDragStart}
      onDragEnd={onDragEndWithIndex as () => void}
    >
      <View style={pointStyleToPointAnnotationStyle(protoStyle)} />
    </MapboxGL.PointAnnotation>
  );
}

/**
 * Renderable MobX wrapper for {@link _SinglePoint}
 */
const SinglePoint = observer(_SinglePoint);

/**
 * Renders a list of draggable points on a map
 * @return Renderable React node
 */
function _DraggablePoints() {
  const { features } = useContext(StoreContext);

  /**
   * Render all points by mapping the appropriate
   * data to {@link SinglePoint}
   */
  const renderSinglePoint = useCallback(
    (_point: unknown, index: number) => (
      <SinglePoint index={index} key={index} />
    ),
    []
  );
  return <>{features.draggablePositions.map(renderSinglePoint)}</>;
}

/**
 * Renderable MobX wrapper for {@link _DraggablePoints}
 */
export const DraggablePoints = observer(_DraggablePoints);
