/**
 * Geometry editor map canvas
 * @packageDocumentation
 */
import { observer } from 'mobx-react-lite';
import React, { useCallback, useContext } from 'react';
import { StyleSheet } from 'react-native';
import MapboxGL, { MapViewProps } from '@react-native-mapbox-gl/maps';

import { DraggablePoints } from './geometry/DraggablePoints';
import { ColdGeometry } from './geometry/ColdGeometry';
import { HotGeometry } from './geometry/HotGeometry';
import { MetadataPreview } from './geometry/MetadataPreview';
import { StoreContext } from '../state/StoreContext';
import { useEventHandlers } from '../hooks/useEventHandlers';
import type { Event } from '../type/events';
import type { StyleGeneratorMap } from '../type/style';
import { defaultStyleGeneratorMap } from '../util/defaultStyleGenerators';
import { StyleContext } from './StyleContext';
import { CameraController } from './CameraController';
import type { CameraControls } from './CameraController';

/**
 * Render properties for [[GeometryEditor]]
 */
export interface GeometryEditorProps {
  /**
   * Additional properties for the [map](https://github.com/react-native-mapbox-gl/maps/blob/master/docs/MapView.md), including `style`.
   */
  readonly mapProps?: MapViewProps;
  /**
   * Custom styling functions for geometry rendered
   * on the map
   */
  readonly styleGenerators?: StyleGeneratorMap;
  /**
   * Functions for giving hints to the Mapbox `Camera`
   */
  readonly cameraControls?: CameraControls;
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
 * @param props Render properties
 * @return Renderable React node
 */
export function _GeometryEditor(props: GeometryEditorProps) {
  const {
    cameraControls,
    mapProps = {},
    styleGenerators = defaultStyleGeneratorMap,
  } = props;
  const { style: mapStyle, onPress: outerOnPress, ...restMapProps } = mapProps;

  const { store } = useContext(StoreContext);
  /**
   * A touch callback for the map that will add a new point
   */
  const addPoint = useCallback(
    (feature: Event) => {
      return store.handleMapPress(feature);
    },
    [store]
  );
  const onPress = useEventHandlers([addPoint, outerOnPress]);

  /**
   * Do not render the component that provides camera hints if the application
   * has not provided anything to listen to the hints.
   */
  let cameraController = null;
  if (cameraControls) {
    cameraController = <CameraController {...cameraControls} />;
  }

  /**
   * Render both internal and client-provided map layers on the map
   */
  return (
    <>
      {cameraController}
      <MapboxGL.MapView
        style={[styles.map, mapStyle]}
        onPress={onPress}
        {...restMapProps}
      >
        <StyleContext.Provider value={{ styleGenerators }}>
          <ColdGeometry />
          <HotGeometry />
          <DraggablePoints />
          <MetadataPreview />
          {props.children}
        </StyleContext.Provider>
      </MapboxGL.MapView>
    </>
  );
}

/**
 * Renderable MobX wrapper for [[_GeometryEditor]]
 */
export const GeometryEditor = observer(_GeometryEditor);
