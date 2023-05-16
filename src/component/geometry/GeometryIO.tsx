import { forwardRef, useContext, useImperativeHandle } from 'react';
import type { ReactNode, Ref } from 'react';
import type { FeatureCollection } from 'geojson';

import { StoreContext } from '../../state/StoreContext';
import { exportGeometry, importGeometry } from '../../util/geometry/io';
import type { GeometryImportError } from '../../util/geometry/io';
import type { EditableGeometry } from '../../type/geometry';
import {
  useOnPressControl,
  useOnPressEditControl,
} from '../ui/control/modeControls';
import {
  useOnPressCancelControl,
  useOnPressDeleteControl,
  useOnPressFinishControl,
  useOnPressRedoControl,
  useOnPressUndoControl,
} from '../ui/control/actionControls';
import { autorun } from 'mobx';
import { ControlsModel } from 'src/state/ControlsModel';

/**
 * Possible geometry editing modes
 */
export enum InteractionMode {
  /**
   * Reposition point geometry
   */
  DragPoint = 'DRAGPOINT',
  /**
   * Draw new point features
   */
  DrawPoint = 'DRAWPOINT',
  /**
   * Draw a new polygon
   */
  DrawPolygon = 'DRAWPOLYGON',
  /**
   * Draw a new polyline (line string)
   */
  DrawPolyline = 'DRAWPOLYLINE',
  /**
   * Edit metadata associated with a shape
   */
  EditMetadata = 'EDITMETADATA',
  /**
   * Edit compound shape vertices
   */
  EditVertices = 'EDITVERTICES',
  /**
   * Add shapes to the set of shapes selected for editing
   */
  SelectMultiple = 'SELECTMULTIPLE',
  /**
   * Select a shape to view its metadata or set it as
   * the active shape for future editing
   */
  SelectSingle = 'SELECTSINGLE',
}

/**
 * Options controlling geometry import
 */
export interface GeometryImportOptions {
  /**
   * Whether the features should be added to (`false`), or replace (`true`),
   * the features currently being managed by the library.
   */
  replace: boolean;
  /**
   * Whether non-critical issues should result in thrown exceptions (`true`), or should
   * result in returned errors (`false`). If `false`, not all geometry
   * may be imported. If `true`, this function will either successfully import all
   * geometry or will throw an exception.
   */
  strict: boolean;
  /**
   * Whether to validate `features`. If `false`, this function should only be
   * invoked on trusted input data.
   */
  validate: boolean;
}

/**
 * The result of a geometry import operation
 */
export interface GeometryImportResult {
  /**
   * Errors processing `features`.
   */
  errors: Array<GeometryImportError>;
  /**
   * If `true`, none of the input GeoJSON features were modified during
   * the import. In other words, if `export` was called immediately
   * afterwards, the same features would be present in the result.
   * If `false`, GeoJSON features were subdivided or otherwise altered.
   */
  exact: boolean;
}

/**
 * Methods for importing and exporting GeoJSON feature collections
 */
export interface GeometryIORef {
  /**
   * A function for importing a GeoJSON feature collection
   *
   * Calling this function will cancel any user geometry/metadata editing session
   * currently in-progress. The caller might want to block interaction
   * with the library's user interface during the operation.
   *
   * Geometry validation: Aside from being well-formed GeoJSON, the following
   * rules are enforced.
   * - Polygons should follow the right-hand rule
   *   (https://tools.ietf.org/html/rfc7946#appendix-B.1).
   *   If any are present that do not follow the right-hand rule,
   *   an exception will be thrown.
   * - Holes in polygons are not supported. (Holes will presently
   *   be stripped from polygons if `options.strict` is `false`.)
   *
   * @param features The feature collection
   * @param options Options for customizing the import behaviour
   * @return An object describing the outcome of the import operation.
   */
  import: (
    features: FeatureCollection,
    options: GeometryImportOptions
  ) => Promise<GeometryImportResult>;

