import { computed } from 'mobx';
import { model, Model, modelAction, prop } from 'mobx-keystone';
import { point } from '@turf/helpers';
import flatten from 'lodash/flatten';
import type { Position } from 'geojson';

import { globalToLocalIndices } from '../util/collections';
import { FeatureModel } from './FeatureModel';

@model('reactNativeMapboxGeometryEditor/FeatureListModel')
export class FeatureListModel extends Model({
  features: prop<Array<FeatureModel>>(() => []),
}) {
  @modelAction
  moveActiveCoordinate(position: Position, index: number) {
    const { innerIndex, outerIndex } = globalToLocalIndices(index, (i) => {
      if (i >= this.features.length) {
        return null;
      }
      return this.features[i].activePositions.length;
    });

    this.features[outerIndex].moveActiveCoordinate(position, innerIndex);
  }

  @computed
  get activePositions(): Array<Position> {
    // Empty arrays will be removed
    return flatten(this.features.map((feature) => feature.activePositions));
  }

  @modelAction
  addActivePoint(position: Position) {
    this.features.push(
      new FeatureModel({ isActive: true, geojson: point(position) })
    );
  }
}
