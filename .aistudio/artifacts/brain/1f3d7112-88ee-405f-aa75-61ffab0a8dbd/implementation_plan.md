# Ambient Haven: Nature Soundscapes, Pedometer & Bedtime Sleep Timer

An ambient relaxation and wellness application combining a multi-channel nature sound mixer, live motion-sensor walking and calorie tracker, and an ultra-dim OLED bedtime clock with smooth audio fade-out sleep timer.

### User Review & Critical Decisions

> [!IMPORTANT]
> The following product choices were confirmed during Phase 1 clarification:
> - **Activity Tracking**: Live pedometer leveraging mobile `devicemotion` sensor alongside a manual workout session timer with treadmill/cadence pace presets.
> - **Soundscape Audio**: Multi-channel sound mixer with individual volume controls for rain, forest birds, wind, campfire, crickets, stream, and sleep frequencies via procedural Web Audio synthesis (zero fragile external audio file dependencies).
> - **Bedtime Experience**: Ultra-dim OLED bedtime mode with low-luminance warm amber/indigo typography, minimal eye strain, and smooth audio gain fade-out before playback stops.

- **Confirmed Decision 1**: Procedural Web Audio API sound generator to guarantee instant, 100% offline, zero-buffer playback without network failures.
- **Confirmed Decision 2**: Local storage persistence for walking history, daily step goals, and custom sound mixer presets.

---

### 1. Overview & Core Concept

- **What It Does**: Provides users with a peaceful sanctuary to unwind, sleep, or walk mindfully. Users can mix multiple natural sounds (rain, forest birds, wind, campfire, night crickets, stream, white noise, and delta binaural tones), track their walking steps, distance, and calories burned with live cadence, and set a bedside sleep timer that smoothly dims the screen and fades out audio into the night.
- **Target Audience & Persona**: People seeking better sleep, stress relief, white noise for focus, and daily walkers who enjoy listening to nature sounds during evening walks.
- **Key Value**: All-in-one relaxation companion that pairs audio serenity with physical wellness and thoughtful bedtime ergonomics.

---

### 2. User Experience & Visual Design

#### Key User Flows
1. **Soundscape Creation**:
   - User browses natural sound channels (Rain, Thunder, Forest Birds, Rustling Wind, Campfire, Night Crickets, Gentle Stream, Delta Sleep Tone).
   - Toggles channels on/off and fine-tunes individual volume faders.
   - Master volume and one-tap curated mood presets (Rainy Forest, Twilight Camp, Valley Stream, Deep Sleep).
2. **Walking & Calorie Tracker**:
   - User starts a walk session.
   - Pedometer tracks steps via mobile accelerometer (`DeviceMotionEvent`) or cadence simulation when walking on a treadmill or desktop.
   - Real-time display of active steps, distance (km/mi), calories burned, walking duration, and cadence pace.
   - Option to save session to local workout history with daily goal rings.
3. **Bedtime & Sleep Timer**:
   - User selects timer duration (15m, 30m, 45m, 60m, custom).
   - Toggles **OLED Bedtime Clock Mode**: screen transitions to a soothing pure-black (`#000000`) minimal night view with warm amber or soft moonlight typography, hiding daytime clutter.
   - Timer counts down gently; when 3 minutes remain, audio begins a smooth logarithmic fade-out until silent stop.

#### Visual Identity & Theme
- **Aesthetic Direction**: Deep nocturnal serenity, tactile audio hardware mixing board meets minimalist Japanese calm.
- **Color Palette**:
  - Background Neutral: Pure OLED Black (`#000000`) and Deep Obsidian (`#090d16`).
  - Card & Surfaces: Muted midnight slate (`#111827`, border `#1f2937`).
  - Accents: Warm amber candle glow (`#f59e0b` / `#d97706`) and forest sage (`#10b981`), gentle moonlight indigo (`#6366f1`).
- **Typography**:
  - Clean display titles in modern sans.
  - Tabular monospace numbers (`font-mono tabular-nums`) for clock, timers, steps, and calorie counters.
  - Unboxed metadata with typographic dots (`·`) in compliance with zero-pill discipline.
