import * as yup from 'yup';
import { transformAll } from '@demvsystems/yup-ast';
import reduce from 'lodash/reduce';

import type { EditableFeature } from '../type/geometry';
import { FieldType } from '../type/metadata';
import type {
  EnumFieldDescription,
  FieldDescription,
  MetadataFormStarter,
  MetadataSchema,
  MetadataValidationResult,
} from '../type/metadata';

/**
 * The default metadata schema generation function
 * @return A schema description to be parsed by `yup-ast`
 */
export function defaultMetadataSchemaGenerator(
  _feature: EditableFeature
): MetadataSchema | null {
  return [
    ['yup.object'],
    ['yup.required'],
    [
      'yup.shape',
      {
        comment: [['yup.string'], ['yup.optional']],
      },
    ],
  ];
}

/**
 * Validate a metadata schema description generated by a
 * [[MetadataSchemaGenerator]] and prepare corresponding starter
 * data for creating a metadata editing form.
 *
 * The returned [[MetadataFormStarter]] includes a description of the fields
 * of the metadata editing form corresponding to `schemaDescription`.
 * Only the parts of `schemaDescription` that were understood by the library
 * will be present as form fields.
 *
 * If `initialData` is passed, a version of it will be output
 * that at least satisfies the data types of the metadata form fields,
 * but which may not satisfy further constraints on field values.
 * This version would be used to initialize metadata editing form fields.
 *
 * If `schemaDescription` is `null` or `undefined`, no errors will be output.
 *
 * @param schemaDescription A schema description, presently interpreted
 *                          by [`require('@demvsystems/yup-ast').transformAll()`](https://github.com/demvsystems/yup-ast)
 *                          and then filtered to the available metadata form field types
 *                          provided by this library. Only schemas that allow for synchronous
 *                          data validation are supported.
 * @param initialData Initial metadata that the caller intends to have edited
 *                    with respect to the structure given by `schemaDescription`
 * @return An object containing any errors and preliminary form field descriptions and values
 */
