import { comparer, computed, toJS } from 'mobx';
import { model, Model, modelAction, prop } from 'mobx-keystone';
import flatten from 'lodash/flatten';
import { point, lineString, polygon } from '@turf/helpers';
import type { Position, Point, LineString, Polygon, Feature } from 'geojson';
import { coordReduce } from '@turf/meta';
import nearestPointOnLine from '@turf/nearest-point-on-line';

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
          if (
            (this.geojson.geometry.coordinates[i] as Array<Position>).length > 0
          ) {
            // Account for the duplicate position at the end of a linear ring
            return (
              (this.geojson.geometry.coordinates[i] as Array<Position>).length -
              1
            );
          } else {
            return 0;
          }
        });
        // Update the point's coordinates
        this.geojson.geometry.coordinates[outerIndex].splice(
          innerIndex,
          1,
          position
        );
        // Update the duplicate coordinate if needed
        if (innerIndex === 0) {
          this.geojson.geometry.coordinates[outerIndex].splice(-1, 1, position);
        }
        break;
      }
    }
  }

  /**
   * Add a vertex to this feature.
   * Throws an error if this feature is of an inappropriate geometry type
   * (`this.finalType`).
   * Does nothing if the vertex is exactly equal to an existing vertex.
   *
   * @param vertex The new vertex
   * @param index The index at which to insert the vertex in this feature's list of vertices.
   *              The index is the index of the vertex after it is inserted.
   *              Negative indices are interpreted as relative to the end of the **final** array.
   *              For example `-1` means the vertex is inserted at the end of the array.
   *              The length of a linear ring of coordinates is considered to be the number
   *              of unique vertices it contains, not the actual length of the coordinates array
   *              (which is one greater because of the duplicate of the first position).
   */
  @modelAction
  addVertex(vertex: Position, index: number = -1) {
    // Error checking
    if (!this.isGeometryEditableFeature) {
      console.warn(
        `The feature is in lifecycle stage ${this.stage}, which is not appropriate for adding vertices.`
      );
    }
    // Avoid duplicating an existing vertex
    if (
      coordReduce(
        this.geojson,
        (containsPoint, currentCoordinates) => {
          return (
            containsPoint || comparer.structural(currentCoordinates, vertex)
          );
        },
        false
      )
    ) {
      return;
    }
    /**
     * Add a vertex in a way that is appropriate for the current geometry type
     */
    switch (this.geojson.geometry.type) {
      case 'Point':
        switch (this.finalType) {
          case 'Point':
            throw new Error(
              `this.finalType is ${this.finalType}, so no vertices can be added`
            );
          case 'LineString':
          case 'Polygon':
            // Turn the point into a line
            let newCoordinates = [toJS(this.geojson.geometry.coordinates)];
            if (index === 0 || index < -1) {
              newCoordinates.splice(0, 0, vertex);
            } else {
              newCoordinates.splice(1, 0, vertex);
            }
            this.geojson = lineString(
              newCoordinates,
              toJS(this.geojson.properties),
              {
                bbox: toJS(this.geojson.bbox),
                id: this.geojson.id,
              }
            );
            break;
        }
        break;
      case 'LineString':
        {
          /**
           * Handle negative indices as described
           * in the function's interface documentation
           */
          let finalIndex = index;
          if (index < 0) {
            if (index === -1) {
              finalIndex = this.geojson.geometry.coordinates.length;
            } else {
              finalIndex = index + 1;
            }
          }

          switch (this.finalType) {
            case 'Point':
              throw new Error(
                `this.finalType is ${this.finalType}, but this.geojson.geometry.type is ${this.geojson.geometry.type}`
              );
            case 'LineString':
              // Add a point to a line string
              this.geojson.geometry.coordinates.splice(finalIndex, 0, vertex);
              break;
            case 'Polygon':
              // Turn the line string into a polygon
              if (this.geojson.geometry.coordinates.length !== 2) {
                throw new Error(
                  `This line string has ${this.geojson.geometry.coordinates.length} coordinates, so it should already be a polygon as per its 'finalType' value, ${this.finalType}`
                );
              }
              let newCoordinates = this.geojson.geometry.coordinates.map((c) =>
                toJS(c)
              );
              newCoordinates.splice(finalIndex, 0, vertex);
              // Convert the coordinates array into a linear ring
              newCoordinates.push(newCoordinates[0]);
              this.geojson = polygon(
                [newCoordinates],
                toJS(this.geojson.properties),
                {
                  bbox: toJS(this.geojson.bbox),
                  id: this.geojson.id,
                }
              );
              break;
          }
        }
        break;
      case 'Polygon':
        {
          // Add the point to the polygon's first linear ring
          /**
           * Handle indices as described
           * in the function's interface documentation
           */
          const len = this.geojson.geometry.coordinates[0].length;
          let finalIndex = index;
          if (index >= len) {
            // Insert at the logical end, before the duplicate first coordinate
            finalIndex = -1;
          }
          this.geojson.geometry.coordinates[0].splice(finalIndex, 0, vertex);
          if (index === 0 || len + index <= 0) {
            // Fix the duplicate first coordinate
            this.geojson.geometry.coordinates[0].splice(-1, 1, vertex);
          }
        }
        break;
    }
  }

  /**
   * Add a vertex to this feature at the index between the two closest vertices
   * to the given position, and along the edge between those vertices.
   * Throws an error if this feature is of an inappropriate geometry type
   * (`this.finalType`).
   * Does nothing if the position is exactly equal to an existing vertex.
   *
   * For an incomplete line string, the vertex is always added after the single existing vertex
   * to create the first edge.
   * For a complete line string, the vertex always splits an interior edge.
   *
   * @param position The point that the new vertex will be closer to than any other point along
   *                 the shape's edges.
   */
  @modelAction
  addVertexToNearestSegment(position: Position) {
    /**
     * Add a vertex immediately to a point, or find the edges of a non-point shape
     */
    let lineFeature: Feature<LineString> | null = null;
    switch (this.geojson.geometry.type) {
      case 'Point':
        // Add the vertex as a second vertex
        this.addVertex(position);
        return;
      case 'LineString':
        lineFeature = this.geojson as Feature<LineString>;
        break;
      case 'Polygon':
        // Note: Holes are ignored
        lineFeature = lineString(this.geojson.geometry.coordinates[0]);
        break;
    }

    // Find the point at which to insert the new vertex
    const insertionPoint = nearestPointOnLine(lineFeature, position);
    const insertionPointCoordinates = insertionPoint.geometry.coordinates;
    if (typeof insertionPoint.properties.index === 'number') {
      /**
       * The `addVertex()` function needs the index after the vertex is inserted.
       */
      this.addVertex(
        insertionPointCoordinates,
        insertionPoint.properties.index + 1
      );
    } else {
      console.warn(
        'No index in insertionPoint to use for inserting a vertex into the shape.'
      );
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
          // This point is just a point
          case 'Point':
            result = [
              {
                coordinates: this.geojson.geometry.coordinates,
                role: CoordinateRole.PointFeature,
              },
            ];
            break;
          // This point is going to be a line string when more vertices are added
          case 'LineString':
            result = [
              {
                coordinates: this.geojson.geometry.coordinates,
                role: CoordinateRole.LineStart,
              },
            ];
            break;
          // This point is going to be a polygon when more vertices are added
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
          /**
           * This line string is just a line string, but its points can be extracted for display as circles
           */
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
          /**
           * This line string will become a polygon when more vertices are added.
           * Its points can be extracted for display as circles, and labelled as part of a polygon.
           */
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
      /**
       * Extract the vertices of a polygon for display as circles
       */
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
              // In drawing mode, the order of the vertices is significant
              if (this.stage === FeatureLifecycleStage.NewShape) {
                if (index === 0) {
                  role = CoordinateRole.PolygonStart;
                } else if (index === arr.length - 1 && arr.length > 1) {
                  role = CoordinateRole.PolygonSecondLast;
                }
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
      // Points have no line strings
      case 'Point':
        break;
      case 'LineString':
        switch (this.finalType) {
          case 'Point':
            throw new Error(
              `this.finalType is ${this.finalType}, but this.geojson.geometry.type is ${this.geojson.geometry.type}`
            );
          // A line string that is just a line string
          case 'LineString':
            result = [
              {
                coordinates: this.geojson.geometry.coordinates,
                role: LineStringRole.LineStringFeature,
              },
            ];
            break;
          // A line string that will turn into a polygon when more vertices are added
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
      /**
       * Extract the edges from a polygon for better control over styling by displaying
       * them separately.
       */
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
    /**
     * Determine the semantic role of the geometry as a function
     * of the geometry's current type, and of the type of geometry
     * that it is expected to become as more vertices are added.
     */
    let role: GeometryRole | CoordinateRole | LineStringRole =
      GeometryRole.Other;
    switch (this.geojson.geometry.type) {
      case 'Point':
        switch (this.finalType) {
          case 'Point':
            role = CoordinateRole.PointFeature;
            break;
          case 'LineString':
            role = CoordinateRole.LineStart;
            break;
          case 'Polygon':
            role = CoordinateRole.PolygonStart;
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
            role = LineStringRole.LineStringFeature;
            break;
          case 'Polygon':
            role = LineStringRole.PolygonInner;
            break;
        }
        break;
      case 'Polygon':
        break;
    }
    /**
     * Properties provided by this library for data-driven styling of map layers,
     * and for callbacks (in the case of the model ID).
     */
    let copyProperties: RenderProperties = {
      rnmgeID: this.$modelId,
      rnmgeStage: this.stage,
      rnmgeRole: role,
    };
    /**
     * Merge with user-provided properties of the GeoJSON object
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
       * The hot layers will render geometry and its vertices and edges as separate
       * objects in order to allow custom styling to be applied to
       * individual vertices and edges within the geometry.
       */
      switch (this.finalType) {
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
   * Returns any point features that should be rendered in the "cold" map layer.
   * Otherwise returns an empty array.
   */
  @computed
  get coldPointFeatures(): Array<Feature<Point, RenderProperties>> {
    if (!this.isInHotStage && this.geojson.geometry.type === 'Point') {
      return [this.renderFeature as Feature<Point, RenderProperties>];
    }
    return [];
  }

  /**
   * Returns any non-point features that should be rendered in the "cold" map layer.
   * Otherwise returns an empty array.
   */
  @computed
  get coldNonPointFeatures(): Array<
    Feature<LineString | Polygon, RenderProperties>
  > {
    if (!this.isInHotStage && this.geojson.geometry.type !== 'Point') {
      return [
        this.renderFeature as Feature<LineString | Polygon, RenderProperties>,
      ];
    }
    return [];
  }

  /**
   * Tests whether this feature is in an appropriate lifecycle stage for
   * geometry modification.
   */
  @computed
  get isGeometryEditableFeature() {
    return (
      this.stage === FeatureLifecycleStage.EditShape ||
      this.stage === FeatureLifecycleStage.NewShape
    );
  }

  /**
   * Tests whether this feature is fully-formed, such that its `finalType`
   * matches its GeoJSON type.
   */
  @computed
  get isCompleteFeature() {
    return this.geojson.geometry.type === this.finalType;
  }
}
