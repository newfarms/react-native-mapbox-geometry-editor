import type {
  CircleLayerStyle,
  SymbolLayerStyle,
} from '@react-native-mapbox-gl/maps';

import { CoordinateRole, FeatureLifecycleStage } from '../type/geometry';
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
  let style: DraggablePointStyle = {
    radius: ANNOTATION_SIZE * 2,
    color: 'red',
    strokeWidth: 3,
    strokeColor: coordinateRoleColor(role),
  };
  return style;
}

/**
 * Default colours for geometry lifecycle stages
 * @param stage The lifecycle stage
 */
function featureLifecycleStageColor(stage: FeatureLifecycleStage): string {
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
    case FeatureLifecycleStage.DraftShape:
      return '#ff0000'; // Red
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
    case FeatureLifecycleStage.DraftShape:
      return 2;
    case FeatureLifecycleStage.View:
      return 1;
    default:
      return 2;
  }
}

/**
 * Default colours for coordinate roles
 * @param role The coordinate role
 */
function coordinateRoleColor(role?: CoordinateRole): string {
  if (!role) {
    return missingColor;
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
 * The default colour to use for missing information
 */
const missingColor = '#000000';

/**
 * The default style generation function for non-draggable point features
 * @return Mapbox style JSON for a [[RenderFeature]] of geometry type `'Point'`
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
      FeatureLifecycleStage.DraftShape,
      featureLifecycleStrokeWidth(FeatureLifecycleStage.DraftShape),
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
      FeatureLifecycleStage.DraftShape,
      featureLifecycleStageColor(FeatureLifecycleStage.DraftShape),
      FeatureLifecycleStage.View,
      featureLifecycleStageColor(FeatureLifecycleStage.View),
      missingColor,
    ],
  };
}

/**
 * The default style generation function for vertices of non-point features
 * @return Mapbox style JSON for a [[RenderFeature]] of geometry type `'Point'`
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
    circleStrokeColor: missingColor,
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
  vertex: getDefaultVertexStyle,
  cluster: getDefaultClusterStyle,
  clusterSymbol: getDefaultClusterSymbolStyle,
};
