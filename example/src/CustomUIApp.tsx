/**
 * React Native Mapbox geometry editor custom UI example
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
  CoordinateRole,
  validateMetadata,
  GeometryEditor,
} from 'react-native-mapbox-geometry-editor';
import type {
  CameraControls,
  DraggablePointStyle,
  EditableFeature,
  GeometryIORef,
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
    overflow: 'hidden',
  },
  ioControlsContainer: {
    flexWrap: 'wrap',
    flexDirection: 'row',
  },
  button: {
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
 * A component that renders buttons for controlling the Geometry Editor externally
 * geometry
 * @param props Render properties
 */
function IOControls({
  drawPolygon,
  drawPolyline,
  drawPoint,
  edit,
  confirm,
  cancel,
  deleteShapeOrPoint,
  undo,
  redo,
  canUndo,
  canRedo,
  cannotUndoAndRedo,
  canDelete,
  hasCompleteNewFeature,
}: {
  drawPolygon: () => void;
  drawPolyline: () => void;
  drawPoint: () => void;
  edit: () => void;
  confirm: () => void;
  cancel: () => void;
  deleteShapeOrPoint: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  cannotUndoAndRedo: boolean;
  canDelete: boolean;
  hasCompleteNewFeature: boolean;
}) {
  let buttonColor = 'orange';
  let undoColor = 'orange';
  let redoColor = 'orange';
  let deleteColor = 'orange';
  let confirmColor = 'orange';
  if (!canUndo) {
    undoColor = 'grey';
  }
  if (!canRedo) {
    redoColor = 'grey';
  }
  if (cannotUndoAndRedo || !hasCompleteNewFeature) {
    confirmColor = 'grey';
  }
  if (!canDelete) {
    deleteColor = 'grey';
  }

  return (
    <View style={styles.ioControlsContainer}>
      <Pressable
        style={[styles.button, { backgroundColor: buttonColor }]}
        onPress={drawPolygon}
      >
        <Text style={styles.text}>Draw Polygon</Text>
      </Pressable>
      <Pressable
        style={[styles.button, { backgroundColor: buttonColor }]}
        onPress={drawPolyline}
        disabled={false}
      >
        <Text style={styles.text}>Draw Polyline</Text>
      </Pressable>
      <Pressable
        style={[styles.button, { backgroundColor: buttonColor }]}
        onPress={drawPoint}
        disabled={false}
      >
        <Text style={styles.text}>Draw Point</Text>
      </Pressable>
      <Pressable
        style={[styles.button, { backgroundColor: confirmColor }]}
        onPress={confirm}
        disabled={!hasCompleteNewFeature || cannotUndoAndRedo}
      >
        <Text style={styles.text}>Confirm</Text>
      </Pressable>
      <Pressable
        style={[styles.button, { backgroundColor: buttonColor }]}
        onPress={cancel}
      >
        <Text style={styles.text}>Cancel</Text>
      </Pressable>
      <Pressable
        style={[styles.button, { backgroundColor: undoColor }]}
        onPress={undo}
        disabled={!canUndo}
      >
        <Text style={styles.text}>Undo</Text>
      </Pressable>
      <Pressable
        style={[styles.button, { backgroundColor: redoColor }]}
        onPress={redo}
        disabled={!canRedo}
      >
        <Text style={styles.text}>Redo</Text>
      </Pressable>
      <Pressable
        style={[styles.button, { backgroundColor: deleteColor }]}
        onPress={deleteShapeOrPoint}
        disabled={!canDelete}
      >
        <Text style={styles.text}>Delete</Text>
      </Pressable>
      <Pressable
        style={[styles.button, { backgroundColor: buttonColor }]}
        onPress={edit}
      >
        <Text style={styles.text}>Edit</Text>
      </Pressable>
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
   * States that contain important information for the Geometry Editor buttons
   */
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [cannotUndoAndRedo, setCannotUndoAndRedo] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [hasCompleteNewFeature, setHasCompleteNewFeature] = useState(false);

  /**
   * Geometry import and export functionality
   */
  const ioRef = useRef<GeometryIORef>(null);
  const ioHandlers = {
    /**
     * Place the Geometry Editor in draw polygon mode
     */
    drawPolygon: () => ioRef.current?.drawPolygon(),
    /**
     * Place the Geometry Editor in draw polyline mode
     */
    drawPolyline: () => ioRef.current?.drawPolyline(),
    /**
     * Place the Geometry Editor in draw point mode
     */
    drawPoint: () => ioRef.current?.drawPoint(),
    /**
     * Confirm the latest action in the Geometry Editor
     */
    confirm: () => ioRef.current?.confirm(),
    /**
     * Cancel the latest action in the Geometry Editor
     */
    cancel: () => ioRef.current?.cancel(),
    /**
     * Undo the latest action in the Geometry Editor
     */
    undo: () => ioRef.current?.undo(),
    /**
     * Redo the latest action in the Geometry Editor
     */
    redo: () => ioRef.current?.redo(),
    /**
     * Delete the selected shape or point in the Geometry Editor
     */
    deleteShapeOrPoint: () => ioRef.current?.deleteShapeOrPoint(),
    /**
     * Place the Geometry Editor in select mode
     */
    selectSingleShape: () => ioRef.current?.selectSingleShape(),
    /**
     * Place the Geometry Editor in edit mode
     */
    edit: () => ioRef.current?.edit(),
    /**
     * Select the top shape in the Geometry Editor without having to tap on it
     */
    selectTopShape: () => ioRef.current?.selectTopShape(),
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

  return (
    <SafeAreaView style={styles.container}>
      <IOControls
        canUndo={canUndo}
        canRedo={canRedo}
        cannotUndoAndRedo={cannotUndoAndRedo}
        canDelete={canDelete}
        hasCompleteNewFeature={hasCompleteNewFeature}
        {...ioHandlers}
      />
      <GeometryEditor
        cameraControls={cameraControls}
        mapProps={{
          style: styles.map,
          styleURL: 'mapbox://styles/mapbox/dark-v10',
        }}
        styleGenerators={styleGeneratorMap}
        ref={ioRef}
        isCustomUI={true}
        setCanRedo={setCanRedo}
        setCanUndo={setCanUndo}
        setCanDelete={setCanDelete}
        setCannotUndoAndRedo={setCannotUndoAndRedo}
        setHasCompleteNewFeature={setHasCompleteNewFeature}
      >
        <MapboxGL.Camera
          ref={cameraRef}
          centerCoordinate={[3.380271, 6.464217]}
          zoomLevel={14}
        />
      </GeometryEditor>
    </SafeAreaView>
  );
}
