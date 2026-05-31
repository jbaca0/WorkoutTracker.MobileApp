import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    Pressable,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useActiveWorkout } from '../../src/Hooks/useActiveWorkout';
import { useNotification } from '../../src/Hooks/useNotification';
import { WorkoutService } from '../../src/Services/WorkoutService';
import WorkoutSummary from '../../src/Domain/WorkoutSummary';
import { Colors } from '../../src/Theme/colors';

export default function HistoryScreen() {
    const [workouts, setWorkouts] = useState<WorkoutSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const { showError } = useNotification();
    const { hasActiveWorkout, activeWorkoutId } = useActiveWorkout();
    const router = useRouter();

    useEffect(() => {
        WorkoutService.getWorkoutHistory()
            .then(setWorkouts)
            .catch(() => showError('Failed to load workout history'))
            .finally(() => setLoading(false));
    }, []);

    function formatDate(date: Date): string {
        return date.toLocaleDateString(undefined, {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
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

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Workout History</Text>
            </View>

            {workouts.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No workouts yet.</Text>
                    <Text style={styles.emptySubtext}>Complete a workout to see your history here.</Text>
                </View>
            ) : (
                <FlatList
                    data={workouts}
                    keyExtractor={item => item.Id}
                    renderItem={({ item }) => (
                        <Pressable
                            style={styles.workoutRow}
                            onPress={() => router.push(`/workout-history/${item.Id}`)}
                        >
                            <View style={styles.workoutInfo}>
                                <Text style={styles.workoutDate}>{formatDate(item.AddDateTime)}</Text>
                                <Text style={styles.workoutMeta}>
                                    {item.ExerciseCount} exercise{item.ExerciseCount !== 1 ? 's' : ''}
                                </Text>
                            </View>
                            <View style={styles.chips}>
                                {item.ExerciseNames.slice(0, 3).map((name, i) => (
                                    <View key={i} style={styles.chip}>
                                        <Text style={styles.chipText}>{name}</Text>
                                    </View>
                                ))}
                                {item.ExerciseCount > 3 && (
                                    <View style={styles.chip}>
                                        <Text style={styles.chipText}>+{item.ExerciseCount - 3}</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={styles.chevron}>›</Text>
                        </Pressable>
                    )}
                    contentContainerStyle={styles.list}
                />
            )}

            {hasActiveWorkout && (
                <Pressable
                    style={styles.fab}
                    onPress={() => router.push(`/workout/${activeWorkoutId}`)}
                >
                    <Text style={styles.fabText}>🏋️</Text>
                </Pressable>
            )}
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
    title: {
        color: Colors.text,
        fontSize: 22,
        fontWeight: '700',
    },
    list: {
        paddingBottom: 80,
    },
    workoutRow: {
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    workoutInfo: {
        flex: 1,
    },
    workoutDate: {
        color: Colors.text,
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 4,
    },
    workoutMeta: {
        color: Colors.textSecondary,
        fontSize: 13,
    },
    chips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
        flex: 1,
        justifyContent: 'flex-end',
    },
    chip: {
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        paddingHorizontal: 7,
        paddingVertical: 2,
    },
    chipText: {
        color: Colors.textSecondary,
        fontSize: 11,
    },
    chevron: {
        color: Colors.textSecondary,
        fontSize: 20,
        fontWeight: '300',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    emptyText: {
        color: Colors.text,
        fontSize: 16,
        fontWeight: '600',
    },
    emptySubtext: {
        color: Colors.textSecondary,
        fontSize: 14,
    },
    fab: {
        position: 'absolute',
        right: 16,
        bottom: 80,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
        elevation: 8,
    },
    fabText: {
        fontSize: 24,
    },
});
