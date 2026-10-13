# Walk&Relax

A relaxation and wellness web application featuring a procedural multi-channel nature sound mixer, live motion-sensor walking pedometer, MET-calibrated calorie expenditure tracker, and an ultra-dim OLED bedtime clock with a smooth audio fade-out sleep timer.

---

## Features

- **Procedural Nature Sound Engine**: 100% offline procedural Web Audio synthesis for rain, forest wind, bird calls, mountain stream, night campfire, summer crickets, ocean swells, thunder, brown noise, and 432Hz delta sleep tones. Zero external audio file or streaming dependencies.
- **Live Motion Pedometer**: Uses mobile accelerometer hardware (`devicemotion`) to detect steps in pocket or in hand with adaptive peak filtering.
- **Calorie & Fitness Metrics**: Calculates calories burned (kcal) using Metabolic Equivalent of Task (MET) calibrated to user body weight and stride length, along with distance (km/mi), cadence (SPM), and pace (min/km).
- **Indoor Treadmill & Cadence Mode**: Built-in paced cadence simulator (Gentle 90 SPM, Brisk 115 SPM, Power 135 SPM) for indoor walking pads, treadmill workouts, or desktop testing.
- **Sleep Timer & Smooth Fade-Out**: Automatic shutoff timer (15m, 30m, 45m, 60m, 90m) that gently tapers master volume to zero before stopping playback, preventing abrupt silence from waking the user.
- **Ultra-Dim OLED Bedtime Display**: Pure `#000000` pitch-black screen with warm amber or moonlight digits, adjustable screen dimmer slider (15%–100%), auto-hiding controls to eliminate bedside glare, and a 4-7-8 breathing relaxation guide.

---

## Tech Stack

- **Frontend**: React 19, TypeScript
- **Build Tool**: Vite 6+ / 8
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`)
- **Icons**: Lucide React
- **Audio**: Web Audio API (native procedural synthesis)

---

## Prerequisites

- **Node.js**: `v18.0.0` or higher (recommended: Node.js `20.x` LTS or `22.x`)
- **npm**: `v9.x` or higher (or `pnpm` / `yarn`)
- **Git**

---

## Step-by-Step Local Setup

### 1. Clone or Create the Project Directory

```bash
git clone <your-repository-url>
cd walk-and-relax
```

### 2. Configure `package.json`

Ensure your `package.json` contains the following configuration, scripts, and libraries:

```json
{
  "name": "walk-and-relax",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "engines": {
    "node": ">=18.0.0"
  },
  "scripts": {
    "dev": "vite --port=3000 --host=0.0.0.0",
    "build": "vite build",
    "preview": "vite preview --port=3000",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "@tailwindcss/vite": "^4.3.3",
    "@vitejs/plugin-react": "^6.1.1",
    "lucide-react": "^0.546.0",
    "motion": "^12.23.24",
    "react": "^19.0.1",
    "react-dom": "^19.0.1",
    "vite": "^8.3.0"
  },
  "devDependencies": {
    "@types/node": "^22.14.0",
    "@types/react": "^19.3.0",
    "@types/react-dom": "^19.3.0",
    "autoprefixer": "^10.4.21",
    "tailwindcss": "^4.3.3",
    "typescript": "^5.7.0"
  }
}
```

### 3. Install All Dependencies

Run the install command to populate `node_modules`:

```bash
npm install --legacy-peer-deps
```

### 4. Configuration Files

#### `vite.config.ts`
```typescript
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
});
```

#### `src/index.css`
```css
@import "tailwindcss";
```

### 5. Run the Local Development Server

```bash
npm run dev
```

Open your browser at `http://localhost:3000`.

To verify TypeScript types and build output:
```bash
npm run lint
npm run build
```

---

## Deployment to Render.com (Guaranteed Zero-Issue Guide)

Render.com is an ideal platform for **Walk&Relax**. Follow either the **Automated Blueprint (Recommended)** or the **Manual Dashboard** steps below to deploy without encountering common pitfalls like npm `ERESOLVE` peer dependency errors, Node version mismatches, or SPA 404 routing errors.

---

### Method 1: 1-Click Automated Deployment via `render.yaml` (Recommended)

This repository includes a pre-configured `render.yaml` Blueprint. Render automatically detects this file, sets Node 20, configures the build command, output directory, and SPA rewrite rules without requiring manual configuration.

