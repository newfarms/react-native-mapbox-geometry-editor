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
  useSelectTopShapeControl,
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
  /**
   * A function for setting the Geometry Editor into draw polygon mode
   */
  drawPolygon: () => void;
  /**
   * A function for setting the Geometry Editor into draw point mode
   */
  drawPoint: () => void;
  /**
   * A function for setting the Geometry Editor into draw polyline mode
   */
  drawPolyline: () => void;
  /**
   * A function for setting the Geometry Editor to edit the selected shape
   */
  edit: () => void;
  /**
   * A function for setting the Geometry Editor into select single shape mode
   */
  selectSingleShape: () => void;
  /**
   * A function for setting the Geometry Editor into select multiple shapes mode
   */
  selectMultipleShapes: () => void;
  /**
   * A function for undoing the last action of the Geometry Editor
   */
  undo: () => void;
  /**
   * A function for redoing the last action of the Geometry Editor
   */
  redo: () => void;
  /**
   * A function for canceling the last action of the Geometry Editor
   */
  cancel: () => void;
  /**
   * A function for deleting a shape or point the currently selected shape of the Geometry Editor
   */
  deleteShapeOrPoint: () => void;
  /**
   * A function for confirming the last action of the Geometry Editor
   */
  confirm: () => void;
  /**
   * A function for selecting the top shape in the Geometry Editor without having to tap on it
   */
  selectTopShape: () => void;
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
  /**
   * We need to use a MobX observable in a reactive context,
   * which is provided by `autorun`
   * (https://mobx.js.org/reactions.html).
   *
   * Since we don't need the function to run whenever the observable changes
   * in the future, we dispose of the reaction afterwards.
   */
  const dispose = autorun(() => {
    controls = store.controls;
  });
  dispose();

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
  const selectTopShape = useSelectTopShapeControl(controls);
  const undo = useOnPressUndoControl(controls);
  const redo = useOnPressRedoControl(controls);
  const cancel = useOnPressCancelControl(controls);
  const deleteShapeOrPoint = useOnPressDeleteControl(controls);
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
      deleteShapeOrPoint,
      confirm,
      selectTopShape,
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
      deleteShapeOrPoint,
      confirm,
      selectTopShape,
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
