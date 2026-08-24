import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    Pressable,
    FlatList,
    TextInput,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import FullScreenModal from './FullScreenModal';
import ExerciseInfo from '../Domain/ExerciseInfo';
import WorkoutPlan from '../Domain/WorkoutPlan';
import ExerciseGoal from '../Domain/ExerciseGoal';
import { ExerciseInfoService } from '../Services/ExerciseInfoService';
import { ExerciseGoalService } from '../Services/ExerciseGoalService';
import { Colors } from '../Theme/colors';
import { useNotification } from '../Hooks/useNotification';

interface AddGoalModalProps {
    visible: boolean;
    plans: WorkoutPlan[];
    defaultPlan?: WorkoutPlan;
    onClose: () => void;
    onGoalAdded: (goal: ExerciseGoal) => Promise<void>;
}

const AddGoalModal: React.FC<AddGoalModalProps> = ({ visible, plans, defaultPlan, onClose, onGoalAdded }) => {
    const [exerciseInfos, setExerciseInfos] = useState<ExerciseInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [search, setSearch] = useState('');
    const [showExercisePicker, setShowExercisePicker] = useState(false);
    const [showPlanPicker, setShowPlanPicker] = useState(false);

    const [selectedExercise, setSelectedExercise] = useState<ExerciseInfo | null>(null);
    const [selectedPlan, setSelectedPlan] = useState<WorkoutPlan | null>(null);
    const [startWeight, setStartWeight] = useState('');
    const [startReps, setStartReps] = useState('');
    const [targetWeight, setTargetWeight] = useState('');
    const [targetReps, setTargetReps] = useState('');
    const [goalDate, setGoalDate] = useState('');

    const { showError } = useNotification();

    useEffect(() => {
        if (!visible) return;
        setSelectedPlan(defaultPlan ?? null);
        ExerciseInfoService.getExerciseInfos()
            .then(setExerciseInfos)
            .catch(() => showError('Failed to load exercises'))
            .finally(() => setLoading(false));
    }, [visible]);

    const filteredExercises = exerciseInfos.filter(ei =>
        ei.Name.toLowerCase().includes(search.toLowerCase())
    );

    function reset() {
        setSelectedExercise(null);
        setSelectedPlan(defaultPlan ?? null);
        setStartWeight('');
        setStartReps('');
        setTargetWeight('');
        setTargetReps('');
        setGoalDate('');
        setSearch('');
    }

    function handleClose() {
        reset();
        onClose();
    }

    async function handleSubmit() {
        if (!selectedExercise?.Id) {
            showError('Please select an exercise');
            return;
        }
        const parsedTargetWeight = parseFloat(targetWeight);
        const parsedTargetReps = parseInt(targetReps);
        if (!parsedTargetWeight || !parsedTargetReps) {
            showError('Please enter a target weight and reps');
            return;
        }
        if (!goalDate.trim()) {
            showError('Please enter a goal date');
            return;
        }

        setSubmitting(true);
        try {
            const goal = await ExerciseGoalService.createGoal({
                exerciseInfoId: selectedExercise.Id,
                workoutPlanId: selectedPlan?.Id,
                startWeight: startWeight.trim() ? parseFloat(startWeight) : undefined,
                startReps: startReps.trim() ? parseInt(startReps) : undefined,
                targetWeight: parsedTargetWeight,
                targetReps: parsedTargetReps,
                goalDate: goalDate.trim(),
            });
            await onGoalAdded(goal);
            reset();
        } catch {
            showError('Failed to create goal');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <FullScreenModal visible={visible} onRequestClose={handleClose}>
                <View style={styles.header}>
                    <Pressable onPress={handleClose}>
                        <Text style={styles.cancelText}>Cancel</Text>
                    </Pressable>
                    <Text style={styles.title}>Add Goal</Text>
                    <Pressable onPress={handleSubmit} disabled={submitting}>
                        {submitting
                            ? <ActivityIndicator color={Colors.primary} size="small" />
                            : <Text style={styles.saveText}>Save</Text>
                        }
                    </Pressable>
                </View>

                {loading ? (
                    <ActivityIndicator style={{ flex: 1 }} color={Colors.primary} size="large" />
                ) : (
                    <ScrollView contentContainerStyle={styles.content}>
                        <Text style={styles.sectionLabel}>Exercise</Text>
                        <Pressable style={styles.selectInput} onPress={() => setShowExercisePicker(true)}>
                            <Text style={selectedExercise ? styles.selectInputText : styles.selectInputPlaceholder}>
                                {selectedExercise ? selectedExercise.Name : 'Select an exercise'}
                            </Text>
                        </Pressable>

                        <Text style={styles.sectionLabel}>Plan (optional)</Text>
                        <Pressable style={styles.selectInput} onPress={() => setShowPlanPicker(true)}>
                            <Text style={selectedPlan ? styles.selectInputText : styles.selectInputPlaceholder}>
                                {selectedPlan ? selectedPlan.Name : 'No plan selected'}
                            </Text>
                        </Pressable>

                        <Text style={styles.sectionLabel}>Start Weight (optional)</Text>
                        <TextInput
                            style={styles.input}
                            value={startWeight}
                            onChangeText={setStartWeight}
                            keyboardType="numeric"
                            placeholder="Leave blank to use your best lift"
                            placeholderTextColor={Colors.textSecondary}
                        />

                        <Text style={styles.sectionLabel}>Start Reps (optional)</Text>
                        <TextInput
                            style={styles.input}
                            value={startReps}
                            onChangeText={setStartReps}
                            keyboardType="numeric"
                            placeholder="Leave blank to use your best lift"
                            placeholderTextColor={Colors.textSecondary}
                        />

                        <Text style={styles.sectionLabel}>Target Weight</Text>
                        <TextInput
                            style={styles.input}
                            value={targetWeight}
                            onChangeText={setTargetWeight}
                            keyboardType="numeric"
                            placeholder="e.g. 255"
                            placeholderTextColor={Colors.textSecondary}
                        />

                        <Text style={styles.sectionLabel}>Target Reps</Text>
                        <TextInput
                            style={styles.input}
                            value={targetReps}
                            onChangeText={setTargetReps}
                            keyboardType="numeric"
                            placeholder="e.g. 1"
                            placeholderTextColor={Colors.textSecondary}
                        />

                        <Text style={styles.sectionLabel}>Goal Date</Text>
                        <TextInput
                            style={styles.input}
                            value={goalDate}
                            onChangeText={setGoalDate}
                            placeholder="YYYY-MM-DD"
                            placeholderTextColor={Colors.textSecondary}
                        />
                    </ScrollView>
                )}

                {/* Exercise Picker */}
                <FullScreenModal
                    visible={showExercisePicker}
                    onRequestClose={() => setShowExercisePicker(false)}
                >
                        <View style={styles.header}>
                            <Text style={styles.title}>Select Exercise</Text>
                            <Pressable onPress={() => setShowExercisePicker(false)}>
                                <Text style={styles.cancelText}>Done</Text>
                            </Pressable>
                        </View>
                        <TextInput
                            style={[styles.input, { marginHorizontal: 16 }]}
                            value={search}
                            onChangeText={setSearch}
                            placeholder="Search exercises..."
                            placeholderTextColor={Colors.textSecondary}
                        />
                        <FlatList
                            data={filteredExercises}
                            keyExtractor={item => item.Id || String(item.Key)}
                            renderItem={({ item }) => (
                                <Pressable
                                    style={styles.pickerRow}
                                    onPress={() => {
                                        setSelectedExercise(item);
                                        setShowExercisePicker(false);
                                    }}
                                >
                                    <Text style={styles.pickerRowText}>{item.Name}</Text>
                                    {selectedExercise?.Id === item.Id && <Text style={styles.checkmark}>✓</Text>}
                                </Pressable>
                            )}
                        />
                </FullScreenModal>

                {/* Plan Picker */}
                <FullScreenModal
                    visible={showPlanPicker}
                    onRequestClose={() => setShowPlanPicker(false)}
                >
                        <View style={styles.header}>
                            <Text style={styles.title}>Select Plan</Text>
                            <Pressable onPress={() => setShowPlanPicker(false)}>
                                <Text style={styles.cancelText}>Done</Text>
                            </Pressable>
                        </View>
                        <Pressable
                            style={styles.pickerRow}
                            onPress={() => {
                                setSelectedPlan(null);
                                setShowPlanPicker(false);
                            }}
                        >
                            <Text style={styles.pickerRowText}>No plan</Text>
                            {!selectedPlan && <Text style={styles.checkmark}>✓</Text>}
                        </Pressable>
                        {plans.length === 0 ? (
                            <Text style={styles.noDataText}>No plans available. Create a plan first.</Text>
                        ) : (
                            <FlatList
                                data={plans}
                                keyExtractor={item => item.Id}
                                renderItem={({ item }) => (
                                    <Pressable
                                        style={styles.pickerRow}
                                        onPress={() => {
                                            setSelectedPlan(item);
                                            setShowPlanPicker(false);
                                        }}
                                    >
                                        <Text style={styles.pickerRowText}>{item.Name}</Text>
                                        {selectedPlan?.Id === item.Id && <Text style={styles.checkmark}>✓</Text>}
                                    </Pressable>
                                )}
                            />
                        )}
                </FullScreenModal>
        </FullScreenModal>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    title: { color: Colors.text, fontSize: 17, fontWeight: '700' },
    cancelText: { color: Colors.primary, fontSize: 16 },
    saveText: { color: Colors.primary, fontSize: 16, fontWeight: '600' },
    content: { padding: 16, paddingBottom: 40 },
    sectionLabel: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 8, marginTop: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
    input: {
        backgroundColor: Colors.inputBackground,
        color: Colors.text,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    selectInput: {
        backgroundColor: Colors.inputBackground,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    selectInputText: { color: Colors.text, fontSize: 15 },
    selectInputPlaceholder: { color: Colors.textSecondary, fontSize: 15 },
    pickerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    pickerRowText: { color: Colors.text, fontSize: 15 },
    checkmark: { color: Colors.primary, fontSize: 16, fontWeight: '700' },
    noDataText: { color: Colors.textSecondary, fontSize: 14, padding: 16, textAlign: 'center' },
});

export default AddGoalModal;
