/**
 * Procedural Web Audio API Sound Engine
 * Synthesizes high-fidelity nature and ambient sounds 100% offline without external audio files.
 */

export interface SoundChannelConfig {
  id: string;
  name: string;
  category: 'nature' | 'water' | 'focus' | 'sleep';
  icon: string;
  description: string;
  defaultVolume: number;
  color: string;
}

export const SOUND_CHANNELS: SoundChannelConfig[] = [
  {
    id: 'rain',
    name: 'Gentle Rain',
    category: 'nature',
    icon: 'CloudRain',
    description: 'Steady soothing rainfall with soft droplet textures',
    defaultVolume: 0.65,
    color: '#38bdf8', // sky-400
  },
  {
    id: 'forest_wind',
    name: 'Forest Wind',
    category: 'nature',
    icon: 'Wind',
    description: 'Breezy canopy murmurs and rustling trees',
    defaultVolume: 0.5,
    color: '#34d399', // emerald-400
  },
  {
    id: 'birds',
    name: 'Forest Birds',
    category: 'nature',
    icon: 'Bird',
    description: 'Soft woodland bird calls and distant chirps',
    defaultVolume: 0.4,
    color: '#a3e635', // lime-400
  },
  {
    id: 'stream',
    name: 'Mountain Stream',
    category: 'water',
    icon: 'Droplets',
    description: 'Babbling brook flowing over smooth river stones',
    defaultVolume: 0.55,
    color: '#2dd4bf', // teal-400
  },
  {
    id: 'campfire',
    name: 'Night Campfire',
    category: 'nature',
    icon: 'Flame',
    description: 'Warm glowing hearth with gentle ember crackles',
    defaultVolume: 0.45,
    color: '#f97316', // orange-500
  },
  {
    id: 'crickets',
    name: 'Summer Crickets',
    category: 'sleep',
    icon: 'MoonStar',
    description: 'Peaceful twilight cicadas and cricket chorus',
    defaultVolume: 0.35,
    color: '#818cf8', // indigo-400
  },
  {
    id: 'ocean',
    name: 'Ocean Waves',
    category: 'water',
    icon: 'Waves',
    description: 'Rhythmic rolling swells meeting the sandy shoreline',
    defaultVolume: 0.5,
    color: '#06b6d4', // cyan-500
  },
  {
    id: 'thunder',
    name: 'Distant Thunder',
    category: 'nature',
    icon: 'CloudLightning',
    description: 'Deep resonant low rumble across the horizon',
    defaultVolume: 0.3,
    color: '#fbbf24', // amber-400
  },
  {
    id: 'brown_noise',
    name: 'Deep Brown Noise',
    category: 'focus',
    icon: 'Activity',
    description: 'Warm low-frequency masking noise for deep sleep',
    defaultVolume: 0.4,
    color: '#d97706', // amber-600
  },
  {
    id: 'delta_sleep',
    name: '432Hz Delta Sleep',
    category: 'sleep',
    icon: 'Sparkles',
    description: 'Harmonic 432Hz sleep resonance with 2.5Hz delta pulse',
    defaultVolume: 0.3,
    color: '#c084fc', // purple-400
  },
];

export interface SoundPreset {
  id: string;
  name: string;
  icon: string;
  volumes: Record<string, number>;
}

export const SOUND_PRESETS: SoundPreset[] = [
  {
    id: 'rainy_woodland',
    name: 'Rainy Woodland',
    icon: 'CloudRain',
    volumes: {
      rain: 0.7,
      forest_wind: 0.45,
      birds: 0.25,
      thunder: 0.25,
    },
  },
  {
    id: 'midnight_camp',
    name: 'Midnight Campfire',
    icon: 'Flame',
    volumes: {
      campfire: 0.7,
      crickets: 0.5,
      forest_wind: 0.3,
    },
  },
  {
    id: 'river_hike',
    name: 'Alpine River Walk',
    icon: 'Droplets',
    volumes: {
      stream: 0.65,
      birds: 0.4,
      forest_wind: 0.35,
    },
  },
  {
    id: 'coastal_breeze',
    name: 'Coastal Twilight',
    icon: 'Waves',
    volumes: {
      ocean: 0.7,
      forest_wind: 0.4,
      crickets: 0.2,
    },
  },
  {
    id: 'deep_delta_sleep',
    name: 'Deep Delta Sleep',
    icon: 'MoonStar',
    volumes: {
      delta_sleep: 0.55,
      brown_noise: 0.4,
      rain: 0.3,
    },
  },
];

