import { renderHook, act } from '@testing-library/react-native';
import useRestTimer from '../Hooks/useRestTimer';

describe('useRestTimer', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it('is idle before starting', () => {
        const { result } = renderHook(() => useRestTimer(jest.fn()));
        expect(result.current.isRunning).toBe(false);
        expect(result.current.secondsRemaining).toBe(0);
    });

    it('counts down after start', () => {
        const { result } = renderHook(() => useRestTimer(jest.fn()));
        act(() => result.current.start(10));
        expect(result.current.isRunning).toBe(true);
        expect(result.current.secondsRemaining).toBe(10);

        act(() => jest.advanceTimersByTime(3000));
        expect(result.current.secondsRemaining).toBe(7);
    });

    it('extends the countdown with addTime', () => {
        const { result } = renderHook(() => useRestTimer(jest.fn()));
        act(() => result.current.start(10));
        act(() => jest.advanceTimersByTime(2000)); // 8 left
        act(() => result.current.addTime(15));
        expect(result.current.secondsRemaining).toBe(23);
    });

    it('subtracts with a negative addTime, clamped at zero', () => {
        const { result } = renderHook(() => useRestTimer(jest.fn()));
        act(() => result.current.start(10));
        act(() => result.current.addTime(-100));
        expect(result.current.secondsRemaining).toBe(0);
    });

    it('fires onComplete exactly once when it reaches zero', () => {
        const onComplete = jest.fn();
        const { result } = renderHook(() => useRestTimer(onComplete));
        act(() => result.current.start(2));

        act(() => jest.advanceTimersByTime(2000));
        expect(onComplete).toHaveBeenCalledTimes(1);
        expect(result.current.isRunning).toBe(false);
        expect(result.current.secondsRemaining).toBe(0);

        // No further calls after it has finished.
        act(() => jest.advanceTimersByTime(2000));
        expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('does not fire onComplete when skipped', () => {
        const onComplete = jest.fn();
        const { result } = renderHook(() => useRestTimer(onComplete));
        act(() => result.current.start(10));
        act(() => result.current.skip());
        expect(result.current.isRunning).toBe(false);
        act(() => jest.advanceTimersByTime(10000));
        expect(onComplete).not.toHaveBeenCalled();
    });

    it('restarts cleanly when start is called again', () => {
        const { result } = renderHook(() => useRestTimer(jest.fn()));
        act(() => result.current.start(10));
        act(() => jest.advanceTimersByTime(5000)); // 5 left
        act(() => result.current.start(30));
        expect(result.current.secondsRemaining).toBe(30);
    });
});
