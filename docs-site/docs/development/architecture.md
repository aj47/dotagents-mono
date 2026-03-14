---
sidebar_position: 2
sidebar_label: "Architecture Deep Dive"
---

# Architecture Deep Dive

Technical architecture details for contributors and developers building on DotAgents.

---

## Monorepo Layout

```
dotagents-mono/
├── apps/
│   ├── desktop/                  # Electron desktop app
│   │   ├── src/
│   │   │   ├── main/             # Main process (Node.js)
│   │   │   │   ├── llm.ts                    # Core agent loop (3500+ lines)
│   │   │   │   ├── mcp-service.ts            # MCP client (2500+ lines)
│   │   │   │   ├── acp-service.ts            # ACP agent manager (2000+ lines)
│   │   │   │   ├── remote-server.ts          # Fastify HTTP server (3500+ lines)
│   │   │   │   ├── tipc.ts                   # IPC handlers (5800+ lines)
│   │   │   │   ├── agent-profile-service.ts  # Agent CRUD (1200+ lines)
│   │   │   │   ├── skills-service.ts         # Skill management (1600+ lines)
│   │   │   │   ├── keyboard.ts               # Hotkeys via Rust (1400+ lines)
│   │   │   │   ├── builtin-tools.ts          # Built-in tool handlers (1600+ lines)
│   │   │   │   ├── config.ts                 # Config persistence (700+ lines)
│   │   │   │   ├── conversation-service.ts   # Conversation storage
│   │   │   │   ├── memory-service.ts         # Memory management
│   │   │   │   ├── oauth-client.ts           # OAuth 2.1 client
│   │   │   │   ├── langfuse-service.ts       # Langfuse integration
│   │   │   │   ├── bundle-service.ts         # Agent bundle export/import
│   │   │   │   ├── agents-files/             # .agents/ protocol implementation
│   │   │   │   │   ├── modular-config.ts     # Layered config loading
│   │   │   │   │   ├── agent-profiles.ts     # Profile file parsing
│   │   │   │   │   ├── skills.ts             # Skill file parsing
│   │   │   │   │   ├── memories.ts           # Memory file parsing
│   │   │   │   │   ├── frontmatter.ts        # Frontmatter parser
│   │   │   │   │   └── safe-file.ts          # Atomic file I/O
│   │   │   │   ├── acp/                      # ACP protocol implementation
│   │   │   │   │   ├── acp-client-service.ts
│   │   │   │   │   ├── acp-router-tool-definitions.ts
│   │   │   │   │   └── types.ts
│   │   │   │   └── tts/                      # TTS provider implementations
│   │   │   │       ├── kitten-tts.ts
│   │   │   │       └── supertonic-tts.ts
│   │   │   ├── renderer/src/                 # React UI (88 components)
│   │   │   │   ├── pages/                    # Route pages
│   │   │   │   ├── components/               # Reusable components
│   │   │   │   ├── stores/                   # Zustand state
│   │   │   │   ├── hooks/                    # Custom React hooks
│   │   │   │   └── router.tsx                # React Router config
│   │   │   └── shared/                       # Types shared between processes
│   │   │       └── types.ts
│   │   └── dotagents-rs/                     # Rust native binary
│   └── mobile/                               # React Native app (Expo)
│       ├── src/
│       │   ├── screens/                      # App screens
│       │   ├── store/                        # State management
│       │   ├── lib/                          # API client
│       │   └── hooks/                        # Custom hooks
│       └── App.tsx                           # Entry point
├── packages/
│   ├── shared/src/                           # Shared types and utilities
│   │   ├── types.ts                          # Core types
│   │   ├── api-types.ts                      # API contract types
│   │   ├── session.ts                        # Session types
│   │   ├── providers.ts                      # Provider constants
│   │   ├── colors.ts                         # Design tokens
│   │   ├── languages.ts                      # 30+ language definitions
│   │   ├── tts-preprocessing.ts              # Markdown → speech
│   │   ├── chat-utils.ts                     # Message formatting
│   │   ├── shell-parse.ts                    # Shell command parsing
│   │   ├── connection-recovery.ts            # Retry logic
│   │   └── hub.ts                            # Agent bundle publishing
│   └── mcp-whatsapp/                         # WhatsApp MCP server
├── website/                                  # Static marketing site
├── scripts/                                  # Build scripts
└── tests/                                    # Integration tests
```

## Core Services

### LLM Engine (`llm.ts`)

The heart of DotAgents. Manages the agent loop:

1. Receives user input (text or transcribed voice)
2. Builds message array with system prompt, skills, memories, conversation history
3. Calls AI provider via Vercel AI SDK
4. Processes response — text or tool calls
5. If tool calls: executes via MCP service, feeds results back
6. Repeats until agent signals completion or hits limits

Key subsystems:
- **Context budgeting** — Shrinks messages when approaching token limits
- **Continuation guards** — Prevents infinite agent loops
- **Verification replay** — Validates tool execution chains
- **Message queue** — Holds messages when agent is busy

### MCP Service (`mcp-service.ts`)

Manages all MCP server connections:

- **Connection lifecycle** — Spawn, connect, disconnect, reconnect
- **Tool discovery** — Lists tools from connected servers
- **Tool execution** — Routes tool calls to correct server
- **OAuth 2.1** — Automatic token management for protected servers
- **Server status** — Tracks connection state per server

