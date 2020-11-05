import React, { useState } from 'react';

import StoreContext from './StoreContext';
import { FeatureListModel } from './FeatureListModel';

export const StoreProvider = (props: { children?: React.ReactNode }) => {
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
