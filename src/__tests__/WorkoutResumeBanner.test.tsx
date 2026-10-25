import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

const mockRouter = { push: jest.fn(), back: jest.fn(), navigate: jest.fn(), replace: jest.fn() };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));

// Reassigned per test so each one can describe a different active-workout state.
let mockActiveWorkout: {
    hasActiveWorkout: boolean;
    activeWorkoutId: string | null;
    workoutStartTime: string | null;
    clearActiveWorkout: jest.Mock;
};
jest.mock('../Hooks/useActiveWorkout', () => ({
    useActiveWorkout: () => mockActiveWorkout,
}));

jest.mock('../Services/WorkoutService', () => ({
    WorkoutService: {
        getWorkoutDetail: jest.fn(),
        cancelWorkout: jest.fn(),
    },
}));

import { WorkoutService } from '../Services/WorkoutService';
import WorkoutResumeBanner from '../Components/WorkoutResumeBanner';
import Workout from '../Domain/Workout';

const getWorkoutDetail = WorkoutService.getWorkoutDetail as jest.Mock;
const cancelWorkout = WorkoutService.cancelWorkout as jest.Mock;

/**
 * The three icon/text buttons, in render order: expand, info, discard.
 * Pressable renders as a host View and the two icon buttons carry no text or
 * accessibility label, so there is nothing else to match them on.
 */
function buttons() {
    return screen.UNSAFE_root.findAll(
        (n: any) => typeof n.type === 'string' && n.props?.accessible === true && n.props?.focusable === true
    );
}

function setActive(overrides: Partial<typeof mockActiveWorkout> = {}) {
    mockActiveWorkout = {
        hasActiveWorkout: true,
        activeWorkoutId: 'workout-1',
        workoutStartTime: null,
        clearActiveWorkout: jest.fn(),
        ...overrides,
    };
}

/** Lets the getWorkoutDetail promise settle without leaving an un-acted update. */
async function flush() {
    await act(async () => {});
}

