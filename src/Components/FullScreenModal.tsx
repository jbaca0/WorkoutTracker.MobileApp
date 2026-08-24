import React from 'react';
import { Modal, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../Theme/colors';

interface FullScreenModalProps {
    visible: boolean;
    onRequestClose: () => void;
    children: React.ReactNode;
}

/**
 * Full-screen modal with correct safe-area handling.
 *
 * Two things this gets right that are easy to get wrong:
 *
 * 1. presentationStyle="fullScreen" rather than "pageSheet". Nested pageSheet
 *    modals leave an orphaned dimming container behind on dismiss, which shows
 *    as a dark border and swallows every touch. fullScreen nests and tears down
 *    cleanly, so these can be stacked.
 *
 * 2. Its own SafeAreaProvider. An iOS Modal renders into a separate native view
 *    hierarchy that the app-level provider does not reach, so insets resolve to
 *    zero and content slides under the status bar. A provider inside the modal
 *    measures within that hierarchy and gives real insets.
 */
const FullScreenModal: React.FC<FullScreenModalProps> = ({ visible, onRequestClose, children }) => (
    <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={onRequestClose}
    >
        <SafeAreaProvider>
            <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
                {children}
            </SafeAreaView>
        </SafeAreaProvider>
    </Modal>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
});

export default FullScreenModal;
