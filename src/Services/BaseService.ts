import AuthResponse from '../DataTransferObjects/Responses/AuthResponse';
import { getAccessToken, getRefreshToken, setAccessToken, setRefreshToken, clearTokens } from '../Utils/tokenStorage';
import { triggerSessionExpired } from '../Utils/sessionManager';

export class BaseService {

    protected static serverUrl = process.env.EXPO_PUBLIC_SERVER_URL ?? 'http://localhost:5231';

    static async refreshToken(): Promise<'success' | 'invalid' | 'error'> {
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
            return 'invalid';
        }

        let response: Response;
        try {
            response = await fetch(`${this.serverUrl}/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refreshToken }),
            });
        } catch {
            // Network error - server unreachable, don't clear tokens
            return 'error';
        }

        if (response.status === 401 || response.status === 403) {
            clearTokens();
            return 'invalid';
        }

        if (!response.ok) {
            // Server error (5xx, etc.) - transient failure, don't clear tokens
            return 'error';
        }

        const authResponse: AuthResponse = await response.json();
        setAccessToken(authResponse.accessToken);
        setRefreshToken(authResponse.refreshToken);
        return 'success';
    }

    protected static async fetchFromServer<T>(endpoint: string, body?: unknown, method?: string): Promise<T> {
        const fetchMethod = method || (body ? "POST" : "GET");

        const makeRequest = async (token: string | null) => {
            const headers: Record<string, string> = {
                "Content-Type": "application/json",
            };

            if (token) {
                headers["Authorization"] = `Bearer ${token}`;
            }

            return fetch(`${this.serverUrl}${endpoint}`, {
                method: fetchMethod,
                headers,
                body: body ? JSON.stringify(body) : undefined,
            });
        };

        let response = await makeRequest(getAccessToken());

        if (response.status === 401) {
            const result = await this.refreshToken();
            if (result === 'success') {
                response = await makeRequest(getAccessToken());
            } else if (result === 'invalid') {
                triggerSessionExpired();
                throw new Error('Session expired. Please log in again.');
            } else {
                // Transient error - server unavailable, don't log the user out
                throw new Error('Unable to reach server. Please try again.');
            }
        }

        if (!response.ok) {
            throw new Error(`Error when making request to ${endpoint}: ${await response.text()}`);
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json() as T;
        } else {
            return {} as T;
        }
    }
}
