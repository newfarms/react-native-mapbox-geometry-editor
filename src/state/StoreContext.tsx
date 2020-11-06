import React from 'react';

import { FeatureListModel } from './FeatureListModel';

/**
 * A React context used to give children components access to MobX Keystone stores
 * that manage state for this library.
 *
 * @access public
 */
const StoreContext = React.createContext({
  /**
   * A [[FeatureListModel]] instance storing editable map features
   */
  featureList: new FeatureListModel({}),
});

export default StoreContext;
