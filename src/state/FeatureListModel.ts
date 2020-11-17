import { computed } from 'mobx';
import { model, Model, modelAction, prop } from 'mobx-keystone';
import { point } from '@turf/helpers';
import flatten from 'lodash/flatten';
import type { Position } from 'geojson';

import { globalToLocalIndices } from '../util/collections';
import { FeatureModel } from './FeatureModel';

/**
 * A collection of editable GeoJSON features
 */
@model('reactNativeMapboxGeometryEditor/FeatureListModel')
export class FeatureListModel extends Model({
  /**
   * Initial contents of the collection
   */
  features: prop<Array<FeatureModel>>(() => []),
}) {
  /**
   * Re-position a point in the list of points currently being edited
   * @param position The new position for the point
   * @param index The index of the point in the list of points being edited. See [[activePositions]]
   */
  @modelAction
  moveActiveCoordinate(position: Position, index: number) {
    /**
     * Look up the underlying feature in the list of features,
     * corresponding to the index into the list of active points
     */
    const { innerIndex, outerIndex } = globalToLocalIndices(index, (i) => {
      if (i >= this.features.length) {
        return null;
      }
      return this.features[i].activePositions.length;
    });
    /**
     * Ask the feature to update the point, given the computed index
     * of the point in that feature.
     */
    this.features[outerIndex].moveActiveCoordinate(position, innerIndex);
  }

  /**
   * Computes the list of active points (points currently being edited)
   * by concatenating the coordinates of all active features.
   */
  @computed
  get activePositions(): Array<Position> {
    /**
     * Empty arrays will be removed by `flatten`, but their removal
     * does not cause problems [[moveActiveCoordinate]], because [[globalToLocalIndices]]
     * can handle zero-length sub-collections.
     */
    return flatten(this.features.map((feature) => feature.activePositions));
  }

  /**
   * Add a new GeoJSON point feature to the collection of features.
   * The new point is marked as active, because it is assumed to be
   * added during an editing session.
   *
   * @param position Coordinates for the new point
   */
  @modelAction
  addActivePoint(position: Position) {
    this.features.push(
      new FeatureModel({ isActive: true, geojson: point(position) })
    );
  }
}
