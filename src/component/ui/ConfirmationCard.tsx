import * as React from 'react';
import { StyleSheet } from 'react-native';
import { Paragraph, Button, Card, Surface } from 'react-native-paper';

import { DEFAULT_CONFIRMATION_TITLE } from '../../state/ConfirmationModel';

/**
 * @ignore
 */
const styles = StyleSheet.create({
  surfaceCentered: {
    flex: 1,
    justifyContent: 'center',
  },
});

/**
 * A component that renders a confirmation view requesting that the user
 * confirm or cancel an operation.
 *
 * @param props Render properties
 * @return Renderable React node
 */
export function ConfirmationCard({
  onDismiss,
  onConfirm,
  message,
  title = DEFAULT_CONFIRMATION_TITLE,
  visible = true,
}: {
  readonly onDismiss: () => void;
  readonly onConfirm: () => void;
  readonly message: string;
  readonly title?: string;
  readonly visible?: boolean;
}) {
  if (visible) {
    return (
      <Surface style={styles.surfaceCentered}>
        <Card>
          <Card.Title title={title} />
          <Card.Content>
            <Paragraph>{message}</Paragraph>
          </Card.Content>
          <Card.Actions>
            <Button onPress={onConfirm}>Yes</Button>
            <Button onPress={onDismiss}>No</Button>
          </Card.Actions>
        </Card>
      </Surface>
    );
  } else {
    return null;
  }
}
