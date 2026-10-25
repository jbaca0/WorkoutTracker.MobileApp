import { BaseService } from '../Services/BaseService';
import {
    getAccessToken,
    getRefreshToken,
    setAccessToken,
    setRefreshToken,
    clearTokens,
} from '../Utils/tokenStorage';
import { triggerSessionExpired } from '../Utils/sessionManager';

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

// Expose the protected static method for testing
class TestService extends BaseService {
    static call<T>(endpoint: string, body?: unknown, method?: string): Promise<T> {
        return this.fetchFromServer<T>(endpoint, body, method);
    }
}

function mockResponse(options: {
    status?: number;
    json?: unknown;
    text?: string;
    contentType?: string | null;
}): Response {
    const status = options.status ?? 200;
    const contentType = options.contentType === undefined ? 'application/json' : options.contentType;
    return {
        ok: status >= 200 && status < 300,
        status,
        headers: {
            get: (name: string) => (name.toLowerCase() === 'content-type' ? contentType : null),
        },
        json: jest.fn().mockResolvedValue(options.json ?? {}),
        text: jest.fn().mockResolvedValue(options.text ?? ''),
    } as unknown as Response;
}

describe('BaseService.fetchFromServer', () => {
    let fetchMock: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        fetchMock = jest.fn();
        global.fetch = fetchMock as unknown as typeof fetch;
        mockGetAccessToken.mockReturnValue('access-token');
        mockGetRefreshToken.mockReturnValue('refresh-token');
    });

    it('issues a GET without a body and includes the bearer token', async () => {
        fetchMock.mockResolvedValue(mockResponse({ json: { value: 1 } }));

        const result = await TestService.call<{ value: number }>('/things');

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenCalledWith(`${SERVER_URL}/things`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer access-token',
            },
            body: undefined,
        });
        expect(result).toEqual({ value: 1 });
    });

    it('defaults to POST and serializes the body when one is provided', async () => {
        fetchMock.mockResolvedValue(mockResponse({ json: {} }));

        await TestService.call('/things', { name: 'bench' });

        expect(fetchMock).toHaveBeenCalledWith(
            `${SERVER_URL}/things`,
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ name: 'bench' }),
            })
        );
    });

    it('honors an explicit method override', async () => {
        fetchMock.mockResolvedValue(mockResponse({ contentType: null }));

        await TestService.call('/things/1', undefined, 'DELETE');

        expect(fetchMock).toHaveBeenCalledWith(
            `${SERVER_URL}/things/1`,
            expect.objectContaining({ method: 'DELETE' })
        );
    });

    it('omits the Authorization header when there is no access token', async () => {
        mockGetAccessToken.mockReturnValue(null);
        fetchMock.mockResolvedValue(mockResponse({ json: {} }));

        await TestService.call('/public');

        const headers = fetchMock.mock.calls[0][1].headers;
        expect(headers).toEqual({ 'Content-Type': 'application/json' });
    });

    it('returns an empty object for non-JSON responses', async () => {
        fetchMock.mockResolvedValue(mockResponse({ contentType: null }));

        const result = await TestService.call('/no-content');

        expect(result).toEqual({});
    });

    it('throws with the response text for non-ok responses', async () => {
        fetchMock.mockResolvedValue(mockResponse({ status: 500, text: 'boom' }));

        await expect(TestService.call('/broken')).rejects.toThrow(
            'Error when making request to /broken: boom'
        );
    });

    it('refreshes the token and retries once on a 401', async () => {
        mockGetAccessToken
            .mockReturnValueOnce('stale-token') // initial request
            .mockReturnValue('fresh-token'); // retry after refresh
        fetchMock
            .mockResolvedValueOnce(mockResponse({ status: 401 })) // original request
            .mockResolvedValueOnce(
                mockResponse({ json: { accessToken: 'fresh-token', refreshToken: 'fresh-refresh' } })
            ) // refresh call
            .mockResolvedValueOnce(mockResponse({ json: { ok: true } })); // retry

        const result = await TestService.call('/secure');

        expect(fetchMock).toHaveBeenCalledTimes(3);
        expect(fetchMock.mock.calls[1][0]).toBe(`${SERVER_URL}/auth/refresh`);
        expect(fetchMock.mock.calls[1][1]).toEqual({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: 'refresh-token' }),
        });
        expect(setAccessToken).toHaveBeenCalledWith('fresh-token');
        expect(setRefreshToken).toHaveBeenCalledWith('fresh-refresh');
        expect(fetchMock.mock.calls[2][1].headers.Authorization).toBe('Bearer fresh-token');
        expect(result).toEqual({ ok: true });
    });

    it('triggers session expiry and throws when a 401 cannot be refreshed', async () => {
        mockGetRefreshToken.mockReturnValue(null);
        fetchMock.mockResolvedValue(mockResponse({ status: 401 }));

        await expect(TestService.call('/secure')).rejects.toThrow(
            'Session expired. Please log in again.'
        );
        expect(triggerSessionExpired).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });
});

describe('BaseService.refreshToken', () => {
    let fetchMock: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        fetchMock = jest.fn();
        global.fetch = fetchMock as unknown as typeof fetch;
        mockGetRefreshToken.mockReturnValue('refresh-token');
    });

    it('returns false without calling the server when no refresh token exists', async () => {
        mockGetRefreshToken.mockReturnValue(null);

        await expect(BaseService.refreshToken()).resolves.toBe(false);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('stores the new tokens and returns true on success', async () => {
        fetchMock.mockResolvedValue(
            mockResponse({ json: { accessToken: 'new-access', refreshToken: 'new-refresh' } })
        );

        await expect(BaseService.refreshToken()).resolves.toBe(true);
        expect(setAccessToken).toHaveBeenCalledWith('new-access');
        expect(setRefreshToken).toHaveBeenCalledWith('new-refresh');
    });

    it('clears tokens and returns false when the server rejects the refresh', async () => {
        fetchMock.mockResolvedValue(mockResponse({ status: 401 }));

        await expect(BaseService.refreshToken()).resolves.toBe(false);
        expect(clearTokens).toHaveBeenCalledTimes(1);
    });

    it('returns false when the network request fails', async () => {
        fetchMock.mockRejectedValue(new Error('network down'));

        await expect(BaseService.refreshToken()).resolves.toBe(false);
        expect(clearTokens).not.toHaveBeenCalled();
    });

    it('deduplicates concurrent refresh calls into a single request', async () => {
        let resolveFetch!: (value: Response) => void;
        fetchMock.mockReturnValue(new Promise<Response>(resolve => (resolveFetch = resolve)));

        const first = BaseService.refreshToken();
        const second = BaseService.refreshToken();

        resolveFetch(mockResponse({ json: { accessToken: 'a', refreshToken: 'r' } }));

        await expect(first).resolves.toBe(true);
        await expect(second).resolves.toBe(true);
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });
});
