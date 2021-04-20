/**
 * Type declarations for @mapbox/geojsonhint (https://github.com/mapbox/geojsonhint).
 * geojsonhint will never provide them
 * (https://github.com/mapbox/geojsonhint/issues/75)
 */
declare module '@mapbox/geojsonhint/lib/object' {
  export interface Options {
    noDuplicateMembers?: boolean;
    precisionWarning?: boolean;
  }

  export interface ObjectHint {
    message: string;
    level?: 'message';
  }

  export interface StringHint extends ObjectHint {
    line: number;
  }

  export function hint(json: string, options?: Options): Array<StringHint>;
  export function hint(
    json: { [name: string]: any },
    options?: Options
  ): Array<ObjectHint>;
}
