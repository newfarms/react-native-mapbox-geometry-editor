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
export { defaultStyleGeneratorMap } from './util/defaultStyleGenerators';
export { validateMetadata } from './util/metadata';

export type { CameraControls } from './component/CameraController';
export type {
  EditableFeature,
  RenderFeature,
  RenderProperties,
} from './type/geometry';
export {
  CoordinateRole,
  FeatureLifecycleStage,
  GeometryRole,
} from './type/geometry';
export type {
  MetadataSchema,
  MetadataSchemaGenerator,
  MetadataValidationResult,
} from './type/metadata';
export type { DraggablePointStyle, StyleGeneratorMap } from './type/style';
