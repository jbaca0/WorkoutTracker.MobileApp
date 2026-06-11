import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    Pressable,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/Hooks/useAuth';
import { useActiveWorkout } from '../../src/Hooks/useActiveWorkout';
import { useNotification } from '../../src/Hooks/useNotification';
import { WorkoutService } from '../../src/Services/WorkoutService';
import { WorkoutPlanService } from '../../src/Services/WorkoutPlanService';
import { WorkoutTemplateService } from '../../src/Services/WorkoutTemplateService';
import GetTodaysWorkoutResponse from '../../src/DataTransferObjects/Responses/WorkoutPlan/GetTodaysWorkoutResponse';
import { Colors } from '../../src/Theme/colors';

export default function HomeScreen() {
    const { user, logout } = useAuth();
    const { hasActiveWorkout, activeWorkoutId, setActiveWorkout } = useActiveWorkout();
    const { showError } = useNotification();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [todaysWorkout, setTodaysWorkout] = useState<GetTodaysWorkoutResponse | null>(null);
    const [startingScheduled, setStartingScheduled] = useState(false);

    useEffect(() => {
        if (!hasActiveWorkout) {
            WorkoutPlanService.getTodaysWorkout().then(setTodaysWorkout);
        }
    }, [hasActiveWorkout]);

    async function handleStartScheduledWorkout() {
        if (!todaysWorkout?.template) return;
        setStartingScheduled(true);
        try {
            const result = await WorkoutTemplateService.startWorkoutFromTemplate(todaysWorkout.template.id);
            setActiveWorkout(result.workoutId);
            router.push(`/workout/${result.workoutId}`);
        } catch {
            showError('Failed to start workout. Please try again.');
        } finally {
            setStartingScheduled(false);
        }
    }

    async function handleStartWorkout() {
        setLoading(true);
        try {
            const workoutId = await WorkoutService.addWorkout();
            setActiveWorkout(workoutId);
            router.push(`/workout/${workoutId}`);
        } catch {
            showError('Failed to start workout. Please try again.');
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

                {!hasActiveWorkout && todaysWorkout?.template && (
                    <View style={styles.todayCard}>
                        <Text style={styles.todayLabel}>Today's Workout</Text>
                        <Text style={styles.todayTemplateName}>{todaysWorkout.template.name}</Text>
                        {todaysWorkout.template.exercises.slice(0, 3).map((e, i) => (
                            <Text key={i} style={styles.todayExercise}>
                                {e.exerciseInfo?.name ?? ''}
                            </Text>
                        ))}
                        {todaysWorkout.template.exercises.length > 3 && (
                            <Text style={styles.todayMore}>+{todaysWorkout.template.exercises.length - 3} more</Text>
                        )}
                        <Pressable
                            style={[styles.primaryButton, startingScheduled && styles.buttonDisabled, { marginTop: 12 }]}
                            onPress={handleStartScheduledWorkout}
                            disabled={startingScheduled}
                        >
                            {startingScheduled
                                ? <ActivityIndicator color="#fff" />
                                : <Text style={styles.primaryButtonText}>▶  Start Today's Workout</Text>
                            }
                        </Pressable>
                    </View>
                )}

                {!hasActiveWorkout && todaysWorkout?.note && !todaysWorkout?.template && (
                    <View style={styles.restCard}>
                        <Text style={styles.restLabel}>Today</Text>
                        <Text style={styles.restNote}>{todaysWorkout.note}</Text>
                    </View>
                )}

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
    todayCard: {
        backgroundColor: Colors.surface,
        borderRadius: 14,
        padding: 18,
        width: '100%',
        borderWidth: 1,
        borderColor: Colors.primary,
    },
    todayLabel: {
        color: Colors.primary,
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 4,
    },
    todayTemplateName: {
        color: Colors.text,
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 8,
    },
    todayExercise: {
        color: Colors.textSecondary,
        fontSize: 14,
        lineHeight: 22,
    },
    todayMore: {
        color: Colors.textSecondary,
        fontSize: 13,
        marginTop: 2,
    },
    restCard: {
        backgroundColor: Colors.surface,
        borderRadius: 14,
        padding: 18,
        width: '100%',
        borderWidth: 1,
        borderColor: Colors.border,
        alignItems: 'center',
    },
    restLabel: {
        color: Colors.textSecondary,
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    restNote: {
        color: Colors.text,
        fontSize: 18,
        fontWeight: '600',
    },
});
