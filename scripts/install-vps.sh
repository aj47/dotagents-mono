#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# DotAgents VPS Install Script
# One-line install: curl -fsSL https://raw.githubusercontent.com/aj47/dotagents-mono/issue-108-discord-integration/scripts/install-vps.sh | bash
# ═══════════════════════════════════════════════════════════════
# Detect interactive mode BEFORE set -e.
# When piped through curl, stdin is the script. Try to reopen from /dev/tty.
INTERACTIVE=false
if [[ -t 0 ]]; then
  INTERACTIVE=true
elif (exec 0</dev/tty) 2>/dev/null; then
  exec 0</dev/tty
  INTERACTIVE=true
fi

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; DIM='\033[2m'; NC='\033[0m'

INSTALL_DIR="${DOTAGENTS_INSTALL_DIR:-$HOME/dotagents}"
BRANCH="${DOTAGENTS_BRANCH:-issue-108-discord-integration}"
REPO_URL="${DOTAGENTS_REPO:-https://github.com/aj47/dotagents-mono.git}"
CONFIG_DIR="$HOME/.config/app.dotagents"
CONFIG_FILE="$CONFIG_DIR/config.json"
SERVICE_NAME="dotagents"
NODE_MAJOR=22

info()  { echo -e "${CYAN}▸${NC} $*"; }
ok()    { echo -e "${GREEN}✓${NC} $*"; }
warn()  { echo -e "${YELLOW}⚠${NC} $*"; }
fail()  { echo -e "${RED}✗${NC} $*"; exit 1; }
ask() {
  local prompt="$1" env_var="${2:-}" default="${3:-}"
  # If env var is set, use it
  if [[ -n "$env_var" && -n "${!env_var:-}" ]]; then
    echo "${!env_var}"
    return
  fi
  # If non-interactive, use default
  if [[ "$INTERACTIVE" != "true" ]]; then
    echo "$default"
    return
  fi
  local v; read -rp "$(echo -e "${CYAN}?${NC} ${prompt}: ")" v
  echo "${v:-$default}"
}

banner() {
  echo ""
  echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════════${NC}"
  echo -e "${BOLD}  🤖 DotAgents VPS Installer${NC}"
  echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════════${NC}"
  echo -e "${DIM}  Discord + AI agent on your server in one command${NC}"
  echo ""
}

# ── OS Detection ──────────────────────────────────────────────
check_os() {
  if [[ "$(uname)" != "Linux" ]]; then
    fail "This installer is for Linux VPS only. Detected: $(uname)"
  fi
  if ! command -v apt-get &>/dev/null && ! command -v dnf &>/dev/null; then
    fail "Only Debian/Ubuntu (apt) and Fedora/RHEL (dnf) are supported."
  fi
  ARCH="$(uname -m)"
  case "$ARCH" in
    x86_64)  ARCH_LABEL="x64" ;;
    aarch64) ARCH_LABEL="arm64" ;;
    *)       fail "Unsupported architecture: $ARCH" ;;
  esac
  ok "Linux $ARCH_LABEL detected"
}

# ── System Dependencies ──────────────────────────────────────
install_system_deps() {
  info "Installing system dependencies..."
  if command -v apt-get &>/dev/null; then
    sudo apt-get update -qq
    sudo apt-get install -y -qq \
      git curl build-essential pkg-config \
      libgtk-3-0 libnotify4 libnss3 libxss1 libxtst6 \
      xdg-utils libatspi2.0-0 libuuid1 libsecret-1-0 \
      libasound2 libgbm1 xvfb \
      2>/dev/null
  elif command -v dnf &>/dev/null; then
    sudo dnf install -y -q \
      git curl gcc gcc-c++ make pkg-config \
      gtk3 libnotify nss libXScrnSaver libXtst \
      at-spi2-core libuuid libsecret \
      alsa-lib mesa-libgbm xorg-x11-server-Xvfb \
      2>/dev/null
  fi
  ok "System dependencies installed"
}

# ── Node.js ───────────────────────────────────────────────────
install_node() {
  if command -v node &>/dev/null; then
    local ver; ver="$(node -v | sed 's/v//' | cut -d. -f1)"
    if (( ver >= NODE_MAJOR )); then
      ok "Node.js $(node -v) already installed"
      return
    fi
    warn "Node.js $(node -v) is too old, upgrading to v${NODE_MAJOR}..."
  fi
  info "Installing Node.js ${NODE_MAJOR}..."
  if command -v apt-get &>/dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_${NODE_MAJOR}.x | sudo -E bash -
    sudo apt-get install -y -qq nodejs 2>/dev/null
  elif command -v dnf &>/dev/null; then
    curl -fsSL https://rpm.nodesource.com/setup_${NODE_MAJOR}.x | sudo bash -
    sudo dnf install -y -q nodejs 2>/dev/null
  fi
  ok "Node.js $(node -v) installed"
}

