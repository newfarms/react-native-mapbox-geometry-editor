/**
 * Geometry editor map canvas
 * @packageDocumentation
 */
import { observer } from 'mobx-react-lite';
import React, { useCallback, useContext } from 'react';
import { StyleSheet } from 'react-native';
import MapboxGL, { MapViewProps } from '@react-native-mapbox-gl/maps';

import { ActivePoints } from './geometry/ActivePoints';
import { StoreContext } from '../state/StoreContext';
import { useEventHandlers } from '../hooks/useEventHandlers';
import type { Event } from '../type/events';
import type { StyleGeneratorMap } from '../type/style';
import { defaultStyleGeneratorMap } from '../util/defaultStyleGenerators';
import { StyleContext } from './StyleContext';

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
  const { mapProps = {}, styleGenerators = defaultStyleGeneratorMap } = props;
  const { style: mapStyle, onPress: outerOnPress, ...restMapProps } = mapProps;

  const { store } = useContext(StoreContext);
  /**
   * A touch callback for the map that will add a new active point
   */
  const addPoint = useCallback(
    (feature: Event) => {
      return store.handleMapPress(feature);
    },
    [store]
  );
  const onPress = useEventHandlers([addPoint, outerOnPress]);

  /**
   * Render both internal and client-provided map layers on the map
   */
  return (
    <MapboxGL.MapView
      style={[styles.map, mapStyle]}
      onPress={onPress}
      {...restMapProps}
    >
      <StyleContext.Provider value={{ styleGenerators }}>
        <ActivePoints />
        {props.children}
      </StyleContext.Provider>
    </MapboxGL.MapView>
  );
}

/**
 * Renderable MobX wrapper for [[_GeometryEditor]]
 */
export const GeometryEditor = observer(_GeometryEditor);
