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
CONFIG_DIR="$HOME/.config/app.dotagents"
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
  exec xvfb-run --auto-servernum "$INSTALL_DIR/start-headless.sh"
fi

# ── Tab completion ────────────────────────────────────────────
COMMANDS=(
  "/help" "/quit" "/exit" "/status" "/stop" "/new"
  "/profiles" "/conversations" "/logs"
  "/discord" "/discord status" "/discord enable" "/discord disable"
  "/discord token" "/discord profile" "/discord logs" "/discord connect" "/discord disconnect"
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
    const hc=h.overall==='pass'?'\x1b[32m✓':h.overall==='warning'?'\x1b[33m⚠':'\x1b[31m✗';
    const ds=dc.connected?'\x1b[32m● connected':'\x1b[2m○ disconnected';
    console.log('  Health: '+hc+' '+h.overall+'\x1b[0m');
    console.log('  Discord: '+ds+'\x1b[0m');
    console.log('  API: \x1b[2mhttp://127.0.0.1:${PORT}\x1b[0m');
  "
fi

echo ""
echo -e "  ${D}Type ${C}/help${D} for commands, or just type a message to chat.${R}"
echo -e "  ${D}Tab completion available for all commands.${R}"
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
  $(echo -e "${C}/discord${R}")           Show Discord status
  $(echo -e "${C}/discord enable${R}")    Enable Discord bot
  $(echo -e "${C}/discord disable${R}")   Disable Discord bot
  $(echo -e "${C}/discord connect${R}")   Connect the bot
  $(echo -e "${C}/discord disconnect${R}")Disconnect the bot
  $(echo -e "${C}/discord token <t>${R}") Set bot token
  $(echo -e "${C}/discord profile <id>${R}") Set default profile
  $(echo -e "${C}/discord logs [n]${R}")  Show recent Discord logs

$(echo -e "${B}System${R}")
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
        const icon=d.overall==='pass'?'✓':d.overall==='warning'?'⚠':'✗';
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
      api_post /v1/operator/discord/disconnect > /dev/null 2>&1 || true
      api_patch /v1/settings -d '{"discordEnabled":false}' > /dev/null
      echo -e "${Y}Discord disabled${R}" ;;
    "/discord connect")
      echo -e "${D}Connecting...${R}"
      api_post /v1/operator/discord/connect | node_print "
        const d=JSON.parse(require('fs').readFileSync(0,'utf8'));
        if(d.success) console.log('\x1b[32m✓ '+d.message+'\x1b[0m');
        else console.log('\x1b[31m✗ '+(d.error||d.message||'Failed')+'\x1b[0m');
      " || echo -e "${RED}Failed to connect${R}" ;;
    "/discord disconnect")
      api_post /v1/operator/discord/disconnect | node_print "
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
    "/discord logs"*)
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
      api_post /v1/emergency-stop | node_print "
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
      else
        api_patch /v1/settings -d "{\"$KEY\":\"$VAL\"}" > /dev/null \
          && echo -e "${G}✓ $KEY updated${R}" \
          || echo -e "${RED}✗ Failed to update $KEY${R}"
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
      api_post /v1/operator/actions/restart-app > /dev/null 2>&1 || true
      echo -e "${D}Reconnecting in 5s...${R}"; sleep 5
      if is_running; then echo -e "${G}✓ Service is back${R}"
      else echo -e "${RED}Service not responding yet.${R}"; fi ;;
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

      curl -sfN -X POST \
        -H "Authorization: Bearer $API_KEY" \
        -H "Content-Type: application/json" \
        -d "$BODY" \
        "http://127.0.0.1:$PORT/v1/chat/completions" 2>/dev/null \
      | while IFS= read -r line; do
        [[ "$line" != data:* ]] && continue
        DATA="${line#data: }"
        echo "$DATA" | node_print "
          const d=JSON.parse(require('fs').readFileSync(0,'utf8'));
          if(d.type==='progress'){
            const p=d.data||{};
            if(p.content) process.stdout.write(p.content);
            else if(p.message) process.stdout.write('\x1b[2m'+p.message+'\x1b[0m\n');
          } else if(d.type==='done'){
            const r=d.data||{};
            if(r.content) console.log('\n'+r.content);
            if(r.conversation_id) require('fs').writeFileSync('$INSTALL_DIR/.last_cid','CID:'+r.conversation_id);
          } else if(d.type==='error'){
            console.log('\x1b[31mError: '+(d.data?.message||'Unknown')+'\x1b[0m');
          }
        "
      done
      CID_LINE="$(cat "$INSTALL_DIR/.last_cid" 2>/dev/null || true)"
      if [[ "${CID_LINE:-}" == CID:* ]]; then
        CONVERSATION_ID="${CID_LINE#CID:}"
      fi
      echo ""
      ;;
  esac
done