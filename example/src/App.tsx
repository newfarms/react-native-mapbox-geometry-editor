/**
 * React Native Mapbox geometry editor library example
 */

import * as React from 'react';
import { SafeAreaView, StyleSheet, YellowBox } from 'react-native';

import MapboxGL from '@react-native-mapbox-gl/maps';

import token from '../mapbox_token.json';

/**
 * Hide warnings about require cycles in React Native Paper,
 * as done in the React Native Paper example,
 * https://github.com/callstack/react-native-paper/blob/212aa73715f157e1a77f8738859a608a543ba04c/example/src/index.tsx#L35
 *
 * Use `LogBox.ignoreLogs()` in React Native >= 0.63
 * (https://reactnative.dev/docs/debugging#console-errors-and-warnings)
 */
YellowBox.ignoreWarnings(['Require cycle:']);

/**
 * Polyfill for React Native needed by 'react-native-mapbox-geometry-editor'
 * See https://github.com/uuidjs/uuid#getrandomvalues-not-supported
 */
import 'react-native-get-random-values';
import {
  defaultStyleGeneratorMap,
  GeometryEditorUI,
  CoordinateRole,
} from 'react-native-mapbox-geometry-editor';
import type {
  DraggablePointStyle,
  EditableFeature,
  StyleGeneratorMap,
} from 'react-native-mapbox-geometry-editor';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'green',
  },
  libraryContainer: {
    margin: 10,
    borderRadius: 15,
    overflow: 'hidden',
    flex: 1,
    backgroundColor: 'blue',
  },
  map: {
    margin: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
});

/* Set the Mapbox API access token
 * Changes to the token might only take effect after closing and reopening the app.
 * (see https://github.com/react-native-mapbox-gl/maps/issues/933)
 */
MapboxGL.setAccessToken(token.accessToken);

/**
 * Custom rendering styles for geometry displayed on the map
 */
const styleGeneratorMap: StyleGeneratorMap = {
  /**
   * Style for draggable point annotations
   */
  draggablePoint: (
    role: CoordinateRole,
    feature: EditableFeature
  ): DraggablePointStyle => {
    let style = defaultStyleGeneratorMap.draggablePoint(role, feature);
    style.strokeColor = 'pink';
    style.strokeWidth = 3;
    return style;
  },
  /**
   * Style for point geometry, non-clusters
   */
  point: () => {
    let style = defaultStyleGeneratorMap.point();
    /**
     * Data-driven styling by geometry editing lifecycle stage
     */
    style.circleStrokeColor = [
      'match',
      ['get', 'rnmgeStage'],
      'NEWSHAPE',
      '#ffff00',
      'EDITSHAPE',
      '#ff00ff',
      'EDITMETADATA',
      '#0000ff',
      'SELECTMULTIPLE',
      '#00ffff',
      'SELECTSINGLE',
      '#00ff00',
      'DRAFT',
      '#ff0000',
      'VIEW',
      '#ffffff',
      '#000000',
    ];
    style.circleStrokeWidth = 2;
    return style;
  },
  /**
   * Style for clustered point geometry
   */
  cluster: () => {
    let style = defaultStyleGeneratorMap.cluster();
    style.circleStrokeColor = 'tan';
    style.circleStrokeWidth = 4;
    return style;
  },
  /**
   * Style for symbols rendered on top of clusters
   * (defaults to cluster point counts rendered as text)
   */
  clusterSymbol: () => {
    return defaultStyleGeneratorMap.clusterSymbol();
  },
};

/**
 * Render a map page with a demonstration of the geometry editor library's functionality
 */
export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <GeometryEditorUI
        style={styles.libraryContainer}
        mapProps={{
          style: styles.map,
          styleURL: 'mapbox://styles/mapbox/dark-v10',
        }}
        styleGenerators={styleGeneratorMap}
      >
        <MapboxGL.Camera
          centerCoordinate={[3.380271, 6.464217]}
          zoomLevel={14}
        />
      </GeometryEditorUI>
    </SafeAreaView>
  );
}
