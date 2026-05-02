import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    Pressable,
    StyleSheet,
    ActivityIndicator,
    SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useActiveWorkout } from '../../src/Hooks/useActiveWorkout';
import { useNotification } from '../../src/Hooks/useNotification';
import { ExerciseInfoService } from '../../src/Services/ExerciseInfoService';
import ExerciseInfo from '../../src/Domain/ExerciseInfo';
import { MuscleGroupLabels } from '../../src/Enums/MuscleGroup';
import AddExerciseInfoModal from '../../src/Components/AddExerciseInfoModal';
import { Colors } from '../../src/Theme/colors';

export default function ExercisesScreen() {
    const [exerciseInfos, setExerciseInfos] = useState<ExerciseInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const { showError } = useNotification();
    const { hasActiveWorkout, activeWorkoutId } = useActiveWorkout();
    const router = useRouter();

    useEffect(() => {
        fetchExercises();
    }, []);

    async function fetchExercises() {
        try {
            const data = await ExerciseInfoService.getExerciseInfos();
            setExerciseInfos(data);
        } catch {
            showError('Failed to load exercises');
        } finally {
            setLoading(false);
        }
    }

    async function handleAfterAdd() {
        setShowAddModal(false);
        setLoading(true);
        await fetchExercises();
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
                <Text style={styles.title}>All Exercises</Text>
                <Pressable style={styles.addButton} onPress={() => setShowAddModal(true)}>
                    <Text style={styles.addButtonText}>+ Add</Text>
                </Pressable>
            </View>

            {exerciseInfos.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No exercises yet.</Text>
                    <Text style={styles.emptySubtext}>Add your first exercise to get started.</Text>
                </View>
            ) : (
                <FlatList
                    data={exerciseInfos}
                    keyExtractor={item => item.Id || String(item.Key)}
                    renderItem={({ item }) => (
                        <View style={styles.exerciseRow}>
                            <Text style={styles.exerciseName}>{item.Name}</Text>
                            <View style={styles.chips}>
                                <View style={[styles.chip, styles.chipPrimary]}>
                                    <Text style={styles.chipPrimaryText}>
                                        {MuscleGroupLabels[item.PrimaryMuscleGroup]}
                                    </Text>
                                </View>
                                {item.SecondaryMuscleGroups.map(mg => (
                                    <View key={mg} style={styles.chip}>
                                        <Text style={styles.chipText}>{MuscleGroupLabels[mg]}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
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

            <AddExerciseInfoModal
                visible={showAddModal}
                onClose={() => setShowAddModal(false)}
                afterAdd={handleAfterAdd}
            />
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
    addButton: {
        backgroundColor: Colors.primary,
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 7,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    list: {
        paddingBottom: 80,
    },
    exerciseRow: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    exerciseName: {
        color: Colors.text,
        fontSize: 15,
        fontWeight: '500',
        marginBottom: 6,
    },
    chips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
    },
    chip: {
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    chipPrimary: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    chipText: {
        color: Colors.textSecondary,
        fontSize: 11,
    },
    chipPrimaryText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '500',
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
