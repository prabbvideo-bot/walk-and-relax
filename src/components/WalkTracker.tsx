import React, { useState } from 'react';
import {
  Footprints,
  Flame,
  Clock,
  Compass,
  Play,
  Pause,
  Square,
  Smartphone,
  Gauge,
  Plus,
  Settings,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { usePedometer } from '../hooks/usePedometer';
import { WalkSession } from '../types';

interface WalkTrackerProps {
  pedometer: ReturnType<typeof usePedometer>;
  onWalkFinishedNotification?: (session: WalkSession) => void;
}

export const WalkTracker: React.FC<WalkTrackerProps> = ({
  pedometer,
  onWalkFinishedNotification,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualCount, setManualCount] = useState<number>(500);

  // Settings form state
  const [formWeight, setFormWeight] = useState(pedometer.profile.weightKg.toString());
  const [formGoal, setFormGoal] = useState(pedometer.profile.dailyStepGoal.toString());
  const [formStride, setFormStride] = useState(pedometer.profile.strideLengthMeters.toString());

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    pedometer.updateProfile({
      weightKg: Math.max(30, Math.min(250, parseFloat(formWeight) || 70)),
      dailyStepGoal: Math.max(500, Math.min(50000, parseInt(formGoal, 10) || 6000)),
      strideLengthMeters: Math.max(0.4, Math.min(1.2, parseFloat(formStride) || 0.74)),
    });
    setShowSettings(false);
  };

  const handleFinish = () => {
    const session = pedometer.finishSession();
    if (session && onWalkFinishedNotification) {
      onWalkFinishedNotification(session);
    }
  };

  const formatSeconds = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Daily goal calculation
  const goalPercent = Math.min(
    100,
    Math.round((pedometer.todaySteps / pedometer.profile.dailyStepGoal) * 100)
  );

  return (
    <div className="space-y-6">
      {/* Header Banner & Goals */}
      <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 md:p-6 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium tracking-wide">
              <span>Mindful Walking & Wellness</span>
              <span aria-hidden="true">·</span>
              <span>MET-Calibrated Energy Burn</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-100 mt-1">
              Live Pedometer & Calorie Tracker
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-xl">
              Track live foot steps using phone motion sensors or cadence sync while enjoying calming ambient nature sounds.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowManualModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Log Steps</span>
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Goals & Weight</span>
            </button>
          </div>
        </div>

        {/* Daily Progress Gauge & Today's Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-800/80">
          {/* Today's Step Ring Card */}
          <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
            <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
              <svg className="w-16 h-16 transform -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="26"
                  stroke="currentColor"
                  strokeWidth="5"
                  className="text-slate-700"
                  fill="transparent"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="26"
                  stroke="currentColor"
                  strokeWidth="5"
                  className="text-emerald-400 transition-all duration-500"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 26}
                  strokeDashoffset={2 * Math.PI * 26 * (1 - goalPercent / 100)}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-xs font-mono font-bold text-slate-200">
                {goalPercent}%
              </span>
            </div>
            <div>
              <div className="text-xs text-slate-400">Today&apos;s Total Steps</div>
              <div className="text-2xl font-bold font-mono text-slate-100 tabular-nums">
                {pedometer.todaySteps.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Goal: {pedometer.profile.dailyStepGoal.toLocaleString()} steps
              </div>
            </div>
          </div>

          {/* Today Calories Burned */}
          <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-400">Total Calories Burned</div>
              <div className="text-2xl font-bold font-mono text-amber-400 tabular-nums">
                {pedometer.todayCaloriesKcal}{' '}
                <span className="text-xs font-normal text-slate-400">kcal</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Calibrated to {pedometer.profile.weightKg} kg body weight
              </div>
            </div>
          </div>

          {/* Today Distance */}
          <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-400">Total Walking Distance</div>
              <div className="text-2xl font-bold font-mono text-teal-300 tabular-nums">
                {pedometer.todayDistanceKm}{' '}
                <span className="text-xs font-normal text-slate-400">km</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Approx {(pedometer.todayDistanceKm * 0.621371).toFixed(2)} miles
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Active Workout Session Console */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div
              className={`w-3.5 h-3.5 rounded-full ${
                pedometer.isActive
                  ? pedometer.isPaused
                    ? 'bg-amber-400'
                    : 'bg-emerald-400 animate-pulse'
                  : 'bg-slate-600'
              }`}
            />
            <div>
              <h3 className="text-base font-semibold text-slate-100">
                {pedometer.isActive
                  ? pedometer.isPaused
                    ? 'Walk Session Paused'
                    : 'Active Walk Session'
                  : 'Walking Workout Session'}
              </h3>
              <p className="text-xs text-slate-400">
                {pedometer.isActive
                  ? 'Motion sensor active · Recording steps and energy expenditure'
                  : 'Start a session to record your walk time, distance, and calories'}
              </p>
            </div>
          </div>

          {/* Session Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {!pedometer.isActive ? (
              <button
                onClick={pedometer.startSession}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm rounded-xl transition-all shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Start Walk</span>
              </button>
            ) : (
              <>
                {pedometer.isPaused ? (
                  <button
                    onClick={pedometer.resumeSession}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs rounded-lg transition-all cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Resume</span>
                  </button>
                ) : (
                  <button
                    onClick={pedometer.pauseSession}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-lg transition-all cursor-pointer border border-slate-700"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pause</span>
                  </button>
                )}

                <button
                  onClick={handleFinish}
                  className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-lg transition-all cursor-pointer"
                  title="Finish and save to history"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Finish & Save</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Big Live Workout Telemetry Display */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          {/* Steps */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Session Steps</span>
              <Footprints className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-bold font-mono text-slate-100 tabular-nums">
              {pedometer.sessionSteps.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              cadence: {pedometer.currentCadence} spm
            </div>
          </div>

          {/* Calories */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Calories Burned</span>
              <Flame className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-bold font-mono text-amber-400 tabular-nums">
              {pedometer.caloriesKcal}
              <span className="text-sm font-normal text-slate-400 ml-1">kcal</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              ~{(pedometer.caloriesKcal / Math.max(1, pedometer.elapsedSeconds / 60)).toFixed(1)}{' '}
              kcal/min
            </div>
          </div>

          {/* Distance */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Distance</span>
              <Compass className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-3xl font-bold font-mono text-teal-300 tabular-nums">
              {pedometer.distanceKm}
              <span className="text-sm font-normal text-slate-400 ml-1">km</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {pedometer.distanceMiles} mi
            </div>
          </div>

          {/* Duration */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Active Time</span>
              <Clock className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-3xl font-bold font-mono text-indigo-300 tabular-nums">
              {formatSeconds(pedometer.elapsedSeconds)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              pace: {pedometer.paceMinPerKm > 0 ? `${pedometer.paceMinPerKm} min/km` : '--'}
            </div>
          </div>
        </div>

        {/* Hardware Motion Sensor & Treadmill Cadence Controls */}
        <div className="p-4 bg-slate-950/50 border border-slate-800/80 rounded-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-200">
                  Mobile Accelerometer Pedometer
                </div>
                <div className="text-[11px] text-slate-400">
                  {pedometer.sensorAvailable
                    ? 'Motion hardware connected · Pocket or hold phone while walking'
                    : 'Requires browser motion permission on mobile devices'}
                </div>
              </div>
            </div>

            {!pedometer.sensorPermissionGranted && (
              <button
                onClick={() => pedometer.requestSensorPermission()}
                className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors cursor-pointer border border-slate-700 shrink-0"
              >
                Enable Motion Sensor
              </button>
            )}
          </div>

          {/* Treadmill / Desk Cadence Simulator Mode */}
          <div className="pt-3 border-t border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
                <Gauge className="w-3.5 h-3.5 text-amber-400" />
                <span>Indoor Treadmill / Cadence Pace Mode</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Walk on a treadmill or indoor pad with automatic paced rhythm
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                {[
                  { label: 'Gentle (90 SPM)', speed: 90 },
                  { label: 'Brisk (115 SPM)', speed: 115 },
                  { label: 'Power (135 SPM)', speed: 135 },
                ].map((item) => (
                  <button
                    key={item.speed}
                    onClick={() => {
                      pedometer.setSimulationSpeed(item.speed);
                      if (!pedometer.isActive) pedometer.startSession();
                      pedometer.setIsSimulationActive(true);
                    }}
                    className={`px-2.5 py-1 text-[11px] rounded-lg font-medium transition-colors cursor-pointer ${
                      pedometer.isSimulationActive && pedometer.simulationSpeed === item.speed
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {pedometer.isSimulationActive && (
                <button
                  onClick={() => pedometer.setIsSimulationActive(false)}
                  className="px-2 py-1 text-[11px] text-rose-400 hover:bg-rose-500/10 rounded cursor-pointer"
                >
                  Stop Pace
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Manual Step Adder Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-base font-semibold text-slate-100">
              Log Offline Walk Steps
            </h3>
            <p className="text-xs text-slate-400">
              Add steps from an outdoor walk or smartband to keep your daily goal on track.
            </p>

            <div className="grid grid-cols-3 gap-2">
              {[500, 1000, 2500].map((count) => (
                <button
                  key={count}
                  onClick={() => setManualCount(count)}
                  className={`py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    manualCount === count
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  +{count}
                </button>
              ))}
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Custom Steps</label>
              <input
                type="number"
                value={manualCount}
                onChange={(e) => setManualCount(Math.max(1, parseInt(e.target.value, 10) || 0))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 font-mono text-sm focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowManualModal(false)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  pedometer.addManualSteps(manualCount);
                  setShowManualModal(false);
                }}
                className="px-4 py-2 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl cursor-pointer"
              >
                Add {manualCount.toLocaleString()} Steps
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fitness Profile Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveSettings}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-100">
                Pedometer & Energy Calibration
              </h3>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="text-slate-400 hover:text-slate-200 cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Calorie expenditure and distance are calibrated using your body weight and stride length.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">
                  Body Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formWeight}
                  onChange={(e) => setFormWeight(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 font-mono text-sm focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">
                  Daily Step Goal
                </label>
                <input
                  type="number"
                  step="500"
                  value={formGoal}
                  onChange={(e) => setFormGoal(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 font-mono text-sm focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">
                  Average Stride Length (meters)
                </label>
                <input
                  type="number"
                  step="0.02"
                  value={formStride}
                  onChange={(e) => setFormStride(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 font-mono text-sm focus:outline-none focus:border-emerald-400"
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Typical stride is ~0.70m - 0.78m for adults.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl cursor-pointer"
              >
                Save Settings
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
