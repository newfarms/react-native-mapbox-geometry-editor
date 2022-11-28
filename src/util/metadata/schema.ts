import * as yup from 'yup';
import { transformAll } from '@demvsystems/yup-ast';
import reduce from 'lodash/reduce';

import type {
  EditableFeature,
  SemanticGeometryType,
} from '../../type/geometry';
import { FieldType } from '../../type/metadata';
import type {
  EnumFieldDescription,
  FieldAttributes,
  Metadata,
  MetadataAttributes,
  MetadataFormFieldDescription,
  MetadataFormFieldList,
  MetadataFormFieldValue,
  MetadataFormInitialValues,
  MetadataFormStarterWithErrors,
  MetadataSchema,
  MetadataSchemaGeneratorMap,
  MetadataValidationResult,
} from '../../type/metadata';

/**
 * The default schema for geometry metadata, used if no schema
 * generator is provided by the client application.
 */
const defaultMetadataSchema = [
  ['yup.object'],
  ['yup.required'],
  [
    'yup.shape',
    {
      comment: [['yup.string'], ['yup.optional']],
    },
  ],
];

/**
 * The default metadata schema generation function for new geometry
 * @param type The semantic type of the geometry (e.g. circle vs. point)
 * @return A schema description to be parsed by `yup-ast`
 */
function defaultNewMetadataSchemaGenerator(
  _type: SemanticGeometryType
): MetadataSchema | null {
  return defaultMetadataSchema;
}

/**
 * The default metadata schema generation function for existing geometry
 * @param type The semantic type of the geometry (e.g. circle vs. point)
   @param feature The geometry feature whose metadata is to be viewed or edited
 * @return A schema description to be parsed by `yup-ast`
 */
function defaultExistingMetadataSchemaGenerator(
  _type: SemanticGeometryType,
  _feature: EditableFeature
): MetadataSchema | null {
  return defaultMetadataSchema;
}

/**
 * The default set of functions used to produce metadata schemas
 */
export const defaultMetadataSchemaGeneratorMap: MetadataSchemaGeneratorMap = {
  /**
   * Default schema generator for new geometry
   */
  newGeometry: defaultNewMetadataSchemaGenerator,
  /**
   * Default schema generator for existing geometry
   */
  existingGeometry: defaultExistingMetadataSchemaGenerator,
};

/**
 * Parse a schema description to produce a Yup schema
 *
 * @param schemaDescription A schema description to be parsed by `yup-ast`
 * @param schemaErrors An array of error messages that this function may append to
 * @return The schema corresponding to the schema description,
 *         or an empty schema if the description is invalid.
 */
function parseSchemaDescription(
  schemaDescription: MetadataSchema | null | undefined,
  schemaErrors: Array<string>
) {
  let schema = yup.object().shape({});
  if (schemaDescription) {
    try {
      schema = transformAll(schemaDescription);
    } catch (err) {
      if (err instanceof Error) {
        schemaErrors.push('Schema parsing error: ' + err.toString());
      } else {
        throw err;
      }
    }
  }
  return schema;
}

/**
 * Implementation of {@link MetadataAttributes} used to create
 * objects with default attributes, and to validate existing objects
 */
const metadataAttributesImpl: yup.SchemaOf<MetadataAttributes> = yup
  .object()
  .optional()
  .shape({
    permissions: yup
      .object()
      .optional()
      .shape({
        create: yup.boolean().optional().default(true),
        edit: yup.boolean().optional().default(true),
        view: yup.boolean().optional().default(true),
      })
      .default({
        create: true,
        edit: true,
        view: true,
      }),
    titleFieldKey: yup.string().optional(),
    title: yup.string().optional().default('Details'),
    showIfEmpty: yup.boolean().optional().default(true),
  });

/**
 * Extract information about a schema as a whole.
 *
 * Throws an exception if the schema is invalid.
 * Error messages are added to `schemaErrors` instead of carried
 * in the thrown exception.
 * @param schema The schema to inspect
 * @param schemaErrors An array of error messages that this function may append to
 * @typeParam T The type of the schema
 * @return Meta fields of the schema
 */
function processSchemaRoot<T extends yup.BaseSchema>(
  schema: T,
  schemaErrors: Array<string>
): MetadataAttributes {
  const expectedType = 'object';
  if (schema.type !== expectedType) {
    schemaErrors.push(
      `Schema has a type of ${schema.type}, not ${expectedType}.`
    );
    throw new Error();
  }
  let attributes = metadataAttributesImpl.cast(undefined);
  try {
    attributes = metadataAttributesImpl.cast((schema as any)._meta);
  } catch (err) {
    if (err instanceof Error) {
      schemaErrors.push(
        `Schema meta attribute is malformed: ${err.toString()}.`
      );
    } else {
      throw err;
    }
  }
  return attributes as MetadataAttributes;
}

