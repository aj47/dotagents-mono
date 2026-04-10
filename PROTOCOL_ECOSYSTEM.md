# DotAgents Protocol Ecosystem Research Summary

## Executive Overview

DotAgents is building an **open protocol ecosystem** for AI agent orchestration and configuration management. The system integrates five major protocols/standards:

1. **MCP (Model Context Protocol)** - Tool/resource access protocol
2. **ACP (Agent Client Protocol)** - Agent delegation and communication protocol  
3. **Skills** - Instruction-based capability extension (Anthropic Agent Skills spec)
4. **Agent Profiles** - Unified agent definition and configuration
5. **.agents/ Protocol** - Modular, file-based configuration system

These work together as a cohesive ecosystem where agents can be configured, extended with skills, delegated to other agents, and access tools through standardized protocols.

---

## 1. MCP (Model Context Protocol)

### What It Is
MCP is Anthropic's open protocol for connecting AI models to tools and resources. DotAgents acts as an **MCP client** that connects to MCP servers.

### Architecture
- **Client**: DotAgents main process (`mcp-service.ts`)
- **Servers**: External processes or HTTP endpoints that expose tools
- **Transport Types**:
  - `stdio`: Local process spawned with JSON-RPC over stdin/stdout
  - `websocket`: WebSocket connection to remote server
  - `streamableHttp`: HTTP endpoint with streaming support (includes OAuth 2.1)

### Configuration
```typescript
// MCPServerConfig in types.ts
interface MCPServerConfig {
  transport?: "stdio" | "websocket" | "streamableHttp"
  command?: string        // For stdio
  args?: string[]         // For stdio
  env?: Record<string, string>
  url?: string           // For remote transports
  headers?: Record<string, string>
  oauth?: OAuthConfig    // For protected servers
  timeout?: number
  disabled?: boolean
}
```

### Tool Naming Convention
- Tools are prefixed with server name: `{serverName}:{toolName}`
- Example: `github:search_repositories`, `exa:search`
- DotAgents runtime tools use plain tool names with no server prefix.

### Key Features
- **OAuth 2.1 Support**: Automatic token refresh for protected servers
- **Tool Discovery**: Dynamically lists available tools from each server
- **Tool Execution**: Calls tools with JSON arguments, returns structured results
- **Server Status Tracking**: Monitors connection state and availability

### Example MCP Servers in Config
```json
{
  "mcpServers": {
    "github": {
      "transport": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "..." }
    },
    "exa": {
      "transport": "streamableHttp",
      "url": "https://mcp.exa.ai/mcp"
    }
  }
}
```

---

## 2. ACP (Agent Client Protocol)

### What It Is
ACP is Zed's protocol for **agent-to-agent communication and delegation**. DotAgents acts as an **ACP client** that can spawn and communicate with ACP agents.

### Architecture
- **Client**: DotAgents main process (`acp-service.ts`, `acp-client-service.ts`)
- **Agents**: External processes (Auggie, Claude Code ACP, etc.) or HTTP endpoints
- **Communication**: JSON-RPC 2.0 over stdio or HTTP
- **Bidirectional**: Agents can request permissions, read/write files from the client

### Connection Types
```typescript
type ACPConnectionType = "stdio" | "remote" | "internal"

// stdio: Spawn local process
// remote: Connect to HTTP endpoint
// internal: Use DotAgents's built-in agent
```

### Agent Definition
```typescript
interface ACPAgentDefinition {
  name: string
  displayName: string
  description: string
  capabilities?: string[]
  baseUrl: string
  spawnConfig?: {
    command: string
    args: string[]
    env?: Record<string, string>
    cwd?: string
  }
  timeout?: number
  idleTimeoutMs?: number
}
```

### Key Features
- **Agent Spawning**: Automatically starts agent processes on demand
- **Session Management**: Tracks active runs and sessions
- **Bidirectional RPC**: Agents can request permissions, file I/O
- **Streaming Support**: Real-time output from agent execution
- **Capability Negotiation**: Protocol version and feature handshake

### Agent Delegation Flow
1. Main agent calls `delegate_to_agent`
2. ACP router looks up agent in registry
3. Agent is spawned (if not already running)
4. Request is sent via JSON-RPC
5. Agent processes request and returns results
6. Results are streamed back to main agent

---

## 3. Skills System

### What It Is
Skills are **instruction-based capability extensions** based on Anthropic's Agent Skills specification. They allow agents to be extended with specialized knowledge without code changes.

### Skill Format
Skills are stored as markdown files with simple `key: value` frontmatter (not full YAML):

```markdown
---
id: my-skill-id
name: My Skill
description: What this skill does
createdAt: 1234567890
updatedAt: 1234567890
source: local | imported
filePath: /path/to/skill.md
---

# Skill Instructions

Your detailed instructions here in markdown...
```

