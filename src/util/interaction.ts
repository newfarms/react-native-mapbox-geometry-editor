import centroid from '@turf/centroid';
import nearestPoint from '@turf/nearest-point';
import {
  feature as turfFeature,
  featureCollection,
  point,
} from '@turf/helpers';
import filter from 'lodash/filter';
import type { OnPressEvent } from '@react-native-mapbox-gl/maps';
import type { Feature, LineString, Point, Polygon, Position } from 'geojson';

import { COLD_GEOMETRY_NONPOINT_ZINDEX_PROPERTY } from '../component/geometry/ColdGeometry';
import type { RenderProperties, RnmgeID } from '../type/geometry';
import type { FeatureListModel } from '../state/FeatureListModel';

/**
 * Obtain a GeoJSON `Position` for the location of a touch event
 * @param e A touch event
 * @returns The coordinates of the touch event in GeoJSON format
 */
export function eventPosition(e: OnPressEvent): Position {
  return [e.coordinates.longitude, e.coordinates.latitude];
}

/**
 * [[ColdGeometry]] layers touch event handler helper function
 * that returns the ID of the topmost feature
 *
 * If the touch event has no features, returns `undefined`
 *
 * @param event The event object containing the features that were pressed,
 *              and information about the location pressed
 * @param features The features store, used to look up features by their IDs.
 *                 This parameter is needed because the features passed to the touch handler
 *                 sometimes have properties but no geometry. This function uses the properties
 *                 to look up the geometry.
 */
export function pickTopmostFeature(
  event: OnPressEvent,
  features: FeatureListModel
): RnmgeID | undefined {
  if (event.features.length > 0) {
    let topmostZIndex: number | null = null;
    let points: Array<Feature<Point, RenderProperties>> = [];
    let nonPoints: Array<Feature<LineString | Polygon, RenderProperties>> = [];
    let idSet = new Set<RnmgeID>();

    // Filter features to non-clusters and find the maximum z-index
    for (let feature of event.features) {
      const id = feature.properties?.rnmgeID; // Mapbox cluster features do not have this property
      if (id) {
        // Mapbox may pass copies of features
        if (idSet.has(id)) {
          continue;
        }
        const sourceFeature = features.findFeature(id);
        if (sourceFeature) {
          switch (sourceFeature.geojson.geometry.type) {
            case 'Point':
              // Points do not need a z-index property, because they cannot properly overlap
              points.push(
                turfFeature(
                  sourceFeature.geojson.geometry,
                  feature.properties
                ) as Feature<Point, RenderProperties>
              );
              idSet.add(id);
              break;
            case 'LineString':
            case 'Polygon':
              let zIndex =
                feature.properties?.[COLD_GEOMETRY_NONPOINT_ZINDEX_PROPERTY];
              if (typeof zIndex === 'number') {
                if (
                  typeof topmostZIndex !== 'number' ||
                  zIndex > topmostZIndex
                ) {
                  topmostZIndex = zIndex;
                }
                nonPoints.push(
                  turfFeature(
                    sourceFeature.geojson.geometry,
                    feature.properties
                  ) as Feature<LineString | Polygon, RenderProperties>
                );
                idSet.add(id);
              } else {
                console.warn(
                  `Feature with ID ${id} does not have a numerical ${COLD_GEOMETRY_NONPOINT_ZINDEX_PROPERTY} property.`
                );
              }
              break;
          }
        }
      }
    }

    /**
     * Filter to any points, which are, by convention, the topmost features.
     * If there are no points, filter to the topmost non-point features,
     * but take only their centroids for use selecting the closest feature.
     */
    let topFeatures: Array<Feature<Point, RenderProperties>> = points;
    if (points.length === 0) {
      if (nonPoints.length === 0) {
        return undefined;
      } else {
        const nonPointTopFeatures = filter(
          nonPoints,
          (feature) =>
            feature.properties[COLD_GEOMETRY_NONPOINT_ZINDEX_PROPERTY] ===
            topmostZIndex
        );
        if (nonPointTopFeatures.length > 1) {
          topFeatures = nonPointTopFeatures.map((feature) =>
            centroid(feature, { properties: feature.properties })
          );
        } else {
          /**
           * The true centroid will not be used since there is only one feature.
           * Just use a placeholder centroid for efficiency.
           */
          topFeatures = [point([0, 0], nonPointTopFeatures[0].properties)];
        }
      }
    }

    /**
     * Choose the closest feature to the touch, if there is more than one feature
     */
    if (topFeatures.length === 1) {
      return topFeatures[0].properties.rnmgeID;
    } else if (topFeatures.length > 1) {
      return topFeatures[
        nearestPoint(eventPosition(event), featureCollection(topFeatures))
          .properties.featureIndex
      ].properties.rnmgeID;
    }
  }
  return undefined;
}
