/// <reference path="../../type/geojsonhint.d.ts"/>

import { autorun, runInAction } from 'mobx';
import filter from 'lodash/filter';
import cloneDeep from 'lodash/cloneDeep';
import { hint } from '@mapbox/geojsonhint/lib/object';
import flatten from '@turf/flatten';
import { polygon } from '@turf/helpers';
import type { AllGeoJSON } from '@turf/helpers';
import type { FeatureCollection, Geometry } from 'geojson';

import type { RootModel } from '../../state/RootModel';
import type { EditableFeature, EditableGeometry } from '../../type/geometry';
import type {
  GeometryImportOptions,
  GeometryImportResult,
} from '../../component/geometry/GeometryIO';

/**
 * An error indicating that candidate GeoJSON data is not JSON
 */
export class InvalidJSONError extends Error {
  /**
   * @param message The specific error message
   */
  constructor(message?: string) {
    super(message);
    /**
     * Fix the prototype chain
     * See https://www.typescriptlang.org/docs/handbook/2/classes.html#inheriting-built-in-types
     */
    Object.setPrototypeOf(this, new.target.prototype);
    /**
     * Fix stack trace display
     * See https://joefallon.net/2018/09/typescript-try-catch-finally-and-custom-errors/
     */
    this.name = InvalidJSONError.name;
  }
}

/**
 * An error indicating that candidate GeoJSON data is not well-formed GeoJSON
 */
export class InvalidGeoJSONError extends Error {
  /**
   * @param message The specific error message
   */
  constructor(message?: string) {
    super(message);
    /**
     * Fix the prototype chain
     * See https://www.typescriptlang.org/docs/handbook/2/classes.html#inheriting-built-in-types
     */
    Object.setPrototypeOf(this, new.target.prototype);
    /**
     * Fix stack trace display
     * See https://joefallon.net/2018/09/typescript-try-catch-finally-and-custom-errors/
     */
    this.name = InvalidGeoJSONError.name;
  }
}

/**
 * An error indicating that unexpected geometry was encountered
 */
export class InvalidGeometryError extends Error {
  /**
   * @param message The specific error message
   */
  constructor(message?: string) {
    super(message);
    /**
     * Fix the prototype chain
     * See https://www.typescriptlang.org/docs/handbook/2/classes.html#inheriting-built-in-types
     */
    Object.setPrototypeOf(this, new.target.prototype);
    /**
     * Fix stack trace display
     * See https://joefallon.net/2018/09/typescript-try-catch-finally-and-custom-errors/
     */
    this.name = InvalidGeometryError.name;
  }
}

/**
 * An error indicating that geometry is valid, but is not supported by the library
 */
export class UnsupportedGeometryError extends Error {
  /**
   * @param message The specific error message
   */
  constructor(message?: string) {
    super(message);
    /**
     * Fix the prototype chain
     * See https://www.typescriptlang.org/docs/handbook/2/classes.html#inheriting-built-in-types
     */
    Object.setPrototypeOf(this, new.target.prototype);
    /**
     * Fix stack trace display
     * See https://joefallon.net/2018/09/typescript-try-catch-finally-and-custom-errors/
     */
    this.name = UnsupportedGeometryError.name;
  }
}

/**
 * Errors that can occur when importing geometry
 */
export type GeometryImportError =
  | InvalidJSONError
  | InvalidGeoJSONError
  | InvalidGeometryError
  | UnsupportedGeometryError;

/**
 * Implementation of {@link GeometryIORef.import}, with an additional `store`
 * parameter
 *
 * Refer to the documentation of {@link GeometryIORef.import}.
 *
 * @param store The store that receives the imported geometry
 */
export async function importGeometry(
  store: RootModel,
  features: FeatureCollection,
  options: GeometryImportOptions
): Promise<GeometryImportResult> {
  /**
   * Geometry validation, if enabled
   */
  let validatedFeatures = {
    errors: [] as Array<GeometryImportError>,
    exact: true,
    features: features.features as Array<EditableFeature>,
  };
  if (options.validate) {
    validatedFeatures = await validateAndTransformGeometry(features, options);
  }

  // Copy to eliminate aliasing bugs from sharing data with the caller
  let newFeatures = cloneDeep(validatedFeatures.features);

  /**
   * Inform MobX that this function is updating the state of an observable
   * See https://mobx.js.org/actions.html#asynchronous-actions
   */
  runInAction(() => {
    store.importFeatures(newFeatures, options);
  });

  return {
    errors: validatedFeatures.errors,
    exact: validatedFeatures.exact,
  };
}

