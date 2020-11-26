import { toJS } from 'mobx';
import { observer } from 'mobx-react-lite';
import React, { useContext } from 'react';
import MapboxGL from '@react-native-mapbox-gl/maps';
import type { Expression } from '@react-native-mapbox-gl/maps';

import { StoreContext } from '../../state/StoreContext';
import { StyleContext } from '../StyleContext';

/**
 * Renders "cold" geometry on a Mapbox map.
 * Cold geometry is not actively being edited, and point features within it
 * are subject to clustering.
 * @return Renderable React node
 */
function _ColdGeometry() {
  const { features } = useContext(StoreContext).store;
  const featuresJS = toJS(features.coldFeatures);

  const { styleGenerators } = useContext(StyleContext);
  // Geometry filter to prevent cluster layers from operating on other kinds of geometry
  const clusterFilter: Expression = [
    'all',
    ['==', ['geometry-type'], 'Point'],
    ['has', 'point_count'],
  ];

  /**
   * Map layers:
   * - Geometry layers
   * - Clusters layer
   * - Symbol layer associated with the clusters layer to render cluster metadata, for example
   */
  return (
    <MapboxGL.ShapeSource id="cold_geometry" shape={featuresJS} cluster={true}>
      <MapboxGL.CircleLayer
        id="cold_points"
        filter={[
          'all',
          ['==', ['geometry-type'], 'Point'],
          ['!', ['has', 'point_count']],
        ]}
        style={styleGenerators.point()}
      />
      <MapboxGL.CircleLayer
        id="cold_points_clusters"
        belowLayerID="cold_points_clusters_count"
        filter={clusterFilter}
        style={styleGenerators.cluster()}
      />
      <MapboxGL.SymbolLayer
        id="cold_points_clusters_count"
        style={styleGenerators.clusterSymbol()}
        filter={clusterFilter}
      />
    </MapboxGL.ShapeSource>
  );
}

/**
 * Renderable MobX wrapper for [[_ColdGeometry]]
 */
export const ColdGeometry = observer(_ColdGeometry);
