import React, { useCallback, useContext } from 'react';
import { observer } from 'mobx-react-lite';
import { Paragraph, Button, Portal, Dialog } from 'react-native-paper';

import { StoreContext } from '../../state/StoreContext';

/**
 * A component that renders an interface for editing geometry metadata
 * @return Renderable React node
 */
function _MetadataEditor() {
  const { controls, features } = useContext(StoreContext).store;

  // Rollback the geometry in case of cancellation
  const onDismiss = useCallback(() => {
    controls.cancel();
  }, [controls]);

  // Commit on confirmation
  const onConfirm = useCallback(() => {
    controls.confirm();
  }, [controls]);

  /**
   * Render the editor when there is metadata to edit
   */
  const data = features.draftMetadata;
  const visible = !!data && !controls.confimation; // Convert to boolean

  /**
   * Conditionally-visible dialog
   */
  return (
    <Portal>
      <Dialog onDismiss={onDismiss} visible={visible} dismissable={true}>
        <Dialog.Title>Edit details</Dialog.Title>
        <Dialog.Content>
          <Paragraph>Placeholder for metadata editor</Paragraph>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onConfirm}>Save</Button>
          <Button onPress={onDismiss}>Cancel</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

/**
 * Renderable MobX wrapper for [[_MetadataEditor]]
 */
export const MetadataEditor = observer(_MetadataEditor);
