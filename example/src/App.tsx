/**
 * React Native Mapbox geometry editor library example
 */

import * as React from 'react';
import { LogBox, SafeAreaView, StyleSheet } from 'react-native';

import MapboxGL from '@react-native-mapbox-gl/maps';

import token from '../mapbox_token.json';

/**
 * Hide warnings about require cycles in React Native Paper,
 * as done in the React Native Paper example,
 * https://github.com/callstack/react-native-paper/blob/212aa73715f157e1a77f8738859a608a543ba04c/example/src/index.tsx#L35
 */
LogBox.ignoreLogs(['Require cycle:']);

/**
 * Polyfill for React Native needed by 'react-native-mapbox-geometry-editor'
 * See https://github.com/uuidjs/uuid#getrandomvalues-not-supported
 */
import 'react-native-get-random-values';
import {
  defaultStyleGeneratorMap,
  GeometryEditorUI,
  CoordinateRole,
  validateMetadata,
} from 'react-native-mapbox-geometry-editor';
import type {
  DraggablePointStyle,
  EditableFeature,
  MetadataSchema,
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
 * Example enumeration used for an option select
 * geometry metadata field
 *
 * Also used for data-driven geometry styling
 */
enum VehicleType {
  Car = 'CAR',
  Train = 'TRAIN',
  Boat = 'BOAT',
  Bicycle = 'BICYCLE',
}

/**
 * Default colours for vehicle types
 * @param stage The vehicle type
 * @return A specific or a default colour, depending on whether `type` is defined
 */
function vehicleTypeColor(type?: VehicleType): string {
  switch (type) {
    case VehicleType.Car:
      return '#ff1493'; // Deep pink
    case VehicleType.Train:
      return '#adff2f'; // Green yellow
    case VehicleType.Boat:
      return '#0000cd'; // Medium blue
    case VehicleType.Bicycle:
      return '#f4a460'; // Sandy brown
    default:
      return '#ffffff'; // White
  }
}

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
    style.color = vehicleTypeColor(feature.properties?.vehicleType);
    return style;
  },
  /**
   * Style for point geometry, non-clusters
   */
  point: () => {
    let style = defaultStyleGeneratorMap.point();
    /**
     * Data-driven styling by vehicle type
     */
    style.circleColor = [
      'match',
      ['get', 'vehicleType'],
      VehicleType.Car,
      vehicleTypeColor(VehicleType.Car),
      VehicleType.Train,
      vehicleTypeColor(VehicleType.Train),
      VehicleType.Boat,
      vehicleTypeColor(VehicleType.Boat),
      VehicleType.Bicycle,
      vehicleTypeColor(VehicleType.Bicycle),
      vehicleTypeColor(), // Default
    ];
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
 * Function defining the metadata fields available for editing.
 * The library will provide a default function if none is provided.
 * @param _feature Geometry object whose metadata will be edited
 */
function metadataSchemaGenerator(_feature?: EditableFeature): MetadataSchema {
  return [
    ['yup.object'],
    ['yup.required'],
    [
      'yup.shape',
      {
        vehicleType: [
          ['yup.mixed'],
          ['yup.label', 'Type of vehicle'],
          ['yup.required'],
          ['yup.oneOf', Object.values(VehicleType)],
        ],
        color: [['yup.string'], ['yup.required', 'A color is required']], // An enumeration may be better, as the user could input arbitrary strings
        age: [
          ['yup.number'],
          ['yup.label', 'Age (years)'],
          ['yup.required', 'How old is it?'],
          ['yup.positive', 'Age must be greater than zero'],
        ],
        description: [
          ['yup.string'],
          ['yup.label', 'Description (optional)'],
          ['yup.optional'],
        ],
        needsRepair: [
          ['yup.boolean'],
          ['yup.label', 'Needs repair?'],
          ['yup.required'],
        ],
      },
    ],
  ];
}

/**
 * For development purposes, validate the metadata schema
 */
const validationResult = validateMetadata(metadataSchemaGenerator(), {
  vehicleType: 'BICYCLE',
  color: 'red',
  age: 'five',
  extraProperties: {
    wheelDiameter: 26,
  },
});
if (validationResult.schemaErrors) {
  console.warn(
    'Example metadata schema errors: ',
    validationResult.schemaErrors
  );
}
if (validationResult.dataErrors) {
  console.warn(
    'Example metadata data validation errors: ',
    validationResult.dataErrors
  );
}

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
        metadataSchemaGenerator={metadataSchemaGenerator}
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
