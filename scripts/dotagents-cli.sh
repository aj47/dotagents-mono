#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# dotagents — Global CLI for DotAgents headless mode
#
# If the daemon is already running, attaches an interactive REPL
# that talks to it via the local API. Otherwise starts fresh.
# ═══════════════════════════════════════════════════════════════
set -uo pipefail
# NOTE: no `set -e` — a REPL must not exit on command failures

INSTALL_DIR="__INSTALL_DIR__"

# Config location: prefer XDG (Linux/VPS install layout), fall back to the
# macOS Electron user-data dir so the same script is testable on a developer
# Mac that has the desktop app running.
if [[ -f "$HOME/.config/app.dotagents/config.json" ]]; then
  CONFIG_DIR="$HOME/.config/app.dotagents"
elif [[ -f "$HOME/Library/Application Support/app.dotagents/config.json" ]]; then
  CONFIG_DIR="$HOME/Library/Application Support/app.dotagents"
else
  CONFIG_DIR="$HOME/.config/app.dotagents"
fi
CONFIG_FILE="$CONFIG_DIR/config.json"

C='\033[0;36m'; G='\033[0;32m'; Y='\033[1;33m'; D='\033[2m'
B='\033[1m'; R='\033[0m'; RED='\033[0;31m'

get_config_val() {
  node -e "try{const c=JSON.parse(require('fs').readFileSync('$CONFIG_FILE','utf8'));console.log(c['$1']||'')}catch{}" 2>/dev/null
}

api_get() {
  curl -sf \
    -H "Authorization: Bearer $API_KEY" \
    "http://127.0.0.1:$PORT$1" 2>/dev/null
}

api_post() {
  local path="$1"; shift
  curl -sf -X POST \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    "$@" "http://127.0.0.1:$PORT$path" 2>/dev/null
}

api_patch() {
  local path="$1"; shift
  curl -sf -X PATCH \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    "$@" "http://127.0.0.1:$PORT$path" 2>/dev/null
}

node_print() { node -e "$1" 2>/dev/null; }

# ── Config ────────────────────────────────────────────────────
PORT="$(get_config_val remoteServerPort)"; PORT="${PORT:-3210}"
API_KEY="$(get_config_val remoteServerApiKey)"

is_running() {
  curl -sf -o /dev/null --max-time 2 \
    -H "Authorization: Bearer $API_KEY" \
    "http://127.0.0.1:$PORT/v1/operator/health" 2>/dev/null
}

if ! is_running; then
  if [[ "$(uname -s)" == "Darwin" ]]; then
    echo -e "${RED}✗ DotAgents daemon is not running on port $PORT.${R}" >&2
    echo -e "${D}  This CLI attaches to a running headless daemon. On macOS, start the${R}" >&2
    echo -e "${D}  desktop app first (it exposes the same /v1/operator/* API).${R}" >&2
    exit 1
  fi
  exec xvfb-run --auto-servernum "$INSTALL_DIR/start-headless.sh"
fi

# ── Tab completion ────────────────────────────────────────────
COMMANDS=(
  "/help" "/quit" "/exit" "/status" "/stop" "/new" "/setup"
  "/profiles" "/conversations" "/logs"
  "/discord" "/discord status" "/discord enable" "/discord disable"
  "/discord token" "/discord profile" "/discord logs" "/discord connect" "/discord disconnect"
  "/discord slash" "/discord help"
  "/discord mention on" "/discord mention off"
  "/discord access" "/discord dm" "/discord dm on" "/discord dm off"
  "/discord dm allow" "/discord dm deny" "/discord allow user" "/discord allow role"
  "/discord allow channel" "/discord allow guild" "/discord deny user" "/discord deny role"
  "/discord deny channel" "/discord deny guild"
  "/config" "/config set" "/config get"
  "/restart" "/health"
)

_dotagents_complete() {
  local cur="${COMP_WORDS[*]}"
  cur="${cur## }"  # trim leading space from readline
  COMPREPLY=()
  for cmd in "${COMMANDS[@]}"; do
    if [[ "$cmd" == "$cur"* ]]; then
      # Return the next word(s) after what's already typed
      COMPREPLY+=("$cmd")
    fi
  done
}

# Enable readline features
if [[ -t 0 ]]; then
  bind 'set show-all-if-ambiguous on' 2>/dev/null || true
  bind 'set completion-ignore-case on' 2>/dev/null || true
  bind 'TAB:complete' 2>/dev/null || true
fi

# ── Banner ────────────────────────────────────────────────────
echo -e "${B}${C}═══════════════════════════════════════════════════${R}"
echo -e "${B}  🤖 DotAgents CLI ${D}(attached to running service)${R}"
echo -e "${B}${C}═══════════════════════════════════════════════════${R}"
echo ""

STATUS="$(api_get /v1/operator/status)" || true
if [[ -n "$STATUS" ]]; then
  echo "$STATUS" | node_print "
    const d=JSON.parse(require('fs').readFileSync(0,'utf8'));
    const h=d.health||{};
    const i=d.integrations||{};
    const dc=i.discord||{};
    // Health overall enum (server: OperatorHealthOverall): healthy | warning | critical
    const hc=h.overall==='healthy'?'\x1b[32m✓':h.overall==='warning'?'\x1b[33m⚠':'\x1b[31m✗';
    const ds=dc.connected?'\x1b[32m● connected':'\x1b[2m○ disconnected';
    console.log('  Health: '+hc+' '+h.overall+'\x1b[0m');
    console.log('  Discord: '+ds+'\x1b[0m');
    console.log('  API: \x1b[2mhttp://127.0.0.1:${PORT}\x1b[0m');
  "
fi

echo ""

