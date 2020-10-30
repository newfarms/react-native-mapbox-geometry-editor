/**
 * Geometry editor map canvas
 * @packageDocumentation
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import MapboxGL, { MapViewProps } from '@react-native-mapbox-gl/maps';

import ActivePoints from './ActivePoints';

import useActivePoints from '../hooks/useActivePoints';
import useEventHandlers from '../hooks/useEventHandlers';

/**
 * Render properties for [[GeometryEditor]]
 */
interface GeometryEditorProps {
  /**
   * Additional properties for the [map](https://github.com/react-native-mapbox-gl/maps/blob/master/docs/MapView.md), including `style`.
   */
  readonly mapProps?: MapViewProps;
  /**
   * Additional child elements to render as children of the map
   */
  readonly children?: React.ReactNode;
}

/**
 * @ignore
 */
const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});

/**
 * A component that renders a map that fills its parent,
 * and listens to user input from the map and method calls
 * from the application to edit map geometry layers.
 *
 * @param props  Render properties
 * @return Renderable React node
 */
function GeometryEditor(props: GeometryEditorProps) {
  const { mapProps = {} } = props;
  const { style: mapStyle, onPress: outerOnPress, ...restMapProps } = mapProps;
  const {
    activePoints,
    activePointsOnPress,
    activePointsOnDragEnd,
  } = useActivePoints([[3.378421, 6.46571]]);
  const onPress = useEventHandlers([activePointsOnPress, outerOnPress]);

  return (
    <MapboxGL.MapView
      style={[styles.map, mapStyle]}
      onPress={onPress}
      {...restMapProps}
    >
      <ActivePoints
        coordinates={activePoints}
        draggable={true}
        onDragEnd={activePointsOnDragEnd}
      />
      {props.children}
    </MapboxGL.MapView>
  );
}

export default GeometryEditor;
