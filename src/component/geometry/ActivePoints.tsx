import { toJS } from 'mobx';
import { observer } from 'mobx-react-lite';
import React, { useCallback, useContext } from 'react';
import { View } from 'react-native';
import type { ViewStyle } from 'react-native';
import MapboxGL from '@react-native-mapbox-gl/maps';

import { StoreContext } from '../../state/StoreContext';
import { StyleContext } from '../StyleContext';
import type { FeatureListModel } from '../../state/FeatureListModel';
import type { PointAnnotationPayload } from '../../type/events';
import type { PointStyle } from '../../type/style';
import { PointDrawStyle } from '../../type/style';

/**
 * Convert generic point style parameters to the format expected
 * by Mapbox's `PointAnnotation`
 * @param inStyle Point style parameters
 * @return `PointAnnotation` rendering props
 */
function pointStyleToPointAnnotationStyle(inStyle: PointStyle): ViewStyle {
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
   * The store used to get the active point to render
   */
  readonly features: FeatureListModel;
  /**
   * Whether or not dragging of editable points is permitted
   */
  readonly draggable: boolean;
  /**
   * The index of the active point to render
   */
  readonly index: number;
}) {
  const { draggable, features, index } = props;
  // Layer ID for Mapbox
  const id = `pointAnnotation${index}`;
  /**
   * When the point is dragged, its new coordinates need to be saved to the store
   */
  const onDragEndWithIndex = useCallback(
    (e: PointAnnotationPayload) => {
      features.moveActiveCoordinate(e.geometry.coordinates, index);
    },
    [features, index]
  );

  /**
   * Choose styles for points based on the current user interaction
   * context, in combination with data associated with the points
   */
  const { styleGenerators } = useContext(StyleContext);
  let pointStyle = PointDrawStyle.InactivePoint;
  if (features.activePositions[index].isNew) {
    // New points can be styled differently depending on the types of features they are part of
    if (features.activePositions[index].feature.geometry.type === 'Point') {
      pointStyle = PointDrawStyle.DraftPoint;
    }
    // Other cases to be added later as more styles are defined
  } else if (draggable) {
    pointStyle = PointDrawStyle.EditPoint;
  }

  /**
   * Render a map point annotation.
   * `toJS` is needed here because `MapboxGL.PointAnnotation` is not an observer.
   * See https://mobx.js.org/react-integration.html#dont-pass-observables-into-components-that-arent-observer
   */
  return (
    <MapboxGL.PointAnnotation
      id={id}
      coordinate={toJS(features.activePositions[index].coordinates)}
      draggable={draggable}
      onDragEnd={onDragEndWithIndex as () => void}
    >
      <View
        style={pointStyleToPointAnnotationStyle(
          styleGenerators.point(
            pointStyle,
            features.activePositions[index].feature
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
 * Renders a list of active points on a map, where the points are draggable
 * depending on the current editing mode.
 * @return Renderable React node
 */
function _ActivePoints() {
  const { features, controls } = useContext(StoreContext).store;

  /**
   * Render all points by mapping the appropriate
   * data to [[SinglePoint]]
   */
  const renderSinglePoint = useCallback(
    (_point: unknown, index: number) => (
      <SinglePoint
        features={features}
        draggable={controls.isDragPointEnabled}
        index={index}
        key={index}
      />
    ),
    [features, controls.isDragPointEnabled]
  );
  return <>{features.activePositions.map(renderSinglePoint)}</>;
}

/**
 * Renderable MobX wrapper for [[_ActivePoints]]
 */
export const ActivePoints = observer(_ActivePoints);
