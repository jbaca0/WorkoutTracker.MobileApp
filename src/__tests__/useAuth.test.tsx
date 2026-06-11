import React, { ReactNode } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../Hooks/useAuth';
import { ActiveWorkoutProvider } from '../Hooks/useActiveWorkout';
import { UserService } from '../Services/UserService';
import LoginResult from '../Domain/LoginResult';
import { clearTokens } from '../Utils/tokenStorage';

jest.mock('@react-native-async-storage/async-storage', () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
    useRouter: () => ({ replace: mockReplace }),
}));

jest.mock('../Services/UserService', () => ({
    UserService: {
        login: jest.fn(),
        logout: jest.fn(),
    },
}));

jest.mock('../Utils/tokenStorage', () => ({
    loadTokensFromStorage: jest.fn().mockResolvedValue(undefined),
    isAccessTokenExpired: jest.fn().mockReturnValue(false),
    clearTokens: jest.fn(),
    getAccessToken: jest.fn(),
    getRefreshToken: jest.fn(),
    setAccessToken: jest.fn(),
    setRefreshToken: jest.fn(),
}));

const mockLogin = UserService.login as jest.Mock;
const mockLogout = UserService.logout as jest.Mock;

const wrapper = ({ children }: { children: ReactNode }) => (
    <ActiveWorkoutProvider>
        <AuthProvider>{children}</AuthProvider>
    </ActiveWorkoutProvider>
);

describe('useAuth', () => {
    beforeEach(() => {
        const AsyncStorage = require('@react-native-async-storage/async-storage');
        return AsyncStorage.clear().then(() => jest.clearAllMocks());
    });

    it('throws when used outside an AuthProvider', () => {
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
        expect(() => renderHook(() => useAuth())).toThrow(
            'useAuth must be used within an AuthProvider'
        );
        consoleError.mockRestore();
    });

    it('starts with no user once auth has loaded', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => expect(result.current.authLoaded).toBe(true));
        expect(result.current.user).toBeNull();
        expect(result.current.errorMessage).toBeUndefined();
    });

    it('successful login stores the user and navigates home', async () => {
        mockLogin.mockResolvedValue(new LoginResult(true));
        const { result } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => expect(result.current.authLoaded).toBe(true));

        await act(() => result.current.login('jacob@example.com', 'pw'));

        expect(mockLogin).toHaveBeenCalledWith('jacob@example.com', 'pw');
        expect(result.current.user).toEqual({ email: 'jacob@example.com' });
        expect(mockReplace).toHaveBeenCalledWith('/(tabs)/home');
    });

    it('failed login surfaces the error message and keeps the user logged out', async () => {
        const failure = new LoginResult(false);
        failure.errorMessage = 'Invalid email or password.';
        mockLogin.mockResolvedValue(failure);
        const { result } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => expect(result.current.authLoaded).toBe(true));

        await act(() => result.current.login('jacob@example.com', 'wrong'));

        expect(result.current.errorMessage).toBe('Invalid email or password.');
        expect(result.current.user).toBeNull();
        expect(mockReplace).not.toHaveBeenCalled();
    });

    it('logout clears the user and tokens and navigates to the root', async () => {
        mockLogin.mockResolvedValue(new LoginResult(true));
        mockLogout.mockResolvedValue(undefined);
        const { result } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => expect(result.current.authLoaded).toBe(true));
        await act(() => result.current.login('jacob@example.com', 'pw'));

        await act(() => result.current.logout());

        expect(mockLogout).toHaveBeenCalledTimes(1);
        expect(clearTokens).toHaveBeenCalled();
        expect(result.current.user).toBeNull();
        expect(mockReplace).toHaveBeenLastCalledWith('/');
    });
});
