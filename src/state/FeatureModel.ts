import { computed } from 'mobx';
import { model, Model, modelAction, prop } from 'mobx-keystone';
import flatten from 'lodash/flatten';
import type { Feature, LineString, Point, Polygon, Position } from 'geojson';

import { globalToLocalIndices } from '../util/collections';

@model('reactNativeMapboxGeometryEditor/FeatureModel')
export class FeatureModel extends Model({
  isActive: prop<boolean>(false, { setterAction: true }),
  geojson: prop<Feature<Point | LineString | Polygon>>(),
}) {
  @modelAction
  moveActiveCoordinate(position: Position, index: number) {
    if (index < 0 || index >= this.activePositions.length) {
      throw new Error(
        `Index ${index} out of range [0, ${this.activePositions.length}) of active coordinates.`
      );
    }

    if (this.geojson.geometry.type === 'Point') {
      this.geojson.geometry.coordinates = position;
    } else if (this.geojson.geometry.type === 'LineString') {
      this.geojson.geometry.coordinates.splice(index, 1, position);
    } else if (this.geojson.geometry.type === 'Polygon') {
      const { innerIndex, outerIndex } = globalToLocalIndices(index, (i) => {
        if (i >= this.geojson.geometry.coordinates.length) {
          return null;
        }
        return (this.geojson.geometry.coordinates[i] as Array<Position>).length;
      });
      this.geojson.geometry.coordinates[outerIndex].splice(
        innerIndex,
        1,
        position
      );
    }
  }

  @computed
  get activePositions(): Array<Position> {
    if (this.isActive) {
      if (this.geojson.geometry.type === 'Point') {
        return [this.geojson.geometry.coordinates];
      } else if (this.geojson.geometry.type === 'LineString') {
        return this.geojson.geometry.coordinates;
      } else if (this.geojson.geometry.type === 'Polygon') {
        return flatten(this.geojson.geometry.coordinates);
      }
      throw new Error('Unknown geometry type.');
    } else {
      return [];
    }
  }
}