describe('WorkoutResumeBanner', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        getWorkoutDetail.mockRejectedValue(new Error('not needed'));
        setActive();
    });

    describe('when there is no active workout', () => {
        it('renders nothing at all', async () => {
            setActive({ hasActiveWorkout: false, activeWorkoutId: null });

            render(<WorkoutResumeBanner />);
            await flush();

            expect(screen.toJSON()).toBeNull();
        });
    });

    describe('elapsed time', () => {
        it('shows just the title when the workout has no start time', async () => {
            render(<WorkoutResumeBanner />);
            await flush();

            expect(screen.getByText('Workout')).toBeOnTheScreen();
        });

        it('shows seconds alone under a minute', async () => {
            setActive({ workoutStartTime: new Date(Date.now() - 45_000).toISOString() });

            render(<WorkoutResumeBanner />);
            await flush();

            expect(screen.getByText(/^Workout 45s$/)).toBeOnTheScreen();
        });

        it('shows minutes and seconds past a minute', async () => {
            setActive({ workoutStartTime: new Date(Date.now() - 90_000).toISOString() });

            render(<WorkoutResumeBanner />);
            await flush();

            expect(screen.getByText(/^Workout 1m 30s$/)).toBeOnTheScreen();
        });

        it('drops the seconds on a whole minute', async () => {
            setActive({ workoutStartTime: new Date(Date.now() - 120_000).toISOString() });

            render(<WorkoutResumeBanner />);
            await flush();

            expect(screen.getByText(/^Workout 2m$/)).toBeOnTheScreen();
        });

        it('ticks forward once a second', async () => {
            jest.useFakeTimers();
            try {
                const now = new Date('2026-10-24T12:00:00Z').getTime();
                jest.setSystemTime(now);
                setActive({ workoutStartTime: new Date(now - 90_000).toISOString() });

                render(<WorkoutResumeBanner />);
                expect(screen.getByText(/^Workout 1m 30s$/)).toBeOnTheScreen();

                act(() => {
                    jest.advanceTimersByTime(1000);
                });

                expect(screen.getByText(/^Workout 1m 31s$/)).toBeOnTheScreen();
            } finally {
                jest.useRealTimers();
            }
        });
    });

    describe('the current exercise', () => {
        it("shows the last exercise's name once the workout loads", async () => {
            getWorkoutDetail.mockResolvedValue(Workout.FromData({
                id: 'workout-1',
                exercises: [
                    { exerciseInfoId: 'info-1', exerciseInfo: { id: 'info-1', name: 'Bench Press' } as any, sets: [] },
                    { exerciseInfoId: 'info-2', exerciseInfo: { id: 'info-2', name: 'Overhead Press' } as any, sets: [] },
                ],
            }));

            render(<WorkoutResumeBanner />);

            expect(await screen.findByText('Overhead Press')).toBeOnTheScreen();
            expect(getWorkoutDetail).toHaveBeenCalledWith('workout-1');
        });

        it('shows no exercise name when the workout has none yet', async () => {
            getWorkoutDetail.mockResolvedValue(Workout.FromData({ id: 'workout-1', exercises: [] }));

            render(<WorkoutResumeBanner />);
            await flush();

            expect(screen.getByText('Workout')).toBeOnTheScreen();
            expect(screen.queryByText('Bench Press')).toBeNull();
        });

        it('stays on screen when the workout cannot be loaded', async () => {
            getWorkoutDetail.mockRejectedValue(new Error('offline'));

            render(<WorkoutResumeBanner />);
            await flush();

            expect(screen.getByText('Workout')).toBeOnTheScreen();
        });
    });

    describe('resuming', () => {
        it('navigates to the workout when the banner body is pressed', async () => {
            render(<WorkoutResumeBanner />);
            await flush();

            fireEvent.press(screen.getByText('Workout'));

            expect(mockRouter.push).toHaveBeenCalledWith('/workout/workout-1');
        });

        it('navigates to the workout from the expand button too', async () => {
            render(<WorkoutResumeBanner />);
            await flush();

            fireEvent.press(buttons()[0]);

            expect(mockRouter.push).toHaveBeenCalledWith('/workout/workout-1');
        });
    });

    describe('discarding', () => {
        it('asks for confirmation before cancelling anything', async () => {
            const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
            render(<WorkoutResumeBanner />);
            await flush();

            fireEvent.press(buttons()[2]);

            expect(alertSpy).toHaveBeenCalledTimes(1);
            const [title, message, alertButtons] = alertSpy.mock.calls[0] as any[];
            expect(title).toBe('Cancel Workout?');
            expect(message).toContain('cannot be undone');
            expect(alertButtons.map((b: any) => b.text)).toEqual(['Keep Going', 'Cancel Workout']);
            expect(cancelWorkout).not.toHaveBeenCalled();
            alertSpy.mockRestore();
        });

        it('cancels the workout and clears it when confirmed', async () => {
            cancelWorkout.mockResolvedValue(undefined);
            const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
            render(<WorkoutResumeBanner />);
            await flush();

            fireEvent.press(buttons()[2]);
            const confirm = (alertSpy.mock.calls[0] as any[])[2][1];
            await act(async () => {
                await confirm.onPress();
            });

            expect(cancelWorkout).toHaveBeenCalledWith('workout-1');
            expect(mockActiveWorkout.clearActiveWorkout).toHaveBeenCalled();
            alertSpy.mockRestore();
        });

        it('still clears the workout locally when the server call fails', async () => {
            cancelWorkout.mockRejectedValue(new Error('offline'));
            const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
            render(<WorkoutResumeBanner />);
            await flush();

            fireEvent.press(buttons()[2]);
            const confirm = (alertSpy.mock.calls[0] as any[])[2][1];
            await act(async () => {
                await confirm.onPress();
            });

            expect(mockActiveWorkout.clearActiveWorkout).toHaveBeenCalled();
            alertSpy.mockRestore();
        });

        it('clears the banner without calling the server when there is no workout id', async () => {
            // The real useActiveWorkout derives hasActiveWorkout from activeWorkoutId, so
            // this combination cannot occur in the app; it covers the handler's guard.
            setActive({ hasActiveWorkout: true, activeWorkoutId: null });
            const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
            render(<WorkoutResumeBanner />);
            await flush();

            fireEvent.press(buttons()[2]);
            const confirm = (alertSpy.mock.calls[0] as any[])[2][1];
            await act(async () => {
                await confirm.onPress();
            });

            expect(cancelWorkout).not.toHaveBeenCalled();
            alertSpy.mockRestore();
        });

        it('offers "Keep Going" as the cancel option, which does nothing', async () => {
            const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
            render(<WorkoutResumeBanner />);
            await flush();

            fireEvent.press(buttons()[2]);
            const keepGoing = (alertSpy.mock.calls[0] as any[])[2][0];

            expect(keepGoing.style).toBe('cancel');
            expect(keepGoing.onPress).toBeUndefined();
            expect(cancelWorkout).not.toHaveBeenCalled();
            alertSpy.mockRestore();
        });
    });
});
