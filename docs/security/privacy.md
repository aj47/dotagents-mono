# Privacy Policy

DotAgents operates on a **zero-data-collection** principle. We do not collect, store, or transmit any personal information to external servers.

---

## What We Don't Collect

- **No personal information** — Names, emails, or identifying data
- **No conversation data** — Your conversations are never transmitted to us
- **No API keys** — Your keys are stored locally, never sent to us
- **No usage analytics** — No tracking or analytics
- **No telemetry** — No system or usage telemetry

## Local-Only Storage

All data is stored **exclusively** on your local machine:

| Data | Storage |
|------|---------|
| Conversations | Local files on your device |
| Settings | Local configuration files |
| API Keys | Encrypted in system keychain |
| MCP Configs | Local JSON files |
| Voice Recordings | Local audio files |
| Agent Profiles | `.agents/` directory |
| Memories | `.agents/memories/` directory |

## Third-Party Services

When you use AI providers (OpenAI, Groq, Gemini):

- Your API calls go **directly** to the service provider
- DotAgents does **not** proxy or intercept communications
- Subject to the privacy policies of the respective providers

When you use MCP servers:

- MCP servers run **locally** on your machine
- No external communication unless explicitly configured by you
- You control which servers to install and use

## Your Rights

- **Full access** to all your data at all times
- **Export** your data whenever you want
- **Delete** all data by uninstalling and removing data directories
- **No account required** — Use completely anonymously

## Compliance

- **GDPR compliant** — No data processing occurs
- **CCPA compliant** — No personal information collected
- **Open source** — Full source code available for audit

---

## Next Steps

- **[Security](security.md)** — Security model and best practices
