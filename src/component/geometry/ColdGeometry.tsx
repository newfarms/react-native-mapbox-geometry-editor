import { action, toJS } from 'mobx';
import { observer } from 'mobx-react-lite';
import React, { useContext, useMemo } from 'react';
import MapboxGL from '@react-native-mapbox-gl/maps';
import cloneDeep from 'lodash/cloneDeep';
import type { OnPressEvent } from '@react-native-mapbox-gl/maps';
import type { Expression } from '@react-native-mapbox-gl/maps';
import type {
  FillLayerStyle,
  LineLayerStyle,
} from '@react-native-mapbox-gl/maps';

import { StoreContext } from '../../state/StoreContext';
import { StyleContext } from '../StyleContext';
import { orderShapesByGeometry } from '../../util/geometry';
import type { RenderNonPointFeatureCollection } from '../../type/geometry';

/**
 * The GeoJSON property giving the height index for rendering
 */
export const COLD_GEOMETRY_NONPOINT_ZINDEX_PROPERTY = 'rnmgeZIndex';

/**
 * The ID of the bottommost points layer is referred to by other layers.
 */
export const COLD_POINTS_CLUSTERS_COUNT_LAYER_ID = 'cold_points_clusters_count';

/**
 * The number of pairs of polygon and polyline geometry layers
 */
const COLD_NON_POINT_LAYER_PAIR_COUNT = 10;

/**
 * Renders `COLD_NON_POINT_LAYER_PAIR_COUNT` pairs of `FillLayer` and `LineLayer`
 * layers to accommodate shapes with different rendering height indices.
 *
 * In a past prototype, layers were dynamically created based on the number
 * of layers actually needed to display overlapping geometry.
 * Unfortunately, there seemed to be bugs in the Mapbox library that prevented
 * layers from displaying or updating. Therefore, layers are now static.
 * See also https://github.com/react-native-mapbox-gl/maps/issues/248
 *
 * @param props Render properties
 */
