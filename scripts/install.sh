#!/usr/bin/env bash
# DotAgents installer for macOS, Linux, and Windows shells with Bash available.
# Preferred usage:
#   macOS / Linux: curl -fsSL https://raw.githubusercontent.com/aj47/dotagents-mono/main/scripts/install.sh | bash
#   Windows: use scripts/install.ps1 with PowerShell for the native one-line install flow.
#
# Options (via env vars):
#   DOTAGENTS_FROM_SOURCE=1   Build from source instead of downloading a release
#   DOTAGENTS_DIR=~/mydir     Custom install directory (default: ~/.dotagents)
#   DOTAGENTS_RELEASE_TAG=v1  Install a specific GitHub release tag
#   DOTAGENTS_NODE_MAJOR=24    Node.js major to install for Linux source installs
#   DOTAGENTS_INSTALL_RUST=0   Skip auto-installing Rust for Linux source installs
#   DOTAGENTS_SKIP_ONBOARDING=1 Skip Linux source headless onboarding
#   DOTAGENTS_AUTH_MODE=codex  Headless onboarding auth mode: provider, codex, or skip
#   DOTAGENTS_INSTALL_ACPX=0  Skip installing acpx when using codex auth mode
#   DOTAGENTS_INSTALL_CODEX=0 Skip installing Codex CLI when using codex auth mode
#   DOTAGENTS_CODEX_LOGIN=0   Skip Codex ChatGPT OAuth login during onboarding

INTERACTIVE=false
HAS_TTY=false
if [[ -t 0 ]]; then
  INTERACTIVE=true
elif [ -e /dev/tty ] && (: < /dev/tty) 2>/dev/null; then
  INTERACTIVE=true
  HAS_TTY=true
fi

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[0;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

info()  { printf "${CYAN}▸${NC} %s\n" "$*"; }
ok()    { printf "${GREEN}✔${NC} %s\n" "$*"; }
warn()  { printf "${YELLOW}⚠${NC} %s\n" "$*"; }
err()   { printf "${RED}✘${NC} %s\n" "$*" >&2; }
die()   { err "$*"; exit 1; }
has()   { command -v "$1" >/dev/null 2>&1; }

ask() {
  local prompt="$1" env_var="${2:-}" default="${3:-}" value=""
  if [ -n "$env_var" ] && [ -n "${!env_var:-}" ]; then
    printf '%s\n' "${!env_var}"
    return 0
  fi
  if [ "$INTERACTIVE" != "true" ]; then
    printf '%s\n' "$default"
    return 0
  fi
  if [ "$HAS_TTY" = "true" ]; then
    read -r -p "$(printf "${CYAN}?${NC} %s" "$prompt")" value < /dev/tty
  else
    read -r -p "$(printf "${CYAN}?${NC} %s" "$prompt")" value
  fi
  printf '%s\n' "${value:-$default}"
}

ensure_cmd() {
  local command="$1"
  local help_text="${2:-Install '$command' and try again.}"
  has "$command" || die "Required command '$command' not found. $help_text"
}

run_as_root() {
  if [ "$(id -u)" -eq 0 ]; then
    "$@"
  else
    ensure_cmd sudo "Install sudo or run this installer as root."
    sudo "$@"
  fi
}

version_ge() {
  local version="$1" minimum="$2"
  local major minor patch min_major min_minor min_patch

  IFS=. read -r major minor patch <<< "$version"
  IFS=. read -r min_major min_minor min_patch <<< "$minimum"
  minor="${minor:-0}"; patch="${patch:-0}"
  min_minor="${min_minor:-0}"; min_patch="${min_patch:-0}"

  [ "$major" -gt "$min_major" ] || \
    { [ "$major" -eq "$min_major" ] && [ "$minor" -gt "$min_minor" ]; } || \
    { [ "$major" -eq "$min_major" ] && [ "$minor" -eq "$min_minor" ] && [ "$patch" -ge "$min_patch" ]; }
}

INSTALL_DIR="${DOTAGENTS_DIR:-$HOME/.dotagents}"
REPO="aj47/dotagents-mono"
REPO_URL="https://github.com/$REPO"
API_BASE_URL="https://api.github.com/repos/$REPO/releases"
FROM_SOURCE="${DOTAGENTS_FROM_SOURCE:-0}"
RELEASE_TAG="${DOTAGENTS_RELEASE_TAG:-latest}"
TAG=""
ASSET_URLS=""
PNPM_CMD=()
MIN_NODE_VERSION="20.19.4"
SOURCE_NODE_MAJOR="${DOTAGENTS_NODE_MAJOR:-24}"
INSTALL_RUST="${DOTAGENTS_INSTALL_RUST:-1}"
SKIP_ONBOARDING="${DOTAGENTS_SKIP_ONBOARDING:-0}"
AUTH_MODE="${DOTAGENTS_AUTH_MODE:-}"
CONFIG_DIR="$HOME/.config/app.dotagents"
CONFIG_FILE="$CONFIG_DIR/config.json"

detect_platform() {
  local os arch
  os="$(uname -s)"
  arch="$(uname -m)"

  case "$os" in
    Darwin) PLATFORM="mac" ;;
    Linux) PLATFORM="linux" ;;
    MINGW*|MSYS*|CYGWIN*) PLATFORM="win" ;;
    *) die "Unsupported OS: $os" ;;
  esac

  case "$arch" in
    x86_64|amd64) ARCH="x64" ;;
    arm64|aarch64) ARCH="arm64" ;;
    *) die "Unsupported architecture: $arch" ;;
  esac
}

