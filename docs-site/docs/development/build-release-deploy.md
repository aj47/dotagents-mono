---
sidebar_position: 4
sidebar_label: "Build, Release, Deploy"
---

# Build, Release, Deploy

This page is the canonical build and release map for DotAgents. Use it when producing desktop artifacts, mobile builds, docs builds, web deployments, or GitHub Actions artifacts.

---

## Local Build Model

DotAgents is a pnpm monorepo with Electron desktop, Expo mobile, shared packages, and a Docusaurus docs site that also serves as the primary website.

Root build scripts:

| Command | What it does |
|---------|--------------|
| `pnpm build` | Builds `@dotagents/shared`, `@dotagents/core`, then the desktop app. |
| `pnpm build:shared` | Builds `packages/shared`. Run this before `pnpm dev` after changing shared code. |
| `pnpm build:core` | Builds `packages/core`. |
| `pnpm test` | Runs package test scripts recursively. |
| `pnpm typecheck` | Runs package typechecks recursively. |
| `pnpm lint` | Runs package lint scripts recursively. |
| `pnpm docs:coverage` | Verifies source-to-doc coverage and remote route documentation. |

## Desktop Development Builds

Desktop package scripts live in `apps/desktop/package.json`.

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Root shortcut for `@dotagents/desktop dev`. Builds workspace deps and ensures the Rust helper binary first. |
| `pnpm --filter @dotagents/desktop build-rs` | Builds the Rust keyboard/input helper. |
| `pnpm --filter @dotagents/desktop build` | Runs desktop typecheck, tests, Electron build, and Rust build. |
| `pnpm --filter @dotagents/desktop build:unpack` | Builds and creates an unpacked Electron app directory. |
| `pnpm --filter @dotagents/desktop start` | Runs `electron-vite preview` against built output. |

Desktop builds depend on packaged workspace packages:

```bash
pnpm --filter @dotagents/shared build
pnpm --filter @dotagents/core build
pnpm --filter @dotagents/mcp-whatsapp build
```

The package scripts `build:workspace-deps` and `build:packaged-workspaces` wrap those steps.

## Desktop Release Builds

### Cross-Platform Script

Use the desktop-local release script for local-first desktop releases:

```bash
cd apps/desktop
pnpm release
```

It loads release env files, rebuilds workspace packages, builds the Rust binary, and runs the platform-specific Electron packaging path. Publish mode is:

| Env | Behavior |
|-----|----------|
| `DOTAGENTS_PUBLISH` | Explicit `electron-builder` publish mode. |
| `GH_TOKEN` set | Defaults to `publish=always`. |
| no `GH_TOKEN` | Defaults to `publish=never`. |

### Release Env Files

Release scripts load env files in this order unless `DOTAGENTS_RELEASE_ENV_FILE` is set:

1. `~/.config/dotagents/release.env`
2. `~/.dotagents/release.env`
3. repo `.env`
4. repo `.env.local`
5. `apps/desktop/.env`
6. `apps/desktop/.env.local`

Keep credentials outside the repo when possible:

```bash
export DOTAGENTS_RELEASE_ENV_FILE="$HOME/.config/dotagents/release.env"
```

### macOS Signing and Notarization

Find your Developer ID signing identity:

```bash
security find-identity -v -p codesigning
```

Use only the certificate name and team ID, without the `Developer ID Application:` prefix:

```bash
export CSC_NAME="Your Name (TEAMID)"
export APPLE_DEVELOPER_ID="Your Name (TEAMID)"
export ENABLE_HARDENED_RUNTIME=true
```

For notarization, prefer App Store Connect API key auth:

```bash
export APPLE_API_KEY_ID="ABC123DEFG"
export APPLE_API_ISSUER="11111111-2222-3333-4444-555555555555"
export APPLE_API_KEY="$HOME/.config/dotagents/AuthKey_ABC123DEFG.p8"
```

If API key auth is not set, use Apple ID credentials:

```bash
export APPLE_TEAM_ID="TEAMID"
export APPLE_ID="you@example.com"
export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"
```

When API key auth is active, the release script unsets the legacy Apple ID variables so `electron-builder` uses API-key notarization.

macOS package scripts:

| Command | Purpose |
|---------|---------|
| `pnpm --filter @dotagents/desktop build:mac` | Builds macOS artifacts without the full signed release validation path. |
| `pnpm --filter @dotagents/desktop build:mac:signed` | Runs packaged workspace builds, desktop build, and macOS `electron-builder --publish=never`. |
| `pnpm --filter @dotagents/desktop build:mac:universal` | Builds a universal macOS app. |
| `pnpm --filter @dotagents/desktop build:mas` | Builds Mac App Store artifacts. |
| `pnpm --filter @dotagents/desktop build:mas:dev` | Builds MAS development artifacts. |

### Windows Packaging

Windows package scripts:

| Command | Purpose |
|---------|---------|
| `pnpm --filter @dotagents/desktop build:win` | Build and package Windows artifacts. |
| `pnpm --filter @dotagents/desktop build:win:skip-types` | Package Windows artifacts after Vite/Rust build, skipping desktop typecheck/test. |
| `pnpm --filter @dotagents/desktop build:win:clean` | Windows clean build PowerShell wrapper. |
| `pnpm --filter @dotagents/desktop build:win:clean:skip-types` | Clean Windows build wrapper with typecheck/test skipped. |

If Electron native dependencies are missing on Windows:

```powershell
pnpm install --ignore-scripts
pnpm.cmd -C apps/desktop exec electron-builder install-app-deps
```

### Linux Packaging

Linux package scripts use `apps/desktop/scripts/build-linux.ts`.

