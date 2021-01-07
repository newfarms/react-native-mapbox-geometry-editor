import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { action, runInAction } from 'mobx';
import { observer } from 'mobx-react-lite';
import { StyleSheet } from 'react-native';
import { Button, Card } from 'react-native-paper';
import { Formik } from 'formik';
import type { FormikProps, FormikHelpers } from 'formik';

import { ConfirmationCard } from './ConfirmationCard';
import { StoreContext } from '../../state/StoreContext';
import { MetadataFieldList } from './MetadataForm';
import { useMetadata } from '../../hooks/useMetadata';
import { MetadataInteraction } from '../../type/metadata';
import type { MetadataFormInitialValues } from '../../type/metadata';
import { InteractionMode } from '../../state/ControlsModel';

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
  const { controls, features } = useContext(StoreContext);
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
  const finalOnConfirm = useMemo(
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
          features.setDraftMetadata(castValues);
          formikBag.setSubmitting(false);
          controls.confirm();
        }
      ),
    [controls, features, formStarter]
  );

  /**
   * The user is presented with a two-stage save operation in edit mode
   */
  const [isInitialStep, setIsInitialStep] = useState(false);

  /**
   * Cancel button callback that handles both save operation stages
   */
  const onDismiss = useMemo(
    () =>
      action('metadata_editor_cancel', (isDirty: boolean) => {
        if (isEditOperation) {
          if (isInitialStep) {
            // Escape from first step of the save operation
            setIsInitialStep(false);
          } else if (isDirty) {
            // The controller will warn the user about unsaved changes
            controls.cancel();
          } else {
            // There are no unsaved changes. Just exit edit mode
            if (controls.mode !== InteractionMode.EditMetadata) {
              console.warn(
                `Inappropriate editing mode, ${controls.mode}. Expected ${InteractionMode.EditMetadata}`
              );
            }
            controls.setDefaultMode();
          }
        } else {
          // The controller will warn the user about unsaved changes
          controls.cancel();
        }
      }),
    [controls, isEditOperation, isInitialStep, setIsInitialStep]
  );

  /**
   * Save button callback that handles both save operation stages
   */
  const onConfirm = useCallback(
    (
      values: MetadataFormInitialValues,
      formikBag: FormikHelpers<MetadataFormInitialValues>
    ) => {
      if (isEditOperation && !isInitialStep) {
        formikBag.setSubmitting(false);
        setIsInitialStep(true);
      } else {
        finalOnConfirm(values, formikBag);
      }
    },
    [finalOnConfirm, isEditOperation, isInitialStep, setIsInitialStep]
  );

  /**
   * The body of the Formik form, which renders a list of form fields
   * and submit or cancel buttons.
   *
   * In editing mode, it is also responsible for rendering the confirmation message
   * for the first stage of the save operation.
   */
  const formContents = useCallback(
    ({
      dirty,
      isSubmitting,
      isValid,
      submitForm,
    }: FormikProps<MetadataFormInitialValues>) => {
      const onDismissWrapper = () => onDismiss(dirty);
      if (isEditOperation && isInitialStep) {
        return (
          <ConfirmationCard
            title={'Confirmation'}
            message={'Do you wish to save changes?'}
            onConfirm={submitForm}
            onDismiss={onDismissWrapper}
          />
        );
      } else {
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
                disabled={
                  !isValid || isSubmitting || (isEditOperation && !dirty)
                }
              >
                Save
              </Button>
              <Button onPress={onDismissWrapper}>Cancel</Button>
            </Card.Actions>
          </>
        );
      }
    },
    [onDismiss, formStarter, data, use, isEditOperation, isInitialStep]
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
