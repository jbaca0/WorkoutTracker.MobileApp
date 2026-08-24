import React, { useCallback, useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    Pressable,
    StyleSheet,
    ActivityIndicator,
    SafeAreaView,
    Alert,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useRouter, useFocusEffect } from 'expo-router';
import { useActiveWorkout } from '../../src/Hooks/useActiveWorkout';
import { useNotification } from '../../src/Hooks/useNotification';
import { WorkoutPlanService } from '../../src/Services/WorkoutPlanService';
import { ExerciseGoalService } from '../../src/Services/ExerciseGoalService';
import WorkoutPlan from '../../src/Domain/WorkoutPlan';
import ExerciseGoal from '../../src/Domain/ExerciseGoal';
import AddGoalModal from '../../src/Components/AddGoalModal';
import { formatDisplayDateFromDate } from '../../src/Utilities/DateUtils';
import { Colors } from '../../src/Theme/colors';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type ViewMode = 'list' | 'calendar';
type MainTab = 'plans' | 'goals';

function epley1RM(weight: number, reps: number): number {
    return weight * (1 + reps / 30);
}

export default function PlansScreen() {
    const [plans, setPlans] = useState<WorkoutPlan[]>([]);
    const [goals, setGoals] = useState<ExerciseGoal[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingGoals, setLoadingGoals] = useState(true);
    const [mainTab, setMainTab] = useState<MainTab>('plans');
    const [view, setView] = useState<ViewMode>('list');
    const [selectedDayDetail, setSelectedDayDetail] = useState<{ label: string; exercises: string[] } | null>(null);
    const [showAddGoal, setShowAddGoal] = useState(false);
    const { showError } = useNotification();
    const { hasActiveWorkout, activeWorkoutId } = useActiveWorkout();
    const router = useRouter();

    const activePlan = plans.find(p => p.IsActive);

    const loadPlans = useCallback(() => {
        WorkoutPlanService.getWorkoutPlans()
            .then(setPlans)
            .catch(() => showError('Failed to load plans'))
            .finally(() => setLoading(false));
    }, []);

    const loadGoals = useCallback(() => {
        ExerciseGoalService.getGoals()
            .then(setGoals)
            .catch(() => showError('Failed to load goals'))
            .finally(() => setLoadingGoals(false));
    }, []);

    useFocusEffect(useCallback(() => {
        setLoading(true);
        setLoadingGoals(true);
        loadPlans();
        loadGoals();
    }, []));

    async function handleDeleteGoal(goal: ExerciseGoal) {
        Alert.alert('Delete Goal', `Delete goal for "${goal.ExerciseInfo.Name}"?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: async () => {
                    try {
                        await ExerciseGoalService.deleteGoal(goal.Id);
                        setGoals(prev => prev.filter(g => g.Id !== goal.Id));
                    } catch {
                        showError('Failed to delete goal');
                    }
                }
            }
        ]);
    }

    async function handleActivate(plan: WorkoutPlan) {
        try {
            await WorkoutPlanService.activateWorkoutPlan(plan.Id);
            setPlans(prev => prev.map(p => ({ ...p, IsActive: p.Id === plan.Id })) as WorkoutPlan[]);
        } catch {
            showError('Failed to activate plan');
        }
    }

    async function handleDelete(plan: WorkoutPlan) {
        Alert.alert('Delete Plan', `Delete "${plan.Name}"?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: async () => {
                    try {
                        await WorkoutPlanService.deleteWorkoutPlan(plan.Id);
                        setPlans(prev => prev.filter(p => p.Id !== plan.Id));
                    } catch {
                        showError('Failed to delete plan');
                    }
                }
            }
        ]);
    }

    function buildMarkedDates() {
        if (!activePlan) return {};
        const marked: Record<string, any> = {};
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(year, month, d);
            const dow = date.getDay();
            const planDay = activePlan.Days.find(day => day.DayOfWeek === dow);
            if (planDay) {
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                marked[dateStr] = {
                    marked: true,
                    dotColor: planDay.WorkoutTemplateId ? Colors.primary : Colors.textSecondary,
                    label: planDay.TemplateName || planDay.Note || '',
                };
            }
        }
        return marked;
    }

    function handleDayPress(day: any) {
        if (!activePlan) return;
        const date = new Date(day.timestamp);
        const dow = date.getDay();
        const planDay = activePlan.Days.find(d => d.DayOfWeek === dow);
        if (!planDay) {
            setSelectedDayDetail({ label: DAY_LABELS[dow], exercises: [] });
            return;
        }
        setSelectedDayDetail({
            label: planDay.TemplateName || planDay.Note || DAY_LABELS[dow],
            exercises: [],
        });
    }

    if ((mainTab === 'plans' && loading) || (mainTab === 'goals' && loadingGoals)) {
        return (
            <SafeAreaView style={styles.container}>
                <ActivityIndicator style={{ flex: 1 }} color={Colors.primary} size="large" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>{mainTab === 'plans' ? 'Plans' : 'Goals'}</Text>
                <View style={styles.headerRight}>
                    <View style={styles.toggle}>
                        <Pressable
                            style={[styles.toggleBtn, mainTab === 'plans' && styles.toggleBtnActive]}
                            onPress={() => setMainTab('plans')}
                        >
                            <Text style={[styles.toggleText, mainTab === 'plans' && styles.toggleTextActive]}>Plans</Text>
                        </Pressable>
                        <Pressable
                            style={[styles.toggleBtn, mainTab === 'goals' && styles.toggleBtnActive]}
                            onPress={() => setMainTab('goals')}
                        >
                            <Text style={[styles.toggleText, mainTab === 'goals' && styles.toggleTextActive]}>Goals</Text>
                        </Pressable>
                    </View>
                    {mainTab === 'plans' ? (
                        <Pressable style={styles.addButton} onPress={() => router.push('/plan/new' as any)}>
                            <Text style={styles.addButtonText}>+ New</Text>
                        </Pressable>
                    ) : (
                        <Pressable style={styles.addButton} onPress={() => setShowAddGoal(true)}>
                            <Text style={styles.addButtonText}>+ Add Goal</Text>
                        </Pressable>
                    )}
                </View>
            </View>

            {mainTab === 'plans' && (
                <View style={styles.subToggle}>
                    <View style={styles.toggle}>
                        <Pressable
                            style={[styles.toggleBtn, view === 'list' && styles.toggleBtnActive]}
                            onPress={() => setView('list')}
                        >
                            <Text style={[styles.toggleText, view === 'list' && styles.toggleTextActive]}>List</Text>
                        </Pressable>
                        <Pressable
                            style={[styles.toggleBtn, view === 'calendar' && styles.toggleBtnActive]}
                            onPress={() => setView('calendar')}
                        >
                            <Text style={[styles.toggleText, view === 'calendar' && styles.toggleTextActive]}>Calendar</Text>
                        </Pressable>
                    </View>
                </View>
            )}

            {mainTab === 'goals' ? (
                goals.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No goals yet.</Text>
                        <Text style={styles.emptySubtext}>Add a goal to track your progress toward a target lift.</Text>
                    </View>
                ) : (
                    <FlatList
                        data={goals}
                        keyExtractor={item => item.Id}
                        contentContainerStyle={styles.list}
                        renderItem={({ item }) => {
                            const start1RM = epley1RM(item.StartWeight, item.StartReps);
                            const target1RM = epley1RM(item.TargetWeight, item.TargetReps);
                            const recommendation = item.GoalRecommendation;
                            const current1RM = recommendation
                                ? epley1RM(recommendation.Weight, recommendation.Reps)
                                : start1RM;
                            const progress = target1RM > start1RM
                                ? Math.min(Math.max((current1RM - start1RM) / (target1RM - start1RM), 0), 1)
                                : 1;

                            return (
                                <View style={styles.planCard}>
                                    <View style={styles.planCardTop}>
                                        <Text style={styles.planName}>{item.ExerciseInfo.Name}</Text>
                                    </View>
                                    <Text style={styles.planDaysSummary}>
                                        Target: {item.TargetWeight} lbs × {item.TargetReps} rep{item.TargetReps !== 1 ? 's' : ''} by {formatDisplayDateFromDate(item.GoalDate)}
                                    </Text>
                                    {recommendation && (
                                        <Text style={styles.planDaysSummary}>
                                            Today's recommendation: {recommendation.Weight} lbs × {recommendation.Reps} reps
                                        </Text>
                                    )}
                                    <View style={styles.progressBarTrack}>
                                        <View style={[styles.progressBarFill, { width: `${Math.round(progress * 100)}%` }]} />
                                    </View>
                                    <View style={styles.planActions}>
                                        <Pressable style={[styles.actionBtn, styles.actionBtnDanger]} onPress={() => handleDeleteGoal(item)}>
                                            <Text style={[styles.actionBtnText, styles.actionBtnDangerText]}>Delete</Text>
                                        </Pressable>
                                    </View>
                                </View>
                            );
                        }}
                    />
                )
            ) : view === 'list' ? (
                plans.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No plans yet.</Text>
                        <Text style={styles.emptySubtext}>Create a plan to schedule your weekly workouts.</Text>
                    </View>
                ) : (
                    <FlatList
                        data={plans}
                        keyExtractor={item => item.Id}
                        contentContainerStyle={styles.list}
                        renderItem={({ item }) => (
                            <View style={styles.planCard}>
                                <View style={styles.planCardTop}>
                                    <Text style={styles.planName}>{item.Name}</Text>
                                    {item.IsActive && (
                                        <View style={styles.activeBadge}>
                                            <Text style={styles.activeBadgeText}>Active</Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={styles.planDaysSummary}>
                                    {item.Days.length === 0
                                        ? 'No days assigned'
                                        : item.Days
                                            .sort((a, b) => (a.DayOfWeek === 0 ? 7 : a.DayOfWeek) - (b.DayOfWeek === 0 ? 7 : b.DayOfWeek))
                                            .map(d => DAY_LABELS[d.DayOfWeek])
                                            .join(', ')
                                    }
                                </Text>
                                <View style={styles.planActions}>
                                    <Pressable style={styles.actionBtn} onPress={() => router.push(`/plan/${item.Id}` as any)}>
                                        <Text style={styles.actionBtnText}>Edit</Text>
                                    </Pressable>
                                    {!item.IsActive && (
                                        <Pressable style={[styles.actionBtn, styles.actionBtnPrimary]} onPress={() => handleActivate(item)}>
                                            <Text style={[styles.actionBtnText, styles.actionBtnPrimaryText]}>Set Active</Text>
                                        </Pressable>
                                    )}
                                    <Pressable style={[styles.actionBtn, styles.actionBtnDanger]} onPress={() => handleDelete(item)}>
                                        <Text style={[styles.actionBtnText, styles.actionBtnDangerText]}>Delete</Text>
                                    </Pressable>
                                </View>
                            </View>
                        )}
                    />
                )
            ) : (
                <View style={styles.calendarContainer}>
                    {!activePlan ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>No active plan.</Text>
                            <Text style={styles.emptySubtext}>Set a plan as active to see it in the calendar.</Text>
                        </View>
                    ) : (
                        <>
                            <Text style={styles.calendarPlanLabel}>Showing: {activePlan.Name}</Text>
                            <Calendar
                                markedDates={buildMarkedDates()}
                                onDayPress={handleDayPress}
                                theme={{
                                    backgroundColor: Colors.background,
                                    calendarBackground: Colors.background,
                                    textSectionTitleColor: Colors.textSecondary,
                                    selectedDayBackgroundColor: Colors.primary,
                                    selectedDayTextColor: '#fff',
                                    todayTextColor: Colors.primary,
                                    dayTextColor: Colors.text,
                                    textDisabledColor: Colors.textSecondary,
                                    dotColor: Colors.primary,
                                    selectedDotColor: '#fff',
                                    arrowColor: Colors.primary,
                                    monthTextColor: Colors.text,
                                    indicatorColor: Colors.primary,
                                }}
                            />
                            {selectedDayDetail && (
                                <View style={styles.dayDetail}>
                                    <Text style={styles.dayDetailLabel}>{selectedDayDetail.label}</Text>
                                    <Pressable onPress={() => setSelectedDayDetail(null)}>
                                        <Text style={styles.dayDetailClose}>✕</Text>
                                    </Pressable>
                                </View>
                            )}
                        </>
                    )}
                </View>
            )}

            {hasActiveWorkout && (
                <Pressable style={styles.fab} onPress={() => router.push(`/workout/${activeWorkoutId}`)}>
                    <Text style={styles.fabText}>🏋️</Text>
                </Pressable>
            )}

            <AddGoalModal
                visible={showAddGoal}
                plans={plans}
                onClose={() => setShowAddGoal(false)}
                onGoalAdded={async (goal) => {
                    setGoals(prev => [...prev, goal]);
                    setShowAddGoal(false);
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
    title: { color: Colors.text, fontSize: 22, fontWeight: '700' },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    toggle: {
        flexDirection: 'row',
        backgroundColor: Colors.surfaceRaised,
        borderRadius: 8,
        overflow: 'hidden',
    },
    toggleBtn: { paddingHorizontal: 12, paddingVertical: 6 },
    toggleBtnActive: { backgroundColor: Colors.primary },
    toggleText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '500' },
    toggleTextActive: { color: '#fff' },
    addButton: {
        backgroundColor: Colors.primary,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    addButtonText: { color: '#fff', fontSize: 13, fontWeight: '600' },
    subToggle: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingHorizontal: 16,
        paddingTop: 12,
    },
    progressBarTrack: {
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.surfaceRaised,
        overflow: 'hidden',
        marginBottom: 12,
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: Colors.primary,
        borderRadius: 4,
    },
    list: { paddingBottom: 80 },
    planCard: {
        backgroundColor: Colors.surface,
        margin: 12,
        marginBottom: 0,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    planCardTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
    planName: { color: Colors.text, fontSize: 17, fontWeight: '700', flex: 1 },
    activeBadge: {
        backgroundColor: Colors.primary,
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    activeBadgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
    planDaysSummary: { color: Colors.textSecondary, fontSize: 13, marginBottom: 12 },
    planActions: { flexDirection: 'row', gap: 8 },
    actionBtn: {
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    actionBtnText: { color: Colors.text, fontSize: 13 },
    actionBtnPrimary: { borderColor: Colors.primary, backgroundColor: 'rgba(38,166,154,0.1)' },
    actionBtnPrimaryText: { color: Colors.primary, fontWeight: '600' },
    actionBtnDanger: { borderColor: Colors.error },
    actionBtnDangerText: { color: Colors.error },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8, padding: 24 },
    emptyText: { color: Colors.text, fontSize: 16, fontWeight: '600' },
    emptySubtext: { color: Colors.textSecondary, fontSize: 14, textAlign: 'center' },
    calendarContainer: { flex: 1 },
    calendarPlanLabel: {
        color: Colors.textSecondary,
        fontSize: 13,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    dayDetail: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.surface,
        margin: 12,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    dayDetailLabel: { color: Colors.text, fontSize: 16, fontWeight: '600' },
    dayDetailClose: { color: Colors.textSecondary, fontSize: 18, padding: 4 },
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
    fabText: { fontSize: 24 },
});
