import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    Pressable,
    StyleSheet,
    ActivityIndicator,
    SafeAreaView,
    ScrollView,
    Modal,
    FlatList,
    Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useNotification } from '../../src/Hooks/useNotification';
import { WorkoutPlanService } from '../../src/Services/WorkoutPlanService';
import { WorkoutTemplateService } from '../../src/Services/WorkoutTemplateService';
import WorkoutTemplate from '../../src/Domain/WorkoutTemplate';
import { WorkoutPlanDayRequest } from '../../src/DataTransferObjects/Requests/WorkoutPlan/AddWorkoutPlanRequest';
import { Colors } from '../../src/Theme/colors';
import AddExerciseModal from '../../src/Components/AddExerciseModal';

const ORDERED_DAYS = [1, 2, 3, 4, 5, 6, 0]; // Mon–Sun
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_FULL_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface DayAssignment {
    dayOfWeek: number;
    workoutTemplateId?: string;
    templateName?: string;
    note?: string;
}

export default function PlanEditorScreen() {
    const { planId } = useLocalSearchParams<{ planId: string }>();
    const isNew = planId === 'new';
    const router = useRouter();
    const { showError } = useNotification();

    const [name, setName] = useState('');
    const [days, setDays] = useState<DayAssignment[]>([]);
    const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);

    const [editingDow, setEditingDow] = useState<number | null>(null);
    const [showDayEditor, setShowDayEditor] = useState(false);
    const [noteText, setNoteText] = useState('');
    const [showCreateTemplate, setShowCreateTemplate] = useState(false);
    const [newTemplateName, setNewTemplateName] = useState('');
    const [showExercisePicker, setShowExercisePicker] = useState(false);
    const [pendingExerciseIds, setPendingExerciseIds] = useState<string[]>([]);
    const [creatingTemplate, setCreatingTemplate] = useState(false);

    useEffect(() => {
        WorkoutTemplateService.getTemplates().then(setTemplates).catch(() => {});

        if (!isNew) {
            WorkoutPlanService.getWorkoutPlans().then(plans => {
                const plan = plans.find(p => p.Id === planId);
                if (plan) {
                    setName(plan.Name);
                    setDays(plan.Days.map(d => ({
                        dayOfWeek: d.DayOfWeek,
                        workoutTemplateId: d.WorkoutTemplateId,
                        templateName: d.TemplateName,
                        note: d.Note,
                    })));
                }
            }).catch(() => showError('Failed to load plan'))
              .finally(() => setLoading(false));
        }
    }, [planId]);

    function getDayAssignment(dow: number): DayAssignment | undefined {
        return days.find(d => d.dayOfWeek === dow);
    }

    function openDayEditor(dow: number) {
        const existing = getDayAssignment(dow);
        setNoteText(existing?.note || '');
        setEditingDow(dow);
        setShowDayEditor(true);
    }

    function assignTemplate(template: WorkoutTemplate) {
        if (editingDow === null) return;
        setDays(prev => {
            const filtered = prev.filter(d => d.dayOfWeek !== editingDow);
            return [...filtered, {
                dayOfWeek: editingDow,
                workoutTemplateId: template.Id,
                templateName: template.Name,
                note: noteText.trim() || undefined,
            }];
        });
        setShowDayEditor(false);
    }

    function saveNote() {
        if (editingDow === null) return;
        const existing = getDayAssignment(editingDow);
        if (!noteText.trim() && !existing?.workoutTemplateId) {
            setDays(prev => prev.filter(d => d.dayOfWeek !== editingDow));
        } else {
            setDays(prev => {
                const filtered = prev.filter(d => d.dayOfWeek !== editingDow);
                return [...filtered, {
                    dayOfWeek: editingDow,
                    workoutTemplateId: existing?.workoutTemplateId,
                    templateName: existing?.templateName,
                    note: noteText.trim() || undefined,
                }];
            });
        }
        setShowDayEditor(false);
    }

    function clearDay() {
        if (editingDow === null) return;
        setDays(prev => prev.filter(d => d.dayOfWeek !== editingDow));
        setShowDayEditor(false);
    }

    async function handleCreateTemplate() {
        if (!newTemplateName.trim()) {
            Alert.alert('Name required', 'Please enter a template name.');
            return;
        }
        setCreatingTemplate(true);
        try {
            const templateId = await WorkoutTemplateService.addTemplate(newTemplateName.trim(), pendingExerciseIds);
            const updated = await WorkoutTemplateService.getTemplates();
            setTemplates(updated);
            const created = updated.find(t => t.Id === templateId);
            if (created && editingDow !== null) {
                assignTemplate(created);
            }
            setShowCreateTemplate(false);
            setNewTemplateName('');
            setPendingExerciseIds([]);
        } catch {
            showError('Failed to create template');
        } finally {
            setCreatingTemplate(false);
        }
    }

    async function handleSave() {
        if (!name.trim()) {
            Alert.alert('Name required', 'Please enter a plan name.');
            return;
        }
        setSaving(true);
        const dayRequests: WorkoutPlanDayRequest[] = days.map(d => ({
            dayOfWeek: d.dayOfWeek,
            workoutTemplateId: d.workoutTemplateId,
            note: d.note,
        }));
        try {
            if (isNew) {
                await WorkoutPlanService.addWorkoutPlan(name.trim(), dayRequests);
            } else {
                await WorkoutPlanService.updateWorkoutPlan(planId, name.trim(), dayRequests);
            }
            router.back();
        } catch {
            showError('Failed to save plan');
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <ActivityIndicator style={{ flex: 1 }} color={Colors.primary} size="large" />
            </SafeAreaView>
        );
    }

    const editingAssignment = editingDow !== null ? getDayAssignment(editingDow) : undefined;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()}>
                    <Text style={styles.backText}>‹ Back</Text>
                </Pressable>
                <Text style={styles.headerTitle}>{isNew ? 'New Plan' : 'Edit Plan'}</Text>
                <Pressable onPress={handleSave} disabled={saving}>
                    {saving
                        ? <ActivityIndicator color={Colors.primary} size="small" />
                        : <Text style={styles.saveText}>Save</Text>
                    }
                </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.sectionLabel}>Plan Name</Text>
                <TextInput
                    style={styles.nameInput}
                    value={name}
                    onChangeText={setName}
                    placeholder="e.g. Push/Pull/Legs"
                    placeholderTextColor={Colors.textSecondary}
                />

                <Text style={styles.sectionLabel}>Weekly Schedule</Text>
                {ORDERED_DAYS.map(dow => {
                    const assignment = getDayAssignment(dow);
                    return (
                        <Pressable key={dow} style={styles.dayRow} onPress={() => openDayEditor(dow)}>
                            <Text style={styles.dayLabel}>{DAY_FULL_NAMES[dow]}</Text>
                            <View style={styles.dayAssignment}>
                                {assignment?.templateName ? (
                                    <Text style={styles.dayTemplateName}>{assignment.templateName}</Text>
                                ) : assignment?.note ? (
                                    <Text style={styles.dayNote}>{assignment.note}</Text>
                                ) : (
                                    <Text style={styles.dayEmpty}>—</Text>
                                )}
                                {assignment?.note && assignment?.templateName && (
                                    <Text style={styles.dayNoteSmall}>{assignment.note}</Text>
                                )}
                            </View>
                            <Text style={styles.editChevron}>›</Text>
                        </Pressable>
                    );
                })}
            </ScrollView>

            {/* Day Editor Modal */}
            <Modal
                visible={showDayEditor}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowDayEditor(false)}
            >
                <SafeAreaView style={styles.container}>
                    <View style={styles.header}>
                        <Pressable onPress={() => setShowDayEditor(false)}>
                            <Text style={styles.backText}>Cancel</Text>
                        </Pressable>
                        <Text style={styles.headerTitle}>
                            {editingDow !== null ? DAY_FULL_NAMES[editingDow] : ''}
                        </Text>
                        <Pressable onPress={saveNote}>
                            <Text style={styles.saveText}>Done</Text>
                        </Pressable>
                    </View>

                    <ScrollView contentContainerStyle={styles.content}>
                        {editingAssignment?.templateName && (
                            <View style={styles.currentAssignment}>
                                <Text style={styles.currentAssignmentLabel}>Current: </Text>
                                <Text style={styles.currentAssignmentName}>{editingAssignment.templateName}</Text>
                                <Pressable onPress={clearDay} style={styles.clearBtn}>
                                    <Text style={styles.clearBtnText}>Clear</Text>
                                </Pressable>
                            </View>
                        )}

                        <Text style={styles.sectionLabel}>Assign Template</Text>
                        {templates.length === 0 ? (
                            <Text style={styles.noTemplatesText}>No templates yet.</Text>
                        ) : (
                            templates.map(t => (
                                <Pressable
                                    key={t.Id}
                                    style={[styles.templateRow, editingAssignment?.workoutTemplateId === t.Id && styles.templateRowSelected]}
                                    onPress={() => assignTemplate(t)}
                                >
                                    <Text style={styles.templateName}>{t.Name}</Text>
                                    <Text style={styles.templateExerciseCount}>
                                        {t.Exercises.length} exercise{t.Exercises.length !== 1 ? 's' : ''}
                                    </Text>
                                    {editingAssignment?.workoutTemplateId === t.Id && (
                                        <Text style={styles.checkmark}>✓</Text>
                                    )}
                                </Pressable>
                            ))
                        )}

                        <Pressable style={styles.createTemplateBtn} onPress={() => setShowCreateTemplate(true)}>
                            <Text style={styles.createTemplateBtnText}>+ Create New Template</Text>
                        </Pressable>

                        <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Note (optional)</Text>
                        <TextInput
                            style={styles.noteInput}
                            value={noteText}
                            onChangeText={setNoteText}
                            placeholder="e.g. Rest, Cardio, Active Recovery..."
                            placeholderTextColor={Colors.textSecondary}
                        />

                        {(editingAssignment?.workoutTemplateId || editingAssignment?.note) && (
                            <Pressable style={styles.clearAllBtn} onPress={clearDay}>
                                <Text style={styles.clearAllBtnText}>Clear Day</Text>
                            </Pressable>
                        )}
                    </ScrollView>
                </SafeAreaView>
            </Modal>

            {/* Create Template Modal */}
            <Modal
                visible={showCreateTemplate}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowCreateTemplate(false)}
            >
                <SafeAreaView style={styles.container}>
                    <View style={styles.header}>
                        <Pressable onPress={() => { setShowCreateTemplate(false); setNewTemplateName(''); setPendingExerciseIds([]); }}>
                            <Text style={styles.backText}>Cancel</Text>
                        </Pressable>
                        <Text style={styles.headerTitle}>New Template</Text>
                        <Pressable onPress={handleCreateTemplate} disabled={creatingTemplate}>
                            {creatingTemplate
                                ? <ActivityIndicator color={Colors.primary} size="small" />
                                : <Text style={styles.saveText}>Create</Text>
                            }
                        </Pressable>
                    </View>

                    <ScrollView contentContainerStyle={styles.content}>
                        <Text style={styles.sectionLabel}>Template Name</Text>
                        <TextInput
                            style={styles.nameInput}
                            value={newTemplateName}
                            onChangeText={setNewTemplateName}
                            placeholder="e.g. Push Day"
                            placeholderTextColor={Colors.textSecondary}
                        />

                        <Text style={styles.sectionLabel}>Exercises</Text>
                        {pendingExerciseIds.length === 0 ? (
                            <Text style={styles.noTemplatesText}>No exercises added yet.</Text>
                        ) : (
                            <Text style={styles.exerciseCount}>{pendingExerciseIds.length} exercise{pendingExerciseIds.length !== 1 ? 's' : ''} selected</Text>
                        )}

                        <Pressable style={styles.createTemplateBtn} onPress={() => setShowExercisePicker(true)}>
                            <Text style={styles.createTemplateBtnText}>+ Add Exercises</Text>
                        </Pressable>
                    </ScrollView>
                </SafeAreaView>
            </Modal>

            <AddExerciseModal
                visible={showExercisePicker}
                onClose={() => setShowExercisePicker(false)}
                onExercisesAdded={async (ids) => {
                    setPendingExerciseIds(prev => [...new Set([...prev, ...ids])]);
                    setShowExercisePicker(false);
                }}
            />
        </SafeAreaView>
    );
}

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
    headerTitle: { color: Colors.text, fontSize: 17, fontWeight: '700' },
    backText: { color: Colors.primary, fontSize: 16 },
    saveText: { color: Colors.primary, fontSize: 16, fontWeight: '600' },
    content: { padding: 16, paddingBottom: 40 },
    sectionLabel: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 8, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
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
    dayRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    dayLabel: { color: Colors.text, fontSize: 15, fontWeight: '600', width: 90 },
    dayAssignment: { flex: 1 },
    dayTemplateName: { color: Colors.primary, fontSize: 14, fontWeight: '500' },
    dayNote: { color: Colors.textSecondary, fontSize: 14 },
    dayNoteSmall: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
    dayEmpty: { color: Colors.border, fontSize: 14 },
    editChevron: { color: Colors.textSecondary, fontSize: 20 },
    currentAssignment: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(38,166,154,0.1)',
        borderRadius: 10,
        padding: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.primary,
    },
    currentAssignmentLabel: { color: Colors.textSecondary, fontSize: 14 },
    currentAssignmentName: { color: Colors.primary, fontSize: 14, fontWeight: '600', flex: 1 },
    clearBtn: {
        borderWidth: 1,
        borderColor: Colors.error,
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    clearBtnText: { color: Colors.error, fontSize: 13 },
    templateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    templateRowSelected: { backgroundColor: 'rgba(38,166,154,0.08)' },
    templateName: { color: Colors.text, fontSize: 15, flex: 1 },
    templateExerciseCount: { color: Colors.textSecondary, fontSize: 13, marginRight: 8 },
    checkmark: { color: Colors.primary, fontSize: 16, fontWeight: '700' },
    createTemplateBtn: {
        marginTop: 12,
        borderWidth: 1,
        borderColor: Colors.primary,
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: 'center',
    },
    createTemplateBtnText: { color: Colors.primary, fontSize: 15, fontWeight: '600' },
    noteInput: {
        backgroundColor: Colors.inputBackground,
        color: Colors.text,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    clearAllBtn: {
        marginTop: 24,
        borderWidth: 1,
        borderColor: Colors.error,
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: 'center',
    },
    clearAllBtnText: { color: Colors.error, fontSize: 15 },
    noTemplatesText: { color: Colors.textSecondary, fontSize: 14, marginBottom: 8 },
    exerciseCount: { color: Colors.text, fontSize: 15, marginBottom: 8 },
});
