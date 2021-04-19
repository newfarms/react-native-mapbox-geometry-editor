import { observer } from 'mobx-react-lite';
import React, { useContext, useEffect } from 'react';

import { StoreContext } from '../../state/StoreContext';
import type { InteractionEventProps } from '../../type/ui';

/**
 * A component that emits events to inform the client application
 * of shape or metadata editing operations
 *
 * @param props Render properties
 */
function _InteractionNotifier({
  onMode,
  children,
}: InteractionEventProps & { readonly children?: React.ReactNode }) {
  const { controls } = useContext(StoreContext);

  const mode = controls.mode;

  /**
   * Pass events to the event callbacks
   */
  useEffect(() => {
    onMode?.(mode);
  }, [onMode, mode]);

  /**
   * This component has nothing meaningful to render, and is just used to integrate
   * some imperative code with React.
   */
  return <>{children}</>;
}

/**
 * Renderable MobX wrapper for [[_InteractionNotifier]]
 */
export const InteractionNotifier = observer(_InteractionNotifier);
