/**
 * Geometry rendering style type definitions
 * @packageDocumentation
 */

import type { EditableFeature } from './geometry';

/**
 * The set of geometry rendering styles for points
 */
export enum PointDrawStyle {
  /**
   * Editable point (selected/editable)
   */
  EditPoint = 'EDITPOINT',
  /**
   * Draft new point feature
   */
  DraftPoint = 'DRAFTPOINT',
  /**
   * Non-interactive point feature
   */
  InactivePoint = 'INACTIVEPOINT',
}

/**
 * Style attributes for points
 */
export interface PointStyle {
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
  /**
   * Marker outline opacity
   * Not all renderers currently use this property.
   */
  strokeOpacity?: number;
}

/**
 * A function that will be called to output style properties for point features
 */
export interface PointStyleGenerator {
  /**
   * @param style The style according to which the point will be drawn
   * @param feature The feature corresponding to the point
   * @return The style attributes for the input style type and feature combination
   */
  (style: PointDrawStyle, feature: EditableFeature): PointStyle;
}

/**
 * The set of functions needed to provide styles for all
 * types of objects rendered on the map
 */
export interface StyleGeneratorMap {
  /**
   * Style generator for point objects
   */
  readonly point: PointStyleGenerator;
}
