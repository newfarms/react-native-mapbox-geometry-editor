/**
 * Geometry editor map canvas
 * @packageDocumentation
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import MapboxGL, { MapViewProps } from '@react-native-mapbox-gl/maps';

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
  const { style: mapStyle, ...restMapProps } = mapProps;

  return (
    <MapboxGL.MapView style={[styles.map, mapStyle]} {...restMapProps}>
      {props.children}
    </MapboxGL.MapView>
  );
}

export default GeometryEditor;
