import React, { useState, useEffect } from 'react';
import {
  Moon,
  Clock,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Sun,
  Maximize2,
  Minimize2,
  Sparkles,
  Wind,
  Plus,
  Check,
} from 'lucide-react';
import { useSleepTimer } from '../hooks/useSleepTimer';

interface BedtimeClockProps {
  sleepTimer: ReturnType<typeof useSleepTimer>;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onExitFullscreenBedtime?: () => void;
}

export const BedtimeClock: React.FC<BedtimeClockProps> = ({
  sleepTimer,
  isPlaying,
  onTogglePlay,
  onExitFullscreenBedtime,
}) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [brightness, setBrightness] = useState<number>(0.65); // 0.15 to 1.0
  const [colorTheme, setColorTheme] = useState<'amber' | 'moonlight' | 'emerald'>('amber');
  const [showBreathing, setShowBreathing] = useState<boolean>(false);
  const [breathingPhase, setBreathingPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');
  const [customMinutes, setCustomMinutes] = useState<number>(45);
  const [controlsVisible, setControlsVisible] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Live wall clock
  useEffect(() => {
    const clockTimer = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => window.clearInterval(clockTimer);
  }, []);

  // 4-7-8 Breathing guide cycle
  useEffect(() => {
    if (!showBreathing) return;

    let timeoutId: number;
    const runCycle = () => {
      setBreathingPhase('Inhale');
      timeoutId = window.setTimeout(() => {
        setBreathingPhase('Hold');
        timeoutId = window.setTimeout(() => {
          setBreathingPhase('Exhale');
          timeoutId = window.setTimeout(runCycle, 8000);
        }, 7000);
      }, 4000);
    };

    runCycle();
    return () => window.clearTimeout(timeoutId);
  }, [showBreathing]);

  // Auto-hide controls after 6 seconds of inactivity
  useEffect(() => {
    if (!controlsVisible) return;
    const hideTimeout = window.setTimeout(() => {
      setControlsVisible(false);
    }, 6000);

    return () => window.clearTimeout(hideTimeout);
  }, [controlsVisible]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const hoursStr = currentTime.getHours().toString().padStart(2, '0');
  const minutesStr = currentTime.getMinutes().toString().padStart(2, '0');
  const secondsStr = currentTime.getSeconds().toString().padStart(2, '0');

  // Color styles
  const colorMap = {
    amber: {
      text: 'text-amber-400',
      glow: 'shadow-amber-500/10',
      bgGlow: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      accent: '#f59e0b',
    },
    moonlight: {
      text: 'text-indigo-300',
      glow: 'shadow-indigo-500/10',
      bgGlow: 'bg-indigo-500/10',
      border: 'border-indigo-500/30',
      accent: '#818cf8',
    },
    emerald: {
      text: 'text-emerald-300',
      glow: 'shadow-emerald-500/10',
      bgGlow: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      accent: '#34d399',
    },
  };

  const activeTheme = colorMap[colorTheme];

  return (
    <div
      onClick={() => setControlsVisible(true)}
      style={{
        backgroundColor: '#000000',
        opacity: Math.max(0.2, brightness),
      }}
      className="min-h-[82vh] rounded-3xl border border-neutral-900 flex flex-col justify-between p-6 md:p-10 transition-opacity duration-300 select-none relative overflow-hidden"
    >
      {/* Top Header Bar (Fades out when dormant) */}
      <div
        className={`flex items-center justify-between transition-opacity duration-500 z-10 ${
          controlsVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center text-amber-400">
            <Moon className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-neutral-300">
              OLED Bedtime Sanctuary
            </div>
            <div className="text-[11px] text-neutral-400">
              Zero-blue light · Smooth audio fade sleep timer
            </div>
          </div>
        </div>

        {/* Quick controls: theme, fullscreen, exit */}
        <div className="flex items-center gap-2">
          {/* Tone picker */}
          <div className="flex items-center gap-1 bg-neutral-900/90 rounded-lg p-1 border border-neutral-800">
            {(['amber', 'moonlight', 'emerald'] as const).map((tone) => (
              <button
                key={tone}
                onClick={(e) => {
                  e.stopPropagation();
                  setColorTheme(tone);
                }}
                className={`w-5 h-5 rounded-md text-[10px] uppercase font-bold flex items-center justify-center cursor-pointer transition-colors ${
                  colorTheme === tone ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-500'
                }`}
                title={`${tone} hue`}
              >
                {tone[0]}
              </button>
            ))}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFullscreen();
            }}
            className="p-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 rounded-lg cursor-pointer transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Main Center Clock & Sleep Timer */}
      <div className="my-auto text-center flex flex-col items-center justify-center py-6">
        {/* OLED Giant Digits */}
        <div className="relative inline-block">
          <div
            className={`font-mono text-7xl sm:text-8xl md:text-9xl font-bold tracking-tight ${activeTheme.text} transition-colors drop-shadow-md`}
          >
            <span>{hoursStr}</span>
            <span className="opacity-70 animate-pulse">:</span>
            <span>{minutesStr}</span>
          </div>

          <div className="text-xs sm:text-sm font-mono text-neutral-400 tracking-widest uppercase mt-2">
            <span>{secondsStr}s</span>
            <span className="mx-2">·</span>
            <span>
              {currentTime.toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>

        {/* Sleep Timer Countdown Display */}
        <div className="mt-8 flex flex-col items-center">
          {sleepTimer.isRunning ? (
            <div className="space-y-2">
              <div
                className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-neutral-950 border ${activeTheme.border}`}
              >
                <Clock className={`w-4 h-4 ${activeTheme.text}`} />
                <span className="text-sm font-mono font-medium text-neutral-200">
                  Audio stopping in:{' '}
                  <span className={`font-bold ${activeTheme.text}`}>
                    {sleepTimer.formatRemaining(sleepTimer.remainingSeconds)}
                  </span>
                </span>
                {sleepTimer.isFading && (
                  <span className="text-[11px] text-amber-400 font-semibold animate-pulse">
                    (Audio fading out...)
                  </span>
                )}
              </div>

              {controlsVisible && (
                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      sleepTimer.extendTimer(15);
                    }}
                    className="px-3 py-1 text-xs text-neutral-400 hover:text-neutral-200 bg-neutral-900 rounded-lg cursor-pointer transition-colors"
                  >
                    +15 min
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      sleepTimer.cancelTimer();
                    }}
                    className="px-3 py-1 text-xs text-rose-400 hover:text-rose-300 bg-neutral-900 rounded-lg cursor-pointer transition-colors"
                  >
                    Stop Timer
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div
              className={`transition-opacity duration-300 ${
                controlsVisible ? 'opacity-100' : 'opacity-20'
              }`}
            >
              <span className="text-xs text-neutral-400">
                Sleep timer inactive · Select bedtime duration below
              </span>
            </div>
          )}
        </div>

        {/* Breathing relaxation exercise (Optional) */}
        {showBreathing && (
          <div className="mt-6 flex flex-col items-center">
            <div
              className={`w-28 h-28 rounded-full border-2 ${activeTheme.border} ${activeTheme.bgGlow} flex items-center justify-center transition-all duration-1000 ${
                breathingPhase === 'Inhale'
                  ? 'scale-125'
                  : breathingPhase === 'Hold'
                  ? 'scale-125 opacity-90'
                  : 'scale-90 opacity-40'
              }`}
            >
              <span className={`text-xs font-semibold ${activeTheme.text}`}>
                {breathingPhase}
              </span>
            </div>
            <span className="text-[11px] text-neutral-400 mt-2">
              4-7-8 relaxing bedtime breath
            </span>
          </div>
        )}
      </div>

      {/* Bottom Deck: Timer Preset Buttons, Brightness Slider, Sound Toggle */}
      <div
        className={`space-y-4 transition-opacity duration-500 z-10 ${
          controlsVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Timer Duration Selection Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-950/80 border border-neutral-900 p-3.5 rounded-2xl">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-neutral-400" />
            <span className="text-xs font-semibold text-neutral-300">Set Sleep Timer:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {[15, 30, 45, 60, 90].map((mins) => (
              <button
                key={mins}
                onClick={(e) => {
                  e.stopPropagation();
                  sleepTimer.startTimer(mins);
                  if (!isPlaying) onTogglePlay();
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                  sleepTimer.isRunning && Math.round(sleepTimer.totalSeconds / 60) === mins
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-850 hover:text-white'
                }`}
              >
                {mins}m
              </button>
            ))}

            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowBreathing(!showBreathing);
              }}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                showBreathing
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Wind className="w-3.5 h-3.5" />
              <span>Breathing Guide</span>
            </button>
          </div>
        </div>

        {/* Ambient Play/Pause & OLED Screen Brightness Dimmer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
          {/* Master Sound Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTogglePlay();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-850 text-neutral-200 rounded-xl text-xs font-medium cursor-pointer transition-colors border border-neutral-800"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 text-amber-400 fill-current" />
                <span>Pause Ambient Audio</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-amber-400 fill-current ml-0.5" />
                <span>Resume Ambient Audio</span>
              </>
            )}
          </button>

          {/* Dimmer Slider */}
          <div className="flex items-center gap-3 min-w-[200px]">
            <Sun className="w-4 h-4 text-neutral-400 shrink-0" />
            <div className="flex-1">
              <div className="flex justify-between text-[11px] text-neutral-400 font-mono">
                <span>Display Dimmer</span>
                <span>{Math.round(brightness * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.15"
                max="1.0"
                step="0.05"
                value={brightness}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => setBrightness(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>
          </div>
        </div>

        <div className="text-center">
          <span className="text-[11px] text-neutral-400">
            Tap screen anywhere to toggle sleep controls · Screen auto-dims after 6s
          </span>
        </div>
      </div>
    </div>
  );
};
