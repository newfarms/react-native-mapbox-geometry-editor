import { action, toJS } from 'mobx';
import { observer } from 'mobx-react-lite';
import React, { useContext, useMemo } from 'react';
import MapboxGL from '@react-native-mapbox-gl/maps';
import type { OnPressEvent } from '@react-native-mapbox-gl/maps';
import type { Expression } from '@react-native-mapbox-gl/maps';
import range from 'lodash/range';
import flatten from 'lodash/flatten';
import type {
  FillLayerStyle,
  LineLayerStyle,
} from '@react-native-mapbox-gl/maps';

import { StoreContext } from '../../state/StoreContext';
import { StyleContext } from '../StyleContext';
import { orderShapesByGeometry } from '../../util/geometry';
import { HOT_POLYGONS_LAYER_ID } from './HotGeometry';

/**
 * The GeoJSON property giving the height index for rendering
 */
export const COLD_GEOMETRY_NONPOINT_ZINDEX_PROPERTY = 'rnmgeZIndex';

/**
 * The ID of the topmost polyline layer is fixed, as it is referred to by
 * point geometry layers above.
 */
const LAST_LINE_LAYER_ID = 'cold_linestrings';

/**
 * The ID of the bottommost points layer is referred to by other layers.
 */
export const COLD_POINTS_CLUSTERS_COUNT_LAYER_ID = 'cold_points_clusters_count';

/**
 * Renders the desired number of `FillLayer` and `LineLayer` layers
 * to accommodate shapes with different rendering height indices.
 *
 * @param props Render properties
 * @return Array of `FillLayer` and `LineLayer` React components
 */
function makeNonPointLayers({
  count,
  fillLayerStyle,
  lineLayerStyle,
}: {
  /**
   * The number of different rendering height indices.
   * Indices are assumed to be consecutive integers starting from zero.
   */
  count: number;
  /**
   * Style for `FillLayer` layers (polygons)
   */
  fillLayerStyle: FillLayerStyle;
  /**
   * Style for `LineLayer` layers (polylines)
   */
  lineLayerStyle: LineLayerStyle;
}) {
  if (count === 0) {
    /**
     * If there are no shapes to render, render a placeholder layer
     * to serve as an anchor for point geometry layers to reference
     * as their `belowLayerID`.
     */
    return [
      <MapboxGL.LineLayer id={LAST_LINE_LAYER_ID} key={LAST_LINE_LAYER_ID} />,
    ];
  } else {
    /**
     * Return pairs of polygon and polyline layers,
     * where each pair is rendered on top of the previous pair.
     * Each layer filters geometry to geometry having its associated height index.
     */
    return flatten(
      range(count).map((val, _index, arr) => {
        // Construct unique layer IDs based on the height index
        const fillLayerId = `cold_polygons${val}`;
        let lineLayerId = `cold_linestrings${val}`;
        let lineLayerBelowId = `cold_polygons${val + 1}`;
        if (val === arr.length - 1) {
          // Note: Same ID as in the case where there are no shapes to render
          lineLayerId = LAST_LINE_LAYER_ID;
          lineLayerBelowId = 'cold_points';
        }
        let fillLayerAboveId: string | undefined = `cold_linestrings${val - 1}`;
        if (val === 0) {
          // There are no layers below to reference
          fillLayerAboveId = undefined;
        }

        return [
          <MapboxGL.FillLayer
            key={fillLayerId}
            id={fillLayerId}
            aboveLayerID={fillLayerAboveId}
            belowLayerID={lineLayerId}
            filter={[
              'all',
              ['==', ['geometry-type'], 'Polygon'],
              ['==', ['get', COLD_GEOMETRY_NONPOINT_ZINDEX_PROPERTY], val],
            ]}
            style={fillLayerStyle}
          />,
          <MapboxGL.LineLayer
            key={lineLayerId}
            id={lineLayerId}
            aboveLayerID={fillLayerId}
            belowLayerID={lineLayerBelowId}
            filter={[
              'all',
              ['==', ['geometry-type'], 'LineString'],
              ['==', ['get', COLD_GEOMETRY_NONPOINT_ZINDEX_PROPERTY], val],
            ]}
            style={lineLayerStyle}
          />,
        ];
      })
    );
  }
}

/**
 * Renders "cold" geometry on a Mapbox map.
 * Cold geometry is not actively being edited, and point features within it
 * are subject to clustering.
 * @return Renderable React node
 */
function _ColdGeometry() {
  const { controls, features } = useContext(StoreContext);
  /**
   * Only point geometry can be clustered, so separate point geometry
   * from non-point geometry.
   * See also https://github.com/mapbox/mapbox-gl-native/issues/16555
   */
  const pointFeaturesJS = toJS(features.coldPointFeatures);
  const nonPointFeaturesJS = toJS(features.coldNonPointFeatures);

  /**
   * Add height indices to non-point geometry so that overlapping geometry
   * is rendered in a desired order.
   */
  const groupedFeatures = orderShapesByGeometry(nonPointFeaturesJS.features);
  groupedFeatures.forEach((list, index) => {
    list.forEach((feature) => {
      feature.properties[COLD_GEOMETRY_NONPOINT_ZINDEX_PROPERTY] = index;
    });
  });

  const { styleGenerators } = useContext(StyleContext);
  // Geometry filter to prevent cluster layers from operating on other kinds of geometry
  const clusterFilter: Expression = [
    'all',
    ['==', ['geometry-type'], 'Point'],
    ['has', 'point_count'],
  ];

  // Delegate touch events to the controller
  const onPress = useMemo(
    () =>
      action('cold_geometry_press', (e: OnPressEvent) => {
        controls.onPressColdGeometry(e);
      }),
    [controls]
  );

  /**
   * Map layers:
   * - Geometry layers
   * - Clusters layer
   * - Symbol layer associated with the clusters layer to render cluster metadata, for example
   */
  return (
    <>
      <MapboxGL.ShapeSource
        id="cold_geometry_noncircles"
        shape={nonPointFeaturesJS}
        cluster={false}
        onPress={onPress}
      >
        {makeNonPointLayers({
          count: groupedFeatures.length,
          fillLayerStyle: styleGenerators.polygon(),
          lineLayerStyle: styleGenerators.polyline(),
        })}
      </MapboxGL.ShapeSource>
      <MapboxGL.ShapeSource
        id="cold_geometry_circles"
        shape={pointFeaturesJS}
        cluster={true}
        onPress={onPress}
      >
        <MapboxGL.CircleLayer
          id="cold_points"
          aboveLayerID={LAST_LINE_LAYER_ID}
          belowLayerID="cold_points_clusters"
          filter={[
            'all',
            ['==', ['geometry-type'], 'Point'],
            ['!', ['has', 'point_count']],
          ]}
          style={styleGenerators.point()}
        />
        <MapboxGL.CircleLayer
          id="cold_points_clusters"
          aboveLayerID="cold_points"
          belowLayerID={COLD_POINTS_CLUSTERS_COUNT_LAYER_ID}
          filter={clusterFilter}
          style={styleGenerators.cluster()}
        />
        <MapboxGL.SymbolLayer
          id={COLD_POINTS_CLUSTERS_COUNT_LAYER_ID}
          aboveLayerID="cold_points_clusters"
          belowLayerID={HOT_POLYGONS_LAYER_ID}
          style={styleGenerators.clusterSymbol()}
          filter={clusterFilter}
        />
      </MapboxGL.ShapeSource>
    </>
  );
}

/**
 * Renderable MobX wrapper for [[_ColdGeometry]]
 */
export const ColdGeometry = observer(_ColdGeometry);
