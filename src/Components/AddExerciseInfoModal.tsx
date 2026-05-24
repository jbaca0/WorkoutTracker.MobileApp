import React, { useState } from 'react';
import {
    View,
    Text,
    Modal,
    Pressable,
    TextInput,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    ActivityIndicator,
} from 'react-native';
import { ExerciseInfoService } from '../Services/ExerciseInfoService';
import { MuscleGroup, MuscleGroupLabels, AllMuscleGroups } from '../Enums/MuscleGroup';
import { Colors } from '../Theme/colors';

interface AddExerciseInfoModalProps {
    visible: boolean;
    onClose: () => void;
    afterAdd?: () => void;
}

const AddExerciseInfoModal: React.FC<AddExerciseInfoModalProps> = ({ visible, onClose, afterAdd }) => {
    const [exerciseName, setExerciseName] = useState('');
    const [primaryMuscleGroup, setPrimaryMuscleGroup] = useState<MuscleGroup>(MuscleGroup.Other);
    const [secondaryMuscleGroups, setSecondaryMuscleGroups] = useState<MuscleGroup[]>([]);
    const [adding, setAdding] = useState(false);
    const [showPrimaryPicker, setShowPrimaryPicker] = useState(false);

    async function handleAdd() {
        if (!exerciseName.trim()) return;
        setAdding(true);
        await ExerciseInfoService.addExerciseInfo(exerciseName.trim(), primaryMuscleGroup, secondaryMuscleGroups);
        setExerciseName('');
        setPrimaryMuscleGroup(MuscleGroup.Other);
        setSecondaryMuscleGroups([]);
        afterAdd?.();
        onClose();
        setAdding(false);
    }

    function handleClose() {
        setExerciseName('');
        setPrimaryMuscleGroup(MuscleGroup.Other);
        setSecondaryMuscleGroups([]);
        onClose();
    }

    function toggleSecondary(mg: MuscleGroup) {
        setSecondaryMuscleGroups(prev =>
            prev.includes(mg) ? prev.filter(m => m !== mg) : [...prev, mg]
        );
    }

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Add Exercise</Text>
                    <Pressable onPress={handleClose}>
                        <Text style={styles.cancelText}>Cancel</Text>
                    </Pressable>
                </View>

                <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
                    <Text style={styles.label}>Exercise Name</Text>
                    <TextInput
                        style={styles.input}
                        value={exerciseName}
                        onChangeText={setExerciseName}
                        placeholder="e.g. Bench Press"
                        placeholderTextColor={Colors.textSecondary}
                    />

                    <Text style={styles.label}>Primary Muscle Group</Text>
                    <Pressable style={styles.selectButton} onPress={() => setShowPrimaryPicker(true)}>
                        <Text style={styles.selectButtonText}>{MuscleGroupLabels[primaryMuscleGroup]}</Text>
                        <Text style={styles.selectArrow}>▼</Text>
                    </Pressable>

                    <Text style={styles.label}>Secondary Muscle Groups</Text>
                    <View style={styles.chipGrid}>
                        {AllMuscleGroups.filter(mg => mg !== MuscleGroup.None).map(mg => {
                            const selected = secondaryMuscleGroups.includes(mg);
                            return (
                                <Pressable
                                    key={mg}
                                    style={[styles.toggleChip, selected && styles.toggleChipSelected]}
                                    onPress={() => toggleSecondary(mg)}
                                >
                                    <Text style={[styles.toggleChipText, selected && styles.toggleChipTextSelected]}>
                                        {MuscleGroupLabels[mg]}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>
                </ScrollView>

                {showPrimaryPicker && (
                    <Modal visible transparent animationType="fade" onRequestClose={() => setShowPrimaryPicker(false)}>
                        <Pressable style={styles.backdrop} onPress={() => setShowPrimaryPicker(false)}>
                            <View style={styles.pickerContainer}>
                                <ScrollView>
                                    {AllMuscleGroups.filter(mg => mg !== MuscleGroup.None).map(mg => (
                                        <Pressable
                                            key={mg}
                                            style={styles.pickerItem}
                                            onPress={() => { setPrimaryMuscleGroup(mg); setShowPrimaryPicker(false); }}
                                        >
                                            <Text style={[styles.pickerItemText, primaryMuscleGroup === mg && styles.pickerItemSelected]}>
                                                {MuscleGroupLabels[mg]}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </ScrollView>
                            </View>
                        </Pressable>
                    </Modal>
                )}

                <View style={styles.footer}>
                    <Pressable
                        style={[styles.addButton, (!exerciseName.trim() || adding) && styles.addButtonDisabled]}
                        onPress={handleAdd}
                        disabled={!exerciseName.trim() || adding}
                    >
                        {adding
                            ? <ActivityIndicator color="#fff" size="small" />
                            : <Text style={styles.addButtonText}>Add Exercise</Text>
                        }
                    </Pressable>
                </View>
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
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
        fontSize: 18,
        fontWeight: '700',
    },
    cancelText: {
        color: Colors.primary,
        fontSize: 16,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    label: {
        color: Colors.textSecondary,
        fontSize: 13,
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    input: {
        backgroundColor: Colors.inputBackground,
        color: Colors.text,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 15,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    selectButton: {
        backgroundColor: Colors.inputBackground,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    selectButtonText: {
        color: Colors.text,
        fontSize: 15,
    },
    selectArrow: {
        color: Colors.textSecondary,
        fontSize: 12,
    },
    chipGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 4,
    },
    toggleChip: {
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    toggleChipSelected: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    toggleChipText: {
        color: Colors.textSecondary,
        fontSize: 13,
    },
    toggleChipTextSelected: {
        color: '#fff',
        fontWeight: '600',
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    addButton: {
        backgroundColor: Colors.primary,
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: 'center',
    },
    addButtonDisabled: {
        opacity: 0.4,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    pickerContainer: {
        backgroundColor: Colors.surface,
        borderRadius: 12,
        width: '80%',
        maxHeight: 400,
        padding: 8,
    },
    pickerItem: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    pickerItemText: {
        color: Colors.text,
        fontSize: 15,
    },
    pickerItemSelected: {
        color: Colors.primary,
        fontWeight: '600',
    },
});

export default AddExerciseInfoModal;