| Command | Purpose |
|---------|---------|
| `pnpm --filter @dotagents/desktop build:linux` | Build current host architecture. |
| `pnpm --filter @dotagents/desktop build:linux:x64` | Build Linux x64 artifacts. |
| `pnpm --filter @dotagents/desktop build:linux:arm64` | Build Linux ARM64 artifacts. |
| `pnpm --filter @dotagents/desktop build:linux:release` | Release-style current-arch build with `--publish never`. |
| `pnpm --filter @dotagents/desktop build:linux:release:x64` | Release-style x64 build with `--publish never`. |
| `pnpm --filter @dotagents/desktop build:linux:release:arm64` | Release-style ARM64 build with `--publish never`. |

The Linux builder supports:

```bash
pnpm exec tsx scripts/build-linux.ts --arch current --publish never --formats AppImage,deb
pnpm exec tsx scripts/build-linux.ts --arch x64 --no-clean
```

Required Linux packaging tools include `dpkg-deb`; GitHub Actions also installs `dpkg-dev`, `fakeroot`, `libarchive-tools`, and `rpm`.

See the root Linux support docs for release acceptance criteria:

- `LINUX_SUPPORT_MATRIX.md`
- `LINUX_PARITY_CHECKLIST.md`
- `LINUX_X64_VALIDATION.md`

## Root Release Script

The root `scripts/build-release.sh` script predates the desktop-local release script and can build desktop macOS plus mobile iOS/Android artifacts when the required platform tooling and signing env are present.

Examples:

```bash
./scripts/build-release.sh
./scripts/build-release.sh --mac-only
./scripts/build-release.sh --skip-ios --skip-android
```

Use `apps/desktop && pnpm release` for normal desktop release work. Use the root script only when you intentionally need its mobile packaging paths.

## Mobile Builds

Mobile development commands:

```bash
pnpm --filter @dotagents/mobile start
pnpm --filter @dotagents/mobile web
pnpm --filter @dotagents/mobile ios
pnpm --filter @dotagents/mobile android
```

Native iOS/Android builds require a development build because the app uses `expo-speech-recognition`, which Expo Go does not include.

Android push notifications also require local Firebase Android app config in `apps/mobile/android/app/google-services.json` and an Expo/EAS Android FCM V1 credential for `com.aj47.dotagents`. Keep Firebase config files and service-account private keys out of the repo; see `apps/mobile/README.md` for setup and rotation steps.

The root release script has mobile package paths for IPA/APK builds, but mobile release signing requires platform-specific Apple/Android credentials and native tooling.

## Docs Site

The docs site is a pnpm workspace package at `docs-site`:

```bash
pnpm --filter docs-site start
pnpm --filter docs-site build
pnpm --filter docs-site typecheck
```

Before merging docs changes:

```bash
pnpm docs:coverage
pnpm --filter docs-site build
```

`dotagents.app` is deployed by `.github/workflows/deploy-docs.yml`. On pushes to `main` that touch docs, the workflow installs from the root lockfile, runs `pnpm docs:coverage`, builds `docs-site`, uploads `docs-site/build` to the Cloudflare Pages project `dotagents-docs`, and attempts to sync the `dotagents.app` / `www.dotagents.app` DNS records to `dotagents-docs.pages.dev`.

The `CLOUDFLARE_API_TOKEN` secret must include Cloudflare Pages edit plus Zone DNS edit for `dotagents.app` before the DNS sync can complete. Without DNS edit permission, the workflow still deploys the docs build and emits a warning; the custom domains stay pending until the DNS records are updated manually or the token scope is expanded and the workflow is rerun.

## Web Deployments

There are two different web surfaces:

| Surface | Source | Deployment path |
|---------|--------|-----------------|
| Primary website and docs | `docs-site/` | GitHub Actions workflow `.github/workflows/deploy-docs.yml` builds Docusaurus and deploys Cloudflare Pages project `dotagents-docs` at `dotagents.app`. |
| Expo mobile web app | `apps/mobile` | GitHub Actions workflow `.github/workflows/deploy-mobile-web.yml` exports Expo web to `apps/mobile/dist` and deploys Cloudflare Pages project `dotagents-app`. |

The deploy-docs workflow runs on pushes to `main` that touch `docs-site/**`, docs coverage tooling, or the docs deploy workflow itself. It can also be run manually with `workflow_dispatch`.

The deploy-mobile-web workflow runs on pushes to `main` that touch `apps/mobile/**` or `packages/shared/**`, and can also be run manually with `workflow_dispatch`.

## GitHub Actions Artifacts

`.github/workflows/desktop-release-artifacts.yml` builds unsigned Windows and Linux desktop artifacts for release branches or manual dispatch.

| Job | Platform | Output |
|-----|----------|--------|
| `build-windows` | `windows-latest` | `.exe`, `.msi`, `.zip`, blockmaps, latest YAML, `SHA256SUMS` |
| `build-linux` | `ubuntu-latest` | `.AppImage`, `.deb`, `linux-release-manifest.json`, `SHA256SUMS` |

This workflow intentionally uploads GitHub Actions artifacts and passes `--publish never`; it does not publish desktop releases by itself.

## Verification Checklist

Before calling a build/release docs change complete:

1. Confirm package scripts in this page match `package.json`, `apps/desktop/package.json`, `apps/mobile/package.json`, and `docs-site/package.json`.
2. Confirm GitHub Actions descriptions match `.github/workflows/*.yml`.
3. Run:

```bash
pnpm docs:coverage
pnpm --filter docs-site build
```

4. For release code changes, also run the package-specific build or packaging command you changed.
