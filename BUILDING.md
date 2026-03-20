# Building DotAgents

This guide covers building signed release versions of DotAgents for distribution.

## Prerequisites

- **Node.js 24.x** recommended via `.nvmrc` (**minimum supported:** `20.19.4`)
- **pnpm 9**
- **Rust toolchain** (for the keyboard/input binary)
- **Xcode** (for macOS builds)
- **Apple Developer Account** (for code signing)

## macOS Signed Release Build

### Step 1: Find Your Signing Identity

First, list your available code signing certificates:

```bash
security find-identity -v -p codesigning
```

You'll see output like:
```
1) XXXXXXXX "Apple Development: your@email.com (XXXXXXXX)"
2) XXXXXXXX "Developer ID Application: Your Name (TEAMID)"
3) XXXXXXXX "3rd Party Mac Developer Application: Your Name (TEAMID)"
```

For distribution outside the App Store, you need **"Developer ID Application"**.

### Step 2: Set Environment Variables

**Important:** Use only the name portion WITHOUT the "Developer ID Application:" prefix.

```bash
# ✅ CORRECT - Just the name and team ID
export CSC_NAME="Your Name (TEAMID)"

# ❌ WRONG - Don't include the prefix
# export CSC_NAME="Developer ID Application: Your Name (TEAMID)"
```

**Required variables for signed builds:**
```bash
export CSC_NAME="Your Name (TEAMID)"              # For app signing
export APPLE_DEVELOPER_ID="Your Name (TEAMID)"    # For Rust binary signing  
export ENABLE_HARDENED_RUNTIME=true               # Required for notarization
```

**Additional variables for notarization (recommended for public distribution):**
```bash
export APPLE_TEAM_ID="TEAMID"                     # Your 10-character Team ID
export APPLE_ID="your@email.com"                  # Your Apple ID email
export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"  # From appleid.apple.com
```

**Preferred alternative: App Store Connect API key notarization**
```bash
export APPLE_API_KEY_ID="ABC123DEFG"
export APPLE_API_ISSUER="11111111-2222-3333-4444-555555555555"
export APPLE_API_KEY="$HOME/.config/dotagents/AuthKey_ABC123DEFG.p8"
```

If `APPLE_API_KEY`, `APPLE_API_KEY_ID`, and `APPLE_API_ISSUER` are set, the local desktop release flow will prefer API-key notarization over Apple ID + app-specific password.

When API-key notarization is active, any legacy Apple ID vars are ignored automatically so `electron-builder` does not accidentally choose the older auth path first.

### Step 2.5: Save them in a local shell file

The local desktop release scripts now auto-load release credentials from:

1. `~/.config/dotagents/release.env`
2. `~/.dotagents/release.env`
3. `./.env`
4. `./.env.local`
5. `apps/desktop/.env`
6. `apps/desktop/.env.local`

Example:

```bash
export CSC_NAME="Your Name (TEAMID)"
export APPLE_DEVELOPER_ID="Your Name (TEAMID)"
export ENABLE_HARDENED_RUNTIME=true
export APPLE_TEAM_ID="TEAMID"
export APPLE_ID="your@email.com"
export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"
export APPLE_API_KEY_ID="ABC123DEFG"
export APPLE_API_ISSUER="11111111-2222-3333-4444-555555555555"
export APPLE_API_KEY="$HOME/.config/dotagents/AuthKey_ABC123DEFG.p8"
export GH_TOKEN="ghp_xxx" # optional: publish release assets from your machine
```

If you want to use a different env file, set `DOTAGENTS_RELEASE_ENV_FILE=/path/to/file.env`.

Recommended: keep release credentials in `~/.config/dotagents/release.env` so they never live inside the public repo.

Then source it from your shell config, for example in `~/.zshrc`:

```bash
[ -f "$HOME/.config/dotagents/release.env" ] && source "$HOME/.config/dotagents/release.env"
```

After editing `~/.zshrc`, reload it with `source ~/.zshrc` or open a new shell.

> **Generating App-Specific Password:** Go to https://appleid.apple.com → Sign In → 
> App-Specific Passwords → Generate a password for "DotAgents Notarization"

### Step 3: Build the Rust Binary

```bash
cd apps/desktop
pnpm run build-rs
```

This builds and signs the native keyboard/input binary.

### Step 4: Build the Electron App

```bash
# Build the app (skips type checking for faster builds)
npx electron-vite build

# Build signed DMG, ZIP, and PKG for both Intel and Apple Silicon
npx electron-builder --mac --config electron-builder.config.cjs --publish=never
```

Or use the local desktop release script, which loads `.env` automatically and publishes only when `GH_TOKEN` is set:

```bash
cd apps/desktop
pnpm release
```

### Step 5: Verify Output

Built artifacts will be in `apps/desktop/dist/`:
- `DotAgents-X.X.X-arm64.dmg` - Apple Silicon DMG
- `DotAgents-X.X.X-x64.dmg` - Intel DMG
- `DotAgents-X.X.X-arm64.zip` - Apple Silicon ZIP (for auto-updates)
- `DotAgents-X.X.X-x64.zip` - Intel ZIP
- `DotAgents-X.X.X-arm64.pkg` - Apple Silicon installer
- `DotAgents-X.X.X-x64.pkg` - Intel installer

## Quick One-Liner

For a complete signed build from your local `.env`:

```bash
cd apps/desktop && pnpm release
```

## Troubleshooting

### "Please remove prefix 'Developer ID Application:'"

You included the certificate type prefix. Use just the name:
```bash
# Wrong
export CSC_NAME="Developer ID Application: John Doe (ABC123XYZ)"

# Correct  
export CSC_NAME="John Doe (ABC123XYZ)"
```

### "No identity found for signing"

Your certificate isn't installed or doesn't match. Run:
```bash
security find-identity -v -p codesigning
```

### "Notarization skipped"

This happens when `APPLE_TEAM_ID`, `APPLE_ID`, or `APPLE_APP_SPECIFIC_PASSWORD` aren't set. 
The app will still be signed but users may see Gatekeeper warnings on first launch.

### TypeScript errors during build

The `pnpm build:mac:signed` command runs type checking which may fail due to dependency 
version mismatches. Use the direct commands above which skip type checking:
```bash
npx electron-vite build  # Builds without type checking
npx electron-builder --mac --config electron-builder.config.cjs --publish=never
```

## Using the Build Script

For convenience, there's a build script that handles all platforms:

```bash
# Build all platforms locally
./scripts/build-release.sh

# macOS only (loads .env automatically)
./scripts/build-release.sh --mac-only

# Skip specific platforms
./scripts/build-release.sh --skip-ios --skip-android
```

The local desktop release flow is intentionally local-first; the repo no longer relies on GitHub Actions to produce desktop release artifacts.

