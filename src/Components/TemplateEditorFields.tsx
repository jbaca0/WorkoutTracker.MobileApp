import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import ExerciseInfo from '../Domain/ExerciseInfo';
import { WorkoutTemplateExerciseRequest } from '../DataTransferObjects/Requests/WorkoutTemplate/CreateTemplateRequest';
import { Colors } from '../Theme/colors';
import AddExerciseModal from './AddExerciseModal';

interface TemplateEditorFieldsProps {
    name: string;
    onNameChange: (value: string) => void;
    exercises: WorkoutTemplateExerciseRequest[];
    onExercisesChange: (exercises: WorkoutTemplateExerciseRequest[]) => void;
    exerciseInfos: ExerciseInfo[];
}

/**
 * The name + exercises + per-set reps fields of a workout template.
 *
 * Shared by the standalone template editor screen and the inline "New Template"
 * flow in the plan editor, so the two cannot drift apart. Callers supply their
 * own header, scroll container and save action.
 */
const TemplateEditorFields: React.FC<TemplateEditorFieldsProps> = ({
    name,
    onNameChange,
    exercises,
    onExercisesChange,
    exerciseInfos,
}) => {
    const [showExercisePicker, setShowExercisePicker] = useState(false);

    function getExerciseName(exerciseInfoId: string): string {
        return exerciseInfos.find(ei => ei.Id === exerciseInfoId)?.Name || 'Exercise';
    }

    function addSet(exerciseInfoId: string) {
        onExercisesChange(exercises.map(e =>
            e.exerciseInfoId === exerciseInfoId
                ? { ...e, sets: [...e.sets, { reps: 0 }] }
                : e
        ));
    }

    function removeSet(exerciseInfoId: string, setIndex: number) {
        onExercisesChange(exercises.map(e =>
            e.exerciseInfoId === exerciseInfoId
                ? { ...e, sets: e.sets.filter((_, i) => i !== setIndex) }
                : e
        ));
    }

    function updateSetReps(exerciseInfoId: string, setIndex: number, value: string) {
        const reps = parseInt(value) || 0;
        onExercisesChange(exercises.map(e =>
            e.exerciseInfoId === exerciseInfoId
                ? { ...e, sets: e.sets.map((s, i) => (i === setIndex ? { reps } : s)) }
                : e
        ));
    }

    function removeExercise(exerciseInfoId: string) {
        onExercisesChange(exercises.filter(e => e.exerciseInfoId !== exerciseInfoId));
    }

    return (
        <>
            <Text style={styles.sectionLabel}>Template Name</Text>
            <TextInput
                style={styles.nameInput}
                value={name}
                onChangeText={onNameChange}
                placeholder="e.g. Push Day"
                placeholderTextColor={Colors.textSecondary}
            />

            <Text style={styles.sectionLabel}>Exercises</Text>
            {exercises.length === 0 ? (
                <Text style={styles.emptyText}>No exercises added yet.</Text>
            ) : (
                exercises.map(pe => (
                    <View key={pe.exerciseInfoId} style={styles.exerciseCard}>
                        <View style={styles.exerciseCardTop}>
                            <Text style={styles.exerciseName} numberOfLines={1}>
                                {getExerciseName(pe.exerciseInfoId)}
                            </Text>
                            <Pressable
                                onPress={() => removeExercise(pe.exerciseInfoId)}
                                style={styles.removeExerciseBtn}
                            >
                                <Text style={styles.removeExerciseBtnText}>Remove</Text>
                            </Pressable>
                        </View>

                        {pe.sets.map((set, setIndex) => (
                            <View key={setIndex} style={styles.setRow}>
                                <Text style={styles.setLabel}>Set {setIndex + 1}</Text>
                                <Text style={styles.repsLabel}>Reps</Text>
                                <TextInput
                                    style={styles.repsInput}
                                    value={set.reps ? String(set.reps) : ''}
                                    onChangeText={v => updateSetReps(pe.exerciseInfoId, setIndex, v)}
                                    keyboardType="numeric"
                                    placeholder="0"
                                    placeholderTextColor={Colors.textSecondary}
                                />
                                {pe.sets.length > 1 && (
                                    <Pressable
                                        onPress={() => removeSet(pe.exerciseInfoId, setIndex)}
                                        style={styles.removeSetBtn}
                                    >
                                        <Text style={styles.removeSetBtnText}>×</Text>
                                    </Pressable>
                                )}
                            </View>
                        ))}

                        <Pressable onPress={() => addSet(pe.exerciseInfoId)} style={styles.addSetBtn}>
                            <Text style={styles.addSetBtnText}>+ Add Set</Text>
                        </Pressable>
                    </View>
                ))
            )}

            <Pressable style={styles.addExercisesBtn} onPress={() => setShowExercisePicker(true)}>
                <Text style={styles.addExercisesBtnText}>+ Add Exercises</Text>
            </Pressable>

            <AddExerciseModal
                visible={showExercisePicker}
                onClose={() => setShowExercisePicker(false)}
                onExercisesAdded={async ids => {
                    const existingIds = new Set(exercises.map(e => e.exerciseInfoId));
                    const additions = ids
                        .filter(id => !existingIds.has(id))
                        .map(id => ({ exerciseInfoId: id, sets: [{ reps: 0 }] }));
                    onExercisesChange([...exercises, ...additions]);
                    setShowExercisePicker(false);
                }}
            />
        </>
    );
};

const styles = StyleSheet.create({
    sectionLabel: {
        color: Colors.textSecondary,
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 8,
        marginTop: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    nameInput: {
        backgroundColor: Colors.inputBackground,
        color: Colors.text,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: 20,
    },
    emptyText: { color: Colors.textSecondary, fontSize: 14, marginBottom: 8 },
    exerciseCard: {
        backgroundColor: Colors.inputBackground,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: 12,
        marginBottom: 10,
    },
    exerciseCardTop: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    exerciseName: { color: Colors.text, fontSize: 15, fontWeight: '600', flex: 1 },
    removeExerciseBtn: {
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 4,
        marginLeft: 8,
    },
    removeExerciseBtnText: { color: Colors.error, fontSize: 12 },
    setRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    setLabel: { color: Colors.textSecondary, fontSize: 13, width: 44 },
    repsLabel: { color: Colors.textSecondary, fontSize: 13, marginRight: 6 },
    repsInput: {
        backgroundColor: Colors.background,
        color: Colors.text,
        borderRadius: 6,
        paddingVertical: 5,
        paddingHorizontal: 8,
        textAlign: 'center',
        fontSize: 14,
        borderWidth: 1,
        borderColor: Colors.border,
        width: 56,
    },
    removeSetBtn: { marginLeft: 10, padding: 4 },
    removeSetBtnText: { color: Colors.error, fontSize: 20, lineHeight: 22 },
    addSetBtn: {
        marginTop: 6,
        paddingVertical: 6,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 6,
    },
    addSetBtnText: { color: Colors.primary, fontSize: 13, fontWeight: '500' },
    addExercisesBtn: {
        marginTop: 12,
        borderWidth: 1,
        borderColor: Colors.primary,
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: 'center',
    },
    addExercisesBtnText: { color: Colors.primary, fontSize: 15, fontWeight: '600' },
});

export default TemplateEditorFields;
