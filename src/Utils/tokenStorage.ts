import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

// In-memory cache so reads are synchronous during a session
let inMemoryAccessToken: string | null = null;
let inMemoryRefreshToken: string | null = null;

export async function loadTokensFromStorage(): Promise<void> {
    inMemoryAccessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    inMemoryRefreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getAccessToken(): string | null {
    return inMemoryAccessToken;
}

export function setAccessToken(token: string): void {
    inMemoryAccessToken = token;
    AsyncStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function getRefreshToken(): string | null {
    return inMemoryRefreshToken;
}

export function setRefreshToken(token: string): void {
    inMemoryRefreshToken = token;
    AsyncStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export function clearTokens(): void {
    inMemoryAccessToken = null;
    inMemoryRefreshToken = null;
    AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
    AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function hasTokens(): boolean {
    return inMemoryAccessToken !== null && inMemoryRefreshToken !== null;
}

export function isAccessTokenExpired(): boolean {
    const token = inMemoryAccessToken;
    if (!token) return true;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp * 1000 < Date.now();
    } catch {
        return true;
    }
}