CONVERSATION_ID=""

# ── Helpers ───────────────────────────────────────────────────
print_help() {
  cat <<HELP

$(echo -e "${B}Chat${R}")
  $(echo -e "${C}<message>${R}")          Chat with the agent
  $(echo -e "${C}/new${R}")               Start a new conversation
  $(echo -e "${C}/conversations${R}")     List recent conversations
  $(echo -e "${C}/stop${R}")              Emergency stop running agent

$(echo -e "${B}Discord${R}")
  $(echo -e "${C}/discord${R}")            Show Discord status
  $(echo -e "${C}/discord enable${R}")     Enable Discord bot
  $(echo -e "${C}/discord disable${R}")    Disable Discord bot
  $(echo -e "${C}/discord connect${R}")    Connect the bot
  $(echo -e "${C}/discord disconnect${R}") Disconnect the bot
  $(echo -e "${C}/discord token <t>${R}")  Set bot token
  $(echo -e "${C}/discord profile <id>${R}") Set default profile
  $(echo -e "${C}/discord logs [n]${R}")   Show recent Discord logs
  $(echo -e "${C}/discord slash${R}")      Reference for Discord-side slash commands

$(echo -e "${B}Discord Access Control${R}")
  $(echo -e "${C}/discord access${R}")           Show current access rules
  $(echo -e "${C}/discord mention on${R}")       Require @mention to respond (default)
  $(echo -e "${C}/discord mention off${R}")      Respond to all messages in allowed channels
  $(echo -e "${C}/discord dm on|off${R}")         Enable/disable DMs
  $(echo -e "${C}/discord dm allow <uid>${R}")    Add user to DM allowlist
  $(echo -e "${C}/discord dm deny <uid>${R}")     Remove user from DM allowlist
  $(echo -e "${C}/discord allow user <uid>${R}")  Allow a user
  $(echo -e "${C}/discord allow role <rid>${R}")  Allow a Discord role
  $(echo -e "${C}/discord allow channel <cid>${R}") Allow a channel
  $(echo -e "${C}/discord allow guild <gid>${R}") Allow a server
  $(echo -e "${C}/discord deny user <uid>${R}")   Remove user from allowlist
  $(echo -e "${C}/discord deny role <rid>${R}")   Remove role from allowlist
  $(echo -e "${C}/discord deny channel <cid>${R}") Remove channel
  $(echo -e "${C}/discord deny guild <gid>${R}")  Remove server

$(echo -e "${B}System${R}")
  $(echo -e "${C}/setup${R}")             Run onboarding wizard
  $(echo -e "${C}/status${R}")            Full service status
  $(echo -e "${C}/health${R}")            Quick health check
  $(echo -e "${C}/profiles${R}")          List agent profiles
  $(echo -e "${C}/logs${R}")              Show recent error logs
  $(echo -e "${C}/config get <key>${R}")  Read a config value
  $(echo -e "${C}/config set <k> <v>${R}")Update a config value
  $(echo -e "${C}/restart${R}")           Restart the service
  $(echo -e "${C}/quit${R}")              Exit CLI (service keeps running)

HELP
}

# Write a key/value to config.json (handles API keys and other sensitive values
# that PATCH /v1/settings intentionally blocks)
config_set_raw() {
  local key="$1" value="$2"
  node -e "
    const fs=require('fs');
    const f='$CONFIG_FILE';
    let c={};
    try{c=JSON.parse(fs.readFileSync(f,'utf8'))}catch{}
    c['$key']=$value;
    fs.mkdirSync(require('path').dirname(f),{recursive:true});
    fs.writeFileSync(f,JSON.stringify(c,null,2));
  " 2>/dev/null
}