extract_tag_name() {
  printf '%s' "$1" | grep -Eo '"tag_name"[[:space:]]*:[[:space:]]*"[^"]+"' | head -n 1 | sed -E 's/.*"([^"]+)"/\1/'
}

extract_download_urls() {
  printf '%s' "$1" | grep -Eo '"browser_download_url"[[:space:]]*:[[:space:]]*"[^"]+"' | sed -E 's/.*"([^"]+)"/\1/'
}

fetch_release_metadata() {
  ensure_cmd curl "Install curl first."

  local api_url release_json
  if [ "$RELEASE_TAG" = "latest" ]; then
    api_url="$API_BASE_URL/latest"
  else
    api_url="$API_BASE_URL/tags/$RELEASE_TAG"
  fi

  info "Fetching release metadata from GitHub..."
  release_json="$(curl -fsSL -H 'Accept: application/vnd.github+json' "$api_url")" || die "Failed to fetch release metadata from GitHub."
  TAG="$(extract_tag_name "$release_json")"
  ASSET_URLS="$(extract_download_urls "$release_json")"

  [ -n "$TAG" ] || die "Could not determine the release tag from GitHub."
  [ -n "$ASSET_URLS" ] || die "No downloadable assets were found on release $TAG."
}

find_asset_url() {
  local pattern="$1"
  local url

  while IFS= read -r url; do
    [ -n "$url" ] || continue
    if [[ "$url" == $pattern ]]; then
      printf '%s\n' "$url"
      return 0
    fi
  done <<< "$ASSET_URLS"

  return 1
}

select_release_asset_url() {
  local asset_arch="$ARCH"
  local asset_url=""

  case "$PLATFORM" in
    mac)
      asset_url="$(find_asset_url "*/DotAgents-*-${asset_arch}.dmg" || true)"
      ;;
    linux)
      asset_url="$(find_asset_url "*/DotAgents-*-${asset_arch}.AppImage" || true)"
      ;;
    win)
      if [ "$asset_arch" != "x64" ]; then
        warn "Windows releases are currently published as x64 installers. Falling back to x64."
        asset_arch="x64"
      fi
      asset_url="$(find_asset_url '*/DotAgents-*-setup.exe' || true)"
      if [ -z "$asset_url" ]; then
        asset_url="$(find_asset_url "*/DotAgents-*-${asset_arch}-portable.exe" || true)"
      fi
      ;;
  esac

  [ -n "$asset_url" ] || die "No matching release asset found for $PLATFORM/$ARCH on $TAG."
  printf '%s\n' "$asset_url"
}

download_file() {
  local url="$1"
  local destination="$2"

  mkdir -p "$(dirname "$destination")"
  info "Downloading $(basename "$destination")..."
  curl -fL --retry 3 --progress-bar -o "$destination" "$url"
}

