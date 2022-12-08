import { useContext, useMemo } from 'react';
import { action } from 'mobx';
import { observer } from 'mobx-react-lite';
import { Paragraph, Button, Portal, Dialog } from 'react-native-paper';

import { StoreContext } from '../../state/StoreContext';

/**
 * A component that renders a confirmation dialog requesting that the user
 * confirm or cancel an operation. The dialog renders depending on whether
 * there is an operation needing confirmation.
 * @param props Render properties
 * @return Renderable React node
 */
function _ConfirmationDialog({
  visibleIfPageOpen,
}: {
  /**
   * Whether the dialog should be visible only when there is an open page (true),
   * or only when there is no open page (false).
   */
  visibleIfPageOpen: boolean;
}) {
  const { controls } = useContext(StoreContext);

  // Rollback the geometry in case of cancellation
  const onDismiss = useMemo(
    () =>
      action('confirmation_dialog_cancel', () => {
        controls.cancel();
      }),
    [controls]
  );

  // Commit on confirmation
  const onConfirm = useMemo(
    () =>
      action('confirmation_dialog_confirm', () => {
        controls.confirm();
      }),
    [controls]
  );

  const visible =
    !!controls.confirmation && controls.isPageOpen === visibleIfPageOpen;

  /**
   * Conditionally-visible confirmation dialog
   */
  return (
    <Portal>
      <Dialog onDismiss={onDismiss} visible={visible} dismissable={true}>
        <Dialog.Title>{controls.confirmation?.title}</Dialog.Title>
        <Dialog.Content>
          <Paragraph>{controls.confirmation?.message}</Paragraph>
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
 * Renderable MobX wrapper for {@link _ConfirmationDialog}
 */
export const ConfirmationDialog = observer(_ConfirmationDialog);