/**
 * Implementation of {@link FieldAttributes} used to create
 * objects with default attributes, and to validate existing objects
 */
const fieldAttributesImpl: yup.SchemaOf<FieldAttributes> = yup
  .object()
  .optional()
  .shape({
    permissions: yup
      .object()
      .optional()
      .shape({
        create: yup.boolean().optional().default(true),
        edit: yup.boolean().optional().default(true),
        view: yup.boolean().optional().default(true),
      })
      .default({
        create: true,
        edit: true,
        view: true,
      }),
    inPreview: yup.boolean().optional().default(false),
    showIfEmpty: yup.boolean().optional().default(false),
  });

/**
 * Initialize a field description with meta information
 * from a schema field object.
 *
 * @param schemaField The schema field
 * @param key The field's key
 * @param schemaErrors An array of error messages that this function may append to
 */
function extractFieldMetadata(
  schemaField: any,
  key: string,
  schemaErrors: Array<string>
): MetadataFormFieldDescription {
  /**
   * Get the custom field label if one is provided
   */
  let label = key;
  if (schemaField._label) {
    label = schemaField._label;
  }
  let attributes = fieldAttributesImpl.cast(undefined);
  try {
    attributes = fieldAttributesImpl.cast(schemaField._meta);
  } catch (err) {
    if (err instanceof Error) {
      schemaErrors.push(
        `Schema field "${key}" meta attribute is malformed: ${err.toString()}.`
      );
    } else {
      throw err;
    }
  }
  return {
    type: FieldType.String,
    key,
    label,
    attributes: attributes as FieldAttributes,
  };
}

/**
 * Look up a boolean-typed field from a schema in a data object,
 * to obtain an initial value for editing the data object
 * with respect to the field.
 *
 * @param key The field's key
 * @param data An object to be examined with respect to the schema
 * @param dataErrors An array of error messages that this function may append to
 * @return The value of the field from the object, or a default value
 */
function processBooleanSchemaField(
  key: string,
  data: Metadata,
  dataErrors: Array<string>
) {
  let initialValue = false;
  try {
    initialValue = yup.boolean().required().validateSync(data[key]);
  } catch (err) {
    dataErrors.push(
      `Data under key '${key}' could not be parsed as a boolean.`
    );
  }
  return initialValue;
}

/**
 * Look up an enum-typed field from a schema in a data object,
 * to obtain an initial value for editing the data object
 * with respect to the field. Also validate the schema field.
 *
 * Throws an exception if the schema field is invalid.
 * Error messages are added to `schemaErrors` instead of carried
 * in the thrown exception.
 *
 * @param schemaField The schema field
 * @param key The field's key
 * @param data An object to be examined with respect to the schema
 * @param dataErrors An array of error messages pertaining to `data` that this function may append to
 * @param schemaErrors An array of error messages pertaining to the schema that this function may append to
 * @return The field enum options and an initial value for the field from either `data` or a default value.
 */
function processEnumSchemaField(
  schemaField: any,
  key: string,
  data: Metadata,
  dataErrors: Array<string>,
  schemaErrors: Array<string>
): {
  /**
   * The possible values of the enum field
   */
  options: Array<string>;
  /**
   * An initial value for the enum field. If `data` does not have an appropriate
   * value, the first element of `options` is used instead.
   */
  initialValue: string;
} {
  /**
   * Require that all enum fields have possible values that are strings,
   * and that there is at least one possible value.
   */
  let options: Array<string> = []; // Set of possible enum values
  const set = schemaField._whitelist?.list;
  try {
    options = Array.from(set);
  } catch (err) {
    schemaErrors.push(
      `Field of type, '${schemaField.type}', under name '${key}' is not an enumeration.`
    );
    throw new Error();
  }
  if (yup.array().of(yup.string().required()).min(1).isValidSync(options)) {
    // The field is valid, now inspect the data object
    let initialValue = options[0]; // We ensured above that there is at least one element
    if (options.includes(data[key])) {
      initialValue = data[key];
    } else {
      dataErrors.push(
        `Data under key '${key}' does not have one of the possible options in ${options}.`
      );
    }
    return {
      options,
      initialValue,
    };
  } else {
    schemaErrors.push(
      `Field of type, '${schemaField.type}', under name '${key}' is not an enumeration of string values.`
    );
    throw new Error();
  }
}

/**
 * Look up a number-typed field from a schema in a data object,
 * to obtain an initial value for editing the data object
 * with respect to the field.
 *
 * @param key The field's key
 * @param data An object to be examined with respect to the schema
 * @param dataErrors An array of error messages that this function may append to
 * @return The value of the field from the object, or a default value
 */
