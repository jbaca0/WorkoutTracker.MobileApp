import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    Pressable,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
    FlatList,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useNotification } from '../../src/Hooks/useNotification';
import { WorkoutPlanService } from '../../src/Services/WorkoutPlanService';
import { WorkoutTemplateService } from '../../src/Services/WorkoutTemplateService';
import { ExerciseInfoService } from '../../src/Services/ExerciseInfoService';
import { ExerciseGoalService } from '../../src/Services/ExerciseGoalService';
import WorkoutTemplate from '../../src/Domain/WorkoutTemplate';
import WorkoutPlan from '../../src/Domain/WorkoutPlan';
import ExerciseInfo from '../../src/Domain/ExerciseInfo';
import ExerciseGoal from '../../src/Domain/ExerciseGoal';
import { WorkoutPlanDayRequest } from '../../src/DataTransferObjects/Requests/WorkoutPlan/AddWorkoutPlanRequest';
import { WorkoutTemplateExerciseRequest } from '../../src/DataTransferObjects/Requests/WorkoutTemplate/CreateTemplateRequest';
import { Colors } from '../../src/Theme/colors';
import AddGoalModal from '../../src/Components/AddGoalModal';
import FullScreenModal from '../../src/Components/FullScreenModal';
import DateField from '../../src/Components/DateField';
import { toDateInputString, formatDisplayDateFromDate } from '../../src/Utilities/DateUtils';

