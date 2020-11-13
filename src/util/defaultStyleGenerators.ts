import type { EditableFeature } from '../type/geometry';
import { PointDrawStyle, StyleGeneratorMap } from '../type/style';

/**
 * The default diameter of point annotations, measured in density-independent pixels
 */
const ANNOTATION_SIZE = 20;

/**
 * The default style generation function for points
 * @param style The name of the style
 * @return Rendering properties corresponding to the style
 */
function getDefaultPointStyle(style: PointDrawStyle) {
  switch (style) {
    case PointDrawStyle.EditPoint:
      return {
        radius: ANNOTATION_SIZE,
        color: 'red',
        strokeColor: 'rgba(0.5, 0, 0, 1)',
      };
    case PointDrawStyle.DraftPoint:
      return {
        radius: ANNOTATION_SIZE,
        color: 'yellow',
        strokeColor: 'rgba(0.5, 0.5, 0, 1)',
      };
    case PointDrawStyle.InactivePoint:
      return {
        radius: ANNOTATION_SIZE,
        color: 'grey',
        strokeColor: 'rgba(0.5, 0.5, 0.5, 1)',
      };
  }
}

/**
 * An adapter function allowing [[getDefaultPointStyle]] to be used
 * as a [[PointStyleGenerator]] function
 * @param style The style according to which the point will be drawn
 * @param _feature The feature corresponding to the point (ignored)
 * @return The style attributes for the input style type
 */
function defaultPointStyleGenerator(
  style: PointDrawStyle,
  _feature: EditableFeature
) {
  return getDefaultPointStyle(style);
}

/**
 * The default set of functions used to provide styles for all
 * types of objects rendered on the map
 */
export const defaultStyleGeneratorMap: StyleGeneratorMap = {
  point: defaultPointStyleGenerator,
};
