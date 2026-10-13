import React, { useState, useEffect } from 'react';
import {
  CloudRain,
  Wind,
  Bird,
  Droplets,
  Flame,
  MoonStar,
  Waves,
  CloudLightning,
  Activity,
  Sparkles,
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCcw,
  Sliders,
  Shuffle,
  Clock,
} from 'lucide-react';
import {
  soundEngine,
  SOUND_CHANNELS,
  SOUND_PRESETS,
  SoundChannelConfig,
  SoundPreset,
} from '../audio/soundEngine';

interface SoundMixerProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  sleepTimerFormatted?: string;
  isSleepTimerRunning?: boolean;
  onOpenBedtime: () => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  CloudRain,
  Wind,
  Bird,
  Droplets,
  Flame,
  MoonStar,
  Waves,
  CloudLightning,
  Activity,
  Sparkles,
};

export const SoundMixer: React.FC<SoundMixerProps> = ({
  isPlaying,
  onTogglePlay,
  sleepTimerFormatted,
  isSleepTimerRunning,
  onOpenBedtime,
}) => {
  const [volumes, setVolumes] = useState<Record<string, number>>(() => soundEngine.getAllVolumes());
  const [masterVolume, setMasterVolume] = useState<number>(() => soundEngine.getMasterVolume());
  const [activePresetId, setActivePresetId] = useState<string | null>('rainy_woodland');

  // Pre-populate default preset faders on initial mount without playing audio
  useEffect(() => {
    const totalVol = Object.values(volumes).reduce((a, b) => a + b, 0);
    if (totalVol === 0 && SOUND_PRESETS.length > 0) {
      // Configure initial channel volume levels quietly without triggering playback
      soundEngine.applyPreset(SOUND_PRESETS[0]);
      setVolumes(soundEngine.getAllVolumes());
      setActivePresetId(SOUND_PRESETS[0].id);
    }
  }, []);

  const handleVolumeChange = (channelId: string, newVol: number) => {
    soundEngine.setChannelVolume(channelId, newVol);
    setVolumes((prev) => ({ ...prev, [channelId]: newVol }));
    setActivePresetId(null); // Custom blend
  };

  const handleMasterVolumeChange = (newVol: number) => {
    soundEngine.setMasterVolume(newVol);
    setMasterVolume(newVol);
  };

  const applyPreset = (preset: SoundPreset, startPlayback = false) => {
    soundEngine.applyPreset(preset);
    setVolumes(soundEngine.getAllVolumes());
    setActivePresetId(preset.id);
    if (startPlayback && !isPlaying) {
      onTogglePlay();
    }
  };

  const resetAllChannels = () => {
    for (const ch of SOUND_CHANNELS) {
      soundEngine.setChannelVolume(ch.id, 0);
    }
    setVolumes(soundEngine.getAllVolumes());
    setActivePresetId(null);
  };

  const randomBlend = () => {
    // Pick 2 to 4 random nature channels
    resetAllChannels();
    const shuffled = [...SOUND_CHANNELS].sort(() => Math.random() - 0.5);
    const chosenCount = 2 + Math.floor(Math.random() * 3);
    const selected = shuffled.slice(0, chosenCount);

    const newVols: Record<string, number> = {};
    for (const ch of SOUND_CHANNELS) {
      newVols[ch.id] = 0;
    }
    for (const ch of selected) {
      const vol = Math.round((0.3 + Math.random() * 0.45) * 100) / 100;
      soundEngine.setChannelVolume(ch.id, vol);
      newVols[ch.id] = vol;
    }
    setVolumes(newVols);
    setActivePresetId(null);
    if (!isPlaying) {
      onTogglePlay();
    }
  };

  const activeChannelCount = Object.values(volumes).filter((v) => v > 0.01).length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Soundscape Presets */}
      <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 md:p-6 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2 text-xs text-amber-400 font-medium tracking-wide">
              <span>Nature Audio Synthesizer</span>
              <span aria-hidden="true">·</span>
              <span>Procedural 100% Offline</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-100 mt-1">
              Ambient Soundscapes & Mixer
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-xl">
              Mix high-fidelity procedural sounds of rainfall, forest winds, crackling embers, and sleep tones.
            </p>
          </div>

          {/* Quick controls */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={randomBlend}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Generate a randomized calming soundscape blend"
            >
              <Shuffle className="w-3.5 h-3.5 text-amber-400" />
              <span>Surprise Blend</span>
            </button>
            <button
              onClick={resetAllChannels}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Silence all active channels"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Mute All</span>
            </button>
          </div>
        </div>

        {/* Curated Presets List */}
        <div>
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2.5">
            Curated Soundscapes
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {SOUND_PRESETS.map((preset) => {
              const isSelected = activePresetId === preset.id;
              const PresetIcon = ICON_MAP[preset.icon] || CloudRain;
              return (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset)}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/15 border border-amber-500/40 text-amber-200 shadow-sm'
                      : 'bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 text-slate-300'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-700/60 text-slate-400'
                    }`}
                  >
                    <PresetIcon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold truncate">{preset.name}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Master Control Deck & Live Audio Strip */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Play/Pause CTA */}
        <div className="flex items-center gap-4">
          <button
            onClick={onTogglePlay}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 ${
              isPlaying
                ? 'bg-amber-500 text-slate-950 shadow-amber-500/20 hover:bg-amber-400'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
            }`}
            aria-label={isPlaying ? 'Pause ambient sounds' : 'Play ambient sounds'}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current ml-0.5" />
            )}
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-100">
                {isPlaying ? 'Soundscape Active' : 'Soundscape Paused'}
              </span>
              <span className="text-xs text-slate-400">
                · {activeChannelCount} channel{activeChannelCount === 1 ? '' : 's'} active
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isPlaying
                ? 'Synthesizing live calming sound waves'
                : 'Tap play to start audio playback'}
            </p>
          </div>
        </div>

        {/* Master Volume & Bedtime Quick Access */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 min-w-[180px]">
            <button
              onClick={() => handleMasterVolumeChange(masterVolume > 0 ? 0 : 0.8)}
              className="text-slate-400 hover:text-slate-200 cursor-pointer"
              aria-label="Toggle master mute"
            >
              {masterVolume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <div className="flex-1 flex flex-col gap-1">
              <div className="flex justify-between text-[11px] text-slate-400 font-mono tabular-nums">
                <span>Master Volume</span>
                <span>{Math.round(masterVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={masterVolume}
                onChange={(e) => handleMasterVolumeChange(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>
          </div>

          {/* Bedtime / Sleep Timer Status */}
          <div className="hidden md:flex items-center gap-2 pl-4 border-l border-slate-800">
            <button
              onClick={onOpenBedtime}
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 hover:text-amber-300 bg-slate-800/80 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {isSleepTimerRunning ? `Timer: ${sleepTimerFormatted}` : 'Sleep Timer & Clock'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Multi-Channel Fader Grid */}
      <section>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
            <Sliders className="w-4 h-4 text-amber-400" />
            <span>Channel Faders</span>
          </div>
          <span className="text-xs text-slate-500">Slide to adjust individual volumes</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {SOUND_CHANNELS.map((channel: SoundChannelConfig) => {
            const currentVol = volumes[channel.id] || 0;
            const isActive = currentVol > 0.01;
            const IconComponent = ICON_MAP[channel.icon] || CloudRain;

            return (
              <div
                key={channel.id}
                className={`p-4 rounded-xl border transition-all ${
                  isActive
                    ? 'bg-slate-900 border-slate-700/80 shadow-md'
                    : 'bg-slate-900/50 border-slate-800/60 hover:border-slate-700/60'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() =>
                        handleVolumeChange(channel.id, isActive ? 0 : channel.defaultVolume)
                      }
                      className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                        isActive
                          ? 'shadow-sm'
                          : 'bg-slate-800/70 text-slate-500 hover:text-slate-300'
                      }`}
                      style={{
                        backgroundColor: isActive ? `${channel.color}25` : undefined,
                        color: isActive ? channel.color : undefined,
                      }}
                      title={isActive ? `Mute ${channel.name}` : `Activate ${channel.name}`}
                    >
                      <IconComponent className="w-4 h-4" />
                    </button>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-200 truncate">
                        {channel.name}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {channel.description}
                      </div>
                    </div>
                  </div>

                  {/* Volume % value */}
                  <span
                    className={`text-xs font-mono tabular-nums shrink-0 ${
                      isActive ? 'text-amber-400 font-semibold' : 'text-slate-600'
                    }`}
                  >
                    {Math.round(currentVol * 100)}%
                  </span>
                </div>

                {/* Volume Slider Control */}
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={currentVol}
                    onChange={(e) => handleVolumeChange(channel.id, parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    style={{
                      accentColor: isActive ? channel.color : '#64748b',
                    }}
                    aria-label={`${channel.name} volume fader`}
                  />
                  <button
                    onClick={() =>
                      handleVolumeChange(channel.id, isActive ? 0 : channel.defaultVolume)
                    }
                    className={`text-[11px] font-medium px-2 py-1 rounded transition-colors cursor-pointer shrink-0 ${
                      isActive
                        ? 'text-slate-400 hover:text-slate-200 bg-slate-800'
                        : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {isActive ? 'Mute' : 'Turn On'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
