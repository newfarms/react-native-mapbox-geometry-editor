import along from '@turf/along';
import bbox from '@turf/bbox';
import centroid from '@turf/centroid';
import length from '@turf/length';

import { FeatureLifecycleStage } from '../type/geometry';
import type { BBox2D, EditableFeature } from '../type/geometry';
import type { FeatureModel } from '../state/FeatureModel';

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
 * Tests whether a feature is in an appropriate lifecycle stage for
 * geometry modification.
 *
 * @param feature The feature to examine
 */
export function isGeometryEditableFeature(feature: FeatureModel) {
  return (
    feature.stage === FeatureLifecycleStage.EditShape ||
    feature.stage === FeatureLifecycleStage.NewShape
  );
}

/**
 * Tests whether a feature is full-formed, such that its `finalType`
 * matches its GeoJSON type.
 *
 * @param feature The feature to examine
 */
export function isCompleteFeature(feature: FeatureModel) {
  return feature.geojson.geometry.type === feature.finalType;
}