  /**
   * A function for exporting a GeoJSON feature collection
   *
   * This function will export geometry as-is, including geometry that has been
   * partially modified during any active user geometry/metadata editing session.
   * The caller might want to avoid calling this function during an active
   * editing session.
   *
   * @return A feature collection containing a deep copy of all features
   *         managed by this library.
   */
  export: () => Promise<FeatureCollection<EditableGeometry>>;
  drawPolygon: () => void;
  drawPoint: () => void;
  drawPolyline: () => void;
  edit: () => void;
  selectSingleShape: () => void;
  selectMultipleShapes: () => void;
  undo: () => void;
  redo: () => void;
  cancel: () => void;
  deleteShape: () => void;
  confirm: () => void;
  canUndo: boolean | undefined;
  canRedo: boolean | undefined;
  cannotUndoAndRedo: boolean | undefined;
  hasCompleteNewFeature: boolean | undefined;
  canDelete: boolean | undefined;
}

/**
 * A component that exposes a React ref with methods for importing
 * and exporting GeoJSON feature collections.
 *
 * @param props Render properties
 * @param ref React ref to which import and export methods are attached
 */
function GeometryIOComponent(
  { children }: { readonly children?: ReactNode },
  ref: Ref<GeometryIORef>
) {
  const store = useContext(StoreContext);

  let controls: ControlsModel | null = null;
  let canUndo: boolean = false;
  let canRedo: boolean = false;
  let cannotUndoAndRedo: boolean = true;
  let hasCompleteNewFeature: boolean = false;
  let canDelete: boolean | undefined = false;
  /**
   * We need to use a MobX observable in a reactive context,
   * which is provided by `autorun`
   * (https://mobx.js.org/reactions.html).
   *
   * Since we don't need the function to run whenever the observable changes
   * in the future, we dispose of the reaction afterwards.
   */
  const disposer = autorun(() => {
    controls = store.controls;
    canUndo = store.features.canRedo;
    canRedo = store.features.canRedo;
    cannotUndoAndRedo = store.features.canRedo;
    hasCompleteNewFeature = store.features.canRedo;
    canDelete = store.controls.canDelete;
  });
  disposer();

  const drawPoint = useOnPressControl(controls, InteractionMode.DrawPoint);
  const drawPolygon = useOnPressControl(controls, InteractionMode.DrawPolygon);
  const drawPolyline = useOnPressControl(
    controls,
    InteractionMode.DrawPolyline
  );
  const edit = useOnPressEditControl(controls);
  const selectSingleShape = useOnPressControl(
    controls,
    InteractionMode.SelectSingle
  );
  const selectMultipleShapes = useOnPressControl(
    controls,
    InteractionMode.SelectSingle
  );
  const undo = useOnPressUndoControl(controls);
  const redo = useOnPressRedoControl(controls);
  const cancel = useOnPressCancelControl(controls);
  const deleteShape = useOnPressDeleteControl(controls);
  const confirm = useOnPressFinishControl(controls);

  useImperativeHandle(
    ref,
    (): GeometryIORef => ({
      import: (
        featureCollection: FeatureCollection,
        options: GeometryImportOptions
      ) => importGeometry(store, featureCollection, options),
      export: () => exportGeometry(store),
      drawPoint,
      drawPolygon,
      drawPolyline,
      edit,
      selectSingleShape,
      selectMultipleShapes,
      undo,
      redo,
      cancel,
      deleteShape,
      confirm,
      canRedo,
      canUndo,
      cannotUndoAndRedo,
      hasCompleteNewFeature,
      canDelete,
    }),
    [
      store,
      drawPoint,
      drawPolygon,
      drawPolyline,
      edit,
      selectSingleShape,
      selectMultipleShapes,
      undo,
      redo,
      cancel,
      deleteShape,
      confirm,
      canUndo,
      canRedo,
      cannotUndoAndRedo,
      hasCompleteNewFeature,
      canDelete,
    ]
  );
  /**
   * This component has nothing meaningful to render, and is just used to integrate
   * some imperative code with React.
   */
  return <>{children}</>;
}

/**
 * Renderable version of {@link GeometryIOComponent}
 *
 * Note: This line is needed because `useImperativeHandle()`
 * and `forwardRef()` should be used together
 * (https://reactjs.org/docs/hooks-reference.html#useimperativehandle)
 */
export const GeometryIO = forwardRef(GeometryIOComponent);
