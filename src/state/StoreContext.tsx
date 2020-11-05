import React from 'react';

import { FeatureListModel } from './FeatureListModel';

/**
 * A React context used to give children components access to MobX Keystone stores
 *
 * @access public
 */
export default React.createContext({
  /**
   * A [[FeatureListModel]] instance
   */
  featureList: new FeatureListModel({}),
});
