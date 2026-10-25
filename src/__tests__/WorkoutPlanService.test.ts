import { WorkoutPlanService } from '../Services/WorkoutPlanService';
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

function mockErrorResponse(status = 500): Response {
    return {
        ok: false,
        status,
        headers: { get: () => null },
        json: jest.fn(),
        text: jest.fn().mockResolvedValue('server exploded'),
    } as unknown as Response;
}

const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: 'Bearer token',
};

describe('WorkoutPlanService', () => {
    let fetchMock: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        fetchMock = jest.fn();
        global.fetch = fetchMock as unknown as typeof fetch;
        (getAccessToken as jest.Mock).mockReturnValue('token');
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('getWorkoutPlans', () => {
        it('gets /getWorkoutPlans and maps the response to domain plans', async () => {
            fetchMock.mockResolvedValue(
                mockJsonResponse({
                    plans: [
                        {
                            id: 'plan-1',
                            name: 'Spring block',
                            isActive: true,
                            startDate: '2026-04-01T00:00:00Z',
                            endDate: '2026-06-01T00:00:00Z',
                            days: [
                                { id: 'day-1', dayOfWeek: 1, workoutTemplateId: 'template-1', templateName: 'Push', note: 'Heavy' },
                            ],
                        },
                    ],
                })
            );

            const plans = await WorkoutPlanService.getWorkoutPlans();

            expect(fetchMock).toHaveBeenCalledWith(`${SERVER_URL}/getWorkoutPlans`, {
                method: 'GET',
                headers: authHeaders,
                body: undefined,
            });
            expect(plans).toHaveLength(1);
            expect(plans[0].Name).toBe('Spring block');
            expect(plans[0].IsActive).toBe(true);
            expect(plans[0].StartDate).toEqual(new Date('2026-04-01T00:00:00Z'));
            expect(plans[0].EndDate).toEqual(new Date('2026-06-01T00:00:00Z'));
            expect(plans[0].Days[0].TemplateName).toBe('Push');
        });

        it('returns an empty list when the user has no plans', async () => {
            fetchMock.mockResolvedValue(mockJsonResponse({ plans: [] }));

            await expect(WorkoutPlanService.getWorkoutPlans()).resolves.toEqual([]);
        });
    });

    describe('addWorkoutPlan', () => {
        it('posts the plan and returns its new id', async () => {
            fetchMock.mockResolvedValue(mockJsonResponse('plan-7'));

            const id = await WorkoutPlanService.addWorkoutPlan(
                'Summer block',
                '2026-06-01',
                '2026-08-01',
                [{ dayOfWeek: 1, workoutTemplateId: 'template-1' }]
            );

            expect(fetchMock).toHaveBeenCalledWith(`${SERVER_URL}/addWorkoutPlan`, {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify({
                    name: 'Summer block',
                    startDate: '2026-06-01',
                    endDate: '2026-08-01',
                    days: [{ dayOfWeek: 1, workoutTemplateId: 'template-1' }],
                }),
            });
            expect(id).toBe('plan-7');
        });

        it('omits an undefined end date from the request body', async () => {
            fetchMock.mockResolvedValue(mockJsonResponse('plan-8'));

            await WorkoutPlanService.addWorkoutPlan('Open ended', '2026-06-01', undefined, []);

            const body = JSON.parse(fetchMock.mock.calls[0][1].body);
            expect(body).not.toHaveProperty('endDate');
            expect(body.startDate).toBe('2026-06-01');
        });
    });

    describe('updateWorkoutPlan', () => {
        it('puts the plan id along with the new details', async () => {
            fetchMock.mockResolvedValue(mockEmptyResponse());

            await WorkoutPlanService.updateWorkoutPlan('plan-1', 'Renamed', '2026-05-01', undefined, [
                { dayOfWeek: 3, note: 'Tempo' },
            ]);

            expect(fetchMock).toHaveBeenCalledWith(`${SERVER_URL}/updateWorkoutPlan`, {
                method: 'PUT',
                headers: authHeaders,
                body: JSON.stringify({
                    planId: 'plan-1',
                    name: 'Renamed',
                    startDate: '2026-05-01',
                    days: [{ dayOfWeek: 3, note: 'Tempo' }],
                }),
            });
        });
    });

    describe('deleteWorkoutPlan', () => {
        it('deletes /deleteWorkoutPlan/:id with no body', async () => {
            fetchMock.mockResolvedValue(mockEmptyResponse());

            await WorkoutPlanService.deleteWorkoutPlan('plan-1');

            expect(fetchMock).toHaveBeenCalledWith(`${SERVER_URL}/deleteWorkoutPlan/plan-1`, {
                method: 'DELETE',
                headers: authHeaders,
                body: undefined,
            });
        });
    });

    describe('activateWorkoutPlan', () => {
        it('puts /activateWorkoutPlan/:id with no body', async () => {
            fetchMock.mockResolvedValue(mockEmptyResponse());

            await WorkoutPlanService.activateWorkoutPlan('plan-1');

            expect(fetchMock).toHaveBeenCalledWith(`${SERVER_URL}/activateWorkoutPlan/plan-1`, {
                method: 'PUT',
                headers: authHeaders,
                body: undefined,
            });
        });
    });

    describe('getTodaysWorkout', () => {
        it("asks for today's day of week and returns the response", async () => {
            jest.spyOn(Date.prototype, 'getDay').mockReturnValue(3);
            fetchMock.mockResolvedValue(
                mockJsonResponse({ template: { id: 'template-1', name: 'Push', exercises: [] }, note: 'Go heavy' })
            );

            const result = await WorkoutPlanService.getTodaysWorkout();

            expect(fetchMock).toHaveBeenCalledWith(`${SERVER_URL}/getTodaysWorkout?dayOfWeek=3`, {
                method: 'GET',
                headers: authHeaders,
                body: undefined,
            });
            expect(result!.template!.name).toBe('Push');
            expect(result!.note).toBe('Go heavy');
        });

        it('swallows a server error and returns null rather than throwing', async () => {
            jest.spyOn(Date.prototype, 'getDay').mockReturnValue(0);
            fetchMock.mockResolvedValue(mockErrorResponse());

            await expect(WorkoutPlanService.getTodaysWorkout()).resolves.toBeNull();
        });

        it('returns null when the request itself fails', async () => {
            jest.spyOn(Date.prototype, 'getDay').mockReturnValue(0);
            fetchMock.mockRejectedValue(new Error('offline'));

            await expect(WorkoutPlanService.getTodaysWorkout()).resolves.toBeNull();
        });
    });
});