function processNumberSchemaField(
  key: string,
  data: Metadata,
  dataErrors: Array<string>
) {
  try {
    /**
     * Numeric fields will be implemented as string fields in the metadata editor,
     * so the result is a string
     */
    return yup.number().required().validateSync(data[key]).toString();
  } catch (err) {
    dataErrors.push(`Data under key '${key}' could not be parsed as a number.`);
    return undefined;
  }
}

/**
 * Look up a string-typed field from a schema in a data object,
 * to obtain an initial value for editing the data object
 * with respect to the field.
 *
 * @param key The field's key
 * @param data An object to be examined with respect to the schema
 * @param dataErrors An array of error messages that this function may append to
 * @return The value of the field from the object, or a default value
 */
function processStringSchemaField(
  key: string,
  data: Metadata,
  dataErrors: Array<string>
) {
  try {
    return yup.string().required().validateSync(data[key]);
  } catch (err) {
    dataErrors.push(`Data under key '${key}' could not be parsed as a string.`);
    return '';
  }
}

/**
 * A reduce operation callback for processing a schema field to extract
 * field meta information, validating the schema field, and inspecting
 * a data object with respect to the field.
 *
 * @param prev The reduce operation accumulator
 * @param schemaField The schema field
 * @param key The field's key
 * @return The reduce operation accumulator
 */
function schemaFieldIteratee(
  prev: {
    /**
     * Values extracted from `data` for the schema fields
     */
    formValues: MetadataFormInitialValues;
    /**
     * Descriptions of the schema fields used to build forms
     * for displaying and editing data according to the schema
     */
    formFieldList: MetadataFormFieldList;
    /**
     * An array of error messages pertaining to `data` that this function may append to
     */
    dataErrors: Array<string>;
    /**
     * An array of error messages pertaining to the schema that this function may append to
     */
    schemaErrors: Array<string>;
    /**
     * An object to be validated, displayed, or edited with respect to the schema
     */
    data: Metadata;
  },
  schemaField: any,
  key: string
) {
  // Initialize the output description of the field
  let formElement = extractFieldMetadata(schemaField, key, prev.schemaErrors);

  /**
   * Refine form field description and value based on the type of field
   */
  try {
    let initialValue: MetadataFormFieldValue = '';
    switch (schemaField.type as FieldType) {
      case FieldType.Boolean: {
        initialValue = processBooleanSchemaField(
          key,
          prev.data,
          prev.dataErrors
        );
        break;
      }
      case FieldType.Enum: {
        const result = processEnumSchemaField(
          schemaField,
          key,
          prev.data,
          prev.dataErrors,
          prev.schemaErrors
        );
        initialValue = result.initialValue;
        (formElement as unknown as EnumFieldDescription).options =
          result.options;
        break;
      }
      case FieldType.Number: {
        initialValue = processNumberSchemaField(
          key,
          prev.data,
          prev.dataErrors
        );
        break;
      }
      case FieldType.String: {
        initialValue = processStringSchemaField(
          key,
          prev.data,
          prev.dataErrors
        );
        break;
      }
      default:
        prev.schemaErrors.push(
          `Unrecognized field type, '${schemaField.type}', under name '${key}'.`
        );
        throw new Error();
    }
    formElement.type = schemaField.type as FieldType;

    // Save the results
    prev.formFieldList.push(formElement);
    prev.formValues[key] = initialValue;
  } catch (err) {
    // Discard the results as an exception indicates that the schema field is not usable
  }
  return prev;
}

/**
 * Process schema fields to extract field meta information, validate the fields,
 * and inspect a data object with respect to the fields.
 * @param schema The schema
 * @param initialData An optional data object to extract values from with respect to the schema
 * @param schemaErrors An array of error messages pertaining to the schema that this function may append to
 * @param dataErrors An array of error messages pertaining `initialData` that this function may append to
 * @typeParam T The type of object represented by `schema`
 * @return Data structures representing both the schema and the data object that can be used to build forms
 */
function processSchemaFields<T extends Record<string, any>>(
  schema: yup.ObjectSchema<T>,
  initialData: Metadata | null | undefined,
  schemaErrors: Array<string>,
  dataErrors: Array<string>
): {
  /**
   * Values extracted from `initialData`, or default values,
   * that correspond to `schema`
   */
  formValues: MetadataFormInitialValues;
  /**
   * Information about `schema` that can be used to build a form representing `schema`
   */
  formFieldList: MetadataFormFieldList;
} {
  /**
   * Create a non-null version of the input data to process
   */
  let data: Metadata = {};
  if (initialData) {
    data = initialData;
  }

  /**
   * Iterate over schema fields and convert them into form field descriptions.
   * At the same time, extract initial form field values from the input data.
   */
  let accumulator: {
    formValues: MetadataFormInitialValues;
    formFieldList: MetadataFormFieldList;
    dataErrors: Array<string>;
    schemaErrors: Array<string>;
    data: Metadata;
  } = {
    formValues: {},
    formFieldList: [],
    dataErrors,
    schemaErrors,
    data,
  };
  const result = reduce(schema.fields, schemaFieldIteratee, accumulator);
  return {
    formValues: result.formValues,
    formFieldList: result.formFieldList,
  };
}

