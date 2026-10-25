import { WorkoutTemplateService } from '../Services/WorkoutTemplateService';
import { MuscleGroup } from '../Enums/MuscleGroup';
import { TargetSource } from '../Enums/TargetSource';
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

/** A 2xx with no body, as the void PUT and DELETE endpoints return. */
function mockEmptyResponse(): Response {
    return {
        ok: true,
        status: 204,
        headers: { get: () => null },
        json: jest.fn(),
        text: jest.fn().mockResolvedValue(''),
    } as unknown as Response;
}

const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: 'Bearer token',
};

describe('WorkoutTemplateService', () => {
    let fetchMock: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        fetchMock = jest.fn();
        global.fetch = fetchMock as unknown as typeof fetch;
        (getAccessToken as jest.Mock).mockReturnValue('token');
    });

    describe('getTemplates', () => {
        it('gets /getTemplates and maps the response to domain templates', async () => {
            fetchMock.mockResolvedValue(
                mockJsonResponse({
                    templates: [
                        {
                            id: 'template-1',
                            name: 'Push day',
                            exercises: [
                                {
                                    id: 'tex-1',
                                    exerciseInfoId: 'info-1',
                                    exerciseInfo: {
                                        id: 'info-1',
                                        name: 'Bench Press',
                                        primaryMuscleGroup: MuscleGroup.Chest,
                                        secondaryMuscleGroups: [MuscleGroup.Triceps],
                                    },
                                    order: 0,
                                    sets: [
                                        { id: 's-1', order: 0, reps: 10 },
                                        { id: 's-2', order: 1, reps: 8 },
                                    ],
                                },
                            ],
                        },
                    ],
                })
            );

            const templates = await WorkoutTemplateService.getTemplates();

            expect(fetchMock).toHaveBeenCalledWith(`${SERVER_URL}/getTemplates`, {
                method: 'GET',
                headers: authHeaders,
                body: undefined,
            });
            expect(templates).toHaveLength(1);
            expect(templates[0].Id).toBe('template-1');
            expect(templates[0].Name).toBe('Push day');
            const exercise = templates[0].Exercises[0];
            expect(exercise.ExerciseInfo?.Name).toBe('Bench Press');
            expect(exercise.Sets.map(s => s.Reps)).toEqual([10, 8]);
        });

        it('returns an empty list when the user has no templates', async () => {
            fetchMock.mockResolvedValue(mockJsonResponse({ templates: [] }));

            const templates = await WorkoutTemplateService.getTemplates();

            expect(templates).toEqual([]);
        });
    });

    describe('addTemplate', () => {
        it('posts the name and exercises and returns the new template id', async () => {
            fetchMock.mockResolvedValue(mockJsonResponse('template-9'));

            const id = await WorkoutTemplateService.addTemplate('Leg day', [
                { exerciseInfoId: 'info-1', sets: [{ reps: 5 }, { reps: 5 }] },
            ]);

            expect(fetchMock).toHaveBeenCalledWith(`${SERVER_URL}/addTemplate`, {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify({
                    name: 'Leg day',
                    exercises: [{ exerciseInfoId: 'info-1', sets: [{ reps: 5 }, { reps: 5 }] }],
                }),
            });
            expect(id).toBe('template-9');
        });
    });

    describe('updateTemplate', () => {
        it('puts the template id, name and exercises', async () => {
            fetchMock.mockResolvedValue(mockEmptyResponse());

            await WorkoutTemplateService.updateTemplate('template-1', 'Renamed', [
                { exerciseInfoId: 'info-2', sets: [{ reps: 12 }] },
            ]);

            expect(fetchMock).toHaveBeenCalledWith(`${SERVER_URL}/updateTemplate`, {
                method: 'PUT',
                headers: authHeaders,
                body: JSON.stringify({
                    templateId: 'template-1',
                    name: 'Renamed',
                    exercises: [{ exerciseInfoId: 'info-2', sets: [{ reps: 12 }] }],
                }),
            });
        });
    });

    describe('deleteTemplate', () => {
        it('deletes /deleteTemplate/:id with no body', async () => {
            fetchMock.mockResolvedValue(mockEmptyResponse());

            await WorkoutTemplateService.deleteTemplate('template-1');

            expect(fetchMock).toHaveBeenCalledWith(`${SERVER_URL}/deleteTemplate/template-1`, {
                method: 'DELETE',
                headers: authHeaders,
                body: undefined,
            });
        });
    });

    describe('startWorkoutFromTemplate', () => {
        it('posts the template id and returns the new workout id', async () => {
            fetchMock.mockResolvedValue(
                mockJsonResponse({ workoutId: 'workout-5', userExerciseInfos: [] })
            );

            const result = await WorkoutTemplateService.startWorkoutFromTemplate('template-1');

            expect(fetchMock).toHaveBeenCalledWith(`${SERVER_URL}/startWorkoutFromTemplate`, {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify({ templateId: 'template-1' }),
            });
            expect(result.workoutId).toBe('workout-5');
            expect(result.exercises).toEqual([]);
        });

        it('pre-fills a set per target set, carrying the target reps and weight', async () => {
            fetchMock.mockResolvedValue(
                mockJsonResponse({
                    workoutId: 'workout-5',
                    userExerciseInfos: [
                        {
                            exerciseInfo: {
                                id: 'info-1',
                                name: 'Squat',
                                primaryMuscleGroup: MuscleGroup.Legs,
                                secondaryMuscleGroups: [],
                            },
                            target: {
                                type: TargetSource.Plan,
                                sets: [
                                    { weight: 225, reps: 5 },
                                    { weight: 225, reps: 3 },
                                ],
                            },
                        },
                    ],
                })
            );

            const result = await WorkoutTemplateService.startWorkoutFromTemplate('template-1');

            const exercise = result.exercises[0];
            expect(exercise.ExerciseInfo?.Name).toBe('Squat');
            expect(exercise.Target?.Type).toBe(TargetSource.Plan);
            expect(exercise.Sets).toHaveLength(2);
            expect(exercise.Sets.map(s => s.Order)).toEqual([0, 1]);
            expect(exercise.Sets.map(s => s.Reps)).toEqual([5, 3]);
            expect(exercise.Sets.map(s => s.Weight)).toEqual([225, 225]);
        });

        it('creates no sets for an exercise with no target', async () => {
            fetchMock.mockResolvedValue(
                mockJsonResponse({
                    workoutId: 'workout-5',
                    userExerciseInfos: [
                        {
                            exerciseInfo: {
                                id: 'info-1',
                                name: 'Curl',
                                primaryMuscleGroup: MuscleGroup.Biceps,
                                secondaryMuscleGroups: [],
                            },
                        },
                    ],
                })
            );

            const result = await WorkoutTemplateService.startWorkoutFromTemplate('template-1');

            expect(result.exercises[0].Sets).toEqual([]);
            expect(result.exercises[0].Target).toBeUndefined();
        });
    });
});