### Skill Types
- **Local**: Created within DotAgents
- **Imported**: Loaded from external files or repositories

### Skill Loading
- Skills are loaded from `.agents/skills/` directory
- Scanned recursively (up to 8 levels deep)
- Merged by ID (workspace overrides global)
- Loaded into agent context at runtime

### Skill Usage
1. Agent sees skill name/description in system prompt
2. Agent calls `load_skill_instructions` to get full instructions
3. Agent uses skill knowledge to complete tasks
4. Skills can reference external files via `filePath` field

### Example Skill
```markdown
---
id: document-processing
name: Document Processing
description: Create, edit, and analyze .docx files
---

# Document Processing Skill

## Overview
This skill enables working with Word documents...

## Workflows
1. Creating new documents
2. Modifying existing documents
3. Working with tracked changes
```

---

## 4. Agent Profiles (Unified Agent Type)

### What It Is
`AgentProfile` is a **unified type** that consolidates all agent definitions (previously scattered across `Profile`, `Persona`, `ACPAgentConfig`).

### Agent Profile Structure
```typescript
interface AgentProfile {
  // Identity
  id: string
  name: string                    // Canonical name for lookup
  displayName: string             // User-facing name
  description?: string
  avatarDataUrl?: string | null

  // Behavior
  systemPrompt?: string
  guidelines?: string
  properties?: Record<string, string>

  // Model Configuration (for internal agents)
  modelConfig?: ProfileModelConfig

  // Tool Access
  toolConfig?: AgentProfileToolConfig

  // Skills
  skillsConfig?: ProfileSkillsConfig

  // Connection - how to run this agent
  connection: AgentProfileConnection

  // State
  isStateful?: boolean
  conversationId?: string

  // Classification
  role?: AgentProfileRole
  enabled?: boolean
  isBuiltIn?: boolean
  isUserProfile?: boolean
  isAgentTarget?: boolean
  isDefault?: boolean
}
```

### Connection Types
```typescript
type AgentProfileConnectionType = "internal" | "acp" | "stdio" | "remote"

interface AgentProfileConnection {
  type: AgentProfileConnectionType
  command?: string        // For acp/stdio
  args?: string[]
  env?: Record<string, string>
  cwd?: string
  baseUrl?: string       // For remote
}
```

### Tool Configuration
```typescript
interface AgentProfileToolConfig {
  enabledServers?: string[]           // Whitelist of MCP servers
  disabledServers?: string[]          // Blacklist of MCP servers
  disabledTools?: string[]            // Specific tools to disable
  enabledRuntimeTools?: string[]       // Whitelist of DotAgents runtime tools
  allServersDisabledByDefault?: boolean
}
```

### Runtime Tool Control (Option B Semantics)
- **DotAgents runtime tools**: Controlled via `enabledRuntimeTools` **allowlist**
  - `undefined` or `null` = allow all runtime tools
  - `[]` = unconfigured, allow all runtime tools
  - `["tool1", "tool2"]` = allow only these + essential tools
  - `mark_work_complete` is **always enabled**
- **External MCP tools**: Controlled via `disabledTools` **denylist**

### Agent Roles
- `delegation-target`: Can be delegated to by other agents
- `user-profile`: User-created agent
- `system-agent`: Built-in system agent

### Management
- Managed by `AgentProfileService` singleton
- Persisted in `config.json` and `.agents/` layer
- UI at `/settings/agents`

---

## 5. .agents/ Protocol (Modular Configuration)

### What It Is
A **file-based, modular configuration system** that stores agent-related settings, skills, agent profiles, and knowledge notes as organized files instead of a monolithic JSON blob.

### Design Philosophy
- **Modular**: Separate concerns into different files
- **Portable**: Easy to version control, share, and migrate
- **Layered**: Global + workspace layers with overlay semantics
- **Human-Readable**: Markdown and JSON formats
- **Resilient**: Atomic writes, timestamped backups, auto-recovery

### Directory Structure
```
.agents/
├── dotagents-settings.json       # General settings (subset of Config)
├── mcp.json                      # MCP servers + tool config
├── models.json                   # Model presets + provider keys
├── system-prompt.md              # Custom system prompt
├── agents.md                     # Agent guidelines/tools system prompt
├── layouts/
│   └── ui.json                   # UI/layout settings
├── skills/
│   ├── skill-1/
│   │   └── skill.md              # Skill definition + instructions
│   └── skill-2/
│       └── skill.md
├── knowledge/
│   └── project-architecture/
│       ├── project-architecture.md  # Note frontmatter + markdown body
│       ├── diagram.png              # Note-local asset
│       └── db-schema.pdf            # Note-local asset
└── .backups/                     # Timestamped backups (auto-rotated)
    ├── skills/
    └── knowledge/
```

