import React, { useCallback, useContext } from 'react';
import { toJS } from 'mobx';
import { observer } from 'mobx-react-lite';
import { StyleSheet } from 'react-native';
import { Button, Portal, Dialog } from 'react-native-paper';
import { Formik } from 'formik';

import { StoreContext } from '../../state/StoreContext';
import { MetadataContext } from './MetadataContext';
import { MetadataFieldList } from './MetadataForm';
import { makeMetadataFormStarter } from '../../util/metadata';
import type { MetadataSchema } from '../../type/metadata';

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
  const { metadataSchemaGenerator } = useContext(MetadataContext);

  /**
   * Determine whether the editor should be visible.
   * The editor should be visible when there is metadata to edit
   */
  const data = toJS(features.draftMetadata);
  const visible = !!data; // Convert to boolean
  let schemaSource: MetadataSchema | null = null;
  if (visible) {
    const feature = toJS(features.draftMetadataGeoJSON);
    if (feature) {
      schemaSource = metadataSchemaGenerator(feature);
    } else {
      // This should never happen unless there is a bug in the library
      throw new Error(
        'There is no feature providing draft metadata for editing.'
      );
    }
  }
  const formStarter = makeMetadataFormStarter(schemaSource, data);
  if (formStarter.schemaErrors) {
    console.warn(
      'Metadata schema description parsing errors: ',
      formStarter.schemaErrors
    );
  }

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
          <MetadataFieldList formFieldList={formStarter.formFieldList} />
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button onPress={submitForm} disabled={!isValid || isSubmitting}>
            Save
          </Button>
          <Button onPress={onDismiss}>Cancel</Button>
        </Dialog.Actions>
      </>
    ),
    [onDismiss, formStarter]
  );

  /**
   * Conditionally-visible metadata editor dialog
   */
  return (
    <Portal>
      <Dialog
        onDismiss={onDismiss}
        visible={visible}
        dismissable={true}
        style={styles.dialog}
      >
        <Dialog.Title>Edit details</Dialog.Title>
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
