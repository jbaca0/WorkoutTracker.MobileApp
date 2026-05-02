import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

function useAsyncStorage<T>(
    keyName: string,
    defaultValue: T
): [T, boolean, (value: T) => void] {
    const [storedValue, setStoredValue] = useState<T>(defaultValue);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        AsyncStorage.getItem(keyName).then(value => {
            if (value !== null) {
                try {
                    setStoredValue(JSON.parse(value));
                } catch {
                    setStoredValue(defaultValue);
                }
            }
            setLoaded(true);
        });
    }, [keyName]);

    const setValue = useCallback((newValue: T) => {
        setStoredValue(newValue);
        if (newValue === null || newValue === undefined) {
            AsyncStorage.removeItem(keyName);
        } else {
            AsyncStorage.setItem(keyName, JSON.stringify(newValue));
        }
    }, [keyName]);

    return [storedValue, loaded, setValue];
}

export default useAsyncStorage;
