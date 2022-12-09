import along from '@turf/along';
import area from '@turf/area';
import booleanEqual from '@turf/boolean-equal';
import booleanDisjoint from '@turf/boolean-disjoint';
import bbox from '@turf/bbox';
import centroid from '@turf/centroid';
import length from '@turf/length';
import type { Feature, LineString, Polygon, GeoJsonProperties } from 'geojson';

import type { BBox2D, EditableFeature } from '../../type/geometry';
import { Comparison, groupSort } from '../collections';
import type { Comparator } from '../collections';

/**
 * Find the "centre" of a GeoJSON feature that is either
 * inside/on the feature or at the centroid of the feature.
 *
 * The computed location is a good place to display a tooltip
 * or annotation for the feature.
 * @param feature The feature whose centre is to be calculated.
 */
export function findCenterForAnnotation(feature: EditableFeature) {
  switch (feature.geometry.type) {
    case 'Point':
      return feature.geometry.coordinates;
    case 'LineString':
      // Midpoint in terms of path length along a polyline
      return along(feature.geometry, length(feature) / 2).geometry.coordinates;
    case 'Polygon':
      /**
       * Note: TurfJS has three different types of "centers" for geometry.
       * See https://stackoverflow.com/questions/55982479/difference-between-centroid-and-centerofmass-in-turf
       */
      return centroid(feature.geometry).geometry.coordinates;
  }
}

/**
 * Get the bounding box for a non-point feature, or `null` for a point feature.
 * This function truncates the bounding box to two dimensions if the feature
 * happens to be more than two-dimensional.
 * @param feature The feature whose bounding box is to be calculated.
 */
export function findBoundingBox(feature: EditableFeature): BBox2D | null {
  switch (feature.geometry.type) {
    case 'Point':
      // Turf's bounding box function would yield a degenerate bounding box
      return null;
    case 'LineString':
    case 'Polygon':
      const box = bbox(feature.geometry);
      switch (box.length) {
        case 4:
          return box;
        case 6:
          return [box[0], box[1], box[3], box[4]];
      }
  }
}

/**
 * An ordering function that declares polygons as being less than overlapping
 * polygons with smaller areas. Identical polygons are equal,
 * whereas polygons that do not overlap are incomparable. Unidentical polygons
 * that overlap and have identical areas are equal, although
 * this case should be very rare.
 *
 * @param a The first polygon to compare
 * @param b The second polygon to compare
 */
function comparePolygonsByOverlap<Props extends GeoJsonProperties>(
  a: Feature<Polygon, Props>,
  b: Feature<Polygon, Props>
): Comparison | undefined {
  if (booleanEqual(a, b)) {
    return Comparison.Equal;
  } else {
    if (!booleanDisjoint(a, b)) {
      const areaA = area(a);
      const areaB = area(b);
      if (areaA < areaB) {
        return Comparison.Greater;
      } else if (areaA === areaB) {
        return Comparison.Equal;
      } else {
        return Comparison.Less;
      }
    } else {
      return undefined;
    }
  }
}

/**
 * An ordering function that declares polylines as being "greater"
 * than polygons, and uses comparePolygonsByOverlap to order polygons.
 *
 * @param a The first shape to compare
 * @param b The second shape to compare
 */
export function compareShapesByOverlap<Props extends GeoJsonProperties>(
  a: Feature<Polygon | LineString, Props>,
  b: Feature<Polygon | LineString, Props>
): Comparison | undefined {
  if (a.geometry.type === 'LineString') {
    if (b.geometry.type === 'LineString') {
      return undefined;
    } else {
      return Comparison.Greater;
    }
  } else {
    if (b.geometry.type === 'LineString') {
      return Comparison.Less;
    } else {
      return comparePolygonsByOverlap(
        a as Feature<Polygon, Props>,
        b as Feature<Polygon, Props>
      );
    }
  }
}

/**
 * Groups shapes into an ordered list of lists of shapes.
 *
 * If `compare` is not defined, it defaults to {@link comparePolygonsByOverlap}.
 * Shapes are then organized as follows in the output list:
 * - All polylines and no polygons are in the last list.
 * - Each sub-list of polygons contains shapes that are equal or incomparable according to {@link comparePolygonsByOverlap}
 * - Sub-lists are ordered such that the "lesser" polygon in a pair of polygons
 *   always appears in the set with a higher index than the set
 *   containing the "greater" polygon (according to {@link comparePolygonsByOverlap}).
 *
 * If `compare` is defined, it will determine how shapes are grouped in the output list.
 *
 * @param shapes The shapes to group and order
 * @param compare An optional function defining an order between shapes
 */
export function orderShapes<Props extends GeoJsonProperties>(
  shapes: Array<Feature<Polygon | LineString, Props>>,
  compare: Comparator<
    Feature<Polygon | LineString, Props>
  > = compareShapesByOverlap
): Array<Array<Feature<Polygon | LineString, Props>>> {
  return groupSort(shapes, compare);
}
