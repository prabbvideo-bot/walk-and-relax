/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  CloudRain,
  Footprints,
  Moon,
  History,
  Play,
  Pause,
  Clock,
  Volume2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { soundEngine } from './audio/soundEngine';
import { usePedometer } from './hooks/usePedometer';
import { useSleepTimer } from './hooks/useSleepTimer';
import { SoundMixer } from './components/SoundMixer';
import { WalkTracker } from './components/WalkTracker';
import { BedtimeClock } from './components/BedtimeClock';
import { WalkHistory } from './components/WalkHistory';
import { WalkSession } from './types';

type ActiveTab = 'mixer' | 'pedometer' | 'bedtime' | 'history';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('mixer');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sleep timer hook
  const sleepTimer = useSleepTimer(() => {
    setIsPlaying(false);
    showToast('Bedtime sleep timer completed. Audio stopped.');
  });

  // Pedometer hook
  const pedometer = usePedometer();

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    const timer = window.setTimeout(() => setToastMessage(null), 4000);
    return () => window.clearTimeout(timer);
  }, []);

  const handleTogglePlay = useCallback(() => {
    const nextState = !isPlaying;
    soundEngine.setMasterPlaying(nextState);
    setIsPlaying(nextState);
  }, [isPlaying]);

  const handleWalkFinished = (session: WalkSession) => {
    showToast(
      `Walk saved! ${session.steps.toLocaleString()} steps · ${session.caloriesKcal} kcal burned.`
    );
  };

  // Cleanup audio on window unload
  useEffect(() => {
    return () => {
      soundEngine.destroy();
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/20 selection:text-amber-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 border border-slate-700 text-slate-100 text-xs px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation Bar: Conforming strictly to 3-zone Top Bar Contract */}
      <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single text wordmark */}
          <button
            onClick={() => setActiveTab('mixer')}
            className="text-lg font-bold tracking-tight text-slate-100 hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
            <span>Walk&amp;Relax</span>
          </button>

          {/* Zone 2: 4 single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <button
              onClick={() => setActiveTab('mixer')}
              className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 cursor-pointer ${
                activeTab === 'mixer'
                  ? 'border-amber-400 text-slate-100 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Ambient Sounds
            </button>
            <button
              onClick={() => setActiveTab('pedometer')}
              className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 cursor-pointer ${
                activeTab === 'pedometer'
                  ? 'border-amber-400 text-slate-100 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Walking &amp; Calories
            </button>
            <button
              onClick={() => setActiveTab('bedtime')}
              className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 cursor-pointer ${
                activeTab === 'bedtime'
                  ? 'border-amber-400 text-slate-100 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Bedtime Clock
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 cursor-pointer ${
                activeTab === 'history'
                  ? 'border-amber-400 text-slate-100 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Activity Log
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            {sleepTimer.isRunning && (
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-amber-400 font-mono tabular-nums bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                <Clock className="w-3.5 h-3.5" />
                <span>{sleepTimer.formatRemaining(sleepTimer.remainingSeconds)}</span>
              </div>
            )}

            <button
              onClick={handleTogglePlay}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-95 ${
                isPlaying
                  ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span className="whitespace-nowrap">Pause Audio</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  <span className="whitespace-nowrap">Play Audio</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-12">
        {activeTab === 'mixer' && (
          <SoundMixer
            isPlaying={isPlaying}
            onTogglePlay={handleTogglePlay}
            sleepTimerFormatted={sleepTimer.formatRemaining(sleepTimer.remainingSeconds)}
            isSleepTimerRunning={sleepTimer.isRunning}
            onOpenBedtime={() => setActiveTab('bedtime')}
          />
        )}

        {activeTab === 'pedometer' && (
          <WalkTracker
            pedometer={pedometer}
            onWalkFinishedNotification={handleWalkFinished}
          />
        )}

        {activeTab === 'bedtime' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2">
              <button
                onClick={() => setActiveTab('mixer')}
                className="text-xs text-neutral-400 hover:text-neutral-200 flex items-center gap-1.5 py-1 px-3 bg-neutral-900 border border-neutral-800 rounded-lg cursor-pointer transition-colors"
              >
                <span>← Back to Dashboard</span>
              </button>
              <span className="text-xs text-neutral-500">
                Ultra-dim nightstand clock with audio fade
              </span>
            </div>

            <BedtimeClock
              sleepTimer={sleepTimer}
              isPlaying={isPlaying}
              onTogglePlay={handleTogglePlay}
              onExitFullscreenBedtime={() => setActiveTab('mixer')}
            />
          </div>
        )}

        {activeTab === 'history' && (
          <WalkHistory
            sessions={pedometer.sessions}
            profile={pedometer.profile}
            todaySteps={pedometer.todaySteps}
            todayCalories={pedometer.todayCaloriesKcal}
            todayDistanceKm={pedometer.todayDistanceKm}
            onClearHistory={pedometer.clearHistory}
          />
        )}
      </main>

      {/* Mobile Fixed Bottom Navigation Bar (Pattern 1 from Mobile Reference) */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800"
      >
        <div className="grid grid-cols-4 items-center h-16 max-w-md mx-auto">
          <button
            onClick={() => setActiveTab('mixer')}
            className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center cursor-pointer transition-colors ${
              activeTab === 'mixer' ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CloudRain className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-tight mt-1">Sounds</span>
          </button>

          <button
            onClick={() => setActiveTab('pedometer')}
            className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center cursor-pointer transition-colors ${
              activeTab === 'pedometer' ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Footprints className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-tight mt-1">Pedometer</span>
          </button>

          <button
            onClick={() => setActiveTab('bedtime')}
            className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center cursor-pointer transition-colors ${
              activeTab === 'bedtime' ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Moon className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-tight mt-1">Bedtime</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center cursor-pointer transition-colors ${
              activeTab === 'history' ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-tight mt-1">History</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
