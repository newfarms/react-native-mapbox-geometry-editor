import { useContext, useEffect, useMemo } from 'react';
import { action, runInAction } from 'mobx';
import { observer } from 'mobx-react-lite';
import { StyleSheet } from 'react-native';
import { Button, Card } from 'react-native-paper';

import { StoreContext } from '../../../state/StoreContext';
import { MetadataFieldList } from './MetadataForm';
import { MetadataEditorContext } from './MetadataEditorContext';

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
 * A component that renders a metadata editing form,
 * using data from {@link MetadataEditorContext}
 */
function _MetadataEditorConsumer() {
  /**
   * Retrieve and unpack the form data
   */
  const { formik, extraData } = useContext(MetadataEditorContext);
  const { dirty, isSubmitting, isValid, submitForm } = formik;
  const { formStarter, data, use, canUse, isEditOperation } = extraData;

  const { controls } = useContext(StoreContext);

  useEffect(() => {
    runInAction(() => {
      /**
       * Immediately move geometry to the next stage if metadata editing is not permitted
       */
      if (!canUse) {
        controls.confirm();
      } else {
        /**
         * Inform the controller of whether there is dirty state.
         * The controller will warn the user about unsaved changes.
         */
        controls.setIsDirty(dirty);
      }
    });
  }, [canUse, dirty, controls]);

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
    <Card style={styles.card}>
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
    </Card>
  );
}

/**
 * Renderable MobX wrapper for {@link _MetadataEditorConsumer}
 */
export const MetadataEditorConsumer = observer(_MetadataEditorConsumer);
