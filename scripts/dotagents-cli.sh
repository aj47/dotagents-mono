#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# dotagents — Global CLI for DotAgents headless mode
#
# If the daemon is already running, attaches an interactive REPL
# that talks to it via the local API. Otherwise starts fresh.
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

INSTALL_DIR="__INSTALL_DIR__"
CONFIG_DIR="$HOME/.config/app.dotagents"
CONFIG_FILE="$CONFIG_DIR/config.json"

C='\033[0;36m'; G='\033[0;32m'; Y='\033[1;33m'; D='\033[2m'
B='\033[1m'; R='\033[0m'; RED='\033[0;31m'

get_config_val() {
  local key="$1"
  node -e "try{const c=JSON.parse(require('fs').readFileSync('$CONFIG_FILE','utf8'));console.log(c['$key']||'')}catch{}" 2>/dev/null
}

# ── Check if service is already running ───────────────────────
PORT="$(get_config_val remoteServerPort)"
PORT="${PORT:-3210}"
API_KEY="$(get_config_val remoteServerApiKey)"

is_running() {
  curl -sf -o /dev/null --max-time 2 \
    -H "Authorization: Bearer $API_KEY" \
    "http://127.0.0.1:$PORT/v1/operator/health" 2>/dev/null
}

if ! is_running; then
  # Not running — start fresh with interactive TTY
  exec xvfb-run --auto-servernum "$INSTALL_DIR/start-headless.sh"
fi

# ── Attached REPL mode ────────────────────────────────────────
echo -e "${B}${C}═══════════════════════════════════════════════════${R}"
echo -e "${B}  DotAgents CLI ${D}(attached to running service)${R}"
echo -e "${B}${C}═══════════════════════════════════════════════════${R}"
echo ""

# Fetch status
STATUS="$(curl -sf -H "Authorization: Bearer $API_KEY" "http://127.0.0.1:$PORT/v1/operator/status" 2>/dev/null)" || true
if [[ -n "$STATUS" ]]; then
  HEALTH="$(echo "$STATUS" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8'));console.log(d.health?.overall||'unknown')" 2>/dev/null || echo "unknown")"
  DISCORD="$(echo "$STATUS" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8'));const i=d.integrations||{};console.log(i.discord?.connected?'connected':'disconnected')" 2>/dev/null || echo "unknown")"
  echo -e "  ${B}Health:${R}  $HEALTH    ${B}Discord:${R}  $DISCORD    ${B}API:${R}  http://127.0.0.1:$PORT"
fi

echo ""
echo -e "${D}Commands: /status /discord /stop /quit${R}"
echo -e "${D}Type a message to chat with the agent.${R}"
echo ""

CONVERSATION_ID=""

