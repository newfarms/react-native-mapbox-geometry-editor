import { action } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useContext, useEffect, useMemo } from 'react';

import { StoreContext } from '../../../state/StoreContext';
import { PageContainer } from './PageContainer';
import type { PageControls, PageProps } from '../../../type/ui';

/**
 * A component that coordinates full-page display controls from the client
 * application with corresponding functionality from this library.
 *
 * This component manages the opening and closing of pages in accordance
 * with the page open/close state exposed by {@link ControlsModel}
 *
 * @param props Rendering props
 */
function _PageController({
  pageProps,
}: {
  /**
   * Functions to notify the client application when opening and closing pages
   */
  readonly pageProps?: PageProps;
}) {
  const { controls } = useContext(StoreContext);
  const isPageOpen = controls.isPageOpen;

  /**
   * Create callbacks to pass to the page open callback
   */
  const pageControls: PageControls = useMemo(() => {
    return {
      onDismissRequest: action('page_controller_dismiss_request', () =>
        controls.cancel()
      ),
    };
  }, [controls]);

  /**
   * Invoke page open/close callbacks following changes to the state of the user interface
   */
  useEffect(() => {
    if (pageProps) {
      if (isPageOpen) {
        pageProps.openPage(pageControls);
      } else {
        pageProps.closePage();
      }
    }
  }, [isPageOpen, pageProps, pageControls]);

  /**
   * Render this library's own page when appropriate
   */
  if (isPageOpen) {
    return <PageContainer {...pageControls} />;
  } else {
    return null;
  }
}

/**
 * Renderable MobX wrapper for {@link _PageController}
 */
export const PageController = observer(_PageController);
