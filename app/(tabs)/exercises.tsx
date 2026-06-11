import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AddExerciseInfoModal from '../../src/Components/AddExerciseInfoModal';
import ExerciseInfo from '../../src/Domain/ExerciseInfo';
import { MuscleGroupLabels } from '../../src/Enums/MuscleGroup';
import { useNotification } from '../../src/Hooks/useNotification';
import { ExerciseInfoService } from '../../src/Services/ExerciseInfoService';
import { Colors } from '../../src/Theme/colors';

export default function ExercisesScreen() {
    const [exerciseInfos, setExerciseInfos] = useState<ExerciseInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const { showError } = useNotification();

    useEffect(() => {
        fetchExercises();
    }, []);

    async function fetchExercises() {
        try {
            const data = await ExerciseInfoService.getExerciseInfos();
            setExerciseInfos(data);
        } catch {
            showError('Failed to load exercises. Please try again.');
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
});
