import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

// In-memory cache so reads are synchronous during a session
let inMemoryAccessToken: string | null = null;
let inMemoryRefreshToken: string | null = null;

export async function loadTokensFromStorage(): Promise<void> {
    inMemoryAccessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    inMemoryRefreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export function getAccessToken(): string | null {
    return inMemoryAccessToken;
}

export function setAccessToken(token: string): void {
    inMemoryAccessToken = token;
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
}

export function getRefreshToken(): string | null {
    return inMemoryRefreshToken;
}

export function setRefreshToken(token: string): void {
    inMemoryRefreshToken = token;
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
}

export function clearTokens(): void {
    inMemoryAccessToken = null;
    inMemoryRefreshToken = null;
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}

export function hasTokens(): boolean {
    return inMemoryAccessToken !== null && inMemoryRefreshToken !== null;
}

export function isAccessTokenExpired(): boolean {
    const token = inMemoryAccessToken;
    if (!token) return true;
    // JWT uses base64url — normalize to base64 before decoding
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    return payload.exp * 1000 < Date.now();
}
