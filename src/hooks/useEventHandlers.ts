import { useCallback } from 'react';
import forEach from 'lodash/forEach';
import filter from 'lodash/filter';
import type { Event } from '../type/events';

/**
 * A function that can return a Boolean indicating whether or
 * not the event should be considered fully handled,
 * to stop further event handlers from being called.
 * If the function does not return a Boolean, the event
 * is assumed to be incompletely handled.
 */
interface EventCallback {
  (event: Event): boolean | unknown;
}

/**
 * Construct an event handler that calls the given event handlers in order by index,
 * stopping when all event handlers have been called, or when an event
 * handler returns `true` to signal that the event has been fully-processed.
 *
 * @param handlers Event handler functions (non-functions will be filtered-out)
 */
export function useEventHandlers(
  handlers: Array<EventCallback | undefined | null>
) {
  const filteredHandlers = filter(handlers, (h): h is EventCallback => {
    return typeof h === 'function';
  });
  return useCallback(
    (event: Event) =>
      forEach(filteredHandlers, (h) => {
        const result = h(event);
        /**
         * Treat event handlers that do not follow the convention of returning
         * a boolean as though they have returned `true`, signalling that
         * the event should not be processed by other handlers.
         */
        if (typeof result === 'boolean') {
          return !result;
        } else {
          return true;
        }
      }),
    [filteredHandlers]
  );
}