# ── pnpm ──────────────────────────────────────────────────────
install_pnpm() {
  if command -v pnpm &>/dev/null; then
    ok "pnpm $(pnpm -v) already installed"
    return
  fi
  info "Installing pnpm..."
  npm install -g pnpm@9 2>/dev/null
  ok "pnpm $(pnpm -v) installed"
}

# ── Rust ──────────────────────────────────────────────────────
install_rust() {
  if command -v cargo &>/dev/null; then
    ok "Rust $(rustc --version | awk '{print $2}') already installed"
    return
  fi
  info "Installing Rust toolchain..."
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --quiet
  # shellcheck source=/dev/null
  source "$HOME/.cargo/env" 2>/dev/null || true
  ok "Rust $(rustc --version | awk '{print $2}') installed"
}

# ── Clone & Build ─────────────────────────────────────────────
clone_and_build() {
  if [[ -d "$INSTALL_DIR/.git" ]]; then
    info "Updating existing installation..."
    cd "$INSTALL_DIR"
    git fetch origin "$BRANCH" --quiet
    git checkout "$BRANCH" --quiet
    git pull origin "$BRANCH" --quiet
  else
    info "Cloning DotAgents (branch: $BRANCH)..."
    git clone --branch "$BRANCH" --depth 1 "$REPO_URL" "$INSTALL_DIR" 2>/dev/null
    cd "$INSTALL_DIR"
  fi
  ok "Source code ready"

  info "Installing dependencies (this may take a few minutes)..."
  pnpm install --frozen-lockfile 2>/dev/null || pnpm install 2>/dev/null
  ok "Dependencies installed"

  info "Building shared packages..."
  pnpm build:shared 2>/dev/null
  pnpm --filter @dotagents/mcp-whatsapp build 2>/dev/null || true
  ok "Shared packages built"

  info "Building desktop app (Electron + Rust)..."
  cd "$INSTALL_DIR/apps/desktop"
  # Build Rust binary
  pnpm run build-rs 2>/dev/null || warn "Rust binary build skipped (not critical for headless)"
  # Build Electron app
  npx electron-vite build 2>/dev/null
  ok "Desktop app built"
  cd "$INSTALL_DIR"
}

