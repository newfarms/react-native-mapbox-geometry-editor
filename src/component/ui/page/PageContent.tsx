import { useContext, useMemo } from 'react';
import { action } from 'mobx';
import { observer } from 'mobx-react-lite';

import { StoreContext } from '../../../state/StoreContext';
import { InteractionMode } from '../../../state/ControlsModel';
import { MetadataEditorConsumer } from '../metadata/MetadataEditorConsumer';
import { MetadataView } from '../metadata/MetadataView';
import { DefaultContent } from './DefaultContent';
import { ConfirmationPage } from './ConfirmationPage';

/**
 * A component to be rendered inside a full page display
 * (such as {@link PageContainer}). This component serves as a dispatcher
 * to render content that is appropriate for the current state
 * of the user interface controller.
 */
function _PageContent() {
  const { controls } = useContext(StoreContext);
  const isPageOpen = controls.isPageOpen;

  /**
   * Fallback close button callback
   */
  const closeCb = useMemo(
    () =>
      action('page_content_closed', () => {
        controls.notifyOfPageClose();
      }),
    [controls]
  );

  /**
   * Render content appropriate for the current user interface state
   */
  let content = <DefaultContent closeCb={closeCb} />;
  if (isPageOpen) {
    switch (controls.mode) {
      case InteractionMode.DragPoint:
      case InteractionMode.EditVertices:
        break;
      case InteractionMode.DrawPoint:
      case InteractionMode.DrawPolygon:
      case InteractionMode.DrawPolyline:
      case InteractionMode.EditMetadata:
        content = <MetadataEditorConsumer />;
        break;
      case InteractionMode.SelectMultiple:
        break;
      case InteractionMode.SelectSingle:
        content = <MetadataView />;
        break;
    }
  }
  return <ConfirmationPage>{content}</ConfirmationPage>;
}

/**
 * Renderable MobX wrapper for {@link _PageContent}
 */
export const PageContent = observer(_PageContent);
