import React, { useCallback, useContext, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { StyleSheet } from 'react-native';
import { Button, Dialog, Portal } from 'react-native-paper';
import { Formik } from 'formik';

import { StoreContext } from '../../state/StoreContext';
import { MetadataFieldList } from './MetadataForm';
import { useMetadata } from '../../hooks/useMetadata';
import { MetadataInteraction } from '../../type/metadata';

/**
 * @ignore
 */
const styles = StyleSheet.create({
  dialog: {
    maxHeight: '75%',
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
  useEffect(() => {
    if (!canUse && featureExists) {
      controls.confirm();
    }
  }, [canUse, featureExists, controls]);

  // Rollback the geometry in case of cancellation
  const onDismiss = useCallback(() => {
    controls.cancel();
  }, [controls]);

  // Commit on confirmation
  const onConfirm = useCallback(
    (values, formikBag) => {
      // Ensure that form values are typecast to the schema
      let castValues: object | null | undefined = formStarter.schema.cast(
        values
      );
      if (!castValues) {
        console.warn(
          'Failed to cast metadata form values before setting geometry metadata. Values are: ',
          values
        );
        castValues = null;
      }
      features.setDraftMetadata(castValues);
      controls.confirm();
      formikBag.setSubmitting(false);
    },
    [controls, features, formStarter]
  );

  /**
   * The body of the Formik form, which renders a list of form fields
   * and submit or cancel buttons.
   */
  const dialogContents = useCallback(
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
        <Dialog.ScrollArea>
          <MetadataFieldList
            formFieldList={formStarter.formStructure.fields}
            use={use}
            data={data}
          />
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button onPress={submitForm} disabled={!isValid || isSubmitting}>
            Save
          </Button>
          <Button onPress={onDismiss}>Cancel</Button>
        </Dialog.Actions>
      </>
    ),
    [onDismiss, formStarter, data, use]
  );

  /**
   * Conditionally-visible metadata editor dialog
   */
  return (
    <Portal>
      <Dialog
        onDismiss={onDismiss}
        visible={canUse && featureExists}
        dismissable={true}
        style={styles.dialog}
      >
        <Formik
          component={dialogContents}
          initialValues={formStarter.formValues}
          onSubmit={onConfirm}
          validationSchema={formStarter.schema}
        />
      </Dialog>
    </Portal>
  );
}

/**
 * Renderable MobX wrapper for [[_MetadataEditor]]
 */
export const MetadataEditor = observer(_MetadataEditor);
