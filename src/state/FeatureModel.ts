import { computed, toJS } from 'mobx';
import { model, Model, modelAction, prop } from 'mobx-keystone';
import flatten from 'lodash/flatten';
import { point, lineString } from '@turf/helpers';
import type { Position } from 'geojson';

import type {
  DraggablePosition,
  EditableFeature,
  EditableGeometryType,
  RenderFeature,
  RenderProperties,
} from '../type/geometry';
import {
  FeatureLifecycleStage,
  CoordinateRole,
  LineStringRole,
  GeometryRole,
} from '../type/geometry';
import { globalToLocalIndices } from '../util/collections';

/**
 * An editable GeoJSON feature
 */
@model('reactNativeMapboxGeometryEditor/FeatureModel')
export class FeatureModel extends Model({
  /**
   * The lifecycle stage of the feature, describing what
   * operations it can be subject to and made available as an input
   * to data-driven rendering.
   */
  stage: prop<FeatureLifecycleStage>(FeatureLifecycleStage.View, {
    setterAction: true,
  }),
  /**
   * The GeoJSON feature
   */
  geojson: prop<EditableFeature>(),
  /**
   * The intended type of geometry, which may not match the type of `geojson`.
   * For example, when a polygon is being drawn and does not yet have three
   * vertices, its `geojson` attribute will be a GeoJSON Point or LineString.
   */
  finalType: prop<EditableGeometryType>(),
}) {
  /**
   * Re-position a draggable point in this feature.
   * Throws an error if the feature's points are not currently draggable
   *
   * @param position The new position for the point
   * @param index The index of the point in this feature's list of points. See [[draggablePositions]]
   */
  @modelAction
  dragPosition(position: Position, index: number) {
    if (index < 0 || index >= this.draggablePositions.length) {
      throw new Error(
        `Index ${index} out of range [0, ${this.draggablePositions.length}) of draggable positions.`
      );
    }

    /**
     * Update the point's coordinates
     */
    switch (this.geojson.geometry.type) {
      case 'Point':
        this.geojson.geometry.coordinates = position;
        break;
      case 'LineString':
        this.geojson.geometry.coordinates.splice(index, 1, position);
        break;
      case 'Polygon': {
        /**
         * A polygon is composed of one or more linear rings.
         * Find the index of the ring and the index of the point within the ring
         * corresponding to `index`.
         */
        const { innerIndex, outerIndex } = globalToLocalIndices(index, (i) => {
          if (i >= this.geojson.geometry.coordinates.length) {
            return null;
          }
          return (this.geojson.geometry.coordinates[i] as Array<Position>)
            .length;
        });
        // Update the point's coordinates
        this.geojson.geometry.coordinates[outerIndex].splice(
          innerIndex,
          1,
          position
        );
        break;
      }
    }
  }

  /**
   * Helper function that lists the renderable coordinates of this
   * feature and determines their geometrical roles
   */
  @computed
  private get coordinatesWithRoles(): Array<{
    /**
     * Point coordinates
     */
    coordinates: Position;
    /**
     * Information about the position of the point
     * in the context of the originating shape
     */
    role: CoordinateRole;
  }> {
    let result: Array<{
      coordinates: Position;
      role: CoordinateRole;
    }> = [];
    switch (this.geojson.geometry.type) {
      case 'Point':
        switch (this.finalType) {
          case 'Point':
            result = [
              {
                coordinates: this.geojson.geometry.coordinates,
                role: CoordinateRole.PointFeature,
              },
            ];
            break;
          case 'LineString':
            result = [
              {
                coordinates: this.geojson.geometry.coordinates,
                role: CoordinateRole.LineStart,
              },
            ];
            break;
          case 'Polygon':
            result = [
              {
                coordinates: this.geojson.geometry.coordinates,
                role: CoordinateRole.PolygonStart,
              },
            ];
            break;
        }
        break;
      case 'LineString':
        switch (this.finalType) {
          case 'Point':
            throw new Error(
              `this.finalType is ${this.finalType}, but this.geojson.geometry.type is ${this.geojson.geometry.type}`
            );
          case 'LineString':
            result = this.geojson.geometry.coordinates.map(
              (val, index, arr) => {
                let role = CoordinateRole.LineInner;
                if (index === 0) {
                  role = CoordinateRole.LineStart;
                } else if (index === 1 && arr.length > 3) {
                  role = CoordinateRole.LineSecond;
                } else if (index === arr.length - 2 && arr.length > 2) {
                  role = CoordinateRole.LineSecondLast;
                } else if (index === arr.length - 1 && arr.length > 1) {
                  role = CoordinateRole.LineLast;
                }
                return {
                  coordinates: val,
                  role,
                };
              }
            );
            break;
          case 'Polygon':
            result = this.geojson.geometry.coordinates.map((val, index) => {
              let role = CoordinateRole.PolygonInner;
              if (index === 0) {
                role = CoordinateRole.PolygonStart;
              } else if (index === 1) {
                role = CoordinateRole.PolygonSecondLast;
              } else {
                throw new Error(
                  `A LineString representing an incomplete Polygon should contain exactly two points.`
                );
              }
              return {
                coordinates: val,
                role,
              };
            });
            break;
        }
        break;
      case 'Polygon':
        {
          /**
           * First linear ring is the exterior boundary
           */
          const coordinates: Array<{
            coordinates: Position;
            role: CoordinateRole;
          }> = this.geojson.geometry.coordinates[0]
            .slice(0, -1) // The last position in a GeoJSON linear ring is a repeat of the first, so exclude it
            .map((val, index, arr) => {
              let role = CoordinateRole.PolygonInner;
              if (index === 0) {
                role = CoordinateRole.PolygonStart;
              } else if (index === arr.length - 1 && arr.length > 1) {
                role = CoordinateRole.PolygonSecondLast;
              }
              return {
                coordinates: val,
                role,
              };
            });
          /**
           * Other linear rings are holes
           */
          if (this.geojson.geometry.coordinates.length > 1) {
            const holeCoordinates = flatten(
              this.geojson.geometry.coordinates.slice(1).map((ring) =>
                ring.slice(0, -1).map((val) => {
                  return {
                    coordinates: val,
                    role: CoordinateRole.PolygonHole,
                  };
                })
              )
            );
            result = coordinates.concat(holeCoordinates);
          } else {
            result = coordinates;
          }
        }
        break;
    }
    return result;
  }

  /**
   * Helper function that lists the polylines of this
   * feature and determines their geometrical roles
   */
  @computed
  private get lineStringsWithRoles(): Array<{
    /**
     * Line string coordinates
     */
    coordinates: Array<Position>;
    /**
     * Information about the position of the line string
     * in the context of the originating shape
     */
    role: LineStringRole;
  }> {
    let result: Array<{
      coordinates: Array<Position>;
      role: LineStringRole;
    }> = [];
    switch (this.geojson.geometry.type) {
      case 'Point':
        break;
      case 'LineString':
        switch (this.finalType) {
          case 'Point':
            throw new Error(
              `this.finalType is ${this.finalType}, but this.geojson.geometry.type is ${this.geojson.geometry.type}`
            );
          case 'LineString':
            result = [
              {
                coordinates: this.geojson.geometry.coordinates,
                role: LineStringRole.LineStringFeature,
              },
            ];
            break;
          case 'Polygon':
            result = [
              {
                coordinates: this.geojson.geometry.coordinates,
                role: LineStringRole.PolygonInner,
              },
            ];
            break;
        }
        break;
      case 'Polygon':
        {
          let edges: Array<{
            coordinates: Array<Position>;
            role: LineStringRole;
          }> = [];
          /**
           * First linear ring is the exterior boundary. When the polygon is being created,
           * treat the last edge as a special edge.
           */
          if (this.stage === FeatureLifecycleStage.NewShape) {
            edges = [
              {
                coordinates: this.geojson.geometry.coordinates[0].slice(0, -1),
                role: LineStringRole.PolygonInner,
              },
              {
                coordinates: this.geojson.geometry.coordinates[0].slice(-2),
                role: LineStringRole.PolygonLast,
              },
            ];
          } else {
            // Otherwise treat all edges as equivalent.
            edges = [
              {
                coordinates: this.geojson.geometry.coordinates[0],
                role: LineStringRole.PolygonInner,
              },
            ];
          }
          /**
           * Other linear rings are holes
           */
          if (this.geojson.geometry.coordinates.length > 1) {
            const holeEdges = this.geojson.geometry.coordinates
              .slice(1)
              .map((ring) => {
                return { coordinates: ring, role: LineStringRole.PolygonHole };
              });
            result = edges.concat(holeEdges);
          } else {
            result = edges;
          }
        }
        break;
    }
    return result;
  }

  /**
   * Helper function that computes the list of non-draggable coordinates
   * for a non-point feature that is in a "hot" lifecycle stage.
   * Returns an empty list for a point feature.
   * If this feature is in a "hot" lifecycle stage,
   * all of its points are returned in a flat list.
   * Otherwise, returns an empty list.
   */
  @computed
  private get fixedPositions(): Array<RenderFeature> {
    if (this.geojson.geometry.type === 'Point') {
      return [];
    }
    if (this.isInHotStage && this.stage !== FeatureLifecycleStage.EditShape) {
      return this.coordinatesWithRoles.map((val) => {
        return point(
          toJS(val.coordinates),
          {
            ...toJS(this.renderFeatureProperties),
            rnmgeRole: val.role,
          },
          {
            bbox: toJS(this.geojson.bbox),
            id: this.geojson.id,
          }
        );
      });
    } else {
      return [];
    }
  }

  /**
   * Computes the list of draggable points for this feature.
   * If this feature is in an editable state, all of its points are returned in a flat list.
   * Otherwise, returns an empty list.
   */
  @computed
  get draggablePositions(): Array<DraggablePosition> {
    if (this.stage === FeatureLifecycleStage.EditShape) {
      return this.coordinatesWithRoles.map((val) => {
        return {
          ...val,
          feature: this.geojson,
        };
      });
    } else {
      return [];
    }
  }

  /**
   * Helper function that generates a list of `LineString` features to display
   * the edges of a polygon in a "hot" lifecycle stage.
   * Returns an empty list for a non-polygon feature, or for a feature that
   * is not in a "hot" lifecycle stage,
   */
  @computed
  private get hotEdges(): Array<RenderFeature> {
    if (this.geojson.geometry.type === 'Polygon' && this.isInHotStage) {
      return this.lineStringsWithRoles.map((val) => {
        return lineString(
          val.coordinates.map((c) => toJS(c)),
          {
            ...toJS(this.renderFeatureProperties),
            rnmgeRole: val.role,
          },
          {
            bbox: toJS(this.geojson.bbox),
            id: this.geojson.id,
          }
        );
      });
    } else {
      return [];
    }
  }

  /**
   * Determines whether this feature is in a lifecycle stage that permits
   * shape modification. If so, the feature should be rendered in the "hot"
   * map layers.
   */
  @computed
  private get isInHotStage(): boolean {
    switch (this.stage) {
      case FeatureLifecycleStage.DraftShape:
        return true;
      case FeatureLifecycleStage.EditMetadata:
        return false;
      case FeatureLifecycleStage.EditShape:
        return true;
      case FeatureLifecycleStage.NewShape:
        return true;
      case FeatureLifecycleStage.SelectMultiple:
        return false;
      case FeatureLifecycleStage.SelectSingle:
        return false;
      case FeatureLifecycleStage.View:
        return false;
    }
  }

  /**
   * Returns this feature's properties along with extra properties for rendering
   */
  @computed
  private get renderFeatureProperties(): RenderProperties {
    let role: GeometryRole | CoordinateRole | LineStringRole =
      GeometryRole.Other;
    if (this.finalType === 'Point') {
      role = CoordinateRole.PointFeature;
    }
    if (this.finalType === 'LineString') {
      role = LineStringRole.LineStringFeature;
    }
    let copyProperties: RenderProperties = {
      rnmgeID: this.$modelId,
      rnmgeStage: this.stage,
      rnmgeRole: role,
    };
    /**
     * Merge with user properties of the GeoJSON object
     */
    if (this.geojson.properties !== null) {
      copyProperties = {
        ...toJS(this.geojson.properties),
        ...copyProperties,
      };
    }
    return copyProperties;
  }

  /**
   * Helper function that returns this feature
   * with extra properties for rendering
   */
  @computed
  private get renderFeature(): RenderFeature {
    return {
      ...toJS(this.geojson),
      properties: this.renderFeatureProperties,
    };
  }

  /**
   * Returns any features that should be rendered in the "hot" map layer.
   * Otherwise returns an empty array.
   */
  @computed
  get hotFeatures(): Array<RenderFeature> {
    if (this.isInHotStage) {
      /**
       * The hot layers will render geometry and its points and edges as separate
       * objects in order to allow custom styling to be applied to
       * individual points and edges within a geometry.
       */
      switch (this.geojson.geometry.type) {
        case 'Point':
          if (this.stage === FeatureLifecycleStage.EditShape) {
            // Draggable points are rendered in other layers
            return [];
          } else {
            return [this.renderFeature];
          }
        case 'LineString':
          if (this.stage === FeatureLifecycleStage.EditShape) {
            // Draggable points are rendered in other layers
            return [this.renderFeature];
          } else {
            return [this.renderFeature].concat(this.fixedPositions);
          }
        case 'Polygon':
          if (this.stage === FeatureLifecycleStage.EditShape) {
            // Draggable points are rendered in other layers
            return [this.renderFeature].concat(this.hotEdges);
          } else {
            return [this.renderFeature]
              .concat(this.hotEdges)
              .concat(this.fixedPositions);
          }
      }
    } else {
      return [];
    }
  }

  /**
   * Returns any features that should be rendered in the "cold" map layer.
   * Otherwise returns an empty array.
   */
  @computed
  get coldFeatures(): Array<RenderFeature> {
    if (this.isInHotStage) {
      return [];
    } else {
      return [this.renderFeature];
    }
  }
}
