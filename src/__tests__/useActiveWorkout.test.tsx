import React, { ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { ActiveWorkoutProvider, useActiveWorkout } from '../Hooks/useActiveWorkout';

jest.mock('@react-native-async-storage/async-storage', () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

const wrapper = ({ children }: { children: ReactNode }) => (
    <ActiveWorkoutProvider>{children}</ActiveWorkoutProvider>
);

describe('useActiveWorkout', () => {
    beforeEach(async () => {
        await AsyncStorage.clear();
        jest.clearAllMocks();
    });

    it('throws when used outside an ActiveWorkoutProvider', () => {
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
        expect(() => renderHook(() => useActiveWorkout())).toThrow(
            'useActiveWorkout must be used within an ActiveWorkout provider'
        );
        consoleError.mockRestore();
    });

    it('reports no active workout by default', async () => {
        const { result } = renderHook(() => useActiveWorkout(), { wrapper });

        await waitFor(() => expect(result.current.hasActiveWorkout).toBe(false));
        expect(result.current.activeWorkoutId).toBeNull();
        expect(result.current.workoutStartTime).toBeNull();
    });

    it('setActiveWorkout stores the id and a start time', async () => {
        const { result } = renderHook(() => useActiveWorkout(), { wrapper });
        await act(async () => {}); // flush the initial AsyncStorage load

        act(() => result.current.setActiveWorkout('workout-1'));

        expect(result.current.hasActiveWorkout).toBe(true);
        expect(result.current.activeWorkoutId).toBe('workout-1');
        expect(typeof result.current.workoutStartTime).toBe('string');
        expect(new Date(result.current.workoutStartTime!).getTime()).not.toBeNaN();
        expect(AsyncStorage.setItem).toHaveBeenCalledWith('activeWorkoutId', JSON.stringify('workout-1'));
    });

    it('clearActiveWorkout resets the state and removes stored values', async () => {
        const { result } = renderHook(() => useActiveWorkout(), { wrapper });
        await act(async () => {}); // flush the initial AsyncStorage load
        act(() => result.current.setActiveWorkout('workout-1'));

        act(() => result.current.clearActiveWorkout());

        expect(result.current.hasActiveWorkout).toBe(false);
        expect(result.current.activeWorkoutId).toBeNull();
        expect(result.current.workoutStartTime).toBeNull();
        expect(AsyncStorage.removeItem).toHaveBeenCalledWith('activeWorkoutId');
        expect(AsyncStorage.removeItem).toHaveBeenCalledWith('workoutStartTime');
    });

    it('restores an active workout persisted from a previous session', async () => {
        await AsyncStorage.setItem('activeWorkoutId', JSON.stringify('workout-9'));
        await AsyncStorage.setItem('workoutStartTime', JSON.stringify('2026-06-11T07:00:00.000Z'));

        const { result } = renderHook(() => useActiveWorkout(), { wrapper });

        await waitFor(() => expect(result.current.hasActiveWorkout).toBe(true));
        expect(result.current.activeWorkoutId).toBe('workout-9');
        expect(result.current.workoutStartTime).toBe('2026-06-11T07:00:00.000Z');
    });
});
