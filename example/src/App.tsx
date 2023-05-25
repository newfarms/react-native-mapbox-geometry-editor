/**
 * React Native Mapbox geometry editor library example
 */

import { useMemo, useRef, useState } from 'react';
import {
  Alert,
  LogBox,
  SafeAreaView,
  StyleSheet,
  View,
  Pressable,
  Text,
} from 'react-native';
import { DarkTheme } from 'react-native-paper';

import MapboxGL from '@rnmapbox/maps';

import token from '../mapbox_token.json';
import sampleFeatures from './sample.json';
import type { FeatureCollection } from 'geojson';

/**
 * A way to get the `performance.now()` interface, for timing code,
 * in both debug and release mode
 * See https://github.com/MaxGraey/react-native-console-time-polyfill/blob/master/index.js
 */
const getTimeMilliseconds =
  ((global as any).performance && (global as any).performance.now) ||
  (global as any).performanceNow ||
  (global as any).nativePerformanceNow;
if (!getTimeMilliseconds) {
  throw new Error('Failed to find performance.now() or an equivalent.');
}

/**
 * Hide known issue in the library (refer to the README)
 */
LogBox.ignoreLogs([
  "[mobx] Derivation 'observer_StoreProvider' is created/updated without reading any observable value.",
  "[mobx] Derivation 'observerobserved' is created/updated without reading any observable value.",
]);

/**
 * Polyfill for React Native needed by 'react-native-mapbox-geometry-editor'
 * See https://github.com/uuidjs/uuid#getrandomvalues-not-supported
 */
import 'react-native-get-random-values';
import {
  defaultStyleGeneratorMap,
  FeatureLifecycleStage,
  featureLifecycleStageColor,
  GeometryEditorUI,
  CoordinateRole,
  validateMetadata,
  MetadataSchemaGeneratorMap,
} from 'react-native-mapbox-geometry-editor';
import type {
  CameraControls,
  DraggablePointStyle,
  EditableFeature,
  GeometryIORef,
  InteractionEventProps,
  MetadataSchema,
  SemanticGeometryType,
  StyleGeneratorMap,
} from 'react-native-mapbox-geometry-editor';
import { CustomUIApp } from './CustomUIApp';

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
  ioControlsContainer: {
    position: 'relative',
    alignSelf: 'flex-end',
  },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  toggleContainer: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  toggleButton: {
    marginTop: 10,
    marginBottom: 5,
    marginLeft: 10,
    padding: 3,
    borderRadius: 10,
  },
  importButton: {
    marginTop: 10,
    marginBottom: 5,
    marginRight: 10,
    padding: 3,
    borderRadius: 10,
  },
  exportButton: {
    marginBottom: 5,
    marginRight: 10,
    padding: 3,
    borderRadius: 10,
  },
  text: {
    textAlign: 'center',
  },
});

/* Set the Mapbox API access token
 * Changes to the token might only take effect after closing and reopening the app.
 * (see https://github.com/rnmapbox/maps/issues/933)
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
 * Enumeration for data-driven styling of polygons
 */
enum ZoneType {
  Parking = 'PARKING',
  Restricted = 'RESTRICTED',
}

/**
 * Default colours for {@link ZoneType} types
 * @param stage The zone type
 * @return A specific or a default colour, depending on whether `type` is defined
 */
function zoneTypeColor(type?: ZoneType): string {
  switch (type) {
    case ZoneType.Parking:
      return '#696969'; // Dim grey
    case ZoneType.Restricted:
      return '#ff69b4'; // Hot pink
    default:
      return '#ffffff'; // White
  }
}

/**
 * Limits for custom line widths
 */
