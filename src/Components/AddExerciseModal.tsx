import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    Modal,
    Pressable,
    FlatList,
    TextInput,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import ExerciseInfo from '../Domain/ExerciseInfo';
import { ExerciseInfoService } from '../Services/ExerciseInfoService';
import { MuscleGroup, MuscleGroupLabels, AllMuscleGroups } from '../Enums/MuscleGroup';
import { Colors } from '../Theme/colors';
import { useNotification } from '../Hooks/useNotification';
import FullScreenModal from './FullScreenModal';

interface AddExerciseModalProps {
    visible: boolean;
    onClose: () => void;
    onExercisesAdded: (exerciseIds: string[]) => Promise<void>;
}

const AddExerciseModal: React.FC<AddExerciseModalProps> = ({ visible, onClose, onExercisesAdded }) => {
    const [exerciseInfos, setExerciseInfos] = useState<ExerciseInfo[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [search, setSearch] = useState('');
    const [muscleFilter, setMuscleFilter] = useState<MuscleGroup | null>(null);
    const [showMuscleFilter, setShowMuscleFilter] = useState(false);
    const { showError } = useNotification();

    useEffect(() => {
        ExerciseInfoService.getExerciseInfos()
            .then(setExerciseInfos)
            .catch(() => showError('Failed to load exercises'))
            .finally(() => setLoading(false));
    }, []);

    const filteredExercises = exerciseInfos.filter(ei => {
        const matchesName = ei.Name.toLowerCase().includes(search.toLowerCase());
        const matchesMuscle = muscleFilter === null ||
            ei.PrimaryMuscleGroup === muscleFilter ||
            ei.SecondaryMuscleGroups.includes(muscleFilter);
        return matchesName && matchesMuscle;
    });

    function toggleExercise(id: string) {
        const next = new Set(selectedIds);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        setSelectedIds(next);
    }

    async function handleAdd() {
        if (selectedIds.size === 0) return;
        setAdding(true);
        await onExercisesAdded(Array.from(selectedIds));
        setSelectedIds(new Set());
        setSearch('');
        setMuscleFilter(null);
        setAdding(false);
    }

    function handleClose() {
        setSelectedIds(new Set());
        setSearch('');
        setMuscleFilter(null);
        onClose();
    }

    return (
        <FullScreenModal visible={visible} onRequestClose={handleClose}>
                <View style={styles.header}>
                    <Text style={styles.title}>Add Exercises</Text>
                    <Pressable onPress={handleClose}>
                        <Text style={styles.cancelText}>Cancel</Text>
                    </Pressable>
                </View>

                <View style={styles.filters}>
                    <TextInput
                        style={styles.searchInput}
                        value={search}
                        onChangeText={setSearch}
                        placeholder="Search exercises..."
                        placeholderTextColor={Colors.textSecondary}
                    />
                    <Pressable
                        style={[styles.filterButton, muscleFilter !== null && styles.filterButtonActive]}
                        onPress={() => setShowMuscleFilter(true)}
                    >
                        <Text style={[styles.filterButtonText, muscleFilter !== null && styles.filterButtonTextActive]}>
                            {muscleFilter !== null ? MuscleGroupLabels[muscleFilter] : 'All Muscles'}
                        </Text>
                    </Pressable>
                </View>

                {showMuscleFilter && (
                    <Modal visible transparent animationType="fade" onRequestClose={() => setShowMuscleFilter(false)}>
                        <Pressable style={styles.backdrop} onPress={() => setShowMuscleFilter(false)}>
                            <View style={styles.pickerContainer}>
                                <ScrollView>
                                    <Pressable
                                        style={styles.pickerItem}
                                        onPress={() => { setMuscleFilter(null); setShowMuscleFilter(false); }}
                                    >
                                        <Text style={[styles.pickerItemText, muscleFilter === null && styles.pickerItemSelected]}>
                                            All Muscle Groups
                                        </Text>
                                    </Pressable>
                                    {AllMuscleGroups.filter(mg => mg !== MuscleGroup.None).map(mg => (
                                        <Pressable
                                            key={mg}
                                            style={styles.pickerItem}
                                            onPress={() => { setMuscleFilter(mg); setShowMuscleFilter(false); }}
                                        >
                                            <Text style={[styles.pickerItemText, muscleFilter === mg && styles.pickerItemSelected]}>
                                                {MuscleGroupLabels[mg]}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </ScrollView>
                            </View>
                        </Pressable>
                    </Modal>
                )}

                {loading ? (
                    <ActivityIndicator style={styles.loader} color={Colors.primary} size="large" />
                ) : (
                    <FlatList
                        style={styles.list}
                        data={filteredExercises}
                        keyExtractor={item => item.Id || String(item.Key)}
                        renderItem={({ item }) => {
                            const selected = selectedIds.has(item.Id || '');
                            return (
                                <Pressable
                                    style={[styles.exerciseRow, selected && styles.exerciseRowSelected]}
                                    onPress={() => toggleExercise(item.Id || '')}
                                >
                                    <View style={[styles.checkbox, selected && styles.checkboxChecked]}>
                                        {selected && <Text style={styles.checkmark}>✓</Text>}
                                    </View>
                                    <Text style={styles.exerciseName}>{item.Name}</Text>
                                    <View style={styles.chip}>
                                        <Text style={styles.chipText}>{MuscleGroupLabels[item.PrimaryMuscleGroup]}</Text>
                                    </View>
                                </Pressable>
                            );
                        }}
                        contentContainerStyle={styles.listContent}
                    />
                )}

                <View style={styles.footer}>
                    <Pressable
                        style={[styles.addButton, (selectedIds.size === 0 || adding) && styles.addButtonDisabled]}
                        onPress={handleAdd}
                        disabled={selectedIds.size === 0 || adding}
                    >
                        {adding
                            ? <ActivityIndicator color="#fff" size="small" />
                            : <Text style={styles.addButtonText}>
                                Add {selectedIds.size > 0 ? `${selectedIds.size} ` : ''}Exercise{selectedIds.size !== 1 ? 's' : ''}
                            </Text>
                        }
                    </Pressable>
                </View>
        </FullScreenModal>
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
    filters: {
        flexDirection: 'row',
        padding: 12,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        backgroundColor: Colors.inputBackground,
        color: Colors.text,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 14,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    filterButton: {
        backgroundColor: Colors.inputBackground,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: Colors.border,
        justifyContent: 'center',
    },
    filterButtonActive: {
        borderColor: Colors.primary,
    },
    filterButtonText: {
        color: Colors.textSecondary,
        fontSize: 13,
    },
    filterButtonTextActive: {
        color: Colors.primary,
    },
    loader: {
        flex: 1,
    },
    list: {
        flex: 1,
    },
    listContent: {
        paddingBottom: 8,
    },
    exerciseRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    exerciseRowSelected: {
        backgroundColor: 'rgba(38, 166, 154, 0.1)',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 5,
        borderWidth: 2,
        borderColor: Colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    checkboxChecked: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    checkmark: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
    },
    exerciseName: {
        color: Colors.text,
        fontSize: 15,
        flex: 1,
    },
    chip: {
        backgroundColor: Colors.surfaceRaised,
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 3,
        marginLeft: 8,
    },
    chipText: {
        color: Colors.primary,
        fontSize: 11,
        fontWeight: '500',
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

export default AddExerciseModal;
