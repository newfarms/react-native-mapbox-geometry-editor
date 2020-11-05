/**
 * React Native Mapbox geometry editor library example
 */

import * as React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';

import MapboxGL from '@react-native-mapbox-gl/maps';

import token from '../mapbox_token.json';

/**
 * Polyfill for React Native needed by 'react-native-mapbox-geometry-editor'
 * See https://github.com/uuidjs/uuid#getrandomvalues-not-supported
 */
import 'react-native-get-random-values';
import { GeometryEditor } from 'react-native-mapbox-geometry-editor';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'green',
  },
  map: {
    margin: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },
});

/* Set the Mapbox API access token
 * Changes to the token might only take effect after closing and reopening the app.
 * (see https://github.com/react-native-mapbox-gl/maps/issues/933)
 */
MapboxGL.setAccessToken(token.accessToken);

/**
 * Render a map page with a demonstration of the geometry editor library's functionality
 */
export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <GeometryEditor
        mapProps={{
          style: styles.map,
          styleURL: 'mapbox://styles/mapbox/dark-v10',
        }}
      >
        <MapboxGL.Camera
          centerCoordinate={[3.380271, 6.464217]}
          zoomLevel={14}
        />
      </GeometryEditor>
    </SafeAreaView>
  );
}
