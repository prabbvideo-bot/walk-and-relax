import React from 'react';
import {
  History,
  Footprints,
  Flame,
  Clock,
  Compass,
  Trash2,
  Calendar,
  Award,
} from 'lucide-react';
import { WalkSession, UserFitnessProfile } from '../types';

interface WalkHistoryProps {
  sessions: WalkSession[];
  profile: UserFitnessProfile;
  todaySteps: number;
  todayCalories: number;
  todayDistanceKm: number;
  onClearHistory: () => void;
}

export const WalkHistory: React.FC<WalkHistoryProps> = ({
  sessions,
  profile,
  todaySteps,
  todayCalories,
  todayDistanceKm,
  onClearHistory,
}) => {
  const totalLifetimeSteps = sessions.reduce((acc, s) => acc + s.steps, 0) + todaySteps;
  const totalLifetimeCalories = sessions.reduce((acc, s) => acc + s.caloriesKcal, 0) + todayCalories;
  const totalLifetimeDistanceKm = Number(
    (sessions.reduce((acc, s) => acc + s.distanceKm, 0) + todayDistanceKm).toFixed(2)
  );

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}m ${s.toString().padStart(2, '0')}s`;
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Overview Metric Banner */}
      <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 md:p-6 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2 text-xs text-indigo-400 font-medium tracking-wide">
              <span>Lifetime Walk Record</span>
              <span aria-hidden="true">·</span>
              <span>Local Storage Encrypted</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-100 mt-1">
              Activity History & Achievements
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-xl">
              Review your walking logs, calorie burn milestones, and cadence records.
            </p>
          </div>

          {sessions.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to clear your walk history?')) {
                  onClearHistory();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          )}
        </div>

        {/* Lifetime Totals Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800/80">
          <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-400 mb-1">Cumulative Steps</div>
            <div className="text-2xl font-bold font-mono text-slate-100 tabular-nums">
              {totalLifetimeSteps.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {sessions.length} recorded session{sessions.length === 1 ? '' : 's'}
            </div>
          </div>

          <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-400 mb-1">Total Calories Burned</div>
            <div className="text-2xl font-bold font-mono text-amber-400 tabular-nums">
              {totalLifetimeCalories.toLocaleString()}{' '}
              <span className="text-xs font-normal text-slate-400">kcal</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Energy burned while listening
            </div>
          </div>

          <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-400 mb-1">Total Distance Walked</div>
            <div className="text-2xl font-bold font-mono text-teal-300 tabular-nums">
              {totalLifetimeDistanceKm}{' '}
              <span className="text-xs font-normal text-slate-400">km</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              ~{(totalLifetimeDistanceKm * 0.621371).toFixed(1)} miles
            </div>
          </div>
        </div>
      </section>

      {/* Session History List */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-400" />
            <h3 className="text-base font-semibold text-slate-100">Saved Walking Sessions</h3>
          </div>
          <span className="text-xs text-slate-400">
            {sessions.length === 0 ? 'No past sessions' : `${sessions.length} session logs`}
          </span>
        </div>

        {sessions.length === 0 ? (
          <div className="text-center py-12 px-4 border border-dashed border-slate-800 rounded-xl">
            <Footprints className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-slate-300">No walk sessions saved yet</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Start a walk session on the Pedometer tab and tap &ldquo;Finish & Save&rdquo; to log your workout here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/70">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/30 px-3 rounded-xl transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>{formatDate(session.startTime)}</span>
                    <span aria-hidden="true">·</span>
                    <span>Duration: {formatDuration(session.durationSeconds)}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="text-lg font-bold font-mono text-slate-100 tabular-nums">
                      {session.steps.toLocaleString()}{' '}
                      <span className="text-xs font-normal text-slate-400">steps</span>
                    </div>
                    <div className="text-sm font-mono text-amber-400 tabular-nums">
                      {session.caloriesKcal} kcal
                    </div>
                    <div className="text-sm font-mono text-teal-300 tabular-nums">
                      {session.distanceKm} km
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono text-slate-400 shrink-0">
                  {session.avgCadence > 0 && (
                    <div>
                      <span className="text-slate-500">Cadence: </span>
                      <span className="text-slate-300">{session.avgCadence} spm</span>
                    </div>
                  )}
                  {session.paceMinPerKm > 0 && (
                    <div>
                      <span className="text-slate-500">Pace: </span>
                      <span className="text-slate-300">{session.paceMinPerKm} min/km</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
