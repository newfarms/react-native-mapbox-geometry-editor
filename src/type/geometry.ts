/**
 * Geometry type definitions
 * @packageDocumentation
 */

import type {
  Feature,
  FeatureCollection,
  LineString,
  Point,
  Polygon,
  Position,
} from 'geojson';

/**
 * Geometry available for editing consists of atomic shapes,
 * not multi-shapes.
 */
type EditableGeometry = Point | LineString | Polygon;

/**
 * Geometry available for editing is represented
 * using features that contain only single shapes.
 * Doing so simplifies selection and editing on the user interface.
 */
export type EditableFeature = Feature<EditableGeometry>;

/**
 * The set of geometry lifecycle stages
 */
export enum FeatureLifecycleStage {
  /**
   * Feature whose geometry is being created
   */
  NewShape = 'NEWSHAPE',
  /**
   * Feature whose geometry is being edited
   */
  EditShape = 'EDITSHAPE',
  /**
   * Feature whose metadata is being edited
   */
  EditMetadata = 'EDITMETADATA',
  /**
   * Feature selected in a batch selection
   */
  SelectMultiple = 'SELECTMULTIPLE',
  /**
   * Feature selected (and no others are selected)
   */
  SelectSingle = 'SELECTSINGLE',
  /**
   * Feature with geometry changes to be confirmed
   */
  DraftShape = 'DRAFTSHAPE',
  /**
   * Feature not subject to editing at the moment
   */
  View = 'VIEW',
}

/**
 * The possible roles of a coordinate in a shape
 */
export enum CoordinateRole {
  /**
   * The coordinate is the point of a point feature
   */
  PointFeature = 'POINTFEATURE',
  /**
   * The coordinate is the first point on a polyline
   */
  LineStart = 'LINESTART',
  /**
   * The coordinate is the second point on a polyline,
   * and the polyline has more than three points
   */
  LineSecond = 'LINESECOND',
  /**
   * The coordinate is an interior point on a polyline
   * and is not an endpoint, nor adjacent to an endpoint
   */
  LineInner = 'LINEINNER',
  /**
   * The coordinate is the second-last point on a polyline,
   * and the polyline has more than two points
   */
  LineSecondLast = 'LINESECONDLAST',
  /**
   * The coordinate is the last point on a polyline,
   * and the polyline has more than one point
   */
  LineLast = 'LINELAST',
  /**
   * The coordinate is the first point on a polygon's
   * first linear ring
   */
  PolygonStart = 'POLYGONSTART',
  /**
   * The coordinate is an interior point on a polygon's first
   * linear ring (neither the first point, nor the second-last point,
   * the last point having the same coordinates as the first point)
   */
  PolygonInner = 'POLYGONINNER',
  /**
   * The coordinate is the second-last point on a polygon's first
   * linear ring (the last point having the same coordinates as the first point,
   * as required by the GeoJSON specification)
   */
  PolygonSecondLast = 'POLYGONSECONDLAST',
  /**
   * The coordinate is part of a hole in a polygon
   * (i.e. not part of the first linear ring)
   */
  PolygonHole = 'POLYGONHOLE',
}

/**
 * The equivalent of [[CoordinateRole]] for geometrical
 * features that are not points.
 * This enum provides a value to fill an otherwise empty
 * field when that field is relevant only to point features.
 */
export enum GeometryRole {
  /**
   * The feature is not a point
   */
  NonPoint = 'NONPOINT',
}

/**
 * This interface defines the GeoJSON feature properties made available
 * for data-driven styling.
 *
 * For example, the expression `['get', 'rnmgeStage']` will retrieve
 * the `rnmgeStage` property of a GeoJSON feature.
 *
 * Refer to Mapbox's documentation of data-driven styling expressions
 * for more information on data-driven styling:
 * https://docs.mapbox.com/mapbox-gl-js/style-spec/expressions/
 */
export interface RenderProperties {
  /**
   * The current editing stage of the feature
   */
  readonly rnmgeStage: FeatureLifecycleStage;
  /**
   * For point features, the geometrica role of the point in its
   * containing feature.
   * For non-point features, it is set to [[GeometryRole.NonPoint]]
   */
  readonly rnmgeRole: CoordinateRole | GeometryRole;
  /**
   * Client-defined properties associated with GeoJSON features.
   * These properties are set by the client, not by the library.
   */
  [name: string]: any;
}

/**
 * GeoJSON features with some additional properties
 * that are useful for styling geometry as a function of current
 * editing operations.
 */
export type RenderFeature = Feature<EditableGeometry, RenderProperties>;

/**
 * A collection of [[RenderFeature]] features
 */
export type RenderFeatureCollection = FeatureCollection<
  EditableGeometry,
  RenderProperties
>;

/**
 * Data associated with a draggable point
 * Note that there are some properties of [[RenderProperties]] that do not need
 * to be included, because they have implied constant values:
 * ```
 * rnmgeStage: FeatureLifecycleStage = FeatureLifecycleStage.EditShape
 * ```
 */
export interface DraggablePosition {
  /**
   * The world coordinates of the point
   */
  readonly coordinates: Position;
  /**
   * The geometrical role of the point in relation to the GeoJSON
   * feature it belongs to
   */
  readonly role: CoordinateRole;
  /**
   * The GeoJSON feature to which the point belongs
   */
  readonly feature: EditableFeature;
}