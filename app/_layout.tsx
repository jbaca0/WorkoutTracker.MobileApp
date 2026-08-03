import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { NotificationProvider } from '../src/Hooks/useNotification';
import { ActiveWorkoutProvider } from '../src/Hooks/useActiveWorkout';
import { AuthProvider } from '../src/Hooks/useAuth';
import { configureAudioMode } from '../src/Utilities/sound';

export default function RootLayout() {
    useEffect(() => {
        configureAudioMode();
    }, []);

    return (
        <NotificationProvider>
            <ActiveWorkoutProvider>
                <AuthProvider>
                    <StatusBar style="light" />
                    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#121212' } }} />
                </AuthProvider>
            </ActiveWorkoutProvider>
        </NotificationProvider>
    );
}
