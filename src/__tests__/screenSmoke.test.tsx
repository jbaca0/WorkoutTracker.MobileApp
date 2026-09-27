/**
 * Smoke tests: every screen must mount without throwing.
 *
 * These exist because a missing import shipped undetected — JSX children are
 * constructed eagerly even inside a Modal that is not visible, so an
 * unresolved component reference crashes the screen on open.
 */
import React from 'react';
import { render } from '@testing-library/react-native';

const mockRouter = { push: jest.fn(), back: jest.fn(), navigate: jest.fn(), replace: jest.fn() };
let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({
    useLocalSearchParams: () => mockParams,
    useRouter: () => mockRouter,
    useFocusEffect: (cb: () => void) => { const React = require('react'); React.useEffect(cb, []); },
}));

jest.mock('../Hooks/useNotification', () => ({
    useNotification: () => ({ showError: jest.fn(), showSuccess: jest.fn() }),
}));
jest.mock('../Hooks/useAuth', () => ({
    useAuth: () => ({ user: { email: 'a@b.c' }, logout: jest.fn() }),
}));
jest.mock('../Hooks/useActiveWorkout', () => ({
    useActiveWorkout: () => ({
        hasActiveWorkout: false, activeWorkoutId: null,
        setActiveWorkout: jest.fn(), clearActiveWorkout: jest.fn(),
    }),
}));

jest.mock('../Services/WorkoutPlanService', () => ({
    WorkoutPlanService: {
        getWorkoutPlans: jest.fn().mockResolvedValue([]),
        getTodaysWorkout: jest.fn().mockResolvedValue(null),
    },
}));
jest.mock('../Services/WorkoutTemplateService', () => ({
    WorkoutTemplateService: { getTemplates: jest.fn().mockResolvedValue([]) },
}));
jest.mock('../Services/ExerciseInfoService', () => ({
    ExerciseInfoService: { getExerciseInfos: jest.fn().mockResolvedValue([]) },
}));
jest.mock('../Services/ExerciseGoalService', () => ({
    ExerciseGoalService: {
        getGoals: jest.fn().mockResolvedValue([]),
        getGoalsByPlan: jest.fn().mockResolvedValue([]),
    },
}));
jest.mock('../Services/WorkoutService', () => ({
    WorkoutService: { addWorkout: jest.fn().mockResolvedValue('w1') },
}));

import PlanEditorScreen from '../../app/plan/[planId]';
import TemplateEditorScreen from '../../app/template/[templateId]';
import PlansScreen from '../../app/(tabs)/plans';
import HomeScreen from '../../app/(tabs)/home';

describe('screens mount without throwing', () => {
    it('plan editor - new', () => {
        mockParams = { planId: 'new' };
        render(<PlanEditorScreen />);
    });

    it('plan editor - existing', () => {
        mockParams = { planId: 'plan-1' };
        render(<PlanEditorScreen />);
    });

    it('template editor - new', () => {
        mockParams = { templateId: 'new' };
        render(<TemplateEditorScreen />);
    });

    it('template editor - existing', () => {
        mockParams = { templateId: 'tpl-1' };
        render(<TemplateEditorScreen />);
    });

    it('plans tab', () => {
        mockParams = {};
        render(<PlansScreen />);
    });

    it('home tab', () => {
        mockParams = {};
        render(<HomeScreen />);
    });
});
