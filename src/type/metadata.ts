import type { EditableFeature, SemanticGeometryType } from './geometry';
import type { ObjectSchema } from 'yup';

/**
 * Arbitrary data that the client application may store with geometry
 */
export type Metadata = { [name: string]: any };

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
 * A description of a metadata field
 */
export interface FieldDescription {
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
 * Properties controlling how a metadata field is displayed and used
 */
export interface FieldAttributes {
  /**
   * Permissions determining how the user can interact with the field
   */
  permissions: {
    /**
     * Whether the user can create a value when the field is empty
     */
    create: boolean;
    /**
     * Whether the user can edit the field when it is not empty
     */
    edit: boolean;
    /**
     * Whether the user can see the field
     * If `false`, all other permissions have no effect.
     * Overridden by {@link MetadataAttributes.titleFieldKey} when obtaining
     * a title for the object.
     */
    view: boolean;
  };
  /**
   * Whether the field is part of the shortened display (preview)
   * of the metadata
   */
  inPreview: boolean;
  /**
   * Whether the field should be shown even if it has no value
   * This setting is independent from `permissions.create`, which applies
   * to editing, not display.
   */
  showIfEmpty: boolean;
}

/**
 * A metadata field that can be used by the library
 */
export interface DisplayableFieldDescription extends FieldDescription {
  /**
   * The type of data the field contains
   */
  type: FieldType;
  /**
   * Properties controlling how the field is displayed and used
   */
  attributes: FieldAttributes;
}

/**
 * A metadata field that contains enum data
 */
export interface EnumFieldDescription extends DisplayableFieldDescription {
  /**
   * The type of data is restricted to the `FieldType.Enum` type
   */
  type: FieldType.Enum;
  /**
   * The set of possible values for the field
   */
  options: Array<string>;
}

/**
 * A function that generates metadata schemas for existing features
 */
export interface ExistingMetadataSchemaGenerator {
  /**
   * If the function returns `null`, metadata previews
   * will not appear when the user inspects geometry.
   * @param type The semantic type of the geometry (e.g. circle vs. point)
   * @param feature The geometry feature whose metadata is to be viewed or edited
   */
  (type: SemanticGeometryType, feature: EditableFeature): MetadataSchema | null;
}

/**
 * A function that generates metadata schemas for new features
 */
export interface NewMetadataSchemaGenerator {
  /**
   * If the function returns `null`, the metadata creation form will
   * be skipped.
   * @param type The semantic type of the geometry (e.g. circle vs. point)
   *             whose metadata is to be created
   */
  (type: SemanticGeometryType): MetadataSchema | null;
}

/**
 * The set of functions needed to generate metadata schemas for all
 * possible metadata operations.
 */
export interface MetadataSchemaGeneratorMap {
  /**
   * Metadata schema generator for new geometry
   */
  readonly newGeometry: NewMetadataSchemaGenerator;
  /**
   * Metadata schema generator for existing geometry
   */
  readonly existingGeometry: ExistingMetadataSchemaGenerator;
}

/**
 * The value of a field in a metadata editing form
 */
export type MetadataFormFieldValue = string | boolean | undefined;

/**
 * A data structure holding the initial values for
 * the fields of a metadata editing form
 */
export interface MetadataFormInitialValues {
  [name: string]: MetadataFormFieldValue;
}

/**
 * Properties controlling how an entire metadata object is displayed and used
 */
export interface MetadataAttributes {
  /**
   * Permissions determining how the user can interact with the object
   */
  permissions: {
    /**
     * Whether the user can create a value when the object is empty
     */
    create: boolean;
    /**
     * Whether the user can edit a non-empty object
     */
    edit: boolean;
    /**
     * Whether the user can see the object
     * If `false`, all other permissions have no effect.
     */
    view: boolean;
  };
  /**
   * The key of the field that contains the object's "title"
   * Overrides `title`.
   * This setting also overrides {@link FieldAttributes} permissions that
   * would not allow the field to be viewed for other purposes.
   */
  titleFieldKey?: string;
  /**
   * The object's "title", if not provided by a field value.
   * Overridden by `titleFieldKey`
   */
  title: string;
  /**
   * Whether the object should be shown even if it has no value
   * This setting is independent from `permissions.create`, which applies
   * to editing, not display.
   */
  showIfEmpty: boolean;
}

/**
 * A metadata form field description
 */
export type MetadataFormFieldDescription =
  | DisplayableFieldDescription
  | EnumFieldDescription;

/**
 * A list of metadata form field descriptions used to build
 * the body of a form
 */
export type MetadataFormFieldList = Array<MetadataFormFieldDescription>;

/**
 * A description of a metadata form
 */
export interface MetadataFormStructure {
  /**
   * Properties controlling how the metadata is displayed and used
   */
  attributes: MetadataAttributes;
  /**
   * Descriptions of individual fields
   */
  fields: MetadataFormFieldList;
}

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
  dataErrors?: Error;
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
 * a Formik form for metadata editing, or a form for metadata display
 */
export interface MetadataFormStarter {
  /**
   * Initial form field values, which can be passed to Formik.
   * The values may not pass the form's schema validation, but are type safe,
   * as described in the documentation of the `dataErrors` property.
   */
  formValues: MetadataFormInitialValues;
  /**
   * Data needed to construct the form fields
   */
  formStructure: MetadataFormStructure;
  /**
   * The live schema object to be used for form validation by Formik.
   */
  schema: ObjectSchema<Record<string, any>>;
}

/**
 * All data from processing a metadata schema description, including errors
 * encountered during processing
 */
export interface MetadataFormStarterWithErrors extends MetadataFormStarter {
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
}

/**
 * Types of interactions with metadata, used in permissions
 * enforcement functions
 */
export enum MetadataInteraction {
  /**
   * Create metadata for new geometry
   */
  Create = 'CREATE',
  /**
   * Update metadata of existing geometry
   */
  Edit = 'EDIT',
  /**
   * View full metadata for existing geometry
   */
  ViewDetails = 'VIEW_DETAILS',
  /**
   * View an abbreviated version of metadata for existing geometry
   */
  ViewPreview = 'VIEW_PREVIEW',
}
