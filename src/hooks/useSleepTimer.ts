import { useState, useEffect, useRef, useCallback } from 'react';
import { soundEngine } from '../audio/soundEngine';

export interface SleepTimerState {
  isRunning: boolean;
  totalDurationSeconds: number;
  remainingSeconds: number;
  isFading: boolean;
}

export function useSleepTimer(onTimerFinished?: () => void) {
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [totalSeconds, setTotalSeconds] = useState<number>(30 * 60); // default 30 min
  const [remainingSeconds, setRemainingSeconds] = useState<number>(30 * 60);
  const [isFading, setIsFading] = useState<boolean>(false);

  const fadeTriggeredRef = useRef<boolean>(false);
  const onFinishedRef = useRef(onTimerFinished);
  onFinishedRef.current = onTimerFinished;

  // Start sleep timer
  const startTimer = useCallback((durationMinutes: number) => {
    soundEngine.cancelFadeOut();
    const secs = durationMinutes * 60;
    setTotalSeconds(secs);
    setRemainingSeconds(secs);
    setIsRunning(true);
    setIsFading(false);
    fadeTriggeredRef.current = false;
  }, []);

  // Cancel sleep timer
  const cancelTimer = useCallback(() => {
    soundEngine.cancelFadeOut();
    setIsRunning(false);
    setIsFading(false);
    fadeTriggeredRef.current = false;
    setRemainingSeconds(totalSeconds);
  }, [totalSeconds]);

  // Extend timer by N minutes
  const extendTimer = useCallback((extraMinutes: number) => {
    soundEngine.cancelFadeOut();
    setTotalSeconds((prev) => prev + extraMinutes * 60);
    setRemainingSeconds((prev) => prev + extraMinutes * 60);
    setIsFading(false);
    fadeTriggeredRef.current = false;
  }, []);

  // Countdown effect
  useEffect(() => {
    if (!isRunning) return;

    const intervalId = window.setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          // Timer finished
          window.clearInterval(intervalId);
          setIsRunning(false);
          setIsFading(false);
          fadeTriggeredRef.current = false;
          soundEngine.setMasterPlaying(false);
          if (onFinishedRef.current) {
            onFinishedRef.current();
          }
          return 0;
        }

        const next = prev - 1;

        // Check if we should trigger smooth fade-out (in last 120 seconds, or last 20% if short)
        const fadeThreshold = Math.min(120, Math.floor(totalSeconds * 0.2));
        if (next <= fadeThreshold && !fadeTriggeredRef.current) {
          fadeTriggeredRef.current = true;
          setIsFading(true);
          soundEngine.startSmoothFadeOut(next, () => {
            setIsRunning(false);
            setIsFading(false);
            if (onFinishedRef.current) {
              onFinishedRef.current();
            }
          });
        }

        return next;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [isRunning, totalSeconds]);

  const formatRemaining = useCallback((secs: number) => {
    const hours = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (hours > 0) {
      return `${hours}h ${mins.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
    }
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }, []);

  return {
    isRunning,
    totalSeconds,
    remainingSeconds,
    isFading,
    startTimer,
    cancelTimer,
    extendTimer,
    formatRemaining,
  };
}