### Two-Layer System
**Global Layer** (`~/.agents/`):
- Canonical source of truth
- Created on app startup if missing
- Updated when user changes settings in UI
- Shared across all workspaces

**Workspace Layer** (`<workspace>/.agents/`):
- Optional overlay on top of global
- Set via explicit workspace configuration using the `DOTAGENTS_WORKSPACE_DIR` environment variable
- Workspace settings override global settings

### Merge Semantics
```
Final Config = Global Config + Workspace Config (workspace wins on conflicts)
```

Skills and knowledge notes merge by ID, with workspace content overriding global content on conflicts.

### File Formats

Markdown frontmatter in `.agents/` uses a simple `key: value` format. It is not full YAML.

#### JSON Files (dotagents-settings.json, mcp.json, models.json)
```json
{
  "key": "value",
  "nested": { "key": "value" }
}
```

#### Markdown Files (system-prompt.md, agents.md)
```markdown
---
# Optional simple frontmatter
---

# Markdown body content
This is the actual prompt/guidelines text.
```

#### Skill Files (.agents/skills/<skill-id>/skill.md)
```markdown
---
kind: skill
id: my-skill
name: My Skill
description: What it does
createdAt: 1234567890
updatedAt: 1234567890
source: local | imported
filePath: /path/to/execution/context
---

# Skill Instructions

Your detailed instructions...
```

#### Note Files (.agents/knowledge/<slug>/<slug>.md)
```markdown
---
kind: note
id: project-architecture
title: Project Architecture
context: auto
updatedAt: 1234567890
tags: architecture, backend
summary: Service-oriented Electron app with layered .agents config.
---

## Details

Longer-form markdown content goes here.
```

Notes are the canonical markdown artifact under `.agents/knowledge/`. The small runtime-injected subset are **working notes**, selected via `context: auto`; most notes should default to `context: search-only`.

Note-local assets such as images or PDFs may live anywhere inside the same note folder.

### Infrastructure Components

**frontmatter.ts**
- Simple `key: value` parser (not full YAML)
- Handles quoted values with `'` or `"`
- Supports comments with `#`
- Serializes back to markdown

**safe-file.ts**
- Atomic writes (temp file + rename)
- Timestamped backups with auto-rotation
- Auto-recovery from corrupted files
- Prevents data loss on crashes

**modular-config.ts**
- `AgentsLayerPaths` type for path calculations
- `loadAgentsLayerConfig()` reads all config files
- `writeAgentsLayerFromConfig()` writes config to files
- Layer path resolution logic

**skills.ts**
- `loadAgentsSkillsLayer()` scans and loads skills
- `parseSkillMarkdown()` / `stringifySkillMarkdown()`
- Skill merging by ID
- Recursive directory scanning

**knowledge / notes loader**
- Loads notes from `.agents/knowledge/`
- Parses note frontmatter and markdown body
- Merges notes by ID across global and workspace layers
- Uses `context: auto | search-only` to determine runtime selection behavior

---

## How These Protocols Work Together

### The Complete Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    DotAgents Application                      │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
                ▼             ▼             ▼
        ┌──────────────┐ ┌──────────┐ ┌──────────────┐
        │ Agent        │ │ MCP      │ │ .agents/     │
        │ Profiles     │ │ Servers  │ │ Config       │
        │ (ACP)        │ │ (Tools)  │ │ (Skills,     │
        │              │ │          │ │  Knowledge)  │
        └──────────────┘ └──────────┘ └──────────────┘
                │             │             │
                └─────────────┼─────────────┘
                              │
                    ┌─────────▼──────────┐
                    │  Main Agent        │
                    │  (Internal or ACP) │
                    └────────────────────┘
```

### Configuration Loading
1. **App Startup**:
   - Load `config.json` (global settings)
   - Load `.agents/` layer (global)
   - Load workspace `.agents/` layer (if explicitly configured via `DOTAGENTS_WORKSPACE_DIR`)
   - Merge: `config = defaults + config.json + .agents/global + .agents/workspace`

2. **Agent Initialization**:
   - Load `AgentProfile` from config
   - Load skills for agent from `.agents/skills/`
   - Load notes from `.agents/knowledge/`
   - Build system prompt with skills plus working notes (`context: auto`)
   - Initialize MCP service with servers from config

3. **Tool Execution**:
   - Agent calls tool: `{server}:{toolName}`
   - If runtime tool → execute in `runtime-tools.ts`
   - If MCP tool → route to appropriate MCP server
   - If ACP delegation tool → spawn/communicate with ACP agent

### Agent Delegation Example
```
User Input
    │
    ▼
