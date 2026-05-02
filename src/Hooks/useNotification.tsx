import { createContext, ReactNode, useCallback, useContext, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { Colors } from "../Theme/colors";

interface NotificationContext {
    showError: (message: string) => void;
    showSuccess: (message: string) => void;
}

const NotificationContext = createContext<NotificationContext | undefined>(undefined);

interface NotificationProviderProps {
    children: ReactNode;
}

interface ToastState {
    message: string;
    type: 'error' | 'success';
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
    const [toast, setToast] = useState<ToastState | null>(null);
    const opacity = useRef(new Animated.Value(0)).current;
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showToast = useCallback((message: string, type: 'error' | 'success') => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setToast({ message, type });
        Animated.timing(opacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
        }).start();

        timeoutRef.current = setTimeout(() => {
            Animated.timing(opacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start(() => setToast(null));
        }, 3000);
    }, [opacity]);

    const showError = useCallback((message: string) => showToast(message, 'error'), [showToast]);
    const showSuccess = useCallback((message: string) => showToast(message, 'success'), [showToast]);

    return (
        <NotificationContext.Provider value={{ showError, showSuccess }}>
            {children}
            {toast && (
                <Animated.View
                    style={[
                        styles.toast,
                        toast.type === 'error' ? styles.toastError : styles.toastSuccess,
                        { opacity }
                    ]}
                    pointerEvents="none"
                >
                    <Text style={styles.toastText}>{toast.message}</Text>
                </Animated.View>
            )}
        </NotificationContext.Provider>
    );
};

export function useNotification() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error("useNotification must be used within a NotificationProvider");
    }
    return context;
}

const styles = StyleSheet.create({
    toast: {
        position: 'absolute',
        bottom: 100,
        left: 16,
        right: 16,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        zIndex: 9999,
    },
    toastError: {
        backgroundColor: Colors.error,
    },
    toastSuccess: {
        backgroundColor: Colors.success,
    },
    toastText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
    },
});
