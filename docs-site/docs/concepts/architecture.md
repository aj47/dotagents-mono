---
sidebar_position: 1
sidebar_label: "Architecture"
---

# Architecture Overview

DotAgents is a monorepo containing a desktop app, mobile app, shared libraries, and a Docusaurus website — all built around the `.agents` open protocol.

---

## System Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     User Interface                        │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────┐  │
│  │  Desktop App   │  │  Mobile App    │  │  Panel UI  │  │
│  │  (Electron)    │  │  (React Native)│  │  (Floating) │  │
│  └───────┬────────┘  └───────┬────────┘  └─────┬──────┘  │
│          │                   │                  │         │
│          └───────────┬───────┘                  │         │
│                      │                          │         │
│              ┌───────▼──────────────────────────▼──┐      │
│              │         Remote Server (Fastify)      │      │
│              │         HTTP API for clients          │      │
│              └───────────────┬──────────────────────┘      │
│                              │                             │
│              ┌───────────────▼──────────────────────┐      │
│              │         Core Agent Engine             │      │
│              │  ┌─────────┐ ┌──────────┐ ┌────────┐│      │
│              │  │ LLM     │ │ MCP      │ │ ACP    ││      │
│              │  │ Engine  │ │ Service  │ │ Service││      │
│              │  └─────────┘ └──────────┘ └────────┘│      │
│              │  ┌─────────┐ ┌──────────┐ ┌────────┐│      │
│              │  │ Skills  │ │ Notes    │ │ Config ││      │
│              │  │ Service │ │ Service  │ │ Service││      │
│              │  └─────────┘ └──────────┘ └────────┘│      │
│              └──────────────────────────────────────┘      │
│                              │                             │
│              ┌───────────────▼──────────────────────┐      │
│              │         External Services             │      │
│              │  ┌─────────┐ ┌──────────┐ ┌────────┐│      │
│              │  │ MCP     │ │ ACP      │ │ AI     ││      │
│              │  │ Servers │ │ Agents   │ │Providers│      │
│              │  └─────────┘ └──────────┘ └────────┘│      │
│              └──────────────────────────────────────┘      │
└──────────────────────────────────────────────────────────┘
```

## Monorepo Structure

```
dotagents-mono/
├── apps/
│   ├── desktop/              # Electron desktop application
│   │   ├── src/main/         # Main process (Node.js)
│   │   ├── src/renderer/     # Renderer process (React)
│   │   ├── src/shared/       # Shared types between processes
│   │   └── dotagents-rs/     # Rust native binary (keyboard/input)
│   └── mobile/               # React Native mobile app (Expo)
│       ├── src/screens/      # App screens
│       ├── src/store/        # State management
│       └── src/lib/          # API client and utilities
├── packages/
│   ├── core/                 # Platform-agnostic config/runtime primitives
│   ├── shared/               # Shared types, utilities, constants
│   └── mcp-whatsapp/         # WhatsApp MCP server package
├── docs-site/                # Docusaurus docs and primary website
├── apps/promo-studio/        # Tracked promotional/demo renders
├── scripts/                  # Build and release scripts
└── tests/                    # Integration tests
```

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Desktop Shell** | Electron 31 | Cross-platform desktop app |
| **Desktop UI** | React 18, TailwindCSS | Renderer process UI |
| **Mobile** | Expo 54, React Native 0.81 | Cross-platform mobile app |
| **IPC** | @egoist/tipc | Type-safe main-to-renderer communication |
| **Native Input** | Rust (dotagents-rs) | Keyboard monitoring, text injection |
| **Remote API** | Fastify | HTTP server for mobile/external clients |
| **AI SDK** | Vercel AI SDK | Multi-provider LLM integration |
| **MCP** | @modelcontextprotocol/sdk | Tool execution protocol |
| **ACP/acpx** | JSON-RPC + DotAgents adapters | Agent delegation and injected runtime tools |
| **State** | Zustand | Client-side state management |
| **Routing** | React Router v6 | Desktop app navigation |
| **Navigation** | React Navigation | Mobile app navigation |
| **Docs** | Docusaurus | Documentation site |
| **Build** | electron-vite, tsup | Desktop and library bundling |
| **Tests** | Vitest | Unit and integration testing |
| **Package Manager** | pnpm 9 | Monorepo dependency management |

## Process Architecture (Desktop)

The desktop app runs two Electron processes:

### Main Process

The main process handles all system-level operations:

- **LLM Engine** (`llm.ts`) — Core agent loop, tool calling, response generation, context management
- **MCP Service** (`mcp-service.ts`) — Connects to MCP servers, discovers tools, executes calls
- **ACP/acpx Services** (`acp-service.ts`, `acpx/`) — Spawn external agents, manage JSON-RPC communication, and expose scoped runtime tools
- **Agent Profile Service** (`agent-profile-service.ts`) — CRUD for agent profiles
- **Skills Service** (`skills-service.ts`) — Loads and manages agent skills from `.agents/skills/`
- **Knowledge Notes Service** (`knowledge-notes-service.ts`) — Persistent durable context via `.agents/knowledge/`
- **Keyboard Service** (`keyboard.ts`) — System-wide hotkeys via Rust binary
- **TTS Services** — Text-to-speech via OpenAI, Groq, Gemini, Kitten, Supertonic
- **Remote Server** (`remote-server.ts`) — Fastify HTTP API for mobile clients
- **Discord and WhatsApp Services** — Optional messaging integrations and operator commands
- **Config Service** (`config.ts`) — Layered configuration management
- **Conversation Service** (`conversation-service.ts`) — Persistent conversation storage
- **OAuth Client** (`oauth-client.ts`) — OAuth 2.1 for MCP server authentication
- **Langfuse Service** (`langfuse-service.ts`) — Optional LLM observability

### Renderer Process

The renderer process is a React application with:

- **88 React components** across pages, dialogs, and UI elements
- **Zustand stores** for agent state, conversation state, and UI state
- **Real-time progress tracking** for tool execution
- **Markdown rendering** with syntax highlighting
- **Session management** with grid and kanban views

### Communication

Main and renderer communicate via **typed IPC** (`@egoist/tipc`), defined in `tipc.ts` with 5800+ lines of handler registrations covering every feature.

## Data Flow

```
User Input (Voice/Text)
    │
    ▼
