/**
 * Callbacks that a {@link PageOpenCb} receives
 */
export interface PageControls {
  /**
   * A function to be called when the user tries to close or navigate
   * away from the page. The library will display a close control
   * to the user, but this function provides an alternative mechanism for closing
   * the page. This function should be connected to any navigation controls, external
   * to those provided by the library, that the app does not want to disable.
   *
   * If this function returns `false`, the user may lose unsaved changes,
   * so the library will not close the page.
   *
   * @return Whether or not the page will be closed
   */
  onDismissRequest: () => boolean;
}

/**
 * A callback that notifies the client application that the library has opened a
 * full-screen display.
 *
 * This function should be idempotent.
 */
export interface PageOpenCb {
  /**
   * @param controls Callbacks for controlling the page
   */
  (controls: PageControls): void;
}

/**
 * A callback that notifies the client application that the library has closed a
 * full-screen display.
 *
 * This function should be idempotent. It may be called even when no page was previously
 * open.
 */
export interface PageCloseCb {
  (): void;
}

/**
 * Callbacks to notify the client application of page open/close events
 */
export interface PageProps {
  /**
   * A page open event callback
   */
  openPage: PageOpenCb;
  /**
   * A page close event callback
   */
  closePage: PageCloseCb;
}

/**
 * A callback that notifies the client application of whether it is appropriate
 * for geometry to be imported or exported (`false`), or whether an editing session
 * is in progress such that it is not appropriate to import or export geometry (`true`).
 *
 * This function should be idempotent.
 */
export interface EditingStatusCb {
  /**
   * @param status the editing status of the library
   */
  (status: boolean): void;
}

/**
 * Callbacks to notify the client application of shape or metadata editing events
 */
export interface InteractionEventProps {
  /**
   * An event callback for changes to the current editing status
   */
  readonly onEditingStatus?: EditingStatusCb;
}
