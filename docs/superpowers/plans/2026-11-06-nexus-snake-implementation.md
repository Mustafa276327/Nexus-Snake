# Nexus Snake Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a feature-rich Snake game (Vanilla HTML/CSS/JS + Capacitor) that runs in browser and builds to APK via GitHub Actions.

**Architecture:** Single-page Canvas 2D game with modular JS (ES modules), no build step for web. Capacitor wraps the web app for Android. GitHub Actions runs `capacitor build android` on push/tag to produce signed APK.

**Tech Stack:** Vanilla JS (ES modules), HTML5 Canvas, CSS Custom Properties, Capacitor 6, GitHub Actions, Gradle (via Capacitor).

**Spec:** This plan argues from the brainstorming conversation: advanced features (modes, powerups, obstacles, themes, persistence), dual web/APK output, offline-first.

## Global Constraints

- **Single HTML entry point** (`index.html`), loads ES modules via `<script type="module">`
- **No bundler, no dev server required** — open `index.html` directly works
- **Capacitor config** at `capacitor.config.json`, Android project in `android/`
- **GitHub Actions workflow** at `.github/workflows/build-apk.yml` — triggers on push to main and version tags
- **APK signing** via GitHub Secrets (keystore base64, passwords)
- **Data persistence:** `localStorage` (web) / Capacitor Preferences (Android) — unified via thin adapter
- **Target:** Android API 24+ (minSdk 24), compileSdk 34
- **Versioning:** `package.json` version drives APK versionCode/versionName

## Review Focus

| Input / Condition | Expected Behavior |
|-------------------|-------------------|
| Touch swipe on mobile | Immediate direction change, no 180° reversal |
| Keyboard arrows on desktop | Same as touch, no key repeat queueing |
| Game speed at high scores | Caps at maxSpeed, never unplayable |
| Powerup spawn during active powerup | No stacking same type; different types can overlap |
| Save corruption (malformed JSON) | Graceful fallback to defaults, no crash |
| Theme switch mid-game | Instant visual update, no restart needed |
| Orientation change | Canvas resizes, game state preserved |
| Background/foreground (Android) | Pauses/resumes correctly, timer accurate |
| Canvas high-DPI (devicePixelRatio) | Crisp rendering, no blur |
| GitHub Actions build failure | Clear log, artifact not uploaded |

---

### Task 1: Project Scaffold & Config

**Files:**
- Create: `package.json`
- Create: `capacitor.config.json`
- Create: `.gitignore`
- Create: `index.html` (skeleton)
- Create: `src/main.js` (entry point)
- Create: `src/game/engine.js` (core loop)
- Create: `src/game/state.js` (state machine)
- Create: `src/game/renderer.js` (canvas drawing)
- Create: `src/game/input.js` (touch/keyboard)
- Create: `src/game/storage.js` (persistence adapter)
- Create: `src/game/config.js` (constants, themes, modes)
- Create: `src/game/powerups.js` (powerup system)
- Create: `src/game/obstacles.js` (obstacle system)
- Create: `src/game/modes/` (mode implementations)
- Create: `src/ui/hud.js` (score, timer, level)
- Create: `src/ui/menu.js` (main menu, pause, game over)
- Create: `src/ui/settings.js` (theme, controls, sound)
- Create: `src/ui/toast.js` (notifications)
- Create: `styles/main.css` (all styling)
- Create: `.github/workflows/build-apk.yml`

**Interfaces:**
- Produces: `GameEngine` class, `GameState` enum, `StorageAdapter` interface, `Renderer` class, `InputManager` class, `PowerupManager` class, `ObstacleManager` class, mode classes implementing `GameMode` interface

- [ ] **Step 1: Write `package.json`** with name `nexus-snake`, version `1.0.0`, scripts: `cap:add`, `cap:build`, `cap:run`, `cap:sync`

- [ ] **Step 2: Write `capacitor.config.json`** with appId `com.nexus.snake`, appName `Nexus Snake`, webDir `.`, bundledWebRuntime `false`

