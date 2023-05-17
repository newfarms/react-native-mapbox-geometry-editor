/**
 * Geometry editor map canvas
 * @packageDocumentation
 */
import { Observer } from 'mobx-react-lite';
import { action, autorun } from 'mobx';
import { forwardRef, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode, Ref } from 'react';
import { StyleSheet } from 'react-native';
import MapboxGL, { MapViewProps } from '@rnmapbox/maps';

import { DraggablePoints } from './geometry/DraggablePoints';
import { ColdGeometry } from './geometry/ColdGeometry';
import { HotGeometry } from './geometry/HotGeometry';
import { GeometryIO } from './geometry/GeometryIO';
import { StoreContext } from '../state/StoreContext';
import { useEventHandlers } from '../hooks/useEventHandlers';
import type { Event } from '../type/events';
import type { StyleGeneratorMap } from '../type/style';
import { defaultStyleGeneratorMap } from '../util/defaultStyleGenerators';
import { StyleContext } from './StyleContext';
import { CameraController } from './event/CameraController';
import type { CameraControls } from './event/CameraController';
import type { ShapeComparator } from './geometry/ColdGeometry';
import type { GeometryIORef } from './geometry/GeometryIO';

/**
 * Render properties for {@link GeometryEditor}
 */
export interface GeometryEditorProps {
  /**
   * Additional properties for the [map](https://github.com/rnmapbox/maps/blob/master/docs/MapView.md), including `style`.
   */
  readonly mapProps?: MapViewProps;
  /**
   * Custom styling functions for geometry rendered
   * on the map
   */
  readonly styleGenerators?: StyleGeneratorMap;
  /**
   * A comparator to use for sorting shapes into layers
   * (e.g. to make intersecting shapes occlude each other in a desired order)
   *
   * If not provided, a default comparator will be used that only examines
   * the geometrical characteristics of GeoJSON features.
   *
   * Note that point geometry and geometry currently being edited will always
   * be rendered on top of other features, regardless of the value of this
   * prop.
   */
  readonly shapeComparator?: ShapeComparator;
  /**
   * The ID of the map layer above which all layers will be rendered.
   * While this is a `prop`, it is possible that Mapbox will not respect changes
   * to its value during subsequent re-renders, so it may be better to set it to a constant.
   * See https://github.com/rnmapbox/maps/issues/248
   */
  aboveLayerID?: string;
  /**
   * Functions for giving hints to the Mapbox `Camera`
   */
  readonly cameraControls?: CameraControls;
  /**
   * Additional child elements to render as children of the map
   */
  readonly children?: ReactNode;
  /**
   * Whether or not the Geometry Editor is using a custom UI, if left blank it will assume false
   */
  isCustomUI?: boolean;
  setCanRedo?: React.Dispatch<React.SetStateAction<boolean>>;
  setCanUndo?: React.Dispatch<React.SetStateAction<boolean>>;
  setCannotUndoAndRedo?: React.Dispatch<React.SetStateAction<boolean>>;
  setHasCompleteNewFeature?: React.Dispatch<React.SetStateAction<boolean>>;
  setCanDelete?: React.Dispatch<React.SetStateAction<boolean>>;
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
 * @param ref React ref to which library methods are attached
 * @return Renderable React node
 */
function GeometryEditorComponent(
  props: GeometryEditorProps,
  ref: Ref<GeometryIORef>
) {
  const {
    cameraControls,
    shapeComparator,
    aboveLayerID,
    mapProps = {},
    styleGenerators = defaultStyleGeneratorMap,
    isCustomUI,
    setCanRedo,
    setCanUndo,
    setCannotUndoAndRedo,
    setHasCompleteNewFeature,
    setCanDelete,
  } = props;
  const { style: mapStyle, onPress: outerOnPress, ...restMapProps } = mapProps;

  const store = useContext(StoreContext);

  const [localCanRedo, setLocalCanRedo] = useState(false);
  const [localCanUndo, setLocalCanUndo] = useState(false);
  const [localCannotUndoAndRedo, setLocalCannotUndoAndRedo] = useState(true);
  const [localHasCompleteNewFeature, setLocalHasCompleteNewFeature] =
    useState(false);
  const [localCanDelete, setLocalCanDelete] = useState(false);
  let currentCustomUI = null;
  const dispose = autorun(() => {
    currentCustomUI = store.controls.isCustomUI;
    if (store.features.canRedo !== localCanRedo) {
      setLocalCanRedo(store.features.canRedo);
      dispose();
    }
    if (store.features.canUndo !== localCanUndo) {
      setLocalCanUndo(store.features.canUndo);
      dispose();
    }
    if (store.features.cannotUndoAndRedo !== localCannotUndoAndRedo) {
      setLocalCannotUndoAndRedo(store.features.cannotUndoAndRedo);
      dispose();
    }
    if (store.features.hasCompleteNewFeature !== localHasCompleteNewFeature) {
      setLocalHasCompleteNewFeature(store.features.hasCompleteNewFeature);
      dispose();
    }
    if (store.controls.canDelete !== localCanDelete) {
      setLocalCanDelete(!!store.controls.canDelete);
      dispose();
    }
  });

  /**
   * Automatically call the function to update the values for the important information to know when a button should be active
   * whenever the value for that information changes
   */
  useEffect(() => {
    if (setCanRedo) {
      setCanRedo(localCanRedo);
    }
  }, [localCanRedo, setCanRedo]);
  useEffect(() => {
    if (setCanUndo) {
      setCanUndo(localCanUndo);
    }
  }, [localCanUndo, setCanUndo]);
  useEffect(() => {
    if (setCannotUndoAndRedo) {
      setCannotUndoAndRedo(localCannotUndoAndRedo);
    }
  }, [localCannotUndoAndRedo, setCannotUndoAndRedo]);
  useEffect(() => {
    if (setHasCompleteNewFeature) {
      setHasCompleteNewFeature(localHasCompleteNewFeature);
    }
  }, [localHasCompleteNewFeature, setHasCompleteNewFeature]);
  useEffect(() => {
    if (setCanDelete) {
      setCanDelete(localCanDelete);
    }
  }, [localCanDelete, setCanDelete]);

  /**
   * Set the property in controls based on the isCustomUI prop
   */
  const setCustomUIProperty = action('set_custom_ui', () => {
    return store.setCustomUI(isCustomUI);
  });
  if (currentCustomUI !== isCustomUI) {
    setCustomUIProperty();
  }

  /**
   * A touch callback for the map that will add a new point
   */
  const addPoint = useMemo(
    () =>
      action('geometry_editor_map_press', (feature: Event) => {
        return store.handleMapPress(feature);
      }),
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
      <GeometryIO ref={ref} />
      <MapboxGL.MapView
        style={[styles.map, mapStyle]}
        onPress={onPress}
        {...restMapProps}
      >
        <StyleContext.Provider value={{ styleGenerators }}>
          {props.children}
          <ColdGeometry
            shapeComparator={shapeComparator}
            aboveLayerID={aboveLayerID}
          />
          <HotGeometry />
          <DraggablePoints />
        </StyleContext.Provider>
      </MapboxGL.MapView>
    </>
  );
}

/**
 * React ref forwarding version of `GeometryEditorComponent`, for use
 * by code internal to the library.
 */
export const _GeometryEditor = forwardRef(GeometryEditorComponent);

/**
 * MobX observer version of `GeometryEditorComponent`, suitable for
 * use with React's `forwardRef`.
 *
 * @param props Render properties
 * @param ref React ref to which library methods are attached
 * @return Renderable React node
 */
function _GeometryEditorObserver(
  props: GeometryEditorProps,
  ref: Ref<GeometryIORef>
) {
  return <Observer>{() => GeometryEditorComponent(props, ref)}</Observer>;
}

/**
 * Renderable MobX wrapper for `GeometryEditorComponent`, with React ref forwarding,
 * for use by code external to the library.
 *
 * Note: Ordinarily, we would apply the MobX `observer()` higher-order component, followed by `forwardRef`
 * (https://mobx.js.org/react-integration.html#tips), but React will warn
 * about trying to forward a ref to a memoized function
 * (https://github.com/facebook/react/commit/c898020e015f4ee6f793a652668d6d78b0d43e76)
 */
export const GeometryEditor = forwardRef(_GeometryEditorObserver);
