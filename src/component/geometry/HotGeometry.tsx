import { toJS } from 'mobx';
import { observer } from 'mobx-react-lite';
import React, { useContext } from 'react';
import MapboxGL from '@react-native-mapbox-gl/maps';

import { StoreContext } from '../../state/StoreContext';
import { StyleContext } from '../StyleContext';
import { CoordinateRole, LineStringRole } from '../../type/geometry';

/**
 * Renders "hot" geometry on a Mapbox map.
 * Hot geometry is actively being edited, and is not subject to clustering
 * @return Renderable React node
 */
function _HotGeometry() {
  const { features } = useContext(StoreContext);
  const featuresJS = toJS(features.hotFeatures);

  const { styleGenerators } = useContext(StyleContext);

  /**
   * Render separate layers for each type of geometry
   */
  return (
    <MapboxGL.ShapeSource id="hot_geometry" shape={featuresJS}>
      <MapboxGL.CircleLayer
        id="hot_points"
        filter={[
          'all',
          ['==', ['geometry-type'], 'Point'],
          ['==', ['get', 'rnmgeRole'], CoordinateRole.PointFeature],
        ]}
        style={styleGenerators.point()}
      />
      <MapboxGL.FillLayer
        id="hot_polygons"
        filter={['==', ['geometry-type'], 'Polygon']}
        style={styleGenerators.polygon()}
      />
      <MapboxGL.LineLayer
        id="hot_edges"
        filter={[
          'all',
          ['==', ['geometry-type'], 'LineString'],
          ['!=', ['get', 'rnmgeRole'], LineStringRole.LineStringFeature],
        ]}
        style={styleGenerators.edge()}
      />
      <MapboxGL.CircleLayer
        id="hot_vertices"
        filter={[
          'all',
          ['==', ['geometry-type'], 'Point'],
          ['!=', ['get', 'rnmgeRole'], CoordinateRole.PointFeature],
        ]}
        style={styleGenerators.vertex()}
      />
    </MapboxGL.ShapeSource>
  );
}

/**
 * Renderable MobX wrapper for [[_HotGeometry]]
 */
export const HotGeometry = observer(_HotGeometry);
