import { useState, useEffect, useRef, useCallback } from 'react';
import { WalkSession, UserFitnessProfile } from '../types';

const STORAGE_KEY_SESSIONS = 'nocturne_walk_sessions';
const STORAGE_KEY_PROFILE = 'nocturne_user_profile';
const STORAGE_KEY_DAILY_STEPS = 'nocturne_daily_steps_v1';

export const DEFAULT_PROFILE: UserFitnessProfile = {
  weightKg: 70,
  heightCm: 172,
  strideLengthMeters: 0.74,
  dailyStepGoal: 6000,
  dailyCalorieGoal: 300,
};

export function usePedometer() {
  const [profile, setProfile] = useState<UserFitnessProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROFILE);
      return saved ? JSON.parse(saved) : DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  });

  const [sessions, setSessions] = useState<WalkSession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SESSIONS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Today's total steps (accumulated across sessions + ambient steps)
  const todayDateKey = new Date().toISOString().split('T')[0];
  const [todaySteps, setTodaySteps] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DAILY_STEPS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.date === todayDateKey) {
          return parsed.steps || 0;
        }
      }
      return 0;
    } catch {
      return 0;
    }
  });

  // Active workout session state
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [sessionSteps, setSessionSteps] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [currentCadence, setCurrentCadence] = useState<number>(0); // steps per minute
  const [sensorAvailable, setSensorAvailable] = useState<boolean | null>(null);
  const [sensorPermissionGranted, setSensorPermissionGranted] = useState<boolean>(false);
  const [isSimulationActive, setIsSimulationActive] = useState<boolean>(false);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(100); // SPM (steps per min)

  // Motion sensor filtering refs
  const lastStepTimeRef = useRef<number>(0);
  const recentStepTimestampsRef = useRef<number[]>([]);
  const lastAccVectorRef = useRef<number>(9.8);
  const stepThresholdRef = useRef<number>(11.5); // m/s^2 magnitude peak
  const sessionStartTimeRef = useRef<string | null>(null);

  // Sync profile to localStorage
  const updateProfile = useCallback((newProfile: Partial<UserFitnessProfile>) => {
    setProfile((prev) => {
      const updated = { ...prev, ...newProfile };
      try {
        localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(updated));
      } catch { /* ignore */ }
      return updated;
    });
  }, []);

  // Save today's step count
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY_DAILY_STEPS,
        JSON.stringify({ date: todayDateKey, steps: todaySteps })
      );
    } catch { /* ignore */ }
  }, [todaySteps, todayDateKey]);

  // Recalculate live cadence (SPM) based on recent step timestamps
  const recordStep = useCallback(() => {
    const now = Date.now();
    recentStepTimestampsRef.current.push(now);

    // Keep only timestamps within last 8 seconds
    recentStepTimestampsRef.current = recentStepTimestampsRef.current.filter(
      (t) => now - t <= 8000
    );

    if (recentStepTimestampsRef.current.length >= 2) {
      const count = recentStepTimestampsRef.current.length;
      const timespanMs =
        recentStepTimestampsRef.current[count - 1] - recentStepTimestampsRef.current[0];
      if (timespanMs > 500) {
        const spm = Math.round((count / (timespanMs / 1000)) * 60);
        setCurrentCadence(Math.min(220, Math.max(30, spm)));
      }
    }

    setSessionSteps((prev) => prev + 1);
    setTodaySteps((prev) => prev + 1);
  }, []);

  // Request motion permission (especially iOS Safari)
  const requestSensorPermission = useCallback(async () => {
    const MotionEvent = window.DeviceMotionEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };

    if (typeof MotionEvent?.requestPermission === 'function') {
      try {
        const response = await MotionEvent.requestPermission();
        if (response === 'granted') {
          setSensorPermissionGranted(true);
          setSensorAvailable(true);
          return true;
        } else {
          setSensorPermissionGranted(false);
          setSensorAvailable(false);
          return false;
        }
      } catch (err) {
        console.warn('DeviceMotion permission error:', err);
        setSensorAvailable(false);
        return false;
      }
    } else if ('DeviceMotionEvent' in window) {
      setSensorPermissionGranted(true);
      setSensorAvailable(true);
      return true;
    } else {
      setSensorAvailable(false);
      return false;
    }
  }, []);

  // Motion sensor listener
  useEffect(() => {
    if (!isActive || isPaused) return;

    let hasReceivedEvent = false;

    const handleMotion = (event: DeviceMotionEvent) => {
      hasReceivedEvent = true;
      if (sensorAvailable !== true) {
        setSensorAvailable(true);
      }

      const acc = event.accelerationIncludingGravity || event.acceleration;
      if (!acc || acc.x === null || acc.y === null || acc.z === null) return;

      const x = acc.x;
      const y = acc.y;
      const z = acc.z;
      const magnitude = Math.sqrt(x * x + y * y + z * z);

      // Lowpass + peak detection
      const prevMag = lastAccVectorRef.current;
      lastAccVectorRef.current = magnitude;

      const now = Date.now();
      const timeSinceLastStep = now - lastStepTimeRef.current;

      // Peak crossed threshold and minimum 260ms between steps (~230 SPM max)
      if (magnitude > stepThresholdRef.current && prevMag <= stepThresholdRef.current) {
        if (timeSinceLastStep > 260) {
          lastStepTimeRef.current = now;
          recordStep();
        }
      }
    };

    window.addEventListener('devicemotion', handleMotion);

    // Timeout to check if sensor really delivers events
    const checkTimer = window.setTimeout(() => {
      if (!hasReceivedEvent && sensorAvailable === null) {
        setSensorAvailable(false);
      }
    }, 2500);

    return () => {
      window.removeEventListener('devicemotion', handleMotion);
      window.clearTimeout(checkTimer);
    };
  }, [isActive, isPaused, sensorAvailable, recordStep]);

  // Cadence simulation runner (for indoor treadmill, desk walking, or desktop)
  useEffect(() => {
    if (!isActive || isPaused || !isSimulationActive) return;

    const intervalMs = (60 / simulationSpeed) * 1000;
    const intervalId = window.setInterval(() => {
      recordStep();
      setCurrentCadence(simulationSpeed);
    }, intervalMs);

    return () => window.clearInterval(intervalId);
  }, [isActive, isPaused, isSimulationActive, simulationSpeed, recordStep]);

  // Session timer ticker
  useEffect(() => {
    if (!isActive || isPaused) return;

    const ticker = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);

      // Clear cadence if no recent steps in last 5 seconds
      const now = Date.now();
      const lastTimestamps = recentStepTimestampsRef.current;
      if (lastTimestamps.length > 0 && now - lastTimestamps[lastTimestamps.length - 1] > 4000) {
        setCurrentCadence(0);
      }
    }, 1000);

    return () => window.clearInterval(ticker);
  }, [isActive, isPaused]);

  // Start walking workout
  const startSession = useCallback(() => {
    setIsActive(true);
    setIsPaused(false);
    setSessionSteps(0);
    setElapsedSeconds(0);
    setCurrentCadence(0);
    recentStepTimestampsRef.current = [];
    sessionStartTimeRef.current = new Date().toISOString();
  }, []);

  // Pause walking workout
  const pauseSession = useCallback(() => {
    setIsPaused(true);
    setCurrentCadence(0);
  }, []);

  // Resume walking workout
  const resumeSession = useCallback(() => {
    setIsPaused(false);
  }, []);

  // Compute calculated metrics
  const distanceKm = Number(((sessionSteps * profile.strideLengthMeters) / 1000).toFixed(2));
  const distanceMiles = Number((distanceKm * 0.621371).toFixed(2));

  // Calories formula:
  // Calorie burn based on MET and body weight:
  // Moderate walking (~4.5-5 km/h) MET is approx 3.5.
  // Standard formula: kcal = MET * weight(kg) * (durationHours)
  // Plus step count validation: ~0.04 kcal per step for 70kg person scaled by weight/70.
  const weightFactor = profile.weightKg / 70;
  const caloriesKcal = Math.round(sessionSteps * 0.042 * weightFactor);

  // Today's total distance & calories
  const todayDistanceKm = Number(((todaySteps * profile.strideLengthMeters) / 1000).toFixed(2));
  const todayCaloriesKcal = Math.round(todaySteps * 0.042 * weightFactor);

  // Pace: minutes per km
  const paceMinPerKm = distanceKm > 0.05 && elapsedSeconds > 30
    ? Number(((elapsedSeconds / 60) / distanceKm).toFixed(1))
    : 0;

  // Stop and finish session
  const finishSession = useCallback(() => {
    if (!isActive) return null;

    const endTime = new Date().toISOString();
    const newSession: WalkSession = {
      id: 'session_' + Date.now(),
      startTime: sessionStartTimeRef.current || new Date().toISOString(),
      endTime,
      durationSeconds: elapsedSeconds,
      steps: sessionSteps,
      distanceKm,
      caloriesKcal,
      avgCadence: elapsedSeconds > 10 ? Math.round((sessionSteps / (elapsedSeconds / 60))) : 0,
      paceMinPerKm,
    };

    if (sessionSteps >= 10 || elapsedSeconds >= 30) {
      setSessions((prev) => {
        const updated = [newSession, ...prev].slice(0, 50); // keep last 50
        try {
          localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(updated));
        } catch { /* ignore */ }
        return updated;
      });
    }

    setIsActive(false);
    setIsPaused(false);
    setIsSimulationActive(false);
    setCurrentCadence(0);

    return newSession;
  }, [isActive, elapsedSeconds, sessionSteps, distanceKm, caloriesKcal, paceMinPerKm]);

  // Reset session without saving
  const cancelSession = useCallback(() => {
    setIsActive(false);
    setIsPaused(false);
    setIsSimulationActive(false);
    setSessionSteps(0);
    setElapsedSeconds(0);
    setCurrentCadence(0);
  }, []);

  // Clear history
  const clearHistory = useCallback(() => {
    setSessions([]);
    try {
      localStorage.removeItem(STORAGE_KEY_SESSIONS);
    } catch { /* ignore */ }
  }, []);

  // Add manual steps
  const addManualSteps = useCallback((stepsToAdd: number) => {
    setTodaySteps((prev) => prev + stepsToAdd);
    if (isActive) {
      setSessionSteps((prev) => prev + stepsToAdd);
    }
  }, [isActive]);

  return {
    profile,
    updateProfile,
    sessions,
    todaySteps,
    todayDistanceKm,
    todayCaloriesKcal,
    isActive,
    isPaused,
    sessionSteps,
    elapsedSeconds,
    currentCadence,
    distanceKm,
    distanceMiles,
    caloriesKcal,
    paceMinPerKm,
    sensorAvailable,
    sensorPermissionGranted,
    requestSensorPermission,
    isSimulationActive,
    setIsSimulationActive,
    simulationSpeed,
    setSimulationSpeed,
    startSession,
    pauseSession,
    resumeSession,
    finishSession,
    cancelSession,
    clearHistory,
    addManualSteps,
  };
}
