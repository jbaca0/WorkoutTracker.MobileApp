import { WorkoutService } from '../Services/WorkoutService';
import Workout from '../Domain/Workout';
import Exercise from '../Domain/Exercise';
import Set from '../Domain/Set';
import ExerciseInfo from '../Domain/ExerciseInfo';
import { MuscleGroup } from '../Enums/MuscleGroup';
import { getAccessToken } from '../Utils/tokenStorage';

jest.mock('../Utils/tokenStorage', () => ({
    getAccessToken: jest.fn(),
    getRefreshToken: jest.fn(),
    setAccessToken: jest.fn(),
    setRefreshToken: jest.fn(),
    clearTokens: jest.fn(),
}));

jest.mock('../Utils/sessionManager', () => ({
    triggerSessionExpired: jest.fn(),
}));

const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL ?? 'http://localhost:5231';

function mockJsonResponse(json: unknown): Response {
    return {
        ok: true,
        status: 200,
        headers: {
            get: (name: string) => (name.toLowerCase() === 'content-type' ? 'application/json' : null),
        },
        json: jest.fn().mockResolvedValue(json),
        text: jest.fn().mockResolvedValue(''),
    } as unknown as Response;
}

describe('WorkoutService', () => {
    let fetchMock: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        fetchMock = jest.fn();
        global.fetch = fetchMock as unknown as typeof fetch;
        (getAccessToken as jest.Mock).mockReturnValue('token');
    });

    describe('addWorkout', () => {
        it('posts to /addWorkout and returns the new workout id', async () => {
            fetchMock.mockResolvedValue(mockJsonResponse('workout-123'));

            const id = await WorkoutService.addWorkout();

            expect(fetchMock).toHaveBeenCalledWith(`${SERVER_URL}/addWorkout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer token',
                },
                body: JSON.stringify({}),
            });
            expect(id).toBe('workout-123');
        });
    });

    describe('addExercises', () => {
        it('posts the workout and exercise info ids and maps the response to exercises', async () => {
            fetchMock.mockResolvedValue(
                mockJsonResponse({
                    userExerciseInfos: [
                        {
                            exerciseInfo: {
                                id: 'info-1',
                                name: 'Bench Press',
                                primaryMuscleGroup: MuscleGroup.Chest,
                                secondaryMuscleGroups: [MuscleGroup.Triceps],
                            },
                            latestExercise: {
                                exerciseInfoId: 'info-1',
                                sets: [
                                    { reps: 10, weight: 100, order: 1 },
                                    { reps: 8, weight: 110, order: 2 },
                                ],
                            },
                        },
                        {
                            exerciseInfo: {
                                id: 'info-2',
                                name: 'Squat',
                                primaryMuscleGroup: MuscleGroup.Legs,
                                secondaryMuscleGroups: [],
                            },
                            latestExercise: null,
                        },
                    ],
                })
            );

            const exercises = await WorkoutService.addExercises('workout-1', ['info-1', 'info-2']);

            expect(fetchMock).toHaveBeenCalledWith(
                `${SERVER_URL}/addExercises`,
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({
                        workoutId: 'workout-1',
                        exerciseInfoIds: ['info-1', 'info-2'],
                    }),
                })
            );

            expect(exercises).toHaveLength(2);

            // Exercise with history: gets one empty set per previous set, ordered
            expect(exercises[0].ExerciseInfo?.Name).toBe('Bench Press');
            expect(exercises[0].PreviousExercise?.Sets).toHaveLength(2);
            expect(exercises[0].Sets).toHaveLength(2);
            expect(exercises[0].Sets.map(s => s.Order)).toEqual([1, 2]);
            expect(exercises[0].Sets.every(s => s.Reps === undefined && s.Weight === undefined)).toBe(true);

            // Exercise without history: no previous exercise and no pre-created sets
            expect(exercises[1].ExerciseInfo?.Name).toBe('Squat');
            expect(exercises[1].PreviousExercise).toBeUndefined();
            expect(exercises[1].Sets).toEqual([]);
        });
    });

    describe('save', () => {
        it('posts the workout id and serialized workout to /save', async () => {
            fetchMock.mockResolvedValue(mockJsonResponse({}));

            const workout = new Workout({
                Id: 'workout-1',
                Exercises: [
                    new Exercise({
                        ExerciseInfoId: 'info-1',
                        Sets: [new Set({ Id: 'set-1', Reps: 5, Weight: 225, Completed: true })],
                    }),
                ],
            });

            await WorkoutService.save(workout);

            expect(fetchMock).toHaveBeenCalledWith(
                `${SERVER_URL}/save`,
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({
                        workoutId: 'workout-1',
                        workout: {
                            id: 'workout-1',
                            exercises: [
                                {
                                    exerciseInfoId: 'info-1',
                                    exerciseInfo: undefined,
                                    sets: [{ id: 'set-1', reps: 5, weight: 225, completed: true }],
                                },
                            ],
                        },
                    }),
                })
            );
        });
    });

    describe('getWorkoutHistory', () => {
        it('fetches /getWorkoutHistory with GET and maps summaries', async () => {
            fetchMock.mockResolvedValue(
                mockJsonResponse({
                    workouts: [
                        {
                            id: 'w-1',
                            addDateTime: '2026-06-10T12:00:00Z',
                            exerciseCount: 3,
                            exerciseNames: ['Bench Press', 'Squat', 'Deadlift'],
                        },
                    ],
                })
            );

            const summaries = await WorkoutService.getWorkoutHistory();

            expect(fetchMock).toHaveBeenCalledWith(
                `${SERVER_URL}/getWorkoutHistory`,
                expect.objectContaining({ method: 'GET', body: undefined })
            );
            expect(summaries).toHaveLength(1);
            expect(summaries[0].Id).toBe('w-1');
            expect(summaries[0].AddDateTime).toEqual(new Date('2026-06-10T12:00:00Z'));
            expect(summaries[0].ExerciseCount).toBe(3);
            expect(summaries[0].ExerciseNames).toEqual(['Bench Press', 'Squat', 'Deadlift']);
        });
    });

    describe('getWorkoutDetail', () => {
        it('fetches the workout by id and maps it to the domain model', async () => {
            fetchMock.mockResolvedValue(
                mockJsonResponse({
                    workout: {
                        id: 'w-1',
                        addDateTime: '2026-06-10T12:00:00Z',
                        exercises: [
                            {
                                exerciseInfoId: 'info-1',
                                exerciseInfo: { id: 'info-1', name: 'Bench Press' },
                                sets: [{ id: 's-1', reps: 10, weight: 135, completed: true }],
                            },
                        ],
                    },
                })
            );

            const workout = await WorkoutService.getWorkoutDetail('w-1');

            expect(fetchMock).toHaveBeenCalledWith(
                `${SERVER_URL}/getWorkoutDetail/w-1`,
                expect.objectContaining({ method: 'GET' })
            );
            expect(workout.Id).toBe('w-1');
            expect(workout.Exercises).toHaveLength(1);
            expect(workout.Exercises[0].ExerciseInfo?.Name).toBe('Bench Press');
            expect(workout.Exercises[0].Sets[0].Reps).toBe(10);
        });
    });

    describe('cancelWorkout', () => {
        it('sends a DELETE to /cancelWorkout/:id with no body', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                status: 200,
                headers: { get: () => null },
                json: jest.fn(),
                text: jest.fn().mockResolvedValue(''),
            } as unknown as Response);

            await WorkoutService.cancelWorkout('w-9');

            expect(fetchMock).toHaveBeenCalledWith(
                `${SERVER_URL}/cancelWorkout/w-9`,
                expect.objectContaining({ method: 'DELETE', body: undefined })
            );
        });
    });
});
