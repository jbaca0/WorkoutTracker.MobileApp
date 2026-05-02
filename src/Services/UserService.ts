import LoginResult from '../Domain/LoginResult';
import AuthResponse from '../DataTransferObjects/Responses/AuthResponse';
import { setAccessToken, setRefreshToken, getRefreshToken, clearTokens } from '../Utils/tokenStorage';
import { BaseService } from './BaseService';

export class UserService extends BaseService {
    public static async login(email: string, password: string): Promise<LoginResult> {
        const response = await fetch(`${this.serverUrl}/auth/login`, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
        });

        const loginResult = new LoginResult(response.ok);
        if (response.ok) {
            const authResponse: AuthResponse = await response.json();
            setAccessToken(authResponse.accessToken);
            setRefreshToken(authResponse.refreshToken);
        } else {
            loginResult.errorMessage = await response.text();
        }
        return loginResult;
    }

    public static async logout() {
        const refreshToken = getRefreshToken();
        if (refreshToken) {
            try {
                await this.fetchFromServer('/auth/logout', { refreshToken });
            } catch {
                // Ignore logout errors, still clear tokens locally
            }
        }
        clearTokens();
    }
}
