import { toJS } from 'mobx';
import { observer } from 'mobx-react-lite';
import React, { useCallback, useContext } from 'react';
import { View, StyleSheet } from 'react-native';
import MapboxGL from '@react-native-mapbox-gl/maps';
import type { Position } from 'geojson';

import StoreContext from '../state/StoreContext';
import type { FeatureListModel } from '../state/FeatureListModel';
import type { PointAnnotationPayload } from '../type/events';

/**
 * Render properties for [[ActivePoints]]
 */
interface ActivePointsProps {
  /**
   * Whether or not points are draggable
   */
  readonly draggable?: boolean;
}

/**
 * The diameter of point annotations, measured in density-independent pixels
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
 * @return Renderable React node
 */
function _SinglePoint(props: {
  /**
   * The store used to get the active point to render
   */
  readonly features: FeatureListModel;
  /**
   * Whether or not the rendered point should be draggable
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
   * Render a map point annotation.
   * `toJS` is needed here because `MapboxGL.PointAnnotation` is not an observer.
   * See https://mobx.js.org/react-integration.html#dont-pass-observables-into-components-that-arent-observer
   */
  return (
    <MapboxGL.PointAnnotation
      id={id}
      coordinate={toJS(features.activePositions[index])}
      draggable={draggable}
      onDragEnd={onDragEndWithIndex as () => void}
    >
      <View style={styles.annotationContainer} />
    </MapboxGL.PointAnnotation>
  );
}

/**
 * Renderable MobX wrapper for [[_SinglePoint]]
 */
const SinglePoint = observer(_SinglePoint);

/**
 * Renders a list of active points on a map, where the points are optionally draggable.
 * @param props Render properties
 * @return Renderable React node
 */
function _ActivePoints(props: ActivePointsProps) {
  const { draggable = false } = props;
  const { featureList: features } = useContext(StoreContext);

  /**
   * Render all points by mapping the appropriate
   * data to [[SinglePoint]]
   */
  const renderSinglePoint = useCallback(
    (_point: Position, index: number) => (
      <SinglePoint
        features={features}
        draggable={draggable}
        index={index}
        key={index}
      />
    ),
    [draggable, features]
  );
  return <>{features.activePositions.map(renderSinglePoint)}</>;
}

/**
 * Renderable MobX wrapper for [[_ActivePoints]]
 */
const ActivePoints = observer(_ActivePoints);

export default ActivePoints;
