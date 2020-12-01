import React, { useCallback, useContext } from 'react';
import { observer } from 'mobx-react-lite';
import { Paragraph, Button, Portal, Dialog } from 'react-native-paper';

import { StoreContext } from '../../state/StoreContext';

/**
 * A component that renders a confirmation dialog requesting that the user
 * confirm or cancel an operation. The dialog renders depending on whether
 * there is an operation needing confirmation.
 * @return Renderable React node
 */
function _ConfirmationDialog() {
  const { controls } = useContext(StoreContext).store;

  // Rollback the geometry in case of cancellation
  const onDismiss = useCallback(() => {
    controls.cancel();
  }, [controls]);

  // Commit on confirmation
  const onConfirm = useCallback(() => {
    controls.confirm();
  }, [controls]);

  const visible = !!controls.confimation; // Convert to boolean

  /**
   * Conditionally-visible confirmation dialog
   */
  return (
    <Portal>
      <Dialog onDismiss={onDismiss} visible={visible} dismissable={true}>
        <Dialog.Title>{controls.confimation?.title}</Dialog.Title>
        <Dialog.Content>
          <Paragraph>{controls.confimation?.message}</Paragraph>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onConfirm}>Yes</Button>
          <Button onPress={onDismiss}>No</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

/**
 * Renderable MobX wrapper for [[_ConfirmationDialog]]
 */
export const ConfirmationDialog = observer(_ConfirmationDialog);
