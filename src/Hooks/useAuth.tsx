import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { useRouter } from 'expo-router';
import useAsyncStorage from "./useAsyncStorage";
import { UserService } from "../Services/UserService";
import { BaseService } from "../Services/BaseService";
import { clearTokens, isAccessTokenExpired, loadTokensFromStorage } from "../Utils/tokenStorage";
import { setSessionExpiredHandler } from "../Utils/sessionManager";
import { useActiveWorkout } from "./useActiveWorkout";

interface AuthProviderProps {
    children: ReactNode;
}

interface User {
    email: string;
}

interface AuthContext {
    user: User | null;
    authLoaded: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
    errorMessage: string | undefined;
}

const AuthContext = createContext<AuthContext | undefined>(undefined);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, authLoaded, setUser] = useAsyncStorage<User | null>("user", null);
    const router = useRouter();
    const [errorMessage, setErrorMessage] = useState<string>();
    const { clearActiveWorkout } = useActiveWorkout();
    const [tokensLoaded, setTokensLoaded] = useState(false);

    // On mount: load JWT tokens from SecureStore into memory
    useEffect(() => {
        loadTokensFromStorage().then(() => {
            setTokensLoaded(true);
        });
    }, []);

    // On mount: check token expiry and attempt refresh if needed
    useEffect(() => {
        if (!authLoaded) return;
        if (!tokensLoaded) return;
        if (!user) return;
        if (isAccessTokenExpired()) {
            BaseService.refreshToken().then(refreshed => {
                if (!refreshed) {
                    clearTokens();
                    clearActiveWorkout();
                    setUser(null);
                    router.replace('/');
                }
            });
        }
    }, [authLoaded, tokensLoaded]);

    // Register session expired handler
    useEffect(() => {
        setSessionExpiredHandler(() => {
            clearTokens();
            clearActiveWorkout();
            setUser(null);
            router.replace('/');
        });
    }, []);

    async function login(email: string, password: string) {
        setErrorMessage(undefined);
        const loginResult = await UserService.login(email, password);
        if (loginResult.success) {
            setUser({ email });
            router.replace('/(tabs)/home');
        } else {
            setErrorMessage(loginResult.errorMessage);
        }
    }

    async function logout() {
        await UserService.logout();
        clearTokens();
        clearActiveWorkout();
        setUser(null);
        router.replace('/');
    }

    const value = useMemo(
        () => ({
            user,
            authLoaded,
            login,
            logout,
            errorMessage,
        } as AuthContext),
        [user, authLoaded, errorMessage]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
    const auth = useContext(AuthContext);
    if (!auth) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return auth;
}
