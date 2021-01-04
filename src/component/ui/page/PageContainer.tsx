import * as React from 'react';
import { Modal, SafeAreaView, StyleSheet } from 'react-native';

import type { PageProps } from '../../../type/ui';

/**
 * @ignore
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

/**
 * A full-page display that serves as a container for content
 * @param props Rendering props
 */
export function PageContainer({
  pageContent,
  onDismissRequest,
  onDismissed,
}: PageProps) {
  return (
    <Modal
      animationType="slide"
      onDismiss={onDismissed}
      onRequestClose={onDismissRequest}
      presentationStyle="fullScreen"
      statusBarTranslucent={false}
    >
      <SafeAreaView style={styles.container}>{pageContent()}</SafeAreaView>
    </Modal>
  );
}
