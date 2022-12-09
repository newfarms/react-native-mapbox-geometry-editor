import type {
  CircleLayerStyle,
  FillLayerStyle,
  LineLayerStyle,
  SymbolLayerStyle,
} from '@rnmapbox/maps';

import {
  CoordinateRole,
  FeatureLifecycleStage,
  LineStringRole,
} from '../type/geometry';
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
  feature: EditableFeature
): DraggablePointStyle {
  if (feature.geometry.type === 'Point') {
    return {
      radius: ANNOTATION_SIZE * 2,
      color: 'red',
      strokeWidth: 3,
      strokeColor: coordinateRoleColor(role),
    };
  } else {
    return {
      radius: ANNOTATION_SIZE,
      color: coordinateRoleColor(role),
      strokeWidth: 0,
    };
  }
}

/**
 * The default style generation function for selected vertices
 * @param role The role of the vertex in the underlying geometry feature
 * @param feature The feature corresponding to the vertex
 * @return The style attributes for the input style type and feature combination
 */
function getSelectedVertexPointStyle(
  _role: CoordinateRole,
  _feature: EditableFeature
): DraggablePointStyle {
  return {
    radius: (ANNOTATION_SIZE * 3) / 2,
    color: featureLifecycleStageColor(FeatureLifecycleStage.SelectSingle),
    strokeWidth: 0,
  };
}

/**
 * Default colours for geometry lifecycle stages
 * @param stage The lifecycle stage
 */
export function featureLifecycleStageColor(
  stage?: FeatureLifecycleStage
): string {
  if (!stage) {
    return MISSING_COLOR;
  }
  switch (stage) {
    case FeatureLifecycleStage.NewShape:
      return '#ffff00'; // Yellow
    case FeatureLifecycleStage.EditShape:
      return '#ff00ff'; // Magenta
    case FeatureLifecycleStage.EditMetadata:
      return '#0000ff'; // Blue
    case FeatureLifecycleStage.SelectMultiple:
      return '#00ffff'; // Cyan
    case FeatureLifecycleStage.SelectSingle:
      return '#00ff00'; // Green
    case FeatureLifecycleStage.View:
      return '#ffffff'; // White
  }
}

/**
 * Stroke widths corresponding to different geometry lifecycle stages
 * @param stage The lifecycle stage
 * @return A specific or a default number in pixels, depending on whether `stage` is defined
 */
function featureLifecycleStrokeWidth(stage?: FeatureLifecycleStage): number {
  switch (stage) {
    case FeatureLifecycleStage.NewShape:
      return 2;
    case FeatureLifecycleStage.EditShape:
      return 3;
    case FeatureLifecycleStage.EditMetadata:
      return 2;
    case FeatureLifecycleStage.SelectMultiple:
      return 3;
    case FeatureLifecycleStage.SelectSingle:
      return 3;
    case FeatureLifecycleStage.View:
      return 1;
    default:
      return MISSING_WIDTH;
  }
}

/**
 * Default colours for coordinate roles
 * @param role The coordinate role
 */
export function coordinateRoleColor(role?: CoordinateRole): string {
  if (!role) {
    return MISSING_COLOR;
  }
  switch (role) {
    case CoordinateRole.PointFeature:
      return '#7fffd4'; // aquamarine
    case CoordinateRole.LineStart:
      return '#6495ed'; // cornflowerblue
    case CoordinateRole.LineSecond:
      return '#00ced1'; // darkturquoise
    case CoordinateRole.LineInner:
      return '#7fffd4'; // aquamarine
    case CoordinateRole.LineSecondLast:
      return '#bdb76b'; // darkkhaki
    case CoordinateRole.LineLast:
      return '#ff8c00'; // darkorange
    case CoordinateRole.PolygonStart:
      return '#6495ed'; // cornflowerblue
    case CoordinateRole.PolygonInner:
      return '#7fffd4'; // aquamarine
    case CoordinateRole.PolygonSecondLast:
      return '#ff8c00'; // darkorange
    case CoordinateRole.PolygonHole:
      return '#008b8b'; // darkcyan
  }
}

/**
 * Default colours for line string roles
 * @param role The line string role
 */
export function lineStringRoleColor(role?: LineStringRole): string {
  if (!role) {
    return MISSING_COLOR;
  }
  switch (role) {
    case LineStringRole.LineStringFeature:
      return '#7fffd4'; // aquamarine
    case LineStringRole.PolygonInner:
      return '#8fbc8f'; // darkseagreen
    case LineStringRole.PolygonLast:
      return '#daa520'; // goldenrod
    case LineStringRole.PolygonHole:
      return '#b0c4de'; // lightsteelblue
  }
}