- [ ] **Step 3: Write `.gitignore`** excluding `node_modules`, `android/app/build`, `android/.gradle`, `.capacitor`, `*.apk`, `.DS_Store`

- [ ] **Step 4: Write skeleton `index.html`** with `<canvas id="game">`, viewport meta, theme-color, module script loading `src/main.js`

- [ ] **Step 5: Run `npm install @capacitor/core @capacitor/cli @capacitor/android`**

- [ ] **Step 6: Run `npx cap add android`** — creates `android/` project

- [ ] **Step 7: Commit scaffold**

```bash
git init && git add . && git commit -m "chore: scaffold nexus-snake with Capacitor"
```

---

### Task 2: Core Game Engine & State Machine

**Files:**
- Modify: `src/game/engine.js`
- Modify: `src/game/state.js`
- Modify: `src/main.js`
- Test: manual (open `index.html`)

**Interfaces:**
- Consumes: `Renderer`, `InputManager`, `StorageAdapter`, `GameMode` (from later tasks)
- Produces: `GameEngine` singleton with `init()`, `start(modeId)`, `pause()`, `resume()`, `gameOver(score)`, `update(dt)`, `render()`

- [ ] **Step 1: Define `GameState` enum** in `state.js`: `MENU`, `PLAYING`, `PAUSED`, `GAME_OVER`, `SETTINGS`

- [ ] **Step 2: Implement `GameEngine` class** in `engine.js` — fixed timestep loop (60 Hz), accumulator, state transitions, delegates to active `GameMode`

- [ ] **Step 3: Wire `main.js`** — instantiate engine, renderer, input, storage; call `engine.init()`

- [ ] **Step 4: Verify** — open `index.html`, console shows "Engine initialized", no errors

---

### Task 3: Renderer & Canvas Setup

**Files:**
- Modify: `src/game/renderer.js`
- Modify: `styles/main.css`
- Test: manual

**Interfaces:**
- Consumes: `GameEngine` (for canvas size, state), `GameMode` (for entities to draw)
- Produces: `Renderer` class with `resize()`, `clear()`, `drawSnake()`, `drawFood()`, `drawPowerups()`, `drawObstacles()`, `drawGrid()`, `render(state)`

- [ ] **Step 1: Implement `Renderer`** — handles `devicePixelRatio`, CSS vs canvas size split, `resize()` called on load/orientation change

- [ ] **Step 2: Add drawing primitives** — rounded rect for snake segments, pulsing food, powerup icons, obstacle styles per theme

- [ ] **Step 3: Add `styles/main.css`** — CSS variables for themes, canvas fills screen, HUD overlay, menu modals

- [ ] **Step 4: Verify** — canvas renders crisp, background grid visible, snake draws at (0,0) test position

---

### Task 4: Input Manager

**Files:**
- Modify: `src/game/input.js`
- Test: manual

**Interfaces:**
- Consumes: `GameEngine` (for direction changes, pause toggle)
- Produces: `InputManager` class with `init()`, `destroy()`, `onDirectionChange(callback)`, `onPause(callback)`

- [ ] **Step 1: Implement keyboard handler** — Arrow keys / WASD, prevent default, debounce 180° reversal

- [ ] **Step 2: Implement touch handler** — swipe detection (min 30px), four directions, prevent scroll

- [ ] **Step 3: Add virtual D-pad overlay (optional, mobile)** — CSS-only, shows on touchstart

- [ ] **Step 4: Verify** — desktop arrows work, mobile swipe works, no double-turn bug

---

### Task 5: Storage Adapter (Web + Android)

**Files:**
- Modify: `src/game/storage.js`
- Test: manual

**Interfaces:**
- Consumes: Capacitor Preferences (Android), localStorage (web)
- Produces: `StorageAdapter` with `get(key)`, `set(key, value)`, `remove(key)`, `getAll()`, `clear()`

- [ ] **Step 1: Detect platform** — `window.Capacitor?.isNativePlatform`

- [ ] **Step 2: Implement web backend** — localStorage with JSON serialization, namespace prefix `ns_`

