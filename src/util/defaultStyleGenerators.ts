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
    radius: (ANNOTATION_SIZE * 3) / 2,
    color: 'red',
    strokeWidth: 3,
  };
  switch (role) {
    case CoordinateRole.PointFeature:
      style.strokeColor = 'aquamarine';
      break;
    case CoordinateRole.LineStart:
      style.strokeColor = 'cornflowerblue';
      break;
    case CoordinateRole.LineSecond:
      style.strokeColor = 'darkturquoise';
      break;
    case CoordinateRole.LineInner:
      style.strokeColor = 'aquamarine';
      break;
    case CoordinateRole.LineSecondLast:
      style.strokeColor = 'darkkhaki';
      break;
    case CoordinateRole.LineLast:
      style.strokeColor = 'darkorange';
      break;
    case CoordinateRole.PolygonStart:
      style.strokeColor = 'cornflowerblue';
      break;
    case CoordinateRole.PolygonInner:
      style.strokeColor = 'aquamarine';
      break;
    case CoordinateRole.PolygonSecondLast:
      style.strokeColor = 'darkorange';
      break;
    case CoordinateRole.PolygonHole:
      style.strokeColor = 'darkcyan';
      break;
  }
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
 * The default colour to use for missing information
 */
const missingColor = '#000000';

/**
 * The default style generation function for non-draggable point features
 * @return Mapbox style JSON for a [[RenderFeature]] of geometry type `'Point'`
 */
function getDefaultPointStyle(): CircleLayerStyle {
  return {
    circleRadius: ANNOTATION_SIZE,
    circleColor: 'gold',
    circlePitchAlignment: 'map',
    circleStrokeWidth: 2,
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
