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
const SinglePoint = observer(
  (props: {
    features: FeatureListModel;
    readonly draggable: boolean;
    index: number;
  }) => {
    const { draggable, features, index } = props;
    const id = `pointAnnotation${index}`;
    const onDragEndWithIndex = useCallback(
      (e: PointAnnotationPayload) => {
        features.moveActiveCoordinate(e.geometry.coordinates, index);
      },
      [features, index]
    );

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
);

/**
 * Renders a list of points on a map, where the points are optionally draggable.
 * @param props Render properties
 * @return Renderable React node
 */
const ActivePoints = observer((props: ActivePointsProps) => {
  const { draggable = false } = props;
  const { featureList: features } = useContext(StoreContext);

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
});

export default ActivePoints;
