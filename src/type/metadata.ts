import type { EditableFeature } from './geometry';
import type { BaseSchema, ValidationError } from 'yup';

/**
 * A serialized metadata schema to be deserialized into a live schema object.
 */
export type MetadataSchema = any[];

/**
 * Supported datatypes for interactive metadata editing
 */
export enum FieldType {
  /**
   * Boolean field (e.g. switch user interface element)
   */
  Boolean = 'boolean',
  /**
   * A field with a set of possible values (e.g. dropdown select)
   */
  Enum = 'mixed',
  /**
   * Number field (e.g. text field with a numeric keyboard)
   */
  Number = 'number',
  /**
   * String field (e.g. text field)
   */
  String = 'string',
}

/**
 * A description of a metadata editing form field
 */
export interface FieldDescription {
  /**
   * The type of data the field will edit
   */
  type: FieldType;
  /**
   * The field key
   */
  key: string;
  /**
   * The field name (label)
   */
  label: string;
}

/**
 * A description of a metadata editing form field for enum data
 */
export interface EnumFieldDescription extends FieldDescription {
  /**
   * The type of data the field will edit (restricted to the `FieldType.Enum` type)
   */
  type: FieldType.Enum;
  /**
   * The set of possible values for the field
   */
  options: Array<string>;
}

/**
 * A function that generates metadata schemas
 */
export interface MetadataSchemaGenerator {
  /**
   * If the function returns `null`, the metadata editing form will
   * state that there is no metadata that can be edited.
   * @param feature The geometry feature whose metadata is to be edited
   */
  (feature: EditableFeature): MetadataSchema | null;
}

/**
 * A data structure holding the initial values for
 * the fields of a metadata editing form
 */
export interface MetadataFormValues {
  [name: string]: string | boolean;
}

/**
 * A list of metadata editing form field descriptions used to build
 * the body of the form
 */
export type MetadataFormStructure = Array<
  FieldDescription | EnumFieldDescription
>;

/**
 * The result of testing a metadata schema description and any
 * candidate metadata object
 */
export interface MetadataValidationResult {
  /**
   * Errors describing inconsistencies between the live schema object, generated
   * from the schema description, and a candidate metadata object.
   *
   * Note that the live schema object may not correspond to the intended schema,
   * in the case where `schemaErrors` is not empty.
   *
   * If there are no errors, `dataErrors` is undefined.
   */
  dataErrors?: ValidationError;
  /**
   * Errors emitted while converting the metadata schema description into
   * a live schema object.
   *
   * If there are no errors, `schemaErrors` is undefined.
   */
  schemaErrors?: Array<string>;
}

/**
 * All data from processing a metadata schema description, needed to create
 * a Formik form for metadata editing.
 */
export interface MetadataFormStarter {
  /**
   * Initial form field values to be passed to Formik.
   * The values may not pass the form's schema validation, but are type safe,
   * as described in the documentation of the `dataErrors` property.
   */
  formValues: MetadataFormValues;
  /**
   * Data needed to construct the form fields
   */
  formFieldList: MetadataFormStructure;
  /**
   * Any errors emitted while creating `formValues` from existing geometry metadata.
   * These errors are type errors only, and do not describe non-type constraints
   * on the form fields, which will be shown to the user as visible error messages
   * surrounding form fields after the form is created.
   *
   * If there are no errors, `dataErrors` is undefined.
   *
   * This property is presently used only for debugging purposes.
   */
  dataErrors?: Array<string>;
  /**
   * Errors emitted while converting a metadata schema description into
   * a live schema object for the form.
   *
   * If there are no errors, `schemaErrors` is undefined.
   */
  schemaErrors?: Array<string>;
  /**
   * The live schema object to be used for form validation by Formik.
   */
  schema: BaseSchema;
}
