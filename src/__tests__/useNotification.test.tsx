import React from 'react';
import { Pressable, Text } from 'react-native';
import { render, fireEvent, act, renderHook } from '@testing-library/react-native';
import { NotificationProvider, useNotification } from '../Hooks/useNotification';

function Consumer() {
    const { showError, showSuccess } = useNotification();
    return (
        <>
            <Pressable testID="error-button" onPress={() => showError('Something went wrong')}>
                <Text>Error</Text>
            </Pressable>
            <Pressable testID="success-button" onPress={() => showSuccess('Saved!')}>
                <Text>Success</Text>
            </Pressable>
        </>
    );
}

function renderWithProvider() {
    return render(
        <NotificationProvider>
            <Consumer />
        </NotificationProvider>
    );
}

describe('useNotification', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it('throws when used outside a NotificationProvider', () => {
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
        expect(() => renderHook(() => useNotification())).toThrow(
            'useNotification must be used within a NotificationProvider'
        );
        consoleError.mockRestore();
    });

    it('shows an error toast with the given message', () => {
        const screen = renderWithProvider();

        fireEvent.press(screen.getByTestId('error-button'));

        expect(screen.getByText('Something went wrong')).toBeOnTheScreen();
    });

    it('shows a success toast with the given message', () => {
        const screen = renderWithProvider();

        fireEvent.press(screen.getByTestId('success-button'));

        expect(screen.getByText('Saved!')).toBeOnTheScreen();
    });

    it('hides the toast after the display timeout and fade out', () => {
        const screen = renderWithProvider();
        fireEvent.press(screen.getByTestId('error-button'));
        expect(screen.getByText('Something went wrong')).toBeOnTheScreen();

        act(() => {
            jest.advanceTimersByTime(3000); // display window
            jest.advanceTimersByTime(1000); // fade-out animation
        });

        expect(screen.queryByText('Something went wrong')).toBeNull();
    });

    it('replaces the current toast when a new one is shown', () => {
        const screen = renderWithProvider();

        fireEvent.press(screen.getByTestId('error-button'));
        fireEvent.press(screen.getByTestId('success-button'));

        expect(screen.queryByText('Something went wrong')).toBeNull();
        expect(screen.getByText('Saved!')).toBeOnTheScreen();
    });
});