ensure_release_requirements() {
  ensure_cmd curl "Install curl first."
  case "$PLATFORM" in
    mac)
      ensure_cmd hdiutil "hdiutil is required on macOS."
      ensure_cmd ditto "ditto is required on macOS."
      ;;
    linux)
      ensure_cmd chmod "chmod is required on Linux."
      ;;
    win)
      ensure_cmd cygpath "Git Bash / MSYS with cygpath is required for the Bash-based Windows path conversion."
      ensure_cmd powershell.exe "Use PowerShell or run the native installer via scripts/install.ps1."
      ;;
  esac
}

install_release_mac() {
  local asset_url="$1"
  local dmg_path mount_dir app_name target_dir app_src app_dest

  dmg_path="$INSTALL_DIR/$(basename "$asset_url")"
  download_file "$asset_url" "$dmg_path"

  info "Mounting DMG..."
  mount_dir="$(hdiutil attach "$dmg_path" -nobrowse -noverify | tail -1 | awk '{print $3}')"
  app_name="$(find "$mount_dir" -maxdepth 1 -type d -name '*.app' -print | head -n 1 | xargs -I{} basename '{}')"

  [ -n "$app_name" ] || {
    hdiutil detach "$mount_dir" -quiet 2>/dev/null || true
    die "No .app bundle found inside $(basename "$dmg_path")."
  }

  if [ -w /Applications ]; then
    target_dir="/Applications"
  else
    target_dir="$HOME/Applications"
    mkdir -p "$target_dir"
  fi

  app_src="$mount_dir/$app_name"
  app_dest="$target_dir/$app_name"
  rm -rf "$app_dest"

  info "Installing $app_name to $target_dir..."
  ditto "$app_src" "$app_dest"
  hdiutil detach "$mount_dir" -quiet
  rm -f "$dmg_path"

  ok "DotAgents installed to $app_dest"
  info "Launch it with: open '$app_dest'"
}

install_release_linux() {
  local asset_url="$1"
  local app_path launcher_path user_bin

  app_path="$INSTALL_DIR/$(basename "$asset_url")"
  launcher_path="$INSTALL_DIR/dotagents"
  user_bin="$HOME/.local/bin"

  download_file "$asset_url" "$app_path"
  chmod +x "$app_path"

  cat > "$launcher_path" <<EOF
#!/usr/bin/env bash
exec "$app_path" "\$@"
EOF
  chmod +x "$launcher_path"

  mkdir -p "$user_bin"
  ln -sf "$launcher_path" "$user_bin/dotagents"

  ok "DotAgents installed to $app_path"
  info "Launcher created at $user_bin/dotagents"
  if [[ ":$PATH:" != *":$user_bin:"* ]]; then
    warn "$user_bin is not currently on your PATH."
    info 'Add it with: export PATH="$HOME/.local/bin:$PATH"'
  else
    info "Run: dotagents"
  fi
}

install_release_windows() {
  local asset_url="$1"
  local installer_path win_installer_path

  installer_path="$INSTALL_DIR/$(basename "$asset_url")"
  download_file "$asset_url" "$installer_path"
  win_installer_path="$(cygpath -w "$installer_path")"

  info "Starting the Windows installer..."
  powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -Wait -FilePath '$win_installer_path' -ArgumentList '/S'"
  ok "DotAgents installer finished."
}

install_release() {
  ensure_release_requirements
  fetch_release_metadata
  info "Using release: $TAG"

  local asset_url
  asset_url="$(select_release_asset_url)"

  case "$PLATFORM" in
    mac) install_release_mac "$asset_url" ;;
    linux) install_release_linux "$asset_url" ;;
    win) install_release_windows "$asset_url" ;;
  esac
}

