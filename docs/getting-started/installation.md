# Installation

Get DotAgents running on your machine in minutes.

---

## Desktop App

### Download Pre-built Release

The fastest way to get started:

**[Download Latest Release](https://github.com/aj47/dotagents-mono/releases/latest)**

| Platform | Architecture | Format |
|----------|-------------|--------|
| **macOS** | Apple Silicon (M1/M2/M3/M4) + Intel | `.dmg` (universal) |
| **Windows** | x64 | `.exe` installer |
| **Linux** | x64 | `.AppImage`, `.deb` |
| **Linux** | ARM64 | `.AppImage`, `.deb` |

### macOS

1. Download the `.dmg` file from the releases page
2. Open the `.dmg` and drag DotAgents to your Applications folder
3. On first launch, right-click the app and select "Open" to bypass Gatekeeper
4. Grant accessibility permissions when prompted (required for voice recording and text injection)

### Windows

1. Download the `.exe` installer from the releases page
2. Run the installer and follow the setup wizard
3. DotAgents will appear in your Start menu

> **Note**: Windows currently supports dictation-only mode. Full MCP agent functionality requires macOS. See [v0.2.2](https://github.com/aj47/dotagents-mono/releases/tag/v0.2.2) for Windows dictation builds.

### Linux

1. Download the `.AppImage` or `.deb` package for your architecture
2. For AppImage: `chmod +x DotAgents-*.AppImage && ./DotAgents-*.AppImage`
3. For deb: `sudo dpkg -i dotagents-*.deb`

See the [Linux Support Matrix](https://github.com/aj47/dotagents-mono/blob/main/LINUX_SUPPORT_MATRIX.md) for detailed platform compatibility.

---

## Mobile App

The DotAgents mobile app connects to your desktop instance or any OpenAI-compatible API endpoint.

### Prerequisites

- Node.js 18+
- Expo CLI: `npm install -g expo` (or use `npx expo`)
- For native builds: Xcode (iOS) or Android Studio (Android)

### Install from Source

```bash
cd apps/mobile
npm install
```

### Run on Device

```bash
# Start Metro bundler
npm run start

# Or run directly on a device/simulator
npx expo run:ios      # iOS (requires Xcode)
npx expo run:android  # Android (requires Android Studio)
```

> **Important**: The mobile app uses `expo-speech-recognition`, a native module not available in Expo Go. You must use a **development build** to run on physical devices. See the [Mobile App guide](../mobile/overview.md) for details.

### Web

The mobile app also runs in the browser:

```bash
npx expo start --web
```

Speech recognition on web requires Chrome or Edge over HTTPS.

---

## Build from Source (Desktop)

For contributors or those who want the latest development version:

### Prerequisites

- **Node.js 24.x** recommended (minimum: `20.19.4`)
- **pnpm 9** (required — npm and yarn are not supported)
- **Rust toolchain** (for the native keyboard/input binary)
- **Xcode** (macOS only, for code signing)

### Steps

```bash
# Clone the repository
git clone https://github.com/aj47/dotagents-mono.git
cd dotagents-mono

# Use the correct Node version
nvm use

# Install dependencies (pnpm only)
pnpm install

# Build the Rust native binary
pnpm build-rs

# Start in development mode
pnpm dev
```

### Production Build

```bash
pnpm build              # Current platform
pnpm build:mac          # macOS (Apple Silicon + Intel universal)
pnpm build:win          # Windows (x64)
pnpm build:linux        # Linux (host architecture)
```

See the [Development Setup guide](../development/setup.md) for Docker builds and troubleshooting.

---

## System Requirements

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| **OS** | macOS 12+, Windows 10+, Ubuntu 22.04+ | macOS 14+, latest Windows/Ubuntu |
| **RAM** | 4 GB | 8 GB+ |
| **Disk** | 500 MB | 1 GB |
| **Node.js** (dev only) | 20.19.4 | 24.x |
| **Network** | Required for AI provider API calls | Broadband for voice streaming |

---

## Next Steps

- **[Quick Start](quickstart.md)** — Configure your first AI provider and start chatting
- **[Your First Agent](first-agent.md)** — Create a specialized agent profile
