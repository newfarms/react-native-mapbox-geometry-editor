import { Modal, SafeAreaView, StyleSheet } from 'react-native';

import { PageContent } from './PageContent';
import type { PageControls } from '../../../type/ui';

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
export function PageContainer({ onDismissRequest }: PageControls) {
  return (
    <Modal
      animationType="slide"
      onRequestClose={onDismissRequest}
      presentationStyle="fullScreen"
      statusBarTranslucent={false}
    >
      <SafeAreaView style={styles.container}>
        <PageContent />
      </SafeAreaView>
    </Modal>
  );
}