# ── Onboarding ────────────────────────────────────────────────
run_onboarding() {
  echo ""
  echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════════${NC}"
  echo -e "${BOLD}  🔧 Configuration${NC}"
  echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════════${NC}"
  echo ""

  mkdir -p "$CONFIG_DIR"

  # Non-interactive mode: use env vars
  # DOTAGENTS_API_KEY, DOTAGENTS_API_BASE_URL, DOTAGENTS_MODEL,
  # DOTAGENTS_DISCORD_TOKEN, DOTAGENTS_PORT
  if [[ "$INTERACTIVE" == "true" ]]; then
    echo -e "${DIM}  DotAgents needs an LLM API key to power the AI agent.${NC}"
    echo -e "${DIM}  Supported: OpenAI, Groq, Google Gemini${NC}"
    echo ""
  fi
  local api_key; api_key="$(ask "OpenAI-compatible API key" DOTAGENTS_API_KEY "")"
  local base_url; base_url="$(ask "API base URL [leave empty for OpenAI default]" DOTAGENTS_API_BASE_URL "")"
  local model; model="$(ask "Model name [default: gpt-4.1-mini]" DOTAGENTS_MODEL "gpt-4.1-mini")"

  if [[ "$INTERACTIVE" == "true" ]]; then
    echo ""
    echo -e "${DIM}  To connect Discord, create a bot at https://discord.com/developers/applications${NC}"
    echo -e "${DIM}  Enable: MESSAGE CONTENT INTENT, SERVER MEMBERS INTENT${NC}"
    echo -e "${DIM}  Bot permissions: Send Messages, Read Message History, View Channels${NC}"
    echo ""
  fi
  local discord_token; discord_token="$(ask "Discord bot token [leave empty to skip]" DOTAGENTS_DISCORD_TOKEN "")"

  # Remote Server API Key
  local remote_api_key
  remote_api_key="${DOTAGENTS_REMOTE_API_KEY:-$(openssl rand -hex 32 2>/dev/null || head -c 64 /dev/urandom | xxd -p | tr -d '\n' | head -c 64)}"

  local port; port="$(ask "Remote server port [default: 3210]" DOTAGENTS_PORT "3210")"

  # Build config JSON using a node one-liner for proper escaping
  local config_json
  config_json=$(node -e "
    const cfg = {
      openaiApiKey: $(printf '%s' "$api_key" | node -e "process.stdout.write(JSON.stringify(require('fs').readFileSync(0,'utf8')))"),
      openaiBaseUrl: $(printf '%s' "$base_url" | node -e "process.stdout.write(JSON.stringify(require('fs').readFileSync(0,'utf8')))"),
      mcpToolsProviderId: 'openai',
      mcpToolsOpenaiModel: '$model',
      transcriptPostProcessingOpenaiModel: '$model',
      remoteServerEnabled: true,
      remoteServerPort: $port,
      remoteServerBindAddress: '0.0.0.0',
      remoteServerApiKey: '$remote_api_key',
      mcpMaxIterations: 25,
      mcpUnlimitedIterations: false,
    };
    const dt = '$discord_token';
    if (dt) {
      cfg.discordEnabled = true;
      cfg.discordBotToken = dt;
      cfg.discordDmEnabled = true;
      cfg.discordRequireMention = true;
      cfg.discordLogMessages = false;
    }
    console.log(JSON.stringify(cfg, null, 2));
  ")
  echo "$config_json" > "$CONFIG_FILE"

  ok "Configuration saved to $CONFIG_FILE"
  echo -e "  ${DIM}Remote server API key: ${remote_api_key:0:8}...${NC}"
}

# ── Systemd Service ───────────────────────────────────────────
setup_systemd() {
  info "Setting up systemd service..."

  local electron_bin="$INSTALL_DIR/node_modules/electron/dist/electron"
  local app_main="$INSTALL_DIR/apps/desktop/out/main/index.js"

  # Ensure cargo env is available in the service
  local cargo_path=""
  if [[ -f "$HOME/.cargo/env" ]]; then
    cargo_path="$HOME/.cargo/bin:"
  fi

  sudo tee "/etc/systemd/system/${SERVICE_NAME}.service" > /dev/null <<EOF
[Unit]
Description=DotAgents AI Agent (Headless)
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=$(whoami)
WorkingDirectory=$INSTALL_DIR/apps/desktop
Environment=HOME=$HOME
Environment=DISPLAY=
Environment=DOTAGENTS_TERMINAL_MODE=1
Environment=ELECTRON_RUN_AS_NODE=0
Environment=NODE_ENV=production
Environment=PATH=${cargo_path}/usr/local/bin:/usr/bin:/bin
ExecStart=/usr/bin/xvfb-run --auto-servernum --server-args="-screen 0 1x1x8" $electron_bin $app_main --headless --no-sandbox
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

  sudo systemctl daemon-reload
  sudo systemctl enable "${SERVICE_NAME}" 2>/dev/null
  ok "Systemd service created and enabled"
}

# ── Start ─────────────────────────────────────────────────────
start_service() {
  info "Starting DotAgents..."
  sudo systemctl start "${SERVICE_NAME}"
  sleep 3

  if sudo systemctl is-active --quiet "${SERVICE_NAME}"; then
    ok "DotAgents is running!"
  else
    warn "Service may not have started cleanly. Check: sudo journalctl -u ${SERVICE_NAME} -f"
  fi
}

# ── Summary ───────────────────────────────────────────────────
print_summary() {
  local port; port=$(grep -o '"remoteServerPort": [0-9]*' "$CONFIG_FILE" 2>/dev/null | grep -o '[0-9]*' || echo "3210")
  local public_ip; public_ip="$(curl -s --max-time 5 ifconfig.me 2>/dev/null || echo "<your-vps-ip>")"

  echo ""
  echo -e "${BOLD}${GREEN}═══════════════════════════════════════════════════${NC}"
  echo -e "${BOLD}  ✅ DotAgents is live!${NC}"
  echo -e "${BOLD}${GREEN}═══════════════════════════════════════════════════${NC}"
  echo ""
  echo -e "  ${BOLD}Remote API:${NC}     http://${public_ip}:${port}/v1"
  echo -e "  ${BOLD}Service:${NC}        sudo systemctl status ${SERVICE_NAME}"
  echo -e "  ${BOLD}Logs:${NC}           sudo journalctl -u ${SERVICE_NAME} -f"
  echo -e "  ${BOLD}Restart:${NC}        sudo systemctl restart ${SERVICE_NAME}"
  echo -e "  ${BOLD}CLI mode:${NC}       cd $INSTALL_DIR/apps/desktop && xvfb-run npx electron out/main/index.js --headless --no-sandbox"
  echo -e "  ${BOLD}Config:${NC}         $CONFIG_FILE"
  echo ""
  if grep -q '"discordEnabled": true' "$CONFIG_FILE" 2>/dev/null; then
    echo -e "  ${BOLD}${CYAN}Discord:${NC}        Bot should be connecting now!"
    echo -e "  ${DIM}  Invite your bot: https://discord.com/oauth2/authorize?client_id=<BOT_CLIENT_ID>&permissions=2048&scope=bot${NC}"
  else
    echo -e "  ${DIM}Discord not configured. Run the CLI to enable: /discord enable${NC}"
  fi
  echo ""
  echo -e "  ${DIM}Mobile app: scan the QR code with the DotAgents mobile app${NC}"
  echo -e "  ${DIM}to connect to http://${public_ip}:${port}/v1${NC}"
  echo ""
}

# ── Main ──────────────────────────────────────────────────────
main() {
  banner
  check_os
  install_system_deps
  install_node
  install_pnpm
  install_rust
  clone_and_build
  run_onboarding
  setup_systemd
  start_service
  print_summary
}

main "$@"

