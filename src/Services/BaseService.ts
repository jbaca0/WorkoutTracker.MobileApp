import AuthResponse from '../DataTransferObjects/Responses/AuthResponse';
import { getAccessToken, getRefreshToken, setAccessToken, setRefreshToken, clearTokens } from '../Utils/tokenStorage';
import { triggerSessionExpired } from '../Utils/sessionManager';

export class BaseService {

    protected static serverUrl = process.env.EXPO_PUBLIC_SERVER_URL ?? 'http://localhost:5231';

    private static refreshPromise: Promise<boolean> | null = null;

    static async refreshToken(): Promise<boolean> {
        if (this.refreshPromise !== null) {
            return this.refreshPromise;
        }

        this.refreshPromise = this.doRefresh().finally(() => {
            this.refreshPromise = null;
        });

        return this.refreshPromise;
    }

    private static async doRefresh(): Promise<boolean> {
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
            return false;
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
            return false;
        }

        if (!response.ok) {
            clearTokens();
            return false;
        }

        const authResponse: AuthResponse = await response.json();
        setAccessToken(authResponse.accessToken);
        setRefreshToken(authResponse.refreshToken);
        return true;
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
            const refreshed = await this.refreshToken();
            if (refreshed) {
                response = await makeRequest(getAccessToken());
            } else {
                triggerSessionExpired();
                throw new Error('Session expired. Please log in again.');
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