# Prompt with default value shown
# Prompts go to stderr so $() captures only the result
ask_val() {
  local prompt="$1" default="$2" current="$3"
  local display_current=""
  if [[ -n "$current" ]]; then
    if [[ "$current" == sk-* || ${#current} -gt 30 ]]; then
      display_current="${current:0:8}...${current: -4}"
    else
      display_current="$current"
    fi
  fi
  if [[ -n "$display_current" ]]; then
    echo -en "  ${C}?${R} ${prompt} ${D}[current: ${display_current}]${R}: " >&2
  elif [[ -n "$default" ]]; then
    echo -en "  ${C}?${R} ${prompt} ${D}[${default}]${R}: " >&2
  else
    echo -en "  ${C}?${R} ${prompt}: " >&2
  fi
  local val
  read -r val
  if [[ -z "$val" ]]; then
    if [[ -n "$current" ]]; then echo "$current"
    else echo "$default"; fi
  else
    echo "$val"
  fi
}

# Test if an API key works
test_api_key() {
  local key="$1" base_url="$2" model="$3"
  local url="${base_url:-https://api.openai.com/v1}/chat/completions"
  local response
  response=$(curl -sf --max-time 10 \
    -H "Authorization: Bearer $key" \
    -H "Content-Type: application/json" \
    -d "{\"model\":\"$model\",\"messages\":[{\"role\":\"user\",\"content\":\"hi\"}],\"max_tokens\":5}" \
    "$url" 2>&1)
  local rc=$?
  if [[ $rc -eq 0 ]]; then
    return 0
  else
    return 1
  fi
}

run_setup() {
  echo ""
  echo -e "${B}${C}╭───────────────────────────────────────────────────╮${R}"
  echo -e "${B}${C}│${R}  ${B}⚡ DotAgents Setup Wizard${R}                        ${B}${C}│${R}"
  echo -e "${B}${C}╰───────────────────────────────────────────────────╯${R}"
  echo ""

  # Read current config
  local cur_key cur_base cur_model cur_provider cur_discord
  cur_key="$(get_config_val openaiApiKey)"
  cur_base="$(get_config_val openaiBaseUrl)"
  cur_model="$(get_config_val mcpToolsOpenaiModel)"
  cur_provider="$(get_config_val mcpToolsProviderId)"
  cur_discord="$(get_config_val discordBotToken)"

  # ── Step 1: LLM Provider ──
  echo -e "  ${B}Step 1/3 — LLM Configuration${R}"
  echo -e "  ${D}Powers the AI agent. Works with OpenAI, Groq, Gemini, or any compatible API.${R}"
  echo ""

  local api_key base_url model
  api_key="$(ask_val "API key" "" "$cur_key")"

  if [[ -z "$api_key" ]]; then
    echo -e "  ${RED}✗ API key is required${R}"
    return
  fi

  base_url="$(ask_val "API base URL (blank for OpenAI)" "" "$cur_base")"
  model="$(ask_val "Model name" "gpt-4.1-mini" "$cur_model")"
  model="${model:-gpt-4.1-mini}"

  # Auto-detect provider from base URL
  local provider="openai"
  if [[ "$base_url" == *"groq"* ]]; then provider="groq"
  elif [[ "$base_url" == *"gemini"* || "$base_url" == *"google"* ]]; then provider="gemini"
  fi

  echo ""
  echo -ne "  ${D}Testing API key...${R} "
  if test_api_key "$api_key" "$base_url" "$model"; then
    echo -e "${G}✓ Working!${R}"
  else
    echo -e "${Y}⚠ Could not verify (may still work — check model name and base URL)${R}"
  fi

  # Save LLM config — must write to the model preset system, not just legacy fields.
  # syncPresetToLegacyFields() overwrites openaiApiKey from the active preset on every startup.
  node -e "
    const fs=require('fs'), path=require('path');
    const f='$CONFIG_FILE';
    let c={};
    try{c=JSON.parse(fs.readFileSync(f,'utf8'))}catch{}

    const apiKey=$(printf '%s' "$api_key" | node -e "process.stdout.write(JSON.stringify(require('fs').readFileSync(0,'utf8')))");
    const baseUrl=$(printf '%s' "$base_url" | node -e "process.stdout.write(JSON.stringify(require('fs').readFileSync(0,'utf8')))");
    const model=$(printf '%s' "$model" | node -e "process.stdout.write(JSON.stringify(require('fs').readFileSync(0,'utf8')))");

    // Detect which built-in preset matches the base URL
    const presets = {
      'https://api.openai.com/v1': 'builtin-openai',
      'https://openrouter.ai/api/v1': 'builtin-openrouter',
      'https://api.together.xyz/v1': 'builtin-together',
      'https://api.cerebras.ai/v1': 'builtin-cerebras',
      'https://api.perplexity.ai': 'builtin-perplexity',
    };
    const presetId = presets[baseUrl] || (baseUrl ? 'builtin-openai' : 'builtin-openai');

    // Save as a model preset override
    const savedPresets = c.modelPresets || [];
    const existingIdx = savedPresets.findIndex(p => p.id === presetId);
    const presetData = {
      id: presetId,
      apiKey: apiKey,
      baseUrl: baseUrl || undefined,
      mcpToolsModel: model,
      transcriptProcessingModel: model,
      isBuiltIn: true,
    };
    if (existingIdx >= 0) savedPresets[existingIdx] = { ...savedPresets[existingIdx], ...presetData };
    else savedPresets.push(presetData);

    c.modelPresets = savedPresets;
    c.currentModelPresetId = presetId;

    // Also set legacy fields (used by some code paths)
    c.openaiApiKey = apiKey;
    c.openaiBaseUrl = baseUrl;
    c.mcpToolsProviderId = '$provider';
    c.mcpToolsOpenaiModel = model;
    c.transcriptPostProcessingOpenaiModel = model;

    fs.mkdirSync(path.dirname(f),{recursive:true});
    fs.writeFileSync(f, JSON.stringify(c, null, 2));
  " 2>/dev/null
  echo -e "  ${G}✓ LLM configuration saved${R}"

  # ── Step 2: Discord ──
  echo ""
  echo -e "  ${B}Step 2/3 — Discord Bot ${D}(optional)${R}"
  echo -e "  ${D}Connect a Discord bot to chat with the agent from Discord.${R}"
  echo -e "  ${D}Create one at: ${C}https://discord.com/developers/applications${R}"
  echo -e "  ${D}Required: ${B}Message Content Intent${D} enabled in Bot settings.${R}"
  echo ""

  local discord_token
  discord_token="$(ask_val "Discord bot token (blank to skip)" "" "$cur_discord")"

  if [[ -n "$discord_token" ]]; then
    config_set_raw "discordBotToken" "\"$discord_token\""
    config_set_raw "discordEnabled" "true"
    config_set_raw "discordRequireMention" "true"
    config_set_raw "discordDmEnabled" "false"
    echo -e "  ${G}✓ Discord configured & enabled${R}"
    echo -e "  ${D}  • Requires @mention in servers (safe default)${R}"
    echo -e "  ${D}  • DMs disabled (enable with: /config set discordDmEnabled true)${R}"
    echo ""
    echo -e "  ${D}Don't forget to invite your bot to a server:${R}"
    echo -e "  ${D}${C}https://discord.com/oauth2/authorize?client_id=YOUR_APP_ID&permissions=2048&scope=bot${R}"
  else
    echo -e "  ${D}Skipped. You can set this later with: /discord token <token>${R}"
  fi

  # ── Step 3: Restart ──
  echo ""
  echo -e "  ${B}Step 3/3 — Apply Changes${R}"
  echo ""
  echo -en "  ${C}?${R} Restart service to apply? ${D}[Y/n]${R}: "
  local restart_answer
  read -r restart_answer
  restart_answer="${restart_answer:-y}"

  if [[ "$restart_answer" =~ ^[Yy] ]]; then
    echo -e "  ${D}Restarting...${R}"
    sudo systemctl restart dotagents 2>/dev/null || true
    sleep 5
    # Re-read config for new API key
    API_KEY="$(get_config_val remoteServerApiKey)"
    if is_running; then
      echo -e "  ${G}✓ Service restarted successfully${R}"
      # Reconnect Discord if configured
      if [[ -n "$discord_token" ]]; then
        sleep 2
        api_post /v1/operator/discord/connect -d '{}' > /dev/null 2>&1 || true
        echo -e "  ${G}✓ Discord bot connecting...${R}"
      fi
    else
      echo -e "  ${RED}✗ Service didn't start. Check: sudo journalctl -u dotagents -f${R}"
    fi
  else
    echo -e "  ${D}Skipped. Run: sudo systemctl restart dotagents${R}"
  fi

  echo ""
  echo -e "${B}${C}╭───────────────────────────────────────────────────╮${R}"
  echo -e "${B}${C}│${R}  ${G}✓ Setup complete!${R}                                ${B}${C}│${R}"
  echo -e "${B}${C}╰───────────────────────────────────────────────────╯${R}"
  echo ""
  echo -e "  ${D}Try chatting: just type a message below${R}"
  echo -e "  ${D}Check status: /status${R}"
  echo ""
}

# ── Auto-setup on missing config ──────────────────────────────
CUR_API_KEY="$(get_config_val openaiApiKey)"
if [[ -z "$CUR_API_KEY" || "$CUR_API_KEY" == "test-key-placeholder" ]]; then
  echo -e "  ${Y}⚠ No API key configured.${R} Let's set things up."
  run_setup
else
  echo -e "  ${D}Type ${C}/help${D} for commands, or just type a message to chat.${R}"
  echo -e "  ${D}Tab completion available. Run ${C}/setup${D} to reconfigure.${R}"
  echo ""
fi


# ── REPL ──────────────────────────────────────────────────────
while true; do
  echo -en "${C}❯${R} "
  if ! read -re INPUT; then break; fi
  INPUT="$(echo "$INPUT" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
  [[ -z "$INPUT" ]] && continue

  # Add to bash history for up-arrow recall
  history -s "$INPUT"

  case "$INPUT" in
    /quit|/exit|/q)
      echo -e "${D}Bye! (service still running)${R}"; break ;;
    /help|/h)
      print_help ;;
    /setup)
      run_setup ;;
    /status)
      api_get /v1/operator/status | node_print "
        const d=JSON.parse(require('fs').readFileSync(0,'utf8'));
        const h=d.health||{};
        console.log('\x1b[1mHealth:\x1b[0m '+h.overall);
        Object.entries(h.checks||{}).forEach(([k,v])=>console.log('  '+k+': '+v.status+' — '+v.message));
        const i=d.integrations||{};
        if(i.discord){const dc=i.discord;console.log('\x1b[1mDiscord:\x1b[0m '+(dc.connected?'connected':'disconnected')+(dc.botUser?' ('+dc.botUser+')':''))}
        if(i.whatsapp) console.log('\x1b[1mWhatsApp:\x1b[0m '+(i.whatsapp.connected?'connected':'disconnected'));
        const m=d.mcp||{};
        if(m.tools) console.log('\x1b[1mMCP:\x1b[0m '+m.tools+' tools available');
      " || echo -e "${RED}Failed to fetch status${R}" ;;
    /health)
      api_get /v1/operator/health | node_print "
        const d=JSON.parse(require('fs').readFileSync(0,'utf8'));
        const icon=d.overall==='healthy'?'✓':d.overall==='warning'?'⚠':'✗';
        console.log(icon+' '+d.overall);
      " || echo -e "${RED}Failed${R}" ;;
    /discord)
      api_get /v1/operator/discord | node_print "
        const d=JSON.parse(require('fs').readFileSync(0,'utf8'));
        console.log('\x1b[1mDiscord Integration\x1b[0m');
        console.log('  Enabled:     '+(d.enabled?'\x1b[32myes':'\x1b[31mno')+'\x1b[0m');
        console.log('  Connected:   '+(d.connected?'\x1b[32m● yes':'\x1b[2m○ no')+'\x1b[0m');
        console.log('  Token:       '+(d.tokenConfigured?'\x1b[32mconfigured':'\x1b[33mnot set')+'\x1b[0m');
        if(d.botUser) console.log('  Bot user:    '+d.botUser);
        if(d.guilds!==undefined) console.log('  Servers:     '+d.guilds);
        if(!d.tokenConfigured) console.log('\n\x1b[2m  Hint: /discord token <your-bot-token>\x1b[0m');
        else if(!d.enabled) console.log('\n\x1b[2m  Hint: /discord enable\x1b[0m');
        else if(!d.connected) console.log('\n\x1b[2m  Hint: /discord connect\x1b[0m');
      " || echo -e "${RED}Failed to fetch Discord status${R}" ;;
    "/discord enable")
      api_patch /v1/settings -d '{"discordEnabled":true}' > /dev/null
      echo -e "${G}✓ Discord enabled${R}"
      echo -e "${D}  Hint: /discord connect${R}" ;;
    "/discord disable")
      api_post /v1/operator/discord/disconnect -d '{}' > /dev/null 2>&1 || true
      api_patch /v1/settings -d '{"discordEnabled":false}' > /dev/null
      echo -e "${Y}Discord disabled${R}" ;;
    "/discord connect")
      echo -e "${D}Connecting...${R}"
      api_post /v1/operator/discord/connect -d '{}' | node_print "
        const d=JSON.parse(require('fs').readFileSync(0,'utf8'));
        if(d.success) console.log('\x1b[32m✓ '+d.message+'\x1b[0m');
        else console.log('\x1b[31m✗ '+(d.error||d.message||'Failed')+'\x1b[0m');
      " || echo -e "${RED}Failed to connect${R}" ;;
    "/discord disconnect")
      api_post /v1/operator/discord/disconnect -d '{}' | node_print "
        const d=JSON.parse(require('fs').readFileSync(0,'utf8'));
        console.log(d.success?'\x1b[32m✓ Disconnected':'\x1b[31m✗ '+(d.error||'Failed'));
      " || echo -e "${RED}Failed${R}" ;;
    /discord\ token\ *)
      TOKEN="${INPUT#/discord token }"
      if [[ -z "$TOKEN" ]]; then
        echo -e "${Y}Usage: /discord token <bot-token>${R}"
      else
        api_patch /v1/settings -d "{\"discordBotToken\":\"$TOKEN\"}" > /dev/null \
          && echo -e "${G}✓ Discord bot token saved${R}" \
          && echo -e "${D}  Next: /discord enable → /discord connect${R}" \
          || echo -e "${RED}✗ Failed to save token${R}"
      fi ;;
    /discord\ profile\ *)
      PROF="${INPUT#/discord profile }"
      if [[ "$PROF" == "clear" ]]; then
        api_patch /v1/settings -d '{"discordDefaultProfileId":""}' > /dev/null
        echo -e "${G}✓ Default profile cleared${R}"
      else
        api_patch /v1/settings -d "{\"discordDefaultProfileId\":\"$PROF\"}" > /dev/null
        echo -e "${G}✓ Default profile set to: $PROF${R}"
      fi ;;
    /discord\ logs*)
      COUNT="${INPUT#/discord logs}"; COUNT="${COUNT## }"; COUNT="${COUNT:-10}"
      api_get "/v1/operator/discord/logs?count=$COUNT" | node_print "
        const d=JSON.parse(require('fs').readFileSync(0,'utf8'));
        const logs=d.logs||d||[];
        if(!Array.isArray(logs)||!logs.length){console.log('\x1b[2mNo logs\x1b[0m');process.exit()}
        logs.forEach(l=>{
          const ts=new Date(l.timestamp).toLocaleTimeString();
          const c=l.level==='error'?'\x1b[31m':l.level==='warn'?'\x1b[33m':'\x1b[2m';
          console.log(c+ts+' '+l.message+'\x1b[0m');
        });
      " || echo -e "${RED}Failed${R}" ;;

    # ── Discord-side Slash Command Reference ──────────────────
    # Static reference: lists the slash commands the bot REGISTERS in
    # Discord for end users. These are NOT CLI commands — they run from
    # the Discord client. The list and tier are kept in sync with
    # apps/desktop/src/main/discord-service.ts (registerSlashCommands +
    # READ_ONLY_SLASH_COMMANDS). Update both sides if either changes.
    "/discord slash"|"/discord help")
      cat <<SLASHEOF

