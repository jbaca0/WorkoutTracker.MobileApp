import { useCallback, useEffect, useRef, useState } from 'react';

const TICK_MS = 250;

export interface RestTimer {
    /** Whole seconds left on the current countdown. */
    secondsRemaining: number;
    /** True while a countdown is active (not yet finished or skipped). */
    isRunning: boolean;
    /** Start (or restart) a countdown for the given number of seconds. */
    start: (durationSeconds: number) => void;
    /** Stop and hide the timer without firing the completion callback. */
    skip: () => void;
    /** Add (or subtract, with a negative value) seconds from the countdown, clamped to >= 0. */
    addTime: (deltaSeconds: number) => void;
}

/**
 * A rest countdown between sets. Tracks a target end timestamp rather than
 * blindly decrementing, so the display stays accurate and self-corrects after
 * the app is briefly backgrounded. Invokes `onComplete` once when it reaches 0.
 */
export default function useRestTimer(onComplete: () => void): RestTimer {
    const [secondsRemaining, setSecondsRemaining] = useState(0);
    const [isRunning, setIsRunning] = useState(false);

    const endAtRef = useRef<number | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const onCompleteRef = useRef(onComplete);

    // Keep the latest callback without restarting the interval.
    useEffect(() => {
        onCompleteRef.current = onComplete;
    }, [onComplete]);

    const clearTicker = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    const finish = useCallback(() => {
        clearTicker();
        endAtRef.current = null;
        setIsRunning(false);
        setSecondsRemaining(0);
        onCompleteRef.current();
    }, [clearTicker]);

    const tick = useCallback(() => {
        if (endAtRef.current === null) return;
        const msLeft = endAtRef.current - Date.now();
        if (msLeft <= 0) {
            finish();
        } else {
            setSecondsRemaining(Math.ceil(msLeft / 1000));
        }
    }, [finish]);

    const ensureTicker = useCallback(() => {
        if (!intervalRef.current) {
            intervalRef.current = setInterval(tick, TICK_MS);
        }
    }, [tick]);

    const start = useCallback((durationSeconds: number) => {
        if (durationSeconds <= 0) return;
        endAtRef.current = Date.now() + durationSeconds * 1000;
        setSecondsRemaining(durationSeconds);
        setIsRunning(true);
        ensureTicker();
    }, [ensureTicker]);

    const skip = useCallback(() => {
        clearTicker();
        endAtRef.current = null;
        setIsRunning(false);
        setSecondsRemaining(0);
    }, [clearTicker]);

    const addTime = useCallback((deltaSeconds: number) => {
        if (endAtRef.current === null) return;
        const msLeft = Math.max(0, endAtRef.current - Date.now() + deltaSeconds * 1000);
        endAtRef.current = Date.now() + msLeft;
        setSecondsRemaining(Math.ceil(msLeft / 1000));
    }, []);

    // Clean up on unmount.
    useEffect(() => clearTicker, [clearTicker]);

    return { secondsRemaining, isRunning, start, skip, addTime };
}
