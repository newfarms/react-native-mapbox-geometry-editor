import { configure } from 'mobx';

/**
 * MobX configuration
 * See https://mobx.js.org/configuration.html
 */
let mobxOptions = {
  /**
   * Allows users of this library to use different MobX versions from
   * the version of MobX used by this library.
   * This configuration setting prevents MobX from sharing state
   * across MobX instances.
   */
  isolateGlobalState: true,
};
if (__DEV__) {
  /**
   * Emit warnings in development mode for common MobX pitfalls
   */
  configure({
    ...mobxOptions,
    enforceActions: 'always',
    computedRequiresReaction: true,
    reactionRequiresObservable: true,
    observableRequiresReaction: true,
  });
} else {
  configure(mobxOptions);
}

export { GeometryEditor } from './component/GeometryEditor';
export type { GeometryEditorProps } from './component/GeometryEditor';
export { GeometryEditorUI } from './component/GeometryEditorUI';
export type { GeometryEditorUIProps } from './component/GeometryEditorUI';
export {
  defaultStyleGeneratorMap,
  featureLifecycleStageColor,
  coordinateRoleColor,
  lineStringRoleColor,
} from './util/defaultStyleGenerators';
export { validateMetadata } from './util/metadata/schema';
export { compareShapesByOverlap } from './util/geometry/display';

export type { CameraControls } from './component/event/CameraController';
export type {
  EditableFeature,
  EditableGeometry,
  EditableGeometryType,
  RenderFeature,
  RenderProperties,
  SemanticGeometryType,
} from './type/geometry';
export {
  CoordinateRole,
  LineStringRole,
  GeometryRole,
  FeatureLifecycleStage,
} from './type/geometry';
export type {
  FieldAttributes,
  Metadata,
  MetadataAttributes,
  MetadataSchema,
  MetadataSchemaGeneratorMap,
  NewMetadataSchemaGenerator,
  ExistingMetadataSchemaGenerator,
  MetadataValidationResult,
} from './type/metadata';
export type {
  CircleLayerStyleGenerator,
  ClusterSymbolLayerStyleGenerator,
  DraggablePointStyle,
  DraggablePointStyleGenerator,
  LineLayerStyleGenerator,
  PolygonLayerStyleGenerator,
  StyleGeneratorMap,
} from './type/style';
export type {
  EditingStatusCb,
  InteractionEventProps,
  PageProps,
  PageOpenCb,
  PageCloseCb,
  PageControls,
} from './type/ui';
export { Comparison } from './util/collections';
export type { Comparator } from './util/collections';
export type { ShapeComparator } from './component/geometry/ColdGeometry';
export type {
  GeometryImportOptions,
  GeometryImportResult,
  GeometryIORef,
} from './component/geometry/GeometryIO';
export {
  GeometryImportError,
  InvalidJSONError,
  InvalidGeoJSONError,
  InvalidGeometryError,
  UnsupportedGeometryError,
} from './util/geometry/io';
