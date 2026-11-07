# Nexus Snake 🐍

Modern, feature-rich Snake game built with Vanilla HTML/CSS/JS and Capacitor. Runs in browser and as native Android APK.

![Nexus Snake](https://img.shields.io/badge/version-1.0.0-blue)
![Platform](https://img.shields.io/badge/platform-Web%20%7C%20Android-green)
![License](https://img.shields.io/badge/license-MIT-yellow)

## ✨ Features

### 🎮 4 Game Modes
| Mode | Description | Unlock |
|------|-------------|--------|
| **Classic** 🐍 | Traditional snake - eat food, grow, avoid walls | Default |
| **Timed** ⏱️ | 60 seconds, +5s per food, race for high score | 100 pts |
| **Survival** 🛡️ | No food, auto-grows, arena shrinks over time | 500 pts |
| **Maze** 🧩 | Fixed maze walls, single food, find the path | 1000 pts |

### ⚡ 6 Powerups
- **Speed Boost** ⚡ - 50% faster for 5s
- **Slow Down** 🐌 - 50% slower for 5s
- **Shrink** 📏 - Lose 3 segments instantly
- **2x Points** 💎 - Double score for 10s
- **Ghost** 👻 - Pass through walls for 8s
- **Shield** 🛡️ - Block one collision

### 🎨 4 Themes
- **Dark** - Default, easy on eyes
- **Light** - Clean, bright
- **Neon** - Cyberpunk glow
- **Retro** - 80s arcade vibes

### 🧱 Obstacles
- Static walls (maze mode)
- Moving blocks (patrol patterns)
- Portal pairs (teleport preserving direction)

### 💾 Persistence
- High scores per mode
- Game statistics (games played, total score, foods eaten, etc.)
- Settings (theme, sound, haptics, controls)
- Unlocked modes
- Works offline on Web (localStorage) and Android (Capacitor Preferences)

### 🎮 Controls
- **Touch/Swipe** - Swipe to turn (default mobile)
- **Virtual D-Pad** - On-screen directional buttons
- **Keyboard** - Arrow keys / WASD (desktop)

---

## 🚀 Quick Start

### Web (No Build Required)
```bash
# Just open index.html in a browser
# Or serve locally:
npx serve .
# Then open http://localhost:3000
```

### Android Development
```bash
# Prerequisites: Node.js 20+, Java 17, Android SDK

# Install dependencies
npm ci

# Add Android platform (first time only)
npm run cap:add

# Sync web assets to Android
npm run cap:sync

# Run on device/emulator
npm run cap:run

# Or open in Android Studio
npm run cap:open
```

### Build Signed APK
```bash
# Local build (requires keystore)
cd android
./gradlew assembleRelease

# Or use GitHub Actions (see below)
```

---

## 🏗️ GitHub Actions APK Build

The repository includes a workflow (`.github/workflows/build-apk.yml`) that builds a signed APK on every push to `main` and on version tags (`v*`).

### Required Secrets
Add these in GitHub Settings → Secrets → Actions:

| Secret | Description |
|--------|-------------|
| `KEYSTORE_BASE64` | Base64-encoded keystore file (`base64 -w0 keystore.jks`) |
| `KEYSTORE_PASSWORD` | Keystore password |
| `KEY_ALIAS` | Key alias |
| `KEY_PASSWORD` | Key password |

### Creating a Keystore
```bash
keytool -genkeypair -v -keystore nexus-snake.jks -alias nexus-snake \
  -keyalg RSA -keysize 4096 -validity 10000 \
  -storepass YOUR_STORE_PASS -keypass YOUR_KEY_PASS \
  -dname "CN=Nexus Snake, OU=Games, O=Nexus Apps, L=Istanbul, ST=TR, C=TR"
```

### Triggering a Release
```bash
git tag v1.0.0
git push origin v1.0.0
```
This creates a GitHub Release with the signed APK attached.

---

## 📁 Project Structure

```
nexus-snake/
├── index.html              # Entry point
├── package.json            # NPM config & scripts
├── capacitor.config.json   # Capacitor configuration
├── styles/
│   └── main.css           # All styles (CSS custom properties for themes)
├── src/
│   ├── main.js            # App bootstrap
│   ├── game/
│   │   ├── config.js      # Constants, themes, modes, powerups
│   │   ├── state.js       # Game state machine
│   │   ├── engine.js      # Core game loop (fixed timestep)
│   │   ├── renderer.js    # Canvas 2D rendering
│   │   ├── input.js       # Keyboard + touch + D-pad
│   │   ├── storage.js     # Web localStorage + Android Preferences
│   │   ├── powerups.js    # Powerup spawning & effects
│   │   ├── obstacles.js   # Static/moving/portal obstacles
│   │   └── modes/         # Game mode implementations
│   │       ├── classic.js
│   │       ├── timed.js
│   │       ├── survival.js
│   │       └── maze.js
│   └── ui/
│       ├── hud.js         # Score, level, timer, powerup indicators
│       ├── menu.js        # Main menu, pause, game over
│       ├── settings.js    # Theme, sound, haptics, controls
│       └── toast.js       # Non-blocking notifications
├── android/               # Capacitor Android project
│   ├── app/
│   │   ├── build.gradle
│   │   └── src/main/      # Manifest, resources, MainActivity
│   └── settings.gradle
└── .github/workflows/
    └── build-apk.yml      # CI/CD for APK
```

---

## 🎯 Architecture

- **No bundler, no dev server** - Open `index.html` directly
- **ES Modules** - Native browser module loading
- **Fixed timestep game loop** - 60 Hz physics, variable render
- **Capacitor** - Web-to-native bridge for Android
- **Offline-first** - Service worker ready, no network required
- **Accessibility** - ARIA labels, keyboard nav, reduced motion support

---

## 📱 Android Requirements

- **minSdk**: 24 (Android 7.0)
- **targetSdk**: 34 (Android 14)
- **Permissions**: INTERNET, VIBRATE, WAKE_LOCK, FOREGROUND_SERVICE
- **Architectures**: arm64-v8a, armeabi-v7a, x86, x86_64

---

## 🔧 Configuration

### Themes
Edit `src/game/config.js` → `THEMES` object to add/modify themes.

### Game Modes
Edit `src/game/config.js` → `MODES` object to tune:
- Base speed, speed increase, max speed
- Score multipliers
- Unlock requirements
- Special rules (wall wrapping, auto-grow, shrinking walls)

### Powerups
Edit `src/game/config.js` → `POWERUP_TYPES` to adjust:
- Duration, effect magnitude
- Spawn chance (in `powerups.js`)

---

## 📜 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🙏 Credits

Built with:
- [Capacitor](https://capacitorjs.com/) - Cross-platform native runtime
- [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) & [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk) - Fonts
- Vanilla JS, Canvas 2D, CSS Custom Properties

---

**Part of the Nexus Apps suite** — `/storage/emulated/0/nexus-uygulamalar/nexus-snake`