- [ ] **Step 3: Implement Android backend** — `@capacitor/preferences` via dynamic import

- [ ] **Step 4: Unify API** — same interface, async throughout

- [ ] **Step 5: Verify** — save/load high scores, settings persist across reload (web) and reinstall (Android)

---

### Task 6: Configuration, Themes & Game Modes

**Files:**
- Modify: `src/game/config.js`
- Create: `src/game/modes/classic.js`
- Create: `src/game/modes/timed.js`
- Create: `src/game/modes/survival.js`
- Create: `src/game/modes/maze.js`
- Test: manual

**Interfaces:**
- Produces: `THEMES` object (4 themes), `MODES` registry, `GameMode` interface (`init()`, `update(dt)`, `spawnFood()`, `checkCollisions()`, `getScoreMultiplier()`)

- [ ] **Step 1: Define `THEMES`** — `dark`, `light`, `neon`, `retro` with CSS variable maps

- [ ] **Step 2: Define `GameMode` base class** — common logic (snake movement, growth, base speed)

- [ ] **Step 3: Implement `ClassicMode`** — standard rules, walls kill, speed increases every 5 food

- [ ] **Step 4: Implement `TimedMode`** — 60s timer, +5s per food, score = food × time bonus

- [ ] **Step 5: Implement `SurvivalMode`** — no food, snake grows automatically, walls shrink over time

- [ ] **Step 6: Implement `MazeMode`** — static maze obstacles, single food, perfect path required

- [ ] **Step 7: Register modes** in `config.js` with IDs, names, descriptions, unlock conditions

- [ ] **Step 8: Verify** — each mode loads, plays differently, returns to menu on game over

---

### Task 7: Powerup System

**Files:**
- Modify: `src/game/powerups.js`
- Modify: `src/game/renderer.js` (draw powerups)
- Test: manual

**Interfaces:**
- Consumes: `GameMode` (for applying effects), `Renderer`
- Produces: `PowerupManager` with `spawn()`, `update(dt)`, `apply(type, snake)`, `POWERUP_TYPES` enum

- [ ] **Step 1: Define `POWERUP_TYPES`** — `SPEED_BOOST`, `SLOW_DOWN`, `SHRINK`, `DOUBLE_POINTS`, `GHOST` (pass through walls), `SHIELD` (one free wall hit)

- [ ] **Step 2: Implement spawn logic** — 15% chance per food, max 2 active, despawn after 10s

- [ ] **Step 3: Implement effects** — timed (5-10s), visual indicator on snake (glow, color), HUD icon

- [ ] **Step 4: Handle stacking rules** — same type refreshes duration, different types stack

- [ ] **Step 5: Verify** — powerups appear, collected, effects apply/expire correctly

---

### Task 8: Obstacle System

**Files:**
- Modify: `src/game/obstacles.js`
- Modify: `src/game/renderer.js` (draw obstacles)
- Test: manual

**Interfaces:**
- Consumes: `GameMode` (for collision), `Renderer`
- Produces: `ObstacleManager` with `generate(modeId)`, `update(dt)`, `checkCollision(pos)`

- [ ] **Step 1: Define obstacle types** — `STATIC_WALL`, `MOVING_BLOCK`, `PORTAL_PAIR`

- [ ] **Step 2: Implement per-mode generation** — Classic: none; Timed: few static; Survival: shrinking walls; Maze: full maze

- [ ] **Step 3: Moving obstacles** — horizontal/vertical patrol, predictable path

- [ ] **Step 4: Portals** — linked pairs, snake teleports preserving direction

- [ ] **Step 5: Verify** — obstacles render, collide correctly, portals work

---

### Task 9: UI — HUD, Menu, Settings, Toast

**Files:**
- Modify: `src/ui/hud.js`
- Modify: `src/ui/menu.js`
- Modify: `src/ui/settings.js`
- Modify: `src/ui/toast.js`
- Modify: `styles/main.css`
- Test: manual