install_linux_source_system_deps() {
  info "Installing Linux source dependencies..."

  if has apt-get; then
    export DEBIAN_FRONTEND=noninteractive
    run_as_root apt-get update -qq
    run_as_root apt-get install -y -qq \
      git curl ca-certificates build-essential pkg-config \
      libgtk-3-0 libnotify4 libnss3 libxss1 libxtst6 \
      xdg-utils libatspi2.0-0 libuuid1 libsecret-1-0 \
      libasound2t64 libgbm1 xvfb || \
    run_as_root apt-get install -y -qq \
      git curl ca-certificates build-essential pkg-config \
      libgtk-3-0 libnotify4 libnss3 libxss1 libxtst6 \
      xdg-utils libatspi2.0-0 libuuid1 libsecret-1-0 \
      libasound2 libgbm1 xvfb
    ok "Linux source dependencies installed"
    return 0
  fi

  if has dnf; then
    run_as_root dnf install -y -q \
      git curl ca-certificates gcc gcc-c++ make pkg-config \
      gtk3 libnotify nss libXScrnSaver libXtst \
      at-spi2-core libuuid libsecret alsa-lib mesa-libgbm \
      xorg-x11-server-Xvfb
    ok "Linux source dependencies installed"
    return 0
  fi

  warn "Automatic source dependency install currently supports apt-get and dnf only."
}

ensure_node() {
  local node_version=""
  if has node; then
    node_version="$(node -p "process.versions.node" 2>/dev/null || true)"
    if [ -n "$node_version" ] && version_ge "$node_version" "$MIN_NODE_VERSION"; then
      ok "Node.js $node_version found"
      return 0
    fi
    warn "Node.js ${node_version:-unknown} is too old; $MIN_NODE_VERSION+ is required."
  fi

  if [ "$PLATFORM" = "linux" ]; then
    install_linux_node
    node_version="$(node -p "process.versions.node" 2>/dev/null || true)"
    [ -n "$node_version" ] || die "Failed to determine the installed Node.js version."
    version_ge "$node_version" "$MIN_NODE_VERSION" || die "Node.js $MIN_NODE_VERSION+ is required for source installs."
    ok "Node.js $node_version installed"
    return 0
  fi

  die "Node.js $MIN_NODE_VERSION+ is required for source installs."
}

install_linux_node() {
  ensure_cmd curl "Install curl first."

  if has apt-get; then
    info "Installing Node.js ${SOURCE_NODE_MAJOR}.x from NodeSource..."
    curl -fsSL "https://deb.nodesource.com/setup_${SOURCE_NODE_MAJOR}.x" | run_as_root bash -
    run_as_root apt-get install -y -qq nodejs
    return 0
  fi

  if has dnf; then
    info "Installing Node.js ${SOURCE_NODE_MAJOR}.x from NodeSource..."
    curl -fsSL "https://rpm.nodesource.com/setup_${SOURCE_NODE_MAJOR}.x" | run_as_root bash -
    run_as_root dnf install -y -q nodejs
    return 0
  fi

  die "Node.js $MIN_NODE_VERSION+ is required, and automatic Node install supports apt-get and dnf only."
}

install_linux_rust() {
  if has cargo; then
    ok "Rust $(rustc --version 2>/dev/null | awk '{print $2}') found"
    return 0
  fi

  if [ "$INSTALL_RUST" = "0" ]; then
    info "Skipping Rust auto-install because DOTAGENTS_INSTALL_RUST=0."
    return 0
  fi

  ensure_cmd curl "Install curl first."
  info "Installing Rust toolchain with rustup..."
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --quiet
  # shellcheck source=/dev/null
  source "$HOME/.cargo/env" 2>/dev/null || true
  has cargo || die "Rust install finished, but cargo was not found on PATH."
  ok "Rust $(rustc --version 2>/dev/null | awk '{print $2}') installed"
}

ensure_source_requirements() {
  if [ "$PLATFORM" = "linux" ]; then
    install_linux_source_system_deps
  fi

  ensure_cmd git "Install Git first."
  ensure_node

  if [ "$PLATFORM" = "linux" ]; then
    install_linux_rust
  fi
}

resolve_pnpm() {
  if has pnpm; then
    PNPM_CMD=(pnpm)
    return 0
  fi

  if has corepack; then
    info "Enabling pnpm via corepack..."
    corepack enable >/dev/null 2>&1 || true
    if corepack pnpm --version >/dev/null 2>&1; then
      PNPM_CMD=(corepack pnpm)
      return 0
    fi
  fi

  if has npm; then
    info "Installing pnpm with npm..."
    npm install -g pnpm@9 >/dev/null 2>&1 || run_as_root npm install -g pnpm@9 >/dev/null
    PNPM_CMD=(pnpm)
    return 0
  fi

  die "pnpm is required for DOTAGENTS_FROM_SOURCE=1, and neither pnpm, corepack, nor npm was found."
}

