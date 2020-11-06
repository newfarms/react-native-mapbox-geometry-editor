import React, { useState } from 'react';

import StoreContext from './StoreContext';
import { FeatureListModel } from './FeatureListModel';

/**
 * A React context provider used to give children components access
 * to a [[StoreContext]] context.
 *
 * @param props Render properties
 */
export const StoreProvider = (props: {
  readonly children?: React.ReactNode;
}) => {
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
};
