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
 */
YellowBox.ignoreWarnings(['Require cycle:']);

/**
 * Polyfill for React Native needed by 'react-native-mapbox-geometry-editor'
 * See https://github.com/uuidjs/uuid#getrandomvalues-not-supported
 */
import 'react-native-get-random-values';
import {
  GeometryEditorUI,
  PointDrawStyle,
} from 'react-native-mapbox-geometry-editor';
import type {
  EditableFeature,
  PointStyle,
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
const styleGeneratorMap = {
  point: (style: PointDrawStyle, _feature: EditableFeature): PointStyle => {
    switch (style) {
      case PointDrawStyle.EditPoint:
        return {
          radius: 40,
          color: 'red',
          strokeColor: 'rgba(0.5, 0, 0, 1)',
        };
      case PointDrawStyle.DraftPoint:
        return {
          radius: 20,
          color: 'yellow',
          opacity: 0.5,
          strokeWidth: 5,
          strokeColor: 'rgba(0.5, 0.5, 0, 1)',
        };
      case PointDrawStyle.InactivePoint:
        return {
          radius: 30,
          color: 'grey',
          strokeColor: 'rgba(0.5, 0.5, 0.5, 1)',
        };
    }
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
