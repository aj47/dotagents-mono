# Glossary

Key terms and definitions used throughout DotAgents.

---

| Term | Definition |
|------|-----------|
| **ACP** | Agent Client Protocol — protocol for agent-to-agent communication and delegation. Based on JSON-RPC 2.0. |
| **Agent** | An AI persona with specific skills, tools, and behavior. Runs internally or as an external process. |
| **Agent Bundle** | A portable package containing an agent's profile, skills, and configuration for sharing. |
| **Agent Profile** | The complete definition of an agent: identity, system prompt, tool access, skills, and connection. |
| **.agents/** | The open standard directory for agent configuration. Works across DotAgents, Claude Code, Cursor, and others. |
| **Context Budgeting** | Automatic management of the LLM's context window, shrinking messages when limits approach. |
| **Delegation** | When one agent assigns a subtask to another agent via ACP. |
| **Dictation Mode** | Voice mode that transcribes speech and inserts text into the active application. |
| **Elicitation** | MCP 2025 protocol feature where a server requests additional input from the user during tool execution. |
| **Emergency Stop** | `Ctrl+Shift+Escape` — immediately aborts all active agent sessions and tool executions. |
| **Frontmatter** | YAML-like metadata at the top of markdown files, delimited by `---`. Used in skills, memories, and agent profiles. |
| **Global Layer** | The `~/.agents/` directory — personal agent config shared across all projects. |
| **Guidelines** | Additional behavioral rules in an agent profile, supplementing the system prompt. |
| **Hands-Free Mode** | Voice Activity Detection (VAD) mode on mobile — listens and sends automatically without button presses. |
| **Kill Switch** | Emergency stop mechanism. Same as Emergency Stop. |
| **Langfuse** | Open-source LLM observability platform. Optional integration for tracing and debugging. |
| **LLM** | Large Language Model — the AI model that powers agent reasoning (e.g., GPT-4o, Llama 3). |
| **Loop** | A recurring task that runs on a schedule (e.g., "check email every 10 minutes"). |
| **MCP** | Model Context Protocol — Anthropic's open standard for connecting AI models to tools and resources. |
| **MCP Client** | The side that calls tools. DotAgents is an MCP client. |
| **MCP Server** | An external process or endpoint that exposes tools. Connects via stdio, WebSocket, or HTTP. |
| **Memory** | Persistent context stored in `.agents/memories/` that persists across sessions. |
| **Panel Mode** | Compact floating window mode for the desktop app. |
| **Parakeet** | Local ONNX-based speech recognition model. No API key required. |
| **Remote Server** | Fastify HTTP server in the desktop app that mobile and external clients connect to. |
| **Session** | A single conversation thread with an agent, including messages and tool executions. |
| **Skill** | A markdown instruction file that teaches an agent how to do something. Stored in `.agents/skills/`. |
| **STT** | Speech-to-Text — converting spoken audio to text. Providers: OpenAI Whisper, Groq, Parakeet. |
| **System Prompt** | Core instructions that define an agent's behavior, personality, and constraints. |
| **tipc** | Typed IPC — type-safe communication between Electron's main and renderer processes. |
| **Tool** | A callable capability exposed by an MCP server (e.g., `github:search_repositories`). |
| **Tool Approval** | User confirmation required before a tool executes. Configurable per-agent and per-tool. |
| **TTS** | Text-to-Speech — converting text to spoken audio. Providers: OpenAI, Groq, Gemini, Kitten, Supertonic. |
| **VAD** | Voice Activity Detection — automatically detects when the user starts and stops speaking. |
| **Workspace Layer** | The `./.agents/` directory in a project — overrides global config for that project. |

---

## Next Steps

- **[Architecture Overview](../concepts/architecture.md)** — System design
- **[The .agents Protocol](../concepts/dot-agents-protocol.md)** — Protocol details