interface ChannelNodes {
  gainNode: GainNode;
  cleanup: () => void;
}

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeChannels: Map<string, ChannelNodes> = new Map();
  private noiseBuffers: Map<string, AudioBuffer> = new Map();
  private isMasterPlaying: boolean = false;
  private channelVolumes: Record<string, number> = {};
  private currentMasterVolume: number = 0.8;
  private fadeIntervalId: number | null = null;

  constructor() {
    // Initialize default volumes
    for (const ch of SOUND_CHANNELS) {
      this.channelVolumes[ch.id] = 0; // muted by default until activated or preset loaded
    }
  }

  private initContext(): AudioContext {
    if (!this.ctx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.currentMasterVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    return this.ctx;
  }

  // Pre-generate looping noise buffers (5 seconds each)
  private getNoiseBuffer(type: 'white' | 'pink' | 'brown'): AudioBuffer {
    if (this.noiseBuffers.has(type)) {
      return this.noiseBuffers.get(type)!;
    }

    const ctx = this.initContext();
    const bufferSize = ctx.sampleRate * 5;
    const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    if (type === 'white') {
      for (let i = 0; i < bufferSize; i++) {
        left[i] = Math.random() * 2 - 1;
        right[i] = Math.random() * 2 - 1;
      }
    } else if (type === 'pink') {
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      let rb0 = 0, rb1 = 0, rb2 = 0, rb3 = 0, rb4 = 0, rb5 = 0, rb6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const whiteL = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + whiteL * 0.0555179;
        b1 = 0.99332 * b1 + whiteL * 0.0750759;
        b2 = 0.96900 * b2 + whiteL * 0.1538520;
        b3 = 0.86650 * b3 + whiteL * 0.3104856;
        b4 = 0.55000 * b4 + whiteL * 0.5329522;
        b5 = -0.7616 * b5 - whiteL * 0.0168980;
        left[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + whiteL * 0.5362) * 0.11;
        b6 = whiteL * 0.115926;

        const whiteR = Math.random() * 2 - 1;
        rb0 = 0.99886 * rb0 + whiteR * 0.0555179;
        rb1 = 0.99332 * rb1 + whiteR * 0.0750759;
        rb2 = 0.96900 * rb2 + whiteR * 0.1538520;
        rb3 = 0.86650 * rb3 + whiteR * 0.3104856;
        rb4 = 0.55000 * rb4 + whiteR * 0.5329522;
        rb5 = -0.7616 * rb5 - whiteR * 0.0168980;
        right[i] = (rb0 + rb1 + rb2 + rb3 + rb4 + rb5 + rb6 + whiteR * 0.5362) * 0.11;
        rb6 = whiteR * 0.115926;
      }
    } else {
      // Brown noise
      let lastOutL = 0;
      let lastOutR = 0;
      for (let i = 0; i < bufferSize; i++) {
        const whiteL = Math.random() * 2 - 1;
        lastOutL = (lastOutL + 0.02 * whiteL) / 1.02;
        left[i] = lastOutL * 3.5;

        const whiteR = Math.random() * 2 - 1;
        lastOutR = (lastOutR + 0.02 * whiteR) / 1.02;
        right[i] = lastOutR * 3.5;
      }
    }

    this.noiseBuffers.set(type, buffer);
    return buffer;
  }

  // Build procedural node graph for individual channel
  private createChannelGraph(channelId: string, gainNode: GainNode): () => void {
    const ctx = this.initContext();
    const disposers: (() => void)[] = [];

    switch (channelId) {
      case 'rain': {
        // Continuous rain bed (filtered pink noise)
        const pinkSrc = ctx.createBufferSource();
        pinkSrc.buffer = this.getNoiseBuffer('pink');
        pinkSrc.loop = true;

        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 400;

        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 2800;

        pinkSrc.connect(hp).connect(lp).connect(gainNode);
        pinkSrc.start();
        disposers.push(() => {
          try { pinkSrc.stop(); } catch { /* ignore */ }
          pinkSrc.disconnect();
        });

        // Procedural soft droplet clicks
        const dropletInterval = window.setInterval(() => {
          if (!this.isMasterPlaying || (this.channelVolumes['rain'] || 0) <= 0.01) return;
          try {
            const osc = ctx.createOscillator();
            const dropGain = ctx.createGain();
            const now = ctx.currentTime;
            osc.frequency.setValueAtTime(1400 + Math.random() * 1800, now);
            osc.frequency.exponentialRampToValueAtTime(700 + Math.random() * 400, now + 0.06);

            dropGain.gain.setValueAtTime(0.08 + Math.random() * 0.08, now);
            dropGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

            osc.connect(dropGain).connect(gainNode);
            osc.start(now);
            osc.stop(now + 0.07);
          } catch { /* ignore */ }
        }, 180);

        disposers.push(() => window.clearInterval(dropletInterval));
        break;
      }

      case 'forest_wind': {
        // Brown noise with slow LFO resonant swell
        const brownSrc = ctx.createBufferSource();
        brownSrc.buffer = this.getNoiseBuffer('brown');
        brownSrc.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 320;
        filter.Q.value = 2.0;

        // LFO for wind gust sweeping
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 0.12; // slow swell every 8s
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 220; // sweeps cutoff +/- 220Hz

        lfo.connect(lfoGain).connect(filter.frequency);
        brownSrc.connect(filter).connect(gainNode);

        brownSrc.start();
        lfo.start();

        disposers.push(() => {
          try {
            brownSrc.stop();
            lfo.stop();
          } catch { /* ignore */ }
          brownSrc.disconnect();
          lfo.disconnect();
        });
        break;
      }

      case 'birds': {
        // Periodic gentle forest bird songs with randomized pitch sweeps
        const birdTimer = window.setInterval(() => {
          if (!this.isMasterPlaying || (this.channelVolumes['birds'] || 0) <= 0.01) return;
          if (Math.random() > 0.45) return; // natural pauses

          try {
            const now = ctx.currentTime;
            const chirpCount = 1 + Math.floor(Math.random() * 3);
            let timeOffset = 0;

            for (let i = 0; i < chirpCount; i++) {
              const osc = ctx.createOscillator();
              const bGain = ctx.createGain();
              const baseFreq = 2200 + Math.random() * 1200;
              const startTime = now + timeOffset;
              const dur = 0.09 + Math.random() * 0.06;

              osc.type = 'sine';
              osc.frequency.setValueAtTime(baseFreq, startTime);
              osc.frequency.linearRampToValueAtTime(baseFreq + 600 + Math.random() * 800, startTime + dur * 0.5);
              osc.frequency.linearRampToValueAtTime(baseFreq - 300, startTime + dur);

              bGain.gain.setValueAtTime(0.0001, startTime);
              bGain.gain.linearRampToValueAtTime(0.12 + Math.random() * 0.08, startTime + dur * 0.3);
              bGain.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);

              osc.connect(bGain).connect(gainNode);
              osc.start(startTime);
              osc.stop(startTime + dur + 0.02);

              timeOffset += dur + 0.08 + Math.random() * 0.12;
            }
          } catch { /* ignore */ }
        }, 2400);

        disposers.push(() => window.clearInterval(birdTimer));
        break;
      }

      case 'stream': {
        // Continuous water bed with modulated high mid ripples
        const pinkSrc = ctx.createBufferSource();
        pinkSrc.buffer = this.getNoiseBuffer('pink');
        pinkSrc.loop = true;

        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 1100;
        bp.Q.value = 1.2;

        const lfo1 = ctx.createOscillator();
        lfo1.frequency.value = 0.4;
        const lfo1Gain = ctx.createGain();
        lfo1Gain.gain.value = 350;

        lfo1.connect(lfo1Gain).connect(bp.frequency);
        pinkSrc.connect(bp).connect(gainNode);

        pinkSrc.start();
        lfo1.start();

        disposers.push(() => {
          try {
            pinkSrc.stop();
            lfo1.stop();
          } catch { /* ignore */ }
          pinkSrc.disconnect();
          lfo1.disconnect();
        });
        break;
      }

      case 'campfire': {
        // Warm low bed
        const brownSrc = ctx.createBufferSource();
        brownSrc.buffer = this.getNoiseBuffer('brown');
        brownSrc.loop = true;

        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 180;
        brownSrc.connect(lp).connect(gainNode);
        brownSrc.start();

        disposers.push(() => {
          try { brownSrc.stop(); } catch { /* ignore */ }
          brownSrc.disconnect();
        });

        // Sharp crackles and pops
        const crackleTimer = window.setInterval(() => {
          if (!this.isMasterPlaying || (this.channelVolumes['campfire'] || 0) <= 0.01) return;
          try {
            const count = 1 + Math.floor(Math.random() * 2);
            for (let i = 0; i < count; i++) {
              const now = ctx.currentTime + Math.random() * 0.05;
              const osc = ctx.createOscillator();
              const cGain = ctx.createGain();
              osc.type = 'triangle';
              osc.frequency.setValueAtTime(600 + Math.random() * 1600, now);

              cGain.gain.setValueAtTime(0.18 + Math.random() * 0.15, now);
              cGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.02 + Math.random() * 0.03);

              osc.connect(cGain).connect(gainNode);
              osc.start(now);
              osc.stop(now + 0.06);
            }
          } catch { /* ignore */ }
        }, 220);

        disposers.push(() => window.clearInterval(crackleTimer));
        break;
      }

      case 'crickets': {
        // High frequency pulsed rhythmic buzzing (summer night)
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 4600;

        const tremolo = ctx.createOscillator();
        tremolo.frequency.value = 18; // 18Hz cricket pulse
        const tremoloGain = ctx.createGain();
        tremoloGain.gain.value = 0.5;

        const cricketGain = ctx.createGain();
        cricketGain.gain.value = 0.25;

        tremolo.connect(tremoloGain).connect(cricketGain.gain);
        osc.connect(cricketGain).connect(gainNode);

        osc.start();
        tremolo.start();

        disposers.push(() => {
          try {
            osc.stop();
            tremolo.stop();
          } catch { /* ignore */ }
          osc.disconnect();
          tremolo.disconnect();
        });
        break;
      }

      case 'ocean': {
        // Deep rhythmic swells (8-10 second surge cycle)
        const pinkSrc = ctx.createBufferSource();
        pinkSrc.buffer = this.getNoiseBuffer('pink');
        pinkSrc.loop = true;

        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 450;

        const surgeGain = ctx.createGain();
        surgeGain.gain.value = 0.2;

        const swellLfo = ctx.createOscillator();
        swellLfo.frequency.value = 0.1; // 10s wave period
        const swellLfoGain = ctx.createGain();
        swellLfoGain.gain.value = 0.45;

        // Modulate filter cutoff and gain
        swellLfo.connect(swellLfoGain).connect(surgeGain.gain);
        pinkSrc.connect(lp).connect(surgeGain).connect(gainNode);

        pinkSrc.start();
        swellLfo.start();

        disposers.push(() => {
          try {
            pinkSrc.stop();
            swellLfo.stop();
          } catch { /* ignore */ }
          pinkSrc.disconnect();
          swellLfo.disconnect();
        });
        break;
      }

      case 'thunder': {
        // Occasional distant rolling boom
        const triggerThunder = () => {
          if (!this.isMasterPlaying || (this.channelVolumes['thunder'] || 0) <= 0.01) return;
          try {
            const now = ctx.currentTime;
            const brownSrc = ctx.createBufferSource();
            brownSrc.buffer = this.getNoiseBuffer('brown');

            const lp = ctx.createBiquadFilter();
            lp.type = 'lowpass';
            lp.frequency.setValueAtTime(140, now);
            lp.frequency.linearRampToValueAtTime(70, now + 4.5);

            const tGain = ctx.createGain();
            tGain.gain.setValueAtTime(0.001, now);
            tGain.gain.linearRampToValueAtTime(0.7, now + 0.4);
            tGain.gain.exponentialRampToValueAtTime(0.001, now + 5.0);

            brownSrc.connect(lp).connect(tGain).connect(gainNode);
            brownSrc.start(now);
            brownSrc.stop(now + 5.5);
          } catch { /* ignore */ }
        };

        const thunderTimer = window.setInterval(() => {
          if (Math.random() < 0.6) {
            triggerThunder();
          }
        }, 12000);

        // Initial preview thunder after 2s if turned on
        const initialTimeout = window.setTimeout(triggerThunder, 1500);

        disposers.push(() => {
          window.clearInterval(thunderTimer);
          window.clearTimeout(initialTimeout);
        });
        break;
      }

      case 'brown_noise': {
        const brownSrc = ctx.createBufferSource();
        brownSrc.buffer = this.getNoiseBuffer('brown');
        brownSrc.loop = true;

        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 500;

        brownSrc.connect(lp).connect(gainNode);
        brownSrc.start();

        disposers.push(() => {
          try { brownSrc.stop(); } catch { /* ignore */ }
          brownSrc.disconnect();
        });
        break;
      }

      case 'delta_sleep': {
        // 432Hz sleep frequency + 2.5Hz binaural pulsation
        const oscLeft = ctx.createOscillator();
        const oscRight = ctx.createOscillator();
        const merger = ctx.createChannelMerger(2);

        oscLeft.type = 'sine';
        oscRight.type = 'sine';
        oscLeft.frequency.value = 216; // 432 / 2
        oscRight.frequency.value = 218.5; // +2.5Hz delta wave difference

        const toneGain = ctx.createGain();
        toneGain.gain.value = 0.28;

        oscLeft.connect(merger, 0, 0);
        oscRight.connect(merger, 0, 1);
        merger.connect(toneGain).connect(gainNode);

        oscLeft.start();
        oscRight.start();

        disposers.push(() => {
          try {
            oscLeft.stop();
            oscRight.stop();
          } catch { /* ignore */ }
          oscLeft.disconnect();
          oscRight.disconnect();
        });
        break;
      }
    }

    return () => {
      for (const fn of disposers) {
        fn();
      }
    };
  }

  public setMasterPlaying(playing: boolean): void {
    const ctx = this.initContext();
    this.isMasterPlaying = playing;

    if (playing) {
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      // Start all active channels
      for (const [chId, vol] of Object.entries(this.channelVolumes)) {
        if (vol > 0.01) {
          this.ensureChannelActive(chId, vol);
        }
      }
    } else {
      // Pause/stop all
      this.teardownAllChannels();
    }
  }

  private ensureChannelActive(chId: string, volume: number): void {
    if (!this.isMasterPlaying) return;

    const ctx = this.initContext();
    let channel = this.activeChannels.get(chId);

    if (!channel) {
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.connect(this.masterGain!);

      const cleanup = this.createChannelGraph(chId, gainNode);
      channel = { gainNode, cleanup };
      this.activeChannels.set(chId, channel);
    } else {
      channel.gainNode.gain.setTargetAtTime(volume, ctx.currentTime, 0.05);
    }
  }

  public setChannelVolume(chId: string, volume: number): void {
    this.channelVolumes[chId] = Math.max(0, Math.min(1, volume));

    if (this.isMasterPlaying) {
      if (volume <= 0.01) {
        const channel = this.activeChannels.get(chId);
        if (channel) {
          channel.cleanup();
          channel.gainNode.disconnect();
          this.activeChannels.delete(chId);
        }
      } else {
        this.ensureChannelActive(chId, volume);
      }
    }
  }

  public getChannelVolume(chId: string): number {
    return this.channelVolumes[chId] || 0;
  }

  public getAllVolumes(): Record<string, number> {
    return { ...this.channelVolumes };
  }

  public setMasterVolume(vol: number): void {
    this.currentMasterVolume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.currentMasterVolume, this.ctx.currentTime, 0.05);
    }
  }

  public getMasterVolume(): number {
    return this.currentMasterVolume;
  }

  public applyPreset(preset: SoundPreset): void {
    // Reset all channels to 0
    for (const ch of SOUND_CHANNELS) {
      this.setChannelVolume(ch.id, 0);
    }
    // Set preset volumes
    for (const [id, vol] of Object.entries(preset.volumes)) {
      this.setChannelVolume(id, vol);
    }
  }

  public startSmoothFadeOut(durationSeconds: number, onComplete: () => void): void {
    if (!this.masterGain || !this.ctx) return;

    if (this.fadeIntervalId) {
      window.clearInterval(this.fadeIntervalId);
      this.fadeIntervalId = null;
    }

    const startTime = this.ctx.currentTime;
    const initialVolume = this.masterGain.gain.value;
    const steps = 60;
    const intervalMs = (durationSeconds * 1000) / steps;
    let stepCount = 0;

    this.fadeIntervalId = window.setInterval(() => {
      stepCount++;
      const progress = stepCount / steps;
      const targetVol = Math.max(0, initialVolume * (1 - progress));

      if (this.masterGain && this.ctx) {
        this.masterGain.gain.setTargetAtTime(targetVol, this.ctx.currentTime, 0.08);
      }

      if (stepCount >= steps) {
        if (this.fadeIntervalId) {
          window.clearInterval(this.fadeIntervalId);
          this.fadeIntervalId = null;
        }
        this.setMasterPlaying(false);
        // Reset master volume back to default so subsequent plays work
        if (this.masterGain && this.ctx) {
          this.masterGain.gain.setValueAtTime(this.currentMasterVolume, this.ctx.currentTime);
        }
        onComplete();
      }
    }, intervalMs);
  }

  public cancelFadeOut(): void {
    if (this.fadeIntervalId) {
      window.clearInterval(this.fadeIntervalId);
      this.fadeIntervalId = null;
    }
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.currentMasterVolume, this.ctx.currentTime);
    }
  }

  private teardownAllChannels(): void {
    for (const channel of this.activeChannels.values()) {
      try {
        channel.cleanup();
        channel.gainNode.disconnect();
      } catch { /* ignore */ }
    }
    this.activeChannels.clear();
  }

  public destroy(): void {
    this.teardownAllChannels();
    if (this.fadeIntervalId) {
      window.clearInterval(this.fadeIntervalId);
    }
    if (this.ctx) {
      try {
        this.ctx.close();
      } catch { /* ignore */ }
      this.ctx = null;
    }
  }
}

export const soundEngine = new SoundEngine();
