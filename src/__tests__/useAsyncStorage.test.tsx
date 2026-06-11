import AsyncStorage from '@react-native-async-storage/async-storage';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import useAsyncStorage from '../Hooks/useAsyncStorage';

jest.mock('@react-native-async-storage/async-storage', () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('useAsyncStorage', () => {
    beforeEach(async () => {
        await AsyncStorage.clear();
        jest.clearAllMocks();
    });

    it('returns the default value and reports loaded once storage resolves', async () => {
        const { result } = renderHook(() => useAsyncStorage('missingKey', 'fallback'));

        await waitFor(() => expect(result.current[1]).toBe(true));
        expect(result.current[0]).toBe('fallback');
    });

    it('loads and parses a previously stored value', async () => {
        await AsyncStorage.setItem('settings', JSON.stringify({ darkMode: true }));

        const { result } = renderHook(() =>
            useAsyncStorage<{ darkMode: boolean } | null>('settings', null)
        );

        await waitFor(() => expect(result.current[1]).toBe(true));
        expect(result.current[0]).toEqual({ darkMode: true });
    });

    it('setValue updates state and persists the JSON-encoded value', async () => {
        const { result } = renderHook(() => useAsyncStorage<string | null>('name', null));
        await waitFor(() => expect(result.current[1]).toBe(true));

        act(() => result.current[2]('Jacob'));

        expect(result.current[0]).toBe('Jacob');
        expect(AsyncStorage.setItem).toHaveBeenCalledWith('name', JSON.stringify('Jacob'));
    });

    it('setValue(null) removes the stored item', async () => {
        await AsyncStorage.setItem('name', JSON.stringify('Jacob'));
        const { result } = renderHook(() => useAsyncStorage<string | null>('name', null));
        await waitFor(() => expect(result.current[0]).toBe('Jacob'));

        act(() => result.current[2](null));

        expect(result.current[0]).toBeNull();
        expect(AsyncStorage.removeItem).toHaveBeenCalledWith('name');
    });
});