function NonPointLayers({
  shapes,
  onPress,
  fillLayerStyle,
  lineLayerStyle,
}: {
  /**
   * The shapes to be rendered
   */
  shapes: RenderNonPointFeatureCollection;
  /**
   * A touch handler for touch events in any of the layers
   */
  onPress: (e: OnPressEvent) => void;
  /**
   * Style for `FillLayer` layers (polygons)
   */
  fillLayerStyle: FillLayerStyle;
  /**
   * Style for `LineLayer` layers (polylines)
   */
  lineLayerStyle: LineLayerStyle;
}) {
  /**
   * Copy to avoid attempting to mutate a prop
   */
  const shapesCopy = cloneDeep(shapes);
  /**
   * Add height indices to non-point geometry so that overlapping geometry
   * is rendered in a desired order.
   */
  const groupedFeatures = orderShapesByGeometry(shapesCopy.features);
  if (groupedFeatures.length > COLD_NON_POINT_LAYER_PAIR_COUNT) {
    console.warn(
      `There are ${COLD_NON_POINT_LAYER_PAIR_COUNT} layers for overlapping polygons and polylines, but the actual geometry requires ${groupedFeatures.length}. Some overlapping shapes will be grouped into the same layers.`
    );
  }
  groupedFeatures.forEach((list, index, arr) => {
    list.forEach((feature) => {
      const indexFromEnd = arr.length - index - 1;
      let height = COLD_NON_POINT_LAYER_PAIR_COUNT - indexFromEnd - 1;
      if (height < 0) {
        /**
         * Merge extra layers into the first layer
         */
        height = 0;
      }
      feature.properties[COLD_GEOMETRY_NONPOINT_ZINDEX_PROPERTY] = height;
    });
  });

  /**
   * Return pairs of polygon and polyline layers,
   * where each pair is rendered on top of the previous pair.
   * Each layer filters geometry to geometry having its associated height index.
   */
  return (
    <MapboxGL.ShapeSource
      id="cold_geometry_noncircles"
      shape={shapesCopy}
      cluster={false}
      onPress={onPress}
    >
      <MapboxGL.FillLayer
        id="cold_polygons0"
        filter={[
          'all',
          ['==', ['geometry-type'], 'Polygon'],
          ['==', ['get', COLD_GEOMETRY_NONPOINT_ZINDEX_PROPERTY], 0],
        ]}
        style={fillLayerStyle}
      />
      <MapboxGL.LineLayer
        id="cold_linestrings0"
        aboveLayerID="cold_polygons0"
        filter={[
          'all',
          ['==', ['geometry-type'], 'LineString'],
          ['==', ['get', COLD_GEOMETRY_NONPOINT_ZINDEX_PROPERTY], 0],
        ]}
        style={lineLayerStyle}
      />
      <MapboxGL.FillLayer
        id="cold_polygons1"
        aboveLayerID="cold_linestrings0"
        filter={[
          'all',
          ['==', ['geometry-type'], 'Polygon'],
          ['==', ['get', COLD_GEOMETRY_NONPOINT_ZINDEX_PROPERTY], 1],
        ]}
        style={fillLayerStyle}
      />
      <MapboxGL.LineLayer
        id="cold_linestrings1"
        aboveLayerID="cold_polygons1"
        filter={[
          'all',
          ['==', ['geometry-type'], 'LineString'],
          ['==', ['get', COLD_GEOMETRY_NONPOINT_ZINDEX_PROPERTY], 1],
        ]}
        style={lineLayerStyle}
      />
      <MapboxGL.FillLayer
        id="cold_polygons2"
        aboveLayerID="cold_linestrings1"
        filter={[
          'all',
          ['==', ['geometry-type'], 'Polygon'],
          ['==', ['get', COLD_GEOMETRY_NONPOINT_ZINDEX_PROPERTY], 2],
        ]}
        style={fillLayerStyle}
      />
      <MapboxGL.LineLayer
        id="cold_linestrings2"
        aboveLayerID="cold_polygons2"
        filter={[
          'all',
          ['==', ['geometry-type'], 'LineString'],
          ['==', ['get', COLD_GEOMETRY_NONPOINT_ZINDEX_PROPERTY], 2],
        ]}
        style={lineLayerStyle}
      />
      <MapboxGL.FillLayer
        id="cold_polygons3"
        aboveLayerID="cold_linestrings2"
        filter={[
          'all',
          ['==', ['geometry-type'], 'Polygon'],
          ['==', ['get', COLD_GEOMETRY_NONPOINT_ZINDEX_PROPERTY], 3],
        ]}
        style={fillLayerStyle}
      />
      <MapboxGL.LineLayer
        id="cold_linestrings3"
        aboveLayerID="cold_polygons3"
        filter={[
          'all',
          ['==', ['geometry-type'], 'LineString'],
          ['==', ['get', COLD_GEOMETRY_NONPOINT_ZINDEX_PROPERTY], 3],
        ]}
        style={lineLayerStyle}
      />
      <MapboxGL.FillLayer
        id="cold_polygons4"
        aboveLayerID="cold_linestrings3"
        filter={[
          'all',
          ['==', ['geometry-type'], 'Polygon'],
          ['==', ['get', COLD_GEOMETRY_NONPOINT_ZINDEX_PROPERTY], 4],
        ]}
        style={fillLayerStyle}
      />
      <MapboxGL.LineLayer
        id="cold_linestrings4"
        aboveLayerID="cold_polygons4"
        filter={[
          'all',
          ['==', ['geometry-type'], 'LineString'],
          ['==', ['get', COLD_GEOMETRY_NONPOINT_ZINDEX_PROPERTY], 4],
        ]}
        style={lineLayerStyle}
      />
      <MapboxGL.FillLayer
        id="cold_polygons5"
        aboveLayerID="cold_linestrings4"
        filter={[
          'all',
          ['==', ['geometry-type'], 'Polygon'],
          ['==', ['get', COLD_GEOMETRY_NONPOINT_ZINDEX_PROPERTY], 5],
        ]}
        style={fillLayerStyle}
      />
      <MapboxGL.LineLayer
        id="cold_linestrings5"
        aboveLayerID="cold_polygons5"
        filter={[
          'all',
          ['==', ['geometry-type'], 'LineString'],
          ['==', ['get', COLD_GEOMETRY_NONPOINT_ZINDEX_PROPERTY], 5],
        ]}
        style={lineLayerStyle}
      />
      <MapboxGL.FillLayer
        id="cold_polygons6"
        aboveLayerID="cold_linestrings5"
        filter={[
          'all',
          ['==', ['geometry-type'], 'Polygon'],
          ['==', ['get', COLD_GEOMETRY_NONPOINT_ZINDEX_PROPERTY], 6],
        ]}
        style={fillLayerStyle}
      />
      <MapboxGL.LineLayer
        id="cold_linestrings6"
        aboveLayerID="cold_polygons6"
        filter={[
          'all',
          ['==', ['geometry-type'], 'LineString'],
          ['==', ['get', COLD_GEOMETRY_NONPOINT_ZINDEX_PROPERTY], 6],
        ]}
        style={lineLayerStyle}
      />
      <MapboxGL.FillLayer
        id="cold_polygons7"
        aboveLayerID="cold_linestrings6"
        filter={[
          'all',
          ['==', ['geometry-type'], 'Polygon'],
          ['==', ['get', COLD_GEOMETRY_NONPOINT_ZINDEX_PROPERTY], 7],
        ]}
        style={fillLayerStyle}
      />
      <MapboxGL.LineLayer
        id="cold_linestrings7"
        aboveLayerID="cold_polygons7"
        filter={[
          'all',
          ['==', ['geometry-type'], 'LineString'],
          ['==', ['get', COLD_GEOMETRY_NONPOINT_ZINDEX_PROPERTY], 7],
        ]}
        style={lineLayerStyle}
      />
      <MapboxGL.FillLayer
        id="cold_polygons8"
        aboveLayerID="cold_linestrings7"
        filter={[
          'all',
          ['==', ['geometry-type'], 'Polygon'],
          ['==', ['get', COLD_GEOMETRY_NONPOINT_ZINDEX_PROPERTY], 8],
        ]}
        style={fillLayerStyle}
      />
      <MapboxGL.LineLayer
        id="cold_linestrings8"
        aboveLayerID="cold_polygons8"
        filter={[
          'all',
          ['==', ['geometry-type'], 'LineString'],
          ['==', ['get', COLD_GEOMETRY_NONPOINT_ZINDEX_PROPERTY], 8],
        ]}
        style={lineLayerStyle}
      />
      <MapboxGL.FillLayer
        id="cold_polygons9"
        aboveLayerID="cold_linestrings8"
        filter={[
          'all',
          ['==', ['geometry-type'], 'Polygon'],
          ['==', ['get', COLD_GEOMETRY_NONPOINT_ZINDEX_PROPERTY], 9],
        ]}
        style={fillLayerStyle}
      />
      <MapboxGL.LineLayer
        id="cold_linestrings9"
        aboveLayerID="cold_polygons9"
        filter={[
          'all',
          ['==', ['geometry-type'], 'LineString'],
          ['==', ['get', COLD_GEOMETRY_NONPOINT_ZINDEX_PROPERTY], 9],
        ]}
        style={lineLayerStyle}
      />
      <MapboxGL.FillLayer
        id="cold_polygons10"
        aboveLayerID="cold_linestrings9"
        filter={[
          'all',
          ['==', ['geometry-type'], 'Polygon'],
          ['==', ['get', COLD_GEOMETRY_NONPOINT_ZINDEX_PROPERTY], 10],
        ]}
        style={fillLayerStyle}
      />
      <MapboxGL.LineLayer
        id="cold_linestrings_end"
        aboveLayerID="cold_polygons10"
        filter={[
          'all',
          ['==', ['geometry-type'], 'LineString'],
          ['==', ['get', COLD_GEOMETRY_NONPOINT_ZINDEX_PROPERTY], 10],
        ]}
        style={lineLayerStyle}
      />
    </MapboxGL.ShapeSource>
  );
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
      <NonPointLayers
        shapes={nonPointFeaturesJS}
        onPress={onPress}
        fillLayerStyle={styleGenerators.polygon()}
        lineLayerStyle={styleGenerators.polyline()}
      />
      <MapboxGL.ShapeSource
        id="cold_geometry_circles"
        shape={pointFeaturesJS}
        cluster={true}
        onPress={onPress}
      >
        <MapboxGL.CircleLayer
          id="cold_points"
          aboveLayerID="cold_linestrings_end"
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
          filter={clusterFilter}
          style={styleGenerators.cluster()}
        />
        <MapboxGL.SymbolLayer
          id={COLD_POINTS_CLUSTERS_COUNT_LAYER_ID}
          aboveLayerID="cold_points_clusters"
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
