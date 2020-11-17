/**
 * Event handler type definitions
 * @packageDocumentation
 */

import type { Feature, Point } from 'geojson';

/**
 * General event payloads can be anything
 */
export type Event = any;

/**
 * A function that returns a Boolean indicating whether or
 * not the event should be considered fully handled,
 * to stop further event handlers from being called.
 */
export interface EventHandler {
  (event: Event): boolean;
}

/**
 * A Mapbox event payload passed to callbacks
 * of `PointAnnotation` components
 */
export interface PointAnnotationPayload
  extends Feature<
    Point,
    {
      id: string;
    }
  > {}

/**
 * A Mapbox map press event payload
 */
export interface MapPressPayload
  extends Feature<
    Point,
    {
      screenPointX: number;
      screenPointY: number;
    }
  > {}
