import React, { useState } from 'react';
import {
    View,
    Text,
    Pressable,
    StyleSheet,
    ActivityIndicator,
    SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/Hooks/useAuth';
import { useActiveWorkout } from '../../src/Hooks/useActiveWorkout';
import { useNotification } from '../../src/Hooks/useNotification';
import { WorkoutService } from '../../src/Services/WorkoutService';
import { Colors } from '../../src/Theme/colors';

export default function HomeScreen() {
    const { user, logout } = useAuth();
    const { hasActiveWorkout, activeWorkoutId, setActiveWorkout } = useActiveWorkout();
    const { showError } = useNotification();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    async function handleStartWorkout() {
        setLoading(true);
        try {
            const workoutId = await WorkoutService.addWorkout();
            setActiveWorkout(workoutId);
            router.push(`/workout/${workoutId}`);
        } catch {
            showError('Failed to start workout');
        } finally {
            setLoading(false);
        }
    }

    function handleContinueWorkout() {
        router.push(`/workout/${activeWorkoutId}`);
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.topBar}>
                <Pressable style={styles.logoutButton} onPress={logout}>
                    <Text style={styles.logoutText}>Log Out</Text>
                </Pressable>
            </View>

            <View style={styles.center}>
                <Text style={styles.welcome}>
                    Welcome{user?.email ? `, ${user.email}` : ''}
                </Text>

                {hasActiveWorkout ? (
                    <Pressable style={styles.primaryButton} onPress={handleContinueWorkout}>
                        <Text style={styles.primaryButtonText}>🏋️  Continue Workout</Text>
                    </Pressable>
                ) : (
                    <Pressable
                        style={[styles.primaryButton, loading && styles.buttonDisabled]}
                        onPress={handleStartWorkout}
                        disabled={loading}
                    >
                        {loading
                            ? <ActivityIndicator color="#fff" />
                            : <Text style={styles.primaryButtonText}>▶  Start Workout</Text>
                        }
                    </Pressable>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    topBar: {
        alignItems: 'flex-end',
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    logoutButton: {
        padding: 8,
    },
    logoutText: {
        color: Colors.textSecondary,
        fontSize: 14,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 24,
        padding: 24,
    },
    welcome: {
        color: Colors.text,
        fontSize: 22,
        fontWeight: '700',
        textAlign: 'center',
    },
    primaryButton: {
        backgroundColor: Colors.primary,
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 40,
        minWidth: 220,
        alignItems: 'center',
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '600',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
});