run_pnpm() {
  if [ "${#PNPM_CMD[@]}" -eq 2 ]; then
    "${PNPM_CMD[0]}" "${PNPM_CMD[1]}" "$@"
  else
    "${PNPM_CMD[0]}" "$@"
  fi
}

repair_corepack_node_gyp_permissions() {
  [ "$PLATFORM" = "linux" ] || return 0
  [ -d "$HOME/.cache/node/corepack/v1/pnpm" ] || return 0

  local file repaired="false"
  while IFS= read -r file; do
    [ -x "$file" ] && continue
    chmod +x "$file" 2>/dev/null || true
    [ -x "$file" ] && repaired="true"
  done < <(find "$HOME/.cache/node/corepack/v1/pnpm" -path '*/node-gyp/gyp/gyp_main.py' -type f 2>/dev/null)

  if [ "$repaired" = "true" ]; then
    ok "Repaired Corepack node-gyp permissions"
  fi
}

build_linux_headless_app() {
  [ "$PLATFORM" = "linux" ] || return 0

  info "Building Electron app for headless CLI..."
  run_pnpm --filter @dotagents/desktop exec electron-vite build
}

build_source_workspace_packages() {
  info "Building shared workspace package..."
  run_pnpm build:shared

  info "Building core workspace package..."
  run_pnpm build:core

  info "Building WhatsApp MCP workspace package..."
  run_pnpm --filter @dotagents/mcp-whatsapp build
}

setup_linux_headless_cli() {
  [ "$PLATFORM" = "linux" ] || return 0

  local repo_dir electron_bin app_main launcher_path user_bin
  repo_dir="$INSTALL_DIR/repo"
  electron_bin="$repo_dir/node_modules/electron/dist/electron"
  app_main="$repo_dir/apps/desktop/out/main/index.js"
  launcher_path="$INSTALL_DIR/dotagents"
  user_bin="$HOME/.local/bin"

  [ -x "$electron_bin" ] || die "Electron binary was not found at $electron_bin."
  [ -f "$app_main" ] || die "Headless app entry was not built at $app_main."

  cat > "$repo_dir/start-headless.sh" <<EOF
#!/usr/bin/env bash
exec "$electron_bin" --no-sandbox "$app_main" --headless "\$@"
EOF
  chmod +x "$repo_dir/start-headless.sh"

  sed "s|__INSTALL_DIR__|$repo_dir|" "$repo_dir/scripts/dotagents-cli.sh" > "$launcher_path"
  chmod +x "$launcher_path"

  mkdir -p "$user_bin"
  ln -sf "$launcher_path" "$user_bin/dotagents"
  ok "Headless CLI installed at $user_bin/dotagents"
  if [[ ":$PATH:" != *":$user_bin:"* ]]; then
    warn "$user_bin is not currently on your PATH."
    info "Run the headless CLI with: $user_bin/dotagents"
  fi
}

ensure_acpx_for_codex() {
  [ "$PLATFORM" = "linux" ] || return 0

  if has acpx; then
    ok "acpx $(acpx --version 2>/dev/null | head -1) found"
    return 0
  fi

  local install_acpx="${DOTAGENTS_INSTALL_ACPX:-}"
  if [ -z "$install_acpx" ]; then
    install_acpx="$(ask "Install acpx for Codex integration? [Y/n]: " DOTAGENTS_INSTALL_ACPX "y")"
  fi

  case "$(printf '%s' "$install_acpx" | tr '[:upper:]' '[:lower:]')" in
    y|yes|1|true|on)
      ensure_cmd npm "Install Node.js/npm first."
      info "Installing acpx for Codex integration..."
      npm install -g acpx@latest >/dev/null 2>&1 || run_as_root npm install -g acpx@latest >/dev/null
      has acpx || warn "acpx install completed, but acpx was not found on PATH."
      ;;
    *)
      warn "Skipping acpx install. Install later with: npm install -g acpx@latest"
      ;;
  esac
}

