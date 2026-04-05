import type { AgentProfileConnectionType } from "./types"

export type ExternalAgentPresetKey = "auggie" | "claude-code" | "codex" | "opencode"

export type ExternalAgentSetupMode = "connect-existing" | "managed"

export type ExternalAgentPresetDefinition = {
  displayName: string
  description: string
  connectionType: Extract<AgentProfileConnectionType, "acp" | "stdio">
  connectionCommand: string
  connectionArgs?: string
  docsUrl?: string
  installCommand?: string
  authHint?: string
  cwdHint?: string
  verifyArgs?: string[]
  setupMode: ExternalAgentSetupMode
  onboardingNote: string
}

export const EXTERNAL_AGENT_PRESETS: Record<ExternalAgentPresetKey, ExternalAgentPresetDefinition> = {
  auggie: {
    displayName: "Auggie (Augment Code)",
    description: "Augment Code's AI coding assistant with native ACP support",
    connectionType: "acp",
    connectionCommand: "auggie",
    connectionArgs: "--acp",
    docsUrl: "https://www.augmentcode.com/",
    cwdHint: "Point the working directory at the repo you want Auggie to operate in.",
    verifyArgs: ["--help"],
    setupMode: "connect-existing",
    onboardingNote: "Best for users who already have Auggie installed and authenticated.",
  },
  "claude-code": {
    displayName: "Claude Code",
    description: "Anthropic's Claude for coding tasks via ACP adapter",
    connectionType: "acp",
    connectionCommand: "claude-code-acp",
    connectionArgs: "",
    docsUrl: "https://github.com/zed-industries/claude-code-acp",
    installCommand: "npm install -g @zed-industries/claude-code-acp",
    authHint: "Sign in to Claude Code in your terminal before verifying if this is your first run.",
    cwdHint: "Use your repo root so Claude Code inherits the right project context.",
    verifyArgs: ["--help"],
    setupMode: "connect-existing",
    onboardingNote: "Connect an existing Claude Code install and verify it before continuing.",
  },
  codex: {
    displayName: "Codex",
    description: "OpenAI Codex via the official ACP adapter",
    connectionType: "acp",
    connectionCommand: "codex-acp",
    connectionArgs: "",
    docsUrl: "https://github.com/zed-industries/codex-acp",
    installCommand: "npm install -g @zed-industries/codex-acp",
    authHint: "Run codex login first, or set CODEX_API_KEY / OPENAI_API_KEY before verifying.",
    cwdHint: "Set the working directory to the project Codex should inspect and edit.",
    verifyArgs: ["--help"],
    setupMode: "connect-existing",
    onboardingNote: "Connect an existing Codex ACP adapter and verify the command path.",
  },
  opencode: {
    displayName: "OpenCode",
    description: "OpenCode's native ACP server for terminal-first agent workflows — FREE, no API key needed",
    connectionType: "acp",
    connectionCommand: "opencode",
    connectionArgs: "acp",
    docsUrl: "https://opencode.ai/docs/acp/",
    installCommand: "curl -fsSL https://opencode.ai/install | bash",
    authHint: "You can either reuse existing OpenCode auth or let DotAgents inject a provider API key during onboarding.",
    cwdHint: "Use your workspace root so opencode acp can load the right project and config.",
    verifyArgs: ["--help"],
    setupMode: "managed",
    onboardingNote: "Recommended — FREE and works without an API key. Terminal-first workflows and external tool ownership.",
  },
}

function normalizeArgs(args?: string | string[]): string {
  if (Array.isArray(args)) return args.join(" ").trim()
  return args?.trim() || ""
}

export function detectExternalAgentPresetKey(agent?: {
  connectionType?: AgentProfileConnectionType
  connectionCommand?: string
  connectionArgs?: string | string[]
} | null): ExternalAgentPresetKey | undefined {
  if (!agent) return undefined

  const args = normalizeArgs(agent.connectionArgs)

  if (agent.connectionType === "acp" && agent.connectionCommand === "auggie" && args === "--acp") {
    return "auggie"
  }

  if (agent.connectionType === "acp" && agent.connectionCommand === "claude-code-acp") {
    return "claude-code"
  }

  if (agent.connectionType === "acp" && agent.connectionCommand === "codex-acp") {
    return "codex"
  }

  if (agent.connectionType === "acp" && agent.connectionCommand === "opencode" && args === "acp") {
    return "opencode"
  }

  return undefined
}