const ORDERED_DAYS = [1, 2, 3, 4, 5, 6, 0]; // Mon–Sun
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
    const [startDate, setStartDate] = useState(toDateInputString(new Date()));
    const [endDate, setEndDate] = useState('');
    const [days, setDays] = useState<DayAssignment[]>([]);
    const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
    const [plans, setPlans] = useState<WorkoutPlan[]>([]);
    const [exerciseInfos, setExerciseInfos] = useState<ExerciseInfo[]>([]);
    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);

    // Goals state (only relevant when editing an existing plan)
    const [planGoals, setPlanGoals] = useState<ExerciseGoal[]>([]);
    const [allGoals, setAllGoals] = useState<ExerciseGoal[]>([]);
    const [showGoalPicker, setShowGoalPicker] = useState(false);
    const [showAddGoalModal, setShowAddGoalModal] = useState(false);

    const [editingDow, setEditingDow] = useState<number | null>(null);
    const [showDayEditor, setShowDayEditor] = useState(false);
    const [noteText, setNoteText] = useState('');
    const [showCreateTemplate, setShowCreateTemplate] = useState(false);
    const [newTemplateName, setNewTemplateName] = useState('');
    const [pendingExercises, setPendingExercises] = useState<WorkoutTemplateExerciseRequest[]>([]);
    const [creatingTemplate, setCreatingTemplate] = useState(false);

    useEffect(() => {
        WorkoutTemplateService.getTemplates().then(setTemplates).catch(() => {});
        ExerciseInfoService.getExerciseInfos().then(setExerciseInfos).catch(() => {});
        WorkoutPlanService.getWorkoutPlans().then(setPlans).catch(() => {});

        if (!isNew) {
            WorkoutPlanService.getWorkoutPlans().then(allPlans => {
                const plan = allPlans.find(p => p.Id === planId);
                if (plan) {
                    setName(plan.Name);
                    setStartDate(toDateInputString(plan.StartDate));
                    setEndDate(plan.EndDate ? toDateInputString(plan.EndDate) : '');
                    setDays(plan.Days.map(d => ({
                        dayOfWeek: d.DayOfWeek,
                        workoutTemplateId: d.WorkoutTemplateId,
                        templateName: d.TemplateName,
                        note: d.Note,
                    })));
                }
            }).catch(() => showError('Failed to load plan'))
              .finally(() => setLoading(false));

            // Load goals for this plan and all user goals (for the picker)
            ExerciseGoalService.getGoalsByPlan(planId).then(setPlanGoals).catch(() => {});
            ExerciseGoalService.getGoals().then(setAllGoals).catch(() => {});
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

    async function handleAssignGoalToPlan(goal: ExerciseGoal) {
        try {
            await ExerciseGoalService.assignGoalToPlan(goal.Id, { workoutPlanId: planId });
            const updated = { ...goal, WorkoutPlanId: planId } as ExerciseGoal;
            setPlanGoals(prev => [...prev, updated]);
            setAllGoals(prev => prev.map(g => g.Id === goal.Id ? updated : g));
            setShowGoalPicker(false);
        } catch {
            showError('Failed to assign goal to plan');
        }
    }

    async function handleUnlinkGoal(goal: ExerciseGoal) {
        try {
            await ExerciseGoalService.assignGoalToPlan(goal.Id, { workoutPlanId: undefined });
            setPlanGoals(prev => prev.filter(g => g.Id !== goal.Id));
            setAllGoals(prev => prev.map(g => g.Id === goal.Id ? { ...g, WorkoutPlanId: undefined } as ExerciseGoal : g));
        } catch {
            showError('Failed to unlink goal from plan');
        }
    }

    async function handleCreateTemplate() {
        if (!newTemplateName.trim()) {
            Alert.alert('Name required', 'Please enter a template name.');
            return;
        }
        setCreatingTemplate(true);
        try {
            const templateId = await WorkoutTemplateService.addTemplate(newTemplateName.trim(), pendingExercises);
            const updated = await WorkoutTemplateService.getTemplates();
            setTemplates(updated);
            const created = updated.find(t => t.Id === templateId);
            if (created && editingDow !== null) {
                assignTemplate(created);
            }
            setShowCreateTemplate(false);
            setNewTemplateName('');
            setPendingExercises([]);
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
        if (!startDate.trim()) {
            Alert.alert('Start date required', 'Please enter a start date.');
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
                await WorkoutPlanService.addWorkoutPlan(name.trim(), startDate.trim(), endDate.trim() || undefined, dayRequests);
            } else {
                await WorkoutPlanService.updateWorkoutPlan(planId, name.trim(), startDate.trim(), endDate.trim() || undefined, dayRequests);
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
    const currentPlan = plans.find(p => p.Id === planId);
    // Goals not already linked to this plan, available to assign
    const unlinkedGoals = allGoals.filter(g => g.WorkoutPlanId !== planId);

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

            <KeyboardAvoidingView
                style={styles.keyboardAvoid}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="interactive"
            >
                <Text style={styles.sectionLabel}>Plan Name</Text>
                <TextInput
                    style={styles.nameInput}
                    value={name}
                    onChangeText={setName}
                    placeholder="e.g. Push/Pull/Legs"
                    placeholderTextColor={Colors.textSecondary}
                />

                <Text style={styles.sectionLabel}>Start Date</Text>
                <DateField
                    value={startDate}
                    onChange={setStartDate}
                    placeholder="Select a start date"
                />

                <Text style={styles.sectionLabel}>End Date (optional)</Text>
                <DateField
                    value={endDate}
                    onChange={setEndDate}
                    placeholder="No end date"
                    clearable
                    minDate={startDate || undefined}
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

                {/* Goals section — only for existing plans */}
                {!isNew && (
                    <>
                        <Text style={[styles.sectionLabel, { marginTop: 28 }]}>Goals</Text>
                        {planGoals.length === 0 ? (
                            <Text style={styles.noGoalsText}>No goals linked to this plan.</Text>
                        ) : (
                            planGoals.map(goal => (
                                <View key={goal.Id} style={styles.goalRow}>
                                    <View style={styles.goalInfo}>
                                        <Text style={styles.goalName}>{goal.ExerciseInfo.Name}</Text>
                                        <Text style={styles.goalTarget}>
                                            {goal.TargetWeight} lbs × {goal.TargetReps} rep{goal.TargetReps !== 1 ? 's' : ''} by {formatDisplayDateFromDate(goal.GoalDate)}
                                        </Text>
                                    </View>
                                    <Pressable onPress={() => handleUnlinkGoal(goal)} style={styles.unlinkBtn}>
                                        <Text style={styles.unlinkBtnText}>Unlink</Text>
                                    </Pressable>
                                </View>
                            ))
                        )}
                        <View style={styles.goalActions}>
                            <Pressable style={styles.goalActionBtn} onPress={() => setShowGoalPicker(true)}>
                                <Text style={styles.goalActionBtnText}>Assign Existing Goal</Text>
                            </Pressable>
                            <Pressable style={styles.goalActionBtn} onPress={() => setShowAddGoalModal(true)}>
                                <Text style={styles.goalActionBtnText}>+ New Goal</Text>
                            </Pressable>
                        </View>
                    </>
                )}
            </ScrollView>
            </KeyboardAvoidingView>

            {/* Day Editor Modal */}
            <FullScreenModal
                visible={showDayEditor}
                onRequestClose={() => setShowDayEditor(false)}
            >
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

                    <KeyboardAvoidingView
                        style={styles.keyboardAvoid}
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    >
                    <ScrollView
                        style={styles.scroll}
                        contentContainerStyle={styles.content}
                        keyboardShouldPersistTaps="handled"
                        keyboardDismissMode="interactive"
                    >
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
                    </KeyboardAvoidingView>

                    {/* Create Template Modal — nested inside Day Editor so it can stack on top */}
                    <FullScreenModal
                        visible={showCreateTemplate}
                        onRequestClose={() => setShowCreateTemplate(false)}
                    >
                            <View style={styles.header}>
                                <Pressable onPress={() => { setShowCreateTemplate(false); setNewTemplateName(''); setPendingExercises([]); }}>
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

                            <KeyboardAvoidingView
                                style={styles.keyboardAvoid}
                                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                            >
                            <ScrollView
                                style={styles.scroll}
                                contentContainerStyle={styles.content}
                                keyboardShouldPersistTaps="handled"
                                keyboardDismissMode="interactive"
                            >
                                <TemplateEditorFields
                                    name={newTemplateName}
                                    onNameChange={setNewTemplateName}
                                    exercises={pendingExercises}
                                    onExercisesChange={setPendingExercises}
                                    exerciseInfos={exerciseInfos}
                                />
                            </ScrollView>
                            </KeyboardAvoidingView>
                    </FullScreenModal>
            </FullScreenModal>

            {/* Goal Picker Modal — assign existing goals to this plan */}
            <FullScreenModal
                visible={showGoalPicker}
                onRequestClose={() => setShowGoalPicker(false)}
            >
                    <View style={styles.header}>
                        <Pressable onPress={() => setShowGoalPicker(false)}>
                            <Text style={styles.backText}>Cancel</Text>
                        </Pressable>
                        <Text style={styles.headerTitle}>Assign Goal</Text>
                        <View style={{ width: 60 }} />
                    </View>
                    {unlinkedGoals.length === 0 ? (
                        <View style={{ padding: 24 }}>
                            <Text style={styles.noGoalsText}>No unassigned goals available.</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={unlinkedGoals}
                            keyExtractor={item => item.Id}
                            keyboardShouldPersistTaps="handled"
                            renderItem={({ item }) => (
                                <Pressable style={styles.pickerRow} onPress={() => handleAssignGoalToPlan(item)}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.pickerRowText}>{item.ExerciseInfo.Name}</Text>
                                        <Text style={styles.pickerRowSub}>
                                            {item.TargetWeight} lbs × {item.TargetReps} rep{item.TargetReps !== 1 ? 's' : ''}
                                        </Text>
                                    </View>
                                    <Text style={styles.pickerRowChevron}>›</Text>
                                </Pressable>
                            )}
                        />
                    )}
            </FullScreenModal>

            {/* Add Goal Modal — create a new goal pre-assigned to this plan */}
            <AddGoalModal
                visible={showAddGoalModal}
                plans={plans}
                defaultPlan={currentPlan}
                onClose={() => setShowAddGoalModal(false)}
                onGoalAdded={async (goal) => {
                    if (goal.WorkoutPlanId === planId) {
                        setPlanGoals(prev => [...prev, goal]);
                    }
                    setAllGoals(prev => [...prev, goal]);
                    setShowAddGoalModal(false);
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
    keyboardAvoid: { flex: 1 },
    scroll: { flex: 1 },
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
    setRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    // Goals section
    noGoalsText: { color: Colors.textSecondary, fontSize: 14, marginBottom: 12 },
    goalRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    goalInfo: { flex: 1 },
    goalName: { color: Colors.text, fontSize: 14, fontWeight: '600' },
    goalTarget: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
    unlinkBtn: {
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    unlinkBtnText: { color: Colors.textSecondary, fontSize: 12 },
    goalActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
    goalActionBtn: {
        flex: 1,
        borderWidth: 1,
        borderColor: Colors.primary,
        borderRadius: 10,
        paddingVertical: 10,
        alignItems: 'center',
    },
    goalActionBtnText: { color: Colors.primary, fontSize: 13, fontWeight: '600' },
    // Goal picker modal
    pickerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    pickerRowText: { color: Colors.text, fontSize: 15 },
    pickerRowSub: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
    pickerRowChevron: { color: Colors.textSecondary, fontSize: 20 },
});
