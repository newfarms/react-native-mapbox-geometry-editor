/**
 * Geometry rendering style type definitions
 * @packageDocumentation
 */
import type {
  CircleLayerStyle,
  SymbolLayerStyle,
} from '@react-native-mapbox-gl/maps';

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
   * @return Mapbox style JSON for a [[RenderFeature]] of geometry type `'Point'`
   */
  (): CircleLayerStyle;
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
   * Style generator for non-draggable point features
   * These features will be of type [[RenderFeature]]
   * and will have a geometry of type `'Point'`
   */
  readonly point: CircleLayerStyleGenerator;
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