- **Touch Ergonomics & Responsiveness**:
  - Mobile bottom tab navigation (Sounds, Walk Tracker, Bedtime Clock, History) within natural thumb reach.
  - Expands into an expansive 2-column studio layout on desktop with mixer console alongside the live workout dashboard.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Procedural Web Audio API vs External Audio Files**
  - *Chosen Approach*: Synthesize ambient rain, forest murmurs, wind, campfire crackle, crickets, and stream noise using Web Audio API nodes (pink/brown noise buffers, resonant bandpass filters, modulated gain oscillators, and random impulse nodes).
  - *Why*: Eliminates broken audio links, 404 streaming errors, CORS issues, and large bandwidth downloads. It starts playing instantaneously and works offline seamlessly.
- **Decision 2: Motion Sensor Pedometer with Cadence Fallback**
  - *Chosen Approach*: Use the standard `devicemotion` browser API with acceleration peak filtering on supported mobile devices, with an intuitive cadence stepper for desktop/manual sessions.
  - *Why*: Mobile browser permission policies (iOS 13+ requires explicit user gesture permission for `DeviceMotionEvent.requestPermission()`); providing both ensures the app is 100% functional across both mobile and desktop.
- **Decision 3: OLED Ultra-Dim Night Shield**
  - *Chosen Approach*: Dedicated full-screen night clock overlay with brightness dimming slider and minimal glowing amber numerals.
  - *Why*: Blue light disruption prevention; users placing their phone on their nightstand will not be disturbed by glare.

---

### 4. Technical Architecture & Data Strategy

#### Architecture & Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        App Root                             │
│   (State: activeTab, isPlaying, masterVolume, sleepTimer)   │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
       ┌───────▼────────┐             ┌───────▼────────┐
       │ Web Audio API  │             │ Motion Sensor  │
       │ Sound Engine   │             │ & Pedometer    │
       │ (Noise, Waves, │             │ (Steps, METs,  │
       │  Birds, Crickets)│           │  Calories, Km) │
       └───────┬────────┘             └───────┬────────┘
               │                              │
  ┌────────────┴──────────────────────────────┴────────────┐
  │                   View Layer                           │
  ├───────────────────┬───────────────────┬────────────────┤
  │   Sound Mixer     │   Walk Tracker    │ Bedtime Clock  │
  │ - Multi-channel   │ - Live Pedometer  │ - OLED Dimmer  │
  │   faders          │ - Calorie counter │ - Fade-out timer│
  │ - Nature presets  │ - Cadence pace    │ - Sleep clock  │
  │ - Master gain     │ - History logs    │ - Fullscreen   │
  └───────────────────┴───────────────────┴────────────────┘
```

#### State & Storage Models
- `SoundChannelState`: Channel ID, name, icon, volume (0.0 to 1.0), active status, procedural generator parameters.
- `WalkSessionState`: Active status, stepCount, distanceMeters, caloriesKcal, elapsedSeconds, cadencePpm, sensitivity.
- `SleepTimerState`: Total duration, remainingSeconds, isRunning, isFadeActive, fadeDurationSeconds (180s).
- `LocalStorage`: Saved presets, user weight for MET calorie formula, daily step goal, completed walk history.

#### Implementation Steps
1. **Audio Synthesis Core (`src/audio/soundEngine.ts`)**: Procedural nodes for Rain, Forest Wind, Bird Calls, Campfire Pops, Night Crickets, Stream, Ocean Waves, Brown Noise, and 432Hz Sleep Tone with smooth volume envelope gains.
2. **Pedometer & Calorie Engine (`src/hooks/usePedometer.ts`)**: Device motion sensor listener, acceleration threshold filter, session timer, and MET-based calorie equation.
3. **Sound Mixer View (`src/components/SoundMixer.tsx`)**: Nature channel sliders, presets bar, master volume, and visualizer pulse.
4. **Walking & Calorie Tracker View (`src/components/WalkTracker.tsx`)**: Interactive step counter, calorie ring, cadence control, and daily goal progress.
5. **Bedtime Sleep Timer & OLED Clock (`src/components/BedtimeClock.tsx`)**: Fullscreen dim clock, timer duration selector, remaining countdown, and smooth audio fade curve.
6. **Shell & Navigation (`src/App.tsx`, `index.html`, `metadata.json`)**: Responsive layout, tab navigation, dark bedtime styling.
