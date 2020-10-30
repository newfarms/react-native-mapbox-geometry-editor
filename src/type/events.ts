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
 * A callback that accepts a GeoJSON point having a
 * Mapbox ID property, and an index of the point
 * as stored in a list elsewhere in the library
 */
export interface PointDragCallback {
  (e: PointAnnotationPayload, index: number): unknown;
}
