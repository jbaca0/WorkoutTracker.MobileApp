import { ExerciseInfoService } from '../Services/ExerciseInfoService';
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

describe('ExerciseInfoService', () => {
    let fetchMock: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        fetchMock = jest.fn();
        global.fetch = fetchMock as unknown as typeof fetch;
        (getAccessToken as jest.Mock).mockReturnValue('token');
    });

    describe('addExerciseInfo', () => {
        it('posts the new exercise definition to /addExerciseInfo', async () => {
            fetchMock.mockResolvedValue(mockJsonResponse({}));

            await ExerciseInfoService.addExerciseInfo(
                'Incline Bench',
                MuscleGroup.Chest,
                [MuscleGroup.Shoulders, MuscleGroup.Triceps]
            );

            expect(fetchMock).toHaveBeenCalledWith(`${SERVER_URL}/addExerciseInfo`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer token',
                },
                body: JSON.stringify({
                    name: 'Incline Bench',
                    primaryMuscleGroup: MuscleGroup.Chest,
                    secondaryMuscleGroups: [MuscleGroup.Shoulders, MuscleGroup.Triceps],
                }),
            });
        });
    });

    describe('getExerciseInfos', () => {
        it('fetches /getExerciseInfos with GET and maps to domain models', async () => {
            fetchMock.mockResolvedValue(
                mockJsonResponse({
                    exerciseInfos: [
                        {
                            id: 'info-1',
                            name: 'Deadlift',
                            primaryMuscleGroup: MuscleGroup.Back,
                            secondaryMuscleGroups: [MuscleGroup.Legs, MuscleGroup.Core],
                        },
                    ],
                })
            );

            const infos = await ExerciseInfoService.getExerciseInfos();

            expect(fetchMock).toHaveBeenCalledWith(
                `${SERVER_URL}/getExerciseInfos`,
                expect.objectContaining({ method: 'GET', body: undefined })
            );
            expect(infos).toHaveLength(1);
            expect(infos[0].Id).toBe('info-1');
            expect(infos[0].Name).toBe('Deadlift');
            expect(infos[0].PrimaryMuscleGroup).toBe(MuscleGroup.Back);
            expect(infos[0].SecondaryMuscleGroups).toEqual([MuscleGroup.Legs, MuscleGroup.Core]);
        });

        it('returns an empty array when the server has no exercise infos', async () => {
            fetchMock.mockResolvedValue(mockJsonResponse({ exerciseInfos: [] }));

            await expect(ExerciseInfoService.getExerciseInfos()).resolves.toEqual([]);
        });
    });
});