ensure_codex_cli_for_codex_auth() {
  [ "$PLATFORM" = "linux" ] || return 0

  if has codex; then
    ok "Codex CLI $(codex --version 2>/dev/null | head -1) found"
    return 0
  fi

  local install_codex="${DOTAGENTS_INSTALL_CODEX:-}"
  if [ -z "$install_codex" ]; then
    install_codex="$(ask "Install Codex CLI for ChatGPT OAuth? [Y/n]: " DOTAGENTS_INSTALL_CODEX "y")"
  fi

  case "$(printf '%s' "$install_codex" | tr '[:upper:]' '[:lower:]')" in
    y|yes|1|true|on)
      ensure_cmd npm "Install Node.js/npm first."
      info "Installing Codex CLI..."
      npm install -g @openai/codex@latest >/dev/null 2>&1 || run_as_root npm install -g @openai/codex@latest >/dev/null
      has codex || warn "Codex CLI install completed, but codex was not found on PATH."
      ;;
    *)
      warn "Skipping Codex CLI install. Install later with: npm install -g @openai/codex@latest"
      ;;
  esac
}

run_codex_chatgpt_login() {
  [ "$PLATFORM" = "linux" ] || return 0

  if has codex && codex login status >/dev/null 2>&1; then
    ok "Codex ChatGPT auth already configured"
    return 0
  fi

  local run_login="${DOTAGENTS_CODEX_LOGIN:-}" default_login="y"
  [ "$INTERACTIVE" = "true" ] || default_login="0"
  if [ -z "$run_login" ]; then
    run_login="$(ask "Run Codex ChatGPT OAuth login now? [Y/n]: " DOTAGENTS_CODEX_LOGIN "$default_login")"
  fi

  case "$(printf '%s' "$run_login" | tr '[:upper:]' '[:lower:]')" in
    y|yes|1|true|on)
      has codex || { warn "Codex CLI is not installed; skipping login."; return 0; }
      info "Starting Codex ChatGPT OAuth device login..."
      info "Open the shown link on your desktop browser, then enter the one-time code."
      codex login --device-auth || warn "Codex login did not complete. Run later with: codex login --device-auth"
      ;;
    *)
      info "Skipping Codex login. Run later with: codex login --device-auth"
      ;;
  esac
}

