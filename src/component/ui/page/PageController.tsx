import { observer } from 'mobx-react-lite';
import React, { useContext, useEffect, useMemo, useState } from 'react';

import { StoreContext } from '../../../state/StoreContext';
import { PageContent } from './PageContent';
import { PageContainer } from './PageContainer';
import type { PageControls, PageProps } from '../../../type/ui';

/**
 * A component that coordinates full-page display functionality from the client
 * application with corresponding functionality from this library.
 * (Page display functionality from the client application takes priority.)
 *
 * This component manages the opening and closing of pages in accordance
 * with the page open/close state exposed by [[ControlsModel]]
 *
 * @param props Rendering props
 */
function _PageController() {
  const { controls } = useContext(StoreContext).store;
  const isPageOpen = controls.isPageOpen;

  /**
   * Create data and callbacks to pass to the page opener
   */
  const pagePropsToPass: PageProps = useMemo(() => {
    return {
      pageContent: <PageContent />,
      onDismissRequest: () => controls.cancel(),
      onDismissed: () => {
        controls.notifyOfPageClose();
      },
    };
  }, [controls]);

  /**
   * The library's own page display functionality uses `ownPageProps`
   * as its state, and is activated only when this variable is non-null.
   */
  const [ownPageProps, setOwnPageProps] = useState<PageProps | null>(null);

  /**
   * Define the fallback page display functions that will be used in the absence
   * of client-provided functions.
   */
  const defaultPageControls: PageControls = useMemo(() => {
    return {
      openPage: setOwnPageProps,
      closePage: () => setOwnPageProps(null),
    };
  }, [setOwnPageProps]);

  /**
   * Use the client application's page display functionality when possible
   */
  const pageControls = defaultPageControls;

  /**
   * Invoke page open/close functions following changes to the state of the user interface
   */
  useEffect(() => {
    if (isPageOpen) {
      pageControls.openPage(pagePropsToPass);
    } else {
      pageControls.closePage();
    }
  }, [isPageOpen, pageControls, pagePropsToPass]);

  /**
   * Render this library's own page when appropriate
   */
  if (ownPageProps) {
    return <PageContainer {...ownPageProps} />;
  } else {
    // Either no page needs to be open, or the client application is rendering the page
    return null;
  }
}

/**
 * Renderable MobX wrapper for [[_PageController]]
 */
export const PageController = observer(_PageController);
