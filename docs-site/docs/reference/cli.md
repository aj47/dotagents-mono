---
sidebar_position: 2
sidebar_label: "Headless CLI"
---

# Headless CLI

The DotAgents headless CLI is the terminal interface for running DotAgents on Linux servers, VPS hosts, and other headless environments.

It starts or attaches to the local DotAgents daemon and exposes chat, setup, health checks, Discord controls, configuration, logs, and emergency stop commands.

---

## Install

For a Linux source/headless install, run the installer in source mode:

```bash
curl -fsSL https://raw.githubusercontent.com/aj47/dotagents-mono/main/scripts/install.sh | DOTAGENTS_FROM_SOURCE=1 bash
```

The installer builds the headless app, runs onboarding, and installs the CLI at:

```bash
~/.local/bin/dotagents
```

If `~/.local/bin` is on your `PATH`, you can run:

```bash
dotagents
```

Otherwise run it directly:

```bash
~/.local/bin/dotagents
```

For VPS/systemd installs, use the VPS installer from the repository. It installs `dotagents` globally and manages the daemon with `systemd`.

---

## Onboarding

The Linux source/headless installer runs onboarding automatically. To re-run setup later:

```bash
dotagents
/setup
```

Or run setup directly:

```bash
dotagents setup
```

Setup asks which auth mode to use:

1. **Provider API token** — OpenAI-compatible API key, optional base URL, and model name.
2. **Codex ChatGPT OAuth (direct)** — use DotAgents' built-in OpenAI Codex provider with Codex device-code OAuth. No API key or `acpx` install is required.
3. **Codex via acpx** — configure an external acpx-managed Codex agent as the main agent.

It also asks for:

- Optional Discord bot token

For direct Codex mode, setup configures `mainAgentMode: api` with the `chatgpt-web` provider. It uses Codex CLI's ChatGPT login cache from:

```bash
~/.codex/auth.json
```

For acpx Codex mode, the setup flow creates a Codex agent profile at:

```bash
~/.agents/agents/codex/
```

If the Codex CLI is not installed, setup can install it with npm. If you choose the acpx mode, setup can also install `acpx`. You can install them manually:

```bash
npm install -g acpx@latest
npm install -g @openai/codex@latest
```

For headless SSH servers, DotAgents setup runs Codex device-code OAuth for you:

```bash
dotagents setup
```

Choose **Codex ChatGPT OAuth (direct)**, then choose to run OAuth. Open the shown link on your desktop browser, then enter the one-time code from the SSH session. Codex stores the login cache in `~/.codex/auth.json`, and DotAgents uses it directly through the `chatgpt-web` provider.

For non-interactive installs, set `DOTAGENTS_AUTH_MODE`:

```bash
DOTAGENTS_AUTH_MODE=codex        # direct Codex provider, no acpx
DOTAGENTS_AUTH_MODE=codex-acpx   # external acpx Codex agent
DOTAGENTS_AUTH_MODE=provider     # OpenAI-compatible API key
DOTAGENTS_AUTH_MODE=skip         # configure later
```

The CLI stores headless config at:

```bash
~/.config/app.dotagents/config.json
```

---

## Chat

Start the CLI and type a message:

```bash
dotagents
```

Inside the prompt:

```text
❯ summarize the repo and suggest the next task
```

Useful chat commands:

| Command | Description |
|---------|-------------|
| `/new` | Start a new conversation |
| `/conversations` | List recent conversations |
| `/stop` | Emergency stop the running agent |
| `/quit` | Exit the CLI; the service keeps running |

---

## System commands

| Command | Description |
|---------|-------------|
| `/help` | Show all CLI commands |
| `/setup` | Re-run onboarding |
| `/status` | Show service status and integrations |
| `/health` | Run a quick health check |
| `/profiles` | List agent profiles |
| `/logs` | Show recent errors |
| `/restart` | Restart the service |
| `/config get <key>` | Read a config value |
| `/config set <key> <value>` | Update a config value |

Examples:

```text
/status
/config get remoteServerPort
/config set mcpMaxIterations 25
```

---

## Discord commands

The CLI can configure and operate the Discord bot integration:

| Command | Description |
|---------|-------------|
| `/discord` | Show Discord status |
| `/discord token <token>` | Save the Discord bot token |
| `/discord enable` | Enable the Discord integration |
| `/discord connect` | Connect the bot |
| `/discord disconnect` | Disconnect the bot |
| `/discord logs [count]` | Show recent Discord logs |
| `/discord access` | Show access-control rules |
| `/discord slash` | Show Discord-side slash command reference |

Safe defaults require an `@mention` in servers. Use `/discord access` before widening access.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `dotagents: command not found` | Run `~/.local/bin/dotagents` directly or add `~/.local/bin` to your `PATH`. |
| CLI starts setup repeatedly | Re-run `/setup` and confirm the API key was saved to `~/.config/app.dotagents/config.json`. |
| Service will not start | Check that `xvfb-run` is installed and run `dotagents` again. |
| Discord is enabled but offline | Run `/discord`, then `/discord token <token>`, `/discord enable`, and `/discord connect`. |

For API-level debugging, see the [Remote API Reference](api) and [Debug & Diagnostics](debug).