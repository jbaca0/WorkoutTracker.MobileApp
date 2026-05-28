import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    Pressable,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WorkoutService } from '../../src/Services/WorkoutService';
import Exercise from '../../src/Domain/Exercise';
import Workout from '../../src/Domain/Workout';
import ExerciseComponent from '../../src/Components/ExerciseComponent';
import AddExerciseModal from '../../src/Components/AddExerciseModal';
import { useActiveWorkout } from '../../src/Hooks/useActiveWorkout';
import { useNotification } from '../../src/Hooks/useNotification';
import { generateWorkoutTitle } from '../../src/Utilities/WorkoutTitleGenerator';
import useDebounce from '../../src/Hooks/useDebounce';
import { Colors } from '../../src/Theme/colors';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export default function WorkoutScreen() {
    const { workoutId } = useLocalSearchParams<{ workoutId: string }>();
    const router = useRouter();
    const { clearActiveWorkout } = useActiveWorkout();
    const { showError } = useNotification();

    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [addingExercises, setAddingExercises] = useState(false);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
    const [showAddExercise, setShowAddExercise] = useState(false);
    const [showConfirmComplete, setShowConfirmComplete] = useState(false);
    const [showConfirmCancel, setShowConfirmCancel] = useState(false);

    const initialLoadComplete = useRef(false);
    const saveStatusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const debouncedExercises = useDebounce(exercises, 3000);

    useEffect(() => {
        if (!workoutId) return;
        WorkoutService.getWorkoutDetail(workoutId)
            .then(workout => {
                if (workout.Exercises.length > 0) {
                    setExercises(workout.Exercises);
                }
            })
            .catch(() => {
                clearActiveWorkout();
                router.replace('/(tabs)/home');
                showError('Your previous workout could not be found.');
            })
            .finally(() => {
                setLoading(false);
                initialLoadComplete.current = true;
            });
    }, [workoutId]);

    // Auto-save on debounced exercise changes
    useEffect(() => {
        if (!initialLoadComplete.current || !workoutId) return;
        if (debouncedExercises.length === 0) return;

        setSaveStatus('saving');
        WorkoutService.save(new Workout({ Id: workoutId, Exercises: debouncedExercises }))
            .then(() => {
                setSaveStatus('saved');
                if (saveStatusTimeoutRef.current) clearTimeout(saveStatusTimeoutRef.current);
                saveStatusTimeoutRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
            })
            .catch(() => {
                setSaveStatus('error');
                showError('Failed to save workout. Check your connection.');
            });
    }, [debouncedExercises, workoutId]);

    async function handleExercisesAdded(exerciseIds: string[]) {
        if (!workoutId) return;
        setAddingExercises(true);
        try {
            const added = await WorkoutService.addExercises(workoutId, exerciseIds);
            setExercises(prev => [...prev, ...added]);
            setShowAddExercise(false);
        } catch {
            showError('Failed to add exercises. Please try again.');
        } finally {
            setAddingExercises(false);
        }
    }

    function onExerciseChange(changed: Exercise) {
        setExercises(prev =>
            prev.map(e => e.Key === changed.Key ? changed : e)
        );
    }

    async function handleCompleteWorkout() {
        setShowConfirmComplete(false);
        if (!workoutId) return;
        setSaving(true);
        try {
            await WorkoutService.save(new Workout({ Id: workoutId, Exercises: exercises }));
            clearActiveWorkout();
            router.replace(`/workout-history/${workoutId}`);
        } catch {
            showError('Failed to save workout. Please try again.');
        } finally {
            setSaving(false);
        }
    }

    async function handleCancelWorkout() {
        setShowConfirmCancel(false);
        if (!workoutId) return;
        setCancelling(true);
        try {
            await WorkoutService.cancelWorkout(workoutId);
            clearActiveWorkout();
            router.replace('/(tabs)/home');
        } catch {
            showError('Failed to cancel workout. Please try again.');
        } finally {
            setCancelling(false);
        }
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
                <Pressable style={styles.backButton} onPress={() => router.replace('/(tabs)/home')}>
                    <Text style={styles.backButtonText}>← Home</Text>
                </Pressable>
                <Text style={styles.title}>{generateWorkoutTitle(exercises)}</Text>
                {saveStatus === 'saving' && <Text style={styles.saveStatus}>Saving…</Text>}
                {saveStatus === 'saved' && <Text style={[styles.saveStatus, styles.saveStatusSaved]}>Saved</Text>}
                {saveStatus === 'error' && <Text style={[styles.saveStatus, styles.saveStatusError]}>!</Text>}
            </View>

            <ScrollView style={styles.exerciseList} contentContainerStyle={styles.exerciseListContent}>
                {exercises.map(exercise => (
                    <ExerciseComponent
                        key={exercise.Key}
                        exercise={exercise}
                        onChange={onExerciseChange}
                    />
                ))}
            </ScrollView>

            <View style={styles.actions}>
                <Pressable
                    style={[styles.button, styles.buttonPrimary, addingExercises && styles.buttonDisabled]}
                    onPress={() => setShowAddExercise(true)}
                    disabled={addingExercises}
                >
                    {addingExercises
                        ? <ActivityIndicator color="#fff" size="small" />
                        : <Text style={styles.buttonText}>Add Exercise</Text>
                    }
                </Pressable>

                <Pressable
                    style={[styles.button, styles.buttonSecondary, (exercises.length === 0 || saving) && styles.buttonDisabled]}
                    onPress={() => setShowConfirmComplete(true)}
                    disabled={exercises.length === 0 || saving}
                >
                    {saving
                        ? <ActivityIndicator color="#fff" size="small" />
                        : <Text style={styles.buttonText}>Complete Workout</Text>
                    }
                </Pressable>

                <Pressable
                    style={[styles.button, styles.buttonOutlineError, (saving || cancelling) && styles.buttonDisabled]}
                    onPress={() => setShowConfirmCancel(true)}
                    disabled={saving || cancelling}
                >
                    {cancelling
                        ? <ActivityIndicator color={Colors.error} size="small" />
                        : <Text style={styles.buttonOutlineErrorText}>Cancel Workout</Text>
                    }
                </Pressable>
            </View>

            <AddExerciseModal
                visible={showAddExercise}
                onClose={() => setShowAddExercise(false)}
                onExercisesAdded={handleExercisesAdded}
            />

            {/* Confirm Complete Dialog */}
            <Modal visible={showConfirmComplete} transparent animationType="fade" onRequestClose={() => setShowConfirmComplete(false)}>
                <View style={styles.modalBackdrop}>
                    <View style={styles.dialog}>
                        <Text style={styles.dialogTitle}>Complete Workout?</Text>
                        <Text style={styles.dialogBody}>
                            This will save your workout with {exercises.length} exercise{exercises.length !== 1 ? 's' : ''}. You won't be able to edit it after.
                        </Text>
                        <View style={styles.dialogActions}>
                            <Pressable style={styles.dialogButtonSecondary} onPress={() => setShowConfirmComplete(false)}>
                                <Text style={styles.dialogButtonSecondaryText}>Cancel</Text>
                            </Pressable>
                            <Pressable style={styles.dialogButtonPrimary} onPress={handleCompleteWorkout}>
                                <Text style={styles.dialogButtonPrimaryText}>Complete</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Confirm Cancel Dialog */}
            <Modal visible={showConfirmCancel} transparent animationType="fade" onRequestClose={() => setShowConfirmCancel(false)}>
                <View style={styles.modalBackdrop}>
                    <View style={styles.dialog}>
                        <Text style={styles.dialogTitle}>Cancel Workout?</Text>
                        <Text style={styles.dialogBody}>
                            This will permanently delete this workout. This cannot be undone.
                        </Text>
                        <View style={styles.dialogActions}>
                            <Pressable style={styles.dialogButtonSecondary} onPress={() => setShowConfirmCancel(false)}>
                                <Text style={styles.dialogButtonSecondaryText}>Keep Going</Text>
                            </Pressable>
                            <Pressable style={[styles.dialogButtonPrimary, styles.dialogButtonError]} onPress={handleCancelWorkout}>
                                <Text style={styles.dialogButtonPrimaryText}>Cancel Workout</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
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
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        gap: 12,
    },
    backButton: {
        paddingVertical: 4,
        paddingRight: 8,
    },
    backButtonText: {
        color: Colors.primary,
        fontSize: 15,
        fontWeight: '500',
    },
    title: {
        color: Colors.text,
        fontSize: 18,
        fontWeight: '700',
        flex: 1,
    },
    saveStatus: {
        color: Colors.textSecondary,
        fontSize: 12,
    },
    saveStatusSaved: {
        color: Colors.primary,
    },
    saveStatusError: {
        color: Colors.error,
        fontWeight: '700',
        fontSize: 16,
    },
    exerciseList: {
        flex: 1,
    },
    exerciseListContent: {
        paddingBottom: 8,
    },
    actions: {
        padding: 12,
        gap: 10,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    button: {
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: 'center',
    },
    buttonPrimary: {
        backgroundColor: Colors.primary,
    },
    buttonSecondary: {
        backgroundColor: Colors.secondary,
    },
    buttonOutlineError: {
        borderWidth: 1,
        borderColor: Colors.error,
        backgroundColor: 'transparent',
    },
    buttonDisabled: {
        opacity: 0.4,
    },
    buttonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    buttonOutlineErrorText: {
        color: Colors.error,
        fontSize: 15,
        fontWeight: '600',
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    dialog: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 360,
    },
    dialogTitle: {
        color: Colors.text,
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 12,
    },
    dialogBody: {
        color: Colors.textSecondary,
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 20,
    },
    dialogActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
    },
    dialogButtonSecondary: {
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    dialogButtonSecondaryText: {
        color: Colors.textSecondary,
        fontSize: 15,
    },
    dialogButtonPrimary: {
        backgroundColor: Colors.primary,
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    dialogButtonError: {
        backgroundColor: Colors.error,
    },
    dialogButtonPrimaryText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
});