export function makeMetadataFormStarter(
  schemaDescription: MetadataSchema | null | undefined,
  initialData?: { [name: string]: any } | null | undefined
): MetadataFormStarter {
  /**
   * Initialize return values
   */
  let formValues: { [name: string]: string | boolean } = {};
  let formFieldList: Array<FieldDescription | EnumFieldDescription> = [];
  let dataErrors: Array<string> = [];
  let schemaErrors: Array<string> = [];

  /**
   * Parse the schema description into a schema object
   */
  let schema = yup.object().shape({});
  if (schemaDescription) {
    try {
      schema = transformAll(schemaDescription);
    } catch (err) {
      schemaErrors.push('Schema parsing error: ' + err.toString());
    }
  }

  /**
   * Global validation of the schema object
   */
  const serialized = schema.describe();
  const expectedType = 'object';
  if (serialized.type !== expectedType) {
    schemaErrors.push(
      `Schema has a type of ${serialized.type}, not ${expectedType}.`
    );
    return { formValues, formFieldList, schemaErrors, schema };
  }

  /**
   * Create a non-null version of the input data to process
   */
  let data: { [name: string]: any } = {};
  if (initialData) {
    data = initialData;
  }

  /**
   * Iterate over schema fields and convert them into form field descriptions.
   * At the same time, extract initial form field values from the input data.
   */
  const result = reduce(
    serialized.fields,
    (prev, value, key) => {
      /**
       * Initialize form field description and placeholder value
       * Use a custom field label if provided
       */
      let label = key;
      if ('label' in value && value.label) {
        label = value.label;
      }
      let formElement: FieldDescription | EnumFieldDescription = {
        type: FieldType.String,
        key,
        label,
      };
      let initialValue: string | boolean = '';

      /**
       * Refine form field description and value based on the type of field
       */
      switch (value.type as FieldType) {
        case FieldType.Boolean: {
          formElement.type = value.type as FieldType;
          try {
            initialValue = yup.boolean().required().validateSync(data[key]);
          } catch (err) {
            initialValue = false;
            prev.dataErrors.push(
              `Data under key '${key}' could not be parsed as a boolean.`
            );
          }
          break;
        }
        case FieldType.Enum: {
          /**
           * Require that all enum fields have possible values that are strings,
           * and that there is at least one possible value
           *
           * There seem to be multiple ways in which these constraints can be
           * encoded in the schema, so look for all known encodings.
           */
          let options: Array<string> = [];
          if ('oneOf' in value) {
            options = ((value as unknown) as { oneOf: Array<string> }).oneOf;
          } else {
            /**
             * Ideally it would be possible to get this information from public members
             */
            const set = (schema as any)?.fields?.[key]?._whitelist?.list;
            try {
              options = Array.from(set);
            } catch (err) {
              prev.schemaErrors.push(
                `Field of type, '${value.type}', under name '${key}' is not an enumeration.`
              );
              // Don't output this field
              return prev;
            }
          }
          if (
            yup.array().of(yup.string().required()).min(1).isValidSync(options)
          ) {
            if (options.includes(data[key])) {
              initialValue = data[key];
            } else {
              prev.dataErrors.push(
                `Data under key '${key}' does not have one of the possible options in ${options}.`
              );
              initialValue = options[0];
            }
            formElement.type = value.type as FieldType;
            ((formElement as unknown) as EnumFieldDescription).options = options;
          } else {
            prev.schemaErrors.push(
              `Field of type, '${value.type}', under name '${key}' is not an enumeration of string values.`
            );
            // Don't output this field
            return prev;
          }
          break;
        }
        case FieldType.Number: {
          formElement.type = value.type as FieldType;
          try {
            /**
             * Numeric fields will be implemented as string fields in the metadata editor form
             */
            initialValue = yup
              .number()
              .required()
              .validateSync(data[key])
              .toString();
          } catch (err) {
            prev.dataErrors.push(
              `Data under key '${key}' could not be parsed as a number.`
            );
          }
          break;
        }
        case FieldType.String: {
          formElement.type = value.type as FieldType;
          try {
            initialValue = yup.string().required().validateSync(data[key]);
          } catch (err) {
            prev.dataErrors.push(
              `Data under key '${key}' could not be parsed as a string.`
            );
          }
          break;
        }
        default:
          prev.schemaErrors.push(
            `Unrecognized field type, '${value.type}', under name '${key}'.`
          );
          // Don't output this field
          return prev;
      }
      prev.formFieldList.push(formElement);
      prev.formValues[key] = initialValue;
      return prev;
    },
    { formValues, formFieldList, schemaErrors, dataErrors }
  );

  /**
   * Only output error properties if there were errors
   */
  let finalResult: MetadataFormStarter = {
    formValues: result.formValues,
    formFieldList: result.formFieldList,
    schema,
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
 * [[MetadataSchemaGenerator]], and compare any input candidate
 * metadata object to the schema.
 *
 * The returned [[MetadataValidationResult]] has a `schemaErrors` property
 * that indicates whether any parts of `schemaDescription` are not supported
 * or could not be parsed. `schemaErrors` is not defined when there are
 * no errors. `schemaErrors` is an array of string error messages.
 *
 * The returned [[MetadataValidationResult]] has a `dataErrors` property (absent if
 * `data` is not defined) that exists when there are incompatibilities
 * between the parsed version of `schemaDescription` and the candidate metadata
 * object `data`.
 *
 * @param schemaDescription A schema description, presently interpreted
 *                          by [`require('@demvsystems/yup-ast').transformAll()`](https://github.com/demvsystems/yup-ast)
 *                          and then filtered to the available metadata form field types
 *                          provided by this library. Only schemas that allow for synchronous
 *                          data validation are supported.
 * @param data Any data that the caller wishes to have validated with respect
 *             to `schemaDescription`
 * @return An object containing any schema or data errors
 */
export function validateMetadata(
  schemaDescription: MetadataSchema,
  data: { [name: string]: any } | null | undefined
): MetadataValidationResult {
  const { schemaErrors, schema } = makeMetadataFormStarter(schemaDescription);
  const result: MetadataValidationResult = { schemaErrors };
  if (data) {
    try {
      schema.validateSync(data);
    } catch (err) {
      result.dataErrors = err;
    }
  }
  return result;
}
