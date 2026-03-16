# Development Guide

## Prerequisites

- **Node.js 24.x** recommended via `.nvmrc` (**minimum supported:** `20.19.4`)
- **pnpm 9** (required package manager)
- **Rust toolchain** for the native keyboard/input binary
- **Xcode** (macOS only) for code signing

> ⚠️ **Important**: This project uses **pnpm**. Using npm or yarn may cause installation issues.
> ```bash
> npm install -g pnpm
> ```

## Quick Start

```bash
git clone https://github.com/aj47/dotagents-mono.git
cd dotagents-mono
nvm use
pnpm install
pnpm build-rs  # Build Rust binary
pnpm dev       # Start development server
```

## Build Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Production build for current platform |
| `pnpm build:mac` | macOS build (Apple Silicon + Intel) |
| `pnpm build:win` | Windows build (x64) |
| `pnpm build:linux` | Linux build for the current host architecture |
| `pnpm --filter @dotagents/desktop build:linux:x64` | Linux build targeting `x64` |
| `pnpm --filter @dotagents/desktop build:linux:arm64` | Linux build targeting `arm64` |
| `pnpm test` | Run test suite |
| `pnpm test:run` | Run tests once (CI mode) |
| `pnpm test:coverage` | Run tests with coverage |

For signed release builds, see [BUILDING.md](BUILDING.md).
For Linux release goals and acceptance criteria, see [LINUX_SUPPORT_MATRIX.md](LINUX_SUPPORT_MATRIX.md)
and [LINUX_PARITY_CHECKLIST.md](LINUX_PARITY_CHECKLIST.md).

## Docker Support

Docker is useful for building Linux packages in a consistent environment:

```bash
docker compose run --rm build-linux       # Build Linux packages
docker compose run --rm --build build-linux  # Rebuild after code changes
docker compose run --rm shell             # Interactive development shell
```

> **Note**: DotAgents is an Electron desktop app that requires a display. Docker is primarily for building Linux packages.

## Architecture-specific Linux Build Notes

- Use the desktop package scripts below to produce Linux artifacts for a specific architecture:

```bash
pnpm --filter @dotagents/desktop build:linux:x64
pnpm --filter @dotagents/desktop build:linux:arm64
```

- For release-style local packaging without publishing, use the `build:linux:release:*` variants.
- If you need to override Linux packaging targets manually, set `DOTAGENTS_LINUX_TARGETS` (comma-separated):

```bash
DOTAGENTS_LINUX_TARGETS=AppImage,deb pnpm --filter @dotagents/desktop build:linux:arm64
```

- Architecture-specific release policy and parity requirements live in
  [LINUX_SUPPORT_MATRIX.md](LINUX_SUPPORT_MATRIX.md).

## Debug Mode

Enable comprehensive debug logging for development:

```bash
pnpm dev d               # Enable ALL debug logging
pnpm dev debug-llm       # LLM calls and responses only
pnpm dev debug-tools     # MCP tool execution only
pnpm dev debug-ui        # UI focus and state changes
```

See [apps/desktop/DEBUGGING.md](apps/desktop/DEBUGGING.md) for detailed debugging instructions.

## Project Structure

```
DotAgents/
├── apps/
│   ├── desktop/         # Electron desktop application
│   │   ├── src/main/    # Main process (MCP, TTS, system integration)
│   │   ├── src/renderer/# React UI
│   │   └── speakmcp-rs/ # Rust keyboard/input binary
│   └── mobile/          # React Native mobile app (Expo)
├── packages/
│   └── shared/          # Shared utilities and types
└── scripts/             # Build and release scripts
```

## Troubleshooting

### "Electron uninstall" error

Electron binaries weren't installed correctly:

```bash
rm -rf node_modules
pnpm install
```

### Multiple lock files

You've mixed package managers:

```bash
rm -f package-lock.json bun.lock
rm -rf node_modules
pnpm install
```

### Windows: "not a valid Win32 application"

If `pnpm install` fails with this error:

```powershell
pnpm install --ignore-scripts
pnpm.cmd -C apps/desktop exec electron-builder install-app-deps
```

### Node version mismatch

This project is tested with Node.js 24.x and requires at least Node.js 20.19.4:

```bash
node --version  # Recommended: v24.x
nvm use         # Uses the repo's .nvmrc (24.1.0)
```

## Architecture

| Component | Technology | Purpose |
|-----------|------------|---------|
| Desktop App | Electron | System integration, MCP orchestration, TTS |
| UI | React + TypeScript | Real-time progress tracking, conversation management |
| Native Binary | Rust | Keyboard monitoring, text injection |
| MCP Client | TypeScript | Model Context Protocol with OAuth 2.1 |
| AI Providers | OpenAI, Groq, Gemini | Speech recognition, LLM, TTS |
| Multi-Agent | ACP | Task delegation to specialized sub-agents |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `pnpm test`
5. Open a Pull Request

**💬 Get help on [Discord](https://discord.gg/cK9WeQ7jPq)** | **🌐 More info at [techfren.net](https://techfren.net)**