Transcription (STT Provider)
    │
    ▼
LLM Engine (Agent Loop)
    │
    ├── Checks agent profile for system prompt, skills, guidelines
    ├── Builds message history with context budgeting
    ├── Calls AI provider (OpenAI/Groq/Gemini)
    │
    ▼
LLM Response
    │
    ├── If text response → display/speak/insert
    ├── If tool call → route to MCP/ACP
    │   │
    │   ├── MCP Tool → execute via MCP server → return result
    │   ├── ACP Delegation → spawn agent → get result
    │   └── Runtime Tool → execute internally → return result
    │
    └── Continue agent loop until complete
```

## Key Design Patterns

### Singleton Services

All major services use the singleton pattern for consistent state:

```typescript
class MyService {
  private static instance: MyService | null = null
  static getInstance(): MyService {
    if (!MyService.instance) MyService.instance = new MyService()
    return MyService.instance
  }
}
```

### Layered Configuration

Configuration merges in order, with later layers winning:

```
Defaults → config.json → ~/.agents/ (global) → ./.agents/ (workspace)
```

### Tool Naming Convention

Tools are namespaced by their source:
- External MCP: `{serverName}:{toolName}` (e.g., `github:search_repositories`)
- DotAgents runtime: `{toolName}`

### Session State Management

Two managers prevent race conditions:
- **agentSessionStateManager** — Tracks in-flight sessions
- **agentSessionTracker** — Records completed sessions

### Emergency Stop

`emergencyStopAll()` aborts all active agent sessions immediately. Triggered by `Ctrl+Shift+Escape`.

---

## Next Steps

- **[The .agents Protocol](dot-agents-protocol)** — The open standard for agent configuration
- **[Protocol Ecosystem](protocol-ecosystem)** — How MCP, ACP, and Skills interoperate
- **[Development Architecture](/development/architecture)** — Contributor-focused technical deep dive