/**
 * Validate a metadata schema description generated by a
 * {@link MetadataSchemaGeneratorMap} function and prepare corresponding starter data
 * for creating a metadata editing form.
 *
 * The returned {@link MetadataFormStarterWithErrors} includes a description of the fields
 * of the metadata editing form corresponding to `schemaDescription`.
 * Only the parts of `schemaDescription` that were understood by the library
 * will be present as form fields.
 *
 * If `initialData` is passed, a version of it will be output
 * that at least satisfies the data types of the metadata form fields,
 * but which may not satisfy further constraints on field values.
 * This version can be used to initialize metadata editing form fields.
 *
 * Note that, if `schemaDescription` is `null` or `undefined`,
 * no errors will be output in the returned object.
 *
 * @param schemaDescription A schema description, presently interpreted
 *                          by [`require('@demvsystems/yup-ast').transformAll()`](https://github.com/demvsystems/yup-ast)
 *                          and then filtered to the available metadata form field types
 *                          provided by this library. Only schemas that allow for synchronous
 *                          data validation are currently supported.
 * @param initialData Initial metadata that the caller intends to have edited
 *                    with respect to the structure given by `schemaDescription`
 * @return An object containing any errors and preliminary form field descriptions and values
 */
export function makeMetadataFormStarter(
  schemaDescription: MetadataSchema | null | undefined,
  initialData?: Metadata | null | undefined
): MetadataFormStarterWithErrors {
  /**
   * Initialize a placeholder result
   */
  const result: Required<MetadataFormStarterWithErrors> = {
    formValues: {},
    formStructure: {
      attributes: metadataAttributesImpl.cast(undefined) as MetadataAttributes,
      fields: [],
    },
    schema: yup.object().shape({}),
    schemaErrors: [],
    dataErrors: [],
  };

  /**
   * Parse the schema description into a schema object
   */
  result.schema = parseSchemaDescription(
    schemaDescription,
    result.schemaErrors
  );

  /**
   * Top-level validation and inspection of the schema object
   */
  try {
    result.formStructure.attributes = processSchemaRoot(
      result.schema,
      result.schemaErrors
    );
  } catch (err) {
    return result;
  }

  /**
   * Field-level validation and inspection of the schema object
   * Also inspect the data object
   */
  const fieldsResult = processSchemaFields(
    result.schema,
    initialData,
    result.schemaErrors,
    result.dataErrors
  );
  result.formStructure.fields = fieldsResult.formFieldList;
  result.formValues = fieldsResult.formValues;

  /**
   * Only output error properties if there were errors
   */
  let finalResult: MetadataFormStarterWithErrors = {
    formValues: result.formValues,
    formStructure: result.formStructure,
    schema: result.schema,
  };
  if (result.dataErrors.length > 0) {
    finalResult.dataErrors = result.dataErrors;
  }
  if (result.schemaErrors.length > 0) {
    finalResult.schemaErrors = result.schemaErrors;
  }
  return finalResult;
}

/**
 * Validate a metadata schema description generated by a
 * {@link MetadataSchemaGeneratorMap} function, and compare any input candidate
 * metadata object to the schema.
 *
 * The returned {@link MetadataValidationResult} has a `schemaErrors` property
 * that indicates whether any parts of `schemaDescription` are not supported
 * or could not be parsed. `schemaErrors` is not defined when there are
 * no errors. `schemaErrors` is an array of string error messages.
 *
 * The returned {@link MetadataValidationResult} has a `dataErrors` property (absent if
 * `data` is not defined) that exists when there are incompatibilities
 * between the parsed version of `schemaDescription` and the candidate metadata
 * object `data`.
 *
 * @param schemaDescription A schema description, presently interpreted
 *                          by [`require('@demvsystems/yup-ast').transformAll()`](https://github.com/demvsystems/yup-ast)
 *                          and then filtered to the available metadata form field types
 *                          provided by this library. Only schemas that allow for synchronous
 *                          data validation are currently supported.
 * @param data Any data that the caller wishes to have validated with respect
 *             to `schemaDescription`
 * @return An object containing any schema or data errors
 */
export function validateMetadata(
  schemaDescription: MetadataSchema,
  data: Metadata | null | undefined
): MetadataValidationResult {
  const { schemaErrors, schema } = makeMetadataFormStarter(schemaDescription);
  const result: MetadataValidationResult = { schemaErrors };
  if (data) {
    try {
      schema.validateSync(data);
    } catch (err) {
      if (err instanceof Error) {
        result.dataErrors = err;
      } else {
        throw err;
      }
    }
  }
  return result;
}