$(echo -e "${B}Discord-side slash commands${R} ${D}(run inside Discord, not the CLI)${R}")

$(echo -e "${B}Read-only${R} ${D}— Discord app owner OR users in discordDmAllowUserIds${R}")
  $(echo -e "${C}/status${R}")             Bot status, health, integrations, owner count, session
  $(echo -e "${C}/whoami${R}")             Your Discord ID and trust level (no Developer Mode needed)
  $(echo -e "${C}/logs [count]${R}")       Recent bot logs (1-50)
  $(echo -e "${C}/new${R}")                Start a fresh conversation in the current channel

$(echo -e "${B}Mutating${R} ${D}— Discord application owner only${R}")
  $(echo -e "${C}/dm on|off${R}")          Enable or disable DMs (allowlist still applies)
  $(echo -e "${C}/dm allow|deny <user>${R}")  Add or remove a user from the DM allowlist
  $(echo -e "${C}/dm list${R}")            Show the DM allowlist
  $(echo -e "${C}/access show${R}")        Show current access rules
  $(echo -e "${C}/access allow-user|deny-user <user>${R}")
  $(echo -e "${C}/access allow-role|deny-role <role>${R}")
  $(echo -e "${C}/access allow-channel|deny-channel <channel>${R}")
  $(echo -e "${C}/mention on|off${R}")     Toggle @mention requirement
  $(echo -e "${C}/stop${R}")               Emergency stop — cancel all running agent tasks

