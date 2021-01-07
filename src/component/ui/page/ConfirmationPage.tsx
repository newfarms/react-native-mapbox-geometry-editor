import React, { useContext, useMemo } from 'react';
import { action } from 'mobx';
import { StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import { Surface } from 'react-native-paper';

import { StoreContext } from '../../../state/StoreContext';
import { ConfirmationCard } from '../ConfirmationCard';

/**
 * @ignore
 */
const styles = StyleSheet.create({
  surfaceVisible: {
    flex: 1,
  },
  surfaceHidden: {
    height: 0,
  },
});

/**
 * A component that renders a confirmation view requesting that the user
 * confirm or cancel an operation. The view renders depending on whether
 * there is an operation needing confirmation. When there is no operation needing
 * confirmation, the component's children are rendered instead.
 *
 * Regardless of whether there is an operation needing confirmation, any children
 * are kept mounted to preserve their state.
 *
 * @param props Render properties
 * @return Renderable React node
 */
function _ConfirmationPage({
  children,
}: {
  /**
   * Child elements to render in the absence of an operation to confirm or cancel
   */
  readonly children?: React.ReactNode;
}) {
  const { controls } = useContext(StoreContext);

  // Rollback in case of cancellation
  const onDismiss = useMemo(
    () =>
      action('confirmation_page_cancel', () => {
        controls.cancel();
      }),
    [controls]
  );

  // Commit on confirmation
  const onConfirm = useMemo(
    () =>
      action('confirmation_page_confirm', () => {
        controls.confirm();
      }),
    [controls]
  );

  const visible = !!controls.confirmation; // Convert to boolean

  // There may be more elegant ways to hide a view while keeping it mounted
  let surfaceStyle: { height: number } | { flex: number } =
    styles.surfaceVisible;
  if (visible) {
    surfaceStyle = styles.surfaceHidden;
  }

  return (
    <>
      <ConfirmationCard
        visible={visible}
        title={controls.confirmation?.title as string}
        message={controls.confirmation?.message as string}
        onConfirm={onConfirm}
        onDismiss={onDismiss}
      />
      <Surface style={surfaceStyle}>{children}</Surface>
    </>
  );
}

/**
 * Renderable MobX wrapper for [[_ConfirmationPage]]
 */
export const ConfirmationPage = observer(_ConfirmationPage);