/**
 * Default widths for line string roles
 * @param role The line string role
 */
function lineStringRoleWidth(role?: LineStringRole): number {
  if (!role) {
    return MISSING_WIDTH;
  }
  switch (role) {
    case LineStringRole.LineStringFeature:
      return 2;
    case LineStringRole.PolygonInner:
      return 3;
    case LineStringRole.PolygonLast:
      return 3;
    case LineStringRole.PolygonHole:
      return 2;
  }
}

/**
 * The default colour to use for missing information
 */
const MISSING_COLOR = '#000000';

/**
 * The default width to use for missing information
 */
const MISSING_WIDTH = 2;

/**
 * The default style generation function for non-draggable point features
 * @return Mapbox style JSON for a {@link RenderFeature} of geometry type `'Point'`
 */
function getDefaultPointStyle(): CircleLayerStyle {
  return {
    circleRadius: (ANNOTATION_SIZE * 2) / 3,
    circleColor: 'gold',
    circlePitchAlignment: 'map',
    circleStrokeWidth: [
      'match',
      ['get', 'rnmgeStage'],
      FeatureLifecycleStage.NewShape,
      featureLifecycleStrokeWidth(FeatureLifecycleStage.NewShape),
      FeatureLifecycleStage.EditShape,
      featureLifecycleStrokeWidth(FeatureLifecycleStage.EditShape),
      FeatureLifecycleStage.EditMetadata,
      featureLifecycleStrokeWidth(FeatureLifecycleStage.EditMetadata),
      FeatureLifecycleStage.SelectMultiple,
      featureLifecycleStrokeWidth(FeatureLifecycleStage.SelectMultiple),
      FeatureLifecycleStage.SelectSingle,
      featureLifecycleStrokeWidth(FeatureLifecycleStage.SelectSingle),
      FeatureLifecycleStage.View,
      featureLifecycleStrokeWidth(FeatureLifecycleStage.View),
      featureLifecycleStrokeWidth(),
    ],
    // Circle edge colour based on geometry lifecycle stage
    circleStrokeColor: [
      'match',
      ['get', 'rnmgeStage'],
      FeatureLifecycleStage.NewShape,
      featureLifecycleStageColor(FeatureLifecycleStage.NewShape),
      FeatureLifecycleStage.EditShape,
      featureLifecycleStageColor(FeatureLifecycleStage.EditShape),
      FeatureLifecycleStage.EditMetadata,
      featureLifecycleStageColor(FeatureLifecycleStage.EditMetadata),
      FeatureLifecycleStage.SelectMultiple,
      featureLifecycleStageColor(FeatureLifecycleStage.SelectMultiple),
      FeatureLifecycleStage.SelectSingle,
      featureLifecycleStageColor(FeatureLifecycleStage.SelectSingle),
      FeatureLifecycleStage.View,
      featureLifecycleStageColor(FeatureLifecycleStage.View),
      MISSING_COLOR,
    ],
  };
}

/**
 * The default style generation function for vertices of non-point features
 * @return Mapbox style JSON for a {@link RenderFeature} of geometry type `'Point'`
 */
function getDefaultVertexStyle(): CircleLayerStyle {
  return {
    circleRadius: ANNOTATION_SIZE / 2,
    circleColor: [
      'match',
      ['get', 'rnmgeRole'],
      CoordinateRole.PointFeature,
      coordinateRoleColor(CoordinateRole.PointFeature),
      CoordinateRole.LineStart,
      coordinateRoleColor(CoordinateRole.LineStart),
      CoordinateRole.LineSecond,
      coordinateRoleColor(CoordinateRole.LineSecond),
      CoordinateRole.LineInner,
      coordinateRoleColor(CoordinateRole.LineInner),
      CoordinateRole.LineSecondLast,
      coordinateRoleColor(CoordinateRole.LineSecondLast),
      CoordinateRole.LineLast,
      coordinateRoleColor(CoordinateRole.LineLast),
      CoordinateRole.PolygonStart,
      coordinateRoleColor(CoordinateRole.PolygonStart),
      CoordinateRole.PolygonInner,
      coordinateRoleColor(CoordinateRole.PolygonInner),
      CoordinateRole.PolygonSecondLast,
      coordinateRoleColor(CoordinateRole.PolygonSecondLast),
      CoordinateRole.PolygonHole,
      coordinateRoleColor(CoordinateRole.PolygonHole),
      coordinateRoleColor(),
    ],
    circlePitchAlignment: 'map',
    circleStrokeWidth: 0,
    // Circle edge colour based on geometry lifecycle stage
    circleStrokeColor: MISSING_COLOR,
  };
}

