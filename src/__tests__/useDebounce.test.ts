import { renderHook, act } from '@testing-library/react-native';
import useDebounce from '../Hooks/useDebounce';

describe('useDebounce', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it('returns the initial value immediately', () => {
        const { result } = renderHook(() => useDebounce('hello', 300));
        expect(result.current).toBe('hello');
    });

    it('does not update before the delay elapses', () => {
        const { result, rerender } = renderHook(
            ({ value }) => useDebounce(value, 300),
            { initialProps: { value: 'hello' } }
        );
        rerender({ value: 'world' });
        act(() => jest.advanceTimersByTime(100));
        expect(result.current).toBe('hello');
    });

    it('updates after the delay elapses', () => {
        const { result, rerender } = renderHook(
            ({ value }) => useDebounce(value, 300),
            { initialProps: { value: 'hello' } }
        );
        rerender({ value: 'world' });
        act(() => jest.advanceTimersByTime(300));
        expect(result.current).toBe('world');
    });

    it('resets the timer when value changes rapidly', () => {
        const { result, rerender } = renderHook(
            ({ value }) => useDebounce(value, 300),
            { initialProps: { value: 'a' } }
        );
        rerender({ value: 'b' });
        act(() => jest.advanceTimersByTime(200));
        rerender({ value: 'c' });
        act(() => jest.advanceTimersByTime(200));
        expect(result.current).toBe('a');
        act(() => jest.advanceTimersByTime(100));
        expect(result.current).toBe('c');
    });
});
