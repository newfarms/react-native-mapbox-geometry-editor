/**
 * Geometry type definitions
 * @packageDocumentation
 */

import type { Feature, LineString, Point, Polygon } from 'geojson';

/**
 * Geometry available for editing is represented
 * only using features that contain single shapes
 */
export type EditableFeature = Feature<Point | LineString | Polygon>;
