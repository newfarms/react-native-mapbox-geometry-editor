/**
 * Rendering props that a [[PageOpener]] passes to a component that renders a page
 */
export interface PageProps {
  /**
   * The page content
   */
  pageContent: JSX.Element;
  /**
   * A function to be called when the user tries to close or navigate
   * away from the page. `pageContent` will display a close control
   * to the user. This function provides an alternative mechanism for closing
   * the page, but should not be used unless the app cannot remove
   * navigation controls external to those triggered through `pageContent`.
   *
   * If this function returns `false`, the page can still be closed,
   * but the user may lose unsaved changes.
   *
   * @return Whether or not the page can be safely closed
   */
  onDismissRequest: () => boolean;
  /**
   * A function to be called when the page has been closed or unfocused.
   * Call this function to inform the library that the page has been
   * dropped "without the library's consent". If the page is dropped and this function
   * is not called, the library should still be able to clean up internal state later,
   * but the user may lose unsaved changes.
   */
  onDismissed: () => void;
}

/**
 * A function that forwards [[PageProps]] to a component that renders a page,
 * and therefore causes the page to be displayed with
 * `props.pageContent` as its contents.
 *
 * This function should be idempotent.
 */
export interface PageOpener {
  /**
   * @param props Content for the page
   */
  (props: PageProps): void;
}

/**
 * A function that closes a page opened by a [[PageOpener]]
 *
 * This function should be idempotent.
 */
export interface PageCloser {
  (): void;
}

/**
 * Functions for opening and closing pages
 */
export interface PageControls {
  /**
   * A function for opening a page and causing content from this library
   * to be rendered on the page
   */
  openPage: PageOpener;
  /**
   * A function for closing the page opened by `openPage`
   */
  closePage: PageCloser;
}
