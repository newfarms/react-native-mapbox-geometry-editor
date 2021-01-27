import React, { useContext, useEffect, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { action } from 'mobx';
import { observer } from 'mobx-react-lite';
import { Button, Paragraph, Surface } from 'react-native-paper';

import { StoreContext } from '../../../state/StoreContext';
import { InteractionMode } from '../../../state/ControlsModel';
import { MetadataEditor } from '../../ui/MetadataEditor';
import { MetadataView } from '../../ui/MetadataView';
import { ConfirmationPage } from './ConfirmationPage';

/**
 * @ignore
 */
const styles = StyleSheet.create({
  surface: {
    flex: 1,
    justifyContent: 'center',
  },
  paragraph: {
    alignSelf: 'center',
  },
});

/**
 * Fallback content that is displayed when the page is rendered
 * while [[ControlsModel]] is not in an appropriate state
 * for the page to be rendered.
 * @param props Rendering props
 */
export function DefaultContent({
  closeCb,
}: {
  /**
   * A callback that will close the page
   */
  closeCb: () => void;
}) {
  return (
    <Surface style={styles.surface}>
      <Paragraph style={styles.paragraph}>Return to the map</Paragraph>
      <Button onPress={closeCb}>Close</Button>
    </Surface>
  );
}

/**
 * A component to be rendered inside a full page display
 * (such as [[PageContainer]]). This component serves as a dispatcher
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
   * This effect is a failsafe mechanism that ensures that the user interface
   * controller is notified when the page is closed, so that the controller
   * can update its state accordingly and discard any temporary unsaved data.
   *
   * The page should be closed through the user interface controller,
   * but perhaps there are exceptions to this rule.
   */
  useEffect(() => {
    return closeCb;
  }, [closeCb]);

  /**
   * Render content appropriate for the current user interface state
   */
  let content = <DefaultContent closeCb={closeCb} />;
  if (isPageOpen) {
    switch (controls.mode) {
      case InteractionMode.DragPoint:
        break;
      case InteractionMode.DrawPoint:
      case InteractionMode.DrawPolygon:
      case InteractionMode.EditMetadata:
        content = <MetadataEditor />;
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
 * Renderable MobX wrapper for [[_PageContent]]
 */
export const PageContent = observer(_PageContent);
