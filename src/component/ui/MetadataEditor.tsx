import React, { useCallback, useContext, useEffect, useMemo } from 'react';
import { action, runInAction } from 'mobx';
import { observer } from 'mobx-react-lite';
import { StyleSheet } from 'react-native';
import { Button, Card } from 'react-native-paper';
import { Formik } from 'formik';
import type { FormikProps, FormikHelpers } from 'formik';

import { StoreContext } from '../../state/StoreContext';
import { MetadataFieldList } from './MetadataForm';
import { useMetadata } from '../../hooks/useMetadata';
import { MetadataInteraction } from '../../type/metadata';
import type {
  Metadata,
  MetadataFormStarter,
  MetadataFormInitialValues,
} from '../../type/metadata';

/**
 * @ignore
 */
const styles = StyleSheet.create({
  card: {
    flex: 1,
  },
  cardContent: {
    height: '90%',
  },
  cardActions: {
    height: '10%',
  },
});

/**
 * A component that is passed to Formik to render the inside of the metadata editing form.
 * @param props Rendering props
 */
function _FormContents({
  formik,
  extra,
}: {
  /**
   * Formik-provided data and helpers
   */
  formik: FormikProps<MetadataFormInitialValues>;
  /**
   * Contextual data provided by [[MetadataEditor]]
   */
  extra: {
    formStarter: MetadataFormStarter;
    data: Metadata | null | undefined;
    use: MetadataInteraction.Create | MetadataInteraction.Edit;
    isEditOperation: boolean;
  };
}) {
  /**
   * Unpack rendering props
   */
  const { dirty, isSubmitting, isValid, submitForm } = formik;
  const { formStarter, data, use, isEditOperation } = extra;

  const { controls } = useContext(StoreContext);

  /**
   * Function to notify the controller of dirty form state
   */
  const setDirty = useMemo(
    () =>
      action('metadata_editor_dirty', (dirty: boolean) => {
        if (dirty) {
          /**
           * Notify the controller that there is dirty state.
           * The controller will warn the user about unsaved changes.
           */
          controls.dirtyMetadata = {};
        } else {
          controls.dirtyMetadata = null;
        }
      }),
    [controls]
  );

  useEffect(() => {
    setDirty(dirty);
  }, [dirty, setDirty]);

  /**
   * Cancel button callback
   */
  const onDismiss = useMemo(
    () =>
      action('metadata_editor_cancel', () => {
        controls.cancel();
      }),
    [controls]
  );

  return (
    <>
      <Card.Content style={styles.cardContent}>
        <MetadataFieldList
          formFieldList={formStarter.formStructure.fields}
          use={use}
          data={data}
        />
      </Card.Content>
      <Card.Actions style={styles.cardActions}>
        <Button
          onPress={submitForm}
          disabled={!isValid || isSubmitting || (isEditOperation && !dirty)}
        >
          Save
        </Button>
        <Button onPress={onDismiss}>Cancel</Button>
      </Card.Actions>
    </>
  );
}

/**
 * Renderable MobX wrapper for [[_FormContents]]
 */
export const FormContents = observer(_FormContents);

/**
 * A component that renders an interface for editing geometry metadata
 * @return Renderable React node
 */
function _MetadataEditor() {
  const { controls } = useContext(StoreContext);
  /**
   * Metadata permissions and pre-processing
   */
  const use = controls.metadataInteraction;
  let isEditOperation = false;
  switch (use) {
    case MetadataInteraction.Create:
      break;
    case MetadataInteraction.Edit:
      isEditOperation = true;
      break;
    default:
      throw new Error(`Inappropriate metadata interaction, ${use}.`);
  }
  const { canUse, data, formStarter, featureExists } = useMetadata(use);

  /**
   * Immediately move geometry to the next stage if metadata editing is not permitted
   */
  useEffect(() => {
    runInAction(() => {
      if (!canUse && featureExists) {
        controls.confirm();
      }
    });
  }, [canUse, featureExists, controls]);

  // Commit on confirmation
  const onConfirm = useMemo(
    () =>
      action(
        'metadata_editor_save',
        (
          values: MetadataFormInitialValues,
          formikBag: FormikHelpers<MetadataFormInitialValues>
        ) => {
          // Ensure that form values are typecast to the schema
          let castValues: object | null | undefined = null;
          try {
            castValues = formStarter.schema.cast(values);
          } catch (err) {
            console.warn(
              `Failed to cast metadata form values before setting geometry metadata. Values are: ${values}, error is ${err}.`
            );
            castValues = null;
          }
          if (!castValues) {
            console.warn(
              'Failed to cast metadata form values before setting geometry metadata. Values are: ',
              values
            );
            castValues = null;
          }
          formikBag.setSubmitting(false);
          controls.dirtyMetadata = castValues;
          controls.confirm();
        }
      ),
    [controls, formStarter]
  );

  /**
   * The body of the Formik form, which renders a list of form fields
   * and submit or cancel buttons.
   */
  const formContents = useCallback(
    (formik: FormikProps<MetadataFormInitialValues>) => (
      <FormContents
        formik={formik}
        extra={{ formStarter, data, use, isEditOperation }}
      />
    ),
    [formStarter, data, use, isEditOperation]
  );

  return (
    <Card style={styles.card}>
      <Formik
        component={formContents}
        initialValues={formStarter.formValues}
        onSubmit={onConfirm}
        validationSchema={formStarter.schema}
      />
    </Card>
  );
}

/**
 * Renderable MobX wrapper for [[_MetadataEditor]]
 */
export const MetadataEditor = observer(_MetadataEditor);