/**
 * Validate a GeoJSON feature collection and convert it to an array
 * of features that the library can use.
 *
 * @param features The feature collection
 * @param options Options for customizing the import behaviour
 * @return An object describing the outcome of the import operation.
 */
function validateAndTransformGeometry(
  features: FeatureCollection,
  options: {
    /**
     * Whether non-critical issues should result in thrown exceptions (`true`), or should
     * result in returned errors (`false`). If `false`, not all geometry
     * may be transformed. If `true`, this function will either successfully transform all
     * geometry or will throw an exception.
     */
    strict: boolean;
  }
): Promise<{
  /**
   * Errors processing `features`.
   */
  errors: Array<GeometryImportError>;
  /**
   * If `true`, none of the input GeoJSON features were modified during
   * processing. If `false`, GeoJSON features were subdivided
   * or otherwise altered.
   */
  exact: boolean;
  /**
   * Features that can be used with {@link FeatureModel.importFeatures}
   */
  features: Array<EditableFeature>;
}> {
  try {
    /**
     * Standard GeoJSON validation
     */
    const hints = hint(features);
    if (hints.length > 0) {
      throw new InvalidGeoJSONError(hints[0].message);
    }

    /**
     * Custom geometry validation and transformation
     */
    if (features.type !== 'FeatureCollection') {
      throw new InvalidGeoJSONError('The object is not a FeatureCollection');
    }
    // Convert multi-geometry features to multiple single-geometry features
    let flattenedFeatures = flatten(features as AllGeoJSON);
    let exact = true;
    if (flattenedFeatures.features.length !== features.features.length) {
      exact = false;
    }
    // Geometry type-specific custom validation
    let transformedFeatures = flattenedFeatures.features.map(
      (feature, index) => {
        let geometry = feature.geometry as Geometry;
        switch (geometry.type) {
          case 'GeometryCollection':
          case 'MultiLineString':
          case 'MultiPoint':
          case 'MultiPolygon':
            // These types of geometry should have been subdivided by `flatten()`.
            return {
              feature,
              error: new InvalidGeometryError(
                `Unexpected geometry type, ${geometry.type}, for flattened feature with index ${index}.`
              ),
              canImport: false,
            };
          case 'Point':
          case 'LineString':
            // These features can be used as-is
            return { feature, canImport: true };
          case 'Polygon': {
            // Remove holes from polygons
            if (geometry.coordinates.length > 1) {
              exact = false;
              return {
                feature: polygon(
                  [geometry.coordinates[0]],
                  feature.properties,
                  feature
                ),
                error: new UnsupportedGeometryError(
                  `Holes found in polygon feature with index ${index}.`
                ),
                canImport: true,
              };
            } else {
              return {
                feature,
                canImport: true,
              };
            }
          }
        }
      }
    );

    /**
     * Enforce strictness of custom geometry validation,
     * and produce the list of features that can be imported
     */
    let outputErrors: Array<GeometryImportError> = [];
    if (options.strict) {
      // Don't continue if any feature cannot be imported as-is
      for (let result of transformedFeatures) {
        if (result.error) {
          throw result.error;
        }
      }
    } else {
      // Remove features that cannot be imported, and save errors separately
      outputErrors = filter(
        transformedFeatures,
        (result) => !!result.error
      ).map((result) => result.error as GeometryImportError);
      transformedFeatures = filter(
        transformedFeatures,
        (result) => result.canImport
      );
    }
    const outputFeatures = transformedFeatures.map((result) => result.feature);

    return Promise.resolve({
      errors: outputErrors,
      exact,
      features: outputFeatures,
    });
  } catch (err) {
    return Promise.reject(err);
  }
}

/**
 * Implementation of {@link GeometryIORef.export}, with an additional `store`
 * parameter
 *
 * Refer to the documentation of {@link GeometryIORef.export}.
 *
 * @param store The store that exports the geometry
 */
export async function exportGeometry(
  store: RootModel
): Promise<FeatureCollection<EditableGeometry>> {
  let features: FeatureCollection<EditableGeometry> | null = null;
  /**
   * We need to use a MobX observable in a reactive context,
   * which is provided by `autorun`
   * (https://mobx.js.org/reactions.html).
   *
   * Since we don't need the function to run whenever the observable changes
   * in the future, we dispose of the reaction afterwards.
   */
  const disposer = autorun(() => {
    features = store.geojson;
  });
  disposer();

  if (features) {
    return features;
  } else {
    console.warn('Failed to obtain GeoJSON from the store.');
    return {
      type: 'FeatureCollection',
      features: [],
    };
  }
}
