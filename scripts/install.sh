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

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[0;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

info()  { printf "${CYAN}▸${NC} %s\n" "$*"; }
ok()    { printf "${GREEN}✔${NC} %s\n" "$*"; }
warn()  { printf "${YELLOW}⚠${NC} %s\n" "$*"; }
err()   { printf "${RED}✘${NC} %s\n" "$*" >&2; }
die()   { err "$*"; exit 1; }
has()   { command -v "$1" >/dev/null 2>&1; }

ensure_cmd() {
  local command="$1"
  local help_text="${2:-Install '$command' and try again.}"
  has "$command" || die "Required command '$command' not found. $help_text"
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
    npm install -g pnpm >/dev/null
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

install_from_source() {
  info "Installing DotAgents from source..."
  ensure_cmd git "Install Git first."
  ensure_cmd node "Install Node.js 20.19.4+ first."

  local node_major
  node_major="$(node -p "process.versions.node.split('.')[0]" 2>/dev/null || true)"
  [ -n "$node_major" ] || die "Failed to determine the installed Node.js version."
  [ "$node_major" -ge 20 ] || die "Node.js 20.19.4+ is required for source installs."

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
  info "Installing dependencies..."
  run_pnpm install --frozen-lockfile
  info "Building shared workspace package..."
  run_pnpm build:shared

  if has cargo; then
    info "Building Rust desktop binary..."
    run_pnpm --filter @dotagents/desktop build-rs
  else
    warn "Cargo was not found. Voice-native features may be unavailable in source mode."
    warn "Install Rust from https://rustup.rs if you need the native desktop binary."
  fi

  ok "Source checkout is ready at $INSTALL_DIR/repo"
  info "Start the desktop app with:"
  info "  cd $INSTALL_DIR/repo && $(printf '%s ' "${PNPM_CMD[@]}")dev"
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

