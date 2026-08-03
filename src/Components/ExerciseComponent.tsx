import React from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView } from 'react-native';
import Exercise from '../Domain/Exercise';
import Set from '../Domain/Set';
import { TargetSource } from '../Enums/TargetSource';
import { Colors } from '../Theme/colors';

interface ExerciseProps {
    exercise: Exercise;
    onChange: (exercise: Exercise) => void;
    onSetCompleted?: () => void;
}

const ExerciseComponent: React.FC<ExerciseProps> = ({ exercise, onChange, onSetCompleted }) => {
    function handleAddSet() {
        const updatedExercise = new Exercise({
            ...exercise,
            Sets: [...exercise.Sets, new Set()]
        });
        onChange(updatedExercise);
    }

    function handleSetWeightChanged(key: number, value: string) {
        const parsedValue = parseInt(value) || 0;
        const updatedExercise = new Exercise({
            ...exercise,
            Sets: exercise.Sets.map(set =>
                set.Key !== key ? set : new Set({ ...set, Weight: parsedValue })
            )
        });
        onChange(updatedExercise);
    }

    function handleSetRepsChanged(key: number, value: string) {
        const parsedValue = parseInt(value) || 0;
        const updatedExercise = new Exercise({
            ...exercise,
            Sets: exercise.Sets.map(set =>
                set.Key !== key ? set : new Set({ ...set, Reps: parsedValue })
            )
        });
        onChange(updatedExercise);
    }

    function handleSetCompletedChanged(key: number, value: boolean) {
        const updatedExercise = new Exercise({
            ...exercise,
            Sets: exercise.Sets.map(set =>
                set.Key !== key ? set : new Set({ ...set, Completed: value })
            )
        });
        onChange(updatedExercise);
        // Start the rest timer only when a set is being marked complete.
        if (value) {
            onSetCompleted?.();
        }
    }

    const target = exercise.Target;
    const hasTarget = !!target && target.Sets.length > 0;
    const targetLabel = target?.Type === TargetSource.Plan ? '🎯 Goal' : 'Previous';

    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <Text style={styles.exerciseName} numberOfLines={1}>{exercise.ExerciseInfo?.Name}</Text>
                <Pressable style={styles.addSetButton} onPress={handleAddSet}>
                    <Text style={styles.addSetButtonText}>+ Add Set</Text>
                </Pressable>
            </View>

            {exercise.Sets.length > 0 ? (
                <View style={styles.table}>
                    {/* Header row */}
                    <View style={styles.tableRow}>
                        <Text style={[styles.tableHeader, styles.colSet]}>Set</Text>
                        {hasTarget && <Text style={[styles.tableHeader, styles.colPrev]}>{targetLabel}</Text>}
                        <Text style={[styles.tableHeader, styles.colInput]}>Weight</Text>
                        <Text style={[styles.tableHeader, styles.colInput]}>Reps</Text>
                        <Text style={[styles.tableHeader, styles.colCheck]}>✓</Text>
                    </View>

                    {exercise.Sets.map((set, index) => (
                        <View
                            key={set.Key}
                            style={[styles.tableRow, set.Completed && styles.tableRowCompleted]}
                        >
                            <Text style={[styles.tableCell, styles.colSet]}>{index + 1}</Text>
                            {hasTarget && (
                                <Text style={[styles.tableCell, styles.colPrev, styles.prevText]}>
                                    {target!.Sets[index]
                                        ? `${target!.Sets[index].Weight ?? '—'} × ${target!.Sets[index].Reps ?? '—'}`
                                        : '—'}
                                </Text>
                            )}
                            <TextInput
                                style={[styles.input, styles.colInput]}
                                value={set.Weight ? String(set.Weight) : ''}
                                onChangeText={v => handleSetWeightChanged(set.Key, v)}
                                keyboardType="numeric"
                                placeholder="0"
                                placeholderTextColor={Colors.textSecondary}
                                selectTextOnFocus
                            />
                            <TextInput
                                style={[styles.input, styles.colInput]}
                                value={set.Reps ? String(set.Reps) : ''}
                                onChangeText={v => handleSetRepsChanged(set.Key, v)}
                                keyboardType="numeric"
                                placeholder="0"
                                placeholderTextColor={Colors.textSecondary}
                                selectTextOnFocus
                            />
                            <Pressable
                                style={[styles.checkbox, set.Completed && styles.checkboxChecked]}
                                onPress={() => handleSetCompletedChanged(set.Key, !set.Completed)}
                            >
                                {set.Completed && <Text style={styles.checkmark}>✓</Text>}
                            </Pressable>
                        </View>
                    ))}
                </View>
            ) : (
                <Text style={styles.emptyText}>No sets added yet. Tap "+ Add Set" to get started.</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.surface,
        borderRadius: 12,
        marginHorizontal: 12,
        marginVertical: 6,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    exerciseName: {
        color: Colors.text,
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
        marginRight: 8,
    },
    addSetButton: {
        borderWidth: 1,
        borderColor: Colors.primary,
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    addSetButtonText: {
        color: Colors.primary,
        fontSize: 13,
        fontWeight: '500',
    },
    table: {
        borderRadius: 6,
        overflow: 'hidden',
    },
    tableRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    tableRowCompleted: {
        opacity: 0.6,
    },
    tableHeader: {
        color: Colors.textSecondary,
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
    },
    tableCell: {
        color: Colors.text,
        fontSize: 14,
        textAlign: 'center',
    },
    prevText: {
        color: Colors.textSecondary,
        fontSize: 12,
    },
    colSet: {
        width: 32,
    },
    colPrev: {
        flex: 1,
    },
    colInput: {
        width: 64,
        marginHorizontal: 4,
    },
    colCheck: {
        width: 36,
    },
    input: {
        backgroundColor: Colors.inputBackground,
        color: Colors.text,
        borderRadius: 6,
        paddingVertical: 6,
        paddingHorizontal: 4,
        textAlign: 'center',
        fontSize: 14,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    checkbox: {
        width: 28,
        height: 28,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: Colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 4,
    },
    checkboxChecked: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    checkmark: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
    emptyText: {
        color: Colors.textSecondary,
        fontSize: 13,
        textAlign: 'center',
        paddingVertical: 8,
    },
});

export default ExerciseComponent;
