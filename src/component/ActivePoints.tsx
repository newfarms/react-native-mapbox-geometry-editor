import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import MapboxGL from '@react-native-mapbox-gl/maps';
import type { Position } from 'geojson';

import type { PointAnnotationPayload, PointDragCallback } from '../type/events';

/**
 * Render properties for [[ActivePoints]]
 */
interface ActivePointsProps {
  /**
   * The points to render on the map
   */
  readonly coordinates: Array<Position>;
  /**
   * Whether or not points are draggable
   */
  readonly draggable?: boolean;
  /**
   * An end of drag callback for each point
   */
  readonly onDragEnd?: PointDragCallback;
}

/**
 * The diameter of point annotations
 */
const ANNOTATION_SIZE = 20;

/**
 * @ignore
 */
const styles = StyleSheet.create({
  annotationContainer: {
    alignItems: 'center',
    backgroundColor: 'red',
    borderColor: 'rgba(0.5, 0, 0, 1)',
    borderRadius: ANNOTATION_SIZE / 2,
    borderWidth: StyleSheet.hairlineWidth,
    height: ANNOTATION_SIZE,
    justifyContent: 'center',
    overflow: 'hidden',
    width: ANNOTATION_SIZE,
  },
});

/**
 * A renderer for a point in a list of points
 * @param props Point annotation properties
 * @param index Index to use as a unique identifier
 * @return Renderable React node
 */
const renderSinglePoint = (
  props: {
    readonly coordinate: Position;
    readonly draggable: boolean;
    readonly onDragEnd: PointDragCallback;
  },
  index: number
) => {
  const { coordinate, draggable, onDragEnd } = props;
  const id = `pointAnnotation${index}`;
  const onDragEndWithIndex = (e: PointAnnotationPayload) => onDragEnd(e, index);

  return (
    <MapboxGL.PointAnnotation
      key={id}
      id={id}
      coordinate={coordinate}
      draggable={draggable}
      onDragEnd={onDragEndWithIndex as () => void}
    >
      <View style={styles.annotationContainer} />
    </MapboxGL.PointAnnotation>
  );
};

/**
 * Renders a list of points on a map, where the points are optionally draggable.
 * @param props Render properties
 * @return Renderable React node
 */
function ActivePoints(props: ActivePointsProps) {
  const { coordinates, draggable = false, onDragEnd = () => null } = props;
  const SinglePoint = useCallback(
    (point: Position, index) =>
      renderSinglePoint({ coordinate: point, draggable, onDragEnd }, index),
    [draggable, onDragEnd]
  );
  return <>{coordinates.map(SinglePoint)}</>;
}

export default ActivePoints;
