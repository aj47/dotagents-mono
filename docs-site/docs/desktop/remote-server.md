---
sidebar_position: 2
sidebar_label: "Remote Server & Pairing"
---

# Remote Server & Mobile Pairing

The DotAgents desktop app includes a Fastify remote server for mobile clients, operator dashboards, and automation. It is disabled by default for local-only installs; enable it when you want your phone or another client to talk to the desktop agent engine.

---

## What It Enables

- Mobile chat over the same desktop agent engine
- QR-code pairing with the mobile app
- Easy mobile pairing using a LAN or Tailscale URL when available
- OpenAI-compatible `/v1/chat/completions` streaming
- Agent, skill, knowledge note, loop, MCP, and settings management endpoints
- Optional operator endpoints for health, logs, Discord, WhatsApp, updater, and tunnel controls
- Optional Cloudflare Tunnel exposure for remote access

## Enable the Server

1. Open **Settings > Remote Server** in the desktop app.
2. Toggle **Remote Server** on.
3. Keep **Bind address** as `127.0.0.1` for same-machine clients, or switch to `0.0.0.0` only when you intentionally need LAN access.
4. Keep or rotate the generated API key.
5. Use the QR code from the desktop settings page to pair mobile.

| Setting | Default | Notes |
|---------|---------|-------|
| **Enabled** | `false` | The server does not start unless enabled, except explicit QR/headless flows. |
| **Port** | `3210` | Change if another process uses the port. |
| **Bind address** | `127.0.0.1` | Use `0.0.0.0` only for LAN/tunnel scenarios. |
| **API key** | Generated locally | Sent as `Authorization: Bearer <key>`. |
| **Log level** | `info` | `error`, `info`, or `debug`. |
| **CORS origins** | `*` | Restrict this for exposed deployments. |
| **Terminal QR** | Auto in headless | Useful for VPS/headless pairing flows. |

## Pair Mobile

1. Enable the desktop remote server.
2. In the desktop app, open the remote server settings and show the QR code.
3. In the mobile app, open **Connection Settings** and scan the QR code.
4. The QR configures the API base URL and bearer token.

The mobile app then talks to the desktop runtime, so it can use your desktop MCP servers, agents, knowledge notes, loops, and conversations.

### Easy Pairing And Deep Links

Desktop remote-server settings can show an **Easy Mobile Pairing** block when a reachable URL is known. The pairing payload is a `dotagents://config` deep link containing the API base URL and a one-time view of the remote API key. Streamer Mode hides the QR code and link text while still allowing the server to run.

When Tailscale is installed and running, DotAgents reads `tailscale status --json`, prefers the Tailscale IPv4 address, and builds a pairing URL such as:

```text
http://100.x.y.z:3210/v1
```

If Tailscale is unavailable, use the LAN URL from the settings page or enter the host manually on mobile. For LAN pairing, bind to `0.0.0.0` only when the network is trusted.

### Reset Or Rotate Pairing

Use the remote-server settings reset/rotate controls when a mobile device has stale connection details, a QR payload was shared too broadly, or a tunnel URL changed. Rotating the API key immediately invalidates older mobile bearer tokens, so re-scan the QR code or open the updated deep link afterward.

## API Shape

DotAgents exposes an OpenAI-compatible run endpoint plus management endpoints:

```http
POST /v1/chat/completions
GET  /v1/models
GET  /v1/agent-profiles
GET  /v1/skills
GET  /v1/knowledge/notes
GET  /v1/loops
GET  /v1/mcp/servers
GET  /v1/operator/health
```

See the [Remote API Reference](/reference/api) for endpoint details.

## Cloudflare Tunnel

Use a tunnel only when you need access outside your LAN. DotAgents supports:

- **Quick tunnel** — easiest for temporary access.
- **Named tunnel** — use `cloudflareTunnelId`, `cloudflareTunnelHostname`, and optional credentials path for a stable hostname.

Security guidance:

- Rotate the remote server API key before sharing a tunnel.
- Keep CORS origins narrow for non-local deployments.
- Prefer allowlists for operator devices and messaging integrations.
- Treat tunnel URLs like credentials.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Mobile cannot connect | Confirm the server is enabled and the URL uses your desktop's reachable IP/hostname. |
| `401 Unauthorized` | Re-scan the QR code or rotate/copy the current API key. |
| Works on desktop but not phone | Use `0.0.0.0` bind for LAN, ensure firewall allows the port, and use a LAN IP instead of `localhost`. |
| Tunnel is reachable but API fails | Check API key, CORS origins, and the operator health endpoint. |

---

## Next Steps

- **[Mobile App](/mobile/overview)** — Mobile client setup and native build notes
- **[Remote API](/reference/api)** — Endpoint reference
- **[Settings Reference](/configuration/settings)** — Remote server configuration fields
