---
sidebar_position: 4
sidebar_label: "Observability"
---

# Observability (Langfuse)

DotAgents integrates with [Langfuse](https://langfuse.com/) to provide comprehensive monitoring, tracing, and debugging for all LLM calls and agent operations.

> **Note**: Langfuse is an optional dependency. The app works perfectly without it. Only set it up if you want observability features.

---

## What Gets Traced

| Component | Captured Data |
|-----------|---------------|
| **LLM Calls** | Model name, input prompts, output responses, token usage |
| **Agent Sessions** | Complete workflow from start to finish |
| **MCP Tool Calls** | Tool name, input parameters, output results, execution status |
| **Conversations** | Session-level grouping of all interactions |

## Setup

### 1. Create a Langfuse Account

- Sign up at [langfuse.com](https://langfuse.com/) (free tier available)
- Or self-host using [Langfuse's open-source deployment](https://langfuse.com/docs/deployment/self-host)

### 2. Get API Keys

1. Go to your Langfuse project settings
2. Copy your **Public Key** (`pk-lf-...`)
3. Copy your **Secret Key** (`sk-lf-...`)

### 3. Configure in DotAgents

1. Open **Settings > General** (scroll to the bottom)
2. Toggle **"Enable Langfuse Tracing"** on
3. Enter your Public Key
4. Enter your Secret Key
5. (Optional) Set the Base URL for self-hosted instances

## Viewing Traces

### Sessions

Conversations are grouped by session ID:
- Replay entire conversation threads
- See all agent interactions within a conversation
- Track costs and token usage per conversation
- Debug multi-turn conversations end-to-end

### Traces

Each agent session creates a trace containing:
- User input (voice transcription or text)
- All LLM generations with token counts
- All MCP tool calls with inputs/outputs
- Final output/response
- Agent tags (e.g., `agent:General Assistant`)

### Generations

Individual LLM API calls showing:
- Model used (e.g., `gpt-4o`, `gemini-2.0-flash`)
- Input messages/prompts
- Output response
- Token usage metrics (input/output/total)
- Latency

### Spans

MCP tool executions showing:
- Tool name
- Input parameters
- Output results
- Execution time
- Success/error status

## Langfuse Feature Mapping

| Langfuse Feature | DotAgents Mapping |
|------------------|-------------------|
| **Sessions** | Conversation ID — groups all interactions |
| **Traces** | Agent Session ID — individual agent run |
| **Tags** | Agent name (e.g., `agent:General Assistant`) |
| **Generations** | Individual LLM API calls with token usage |
| **Spans** | MCP tool executions with inputs/outputs |

## Self-Hosted Langfuse

For organizations requiring data privacy, set the base URL to your instance:

```
Base URL: https://your-langfuse-instance.com
```

Leave empty to use Langfuse Cloud (`https://cloud.langfuse.com`).

## Privacy

- Traces include LLM inputs and outputs — be mindful of sensitive data
- API keys are stored locally in the app's config
- No data is sent to Langfuse when the integration is disabled

## Debug Logging (Alternative)

For real-time debugging without Langfuse, use the built-in debug flags:

```bash
pnpm dev d               # ALL debug logging
pnpm dev debug-llm       # LLM calls only
pnpm dev debug-tools     # MCP tool execution only
pnpm dev debug-ui        # UI state changes only
```

See the [Debug Reference](/reference/debug) for details.

---

## Next Steps

- **[AI Providers](providers)** — Configure LLM providers
- **[MCP Tools](mcp)** — Tool execution monitoring
- **[Debug Reference](/reference/debug)** — Built-in debugging tools
