/**
 * Geometry rendering style type definitions
 * @packageDocumentation
 */
import type {
  CircleLayerStyle,
  FillLayerStyle,
  LineLayerStyle,
  SymbolLayerStyle,
} from '@rnmapbox/maps';

import type { EditableFeature, CoordinateRole } from './geometry';

/**
 * Style attributes for draggable points
 */
export interface DraggablePointStyle {
  /**
   * Point circle marker radius (measured in pixels).
   * Does not include the marker's outline.
   */
  radius: number;
  /**
   * Marker fill colour
   */
  color: string;
  /**
   * Marker fill opacity
   */
  opacity?: number;
  /**
   * Marker outline width (measured in pixels)
   */
  strokeWidth?: number;
  /**
   * Marker outline colour
   */
  strokeColor?: string;
}

/**
 * A function that will be called to output style properties for draggable points
 */
export interface DraggablePointStyleGenerator {
  /**
   * @param role The role of the point in the underlying geometry feature
   * @param feature The feature corresponding to the point
   * @return The style attributes for the input style type and feature combination
   */
  (role: CoordinateRole, feature: EditableFeature): DraggablePointStyle;
}

/**
 * A function that will be called to output style properties for point-like features
 */
export interface CircleLayerStyleGenerator {
  /**
   * Refer to Mapbox's documentation of data-driven styling expressions
   * for more information on data-driven styling:
   * https://docs.mapbox.com/mapbox-gl-js/style-spec/expressions/
   * @return Mapbox style JSON for a {@link RenderFeature} of geometry type `'Point'`
   */
  (): CircleLayerStyle;
}

/**
 * A function that will be called to output style properties for line string features
 */
export interface LineLayerStyleGenerator {
  /**
   * Refer to Mapbox's documentation of data-driven styling expressions
   * for more information on data-driven styling:
   * https://docs.mapbox.com/mapbox-gl-js/style-spec/expressions/
   *
   * Note: Data-driven dash pattern styling is not yet supported by Mapbox
   * (https://docs.mapbox.com/mapbox-gl-js/style-spec/layers/#paint-line-line-dasharray)
   *
   * @return Mapbox style JSON for a {@link RenderFeature} of geometry type `'LineString'`
   */
  (): LineLayerStyle;
}

/**
 * A function that will be called to output style properties for polygon features
 */
export interface PolygonLayerStyleGenerator {
  /**
   * Refer to Mapbox's documentation of data-driven styling expressions
   * for more information on data-driven styling:
   * https://docs.mapbox.com/mapbox-gl-js/style-spec/expressions/
   * @return Mapbox style JSON for a {@link RenderFeature} of geometry type `'Polygon'`
   */
  (): FillLayerStyle;
}

/**
 * A function that will be called to output style properties for `MapboxGL.SymbolLayer`
 * layers rendered as child layers of `MapboxGL.CircleLayer` layers representing clusters.
 *
 * For instance, the symbol layers can be used to render cluster counts.`
 */
export interface ClusterSymbolLayerStyleGenerator {
  /**
   * Refer to Mapbox's documentation of data-driven styling expressions
   * for more information on data-driven styling:
   * https://docs.mapbox.com/mapbox-gl-js/style-spec/expressions/
   * @return Mapbox style JSON for a Mapbox cluster layer's child symbol layer
   */
  (): SymbolLayerStyle;
}

/**
 * The set of functions needed to provide styles for all
 * types of objects rendered on the map
 */
export interface StyleGeneratorMap {
  /**
   * Style generator for draggable points
   */
  readonly draggablePoint: DraggablePointStyleGenerator;
  /**
   * Style generator for user-selected editable vertices within shapes
   */
  readonly selectedVertex: DraggablePointStyleGenerator;
  /**
   * Style generator for non-draggable point features.
   * Features will be of type {@link RenderFeature} and will have a geometry
   * of type `'Point'`
   */
  readonly point: CircleLayerStyleGenerator;
  /**
   * Style generator for point features that mark vertices of non-point features
   * in the process of being created or edited.
   * Features will be of type {@link RenderFeature} and will have a geometry
   * of type `'Point'`
   */
  readonly vertex: CircleLayerStyleGenerator;
  /**
   * Style generator for LineString features that mark edges of polygon features
   * in the process of being created or edited.
   * Features will be of type {@link RenderFeature} and will have a geometry
   * of type `'LineString'`
   */
  readonly edge: LineLayerStyleGenerator;
  /**
   * Style generator for polygon features.
   * Features will be of type {@link RenderFeature} and will have a geometry
   * of type `'Polygon'`
   */
  readonly polygon: PolygonLayerStyleGenerator;
  /**
   * Style generator for polyline features.
   * Features will be of type {@link RenderFeature} and will have a geometry
   * of type `'LineString'`
   */
  readonly polyline: LineLayerStyleGenerator;
  /**
   * Style generator for clustered point features
   */
  readonly cluster: CircleLayerStyleGenerator;
  /**
   * Style generator for clustered point features' symbol layers
   * (Used to render cluster point counts, for example)
   */
  readonly clusterSymbol: ClusterSymbolLayerStyleGenerator;
}
