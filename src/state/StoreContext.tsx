import React from 'react';

import { RootModel } from './RootModel';

/**
 * A React context used to give children components access to MobX Keystone stores
 * that manage state for this library.
 *
 * @access public
 */
export const StoreContext = React.createContext({
  /**
   * A [[RootModel]] instance storing all state
   */
  store: new RootModel({}),
});