# ── Main REPL loop ────────────────────────────────────────────
while true; do
  echo -en "${C}>${R} "
  if ! read -r INPUT; then
    break
  fi
  INPUT="$(echo "$INPUT" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
  [[ -z "$INPUT" ]] && continue

  case "$INPUT" in
    /quit|/exit|/q)
      echo -e "${D}Bye!${R}"
      break
      ;;
    /status)
      curl -sf -H "Authorization: Bearer $API_KEY" "http://127.0.0.1:$PORT/v1/operator/status" 2>/dev/null \
        | node -e "
          const d=JSON.parse(require('fs').readFileSync(0,'utf8'));
          const h=d.health||{};
          console.log('Health: '+h.overall);
          Object.entries(h.checks||{}).forEach(([k,v])=>console.log('  '+k+': '+v.status+' — '+v.message));
          const i=d.integrations||{};
          if(i.discord) console.log('Discord: '+(i.discord.connected?'connected':'disconnected'));
        " 2>/dev/null || echo -e "${RED}Failed to fetch status${R}"
      ;;
    /discord)
      curl -sf -H "Authorization: Bearer $API_KEY" "http://127.0.0.1:$PORT/v1/operator/discord" 2>/dev/null \
        | node -e "
          const d=JSON.parse(require('fs').readFileSync(0,'utf8'));
          console.log('Discord Integration:');
          console.log('  Enabled:   '+d.enabled);
          console.log('  Connected: '+d.connected);
          console.log('  Token:     '+(d.tokenConfigured?'configured':'not set'));
          if(d.botUser) console.log('  Bot:       '+d.botUser);
          if(d.guilds) console.log('  Servers:   '+d.guilds);
        " 2>/dev/null || echo -e "${RED}Failed to fetch Discord status${R}"
      ;;
    /stop)
      echo -e "${Y}Sending emergency stop...${R}"
      curl -sf -X POST -H "Authorization: Bearer $API_KEY" "http://127.0.0.1:$PORT/v1/emergency-stop" 2>/dev/null \
        | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8'));console.log(d.message||'Stopped')" 2>/dev/null \
        || echo -e "${RED}Failed${R}"
      ;;
    /new)
      CONVERSATION_ID=""
      echo -e "${G}Starting new conversation${R}"
      ;;
    /help)
      echo -e "${B}Commands:${R}"
      echo -e "  ${C}/status${R}   — Service health & integration status"
      echo -e "  ${C}/discord${R}  — Discord connection details"
      echo -e "  ${C}/stop${R}     — Emergency stop running agent"
      echo -e "  ${C}/new${R}      — Start a new conversation"
      echo -e "  ${C}/quit${R}     — Exit CLI (service keeps running)"
      echo -e "  ${D}Type any message to chat with the agent${R}"
      ;;
    /*)
      echo -e "${Y}Unknown command. Type /help for options.${R}"
      ;;
    *)
      # Send chat completion with SSE streaming
      BODY="{\"messages\":[{\"role\":\"user\",\"content\":$(node -e "process.stdout.write(JSON.stringify('$INPUT'.replace(/\\\\'/g,\"'\")))" 2>/dev/null || echo "\"$INPUT\"")}],\"stream\":true"
      if [[ -n "$CONVERSATION_ID" ]]; then
        BODY="$BODY,\"conversation_id\":\"$CONVERSATION_ID\""
      fi
      BODY="$BODY}"

      # Stream the response
      curl -sfN -X POST \
        -H "Authorization: Bearer $API_KEY" \
        -H "Content-Type: application/json" \
        -d "$BODY" \
        "http://127.0.0.1:$PORT/v1/chat/completions" 2>/dev/null \
      | while IFS= read -r line; do
        # Parse SSE data lines
        [[ "$line" != data:* ]] && continue
        DATA="${line#data: }"
        TYPE="$(echo "$DATA" | node -e "try{const d=JSON.parse(require('fs').readFileSync(0,'utf8'));process.stdout.write(d.type||'')}catch{}" 2>/dev/null)"
        case "$TYPE" in
          progress)
            MSG="$(echo "$DATA" | node -e "try{const d=JSON.parse(require('fs').readFileSync(0,'utf8'));const p=d.data||{};if(p.content)process.stdout.write(p.content);else if(p.message)process.stdout.write('\x1b[2m'+p.message+'\x1b[0m\n')}catch{}" 2>/dev/null)"
            [[ -n "$MSG" ]] && echo -en "$MSG"
            ;;
          done)
            # Extract final content and conversation ID
            echo "$DATA" | node -e "
              const d=JSON.parse(require('fs').readFileSync(0,'utf8')).data||{};
              if(d.content) console.log('\n'+d.content);
              if(d.conversation_id) process.stderr.write('CID:'+d.conversation_id);
            " 2>"$INSTALL_DIR/.last_cid" || true
            CID_LINE="$(cat "$INSTALL_DIR/.last_cid" 2>/dev/null)"
            if [[ "$CID_LINE" == CID:* ]]; then
              CONVERSATION_ID="${CID_LINE#CID:}"
            fi
            ;;
          error)
            echo "$DATA" | node -e "try{const d=JSON.parse(require('fs').readFileSync(0,'utf8'));console.log('\x1b[31mError: '+(d.data?.message||'Unknown error')+'\x1b[0m')}catch{}" 2>/dev/null
            ;;
        esac
      done
      echo ""
      ;;
  esac
done

