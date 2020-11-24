import type {
  CircleLayerStyle,
  SymbolLayerStyle,
} from '@react-native-mapbox-gl/maps';

import { CoordinateRole } from '../type/geometry';
import type { EditableFeature } from '../type/geometry';
import type { DraggablePointStyle, StyleGeneratorMap } from '../type/style';

/**
 * The default diameter of point annotations, measured in density-independent pixels
 */
const ANNOTATION_SIZE = 20;

/**
 * The default style generation function for draggable points
 * @param role The role of the point in the underlying geometry feature
 * @param feature The feature corresponding to the point
 * @return The style attributes for the input style type and feature combination
 */
function getDefaultDraggablePointStyle(
  role: CoordinateRole,
  _feature: EditableFeature
): DraggablePointStyle {
  switch (role) {
    case CoordinateRole.PointFeature:
      return {
        radius: ANNOTATION_SIZE,
        color: 'chartreuse',
      };
    case CoordinateRole.LineStart:
      return {
        radius: ANNOTATION_SIZE,
        color: 'aqua',
      };
    case CoordinateRole.LineSecond:
      return {
        radius: ANNOTATION_SIZE,
        color: 'aquamarine',
      };
    case CoordinateRole.LineInner:
      return {
        radius: ANNOTATION_SIZE,
        color: 'blue',
      };
    case CoordinateRole.LineSecondLast:
      return {
        radius: ANNOTATION_SIZE,
        color: 'cornflowerblue',
      };
    case CoordinateRole.LineLast:
      return {
        radius: ANNOTATION_SIZE,
        color: 'cyan',
      };
    case CoordinateRole.PolygonStart:
      return {
        radius: ANNOTATION_SIZE,
        color: 'crimson',
      };
    case CoordinateRole.PolygonInner:
      return {
        radius: ANNOTATION_SIZE,
        color: 'darkred',
      };
    case CoordinateRole.PolygonSecondLast:
      return {
        radius: ANNOTATION_SIZE,
        color: 'deeppink',
      };
    case CoordinateRole.PolygonHole:
      return {
        radius: ANNOTATION_SIZE,
        color: 'lightcoral',
      };
  }
}

/**
 * The default style generation function for non-draggable point features
 * @return Mapbox style JSON for a [[RenderFeature]] of geometry type `'Point'`
 */
function getDefaultPointStyle(): CircleLayerStyle {
  return {
    circleRadius: (ANNOTATION_SIZE * 2) / 3,
    circleColor: 'gold',
    circlePitchAlignment: 'map',
  };
}

/**
 * The default style generation function for clusters of point features
 * @return Mapbox style JSON for a cluster feature
 */
function getDefaultClusterStyle(): CircleLayerStyle {
  return {
    circleRadius: ANNOTATION_SIZE * 2,
    circleColor: 'silver',
    circlePitchAlignment: 'map',
  };
}

/**
 * The default style generation function for clusters of point features'
 * symbol layers.
 *
 * Returns a style expression that will render the number of points
 * in the cluster as text.
 *
 * @return Mapbox style JSON for a Mapbox cluster layer's child symbol layer
 */
function getDefaultClusterSymbolStyle(): SymbolLayerStyle {
  return {
    textField: '{point_count}',
    textSize: 12,
    textPitchAlignment: 'map',
  };
}

/**
 * The default set of functions used to provide styles for all
 * types of objects rendered on the map
 */
export const defaultStyleGeneratorMap: StyleGeneratorMap = {
  draggablePoint: getDefaultDraggablePointStyle,
  point: getDefaultPointStyle,
  cluster: getDefaultClusterStyle,
  clusterSymbol: getDefaultClusterSymbolStyle,
};
