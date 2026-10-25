import { ExerciseGoalService } from '../Services/ExerciseGoalService';
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

const goalData = {
    id: 'goal-1',
    exerciseInfoId: 'info-1',
    exerciseInfo: {
        id: 'info-1',
        name: 'Bench Press',
        primaryMuscleGroup: MuscleGroup.Chest,
        secondaryMuscleGroups: [],
    },
    workoutPlanId: 'plan-1',
    startWeight: 100,
    startReps: 5,
    targetWeight: 140,
    targetReps: 5,
    goalDate: '2026-06-01T00:00:00Z',
    goalRecommendation: { weight: 115, reps: 5 },
};

describe('ExerciseGoalService', () => {
    let fetchMock: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        fetchMock = jest.fn();
        global.fetch = fetchMock as unknown as typeof fetch;
        (getAccessToken as jest.Mock).mockReturnValue('token');
    });

    describe('getGoals', () => {
        it('gets /exerciseGoals and maps the response to domain goals', async () => {
            fetchMock.mockResolvedValue(mockJsonResponse({ goals: [goalData] }));

            const goals = await ExerciseGoalService.getGoals();

            expect(fetchMock).toHaveBeenCalledWith(`${SERVER_URL}/exerciseGoals`, {
                method: 'GET',
                headers: authHeaders,
                body: undefined,
            });
            expect(goals).toHaveLength(1);
            expect(goals[0].Id).toBe('goal-1');
            expect(goals[0].ExerciseInfo.Name).toBe('Bench Press');
            expect(goals[0].TargetWeight).toBe(140);
            expect(goals[0].GoalDate).toEqual(new Date('2026-06-01T00:00:00Z'));
            expect(goals[0].GoalRecommendation).toEqual({ Weight: 115, Reps: 5 });
        });

        it('returns an empty list when the user has no goals', async () => {
            fetchMock.mockResolvedValue(mockJsonResponse({ goals: [] }));

            await expect(ExerciseGoalService.getGoals()).resolves.toEqual([]);
        });
    });

    describe('getGoalsByPlan', () => {
        it('gets the goals scoped to one plan', async () => {
            fetchMock.mockResolvedValue(mockJsonResponse({ goals: [goalData] }));

            const goals = await ExerciseGoalService.getGoalsByPlan('plan-1');

            expect(fetchMock).toHaveBeenCalledWith(`${SERVER_URL}/exerciseGoals/plan/plan-1`, {
                method: 'GET',
                headers: authHeaders,
                body: undefined,
            });
            expect(goals[0].WorkoutPlanId).toBe('plan-1');
        });
    });

    describe('createGoal', () => {
        it('posts the request and maps the created goal back', async () => {
            fetchMock.mockResolvedValue(mockJsonResponse(goalData));

            const request = {
                exerciseInfoId: 'info-1',
                workoutPlanId: 'plan-1',
                startWeight: 100,
                startReps: 5,
                targetWeight: 140,
                targetReps: 5,
                goalDate: '2026-06-01T00:00:00Z',
            };

            const goal = await ExerciseGoalService.createGoal(request);

            expect(fetchMock).toHaveBeenCalledWith(`${SERVER_URL}/exerciseGoals`, {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify(request),
            });
            expect(goal.Id).toBe('goal-1');
            expect(goal.StartWeight).toBe(100);
        });

        it('leaves optional start values out of the request body when omitted', async () => {
            fetchMock.mockResolvedValue(mockJsonResponse(goalData));

            await ExerciseGoalService.createGoal({
                exerciseInfoId: 'info-1',
                targetWeight: 225,
                targetReps: 5,
                goalDate: '2026-09-01T00:00:00Z',
            });

            const body = JSON.parse(fetchMock.mock.calls[0][1].body);
            expect(body).not.toHaveProperty('startWeight');
            expect(body).not.toHaveProperty('startReps');
            expect(body.targetWeight).toBe(225);
        });
    });

    describe('updateGoal', () => {
        it('puts the new numbers to /exerciseGoals/:id', async () => {
            fetchMock.mockResolvedValue(mockEmptyResponse());

            const request = {
                startWeight: 115,
                startReps: 3,
                targetWeight: 155,
                targetReps: 2,
                goalDate: '2026-11-01T00:00:00Z',
            };

            await ExerciseGoalService.updateGoal('goal-1', request);

            expect(fetchMock).toHaveBeenCalledWith(`${SERVER_URL}/exerciseGoals/goal-1`, {
                method: 'PUT',
                headers: authHeaders,
                body: JSON.stringify(request),
            });
        });
    });

    describe('assignGoalToPlan', () => {
        it('puts the plan id to /exerciseGoals/:id/plan', async () => {
            fetchMock.mockResolvedValue(mockEmptyResponse());

            await ExerciseGoalService.assignGoalToPlan('goal-1', { workoutPlanId: 'plan-2' });

            expect(fetchMock).toHaveBeenCalledWith(`${SERVER_URL}/exerciseGoals/goal-1/plan`, {
                method: 'PUT',
                headers: authHeaders,
                body: JSON.stringify({ workoutPlanId: 'plan-2' }),
            });
        });

        it('sends an empty body to detach a goal from its plan', async () => {
            fetchMock.mockResolvedValue(mockEmptyResponse());

            await ExerciseGoalService.assignGoalToPlan('goal-1', { workoutPlanId: undefined });

            expect(fetchMock.mock.calls[0][1].body).toBe('{}');
        });
    });

    describe('deleteGoal', () => {
        it('deletes /exerciseGoals/:id with no body', async () => {
            fetchMock.mockResolvedValue(mockEmptyResponse());

            await ExerciseGoalService.deleteGoal('goal-1');

            expect(fetchMock).toHaveBeenCalledWith(`${SERVER_URL}/exerciseGoals/goal-1`, {
                method: 'DELETE',
                headers: authHeaders,
                body: undefined,
            });
        });
    });
});
