import React from 'react';

import { defaultStyleGeneratorMap } from '../util/defaultStyleGenerators';

/**
 * A React context used to give children components access to geometry
 * rendering style generators
 *
 * @access public
 */
export const StyleContext = React.createContext({
  /**
   * Default geometry rendering style generators
   */
  styleGenerators: defaultStyleGeneratorMap,
});
