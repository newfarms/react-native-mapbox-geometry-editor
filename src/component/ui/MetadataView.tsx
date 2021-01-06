import React, { useContext, useMemo } from 'react';
import { action } from 'mobx';
import { observer } from 'mobx-react-lite';
import { StyleSheet } from 'react-native';
import { Button, Card } from 'react-native-paper';

import { StoreContext } from '../../state/StoreContext';
import { MetadataFieldList } from './MetadataList';
import { DefaultContent } from './page/PageContent';
import { useMetadata } from '../../hooks/useMetadata';
import { InteractionMode } from '../../state/ControlsModel';
import { MetadataInteraction } from '../../type/metadata';

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
 * A component that renders all geometry metadata for a feature
 * @return Renderable React node
 */
function _MetadataView() {
  const { controls } = useContext(StoreContext);
  /**
   * Metadata permissions and pre-processing
   */
  const use = MetadataInteraction.ViewDetails;
  const { canUse, data, formStarter, featureExists } = useMetadata(use);

  // Close button press handler
  const onDismiss = useMemo(
    () =>
      action('metadata_view_close', () => {
        controls.confirm();
      }),
    [controls]
  );

  // Edit button press handler
  const onEdit = useMemo(
    () =>
      action('metadata_view_edit', () => {
        controls.toggleMode(InteractionMode.EditMetadata);
      }),
    [controls]
  );

  if (featureExists) {
    if (canUse) {
      return (
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <MetadataFieldList
              formStructure={formStarter.formStructure}
              use={use}
              data={data}
              includeTitle={true}
              includeLabels={true}
            />
          </Card.Content>
          <Card.Actions style={styles.cardActions}>
            <Button onPress={onEdit}>Edit</Button>
            <Button onPress={onDismiss}>Close</Button>
          </Card.Actions>
        </Card>
      );
    } else {
      console.warn(
        'This component should not be rendered as metadata view is not permitted.'
      );
    }
  } else {
    console.warn(
      'This component should not be rendered as there is no feature in an appropriate state for viewing metadata.'
    );
  }
  // Fallback display to render in case of an error
  return <DefaultContent closeCb={onDismiss} />;
}

/**
 * Renderable MobX wrapper for [[_MetadataView]]
 */
export const MetadataView = observer(_MetadataView);
