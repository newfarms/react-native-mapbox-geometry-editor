import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';

import { StoreContext } from './StoreContext';
import { FeatureListModel } from './FeatureListModel';

/**
 * A React context provider used to give children components access
 * to a [[StoreContext]] context.
 *
 * @param props Render properties
 */
function _StoreProvider(props: { readonly children?: React.ReactNode }) {
  const [storeContext] = useState(() => {
    return {
      featureList: new FeatureListModel({}),
    };
  });

  return (
    <StoreContext.Provider value={storeContext}>
      {props.children}
    </StoreContext.Provider>
  );
}

/**
 * Renderable MobX wrapper for [[_StoreProvider]]
 */
export const StoreProvider = observer(_StoreProvider);