/**
 * The default style generation function for edges of non-line string features
 * @return Mapbox style JSON for a {@link RenderFeature} of geometry type `'LineString'`
 */
function getDefaultEdgeStyle(): LineLayerStyle {
  return {
    lineColor: [
      'match',
      ['get', 'rnmgeRole'],
      LineStringRole.LineStringFeature,
      lineStringRoleColor(LineStringRole.LineStringFeature),
      LineStringRole.PolygonInner,
      lineStringRoleColor(LineStringRole.PolygonInner),
      LineStringRole.PolygonLast,
      lineStringRoleColor(LineStringRole.PolygonLast),
      LineStringRole.PolygonHole,
      lineStringRoleColor(LineStringRole.PolygonHole),
      lineStringRoleColor(),
    ],
    lineWidth: [
      'match',
      ['get', 'rnmgeRole'],
      LineStringRole.LineStringFeature,
      lineStringRoleWidth(LineStringRole.LineStringFeature),
      LineStringRole.PolygonInner,
      lineStringRoleWidth(LineStringRole.PolygonInner),
      LineStringRole.PolygonLast,
      lineStringRoleWidth(LineStringRole.PolygonLast),
      LineStringRole.PolygonHole,
      lineStringRoleWidth(LineStringRole.PolygonHole),
      lineStringRoleWidth(),
    ],
  };
}

/**
 * The default style generation function for polygon features
 * @return Mapbox style JSON for a {@link RenderFeature} of geometry type `'Polygon'`
 */
function getDefaultPolygonStyle(): FillLayerStyle {
  return {
    fillColor: '#fffacd', // lemonchiffon
    /**
     * Outline colour based on geometry lifecycle stage
     * The outline is very thin (1 px?) and hard to notice.
     */
    fillOutlineColor: [
      'match',
      ['get', 'rnmgeStage'],
      FeatureLifecycleStage.NewShape,
      featureLifecycleStageColor(FeatureLifecycleStage.NewShape),
      FeatureLifecycleStage.EditShape,
      featureLifecycleStageColor(FeatureLifecycleStage.EditShape),
      FeatureLifecycleStage.EditMetadata,
      featureLifecycleStageColor(FeatureLifecycleStage.EditMetadata),
      FeatureLifecycleStage.SelectMultiple,
      featureLifecycleStageColor(FeatureLifecycleStage.SelectMultiple),
      FeatureLifecycleStage.SelectSingle,
      featureLifecycleStageColor(FeatureLifecycleStage.SelectSingle),
      FeatureLifecycleStage.View,
      featureLifecycleStageColor(FeatureLifecycleStage.View),
      MISSING_COLOR,
    ],
  };
}

/**
 * The default style generation function for line string features
 * @return Mapbox style JSON for a {@link RenderFeature} of geometry type `'LineString'`
 */
function getDefaultPolylineStyle(): LineLayerStyle {
  return {
    lineColor: [
      'match',
      ['get', 'rnmgeStage'],
      FeatureLifecycleStage.NewShape,
      featureLifecycleStageColor(FeatureLifecycleStage.NewShape),
      FeatureLifecycleStage.EditShape,
      featureLifecycleStageColor(FeatureLifecycleStage.EditShape),
      FeatureLifecycleStage.EditMetadata,
      featureLifecycleStageColor(FeatureLifecycleStage.EditMetadata),
      FeatureLifecycleStage.SelectMultiple,
      featureLifecycleStageColor(FeatureLifecycleStage.SelectMultiple),
      FeatureLifecycleStage.SelectSingle,
      featureLifecycleStageColor(FeatureLifecycleStage.SelectSingle),
      FeatureLifecycleStage.View,
      featureLifecycleStageColor(FeatureLifecycleStage.View),
      MISSING_COLOR,
    ],
    lineWidth: lineStringRoleWidth(LineStringRole.LineStringFeature),
    lineCap: 'round',
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
  selectedVertex: getSelectedVertexPointStyle,
  point: getDefaultPointStyle,
  vertex: getDefaultVertexStyle,
  edge: getDefaultEdgeStyle,
  polygon: getDefaultPolygonStyle,
  polyline: getDefaultPolylineStyle,
  cluster: getDefaultClusterStyle,
  clusterSymbol: getDefaultClusterSymbolStyle,
};
