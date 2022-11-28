import { useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import { action } from 'mobx';
import { observer } from 'mobx-react-lite';

import { StoreContext } from '../../../state/StoreContext';
import { ConfirmationCard } from '../ConfirmationCard';

/**
 * A component that renders a confirmation view requesting that the user
 * confirm or cancel an operation. The view renders depending on whether
 * there is an operation needing confirmation. When there is no operation needing
 * confirmation, the component's children are rendered instead.
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
  readonly children?: ReactNode;
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
  if (visible) {
    return (
      <ConfirmationCard
        visible={visible}
        title={controls.confirmation?.title as string}
        message={controls.confirmation?.message as string}
        onConfirm={onConfirm}
        onDismiss={onDismiss}
      />
    );
  } else {
    return <>{children}</>;
  }
}

/**
 * Renderable MobX wrapper for {@link _ConfirmationPage}
 */
export const ConfirmationPage = observer(_ConfirmationPage);
