---
sidebar_position: 1
sidebar_label: "Installation"
---

# Installation

Get DotAgents running on your machine in minutes.

---

## One-Line Install

The fastest way to get DotAgents on any machine:

```bash
# macOS / Linux
curl -fsSL https://raw.githubusercontent.com/aj47/dotagents-mono/main/scripts/install.sh | bash
```

```powershell
# Windows PowerShell
irm https://raw.githubusercontent.com/aj47/dotagents-mono/main/scripts/install.ps1 | iex
```

These installers auto-detect your OS and architecture, download the correct release artifact, and install DotAgents without assuming Git, Node, pnpm, or Rust are already installed. Building from source is still available, but it is now an explicit opt-in.

Prefer a manual download? Use the latest release page for **[macOS](https://github.com/aj47/dotagents-mono/releases/latest)**, **[Windows](https://github.com/aj47/dotagents-mono/releases/latest)**, or **[Linux](https://github.com/aj47/dotagents-mono/releases/latest)** artifacts.

**Options:**

```bash
# Force a source install instead of downloading a release (macOS / Linux)
curl -fsSL https://raw.githubusercontent.com/aj47/dotagents-mono/main/scripts/install.sh | DOTAGENTS_FROM_SOURCE=1 bash

# Custom install directory (default: ~/.dotagents)
curl -fsSL https://raw.githubusercontent.com/aj47/dotagents-mono/main/scripts/install.sh | DOTAGENTS_DIR=~/my-agents bash
```

```powershell
# Force a source install on Windows
$env:DOTAGENTS_FROM_SOURCE = '1'; irm https://raw.githubusercontent.com/aj47/dotagents-mono/main/scripts/install.ps1 | iex

# Custom install directory on Windows
$env:DOTAGENTS_DIR = "$HOME\dotagents"; irm https://raw.githubusercontent.com/aj47/dotagents-mono/main/scripts/install.ps1 | iex
```

---

## Desktop App

### Download Pre-built Release

Alternatively, download manually:

**[Download Latest Release](https://github.com/aj47/dotagents-mono/releases/latest)**

| Platform | Architecture | Format | Link |
|----------|-------------|--------|------|
| **macOS** | Apple Silicon (M1/M2/M3/M4) | `.dmg` | [Latest macOS release](https://github.com/aj47/dotagents-mono/releases/latest) |
| **macOS** | Intel | `.dmg` | [Latest macOS release](https://github.com/aj47/dotagents-mono/releases/latest) |
| **Windows** | x64 | `.exe` installer | [Latest Windows release](https://github.com/aj47/dotagents-mono/releases/latest) |
| **Linux** | x64 | `.AppImage`, `.deb` | [Latest Linux release](https://github.com/aj47/dotagents-mono/releases/latest) |
| **Linux** | ARM64 | `.AppImage`, `.deb` | [Latest Linux release](https://github.com/aj47/dotagents-mono/releases/latest) |

### macOS

1. Download the `.dmg` file from the releases page
2. Open the `.dmg` and drag DotAgents to your Applications folder
3. On first launch, right-click the app and select "Open" to bypass Gatekeeper
4. Grant accessibility permissions when prompted (required for voice recording and text injection)

### Windows

1. Download the `.exe` installer from the releases page
2. Run the installer and follow the setup wizard
3. DotAgents will appear in your Start menu

Windows builds include the desktop app, voice shortcuts, text input, provider setup, and agent features. Some OS-level integrations may differ from macOS; see the in-app diagnostics if a native permission or tool integration is unavailable.

### Linux

1. Download the `.AppImage` or `.deb` package for your architecture
2. For AppImage: `chmod +x DotAgents-*.AppImage && ./DotAgents-*.AppImage`
3. For deb: `sudo dpkg -i dotagents-*.deb`

See the [Linux Support Matrix](https://github.com/aj47/dotagents-mono/blob/main/LINUX_SUPPORT_MATRIX.md) for detailed platform compatibility.

---

## Uninstall

### Linux one-line install

If you installed with the one-line installer, remove the app files and launcher:

```bash
rm -rf ~/.dotagents
rm -f ~/.local/bin/dotagents
```

If you used the Linux source/headless flow or VPS installer and created a systemd service, stop and remove it first:

```bash
sudo systemctl stop dotagents 2>/dev/null || true
sudo systemctl disable dotagents 2>/dev/null || true
sudo rm -f /etc/systemd/system/dotagents.service
sudo systemctl daemon-reload
sudo rm -f /usr/local/bin/dotagents
rm -rf ~/dotagents ~/.dotagents
rm -f ~/.local/bin/dotagents
```

If you installed the `.deb` package manually, uninstall the package instead:

```bash
sudo apt remove dotagents
```

### macOS

Remove the app bundle:

```bash
rm -rf /Applications/DotAgents.app ~/Applications/DotAgents.app ~/.dotagents
```

### Windows

Use **Settings → Apps → Installed apps → DotAgents → Uninstall**.

### Remove local configuration and app data

The uninstall steps above keep your DotAgents settings, local conversations, and app data where the operating system stores application data. To fully reset DotAgents, remove the data directory for your platform:

```bash
# Linux
rm -rf ~/.config/app.dotagents

# macOS
rm -rf "$HOME/Library/Application Support/app.dotagents"
```

On Windows, remove `%APPDATA%\app.dotagents` from File Explorer or PowerShell if you want to delete local settings and data.

---

## Mobile App

The DotAgents mobile app connects to your desktop instance or any OpenAI-compatible API endpoint.

### Prerequisites

- Node.js 20.19.4+ (Node 24.x recommended via `.nvmrc`)
- pnpm 9.x
- For native builds: Xcode (iOS) or Android Studio (Android)

### Install from Source

```bash
git clone https://github.com/aj47/dotagents-mono.git
cd dotagents-mono
nvm use
pnpm install
```

### Run on Device

```bash
# Start Metro bundler
pnpm --filter @dotagents/mobile start

# Or run directly on a device/simulator
pnpm --filter @dotagents/mobile ios      # iOS (requires Xcode)
pnpm --filter @dotagents/mobile android  # Android (requires Android Studio)
```

> **Important**: The mobile app uses `expo-speech-recognition`, a native module not available in Expo Go. You must use a **development build** to run on physical devices. See the [Mobile App guide](/mobile/overview) for details.

### Web

The mobile app also runs in the browser:

```bash
pnpm --filter @dotagents/mobile web
```

Speech recognition on web requires Chrome or Edge over HTTPS.

---

## Running from Source

For contributors, or if you want the bleeding-edge development version.

### Prerequisites

| Tool | Version | Install |
|------|---------|--------|
| **Node.js** | 24.x recommended (min 20.19.4) | [nodejs.org](https://nodejs.org) or `nvm use` |
| **pnpm** | 9.x | `npm i -g pnpm` |
| **Rust** | stable (optional — needed for voice input binary) | `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh` |
| **Xcode** | latest (macOS only, for code signing) | Mac App Store |

> **pnpm is required.** npm and yarn are not supported.

### Clone & Run

```bash
git clone https://github.com/aj47/dotagents-mono.git
cd dotagents-mono
nvm use                  # uses .nvmrc → Node 24.x
pnpm install
pnpm build:shared        # build the shared package first
pnpm dev                 # start the desktop app in dev mode
```

### Build the Rust Native Binary (optional)

The Rust binary powers native keyboard input and voice recording. Without it the app still runs, but those features won't work.

```bash
pnpm --filter @dotagents/desktop build-rs
```

### Production Builds

```bash
pnpm build                                      # current platform desktop build
pnpm --filter @dotagents/desktop build:mac      # macOS (Apple Silicon + Intel universal)
pnpm --filter @dotagents/desktop build:win      # Windows (x64)
pnpm --filter @dotagents/desktop build:linux    # Linux (host architecture)
```

### Updating

```bash
cd dotagents-mono
git pull
pnpm install
pnpm build:shared
pnpm dev
```

See the [Development Setup guide](/development/setup) for Docker builds, debug flags, and troubleshooting.

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

- **[Quick Start](quickstart)** — Configure your first AI provider and start chatting
- **[Your First Agent](first-agent)** — Create a specialized agent profile
