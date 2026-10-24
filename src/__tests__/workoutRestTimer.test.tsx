/**
 * Integration tests for the rest timer as wired into the workout screen.
 */
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const mockRouter = { push: jest.fn(), back: jest.fn(), navigate: jest.fn(), replace: jest.fn() };
jest.mock('expo-router', () => ({
    useLocalSearchParams: () => ({ workoutId: 'w1' }),
    useRouter: () => mockRouter,
}));
jest.mock('@react-native-async-storage/async-storage', () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('../Hooks/useNotification', () => ({
    useNotification: () => ({ showError: jest.fn(), showSuccess: jest.fn() }),
}));
jest.mock('../Hooks/useActiveWorkout', () => ({
    useActiveWorkout: () => ({ clearActiveWorkout: jest.fn() }),
}));

const mockPlay = jest.fn();
jest.mock('expo-audio', () => ({
    createAudioPlayer: () => ({ play: mockPlay, seekTo: jest.fn() }),
    setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
}));
const mockHaptic = jest.fn().mockResolvedValue(undefined);
jest.mock('expo-haptics', () => ({
    notificationAsync: (...args: unknown[]) => mockHaptic(...args),
    NotificationFeedbackType: { Success: 'success' },
}));

jest.mock('../Services/WorkoutService', () => {
    const Workout = require('../Domain/Workout').default;
    return {
        WorkoutService: {
            // Shaped like a workout started from a plan: sets pre-created, plan target attached.
            getWorkoutDetail: jest.fn().mockResolvedValue(Workout.FromData({
                id: 'w1',
                exercises: [{
                    exerciseInfoId: 'e1',
                    exerciseInfo: { id: 'e1', name: 'Bench Press' },
                    target: { type: 1, sets: [{ weight: 135, reps: 8 }, { weight: 135, reps: 8 }] },
                    sets: [
                        { id: 's1', weight: 135, reps: 8, completed: false },
                        { id: 's2', weight: 135, reps: 8, completed: false },
                    ],
                }],
            })),
            save: jest.fn().mockResolvedValue(undefined),
        },
    };
});

import WorkoutScreen from '../../app/workout/[workoutId]';

async function renderScreen() {
    render(<WorkoutScreen />);
    await screen.findByText('Bench Press');
}

describe('rest timer on the workout screen', () => {
    beforeEach(async () => {
        jest.useFakeTimers();
        await AsyncStorage.clear();
        mockPlay.mockClear();
        mockHaptic.mockClear();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('starts when a set is marked complete, using the default duration', async () => {
        await renderScreen();
        expect(screen.queryByText('Rest')).toBeNull();

        fireEvent.press(screen.getAllByRole('checkbox')[0]);

        expect(screen.getByText('Rest')).toBeTruthy();
        expect(screen.getByText('1:30')).toBeTruthy();
    });

    it('does not start when a set is unchecked', async () => {
        await renderScreen();
        fireEvent.press(screen.getAllByRole('checkbox')[0]);
        fireEvent.press(screen.getByText('Skip'));
        expect(screen.queryByText('Rest')).toBeNull();

        fireEvent.press(screen.getAllByRole('checkbox')[0]); // uncheck
        expect(screen.queryByText('Rest')).toBeNull();
    });

    it('plays the alert and hides when the countdown finishes', async () => {
        await renderScreen();
        fireEvent.press(screen.getAllByRole('checkbox')[0]);

        await act(async () => {
            jest.advanceTimersByTime(90_000 + 500);
        });

        expect(screen.queryByText('Rest')).toBeNull();
        expect(mockPlay).toHaveBeenCalledTimes(1);
        expect(mockHaptic).toHaveBeenCalledTimes(1);
    });

    it('adjusts only the current rest with ±15s, leaving the default unchanged', async () => {
        await renderScreen();
        fireEvent.press(screen.getAllByRole('checkbox')[0]);
        fireEvent.press(screen.getByText('+15s'));
        expect(screen.getByText('1:45')).toBeTruthy();

        fireEvent.press(screen.getByText('−15s'));
        fireEvent.press(screen.getByText('−15s'));
        expect(screen.getByText('1:15')).toBeTruthy();
        fireEvent.press(screen.getByText('Skip'));

        fireEvent.press(screen.getAllByRole('checkbox')[1]);
        expect(screen.getByText('1:30')).toBeTruthy();
        expect(await AsyncStorage.getItem('restTimerDuration')).toBeNull();
    });

    it('remembers the chosen preset for the next set', async () => {
        await renderScreen();
        fireEvent.press(screen.getAllByRole('checkbox')[0]);
        fireEvent.press(screen.getByText('120s'));
        fireEvent.press(screen.getByText('Skip'));

        fireEvent.press(screen.getAllByRole('checkbox')[1]);
        expect(screen.getByText('Rest')).toBeTruthy();
        expect(screen.getAllByText('2:00').length).toBeGreaterThan(0);
        expect(await AsyncStorage.getItem('restTimerDuration')).toBe('120');
    });
});
