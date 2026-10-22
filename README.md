# Highway Rush: Oncoming Traffic Racer

> A high-octane 3D arcade highway racing game built with Three.js, React, and Web Audio API. Dodge oncoming traffic at breakneck speeds, thread hair-raising near-misses, and engage nitro boost to survive!

![Three.js](https://img.shields.io/badge/Three.js-r160+-black?style=flat-square&logo=three.js)
![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=flat-square&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8?style=flat-square&logo=tailwindcss)
![License](https://img.shields.io/badge/License-Apache_2.0-green?style=flat-square)

---

## 🏎️ Overview

**Highway Rush** puts you in the driver's seat of a high-performance cyber supercar hurtling down a 4-lane highway straight into **oncoming traffic**. The core objective: **do not crash** into the cars and trucks barreling towards you.

Thread the needle between incoming vehicles to build up **Near-Miss Combos**, refill your **Nitro Boost**, and set all-time distance and score records.

---

## ✨ Features

- **⚡ High-Speed Oncoming Traffic Hazards**:
  - **Sedans**: Standard commuters cruising in lane.
  - **Sports Coupes**: Rapid high-velocity oncoming cars requiring lightning-fast reflexes.
  - **18-Wheeler Semi-Trucks**: Massive multi-part rigs taking up wide lanes; honk dual-tone air horns when you're directly in their path!
  - **Erratic Lane-Changers**: Unpredictable drivers that flash amber blinkers as a windup telegraph before swerving into your lane.
- **🔥 Near-Miss Combo System**:
  - Thread close to oncoming vehicles without touching to earn combo multipliers (`+250 PTS x COMBO`) and recharge your Nitro canister.
- **🎥 Multi-Angle Camera System**:
  - **Third-Person Chase Cam**: Cinematic over-the-shoulder arcade view.
  - **First-Person Hood / Bumper Cam**: Maximum adrenaline cockpit perspective.
  - **Top-Angled Cam**: Classic top-down retro arcade view.
- **🔊 100% Procedural Web Audio API Synthesizer**:
  - Dynamic RPM engine pitch shifting with speed and throttle.
  - White-noise filtered nitro roar with resonant frequencies.
  - Rewarding harmonic chime chords on near-misses.
  - Heavy sub-bass impact thump + crunchy metal collision sound effects.
  - Dual-tone horn blasts and coin pickup arpeggios.
  - Zero external MP3/WAV file dependencies.
- **🎨 Garage Customization**:
  - Customize car paint colors (Cyber Azure, Inferno Red, Neon Volt, Emerald Flux, Hyper Violet, Solar Flare).
- **📱 Fully Responsive & Touch-Friendly**:
  - Full keyboard controls for desktop (`WASD` / Arrow Keys / `Space` / `C` / `Esc`).
  - Seamless on-screen touch pedals (Left / Right steer, Nitro Boost) for mobile and tablet players.

---

## 🕹️ Controls

| Action | Keyboard | Touch / Mobile |
| :--- | :--- | :--- |
| **Steer Left / Right** | `A` / `D` or `←` / `→` | On-screen `◀` / `▶` Pedals |
| **Nitro Boost** | `Spacebar` (Hold) | On-screen `BOOST` Pedal |
| **Throttle / Brake** | `W` / `S` or `↑` / `↓` | Automatic / Speed Physics |
| **Switch Camera Mode** | `C` | Camera Button (HUD) |
| **Pause / Resume** | `Escape` or `P` | Pause Button (HUD) |
| **Toggle Sound** | `M` | Speaker Button (HUD) |
| **Quick Restart** | `Space` / `Enter` / `R` | Retry Button |

---

## 🛠️ Tech Stack

- **3D Graphics & Simulation**: [Three.js](https://threejs.org/) (PCF Soft Shadows, ACES Filmic Tone Mapping, RoomEnvironment, Procedural Textures & Geometries)
- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Audio**: Web Audio API (Oscillators, Biquad Filters, Dynamic Gain Nodes)
- **Celebrations**: Canvas-Confetti

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or bun

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/highway-rush.git
   cd highway-rush
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the local development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`.

### Building for Production

```bash
npm run build
npm run preview
```

---

## 📄 License

This project is licensed under the Apache-2.0 License.