run_headless_onboarding() {
  [ "$PLATFORM" = "linux" ] || return 0

  if [ "$SKIP_ONBOARDING" = "1" ]; then
    info "Skipping headless onboarding because DOTAGENTS_SKIP_ONBOARDING=1."
    return 0
  fi

  printf "\n${BOLD}${CYAN}═══════════════════════════════════════════════════${NC}\n"
  printf "${BOLD}  DotAgents Headless Onboarding${NC}\n"
  printf "${BOLD}${CYAN}═══════════════════════════════════════════════════${NC}\n\n"

  mkdir -p "$CONFIG_DIR"

  if [ "$INTERACTIVE" = "true" ]; then
    info "Configure the headless agent. Leave optional fields blank to set them later."
  else
    info "No interactive terminal detected; using DOTAGENTS_* env vars and defaults."
  fi

  printf "  ${BOLD}Auth mode${NC}\n"
  printf "  1) Provider API token (OpenAI-compatible)\n"
  printf "  2) Codex auth via acpx\n"
  printf "  3) Skip for now\n\n"

  local auth_mode api_key base_url model discord_token remote_api_key port
  auth_mode="${AUTH_MODE:-$(ask "Choose auth mode [provider/codex/skip]: " DOTAGENTS_AUTH_MODE "provider")}"
  auth_mode="$(printf '%s' "$auth_mode" | tr '[:upper:]' '[:lower:]')"
  case "$auth_mode" in
    1|provider|providers|api|token|openai) auth_mode="provider" ;;
    2|codex|acpx) auth_mode="codex" ;;
    3|skip|none|later) auth_mode="skip" ;;
    *) warn "Unknown auth mode '$auth_mode'; defaulting to provider token."; auth_mode="provider" ;;
  esac

  api_key=""
  base_url=""
  model="${DOTAGENTS_MODEL:-gpt-4.1-mini}"

  if [ "$auth_mode" = "provider" ]; then
    api_key="$(ask "OpenAI-compatible API key: " DOTAGENTS_API_KEY "")"
    base_url="$(ask "API base URL [leave empty for OpenAI default]: " DOTAGENTS_API_BASE_URL "")"
    model="$(ask "Model name [gpt-4.1-mini]: " DOTAGENTS_MODEL "gpt-4.1-mini")"
  elif [ "$auth_mode" = "codex" ]; then
    ensure_acpx_for_codex
    ensure_codex_cli_for_codex_auth
    run_codex_chatgpt_login
  else
    info "Skipping provider/Codex auth. Run the CLI setup again later to configure it."
  fi

  discord_token="$(ask "Discord bot token [optional]: " DOTAGENTS_DISCORD_TOKEN "")"
  port="$(ask "Remote server port [3210]: " DOTAGENTS_PORT "3210")"
  remote_api_key="${DOTAGENTS_REMOTE_API_KEY:-$(node -e 'process.stdout.write(require("crypto").randomBytes(32).toString("hex"))')}"

  DOTAGENTS_ONBOARD_AUTH_MODE="$auth_mode" \
  DOTAGENTS_ONBOARD_API_KEY="$api_key" \
  DOTAGENTS_ONBOARD_BASE_URL="$base_url" \
  DOTAGENTS_ONBOARD_MODEL="$model" \
  DOTAGENTS_ONBOARD_DISCORD_TOKEN="$discord_token" \
  DOTAGENTS_ONBOARD_REMOTE_API_KEY="$remote_api_key" \
  DOTAGENTS_ONBOARD_PORT="$port" \
  DOTAGENTS_ONBOARD_CONFIG_FILE="$CONFIG_FILE" \
  node <<'NODE'
const fs = require('fs')
const path = require('path')

const configFile = process.env.DOTAGENTS_ONBOARD_CONFIG_FILE
const authMode = process.env.DOTAGENTS_ONBOARD_AUTH_MODE || 'provider'
const apiKey = process.env.DOTAGENTS_ONBOARD_API_KEY || ''
const baseUrl = process.env.DOTAGENTS_ONBOARD_BASE_URL || ''
const model = process.env.DOTAGENTS_ONBOARD_MODEL || 'gpt-4.1-mini'
const discordToken = process.env.DOTAGENTS_ONBOARD_DISCORD_TOKEN || ''
const remoteApiKey = process.env.DOTAGENTS_ONBOARD_REMOTE_API_KEY || ''
const port = Number.parseInt(process.env.DOTAGENTS_ONBOARD_PORT || '3210', 10) || 3210
const presetMap = {
  'https://api.openai.com/v1': 'builtin-openai',
  'https://openrouter.ai/api/v1': 'builtin-openrouter',
  'https://api.together.xyz/v1': 'builtin-together',
  'https://api.cerebras.ai/v1': 'builtin-cerebras',
  'https://api.perplexity.ai': 'builtin-perplexity',
}
const presetId = presetMap[baseUrl] || 'builtin-openai'

let cfg = {}
try { cfg = JSON.parse(fs.readFileSync(configFile, 'utf8')) } catch {}
cfg = {
  ...cfg,
  remoteServerEnabled: true,
  remoteServerPort: port,
  remoteServerBindAddress: '0.0.0.0',
  remoteServerApiKey: remoteApiKey,
  mcpMaxIterations: 25,
  mcpUnlimitedIterations: false,
}

