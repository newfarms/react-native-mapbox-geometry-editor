import { computed } from 'mobx';
import { model, Model, modelAction, prop } from 'mobx-keystone';
import flatten from 'lodash/flatten';
import type { Position } from 'geojson';

import type { EditableFeature } from '../type/geometry';
import { globalToLocalIndices } from '../util/collections';

/**
 * Data associated with an interactive point
 */
export interface ActivePosition {
  /**
   * The world coordinates of the point
   */
  coordinates: Position;
  /**
   * Whether the point is newly created
   */
  isNew: boolean;
  /**
   * The GeoJSON feature to which the point belongs
   */
  feature: EditableFeature;
}

/**
 * An editable GeoJSON feature.
 *
 * To simplify selection and editing on the user interface, all editable features
 * must consist of one shape each, and so not all GeoJSON geometry types
 * are permitted.
 */
@model('reactNativeMapboxGeometryEditor/FeatureModel')
export class FeatureModel extends Model({
  /**
   * Whether the feature is part of the set of features actively
   * being edited.
   */
  isActive: prop<boolean>(false, { setterAction: true }),
  /**
   * Whether the feature is newly created
   */
  isNew: prop<boolean>(false, { setterAction: true }),
  /**
   * The GeoJSON feature
   */
  geojson: prop<EditableFeature>(),
}) {
  /**
   * Re-position a point in this feature.
   * Throws an error if the feature is not currently in the set
   * of features actively being edited.
   *
   * @param position The new position for the point
   * @param index The index of the point in this feature's list of points. See [[activePositions]]
   */
  @modelAction
  moveActiveCoordinate(position: Position, index: number) {
    if (index < 0 || index >= this.activePositions.length) {
      throw new Error(
        `Index ${index} out of range [0, ${this.activePositions.length}) of active coordinates.`
      );
    }

    /**
     * Update the point's coordinates
     */
    if (this.geojson.geometry.type === 'Point') {
      this.geojson.geometry.coordinates = position;
    } else if (this.geojson.geometry.type === 'LineString') {
      this.geojson.geometry.coordinates.splice(index, 1, position);
    } else if (this.geojson.geometry.type === 'Polygon') {
      /**
       * A polygon is composed of one or more linear rings.
       * Find the index of the ring and the index of the point within the ring
       * corresponding to `index`.
       */
      const { innerIndex, outerIndex } = globalToLocalIndices(index, (i) => {
        if (i >= this.geojson.geometry.coordinates.length) {
          return null;
        }
        return (this.geojson.geometry.coordinates[i] as Array<Position>).length;
      });
      // Update the point's coordinates
      this.geojson.geometry.coordinates[outerIndex].splice(
        innerIndex,
        1,
        position
      );
    }
  }

  /**
   * Computes the list of active points (points currently being edited) for this feature.
   * If this feature is active for editing, gets all of its points in a flat list.
   * Otherwise, returns an empty list.
   */
  @computed
  get activePositions(): Array<ActivePosition> {
    if (this.isActive) {
      const metadata = {
        isNew: this.isNew,
        feature: this.geojson,
      };
      let coordinates = [];
      if (this.geojson.geometry.type === 'Point') {
        coordinates = [this.geojson.geometry.coordinates];
      } else if (this.geojson.geometry.type === 'LineString') {
        coordinates = this.geojson.geometry.coordinates;
      } else if (this.geojson.geometry.type === 'Polygon') {
        coordinates = flatten(this.geojson.geometry.coordinates);
      } else {
        throw new Error('Unknown geometry type.');
      }
      return coordinates.map((position) => {
        return {
          coordinates: position,
          ...metadata,
        };
      });
    } else {
      return [];
    }
  }
}
