import React, { forwardRef, useContext, useImperativeHandle } from 'react';
import type { FeatureCollection } from 'geojson';

import { StoreContext } from '../../state/StoreContext';
import { importGeometry } from '../../util/geometry/io';
import type { GeometryImportError } from '../../util/geometry/io';

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
  export: () => Promise<FeatureCollection>;
}

/**
 * A component that exposes a React ref with methods for importing
 * and exporting GeoJSON feature collections.
 *
 * @param props Render properties
 * @param ref React ref to which import and export methods are attached
 */
function GeometryIOComponent(
  { children }: { readonly children?: React.ReactNode },
  ref: React.Ref<GeometryIORef>
) {
  const store = useContext(StoreContext);

  useImperativeHandle(
    ref,
    (): GeometryIORef => ({
      import: (features: FeatureCollection, options: GeometryImportOptions) =>
        importGeometry(store, features, options),
      export: async () => {
        return {
          type: 'FeatureCollection',
          features: [],
        };
      },
    }),
    [store]
  );
  /**
   * This component has nothing meaningful to render, and is just used to integrate
   * some imperative code with React.
   */
  return <>{children}</>;
}

/**
 * Renderable version of [[GeometryIOComponent]]
 *
 * Note: This line is needed because `useImperativeHandle()`
 * and `forwardRef()` should be used together
 * (https://reactjs.org/docs/hooks-reference.html#useimperativehandle)
 */
export const GeometryIO = forwardRef(GeometryIOComponent);
