/**
 * React Native Mapbox geometry editor library example
 */

import * as React from 'react';
import { StyleSheet } from 'react-native';

import MapboxGL from '@react-native-mapbox-gl/maps';

import token from '../mapbox_token.json';

const styles = StyleSheet.create({
  map: {
    ...StyleSheet.absoluteFillObject,
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
    <MapboxGL.MapView style={styles.map}>
      <MapboxGL.Camera centerCoordinate={[3.380271, 6.464217]} zoomLevel={14} />
    </MapboxGL.MapView>
  );
}
