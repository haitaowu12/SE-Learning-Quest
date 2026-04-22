# SE Learning Quest

A browser-based educational game that teaches Systems Engineering concepts through progressive, interactive gameplay. Built with Phaser 3, TypeScript, and Vite.

## 🎮 Play Now

**[Play SE Learning Quest](https://haitaowu12.github.io/SE-Learning-Quest/)**

## 📚 Learning Content

The game covers 5 core modules aligned with industry standards:

1. **Systems Thinking Foundation** — Stakeholder analysis, value proposition, system boundaries, feedback loops
2. **Requirements Engineering** — SMART requirements, traceability matrices, verification methods, change impact
3. **Architecture & Design** — Component decomposition, interface definition, trade-off analysis, design patterns
4. **Verification & Validation** — V&V planning, test case design, review preparation, RAMS compliance
5. **Integration & Management** — Configuration management, risk assessment, integration sequencing, SEMP construction

**Capstone Challenge**: Design a railway signaling subsystem applying all learned competencies.

### Standards Alignment

All content is mapped to authoritative references:
- **INCOSE Systems Engineering Handbook v5**
- **ISO/IEC/IEEE 15288:2023**
- **EN 50126** (RAMS for railway applications)

## 🛠️ Development

### Prerequisites

- Node.js 20+
- npm

### Setup

```bash
git clone https://github.com/haitaowu12/SE-Learning-Quest.git
cd SE-Learning-Quest
npm install
```

### Development Server

```bash
npm run dev
```

### Build

```bash
npm run build
```

The `dist/` folder will contain the static site ready for deployment.

### Deploy to GitHub Pages

Push to the `main` branch. The GitHub Actions workflow will automatically build and deploy to GitHub Pages.

## 🏗️ Architecture

- **Engine**: Phaser 3.70+ (2D WebGL/Canvas)
- **Language**: TypeScript (strict mode)
- **Bundler**: Vite
- **State**: localStorage-based progress persistence
- **Styling**: Tailwind CSS for DOM overlays

## 📁 Project Structure

```
src/
  scenes/          # Phaser scenes (Boot, Title, Map, Module, Level, Capstone)
  game/            # Core game logic (GameManager, LevelManager, SaveManager)
  components/      # Reusable components (AudioManager, ParticleEffect, TransitionManager)
  types/           # TypeScript interfaces
  utils/           # Helpers and standards references
public/
  assets/data/     # Level definitions (JSON)
```

## 🎯 Features

- Progressive level unlocking
- Hint system with 30-second auto-trigger
- Retry without penalty
- Score tracking with time/hint/retry bonuses
- Standards reference citations per level
- Key takeaway cards
- Responsive Canvas scaling
- Keyboard navigation support
- High-contrast accessibility mode
- Cross-browser compatibility

## 📄 License

MIT
