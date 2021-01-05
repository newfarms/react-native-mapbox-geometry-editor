import { action, toJS } from 'mobx';
import { observer } from 'mobx-react-lite';
import React, { useCallback, useContext } from 'react';
import { View } from 'react-native';
import type { ViewStyle } from 'react-native';
import MapboxGL from '@react-native-mapbox-gl/maps';

import { StoreContext } from '../../state/StoreContext';
import { StyleContext } from '../StyleContext';
import type { FeatureListModel } from '../../state/FeatureListModel';
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
   * The store used to get the draggable point to render
   */
  readonly features: FeatureListModel;
  /**
   * The index of the draggable point to render
   */
  readonly index: number;
}) {
  const { features, index } = props;
  // Layer ID for Mapbox
  const id = `pointAnnotation${index}`;
  /**
   * When the point is dragged, its new coordinates need to be saved to the store
   */
  const onDragEndWithIndex = useCallback(
    action('draggable_points_drag_end', (e: PointAnnotationPayload) => {
      features.dragPosition(e.geometry.coordinates, index);
    }),
    [features, index]
  );

  /**
   * Choose styles for points based on the current user interaction
   * context, in combination with data associated with the points
   */
  const { styleGenerators } = useContext(StyleContext);

  /**
   * Render a map point annotation.
   * `toJS` is needed here because `MapboxGL.PointAnnotation` is not an observer.
   * See https://mobx.js.org/react-integration.html#dont-pass-observables-into-components-that-arent-observer
   */
  return (
    <MapboxGL.PointAnnotation
      id={id}
      coordinate={toJS(features.draggablePositions[index].coordinates)}
      draggable={true}
      onDragEnd={onDragEndWithIndex as () => void}
    >
      <View
        style={pointStyleToPointAnnotationStyle(
          styleGenerators.draggablePoint(
            features.draggablePositions[index].role,
            features.draggablePositions[index].feature
          )
        )}
      />
    </MapboxGL.PointAnnotation>
  );
}

/**
 * Renderable MobX wrapper for [[_SinglePoint]]
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
   * data to [[SinglePoint]]
   */
  const renderSinglePoint = useCallback(
    (_point: unknown, index: number) => (
      <SinglePoint features={features} index={index} key={index} />
    ),
    [features]
  );
  return <>{features.draggablePositions.map(renderSinglePoint)}</>;
}

/**
 * Renderable MobX wrapper for [[_DraggablePoints]]
 */
export const DraggablePoints = observer(_DraggablePoints);
