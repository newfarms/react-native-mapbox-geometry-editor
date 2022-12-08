import { createContext } from 'mobx-keystone';

import type { ControlsModel } from './ControlsModel';
import type { FeatureListModel } from './FeatureListModel';

/**
 * A MobX Keystone context used to access any {@link FeatureListModel}
 * from anywhere in the state tree.
 */
export const featureListContext = createContext<FeatureListModel>();

/**
 * A MobX Keystone context used to access any {@link ControlsModel}
 * from anywhere in the state tree.
 */
export const controlsContext = createContext<ControlsModel>();
