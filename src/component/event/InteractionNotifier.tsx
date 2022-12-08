import { observer } from 'mobx-react-lite';
import { useContext, useEffect } from 'react';
import type { ReactNode } from 'react';

import { StoreContext } from '../../state/StoreContext';
import type { InteractionEventProps } from '../../type/ui';

/**
 * A component that emits events to inform the client application
 * of shape or metadata editing operations
 *
 * @param props Render properties
 */
function _InteractionNotifier({
  onEditingStatus,
  children,
}: InteractionEventProps & { readonly children?: ReactNode }) {
  const { controls } = useContext(StoreContext);

  const isEditing = controls.isEditing;

  /**
   * Pass events to the event callbacks
   */
  useEffect(() => {
    onEditingStatus?.(isEditing);
  }, [onEditingStatus, isEditing]);

  /**
   * This component has nothing meaningful to render, and is just used to integrate
   * some imperative code with React.
   */
  return <>{children}</>;
}

/**
 * Renderable MobX wrapper for {@link _InteractionNotifier}
 */
export const InteractionNotifier = observer(_InteractionNotifier);