### ACP Service (`acp-service.ts`)

Manages agent-to-agent delegation:

- **Agent registry** — Tracks available delegation targets
- **Process spawning** — Starts agent processes on demand
- **JSON-RPC** — Sends requests and receives responses
- **Bidirectional** — Handles permission requests from sub-agents
- **Session tracking** — Manages in-flight and completed delegations

### TIPC Handlers (`tipc.ts`)

The bridge between main and renderer processes. Every feature in the UI has a corresponding IPC handler here. Uses `@egoist/tipc` for type safety.

## Design Patterns

### Singleton Services

```typescript
class AgentProfileService {
  private static instance: AgentProfileService | null = null

  static getInstance(): AgentProfileService {
    if (!AgentProfileService.instance) {
      AgentProfileService.instance = new AgentProfileService()
    }
    return AgentProfileService.instance
  }

  private constructor() {}
}

export const agentProfileService = AgentProfileService.getInstance()
```

### Separation of Definitions and Handlers

Tool definitions are kept in dependency-free files:
- `builtin-tool-definitions.ts` — No service imports
- `acp-router-tool-definitions.ts` — No service imports

Handlers are in separate files that can import services. This prevents circular dependencies.

### Layered Configuration

```
Defaults (hardcoded)
    ↓
config.json (user settings file)
    ↓
~/.agents/ (global .agents layer)
    ↓
./.agents/ (workspace .agents layer — wins)
```

### Atomic File I/O (`safe-file.ts`)

All configuration writes follow this pattern:
1. Write to a temp file
2. Rename temp to target (atomic on most filesystems)
3. Create a timestamped backup
4. Auto-rotate old backups

### Tool Naming

```
External MCP:      {serverName}:{toolName}
Built-in settings: speakmcp-settings:{toolName}
Built-in builtin:  speakmcp-builtin:{toolName}
```

For LLM providers that don't support `:` in tool names, it's sanitized to `__COLON__`.

### Session State

Two managers prevent race conditions:
- **agentSessionStateManager** — Tracks in-flight sessions with mutex-like semantics
- **agentSessionTracker** — Records completed sessions for history

## Type Hierarchy

```
@dotagents/shared (packages/shared/src/types.ts)
  └── ToolCall, ToolResult, BaseChatMessage, ChatApiResponse

apps/desktop/src/shared/types.ts
  ├── MCPServerConfig, MCPConfig, MCPTransportType
  ├── OAuthConfig, OAuthTokens
  ├── AgentProfile, AgentProfileConnection, AgentProfileToolConfig
  ├── AgentSkill, AgentSkillsData
  ├── AgentMemory
  └── Config (main app config)

apps/desktop/src/main/agents-files/
  ├── AgentsLayerPaths
  ├── LoadedAgentsSkillsLayer
  └── LoadedAgentsMemoriesLayer

apps/desktop/src/main/acp/types.ts
  ├── ACPAgentDefinition
  ├── ACPRunRequest, ACPRunResult
  └── ACPMessage
```

## Renderer Architecture

### Pages

| Page | Route | Purpose |
|------|-------|---------|
| `sessions.tsx` | `/` | Main chat interface |
| `panel.tsx` | `/panel` | Floating voice panel |
| `settings-general.tsx` | `/settings/general` | General settings |
| `settings-providers.tsx` | `/settings/providers` | API key management |
| `settings-models.tsx` | `/settings/models` | Model selection |
| `settings-capabilities.tsx` | `/settings/capabilities` | MCP servers/tools |
| `settings-agents.tsx` | `/settings/agents` | Agent profiles |
| `settings-loops.tsx` | `/settings/loops` | Recurring tasks |
| `settings-whatsapp.tsx` | `/settings/whatsapp` | WhatsApp config |
| `memories.tsx` | `/memories` | Memory management |
| `onboarding.tsx` | `/onboarding` | First-time setup |

### State Management

Zustand stores with persistence:
- `agent-store.ts` — Agent profiles and selection
- `conversation-store.ts` — Messages and history

### Key Components

| Component | Purpose |
|-----------|---------|
| `agent-progress.tsx` | Real-time tool execution visualization |
| `agent-selector.tsx` | Agent switching dropdown |
| `mcp-config-manager.tsx` | MCP server configuration UI |
| `mcp-tool-manager.tsx` | Individual tool toggle UI |
| `bundle-import-dialog.tsx` | Agent bundle import |
| `bundle-export-dialog.tsx` | Agent bundle export |
| `markdown-renderer.tsx` | Markdown display with syntax highlighting |

## Rust Binary (`dotagents-rs/`)

A native binary for cross-platform keyboard handling:

- **Keyboard monitoring** — Captures system-wide key events
- **Text injection** — Types text into any active application
- **Hotkey registration** — Registers global hotkeys
- **Low-level input** — Works without window focus

Built with `pnpm build-rs` and loaded by the main process.

---

## Next Steps

- **[Development Setup](setup)** — Build from source
- **[Contributing](contributing)** — How to contribute
- **[Protocol Ecosystem](/concepts/protocol-ecosystem)** — Protocol details