**Interfaces:**
- Consumes: `GameEngine`, `StorageAdapter`, `THEMES`
- Produces: HUD (score, high score, timer, level, active powerups), Menu (mode select, start, settings), Settings (theme, sound, vibration, controls), Toast (non-blocking notifications)

- [ ] **Step 1: Implement HUD** — updates every frame, shows mode-specific info

- [ ] **Step 2: Implement Menu** — mode cards with unlock status, keyboard/touch navigation

- [ ] **Step 3: Implement Settings** — theme selector (live preview), sound toggle, vibration toggle, control scheme

- [ ] **Step 4: Implement Toast** — `show(message, type, duration)`, queues, auto-dismiss

- [ ] **Step 5: Wire all UI to engine** — pause overlay, game over screen with stats, restart/quit

- [ ] **Step 6: Verify** — full UI flow works, settings persist, theme changes instantly

---

### Task 10: Android Polish & Capacitor Sync

**Files:**
- Modify: `android/app/src/main/AndroidManifest.xml`
- Modify: `android/app/src/main/res/values/styles.xml`
- Modify: `android/app/src/main/res/xml/file_paths.xml`
- Modify: `capacitor.config.json`
- Test: `npx cap run android`

**Interfaces:**
- Consumes: Capacitor plugins (Preferences, Haptics, StatusBar)
- Produces: Configured Android project ready for build

- [ ] **Step 1: Add permissions** — `VIBRATE`, `WAKE_LOCK`

- [ ] **Step 2: Configure status bar** — immersive mode, theme color

- [ ] **Step 3: Add Capacitor plugins** — `@capacitor/preferences`, `@capacitor/haptics`, `@capacitor/status-bar`

- [ ] **Step 4: Run `npx cap sync android`**

- [ ] **Step 5: Test on device/emulator** — `npx cap run android`, verify all features work

- [ ] **Step 6: Verify** — APK installs, runs offline, haptics on collision, preferences persist

---

### Task 11: GitHub Actions APK Build

**Files:**
- Create: `.github/workflows/build-apk.yml`
- Test: push to main

**Interfaces:**
- Consumes: GitHub Secrets (`KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD`)
- Produces: Signed `app-release.apk` artifact, GitHub Release on version tag

- [ ] **Step 1: Write workflow** — `ubuntu-latest`, JDK 17, Node 20, cache Gradle/npm

- [ ] **Step 2: Steps** — checkout, setup Java/Node, `npm ci`, `npx cap sync android`, decode keystore, `./gradlew assembleRelease`

- [ ] **Step 3: Upload artifact** — `app-release.apk` with retention

- [ ] **Step 4: Release job** — on tag `v*`, create release, upload APK

- [ ] **Step 5: Verify** — push commit, check Actions tab, download artifact, install on device

---

### Task 12: Polish, README & Version 1.0.0

**Files:**
- Create: `README.md`
- Modify: `package.json` (version 1.0.0)
- Modify: `android/app/build.gradle` (versionCode 1, versionName from package.json)
- Test: full playthrough

**Interfaces:**
- Produces: Documented, releasable project

- [ ] **Step 1: Write `README.md`** — features, screenshots, build instructions, controls, privacy

- [ ] **Step 2: Final testing** — all 4 modes, all powerups, all themes, web + Android

- [ ] **Step 3: Tag release** — `git tag v1.0.0 && git push origin v1.0.0`

- [ ] **Step 4: Verify GitHub Release** — APK attached, installable

---

## Self-Review Checklist

- [ ] Spec coverage: All brainstormed features (4 modes, 6 powerups, 3 obstacle types, 4 themes, persistence, web/APK) have tasks
- [ ] Step scan: Each step is one action with checkable result
- [ ] Type consistency: Interfaces match across tasks (e.g., `GameMode` methods same in Tasks 2, 6, 7, 8)
- [ ] Review Focus: Each row has a test in owning task (e.g., touch swipe in Task 4, theme switch in Task 9)
- [ ] Proportion: Plan is ~2x spec length, no code bodies only signatures