1. **Push your code to GitHub or GitLab**:
   ```bash
   git add .
   git commit -m "Add Render deployment blueprint and configs"
   git push origin main
   ```

2. **Deploy on Render**:
   - Go to your [Render Dashboard](https://dashboard.render.com/).
   - Click **New +** at the top right and select **Blueprint**.
   - Select your connected `walk-and-relax` repository.
   - Render reads `render.yaml` and displays the configured static site:
     - **Service Name**: `walk-and-relax`
     - **Runtime**: `Static Site`
     - **Build Command**: `npm install --legacy-peer-deps && npm run build`
     - **Publish Directory**: `./dist`
     - **Environment**: `NODE_VERSION=20.18.0`
     - **SPA Rewrite Rule**: `/* -> /index.html`
   - Click **Apply**.
   - Your site will build and deploy automatically to `https://walk-and-relax.onrender.com`.

---

### Method 2: Manual Setup via Render Dashboard

If you prefer to configure the deployment manually in the Render web interface:

1. **Create Static Site**:
   - In the Render Dashboard, click **New +** and select **Static Site**.
   - Connect your GitHub / GitLab repository.

2. **Configure Build Settings**:
   Fill in the form with these exact values:

   | Setting | Value | Why It Matters |
   | :--- | :--- | :--- |
   | **Name** | `walk-and-relax` | Your public Render subdomain URL |
   | **Branch** | `main` | Production branch to auto-deploy |
   | **Root Directory** | *(leave blank)* | Root of your repository |
   | **Build Command** | `npm install --legacy-peer-deps && npm run build` | Compiles Vite with peer dependency safety |
   | **Publish Directory** | `dist` | Directory where Vite places compiled assets |

3. **Set Node Version (Critical Step)**:
   - Scroll down to the **Advanced** section or go to **Environment** tab.
   - Click **Add Environment Variable**:
     - **Key**: `NODE_VERSION`
     - **Value**: `20.18.0`
   > **Note**: Vite 8 and React 19 require modern Node. Specifying `NODE_VERSION: 20.18.0` avoids build failures caused by older Node defaults.

4. **Add SPA Redirect/Rewrite Rule (Prevents 404s)**:
   - Once the service is created, go to the **Redirects/Rewrites** tab in your service menu.
   - Click **Add Rule**:
     - **Type**: `Rewrite`
     - **Source**: `/*`
     - **Destination**: `/index.html`
     - **Status**: `200`
   > **Note**: This ensures that refreshing the browser or bookmarking tabs routes correctly to the React client app rather than returning a 404 Not Found error.

5. **Trigger Deploy**:
   - Click **Create Static Site** (or **Manual Deploy** -> **Deploy latest commit**).
   - Once the build log shows `==> Uploading build... Site is live!`, click your live URL to start using the app.

---

### Zero-Issue Deployment Checklist & Troubleshooting

| Error Encountered | Root Cause | Solution Implemented |
| :--- | :--- | :--- |
| **`npm error ERESOLVE could not resolve esbuild`** | Older `esbuild@^0.25.0` conflicted with `vite@8.3.4` (which requires `esbuild@^0.27.0 \|\| ^0.28.0`) | **Fixed**: Removed `esbuild` from `devDependencies`, created `.npmrc` with `legacy-peer-deps=true`, and set Build Command to `npm install --legacy-peer-deps && npm run build`. |
| **Build fails with syntax or Vite errors** | Render default Node version is too old (< 18) | **Fixed**: Added `.nvmrc` with `20`, `"engines": {"node": ">=18.0.0"}` in `package.json`, and `NODE_VERSION=20.18.0` in `render.yaml`. |
| **Page refresh shows "404 Not Found"** | Web server looks for a physical directory instead of routing to React SPA | **Fixed**: Added SPA rewrite rule (`/* -> /index.html`) in `render.yaml` & Dashboard settings. |
| **Blank white screen on load** | Incorrect publish directory | Publish directory must be set to `dist` (not `public` or `build`). |
| **Mobile pedometer does not count steps** | Browser blocks motion sensors on unencrypted HTTP | Render automatically serves all traffic over verified **HTTPS** with free SSL certificates. Tap "Enable Motion Sensor" on iOS. |
| **Browser blocks audio playback** | Browser autoplay policy blocks unprompted audio | Walk&Relax initiates audio strictly after the user taps "Play Audio" or selects a preset, fully complying with Web Audio autoplay policies. |

---

## License

Apache-2.0
