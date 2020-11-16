import React, { useCallback, useContext } from 'react';
import { observer } from 'mobx-react-lite';
import { Paragraph, Button, Portal, Dialog } from 'react-native-paper';

import { StoreContext } from '../../state/StoreContext';

/**
 * A component that renders a confirmation dialog requesting that the user
 * confirm or cancel an operation. The dialog renders depending on whether
 * there is any geometry ready for confirmation.
 * @return Renderable React node
 */
function _ConfirmationDialog() {
  const { controls, features } = useContext(StoreContext).store;

  // Rollback the geometry in case of cancellation
  const onDismiss = useCallback(() => {
    controls.undo();
  }, [controls]);

  // Commit on confirmation
  const onConfirm = useCallback(() => {
    controls.confirmEdits();
  }, [controls]);

  /**
   * Craft a confirmation message according to the context
   */
  const draft = features.draftFeature;
  let bodyText = 'Are you sure?';
  if (draft) {
    switch (draft.geometry.type) {
      case 'Point':
        bodyText = 'Add this point?';
        break;
      default:
        bodyText = 'Add this shape?';
    }
  }
  const visible = !!draft; // Convert to boolean

  /**
   * Conditionally-visible confirmation dialog
   */
  return (
    <Portal>
      <Dialog onDismiss={onDismiss} visible={visible} dismissable={false}>
        <Dialog.Title>Confirmation</Dialog.Title>
        <Dialog.Content>
          <Paragraph>{bodyText}</Paragraph>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onConfirm}>Confirm</Button>
          <Button onPress={onDismiss}>Cancel</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

/**
 * Renderable MobX wrapper for [[_ConfirmationDialog]]
 */
export const ConfirmationDialog = observer(_ConfirmationDialog);
