import { createContext } from 'mobx-keystone';

import type { FeatureListModel } from './FeatureListModel';

/**
 * A MobX Keystone context used to access any [[FeatureListModel]]
 * from anywhere in the state tree.
 */
export const featureListContext = createContext<FeatureListModel>();