Main Agent (internal LLM)
    │
    ├─ Sees available agents via list_available_agents
    │
    ├─ Decides to delegate to "code-agent"
    │
    ├─ Calls delegate_to_agent
    │
    ▼
ACP Router
    │
    ├─ Looks up "code-agent" in ACP registry
    │
    ├─ Spawns process: `claude-code-acp --acp`
    │
    ├─ Sends JSON-RPC request with task
    │
    ▼
Code Agent (ACP)
    │
    ├─ Processes task
    │
    ├─ Requests permissions via JSON-RPC
    │
    ├─ Reads/writes files via JSON-RPC
    │
    ▼
Results streamed back to Main Agent
```

### Skill Usage Example
```
Agent System Prompt includes:
  "Available Skills:
   - document-processing: Create, edit, and analyze .docx files
   - code-generation: Generate and refactor code"

Agent decides to use document-processing skill
    │
    ▼
Agent calls load_skill_instructions
    │
    ▼
Load from .agents/skills/document-processing/skill.md
    │
    ▼
Return full instructions to agent
    │
    ▼
Agent uses skill knowledge to complete task
```

---

## Key Design Patterns

### 1. Singleton Services
All major services use singleton pattern:
```typescript
class MyService {
  private static instance: MyService | null = null
  static getInstance(): MyService {
    if (!MyService.instance) MyService.instance = new MyService()
    return MyService.instance
  }
  private constructor() {}
}
export const myService = MyService.getInstance()
```

### 2. Dependency-Free Definitions
Tool definitions are kept in separate files without dependencies:
- `runtime-tool-definitions.ts` (no imports from services)
- `acp-router-tool-definitions.ts` (no imports from services)
- Handlers are in separate files that can import services

### 3. Layered Configuration
```
Defaults
    ↓
config.json (user settings)
    ↓
.agents/global/ (modular config)
    ↓
.agents/workspace/ (workspace overrides)
```

### 4. Tool Naming Convention
- External MCP: `{serverName}:{toolName}`
- DotAgents runtime tools: `{toolName}`
- Sanitization: `:` → `__COLON__` for LLM providers

### 5. Bidirectional Communication
- **Client → Server**: Tool calls, agent requests
- **Server → Client**: Permissions, file I/O, notifications

---

## Conceptual Data Model

```
@dotagents/shared (packages/shared/src/types.ts)
  └─ ToolCall, ToolResult, BaseChatMessage, ChatApiResponse

Conceptual .agents model
  ├─ AgentProfile
  ├─ AgentSkill
  ├─ KnowledgeNote
  ├─ WorkingNote (note where context = auto)
  └─ Config (main app config)

Layer loaders
  ├─ AgentsLayerPaths
  ├─ LoadedAgentsSkillsLayer
  └─ LoadedAgentsKnowledgeLayer

ACP protocol types
  ├─ ACPAgentDefinition
  ├─ ACPRunRequest, ACPRunResult
  └─ ACPMessage
```

---

## Website / Landing Page

The repo now contains a static website in `website/` for `https://dotagents.app`. The project includes:
- **Desktop Application**: Electron-based (macOS, Windows, Linux)
- **Mobile Application**: React Native (Expo)
- **Website**: Static landing page in `website/`
- **Documentation**: Markdown files in repo (README.md, DEVELOPMENT.md, AGENTS.md)
- **External Resources**: Discord, GitHub, techfren.net (referenced but not in repo)

---

## Summary: The Open Protocol Ecosystem

DotAgents is building a **composable, open protocol ecosystem** where:

1. **MCP** provides standardized **tool access** (GitHub, Exa, filesystem, etc.)
2. **ACP** enables **agent delegation** (Auggie, Claude Code, custom agents)
3. **Skills** extend agents with **specialized knowledge** (document processing, code generation)
4. **Agent Profiles** unify **agent configuration** (system prompt, guidelines, tools, skills)
5. **.agents/ Protocol** provides **modular, portable configuration and knowledge notes** (version-controllable, workspace-aware)

These protocols are **not competing standards** but **complementary layers** that work together:
- **MCP** = "What tools can I access?"
- **ACP** = "What agents can I delegate to?"
- **Skills** = "What knowledge do I have?"
- **Agent Profiles** = "Who am I and how am I configured?"
- **.agents/** = "How is my configuration stored and shared?"

The result is a **flexible, extensible platform** for AI agent orchestration that can be:
- **Extended** with new MCP servers and ACP agents
- **Configured** via modular `.agents/` files
- **Shared** across teams and workspaces
- **Versioned** in git repositories
- **Composed** into complex multi-agent systems

