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
 * A bounding box for a 2D feature
 */
export type BBox2D = [number, number, number, number];

/**
 * Geometry available for editing consists of atomic shapes,
 * not multi-shapes.
 */
export type EditableGeometry = Point | LineString | Polygon;

/**
 * The valid values for the "type" property of {@link EditableGeometry} objects.
 */
export type EditableGeometryType = EditableGeometry['type'];

/**
 * The semantic type of geometry, which may not necessarily correspond
 * to the GeoJSON geometry type.
 *
 * TODO: For future use in distinguishing circles from points.
 */
export type SemanticGeometryType = EditableGeometryType;

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
  PointFeature = 'POINTFEATURE_POINT',
  /**
   * The coordinate is the first point on a polyline
   */
  LineStart = 'LINESTART_POINT',
  /**
   * The coordinate is the second point on a polyline,
   * and the polyline has more than three points
   */
  LineSecond = 'LINESECOND_POINT',
  /**
   * The coordinate is an interior point on a polyline
   * and is not an endpoint, nor adjacent to an endpoint
   */
  LineInner = 'LINEINNER_POINT',
  /**
   * The coordinate is the second-last point on a polyline,
   * and the polyline has more than two points
   */
  LineSecondLast = 'LINESECONDLAST_POINT',
  /**
   * The coordinate is the last point on a polyline,
   * and the polyline has more than one point
   */
  LineLast = 'LINELAST_POINT',
  /**
   * The coordinate is the first point on a polygon's
   * first linear ring
   */
  PolygonStart = 'POLYGONSTART_POINT',
  /**
   * The coordinate is an interior point on a polygon's first
   * linear ring (neither the first point, nor the second-last point,
   * the last point having the same coordinates as the first point)
   */
  PolygonInner = 'POLYGONINNER_POINT',
  /**
   * The coordinate is the second-last point on a polygon's first
   * linear ring (the last point having the same coordinates as the first point,
   * as required by the GeoJSON specification)
   */
  PolygonSecondLast = 'POLYGONSECONDLAST_POINT',
  /**
   * The coordinate is part of a hole in a polygon
   * (i.e. not part of the first linear ring)
   */
  PolygonHole = 'POLYGONHOLE_POINT',
}

/**
 * The possible roles of a line string in a shape
 */
export enum LineStringRole {
  /**
   * The line string is a polyline feature
   */
  LineStringFeature = 'LINESTRINGFEATURE_LINESTRING',
  /**
   * The line string is a series of edges in a polygon's first linear ring,
   * and does not contain the tentative edge that closes the linear ring.
   * This role is also used for line strings that have less than three vertices
   * (i.e. incomplete polygons). Polygons that have been drawn previously
   * do not have a special tentative final edge, and so all edges are marked
   * with this role.
   */
  PolygonInner = 'POLYGONINNER_LINESTRING',
  /**
   * The line string is the edge that closes a polygon's first linear ring.
   * The linear ring therefore has at least three vertices, and is in the process
   * of being constructed. (In a finished polygon, no edge can be said to be
   * a special last edge.)
   */
  PolygonLast = 'POLYGONLAST_LINESTRING',
  /**
   * The line string is part of a hole in a polygon
   * (i.e. not part of the first linear ring)
   */
  PolygonHole = 'POLYGONHOLE_LINESTRING',
}

/**
 * The equivalent of {@link CoordinateRole} and {@link LineStringRole} for geometrical
 * features that are not points or line strings.
 * This enum provides a value to fill an otherwise empty
 * field when that field is relevant only to other types of features.
 */
export enum GeometryRole {
  /**
   * The feature is not a point or a line string
   */
  Other = 'OTHER',
}

/**
 * The type of feature IDs
 * See {@link RenderProperties}
 */
export type RnmgeID = string;

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
   * The identifier of the feature used by the library.
   * The top-level `id` property of the GeoJSON feature might be used
   * by the client application, so the library uses a separate property as an ID.
   */
  readonly rnmgeID: RnmgeID;
  /**
   * The current editing stage of the feature
   */
  readonly rnmgeStage: FeatureLifecycleStage;
  /**
   * For point and line string features, the geometrical role in their
   * containing features.
   * For other features, it is set to {@link GeometryRole.Other}
   */
  readonly rnmgeRole: CoordinateRole | LineStringRole | GeometryRole;
  /**
   * For point features, the index in their containing features.
   * For non-point features, it is set to `-1`.
   */
  readonly rnmgeIndex: number;
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
 * A collection of {@link RenderFeature} features
 */
export type RenderFeatureCollection = FeatureCollection<
  EditableGeometry,
  RenderProperties
>;

/**
 * A collection of {@link RenderFeature} point features
 */
export type RenderPointFeatureCollection = FeatureCollection<
  Point,
  RenderProperties
>;

/**
 * A collection of {@link RenderFeature} non-point features
 */
export type RenderNonPointFeatureCollection = FeatureCollection<
  LineString | Polygon,
  RenderProperties
>;

/**
 * Data associated with a draggable point
 * Note that there are some properties of {@link RenderProperties} that do not need
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
  /**
   * The identifier of the feature used by the library.
   */
  readonly id: RnmgeID;
  /**
   * The index of the point in the feature
   */
  readonly index: number;
}