$(echo -e "${D}The application owner is auto-detected from the Discord app at startup.${R}")
$(echo -e "${D}/ops commands are blocked until at least one discordOperatorAllow* list is set.${R}")
$(echo -e "${D}/new only resets your own conversation in this channel; prior history is preserved.${R}")

SLASHEOF
      ;;

    # ── Discord Access Control ────────────────────────────────
    "/discord access")
      # Access-control state lives in /v1/settings (not /v1/operator/discord,
      # which only returns runtime integration summary). Field names match the
      # ConfigStore schema exactly. Note: GET /v1/settings does not currently
      # return discordAllowRoleIds / discordDmAllowUserIds /
      # discordOperatorAllowRoleIds — those are write-only via PATCH today, so
      # they are intentionally not displayed here.
      api_get /v1/settings | node_print "
        const s=JSON.parse(require('fs').readFileSync(0,'utf8'));
        const show=(label,arr)=>{
          if(!Array.isArray(arr)||!arr.length) return;
          console.log('  '+label+': '+arr.join(', '));
        };
        console.log('\x1b[1mAccess Control\x1b[0m');
        console.log('  DMs:             '+(s.discordDmEnabled?'\x1b[32menabled':'\x1b[31mdisabled')+'\x1b[0m');
        console.log('  Require mention: '+(s.discordRequireMention!==false?'\x1b[32myes':'\x1b[33mno')+'\x1b[0m');
        show('User allowlist   ',s.discordAllowUserIds);
        show('Guild allowlist  ',s.discordAllowGuildIds);
        show('Channel allowlist',s.discordAllowChannelIds);
        console.log('\x1b[1mOperator Access\x1b[0m');
        show('Operator users   ',s.discordOperatorAllowUserIds);
        show('Operator guilds  ',s.discordOperatorAllowGuildIds);
        show('Operator channels',s.discordOperatorAllowChannelIds);
        if (s.discordDefaultProfileId)
          console.log('  Default profile: '+s.discordDefaultProfileId);
        const empty = !(s.discordAllowUserIds||[]).length
          && !(s.discordAllowGuildIds||[]).length
          && !(s.discordAllowChannelIds||[]).length;
        if (empty)
          console.log('\n\x1b[2m  No restrictions — all users can interact (when mentioned).\x1b[0m');
        // Server is fail-closed on /ops since commit 54a2fa0d: an empty
        // operator allowlist means /ops slash commands in Discord are
        // rejected with a 'configure the operator allowlists' message.
        // Note: GET /v1/settings does not currently return
        // discordOperatorAllowRoleIds, so a configuration that uses ONLY
        // role-based operator access will trigger a false positive here.
        const opsEmpty = !(s.discordOperatorAllowUserIds||[]).length
          && !(s.discordOperatorAllowGuildIds||[]).length
          && !(s.discordOperatorAllowChannelIds||[]).length;
        if (opsEmpty) {
          console.log('\n\x1b[33m  ⚠ /ops slash commands are blocked: no operator allowlist configured.\x1b[0m');
          console.log('\x1b[2m    Add a Discord ID to discordOperatorAllowUserIds (or guilds/channels) to enable.\x1b[0m');
          console.log('\x1b[2m    Example: /config set discordOperatorAllowUserIds [\"123456789012345678\"]\x1b[0m');
        }
      " || echo -e "${RED}Failed to fetch access settings${R}" ;;

    "/discord dm on")
      api_patch /v1/settings -d '{"discordDmEnabled":true}' > /dev/null \
        && echo -e "${G}✓ DMs enabled${R}" \
        || echo -e "${RED}✗ Failed${R}" ;;
    "/discord dm off")
      api_patch /v1/settings -d '{"discordDmEnabled":false}' > /dev/null \
        && echo -e "${G}✓ DMs disabled${R}" \
        || echo -e "${RED}✗ Failed${R}" ;;

    "/discord mention on")
      api_patch /v1/settings -d '{"discordRequireMention":true}' > /dev/null \
        && echo -e "${G}✓ Bot now requires @mention to respond in channels${R}" \
        && echo -e "${D}  Non-mentioned messages will still be recorded as context${R}" \
        || echo -e "${RED}✗ Failed${R}" ;;
    "/discord mention off")
      api_patch /v1/settings -d '{"discordRequireMention":false}' > /dev/null \
        && echo -e "${Y}⚠ Bot will now respond to ALL messages in allowed channels${R}" \
        && echo -e "${D}  Consider using channel/role allowlists to limit scope${R}" \
        || echo -e "${RED}✗ Failed${R}" ;;

    /discord\ dm\ allow\ *|/discord\ dm\ deny\ *|/discord\ allow\ *|/discord\ deny\ *)
      # Unified allow/deny handler — uses PATCH API so changes apply immediately
      node -e "
        const http=require('http');
        const input=process.argv[1], apiKey=process.argv[2], port=parseInt(process.argv[3]);
        const parts=input.split(/\s+/);
        let action,scope,id;
        if(parts[1]==='dm'){action=parts[2];scope='dm';id=parts[3]}
        else{action=parts[1];scope=parts[2];id=parts[3]}
        if(!id){console.log('\x1b[33mUsage: '+input.replace(id||'','')+'<id>\x1b[0m');process.exit(0)}
        const fieldMap={dm:'discordDmAllowUserIds',user:'discordAllowUserIds',role:'discordAllowRoleIds',
          channel:'discordAllowChannelIds',guild:'discordAllowGuildIds'};
        const field=fieldMap[scope];
        if(!field){console.log('\x1b[31mUnknown scope: '+scope+'\x1b[0m');process.exit(1)}
        const h={'Authorization':'Bearer '+apiKey};
        http.get({hostname:'127.0.0.1',port,path:'/v1/settings',headers:h},res=>{
          let body='';res.on('data',d=>body+=d);res.on('end',()=>{
            let cfg={};try{cfg=JSON.parse(body)}catch{}
            let list=cfg[field]||[];
            if(action==='allow') list=[...new Set([...list,id])];
            else list=list.filter(x=>x!==id);
            const patch={[field]:list};
            if(scope==='dm'&&action==='allow') patch.discordDmEnabled=true;
            const data=JSON.stringify(patch);
            const req=http.request({hostname:'127.0.0.1',port,path:'/v1/settings',method:'PATCH',
              headers:{...h,'Content-Type':'application/json','Content-Length':Buffer.byteLength(data)}},pres=>{
              let pb='';pres.on('data',d=>pb+=d);pres.on('end',()=>{
                const label=scope==='dm'?'DM allowlist':scope+' allowlist';
                if(pres.statusCode<300){
                  if(action==='allow'){
                    console.log('\x1b[32m✓ '+id+' added to '+label+'\x1b[0m');
                    if(scope==='dm') console.log('\x1b[32m  DMs auto-enabled\x1b[0m');
                  } else console.log('\x1b[32m✓ '+id+' removed from '+label+'\x1b[0m');
                  console.log('\x1b[2m  Applied immediately (no restart needed)\x1b[0m');
                } else console.log('\x1b[31m✗ Failed ('+pres.statusCode+')\x1b[0m');
              });
            });
            req.on('error',e=>console.log('\x1b[31m✗ '+e.message+'\x1b[0m'));
            req.write(data);req.end();
          });
        }).on('error',e=>console.log('\x1b[31m✗ '+e.message+'\x1b[0m'));
      " "$INPUT" "$API_KEY" "$PORT" 2>/dev/null ;;

    /profiles)
      api_get /v1/profiles | node_print "
        const d=JSON.parse(require('fs').readFileSync(0,'utf8'));
        const profiles=d.profiles||d||[];
        if(!profiles.length){console.log('\x1b[2mNo profiles\x1b[0m');process.exit()}
        profiles.forEach(p=>{
          const active=p.enabled!==false?'\x1b[32m●':'\x1b[2m○';
          console.log(active+' \x1b[1m'+p.name+'\x1b[0m \x1b[2m('+p.id+')\x1b[0m');
        });
      " || echo -e "${RED}Failed${R}" ;;
    /conversations)
      api_get /v1/conversations | node_print "
        const d=JSON.parse(require('fs').readFileSync(0,'utf8'));
        const convos=d.conversations||d||[];
        if(!convos.length){console.log('\x1b[2mNo conversations\x1b[0m');process.exit()}
        convos.slice(0,10).forEach(c=>{
          const ts=new Date(c.updatedAt||c.createdAt).toLocaleString();
          const title=c.title||c.id;
          console.log('  \x1b[2m'+ts+'\x1b[0m  '+title);
        });
      " || echo -e "${RED}Failed${R}" ;;
    /stop)
      echo -e "${Y}Sending emergency stop...${R}"
      api_post /v1/emergency-stop -d '{}' | node_print "
        const d=JSON.parse(require('fs').readFileSync(0,'utf8'));console.log(d.message||'Stopped');
      " || echo -e "${RED}Failed${R}" ;;
    /new)
      CONVERSATION_ID=""
      echo -e "${G}✓ New conversation started${R}" ;;
    /config\ get\ *)
      KEY="${INPUT#/config get }"
      VAL="$(get_config_val "$KEY")"
      if [[ -n "$VAL" ]]; then echo -e "  ${B}$KEY${R} = $VAL"
      else echo -e "${D}  (not set)${R}"; fi ;;
    /config\ set\ *)
      REST="${INPUT#/config set }"; KEY="${REST%% *}"; VAL="${REST#* }"
      if [[ -z "$KEY" || "$KEY" == "$VAL" ]]; then
        echo -e "${Y}Usage: /config set <key> <value>${R}"
        echo -e "${D}  Booleans: true|false   Numbers: 3210   Lists: '[\"a\",\"b\"]'${R}"
      else
        # Type-detect the value so PATCH /v1/settings accepts it. The server's
        # type guards reject string "true" / "3210" for fields typed as boolean
        # or number, so we coerce here based on shape:
        #   true|false        → boolean
        #   numeric           → number
        #   starts with [ or {→ JSON literal (array/object)
        #   anything else     → JSON-encoded string
        BODY="$(KEY_RAW="$KEY" VAL_RAW="$VAL" node -e "
          const k=process.env.KEY_RAW, v=process.env.VAL_RAW;
          let parsed;
          if (v==='true' || v==='false') parsed = (v==='true');
          else if (/^-?[0-9]+(\.[0-9]+)?$/.test(v)) parsed = Number(v);
          else if (v.startsWith('[') || v.startsWith('{')) {
            try { parsed = JSON.parse(v); } catch { parsed = v; }
          } else parsed = v;
          process.stdout.write(JSON.stringify({[k]: parsed}));
        " 2>/dev/null)"
        if [[ -z "$BODY" ]]; then
          echo -e "${RED}✗ Failed to encode value${R}"
        elif api_patch /v1/settings -d "$BODY" > /dev/null; then
          echo -e "${G}✓ $KEY updated${R}"
        else
          echo -e "${RED}✗ Failed to update $KEY${R} ${D}(unknown key, wrong type, or sensitive field — see /help)${R}"
        fi
      fi ;;
    /logs)
      api_get "/v1/operator/errors?count=10" | node_print "
        const d=JSON.parse(require('fs').readFileSync(0,'utf8'));
        const errs=d.errors||d||[];
        if(!errs.length){console.log('\x1b[32m✓ No recent errors\x1b[0m');process.exit()}
        errs.forEach(e=>{
          const ts=new Date(e.timestamp).toLocaleTimeString();
          console.log('\x1b[31m'+ts+' '+e.message+'\x1b[0m');
        });
      " || echo -e "${RED}Failed${R}" ;;
    /restart)
      echo -e "${Y}Restarting service...${R}"
      sudo systemctl restart dotagents 2>/dev/null || api_post /v1/operator/actions/restart-app -d '{}' > /dev/null 2>&1 || true
      echo -ne "${D}Waiting for service"
      attempts=0
      while [[ $attempts -lt 12 ]]; do
        sleep 2
        echo -ne "."
        if is_running; then
          # Re-read API key in case config changed
          API_KEY="$(get_config_val remoteServerApiKey)"
          echo ""
          echo -e "${G}✓ Service is back${R}"
          break
        fi
        attempts=$((attempts + 1))
      done
      if [[ $attempts -ge 12 ]]; then
        echo ""
        echo -e "${RED}Service not responding after 24s. Check: sudo journalctl -u dotagents -f${R}"
      fi ;;
    /*)
      echo -e "${Y}Unknown command.${R} Type ${C}/help${R} for options." ;;
    *)
      # ── Chat with agent (SSE streaming) ─────────────────────
      BODY="$(node -e "
        const msg=process.argv[1];
        const body={messages:[{role:'user',content:msg}],stream:true,send_push_notification:false};
        const cid=process.argv[2];
        if(cid) body.conversation_id=cid;
        process.stdout.write(JSON.stringify(body));
      " "$INPUT" "$CONVERSATION_ID" 2>/dev/null)"

      CURL_ERR_FILE="$(mktemp -t dotagents-curl-err.XXXXXX 2>/dev/null || echo "/tmp/dotagents-curl-err.$$")"

      # Stream SSE through a single long-lived node consumer so we can:
      #   (1) track step ids globally across chunks (server windows steps[] to last 3),
      #   (2) render streamingContent.text deltas as the model types,
      #   (3) surface curl/HTTP failures that the previous -sfN 2>/dev/null swallowed.
      {
        curl -sN -X POST \
          -H "Authorization: Bearer $API_KEY" \
          -H "Content-Type: application/json" \
          -d "$BODY" \
          -w 'HTTP_STATUS:%{http_code}\n' \
          "http://127.0.0.1:$PORT/v1/chat/completions" 2>"$CURL_ERR_FILE"
        echo "CURL_EXIT:$?"
      } | node -e "$(cat <<'NODE'
const readline = require('readline');
const fs = require('fs');
const rl = readline.createInterface({ input: process.stdin });

const dim = '\x1b[2m', reset = '\x1b[0m', red = '\x1b[0;31m';
const stepIcons = {
  thinking: '•', tool_call: '⚒', tool_result: '✓',
  completion: '✓', tool_approval: '?', response: '▸',
  error: '✗', pending_approval: '?',
};

const installDir = process.argv[1] || '';
const curlErrFile = process.argv[2] || '';
const seenStepIds = new Set();
let streamedLen = 0;
let onNewLine = true;
let httpStatus = 0;
let curlExit = 0;

function ensureNewline() {
  if (!onNewLine) { process.stdout.write('\n'); onNewLine = true; }
}

rl.on('line', (line) => {
  if (line.startsWith('HTTP_STATUS:')) {
    httpStatus = parseInt(line.slice('HTTP_STATUS:'.length), 10) || 0;
    return;
  }
  if (line.startsWith('CURL_EXIT:')) {
    curlExit = parseInt(line.slice('CURL_EXIT:'.length), 10) || 0;
    return;
  }
  if (!line.startsWith('data: ')) return;
  let d;
  try { d = JSON.parse(line.slice(6)); } catch { return; }

  if (d.type === 'progress') {
    const p = d.data || {};

    // Step lifecycle: print each new step id once (dim, with a type icon).
    const steps = Array.isArray(p.steps) ? p.steps : [];
    for (const s of steps) {
      if (!s || !s.id || seenStepIds.has(s.id)) continue;
      seenStepIds.add(s.id);
      ensureNewline();
      const icon = stepIcons[s.type] || '•';
      const title = s.title || s.type || 'step';
      const desc = s.description ? ' — ' + s.description : '';
      process.stdout.write(dim + icon + ' ' + title + desc + reset + '\n');
    }

    // Streaming assistant text: emit only the new suffix since last write.
    const sc = p.streamingContent;
    if (sc && typeof sc.text === 'string' && sc.text.length > streamedLen) {
      const delta = sc.text.slice(streamedLen);
      streamedLen = sc.text.length;
      process.stdout.write(delta);
      onNewLine = delta.endsWith('\n');
    }
  } else if (d.type === 'done') {
    const r = d.data || {};
    ensureNewline();
    if (r.content) {
      if (streamedLen === 0) {
        // No streaming happened — print the full final reply.
        process.stdout.write('\n' + r.content + '\n');
      } else {
        // We already streamed it incrementally; just terminate the line.
        process.stdout.write('\n');
      }
    }
    if (r.conversation_id && installDir) {
      try { fs.writeFileSync(installDir + '/.last_cid', 'CID:' + r.conversation_id); } catch {}
    }
  } else if (d.type === 'error') {
    ensureNewline();
    const m = (d.data && d.data.message) || 'Unknown';
    process.stdout.write(red + 'Error: ' + m + reset + '\n');
  }
});

rl.on('close', () => {
  if (curlExit !== 0) {
    ensureNewline();
    process.stderr.write(red + '✗ Network error talking to daemon (curl exit ' + curlExit + ')' + reset + '\n');
    try {
      if (curlErrFile) {
        const e = fs.readFileSync(curlErrFile, 'utf8').trim();
        if (e) process.stderr.write(dim + '  ' + e + reset + '\n');
      }
    } catch {}
  } else if (httpStatus && httpStatus >= 400) {
    ensureNewline();
    process.stderr.write(red + '✗ Daemon returned HTTP ' + httpStatus + reset + '\n');
    process.stderr.write(dim + '  Hint: /status for health, /logs for recent errors.' + reset + '\n');
  }
});
NODE
)" "$INSTALL_DIR" "$CURL_ERR_FILE"

      rm -f "$CURL_ERR_FILE"

      CID_LINE="$(cat "$INSTALL_DIR/.last_cid" 2>/dev/null || true)"
      if [[ "${CID_LINE:-}" == CID:* ]]; then
        CONVERSATION_ID="${CID_LINE#CID:}"
      fi
      echo ""
      ;;
  esac
done