import { configure } from 'mobx';

/**
 * MobX configuration
 * See https://mobx.js.org/configuration.html
 */
let mobxOptions = {
  /**
   * Allows users of the library to use different MobX versions from
   * the library by separating MobX global state.
   */
  isolateGlobalState: true,
};
if (__DEV__) {
  /**
   * Emit warnings in development mode for common MobX pitfalls
   */
  configure({
    enforceActions: 'always',
    computedRequiresReaction: true,
    reactionRequiresObservable: true,
    observableRequiresReaction: true,
    ...mobxOptions,
  });
} else {
  configure(mobxOptions);
}

import GeometryEditor from './component/GeometryEditor';

export { GeometryEditor };
