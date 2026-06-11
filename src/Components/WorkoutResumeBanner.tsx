import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useActiveWorkout } from '../Hooks/useActiveWorkout';
import { WorkoutService } from '../Services/WorkoutService';
import { Colors } from '../Theme/colors';

function formatElapsed(startTime: string | null): string {
    if (!startTime) return '';
    const elapsed = Math.floor((Date.now() - new Date(startTime).getTime()) / 1000);
    if (elapsed < 60) return `${elapsed}s`;
    const m = Math.floor(elapsed / 60);
    const s = elapsed % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export default function WorkoutResumeBanner() {
    const { hasActiveWorkout, activeWorkoutId, workoutStartTime, clearActiveWorkout } = useActiveWorkout();
    const router = useRouter();
    const [elapsed, setElapsed] = useState(() => formatElapsed(workoutStartTime));
    const [exerciseName, setExerciseName] = useState<string | null>(null);

    useEffect(() => {
        if (!workoutStartTime) {
            setElapsed('');
            return;
        }
        setElapsed(formatElapsed(workoutStartTime));
        const interval = setInterval(() => setElapsed(formatElapsed(workoutStartTime)), 1000);
        return () => clearInterval(interval);
    }, [workoutStartTime]);

    useEffect(() => {
        if (!activeWorkoutId) {
            setExerciseName(null);
            return;
        }
        WorkoutService.getWorkoutDetail(activeWorkoutId)
            .then(workout => {
                const last = workout.Exercises[workout.Exercises.length - 1];
                setExerciseName(last?.ExerciseInfo?.Name ?? null);
            })
            .catch(() => {});
    }, [activeWorkoutId]);

    if (!hasActiveWorkout) return null;

    function handleDiscard() {
        Alert.alert(
            'Cancel Workout?',
            'This will permanently delete this workout. This cannot be undone.',
            [
                { text: 'Keep Going', style: 'cancel' },
                {
                    text: 'Cancel Workout',
                    style: 'destructive',
                    onPress: async () => {
                        if (!activeWorkoutId) return;
                        try {
                            await WorkoutService.cancelWorkout(activeWorkoutId);
                        } catch {}
                        clearActiveWorkout();
                    },
                },
            ]
        );
    }

    function handleResume() {
        router.push(`/workout/${activeWorkoutId}`);
    }

    return (
        <View style={styles.container}>
            <Pressable style={styles.expandButton} onPress={handleResume}>
                <Ionicons name="chevron-up" size={20} color={Colors.text} />
            </Pressable>

            <Pressable style={styles.info} onPress={handleResume}>
                <View style={styles.titleRow}>
                    <View style={styles.dot} />
                    <Text style={styles.title}>
                        {'Workout'}
                        {elapsed ? ` ${elapsed}` : ''}
                    </Text>
                </View>
                {exerciseName && (
                    <Text style={styles.subtitle} numberOfLines={1}>
                        {exerciseName}
                    </Text>
                )}
            </Pressable>

            <Pressable style={styles.discardButton} onPress={handleDiscard}>
                <Ionicons name="trash" size={18} color={Colors.error} />
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surfaceRaised,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        paddingHorizontal: 12,
        paddingVertical: 10,
        gap: 10,
    },
    expandButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    info: {
        flex: 1,
        gap: 2,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.success,
    },
    title: {
        color: Colors.text,
        fontSize: 15,
        fontWeight: '600',
    },
    subtitle: {
        color: Colors.textSecondary,
        fontSize: 13,
        paddingLeft: 14,
    },
    discardButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(244,67,54,0.12)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
