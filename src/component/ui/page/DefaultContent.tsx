import { StyleSheet } from 'react-native';
import { Button, Paragraph, Surface } from 'react-native-paper';

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
 * Fallback content that is displayed when a page is rendered
 * while {@link ControlsModel} is not in an appropriate state
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
