import * as SecureStore from 'expo-secure-store';
import {
    loadTokensFromStorage,
    getAccessToken,
    setAccessToken,
    getRefreshToken,
    setRefreshToken,
    clearTokens,
    hasTokens,
    isAccessTokenExpired,
} from '../Utils/tokenStorage';

jest.mock('expo-secure-store', () => ({
    getItemAsync: jest.fn(),
    setItemAsync: jest.fn().mockResolvedValue(undefined),
    deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

const mockedSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

function makeJwt(payload: object): string {
    const base64url = Buffer.from(JSON.stringify(payload))
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    return `header.${base64url}.signature`;
}

describe('tokenStorage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        clearTokens();
    });

    it('loads both tokens from SecureStore into memory', async () => {
        mockedSecureStore.getItemAsync.mockImplementation(async (key: string) =>
            key === 'accessToken' ? 'stored-access' : 'stored-refresh'
        );

        await loadTokensFromStorage();

        expect(mockedSecureStore.getItemAsync).toHaveBeenCalledWith('accessToken');
        expect(mockedSecureStore.getItemAsync).toHaveBeenCalledWith('refreshToken');
        expect(getAccessToken()).toBe('stored-access');
        expect(getRefreshToken()).toBe('stored-refresh');
    });

    it('setAccessToken updates memory and persists to SecureStore', () => {
        setAccessToken('new-access');
        expect(getAccessToken()).toBe('new-access');
        expect(mockedSecureStore.setItemAsync).toHaveBeenCalledWith('accessToken', 'new-access');
    });

    it('setRefreshToken updates memory and persists to SecureStore', () => {
        setRefreshToken('new-refresh');
        expect(getRefreshToken()).toBe('new-refresh');
        expect(mockedSecureStore.setItemAsync).toHaveBeenCalledWith('refreshToken', 'new-refresh');
    });

    it('clearTokens wipes memory and deletes both stored keys', () => {
        setAccessToken('a');
        setRefreshToken('r');

        clearTokens();

        expect(getAccessToken()).toBeNull();
        expect(getRefreshToken()).toBeNull();
        expect(mockedSecureStore.deleteItemAsync).toHaveBeenCalledWith('accessToken');
        expect(mockedSecureStore.deleteItemAsync).toHaveBeenCalledWith('refreshToken');
    });

    it('hasTokens is true only when both tokens are present', () => {
        expect(hasTokens()).toBe(false);
        setAccessToken('a');
        expect(hasTokens()).toBe(false);
        setRefreshToken('r');
        expect(hasTokens()).toBe(true);
    });

    describe('isAccessTokenExpired', () => {
        it('returns true when there is no access token', () => {
            expect(isAccessTokenExpired()).toBe(true);
        });

        it('returns true when the JWT exp is in the past', () => {
            const past = Math.floor(Date.now() / 1000) - 60;
            setAccessToken(makeJwt({ exp: past }));
            expect(isAccessTokenExpired()).toBe(true);
        });

        it('returns false when the JWT exp is in the future', () => {
            const future = Math.floor(Date.now() / 1000) + 3600;
            setAccessToken(makeJwt({ exp: future }));
            expect(isAccessTokenExpired()).toBe(false);
        });

        it('handles base64url payloads containing - and _ characters', () => {
            const future = Math.floor(Date.now() / 1000) + 3600;
            // Padding-heavy payload to exercise the base64url -> base64 normalization
            setAccessToken(makeJwt({ exp: future, sub: '???>>>~~~', name: 'ab' }));
            expect(isAccessTokenExpired()).toBe(false);
        });
    });
});
