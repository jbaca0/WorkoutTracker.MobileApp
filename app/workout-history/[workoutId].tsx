import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    Pressable,
    StyleSheet,
    ActivityIndicator,
    SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WorkoutService } from '../../src/Services/WorkoutService';
import Workout from '../../src/Domain/Workout';
import ReadOnlyExerciseComponent from '../../src/Components/ReadOnlyExerciseComponent';
import { useNotification } from '../../src/Hooks/useNotification';
import { Colors } from '../../src/Theme/colors';

export default function WorkoutHistoryDetailScreen() {
    const { workoutId } = useLocalSearchParams<{ workoutId: string }>();
    const router = useRouter();
    const { showError } = useNotification();
    const [workout, setWorkout] = useState<Workout | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!workoutId) return;
        WorkoutService.getWorkoutDetail(workoutId)
            .then(setWorkout)
            .catch(() => showError('Failed to load workout details'))
            .finally(() => setLoading(false));
    }, [workoutId]);

    function formatDate(date: Date): string {
        return date.toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <ActivityIndicator style={styles.loader} color={Colors.primary} size="large" />
            </SafeAreaView>
        );
    }

    if (!workout) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Pressable style={styles.backButton} onPress={() => router.back()}>
                        <Text style={styles.backText}>‹ Back</Text>
                    </Pressable>
                </View>
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>Workout not found.</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Pressable style={styles.backButton} onPress={() => router.back()}>
                    <Text style={styles.backText}>‹ Back</Text>
                </Pressable>
                <Text style={styles.title}>
                    {workout.AddDateTime ? formatDate(workout.AddDateTime) : 'Workout'}
                </Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {workout.Exercises.length === 0 ? (
                    <Text style={styles.emptyExercisesText}>No exercises in this workout.</Text>
                ) : (
                    workout.Exercises.map(exercise => (
                        <ReadOnlyExerciseComponent key={exercise.Key} exercise={exercise} />
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    loader: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    backButton: {
        marginBottom: 4,
    },
    backText: {
        color: Colors.primary,
        fontSize: 16,
    },
    title: {
        color: Colors.text,
        fontSize: 20,
        fontWeight: '700',
    },
    content: {
        paddingTop: 8,
        paddingBottom: 24,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        color: Colors.textSecondary,
        fontSize: 15,
    },
    emptyExercisesText: {
        color: Colors.textSecondary,
        fontSize: 14,
        textAlign: 'center',
        marginTop: 24,
    },
});
