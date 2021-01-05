import React, { useCallback, useContext, useEffect } from 'react';
import { action } from 'mobx';
import { observer } from 'mobx-react-lite';
import { StyleSheet } from 'react-native';
import { Button, Card } from 'react-native-paper';
import { Formik } from 'formik';
import type { FormikHelpers } from 'formik';

import { StoreContext } from '../../state/StoreContext';
import { MetadataFieldList } from './MetadataForm';
import { useMetadata } from '../../hooks/useMetadata';
import { MetadataInteraction } from '../../type/metadata';
import type { MetadataFormInitialValues } from '../../type/metadata';

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
 * A component that renders an interface for editing geometry metadata
 * @return Renderable React node
 */
function _MetadataEditor() {
  const { controls, features } = useContext(StoreContext).store;
  /**
   * Metadata permissions and pre-processing
   */
  const use = MetadataInteraction.Create;
  const { canUse, data, formStarter, featureExists } = useMetadata(use);

  /**
   * Immediately move geometry to the next stage if metadata editing is not permitted
   */
  useEffect(
    action('metadata_editor_skip_editing', () => {
      if (!canUse && featureExists) {
        controls.confirm();
      }
    }),
    [canUse, featureExists, controls]
  );

  // Rollback the geometry in case of cancellation
  const onDismiss = useCallback(
    action('metadata_editor_cancel', () => {
      controls.cancel();
    }),
    [controls]
  );

  // Commit on confirmation
  const onConfirm = useCallback(
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
        features.setDraftMetadata(castValues);
        formikBag.setSubmitting(false);
        controls.confirm();
      }
    ),
    [controls, features, formStarter]
  );

  /**
   * The body of the Formik form, which renders a list of form fields
   * and submit or cancel buttons.
   */
  const formContents = useCallback(
    ({
      isSubmitting,
      isValid,
      submitForm,
    }: {
      isSubmitting: boolean;
      isValid: boolean;
      submitForm: () => Promise<unknown>;
    }) => (
      <>
        <Card.Content style={styles.cardContent}>
          <MetadataFieldList
            formFieldList={formStarter.formStructure.fields}
            use={use}
            data={data}
          />
        </Card.Content>
        <Card.Actions style={styles.cardActions}>
          <Button onPress={submitForm} disabled={!isValid || isSubmitting}>
            Save
          </Button>
          <Button onPress={onDismiss}>Cancel</Button>
        </Card.Actions>
      </>
    ),
    [onDismiss, formStarter, data, use]
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
