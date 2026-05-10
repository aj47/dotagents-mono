---
sidebar_position: 4
sidebar_label: "Discord"
---

# Discord Integration

DotAgents can run a Discord bot from the desktop app so trusted DMs, mentions, threads, or allowlisted channels can talk to an agent profile.

---

## What It Enables

- DM-based chat with a selected DotAgents agent
- Guild/channel routing with allowlists
- Mention-required mode for safer shared-channel use
- Per-conversation session continuity with `/new` to fork a fresh conversation
- Trusted `/ops` operator commands for runtime status, logs, tunnels, integrations, updater actions, MCP restarts, and agent runs

## Requirements

- A Discord application with a bot token
- `discord.js` dependency installed in the desktop package
- Message Content intent enabled in the Discord developer portal
- DotAgents desktop running with Discord enabled

You can provide the bot token in **Settings > Discord** or through `DOTAGENTS_DISCORD_BOT_TOKEN`. A default agent can be selected in settings or through `DOTAGENTS_DISCORD_DEFAULT_PROFILE_ID`.

## Setup

1. Create or open a Discord application in the Discord developer portal.
2. Add a bot and copy its token.
3. Enable the Message Content intent.
4. Invite the bot to the target server with permissions to read and send messages.
5. In DotAgents desktop, open **Settings > Discord**.
6. Enable Discord, paste the token, select the default agent profile, and click **Connect**.
7. Configure access lists before using the bot in shared servers.

## Access Controls

Discord chat access and operator access are separate.

| Setting | Purpose |
|---------|---------|
| `discordDmEnabled` | Allow direct messages to the bot. |
| `discordRequireMention` | Require the bot to be mentioned in guild channels. |
| `discordAllowUserIds` | Users allowed to chat with the bot. |
| `discordAllowGuildIds` | Guilds allowed to chat with the bot. |
| `discordAllowChannelIds` | Channels or thread parents allowed to chat with the bot. |
| `discordAllowRoleIds` | Roles allowed to chat with the bot. |
| `discordDmAllowUserIds` | Users allowed to use direct messages when DM access should be narrower. |
| `discordOperatorAllowUserIds` | Users allowed to run `/ops` commands. |
| `discordOperatorAllowGuildIds` | Guilds where `/ops` commands are allowed. |
| `discordOperatorAllowChannelIds` | Channels where `/ops` commands are allowed. |
| `discordOperatorAllowRoleIds` | Roles allowed to run `/ops` commands. |

Operator commands fail closed. If no operator allowlist is configured, `/ops` commands are disabled even when normal Discord chat is enabled.

## Operator Commands

Trusted operators can send `/ops` commands through Discord:

```text
/ops help
/ops status
/ops health
/ops errors [count]
/ops audit [count]
/ops system
/ops sessions
/ops conversations [count]
/ops run <prompt>
/ops logs [count] [error|warning|info]
/ops mcp
/ops mcp restart <server>
/ops updater
/ops updater check
/ops updater download
/ops updater reveal
/ops updater open
/ops updater releases
/ops tunnel
/ops tunnel start
/ops tunnel stop
/ops discord status
/ops discord connect
/ops discord disconnect
/ops whatsapp status
/ops whatsapp connect
/ops whatsapp logout
/ops restart-server
/ops restart-app
```

These commands call the same operator endpoints documented in [Remote API Reference](/reference/api).

## Sessions

DotAgents maps each Discord conversation location to a stable conversation key:

- DM channel
- Guild channel
- Thread or thread parent

Use `/new` in a Discord conversation to increment that conversation's session epoch and start a fresh DotAgents conversation while preserving previous history.

## Privacy and Logging

`discordLogMessages` controls whether message content is retained in integration logs. Keep it disabled for sensitive servers unless you need message-level diagnostics.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Bot never connects | Verify the token, enable Discord in settings, and confirm `discord.js` is installed. |
| Bot cannot read messages | Enable Message Content intent in the Discord developer portal. |
| DMs work but server channels do not | Check guild/channel/user/role allowlists and mention-required mode. |
| `/ops` command is denied | Configure a Discord operator allowlist; normal chat allowlists do not grant operator privileges. |
| Wrong agent responds | Set **Default profile** in Settings > Discord or `DOTAGENTS_DISCORD_DEFAULT_PROFILE_ID`. |

---

## Next Steps

- **[Remote API Reference](/reference/api)** — Operator endpoints used by `/ops`
- **[Agent Profiles](/agents/profiles)** — Choose which agent Discord should run
- **[Settings Reference](/configuration/settings)** — Discord configuration fields