const LINE_WIDTH_LIMITS = {
  min: 1,
  max: 12,
};

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
    if (feature.geometry.type === 'Point') {
      style.color = vehicleTypeColor(feature.properties?.vehicleType);
    }
    return style;
  },
  /**
   * Style for selected vertices of shapes being edited
   */
  selectedVertex: defaultStyleGeneratorMap.selectedVertex,
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
   * Style for vertices of non-point geometry
   */
  vertex: defaultStyleGeneratorMap.vertex,
  /**
   * Style for polylines describing the edges of non-polyline geometry
   */
  edge: defaultStyleGeneratorMap.edge,
  /**
   * Style for polygon geometry
   */
  polygon: () => {
    let style = defaultStyleGeneratorMap.polygon();
    /**
     * Data-driven styling by geometry lifecycle stage and zone type
     */
    style.fillColor = [
      'match',
      ['get', 'rnmgeStage'],
      FeatureLifecycleStage.NewShape,
      featureLifecycleStageColor(FeatureLifecycleStage.NewShape),
      FeatureLifecycleStage.EditShape,
      featureLifecycleStageColor(FeatureLifecycleStage.EditShape),
      FeatureLifecycleStage.EditMetadata,
      featureLifecycleStageColor(FeatureLifecycleStage.EditMetadata),
      FeatureLifecycleStage.SelectMultiple,
      featureLifecycleStageColor(FeatureLifecycleStage.SelectMultiple),
      FeatureLifecycleStage.SelectSingle,
      featureLifecycleStageColor(FeatureLifecycleStage.SelectSingle),
      FeatureLifecycleStage.View,
      [
        'match',
        ['get', 'zoneType'],
        ZoneType.Parking,
        zoneTypeColor(ZoneType.Parking),
        ZoneType.Restricted,
        zoneTypeColor(ZoneType.Restricted),
        zoneTypeColor(), // Default
      ],
      zoneTypeColor(), // Default
    ];
    return style;
  },
  /**
   * Style for polyline geometry
   */
  polyline: () => {
    let style = defaultStyleGeneratorMap.polyline();
    /**
     * Data-driven styling: Set the width of the line to the value given
     * by its custom 'width' property, clipped to the range 1-12.
     */
    style.lineWidth = [
      'interpolate',
      ['linear'],
      ['get', 'width'],
      LINE_WIDTH_LIMITS.min,
      LINE_WIDTH_LIMITS.min,
      LINE_WIDTH_LIMITS.max,
      LINE_WIDTH_LIMITS.max,
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
 * Custom metadata fields for point geometry
 */
const POINT_SCHEMA = [
  ['yup.object'],
  ['yup.required'],
  [
    'yup.meta',
    {
      titleFieldKey: 'model',
      title: 'No model',
      showIfEmpty: false,
    },
  ],
  [
    'yup.shape',
    {
      vehicleType: [
        ['yup.mixed'],
        ['yup.label', 'Type of vehicle'],
        ['yup.required'],
        ['yup.oneOf', Object.values(VehicleType)],
        [
          'yup.meta',
          {
            inPreview: true,
          },
        ],
      ],
      model: [['yup.string'], ['yup.required', 'A model is required']], // An enumeration may be better, as the user could input arbitrary strings
      age: [
        ['yup.number'],
        ['yup.label', 'Age (years)'],
        ['yup.required', 'How old is it?'],
        ['yup.positive', 'Age must be greater than zero'],
      ],
      description: [
        ['yup.string'],
        ['yup.label', 'Description'],
        ['yup.optional'],
        [
          'yup.meta',
          {
            inPreview: true,
          },
        ],
      ],
      needsRepair: [
        ['yup.boolean'],
        ['yup.label', 'Needs repair?'],
        ['yup.required'],
      ],
      fieldWithPermissions: [
        ['yup.string'],
        ['yup.label', 'Immutable comment'],
        ['yup.optional'],
        [
          'yup.meta',
          {
            permissions: {
              edit: false,
            },
            showIfEmpty: true,
          },
        ],
      ],
    },
  ],
];

/**
 * Function defining the metadata fields available for editing.
 * The library would provide a default function if none is provided.
 * @param type Type of geometry object whose metadata will be edited
 */
function metadataSchemaGenerator(
  type: SemanticGeometryType
): MetadataSchema | null {
  if (type === 'Point') {
    return POINT_SCHEMA;
  } else if (type === 'Polygon') {
    return [
      ['yup.object'],
      ['yup.required'],
      [
        'yup.meta',
        {
          titleFieldKey: 'zoneType',
          title: 'Unknown region',
        },
      ],
      [
        'yup.shape',
        {
          zoneType: [
            ['yup.mixed'],
            ['yup.label', 'Type of region'],
            ['yup.required'],
            ['yup.oneOf', Object.values(ZoneType)],
            [
              'yup.meta',
              {
                inPreview: true,
              },
            ],
          ],
          openAtNight: [
            ['yup.boolean'],
            ['yup.label', 'Overnight use permitted?'],
            ['yup.required'],
          ],
        },
      ],
    ];
  } else if (type === 'LineString') {
    return [
      ['yup.object'],
      ['yup.required'],
      [
        'yup.meta',
        {
          titleFieldKey: 'name',
          title: 'Unnamed polyline',
        },
      ],
      [
        'yup.shape',
        {
          name: [['yup.string'], ['yup.label', 'Name'], ['yup.optional']],
          width: [
            ['yup.number'],
            ['yup.label', 'Width (pixels)'],
            ['yup.required', 'Line width is required'],
            [
              'yup.min',
              LINE_WIDTH_LIMITS.min,
              'Width must be at least ${min}.',
            ],
            ['yup.max', LINE_WIDTH_LIMITS.max, 'Width must be at most ${max}.'],
          ],
        },
      ],
    ];
  } else {
    return null;
  }
}

/**
 * In this simple example, the same metadata schema generation
 * function is used for both new and existing geometry.
 */
const metadataSchemaGeneratorMap: MetadataSchemaGeneratorMap = {
  newGeometry: metadataSchemaGenerator,
  existingGeometry: metadataSchemaGenerator,
};

/**
 * For development purposes, validate the metadata schema
 */
const validationResult = validateMetadata(POINT_SCHEMA, {
  vehicleType: 'BICYCLE',
  model: 'classic',
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
 * The time interval over which camera transitions will occur.
 */
const cameraMoveTime = 200; // Milliseconds

/**
 * A component that renders buttons for the user to import and export
 * geometry
 * @param props Render properties
 */
function IOControls({
  onImport,
  onExport,
  disabled,
  setCustomUI,
}: {
  /**
   * Import button press event handler
   */
  onImport: () => void;
  /**
   * Export button press event handler
   */
  onExport: () => void;
  /**
   * Whether or not the buttons should be disabled
   */
  disabled: boolean;
  /**
   * Set whether or not to display a custom UI or the default UI
   */
  setCustomUI: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  let buttonColor = 'orange';
  let toggleButtonColor = 'orange';
  if (disabled) {
    buttonColor = 'grey';
  }
  return (
    <View style={styles.buttonContainer}>
      <View style={styles.toggleContainer}>
        <Pressable
          style={[styles.toggleButton, { backgroundColor: toggleButtonColor }]}
          onPress={() => setCustomUI((prevValue) => !prevValue)}
        >
          <Text style={styles.text}>Toggle UI</Text>
        </Pressable>
      </View>
      <View style={styles.ioControlsContainer}>
        <Pressable
          style={[styles.importButton, { backgroundColor: buttonColor }]}
          onPress={onImport}
          disabled={disabled}
        >
          <Text style={styles.text}>Import static shapes</Text>
        </Pressable>
        <Pressable
          style={[styles.exportButton, { backgroundColor: buttonColor }]}
          onPress={onExport}
          disabled={disabled}
        >
          <Text style={styles.text}>Export shapes</Text>
        </Pressable>
      </View>
    </View>
  );
}

/**
 * Render a map page with a demonstration of the geometry editor library's functionality
 */
export default function App() {
  /**
   * Receive hints from the geometry editor, about where the camera should be looking,
   * that are triggered by certain user actions.
   */
  const cameraRef = useRef<MapboxGL.Camera>(null);
  const cameraControls: CameraControls = useMemo(() => {
    return {
      fitBounds: (northEastCoordinates, southWestCoordinates, padding) => {
        cameraRef.current?.fitBounds(
          northEastCoordinates,
          southWestCoordinates,
          padding,
          cameraMoveTime
        );
      },
      moveTo: (coordinates) => {
        cameraRef.current?.moveTo(coordinates, cameraMoveTime);
      },
    };
  }, [cameraRef]);

  /**
   * Geometry import and export functionality
   */
  const ioRef = useRef<GeometryIORef>(null);
  const ioHandlers = {
    onImport: () => {
      (async () => {
        if (ioRef.current) {
          /**
           * Time the import operation and display the time in an alert
           */
          const t0 = getTimeMilliseconds();
          try {
            const result = await ioRef.current.import(
              sampleFeatures as FeatureCollection,
              {
                replace: true,
                strict: false,
                validate: true,
              }
            );

            const t1 = getTimeMilliseconds();
            Alert.alert(
              'Import result',
              `Data imported ${result.exact ? 'exactly' : 'with changes'} in ${
                t1 - t0
              } milliseconds with ${result?.errors.length} errors.`
            );
          } catch (e) {
            console.error(e);
            let message = 'Unknown error';
            if (e instanceof Error) {
              message = e.message;
            }
            Alert.alert('Import failed', message);
          }
        }
      })();
    },
    onExport: () => {
      (async () => {
        if (ioRef.current) {
          /**
           * Time the export operation and display the time in an alert
           */
          const t0 = getTimeMilliseconds();
          try {
            const result = await ioRef.current.export();
            const jsonResult = JSON.stringify(result, null, 1);
            /**
             * Avoid flooding the console with the result
             */
            if (jsonResult.length < 10000) {
              console.log('Export result: \n', jsonResult);
            } else {
              console.log(
                `Stringified export result (with whitespace) has ${jsonResult.length} characters (not shown).`
              );
            }

            const t1 = getTimeMilliseconds();
            Alert.alert(
              'Export result',
              `Data exported in ${t1 - t0} milliseconds.`
            );
          } catch (e) {
            console.error(e);
            let message = 'Unknown error';
            if (e instanceof Error) {
              message = e.message;
            }
            Alert.alert('Export failed', message);
          }
        }
      })();
    },
  };

  /**
   * Enable or disable the import and export buttons as a function of the current
   * geometry editing operation
   */
  const [disableIO, setDisableIO] = useState(false);
  const [customUI, setCustomUI] = useState(false);
  const interactionHandlers: InteractionEventProps = useMemo(() => {
    return {
      onEditingStatus: setDisableIO,
    };
  }, [setDisableIO]);

  if (customUI) {
    return <CustomUIApp setCustomUI={setCustomUI} />;
  } else {
    return (
      <SafeAreaView style={styles.container}>
        <IOControls
          disabled={disableIO}
          setCustomUI={setCustomUI}
          {...ioHandlers}
        />
        <GeometryEditorUI
          cameraControls={cameraControls}
          style={styles.libraryContainer}
          theme={DarkTheme}
          mapProps={{
            style: styles.map,
            styleURL: 'mapbox://styles/mapbox/dark-v10',
          }}
          metadataSchemaGeneratorMap={metadataSchemaGeneratorMap}
          styleGenerators={styleGeneratorMap}
          interactionEventProps={interactionHandlers}
          ref={ioRef}
        >
          <MapboxGL.Camera
            ref={cameraRef}
            centerCoordinate={[3.380271, 6.464217]}
            zoomLevel={14}
          />
        </GeometryEditorUI>
      </SafeAreaView>
    );
  }
}