if (authMode === 'provider') {
  cfg.openaiApiKey = apiKey
  cfg.openaiBaseUrl = baseUrl
  cfg.mcpToolsProviderId = 'openai'
  cfg.mcpToolsOpenaiModel = model
  cfg.transcriptPostProcessingOpenaiModel = model
  cfg.currentModelPresetId = presetId
  const modelPresets = Array.isArray(cfg.modelPresets) ? cfg.modelPresets : []
  const presetData = {
    id: presetId,
    apiKey,
    baseUrl: baseUrl || undefined,
    mcpToolsModel: model,
    transcriptProcessingModel: model,
    isBuiltIn: true,
  }
  const existingIdx = modelPresets.findIndex((preset) => preset?.id === presetId)
  if (existingIdx >= 0) modelPresets[existingIdx] = { ...modelPresets[existingIdx], ...presetData }
  else modelPresets.push(presetData)
  cfg.modelPresets = modelPresets
  cfg.mainAgentMode = 'api'
} else if (authMode === 'codex') {
  cfg.mainAgentMode = 'acpx'
  cfg.mainAgentName = 'codex'

  const now = Date.now()
  const agentDir = path.join(process.env.HOME || '.', '.agents', 'agents', 'codex')
  fs.mkdirSync(agentDir, { recursive: true })
  fs.writeFileSync(path.join(agentDir, 'agent.md'), [
    '---',
    'kind: agent',
    'id: codex',
    'name: codex',
    'displayName: Codex',
    'description: OpenAI Codex via acpx',
    'connection-type: acpx',
    'role: external-agent',
    'enabled: true',
    `createdAt: ${now}`,
    `updatedAt: ${now}`,
    '---',
    '',
    'OpenAI Codex coding agent.',
    '',
  ].join('\n'))
  const connection = { type: 'acpx', agent: 'codex' }
  fs.writeFileSync(path.join(agentDir, 'config.json'), JSON.stringify({ connection }, null, 2))
}

if (discordToken) {
  cfg.discordEnabled = true
  cfg.discordBotToken = discordToken
  cfg.discordDmEnabled = true
  cfg.discordRequireMention = true
  cfg.discordLogMessages = false
}

fs.mkdirSync(path.dirname(configFile), { recursive: true })
fs.writeFileSync(configFile, JSON.stringify(cfg, null, 2))
NODE

  ok "Headless configuration saved to $CONFIG_FILE"
  info "Remote server API key: ${remote_api_key:0:8}..."
}

install_from_source() {
  info "Installing DotAgents from source..."
  ensure_source_requirements
  resolve_pnpm

  mkdir -p "$INSTALL_DIR"
  if [ -d "$INSTALL_DIR/repo/.git" ]; then
    info "Updating existing repo..."
    (cd "$INSTALL_DIR/repo" && git pull --ff-only origin main)
  else
    info "Cloning $REPO..."
    git clone --depth 1 "$REPO_URL.git" "$INSTALL_DIR/repo"
  fi

  cd "$INSTALL_DIR/repo"
  run_pnpm --version >/dev/null 2>&1 || true
  repair_corepack_node_gyp_permissions
  info "Installing dependencies..."
  run_pnpm install --frozen-lockfile
  build_source_workspace_packages

  if has cargo; then
    info "Building Rust desktop binary..."
    run_pnpm --filter @dotagents/desktop build-rs
  else
    warn "Cargo was not found. Voice-native features may be unavailable in source mode."
    warn "Install Rust from https://rustup.rs if you need the native desktop binary."
  fi

  if [ "$PLATFORM" = "linux" ]; then
    build_linux_headless_app
    setup_linux_headless_cli
    run_headless_onboarding
  fi

  ok "Source checkout is ready at $INSTALL_DIR/repo"
  if [ "$PLATFORM" = "linux" ]; then
    info "Start the headless CLI with: $HOME/.local/bin/dotagents"
    info "Start the desktop app with: cd $INSTALL_DIR/repo && $(printf '%s ' "${PNPM_CMD[@]}")dev"
  else
    info "Start the desktop app with:"
    info "  cd $INSTALL_DIR/repo && $(printf '%s ' "${PNPM_CMD[@]}")dev"
  fi
}

main() {
  printf "\n${BOLD}${CYAN}"
  printf "  ┌──────────────────────────────────┐\n"
  printf "  │     .a  DotAgents Installer       │\n"
  printf "  └──────────────────────────────────┘${NC}\n\n"

  detect_platform
  info "Detected: $PLATFORM/$ARCH"

  if [ "$FROM_SOURCE" = "1" ]; then
    install_from_source
  else
    install_release
  fi

  printf "\n${GREEN}${BOLD}Done!${NC} Documentation: ${CYAN}https://docs.dotagents.app${NC}\n\n"
}

main "$@"

