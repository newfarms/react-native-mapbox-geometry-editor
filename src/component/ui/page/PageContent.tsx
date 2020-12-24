import React, { useCallback, useContext, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import { Button, Paragraph, Surface } from 'react-native-paper';

import { StoreContext } from '../../../state/StoreContext';

/**
 * @ignore
 */
const styles = StyleSheet.create({
  surface: {
    flex: 1,
  },
});

/**
 * A component to be rendered inside a full page display
 * (such as [[PageContainer]]). This component serves as a dispatcher
 * to render content that is appropriate for the current state
 * of the user interface controller.
 */
function _PageContent() {
  const { controls } = useContext(StoreContext).store;

  const onPress = useCallback(() => {
    controls.cancel();
  }, [controls]);

  /**
   * This effect is a failsafe mechanism that ensures that the user interface
   * controller is notified when the page is closed, so that the controller
   * can update its state accordingly and discard any temporary unsaved data.
   *
   * The page should be closed through the user interface controller,
   * but that rule cannot be enforced when the client application is
   * responsible for opening and closing the page.
   */
  useEffect(() => {
    return () => {
      controls.cancel(true);
    };
  }, [controls]);

  return (
    <Surface style={styles.surface}>
      <Paragraph>Test page content</Paragraph>
      <Button onPress={onPress}>Close</Button>
    </Surface>
  );
}

/**
 * Renderable MobX wrapper for [[_PageContent]]
 */
export const PageContent = observer(_PageContent);
