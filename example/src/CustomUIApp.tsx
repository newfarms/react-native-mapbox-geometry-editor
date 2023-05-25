/**
 * React Native Mapbox geometry editor custom UI example
 */

import { useMemo, useRef, useState } from 'react';
import {
  LogBox,
  SafeAreaView,
  StyleSheet,
  View,
  Pressable,
  Text,
} from 'react-native';

import MapboxGL from '@rnmapbox/maps';

import token from '../mapbox_token.json';

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
import { GeometryEditor } from 'react-native-mapbox-geometry-editor';
import type {
  CameraControls,
  GeometryIORef,
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
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-between' },
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
  confirm,
  cancel,
  undo,
  redo,
  canUndo,
  canRedo,
  hasCompleteNewFeature,
  setCustomUI,
}: {
  drawPolygon: () => void;
  drawPolyline: () => void;
  drawPoint: () => void;
  confirm: () => void;
  cancel: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  hasCompleteNewFeature: boolean;
  setCustomUI: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  let buttonColor = 'orange';
  let undoColor = 'orange';
  let redoColor = 'orange';
  let confirmColor = 'orange';
  if (!canUndo) {
    undoColor = 'grey';
  }
  if (!canRedo) {
    redoColor = 'grey';
  }
  if (!hasCompleteNewFeature) {
    confirmColor = 'grey';
  }

  const [toggleDrawButtons, setToggleDrawButtons] = useState(true);

  /**
   * Displays buttons for selecting a draw mode or controlling the shape currently being drawn
   */
  const drawingButtons = () => {
    if (toggleDrawButtons) {
      return (
        <View style={styles.ioControlsContainer}>
          <Pressable
            style={[styles.button, { backgroundColor: buttonColor }]}
            onPress={() => {
              drawPolygon();
              setToggleDrawButtons(false);
            }}
          >
            <Text style={styles.text}>Draw Polygon</Text>
          </Pressable>
          <Pressable
            style={[styles.button, { backgroundColor: buttonColor }]}
            onPress={() => {
              drawPolyline();
              setToggleDrawButtons(false);
            }}
            disabled={false}
          >
            <Text style={styles.text}>Draw Polyline</Text>
          </Pressable>
          <Pressable
            style={[styles.button, { backgroundColor: buttonColor }]}
            onPress={() => {
              drawPoint();
            }}
            disabled={false}
          >
            <Text style={styles.text}>Draw Point</Text>
          </Pressable>
        </View>
      );
    } else {
      return (
        <View style={styles.ioControlsContainer}>
          <View>
            <Pressable
              style={[styles.button, { backgroundColor: confirmColor }]}
              onPress={() => {
                confirm();
                setToggleDrawButtons(true);
              }}
              disabled={!hasCompleteNewFeature}
            >
              <Text style={styles.text}>Confirm</Text>
            </Pressable>
            <Pressable
              style={[styles.button, { backgroundColor: buttonColor }]}
              onPress={() => {
                cancel();
                setToggleDrawButtons(true);
              }}
            >
              <Text style={styles.text}>Cancel</Text>
            </Pressable>
          </View>
          <View>
            <Pressable
              style={[styles.button, { backgroundColor: redoColor }]}
              onPress={redo}
              disabled={!canRedo}
            >
              <Text style={styles.text}>Redo</Text>
            </Pressable>
            <Pressable
              style={[styles.button, { backgroundColor: undoColor }]}
              onPress={undo}
              disabled={!canUndo}
            >
              <Text style={styles.text}>Undo</Text>
            </Pressable>
          </View>
        </View>
      );
    }
  };

  return (
    <View style={styles.buttonContainer}>
      <View>
        <Pressable
          style={[styles.button, { backgroundColor: buttonColor }]}
          onPress={() => setCustomUI((prevValue) => !prevValue)}
        >
          <Text style={styles.text}>Toggle UI</Text>
        </Pressable>
      </View>
      {drawingButtons()}
    </View>
  );
}

/**
 * Render a map page with a demonstration of the geometry editor library custom UI functionality
 */
export function CustomUIApp({
  setCustomUI,
}: {
  /**
   * Set whether or not to display a custom UI or the default UI
   */
  setCustomUI: React.Dispatch<React.SetStateAction<boolean>>;
}) {
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
  };

  return (
    <SafeAreaView style={styles.container}>
      <IOControls
        canUndo={canUndo}
        canRedo={canRedo}
        hasCompleteNewFeature={hasCompleteNewFeature}
        setCustomUI={setCustomUI}
        {...ioHandlers}
      />
      <GeometryEditor
        cameraControls={cameraControls}
        mapProps={{
          style: styles.map,
          styleURL: 'mapbox://styles/mapbox/dark-v10',
        }}
        ref={ioRef}
        isCustomUI={true}
        setCanRedo={setCanRedo}
        setCanUndo={setCanUndo}
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
