export class InvalidJSONError extends Error {
  constructor(message?: string) {
    super(message);
    /**
     * Fix the prototype chain
     * See https://www.typescriptlang.org/docs/handbook/2/classes.html#inheriting-built-in-types
     */
    //
    Object.setPrototypeOf(this, new.target.prototype);
    /**
     * Fix stack trace display
     * See https://joefallon.net/2018/09/typescript-try-catch-finally-and-custom-errors/
     */
    this.name = InvalidJSONError.name;
  }
}

export class InvalidGeoJSONError extends Error {
  constructor(message?: string) {
    super(message);
    /**
     * Fix the prototype chain
     * See https://www.typescriptlang.org/docs/handbook/2/classes.html#inheriting-built-in-types
     */
    //
    Object.setPrototypeOf(this, new.target.prototype);
    /**
     * Fix stack trace display
     * See https://joefallon.net/2018/09/typescript-try-catch-finally-and-custom-errors/
     */
    this.name = InvalidGeoJSONError.name;
  }
}

export class InvalidGeometryError extends Error {
  constructor(message?: string) {
    super(message);
    /**
     * Fix the prototype chain
     * See https://www.typescriptlang.org/docs/handbook/2/classes.html#inheriting-built-in-types
     */
    //
    Object.setPrototypeOf(this, new.target.prototype);
    /**
     * Fix stack trace display
     * See https://joefallon.net/2018/09/typescript-try-catch-finally-and-custom-errors/
     */
    this.name = InvalidGeometryError.name;
  }
}

export class UnsupportedGeometryError extends Error {
  constructor(message?: string) {
    super(message);
    /**
     * Fix the prototype chain
     * See https://www.typescriptlang.org/docs/handbook/2/classes.html#inheriting-built-in-types
     */
    //
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
