import { action, toJS } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useContext, useMemo } from 'react';
import MapboxGL from '@rnmapbox/maps';
import { OnPressEvent } from '@rnmapbox/maps/lib/typescript/types/OnPressEvent';

import { StoreContext } from '../../state/StoreContext';
import { StyleContext } from '../StyleContext';
import { CoordinateRole, LineStringRole } from '../../type/geometry';
import { COLD_POINTS_CLUSTERS_COUNT_LAYER_ID } from './ColdGeometry';

/**
 * Renders "hot" geometry on a Mapbox map.
 * Hot geometry is actively being edited, and is not subject to clustering
 * @return Renderable React node
 */
function _HotGeometry() {
  const { controls, features } = useContext(StoreContext);
  const featuresJS = toJS(features.hotFeatures);

  const { styleGenerators } = useContext(StyleContext);

  // Delegate touch events to the controller
  const onPress = useMemo(
    () =>
      action('hot_geometry_press', (e: OnPressEvent) => {
        controls.onPressHotGeometry(e);
      }),
    [controls]
  );

  /**
   * Render separate layers for each type of geometry
   */
  return (
    <MapboxGL.ShapeSource
      id="hot_geometry"
      shape={featuresJS}
      onPress={onPress}
    >
      <MapboxGL.FillLayer
        id="hot_polygons"
        aboveLayerID={COLD_POINTS_CLUSTERS_COUNT_LAYER_ID}
        filter={['==', ['geometry-type'], 'Polygon']}
        style={styleGenerators.polygon()}
      />
      <MapboxGL.LineLayer
        id="hot_linestrings"
        aboveLayerID="hot_polygons"
        filter={[
          'all',
          ['==', ['geometry-type'], 'LineString'],
          ['==', ['get', 'rnmgeRole'], LineStringRole.LineStringFeature],
        ]}
        style={styleGenerators.polyline()}
      />
      <MapboxGL.LineLayer
        id="hot_edges"
        aboveLayerID="hot_linestrings"
        filter={[
          'all',
          ['==', ['geometry-type'], 'LineString'],
          ['!=', ['get', 'rnmgeRole'], LineStringRole.LineStringFeature],
        ]}
        style={styleGenerators.edge()}
      />
      <MapboxGL.CircleLayer
        id="hot_vertices"
        aboveLayerID="hot_edges"
        filter={[
          'all',
          ['==', ['geometry-type'], 'Point'],
          ['!=', ['get', 'rnmgeRole'], CoordinateRole.PointFeature],
        ]}
        style={styleGenerators.vertex()}
      />
      <MapboxGL.CircleLayer
        id="hot_points"
        aboveLayerID="hot_vertices"
        filter={[
          'all',
          ['==', ['geometry-type'], 'Point'],
          ['==', ['get', 'rnmgeRole'], CoordinateRole.PointFeature],
        ]}
        style={styleGenerators.point()}
      />
    </MapboxGL.ShapeSource>
  );
}

/**
 * Renderable MobX wrapper for {@link _HotGeometry}
 */
export const HotGeometry = observer(_HotGeometry);
