import React, { forwardRef, useImperativeHandle } from 'react';

/**
 * Methods for importing and exporting GeoJSON feature collections
 */
export interface GeometryIORef {
  /**
   * A function for importing a GeoJSON feature collection
   *
   * @param features The feature collection (TODO)
   * @param replace Whether the features should be added to (`false`), or replace (`true`),
   *                the features currently being managed by the library. (TODO)
   * @return An object describing any errors importing the features. (TODO)
   */
  import: () => void;
  /**
   * A function for exporting a GeoJSON feature collection
   *
   * @return The feature collection (TODO)
   */
  export: () => void;
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
  useImperativeHandle(
    ref,
    () => ({
      import: () => {
        console.log('import() called in geometry library.');
      },
      export: () => {
        console.log('export() called in geometry library.');
      },
    }),
    []
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
