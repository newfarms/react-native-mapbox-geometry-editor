import { configure } from 'mobx';

/**
 * MobX configuration
 * See https://mobx.js.org/configuration.html
 */
let mobxOptions = {
  /**
   * Allows users of this library to use different MobX versions from
   * the version of MobX used by this library.
   * This configuration setting prevents MobX from sharing state
   * across MobX instances.
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

import { GeometryEditor } from './component/GeometryEditor';

export { GeometryEditor };
