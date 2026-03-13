# Security

DotAgents is designed with security as a primary concern. Your data stays on your machine, your API keys are encrypted, and all network communication uses HTTPS.

---

## Core Principles

1. **Local-first** — All user data is stored locally on your machine
2. **Zero collection** — No data is transmitted to DotAgents servers (there are none)
3. **Encrypted storage** — Sensitive data (API keys) is encrypted using system keychain
4. **HTTPS only** — All API calls use HTTPS with certificate validation
5. **User control** — You control which tools run and what data they access

## Data Protection

### Local Storage

| Data | Storage | Protection |
|------|---------|------------|
| **API Keys** | System keychain/keyring | Encrypted via `electron-safe-storage` |
| **Conversations** | Local files | File system permissions |
| **Configuration** | Local JSON/MD files | File system permissions |
| **Voice Recordings** | Local files | File system permissions |
| **Agent Profiles** | `.agents/` directory | File system permissions |

### No Cloud Sync

- No data is stored in cloud services
- No cross-device sync
- No automatic backups to external services
- No telemetry or usage analytics

## API Key Management

- **Encrypted storage** using `electron-safe-storage` (system keychain)
- **Main process only** — Keys are only accessible to the main process
- **Validation** — Keys are validated before use
- **Rotation** — Support for key rotation and revocation
- **Memory protection** — Keys are cleared from memory after use

## Network Security

- **HTTPS only** — All API calls use HTTPS
- **Certificate validation** — SSL certificates are validated
- **Direct connection** — API calls go directly to providers (no proxy)
- **Rate limiting** — Built-in rate limiting for API calls

## Tool Execution Safety

### Tool Approval

DotAgents supports tool approval policies:

- **Auto-approve** — Trust the agent to execute tools freely
- **Require approval** — Prompt for confirmation before tool execution
- **Per-tool policies** — Different policies for different tools

### MCP Server Isolation

- Each MCP server runs as a **separate process**
- Servers only have access to explicitly configured resources
- Agent profiles control **which servers and tools** each agent can use

### Emergency Stop

Press **`Ctrl+Shift+Escape`** to immediately stop all active agent sessions, tool executions, and ACP delegations.

## Third-Party Services

When you use DotAgents with AI providers:

| Concern | How It's Handled |
|---------|------------------|
| **API calls** | Go directly to the provider — not proxied |
| **Voice data** | Sent to STT provider for transcription |
| **Conversation data** | Sent to LLM provider for processing |
| **Tool results** | Sent to LLM provider as context |

DotAgents does not intercept, log, or store any data sent to or received from providers. See each provider's privacy policy for how they handle your data.

## Data Locations

| Platform | Path |
|----------|------|
| **macOS** | `~/Library/Application Support/DotAgents/` |
| **Windows** | `%APPDATA%/DotAgents/` |
| **Linux** | `~/.config/DotAgents/` |
| **Agent Config** | `~/.agents/` |

## Deleting Your Data

To completely remove all DotAgents data:

1. Uninstall the application
2. Delete the data directory for your platform (see table above)
3. Delete `~/.agents/` if it exists
4. Remove any workspace `.agents/` directories

## Vulnerability Reporting

If you discover a security vulnerability:

- **GitHub**: Create a security advisory on the [repository](https://github.com/aj47/dotagents-mono)
- **Responsible Disclosure**: 90-day disclosure timeline

## Best Practices

1. **Rotate API keys** regularly
2. **Use least privilege** — Give API keys minimal required permissions
3. **Monitor usage** — Watch for unusual API activity
4. **Keep updated** — Use the latest DotAgents version
5. **Review tool access** — Only enable MCP servers you trust
6. **Use tool approval** — Enable confirmation for sensitive tools

---

## Next Steps

- **[Privacy Policy](privacy.md)** — Full privacy details
- **[MCP Tools](../tools/mcp.md)** — Tool security configuration
- **[Agent Profiles](../agents/profiles.md)** — Per-agent access control
