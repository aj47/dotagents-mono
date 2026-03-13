# Development Setup

Everything you need to build DotAgents from source.

---

## Prerequisites

| Requirement | Version | Purpose |
|-------------|---------|---------|
| **Node.js** | 24.x recommended (min: 20.19.4) | Runtime |
| **pnpm** | 9.x | Package manager (required) |
| **Rust** | Latest stable | Native keyboard/input binary |
| **Xcode** | Latest (macOS only) | Code signing |

> **pnpm is required.** Using npm or yarn will cause installation issues.

```bash
npm install -g pnpm
```

## Quick Start

```bash
git clone https://github.com/aj47/dotagents-mono.git
cd dotagents-mono
nvm use
pnpm install
pnpm build-rs    # Build Rust native binary
pnpm dev         # Start development server
```

## Build Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server (desktop) |
| `pnpm dev:mobile` | Start development server (mobile, Expo) |
| `pnpm build` | Production build for current platform |
| `pnpm build:mac` | macOS build (Apple Silicon + Intel universal) |
| `pnpm build:win` | Windows build (x64) |
| `pnpm build:linux` | Linux build for host architecture |
| `pnpm --filter @dotagents/desktop build:linux:x64` | Linux x64 build |
| `pnpm --filter @dotagents/desktop build:linux:arm64` | Linux ARM64 build |
| `pnpm build-rs` | Build Rust native binary |
| `pnpm test` | Run test suite |
| `pnpm test:run` | Run tests once (CI mode) |
| `pnpm test:coverage` | Run tests with coverage |
| `pnpm typecheck` | TypeScript type checking |
| `pnpm lint` | ESLint across all packages |

## Debug Mode

```bash
pnpm dev d               # ALL debug logging
pnpm dev debug-llm       # LLM calls and responses
pnpm dev debug-tools     # MCP tool execution
pnpm dev debug-ui        # UI state changes
```

See [Debug Reference](../reference/debug.md) for details.

## Docker

Build Linux packages in a consistent environment:

```bash
docker compose run --rm build-linux         # Build Linux packages
docker compose run --rm --build build-linux # Rebuild after code changes
docker compose run --rm shell               # Interactive dev shell
```

## Linux Architecture-Specific Builds

```bash
pnpm --filter @dotagents/desktop build:linux:x64
pnpm --filter @dotagents/desktop build:linux:arm64
```

Override packaging targets:

```bash
DOTAGENTS_LINUX_TARGETS=AppImage,deb pnpm --filter @dotagents/desktop build:linux:arm64
```

## Mobile Development

```bash
cd apps/mobile
npm install
npm run start                 # Start Metro bundler
npx expo run:ios             # iOS (requires Xcode)
npx expo run:android         # Android (requires Android Studio)
npx expo start --web         # Web
```

## Testing

```bash
pnpm test                    # Watch mode
pnpm test:run                # Single run (CI)
pnpm test:coverage           # With coverage report
```

Tests use **Vitest** and are located alongside source files as `*.test.ts` and `*.test.tsx`.

## Troubleshooting

### "Electron uninstall" error

```bash
rm -rf node_modules && pnpm install
```

### Multiple lock files

```bash
rm -f package-lock.json bun.lock
rm -rf node_modules && pnpm install
```

### Windows: "not a valid Win32 application"

```powershell
pnpm install --ignore-scripts
pnpm.cmd -C apps/desktop exec electron-builder install-app-deps
```

### Node version mismatch

```bash
nvm use    # Uses .nvmrc (24.1.0)
```

---

## Next Steps

- **[Architecture Deep Dive](architecture.md)** — Technical details for contributors
- **[Contributing](contributing.md)** — How to contribute
