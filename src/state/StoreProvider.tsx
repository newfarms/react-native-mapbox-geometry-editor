import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { StoreContext } from './StoreContext';
import { RootModel } from './RootModel';

/**
 * A React context provider used to give children components access
 * to a {@link StoreContext} context.
 *
 * This component may emit a MobX warning depending on how the client application uses
 * this library:
 * "[mobx] Derivation observer_StoreProvider is created/updated without reading any observable value"
 *
 * The warning is hypothesized to result from the following:
 * - During the initial render, the MobX observable created within `useState` is passed to
 *   `StoreContext.Provider` and is probably deeply compared by React with the default context
 *   value stored by `StoreContext`. `StoreProvider` must be an observer otherwise MobX will
 *   complain that observable is being accessed outside of a reactive context, even though
 *   these accesses are not important.
 * - During subsequent re-renders, React probably only does a shallow comparison of the MobX
 *   observable with the existing value stored in the context, and finds that the two have
 *   referential equality. Therefore, the observable is never accessed, and MobX emits a warning
 *   that `StoreProvider` did not read any observable value.
 *
 * This warning will only be emitted in development mode, as per the settings in src/index.ts,
 * and could be silenced by changing the MobX warning settings in src/index.ts
 * See https://mobx.js.org/configuration.html
 *
 * It is safer to have an unnecessary observer component than to fail to
 * make a component an observer. The warning flags unnecessary runtime overhead, as opposed
 * to potential logical errors.
 *
 * @param props Render properties
 */
function _StoreProvider(props: { readonly children?: ReactNode }) {
  const [storeContext] = useState(() => {
    return new RootModel({});
  });

  return (
    <StoreContext.Provider value={storeContext}>
      {props.children}
    </StoreContext.Provider>
  );
}

/**
 * Renderable MobX wrapper for {@link _StoreProvider}
 */
export const StoreProvider = observer(_StoreProvider);
