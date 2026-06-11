import { UserService } from '../Services/UserService';
import {
    getAccessToken,
    getRefreshToken,
    setAccessToken,
    setRefreshToken,
    clearTokens,
} from '../Utils/tokenStorage';

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

const mockGetAccessToken = getAccessToken as jest.Mock;
const mockGetRefreshToken = getRefreshToken as jest.Mock;

const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL ?? 'http://localhost:5231';

function mockResponse(options: { status?: number; json?: unknown; contentType?: string | null }): Response {
    const status = options.status ?? 200;
    const contentType = options.contentType === undefined ? 'application/json' : options.contentType;
    return {
        ok: status >= 200 && status < 300,
        status,
        headers: {
            get: (name: string) => (name.toLowerCase() === 'content-type' ? contentType : null),
        },
        json: jest.fn().mockResolvedValue(options.json ?? {}),
        text: jest.fn().mockResolvedValue(''),
    } as unknown as Response;
}

describe('UserService.login', () => {
    let fetchMock: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        fetchMock = jest.fn();
        global.fetch = fetchMock as unknown as typeof fetch;
    });

    it('posts the credentials to /auth/login', async () => {
        fetchMock.mockResolvedValue(
            mockResponse({ json: { accessToken: 'a', refreshToken: 'r' } })
        );

        await UserService.login('user@example.com', 'hunter2');

        expect(fetchMock).toHaveBeenCalledWith(`${SERVER_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'user@example.com', password: 'hunter2' }),
        });
    });

    it('stores the returned tokens and reports success', async () => {
        fetchMock.mockResolvedValue(
            mockResponse({ json: { accessToken: 'new-access', refreshToken: 'new-refresh' } })
        );

        const result = await UserService.login('user@example.com', 'hunter2');

        expect(result.success).toBe(true);
        expect(result.errorMessage).toBeUndefined();
        expect(setAccessToken).toHaveBeenCalledWith('new-access');
        expect(setRefreshToken).toHaveBeenCalledWith('new-refresh');
    });

    it('reports failure with an error message on bad credentials', async () => {
        fetchMock.mockResolvedValue(mockResponse({ status: 401 }));

        const result = await UserService.login('user@example.com', 'wrong');

        expect(result.success).toBe(false);
        expect(result.errorMessage).toBe('Invalid email or password.');
        expect(setAccessToken).not.toHaveBeenCalled();
        expect(setRefreshToken).not.toHaveBeenCalled();
    });
});

describe('UserService.logout', () => {
    let fetchMock: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        fetchMock = jest.fn();
        global.fetch = fetchMock as unknown as typeof fetch;
        mockGetAccessToken.mockReturnValue('access-token');
    });

    it('revokes the refresh token on the server and clears local tokens', async () => {
        mockGetRefreshToken.mockReturnValue('refresh-token');
        fetchMock.mockResolvedValue(mockResponse({ contentType: null }));

        await UserService.logout();

        expect(fetchMock).toHaveBeenCalledWith(`${SERVER_URL}/auth/logout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer access-token',
            },
            body: JSON.stringify({ refreshToken: 'refresh-token' }),
        });
        expect(clearTokens).toHaveBeenCalledTimes(1);
    });

    it('skips the server call when there is no refresh token but still clears tokens', async () => {
        mockGetRefreshToken.mockReturnValue(null);

        await UserService.logout();

        expect(fetchMock).not.toHaveBeenCalled();
        expect(clearTokens).toHaveBeenCalledTimes(1);
    });
});
