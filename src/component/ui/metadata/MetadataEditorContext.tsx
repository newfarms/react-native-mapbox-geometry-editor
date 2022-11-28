import { createContext } from 'react';
import * as yup from 'yup';
import type { FormikProps } from 'formik';

import { MetadataInteraction } from '../../../type/metadata';
import type {
  Metadata,
  MetadataFormInitialValues,
  MetadataFormStarter,
} from '../../../type/metadata';

/**
 * State needed to display a form for editing geometry metadata
 */
export interface MetadataEditorContextValue {
  /**
   * Formik form state
   */
  formik: FormikProps<MetadataFormInitialValues>;
  /**
   * Additional data beyond the Formik form state
   */
  extraData: {
    /**
     * The source data from which the Formik form state is derived
     */
    formStarter: MetadataFormStarter;
    /**
     * The geometry metadata for which the form was opened.
     * Note that the data is not updated until the form is submitted.
     */
    data: Metadata | null | undefined;
    /**
     * The reason for which the metadata editing form was opened
     */
    use: MetadataInteraction.Create | MetadataInteraction.Edit;
    /**
     * Whether the use of geometry metadata is permitted given the current
     * metadata schema and its permission attributes
     */
    canUse: boolean;
    /**
     * Whether the form was opened for editing pre-existing metadata.
     * This value is derived from `use`.
     */
    isEditOperation: boolean;
  };
}

/**
 * Create a placeholder default value for {@link MetadataEditorContext}
 */
const DEFAULT_SCHEMA = yup.object().shape({});
const DEFAULT_INITIAL_VALUES: MetadataFormInitialValues = {};
const DEFAULT_CONTEXT_VALUE: MetadataEditorContextValue = {
  formik: {
    dirty: false,
    values: DEFAULT_INITIAL_VALUES,
    initialValues: DEFAULT_INITIAL_VALUES,
    errors: {},
    initialErrors: {},
    touched: {},
    initialTouched: {},
    isSubmitting: false,
    isValidating: false,
    isValid: true,
    submitCount: 0,
    setStatus: () => {},
    setTouched: () => {},
    setErrors: () => {},
    setFieldError: () => {},
    setFieldTouched: () => {},
    setSubmitting: () => {},
    setValues: () => {},
    setFieldValue: () => {},
    validateField: () => {},
    validateForm: async () => {
      return {};
    },
    resetForm: () => {},
    submitForm: async () => {},
    setFormikState: () => {},
    handleSubmit: () => {},
    handleBlur: () => {},
    handleChange: () => {},
    handleReset: () => {},
    getFieldProps: () => {
      return {
        value: {} as any,
        name: '',
        onChange: () => {},
        onBlur: () => {},
      };
    },
    getFieldMeta: () => {
      return {
        value: {} as any,
        touched: false,
        initialTouched: false,
      };
    },
    getFieldHelpers: () => {
      return { setValue: () => {}, setTouched: () => {}, setError: () => {} };
    },
    registerField: () => {},
    unregisterField: () => {},
  },
  extraData: {
    formStarter: {
      formValues: DEFAULT_INITIAL_VALUES,
      formStructure: {
        attributes: {
          permissions: { create: true, edit: true, view: true },
          title: 'DEFAULT',
          showIfEmpty: false,
        },
        fields: [],
      },
      schema: DEFAULT_SCHEMA,
    },
    data: null,
    use: MetadataInteraction.Create,
    canUse: false,
    isEditOperation: false,
  },
};

/**
 * A React context used to give children components access to metadata editing
 * form data
 */
export const MetadataEditorContext = createContext<MetadataEditorContextValue>(
  DEFAULT_CONTEXT_VALUE
);
