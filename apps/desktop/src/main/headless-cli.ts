/**
 * Interactive terminal CLI for headless mode.
 * Provides a readline-based REPL for interacting with the agent from SSH.
 */
import fs from "fs"
import os from "os"
import path from "path"
import QRCode from "qrcode"
import readline from "readline"
import { configStore } from "./config"
import { mcpService } from "./mcp-service"
import { toolApprovalManager } from "./state"
import {
  startSharedPromptRun,
  startSharedResumeRun,
  type PreparedPromptExecutionContext,
  type PreparedResumeExecutionContext,
} from "./agent-mode-runner"
import type { AgentSession } from "./agent-session-tracker"
import {
  clearManagedInactiveAgentSessions,
  getManagedAgentSessions,
  resolveManagedAgentSessionSelection,
  stopManagedAgentSession,
} from "./agent-session-management"
import { resolveConversationHistorySelection } from "./conversation-history-selection"
import {
  clearManagedMessageQueue,
  getManagedMessageQueue,
  getManagedMessageQueues,
  pauseManagedMessageQueue,
  processManagedQueuedMessages,
  removeManagedMessageFromQueue,
  resolveManagedQueuedMessageSelection,
  resumeManagedMessageQueue,
  retryManagedQueuedMessage,
  updateManagedQueuedMessageText,
  type ManagedMessageQueue,
} from "./message-queue-management"
import {
  createManagedLoop,
  deleteManagedLoop,
  getManagedLoopSummaries,
  updateManagedLoop,
  resolveManagedLoopSelection,
  toggleManagedLoopEnabled,
  triggerManagedLoop,
  type ManagedLoopResult,
} from "./loop-management"
import {
  getManagedMcpServerLogs,
  getManagedMcpServerSummary,
  getManagedMcpServerSummaries,
  resolveManagedMcpServerSelection,
  restartManagedMcpServer,
  setManagedMcpServerRuntimeEnabled,
  stopManagedMcpServer,
  type ManagedMcpServerDetails,
  type ManagedMcpServerSummary,
} from "./mcp-management"
import { mcpManagementStore } from "./mcp-management-store"
import {
  createManagedAgentProfile,
  deleteManagedAgentProfile,
  exportManagedAgentProfile,
  getManagedCurrentAgentProfile,
  getManagedAgentProfiles,
  importManagedAgentProfile,
  resolveManagedAgentProfileSelection,
  setManagedCurrentAgentProfile,
  toggleManagedAgentProfileEnabled,
  updateManagedAgentProfile,
} from "./agent-profile-management"
import { loopService } from "./loop-service"
import {
  createManagedKnowledgeNote,
  deleteAllManagedKnowledgeNotes,
  deleteManagedKnowledgeNote,
  deleteMultipleManagedKnowledgeNotes,
  getManagedKnowledgeNote,
  getManagedKnowledgeNotes,
  isManagedKnowledgeNoteFailure,
  searchManagedKnowledgeNotes,
  updateManagedKnowledgeNote,
} from "./knowledge-note-management"
import {
  getManagedSkillsCatalog,
  getManagedCurrentProfileSkills,
  toggleManagedSkillForCurrentProfile,
} from "./profile-skill-management"
import {
  cleanupManagedStaleSkillReferences,
  createManagedSkill,
  deleteManagedSkill,
  deleteManagedSkills,
  exportManagedSkillToMarkdown,
  getManagedSkill,
  getManagedSkillCanonicalFilePath,
  importManagedSkillFromFile,
  importManagedSkillFromFolder,
  importManagedSkillFromGitHub,
  importManagedSkillsFromParentFolder,
  resolveManagedSkillSelection,
  scanManagedSkillsFolder,
  updateManagedSkill,
} from "./skill-management"
import {
  getManagedConversation,
  getManagedConversationHistory,
  deleteAllConversationsAndSyncSessionState,
  deleteConversationAndSyncSessionState,
  renameConversationTitleAndSyncSession,
} from "./conversation-management"
import {
  getManagedSettingsSnapshot,
  getManagedSettingsUpdates,
  saveManagedConfig,
} from "./settings-management"
import {
  exportManagedBundle,
  generateManagedBundlePublishPayload,
  getManagedBundleExportableItems,
  importManagedBundle,
  previewManagedBundleWithConflicts,
} from "./bundle-management"
import {
  connectManagedWhatsapp,
  disconnectManagedWhatsapp,
  getManagedWhatsappStatus,
  logoutManagedWhatsapp,
} from "./whatsapp-management"
import { emergencyStopAll } from "./emergency-stop"
import {
  type ConversationSessionState,
  type ConversationSessionStateKey,
  getAgentProfileCatalogDescription,
  getAgentProfileCatalogSummaryItems,
  getAgentProfileDisplayName,
  getEnabledAgentProfiles,
  getAgentProfileStatusLabels,
  orderItemsByPinnedFirst,
  resolveAgentProfileSelection,
  resolveChatModelDisplayInfo,
  sanitizeConversationSessionState,
  setConversationSessionStateMembership,
  sortAgentProfilesByPriority,
} from "@dotagents/shared"
import {
  countConnectedMcpServers,
  resolveMcpServerRuntimeState,
  type McpServerStatusSnapshot,
} from "../shared/mcp-server-status"
import type {
  AgentProfile,
  AgentSkill,
  AgentProgressUpdate,
  Conversation,
  ConversationHistoryItem,
  KnowledgeNote,
  LoopSummary,
  QueuedMessage,
} from "@shared/types"
import type {
  BundleComponentSelection,
  BundlePreviewResult,
  BundlePublicMetadata,
  ExportBundleOptions,
  ExportableBundleItems,
  GeneratePublishPayloadOptions,
  ImportItemResult,
  ImportOptions,
} from "./bundle-service"

// ANSI color codes (no external deps)
const colors = {
  cyan: "\x1b[36m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  reset: "\x1b[0m",
}

let currentConversationId: string | undefined
let isProcessing = false
let rl: readline.Interface | null = null
let shutdownRequested = false
const RECENT_CONVERSATION_LIMIT = 10
const SHOWN_CONVERSATION_MESSAGE_LIMIT = 12
const SHOWN_MCP_SERVER_LOG_LIMIT = 20
const SHOWN_KNOWLEDGE_NOTE_LIST_LIMIT = 25
const SHOWN_AGENT_SESSION_LIMIT = 8
const SHOWN_QUEUE_MESSAGE_LIMIT = 12
let onShutdown: () => Promise<void> = async () => {
  process.exit(0)
}

async function requestShutdown(message?: string) {
  if (shutdownRequested) return
  shutdownRequested = true
  if (message) {
    printColored(colors.dim, message)
  }
  rl?.close()
  await onShutdown()
}

function printColored(color: string, message: string) {
  console.log(`${color}${message}${colors.reset}`)
}

function createCliProgressPrinter() {
  let lastShownStepId = ""
  let lastShownIteration = 0

  return (update: AgentProgressUpdate) => {
    if (update.currentIteration > lastShownIteration) {
      lastShownIteration = update.currentIteration
      console.log(
        `${colors.dim}  [Iteration ${update.currentIteration}/${update.maxIterations}]${colors.reset}`,
      )
    }

    if (update.steps && update.steps.length > 0) {
      const lastStep = update.steps[update.steps.length - 1]
      if (lastStep.id !== lastShownStepId) {
        lastShownStepId = lastStep.id
        if (
          lastStep.type === "tool_call" &&
          lastStep.status === "in_progress"
        ) {
          printColored(colors.cyan, `  → Tool: ${lastStep.title}`)
        } else if (lastStep.type === "tool_result") {
          const statusColor =
            lastStep.status === "completed" ? colors.green : colors.red
          console.log(`${statusColor}  ✓ ${lastStep.title}${colors.reset}`)
        } else if (lastStep.type === "completion") {
          console.log(`${colors.dim}  ${lastStep.title}${colors.reset}`)
        }
      }
    }
  }
}

async function startCliPromptRun(prompt: string) {
  const onProgress = createCliProgressPrinter()
  let activeSessionId: string | undefined

  const startedRun = await startSharedPromptRun({
    prompt,
    requestedConversationId: currentConversationId,
    startSnoozed: true,
    approvalMode: "inline",
    onProgress,
    onPreparedContext: ({
      conversationId,
      sessionId,
    }: PreparedPromptExecutionContext) => {
      currentConversationId = conversationId
      activeSessionId = sessionId

      toolApprovalManager.registerSessionApprovalHandler(
        sessionId,
        ({ toolName, arguments: args }) => promptForToolApproval(toolName, args),
      )
    },
  })

  return {
    ...startedRun,
    runPromise: startedRun.runPromise.finally(() => {
      if (activeSessionId) {
        toolApprovalManager.unregisterSessionApprovalHandler(activeSessionId)
      }
    }),
  }
}

async function startCliResumeRun(options: {
  text: string
  conversationId: string
  candidateSessionIds: string[]
  startSnoozed: boolean
}) {
  const onProgress = createCliProgressPrinter()
  let activeSessionId: string | undefined

  const startedRun = await startSharedResumeRun({
    ...options,
    approvalMode: "inline",
    onProgress,
    onPreparedContext: ({
      conversationId,
      sessionId,
    }: PreparedResumeExecutionContext) => {
      if (conversationId) {
        currentConversationId = conversationId
      }
      if (!sessionId) {
        return
      }

      activeSessionId = sessionId
      toolApprovalManager.registerSessionApprovalHandler(
        sessionId,
        ({ toolName, arguments: args }) => promptForToolApproval(toolName, args),
      )
    },
  })

  return {
    ...startedRun,
    runPromise: startedRun.runPromise.finally(() => {
      if (activeSessionId) {
        toolApprovalManager.unregisterSessionApprovalHandler(activeSessionId)
      }
    }),
  }
}

function formatApprovalArguments(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

async function promptForToolApproval(
  toolName: string,
  args: unknown,
): Promise<boolean> {
  if (!rl) {
    return false
  }

  console.log()
  printColored(colors.yellow, `Approval required for tool: ${toolName}`)
  console.log(`${colors.dim}${formatApprovalArguments(args)}${colors.reset}`)

  return await new Promise<boolean>((resolve) => {
    rl?.question(
      `${colors.yellow}Allow this tool call? [y/N] ${colors.reset}`,
      (answer) => {
        resolve(/^(y|yes)$/i.test(answer.trim()))
      },
    )
  })
}

async function promptForConfirmation(message: string): Promise<boolean> {
  if (!rl) {
    return false
  }

  return await new Promise<boolean>((resolve) => {
    rl?.question(
      `${colors.yellow}${message} [y/N] ${colors.reset}`,
      (answer) => {
        resolve(/^(y|yes)$/i.test(answer.trim()))
      },
    )
  })
}

function printHelp() {
  console.log(`
${colors.bold}Available Commands:${colors.reset}
  ${colors.cyan}/help${colors.reset}          - Show this help message
  ${colors.cyan}/quit${colors.reset}, ${colors.cyan}/exit${colors.reset}  - Exit the CLI
  ${colors.cyan}/stop${colors.reset}          - Emergency stop current agent session
  ${colors.cyan}/status${colors.reset}        - Show server status and active sessions
  ${colors.cyan}/sessions${colors.reset}      - List active and recent tracked agent sessions
  ${colors.cyan}/session-stop <id>${colors.reset} - Stop one tracked agent session by ID or prefix
  ${colors.cyan}/sessions-clear${colors.reset} - Clear inactive sessions without queued follow-ups
  ${colors.cyan}/queues${colors.reset}        - List conversations with queued messages
  ${colors.cyan}/queue [id]${colors.reset}    - Show queued messages for the current or selected conversation
  ${colors.cyan}/queue-edit <message-id> <text>${colors.reset} - Edit one queued message in the current conversation
  ${colors.cyan}/queue-remove <message-id> [id]${colors.reset} - Remove one queued message
  ${colors.cyan}/queue-retry <message-id> [id]${colors.reset} - Retry one failed queued message
  ${colors.cyan}/queue-clear [id]${colors.reset} - Clear a conversation queue
  ${colors.cyan}/queue-pause [id]${colors.reset} - Pause queue processing for a conversation
  ${colors.cyan}/queue-resume [id]${colors.reset} - Resume queue processing for a conversation
  ${colors.cyan}/settings${colors.reset}      - Show the shared remote/headless settings snapshot
  ${colors.cyan}/settings-edit <json>${colors.reset} - Update the shared settings subset from a JSON payload
  ${colors.cyan}/whatsapp-status${colors.reset} - Show WhatsApp connection status
  ${colors.cyan}/whatsapp-connect${colors.reset} - Start or resume WhatsApp pairing
  ${colors.cyan}/whatsapp-disconnect${colors.reset} - Disconnect the active WhatsApp session
  ${colors.cyan}/whatsapp-logout${colors.reset} - Logout and clear saved WhatsApp credentials
  ${colors.cyan}/mcp${colors.reset}           - List MCP servers with live status and transport
  ${colors.cyan}/mcp-show <name>${colors.reset} - Show full MCP server details
  ${colors.cyan}/mcp-enable <name>${colors.reset} - Runtime-enable an MCP server for this profile
  ${colors.cyan}/mcp-disable <name>${colors.reset} - Runtime-disable an MCP server for this profile
  ${colors.cyan}/mcp-restart <name>${colors.reset} - Restart an MCP server process
  ${colors.cyan}/mcp-stop <name>${colors.reset} - Stop an MCP server process
  ${colors.cyan}/mcp-logs <name>${colors.reset} - Show recent MCP server logs
  ${colors.cyan}/agents${colors.reset}        - List enabled agents and the active selection
  ${colors.cyan}/agent <id-or-name>${colors.reset} - Switch the active agent for future prompts
  ${colors.cyan}/agent-profiles${colors.reset} - List all agents, including disabled profiles
  ${colors.cyan}/agent-show <id-or-name>${colors.reset} - Show full agent profile details
  ${colors.cyan}/agent-new <json>${colors.reset} - Create an agent profile from a JSON payload
  ${colors.cyan}/agent-edit <id-or-name> <json>${colors.reset} - Update an agent profile from a JSON payload
  ${colors.cyan}/agent-toggle <id-or-name>${colors.reset} - Enable or disable an agent profile
  ${colors.cyan}/agent-delete <id-or-name>${colors.reset} - Delete an agent profile
  ${colors.cyan}/agent-export <id-or-name>${colors.reset} - Print an agent profile as export JSON
  ${colors.cyan}/agent-export-file <id-or-name> <path>${colors.reset} - Write exported agent JSON to a file
  ${colors.cyan}/agent-import <json>${colors.reset} - Import an agent profile from export JSON
  ${colors.cyan}/agent-import-file <path>${colors.reset} - Import an agent profile from a JSON file
  ${colors.cyan}/loops${colors.reset}         - List repeat tasks with live status and profile info
  ${colors.cyan}/loop-show <id-or-name>${colors.reset} - Show full repeat-task details
  ${colors.cyan}/loop-new <json>${colors.reset} - Create a repeat task from a JSON payload
  ${colors.cyan}/loop-edit <id> <json>${colors.reset} - Update a repeat task from a JSON payload
  ${colors.cyan}/loop-toggle <id-or-name>${colors.reset} - Enable or disable a repeat task
  ${colors.cyan}/loop-run <id-or-name>${colors.reset} - Run a repeat task immediately
  ${colors.cyan}/loop-delete <id-or-name>${colors.reset} - Delete a repeat task
  ${colors.cyan}/notes${colors.reset}         - List knowledge notes with context and tags
  ${colors.cyan}/note-show <id>${colors.reset} - Show a knowledge note by ID or unique prefix
  ${colors.cyan}/note-search <query>${colors.reset} - Search knowledge notes by content or metadata
  ${colors.cyan}/note-new <json>${colors.reset} - Create a knowledge note from a JSON payload
  ${colors.cyan}/note-edit <id> <json>${colors.reset} - Update a knowledge note from a JSON payload
  ${colors.cyan}/note-delete <id>${colors.reset} - Delete a knowledge note by ID or unique prefix
  ${colors.cyan}/note-delete-many <json>${colors.reset} - Delete multiple knowledge notes from a JSON array of selectors
  ${colors.cyan}/note-delete-all${colors.reset} - Delete all knowledge notes
  ${colors.cyan}/skills${colors.reset}        - List skills for the current agent profile
  ${colors.cyan}/skill <id>${colors.reset}    - Toggle a skill for the current agent profile
  ${colors.cyan}/skill-show <id>${colors.reset} - Show full skill details
  ${colors.cyan}/skill-new <json>${colors.reset} - Create a skill from a JSON payload
  ${colors.cyan}/skill-edit <id> <json>${colors.reset} - Update a skill from a JSON payload
  ${colors.cyan}/skill-delete <id>${colors.reset} - Delete a skill by ID, name, or unique prefix
  ${colors.cyan}/skill-delete-many <json>${colors.reset} - Delete multiple skills from a JSON array of selectors
  ${colors.cyan}/skill-export <id>${colors.reset} - Print a skill as SKILL.md markdown
  ${colors.cyan}/skill-path <id>${colors.reset} - Show the canonical skill file path
  ${colors.cyan}/skill-import-file <path>${colors.reset} - Import a skill from a markdown file
  ${colors.cyan}/skill-import-folder <path>${colors.reset} - Import a skill from a folder containing SKILL.md
  ${colors.cyan}/skill-import-parent <path>${colors.reset} - Bulk import skill folders from a parent directory
  ${colors.cyan}/skill-import-github <repo>${colors.reset} - Import skills from a GitHub repository
  ${colors.cyan}/skill-scan${colors.reset}   - Reload skills from the layered .agents folders
  ${colors.cyan}/skill-cleanup${colors.reset} - Remove stale skill references from agent profiles
  ${colors.cyan}/bundle-items${colors.reset} - List exportable bundle items from the merged .agents layers
  ${colors.cyan}/bundle-export <path> [json]${colors.reset} - Export a .dotagents bundle to a file
  ${colors.cyan}/bundle-preview <path>${colors.reset} - Preview a .dotagents bundle plus merged conflicts
  ${colors.cyan}/bundle-import <path> [json]${colors.reset} - Import a .dotagents bundle (default conflictStrategy: skip)
  ${colors.cyan}/bundle-publish-payload <json>${colors.reset} - Print a Hub publish payload JSON for the merged layers
  ${colors.cyan}/conversations${colors.reset} - List recent conversations
  ${colors.cyan}/use <id>${colors.reset}      - Continue a previous conversation by ID or unique prefix
  ${colors.cyan}/show [id]${colors.reset}     - Show recent messages for the current or selected conversation
  ${colors.cyan}/rename <title>${colors.reset} - Rename the current conversation
  ${colors.cyan}/pin [id]${colors.reset}      - Pin or unpin the current or selected conversation
  ${colors.cyan}/archive [id]${colors.reset}  - Archive or unarchive the current or selected conversation
  ${colors.cyan}/delete [id]${colors.reset}   - Delete the current or selected conversation
  ${colors.cyan}/delete-all${colors.reset}    - Delete all conversations and clear session state
  ${colors.cyan}/new${colors.reset}           - Start a new conversation

${colors.dim}Type any message to interact with the agent.${colors.reset}
`)
}

function getConfiguredConversationSessionState(): ConversationSessionState {
  return sanitizeConversationSessionState(configStore.get())
}

function formatConversationSessionStateLabel(
  conversationId: string,
  sessionState: ConversationSessionState,
): string {
  const labels: string[] = []
  if (sessionState.pinnedSessionIds.includes(conversationId)) {
    labels.push("pinned")
  }
  if (sessionState.archivedSessionIds.includes(conversationId)) {
    labels.push("archived")
  }

  return labels.length > 0
    ? ` ${colors.dim}[${labels.join(", ")}]${colors.reset}`
    : ""
}

function describeCliMcpServerState(status: McpServerStatusSnapshot): {
  color: string
  label: string
} {
  switch (resolveMcpServerRuntimeState(status)) {
    case "disabled":
      return { color: colors.dim, label: "disabled" }
    case "stopped":
      return { color: colors.yellow, label: "stopped" }
    case "connected":
      return { color: colors.green, label: "connected" }
    case "error":
      return { color: colors.red, label: "error" }
    case "disconnected":
    default:
      return { color: colors.red, label: "disconnected" }
  }
}

function formatManagedMcpServerSelectionSummary(
  server: ManagedMcpServerSummary,
): string {
  return `${server.name} (${server.transport}, ${server.state})`
}

function getAvailableAgentsForCli(): AgentProfile[] {
  return sortAgentProfilesByPriority(
    getEnabledAgentProfiles(getManagedAgentProfiles()),
    {
      priorityProfileId: getManagedCurrentAgentProfile()?.id,
    },
  )
}

function getManagedAgentsForCli(): AgentProfile[] {
  return sortAgentProfilesByPriority(getManagedAgentProfiles(), {
    priorityProfileId: getManagedCurrentAgentProfile()?.id,
  })
}

function formatAgentSelectionSummary(profile: AgentProfile): string {
  const labels = getAgentProfileStatusLabels(profile, {
    isCurrent: profile.id === getManagedCurrentAgentProfile()?.id,
  })
  const labelSuffix = labels.length
    ? ` ${colors.dim}[${labels.join(", ")}]${colors.reset}`
    : ""
  const summary = getAgentProfileCatalogDescription(profile)
  const description = summary ? ` ${colors.dim}- ${summary}${colors.reset}` : ""

  return `${profile.id}: ${getAgentProfileDisplayName(profile)}${labelSuffix}${description}`
}

function formatRelativeLoopInterval(intervalMinutes: number): string {
  return intervalMinutes === 1
    ? "every 1 minute"
    : `every ${intervalMinutes} minutes`
}

function formatLoopTimestamp(timestamp?: number): string | undefined {
  return typeof timestamp === "number"
    ? new Date(timestamp).toLocaleString()
    : undefined
}

function formatLoopStatusLabels(loop: LoopSummary): string[] {
  const labels = [loop.enabled ? "enabled" : "disabled"]

  if (loop.isRunning) {
    labels.push("running")
  }
  if (loop.runOnStartup) {
    labels.push("startup")
  }

  return labels
}

function formatLoopSelectionSummary(loop: LoopSummary): string {
  return `${loop.id} (${loop.name}, ${formatRelativeLoopInterval(loop.intervalMinutes)})`
}

function printMcpServers(options: { includeHint?: boolean } = {}): void {
  const servers = getManagedMcpServerSummaries(mcpManagementStore)

  console.log(`\n${colors.bold}MCP Servers:${colors.reset}`)
  if (servers.length === 0) {
    console.log(`  ${colors.dim}(no servers configured)${colors.reset}`)
    console.log()
    return
  }

  for (const server of servers) {
    const { color, label } = describeCliMcpServerState(server)
    console.log(
      `  ${server.name}: ${color}${label}${colors.reset} (${server.transport}, ${server.toolCount} tools)`,
    )
    if (server.error && server.state === "error") {
      console.log(`    ${colors.dim}${server.error}${colors.reset}`)
    }
  }

  if (options.includeHint !== false) {
    console.log()
    console.log(
      `${colors.dim}Use /mcp-show, /mcp-enable, /mcp-disable, /mcp-restart, /mcp-stop, or /mcp-logs with a server name prefix.${colors.reset}`,
    )
  }
  console.log()
}

function printLoops() {
  const loops = getManagedLoopSummaries(loopService)

  console.log(`\n${colors.bold}Repeat Tasks:${colors.reset}`)
  if (loops.length === 0) {
    console.log(`  ${colors.dim}(no repeat tasks)${colors.reset}`)
    console.log()
    return
  }

  for (const loop of loops) {
    const labelSuffix = ` ${colors.dim}[${formatLoopStatusLabels(loop).join(", ")}]${colors.reset}`
    console.log(`  ${loop.id}: ${loop.name}${labelSuffix}`)

    const metadata = [formatRelativeLoopInterval(loop.intervalMinutes)]
    if (loop.profileName) {
      metadata.push(`agent ${loop.profileName}`)
    }
    if (typeof loop.maxIterations === "number") {
      metadata.push(`max ${loop.maxIterations}`)
    }
    const lastRunAt = formatLoopTimestamp(loop.lastRunAt)
    if (lastRunAt) {
      metadata.push(`last ${lastRunAt}`)
    }
    const nextRunAt = formatLoopTimestamp(loop.nextRunAt)
    if (nextRunAt) {
      metadata.push(`next ${nextRunAt}`)
    }

    console.log(`    ${colors.dim}${metadata.join(" • ")}${colors.reset}`)
    console.log(`    ${colors.dim}${loop.prompt}${colors.reset}`)
  }

  console.log()
}

function formatKnowledgeNoteContextLabel(note: KnowledgeNote): string {
  const color = note.context === "auto" ? colors.green : colors.yellow
  return `${color}${note.context}${colors.reset}`
}

function formatKnowledgeNoteSelectionSummary(note: KnowledgeNote): string {
  return `${note.id} (${note.title}, ${note.context}, updated ${new Date(
    note.updatedAt || note.createdAt || Date.now(),
  ).toLocaleString()})`
}

function formatKnowledgeNoteMetadata(note: KnowledgeNote): string[] {
  const metadata: string[] = [note.context]

  if (note.tags.length > 0) {
    metadata.push(`${note.tags.length} tag${note.tags.length === 1 ? "" : "s"}`)
  }

  if (note.references?.length) {
    metadata.push(
      `${note.references.length} reference${note.references.length === 1 ? "" : "s"}`,
    )
  }

  if (note.group) {
    metadata.push(`group ${note.group}`)
  }

  if (note.series) {
    metadata.push(`series ${note.series}`)
  }

  metadata.push(
    `updated ${new Date(note.updatedAt || note.createdAt || Date.now()).toLocaleString()}`,
  )

  return metadata
}

function printKnowledgeNoteList(
  notes: KnowledgeNote[],
  options: {
    heading: string
    emptyLabel: string
    includeHint?: boolean
  },
): void {
  console.log(`\n${colors.bold}${options.heading}:${colors.reset}`)
  if (notes.length === 0) {
    console.log(`  ${colors.dim}${options.emptyLabel}${colors.reset}`)
    console.log()
    return
  }

  const visibleNotes = notes.slice(0, SHOWN_KNOWLEDGE_NOTE_LIST_LIMIT)
  for (const note of visibleNotes) {
    const summary = (note.summary?.trim() || note.body.trim()).slice(0, 140)
    console.log(
      `  ${note.id}: ${note.title} ${colors.dim}[${formatKnowledgeNoteContextLabel(note)}${colors.dim}]${colors.reset}`,
    )
    console.log(
      `    ${colors.dim}${formatKnowledgeNoteMetadata(note).join(" • ")}${colors.reset}`,
    )
    console.log(`    ${colors.dim}${summary}${colors.reset}`)
  }

  if (notes.length > visibleNotes.length) {
    console.log()
    console.log(
      `${colors.dim}Showing ${visibleNotes.length} of ${notes.length} notes.${colors.reset}`,
    )
  }

  if (options.includeHint !== false) {
    console.log()
    console.log(
      `${colors.dim}Use /note-show, /note-search, /note-new, /note-edit, /note-delete, /note-delete-many, or /note-delete-all to manage notes.${colors.reset}`,
    )
  }
  console.log()
}

function printKnowledgeNoteDetails(note: KnowledgeNote): void {
  console.log(`\n${colors.bold}${note.title}${colors.reset}`)
  console.log(`  ${colors.dim}${note.id}${colors.reset}`)
  console.log(
    `  ${colors.dim}${formatKnowledgeNoteMetadata(note).join(" • ")}${colors.reset}`,
  )

  if (note.tags.length > 0) {
    console.log(`  ${colors.dim}tags ${note.tags.join(", ")}${colors.reset}`)
  }

  if (note.references?.length) {
    console.log()
    console.log(`${colors.bold}References${colors.reset}`)
    for (const reference of note.references) {
      console.log(`  ${reference}`)
    }
  }

  if (note.summary?.trim()) {
    console.log()
    console.log(`${colors.bold}Summary${colors.reset}`)
    console.log(note.summary)
  }

  console.log()
  console.log(`${colors.bold}Body${colors.reset}`)
  console.log(note.body)
  console.log()
}

function parseCliJsonObject(
  input: string,
  usage: string,
): Record<string, unknown> | null {
  const trimmed = input.trim()
  if (!trimmed) {
    printColored(colors.yellow, usage)
    return null
  }

  try {
    const parsed = JSON.parse(trimmed)
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      printColored(colors.red, "JSON payload must be an object.")
      return null
    }
    return parsed as Record<string, unknown>
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    printColored(colors.red, `Invalid JSON payload: ${message}`)
    return null
  }
}

function parseCliJsonStringArray(
  input: string,
  usage: string,
): string[] | null {
  const trimmed = input.trim()
  if (!trimmed) {
    printColored(colors.yellow, usage)
    return null
  }

  try {
    const parsed = JSON.parse(trimmed)
    if (!Array.isArray(parsed)) {
      printColored(colors.red, "JSON payload must be an array of strings.")
      return null
    }

    const values = parsed.map((entry) =>
      typeof entry === "string" ? entry.trim() : "",
    )
    if (values.length === 0 || values.some((value) => !value)) {
      printColored(
        colors.red,
        "JSON payload must be a non-empty array of non-empty strings.",
      )
      return null
    }

    return values
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    printColored(colors.red, `Invalid JSON payload: ${message}`)
    return null
  }
}

function getCliRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null
  }
  return value as Record<string, unknown>
}

function getOptionalTrimmedString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined
  }

  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

function getOptionalStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined
  }

  return value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter(Boolean)
}

function getOptionalBundleComponentSelection(
  value: unknown,
): BundleComponentSelection | undefined {
  const record = getCliRecord(value)
  if (!record) {
    return undefined
  }

  const components: BundleComponentSelection = {}
  if (typeof record.agentProfiles === "boolean") {
    components.agentProfiles = record.agentProfiles
  }
  if (typeof record.mcpServers === "boolean") {
    components.mcpServers = record.mcpServers
  }
  if (typeof record.skills === "boolean") {
    components.skills = record.skills
  }
  if (typeof record.repeatTasks === "boolean") {
    components.repeatTasks = record.repeatTasks
  }
  if (typeof record.knowledgeNotes === "boolean") {
    components.knowledgeNotes = record.knowledgeNotes
  }

  return Object.keys(components).length > 0 ? components : undefined
}

function parseBundlePublicMetadata(
  value: unknown,
  options: {
    usage: string
    required: boolean
  },
): BundlePublicMetadata | undefined | null {
  if (value === undefined) {
    if (options.required) {
      printColored(
        colors.red,
        `${options.usage}: publicMetadata.summary and publicMetadata.author.displayName are required.`,
      )
      return null
    }
    return undefined
  }

  const record = getCliRecord(value)
  const authorRecord = getCliRecord(record?.author)
  const summary = getOptionalTrimmedString(record?.summary)
  const displayName = getOptionalTrimmedString(authorRecord?.displayName)

  if (!record || !summary || !displayName) {
    printColored(
      colors.red,
      `${options.usage}: publicMetadata.summary and publicMetadata.author.displayName are required.`,
    )
    return null
  }

  const authorHandle = authorRecord
    ? getOptionalTrimmedString(authorRecord.handle)
    : undefined
  const authorUrl = authorRecord
    ? getOptionalTrimmedString(authorRecord.url)
    : undefined

  const publicMetadata: BundlePublicMetadata = {
    summary,
    author: {
      displayName,
      ...(authorHandle ? { handle: authorHandle } : {}),
      ...(authorUrl ? { url: authorUrl } : {}),
    },
    tags: getOptionalStringArray(record.tags) || [],
  }

  const compatibilityRecord = getCliRecord(record.compatibility)
  if (compatibilityRecord) {
    const minDesktopVersion = getOptionalTrimmedString(
      compatibilityRecord.minDesktopVersion,
    )
    const notes = getOptionalStringArray(compatibilityRecord.notes)
    if (minDesktopVersion || notes) {
      publicMetadata.compatibility = {
        ...(minDesktopVersion ? { minDesktopVersion } : {}),
        ...(notes ? { notes } : {}),
      }
    }
  }

  return publicMetadata
}

function parseBundleExportOptions(
  payload: Record<string, unknown>,
  usage: string,
): ExportBundleOptions | null {
  const publicMetadata = parseBundlePublicMetadata(payload.publicMetadata, {
    usage,
    required: false,
  })
  if (publicMetadata === null) {
    return null
  }

  return {
    name: getOptionalTrimmedString(payload.name),
    description: getOptionalTrimmedString(payload.description),
    publicMetadata,
    agentProfileIds: getOptionalStringArray(payload.agentProfileIds),
    mcpServerNames: getOptionalStringArray(payload.mcpServerNames),
    skillIds: getOptionalStringArray(payload.skillIds),
    repeatTaskIds: getOptionalStringArray(payload.repeatTaskIds),
    knowledgeNoteIds: getOptionalStringArray(payload.knowledgeNoteIds),
    components: getOptionalBundleComponentSelection(payload.components),
  }
}

function parseBundleImportOptions(
  payload: Record<string, unknown>,
): ImportOptions | null {
  let conflictStrategy: ImportOptions["conflictStrategy"] = "skip"
  if (payload.conflictStrategy !== undefined) {
    if (
      payload.conflictStrategy !== "skip" &&
      payload.conflictStrategy !== "overwrite" &&
      payload.conflictStrategy !== "rename"
    ) {
      printColored(
        colors.red,
        'bundle-import conflictStrategy must be "skip", "overwrite", or "rename".',
      )
      return null
    }
    conflictStrategy = payload.conflictStrategy
  }

  return {
    conflictStrategy,
    components: getOptionalBundleComponentSelection(payload.components),
  }
}

function parseBundlePublishPayloadOptions(
  payload: Record<string, unknown>,
  usage: string,
): GeneratePublishPayloadOptions | null {
  const publicMetadata = parseBundlePublicMetadata(payload.publicMetadata, {
    usage,
    required: true,
  })
  if (!publicMetadata) {
    return null
  }

  return {
    name: getOptionalTrimmedString(payload.name),
    catalogId: getOptionalTrimmedString(payload.catalogId),
    artifactUrl: getOptionalTrimmedString(payload.artifactUrl),
    description: getOptionalTrimmedString(payload.description),
    publicMetadata,
    components: getOptionalBundleComponentSelection(payload.components),
    agentProfileIds: getOptionalStringArray(payload.agentProfileIds),
    mcpServerNames: getOptionalStringArray(payload.mcpServerNames),
    skillIds: getOptionalStringArray(payload.skillIds),
    repeatTaskIds: getOptionalStringArray(payload.repeatTaskIds),
    knowledgeNoteIds: getOptionalStringArray(payload.knowledgeNoteIds),
  }
}

function parseCliPathAndOptionalJsonObject(
  input: string,
  usage: string,
): { filePath: string; payload: Record<string, unknown> } | null {
  const trimmed = input.trim()
  if (!trimmed) {
    printColored(colors.yellow, usage)
    return null
  }

  const firstWhitespaceIndex = trimmed.search(/\s/)
  if (firstWhitespaceIndex < 0) {
    return { filePath: trimmed, payload: {} }
  }

  const filePath = trimmed.slice(0, firstWhitespaceIndex).trim()
  const payloadText = trimmed.slice(firstWhitespaceIndex + 1).trim()
  if (!filePath) {
    printColored(colors.yellow, usage)
    return null
  }
  if (!payloadText) {
    return { filePath, payload: {} }
  }

  const payload = parseCliJsonObject(payloadText, usage)
  if (!payload) {
    return null
  }

  return { filePath, payload }
}

function parseKnowledgeNoteEditCommand(
  input: string,
): { selection: string; payload: Record<string, unknown> } | null {
  const trimmed = input.trim()
  if (!trimmed) {
    printColored(
      colors.yellow,
      "Usage: /note-edit <note-id-or-prefix> <json-payload>",
    )
    return null
  }

  const firstWhitespaceIndex = trimmed.search(/\s/)
  if (firstWhitespaceIndex < 0) {
    printColored(
      colors.yellow,
      "Usage: /note-edit <note-id-or-prefix> <json-payload>",
    )
    return null
  }

  const selection = trimmed.slice(0, firstWhitespaceIndex).trim()
  const payloadText = trimmed.slice(firstWhitespaceIndex + 1).trim()
  const payload = parseCliJsonObject(
    payloadText,
    "Usage: /note-edit <note-id-or-prefix> <json-payload>",
  )

  if (!payload) {
    return null
  }

  return { selection, payload }
}

function parseLoopEditCommand(
  input: string,
): { selection: string; payload: Record<string, unknown> } | null {
  const trimmed = input.trim()
  if (!trimmed) {
    printColored(
      colors.yellow,
      "Usage: /loop-edit <loop-id-or-name> <json-payload>",
    )
    return null
  }

  const firstWhitespaceIndex = trimmed.search(/\s/)
  if (firstWhitespaceIndex < 0) {
    printColored(
      colors.yellow,
      "Usage: /loop-edit <loop-id-or-name> <json-payload>",
    )
    return null
  }

  const selection = trimmed.slice(0, firstWhitespaceIndex).trim()
  const payloadText = trimmed.slice(firstWhitespaceIndex + 1).trim()
  const payload = parseCliJsonObject(
    payloadText,
    "Usage: /loop-edit <loop-id-or-name> <json-payload>",
  )

  if (!payload) {
    return null
  }

  return { selection, payload }
}

function parseAgentProfileEditCommand(
  input: string,
): { selection: string; payload: Record<string, unknown> } | null {
  const trimmed = input.trim()
  if (!trimmed) {
    printColored(
      colors.yellow,
      "Usage: /agent-edit <agent-id-or-name> <json-payload>",
    )
    return null
  }

  const firstWhitespaceIndex = trimmed.search(/\s/)
  if (firstWhitespaceIndex < 0) {
    printColored(
      colors.yellow,
      "Usage: /agent-edit <agent-id-or-name> <json-payload>",
    )
    return null
  }

  const selection = trimmed.slice(0, firstWhitespaceIndex).trim()
  const payloadText = trimmed.slice(firstWhitespaceIndex + 1).trim()
  const payload = parseCliJsonObject(
    payloadText,
    "Usage: /agent-edit <agent-id-or-name> <json-payload>",
  )

  if (!payload) {
    return null
  }

  return { selection, payload }
}

function parseAgentProfileFileCommand(
  input: string,
  usage: string,
): { selection: string; filePath: string } | null {
  const trimmed = input.trim()
  if (!trimmed) {
    printColored(colors.yellow, usage)
    return null
  }

  const firstWhitespaceIndex = trimmed.search(/\s/)
  if (firstWhitespaceIndex < 0) {
    printColored(colors.yellow, usage)
    return null
  }

  const selection = trimmed.slice(0, firstWhitespaceIndex).trim()
  const filePath = trimmed.slice(firstWhitespaceIndex + 1).trim()
  if (!selection || !filePath) {
    printColored(colors.yellow, usage)
    return null
  }

  return { selection, filePath }
}

async function resolveKnowledgeNoteSelectionForCli(
  selection: string,
): Promise<KnowledgeNote | null> {
  const query = selection.trim()
  if (!query) {
    printColored(
      colors.yellow,
      "Usage: /note-show|/note-edit|/note-delete <note-id-or-prefix>",
    )
    return null
  }

  const exactMatch = await getManagedKnowledgeNote(query)
  if (exactMatch) {
    return exactMatch
  }

  const normalizedQuery = query.toLowerCase()
  const notes = await getManagedKnowledgeNotes()
  const matches = notes.filter(
    (note) =>
      note.id.toLowerCase().startsWith(normalizedQuery) ||
      note.title.toLowerCase().startsWith(normalizedQuery),
  )

  if (matches.length === 1) {
    return matches[0]
  }

  if (matches.length > 1) {
    printColored(
      colors.yellow,
      `Knowledge note selector "${query}" matches multiple notes:`,
    )
    for (const note of matches.slice(0, SHOWN_KNOWLEDGE_NOTE_LIST_LIMIT)) {
      console.log(`  ${formatKnowledgeNoteSelectionSummary(note)}`)
    }
    return null
  }

  printColored(colors.red, `Knowledge note not found: ${query}`)
  return null
}

async function handleShowKnowledgeNotes(): Promise<void> {
  const notes = await getManagedKnowledgeNotes()
  printKnowledgeNoteList(notes, {
    heading: "Knowledge Notes",
    emptyLabel: "(no knowledge notes)",
  })
}

async function handleShowKnowledgeNote(selection: string): Promise<void> {
  const selectedNote = await resolveKnowledgeNoteSelectionForCli(selection)
  if (!selectedNote) {
    return
  }

  printKnowledgeNoteDetails(selectedNote)
}

async function handleSearchKnowledgeNotes(selection: string): Promise<void> {
  const query = selection.trim()
  if (!query) {
    printColored(colors.yellow, "Usage: /note-search <query>")
    return
  }

  const notes = await searchManagedKnowledgeNotes(query)
  printKnowledgeNoteList(notes, {
    heading: `Knowledge Note Search: ${query}`,
    emptyLabel: "(no matching knowledge notes)",
    includeHint: false,
  })
}

async function handleCreateKnowledgeNote(selection: string): Promise<void> {
  const payload = parseCliJsonObject(
    selection,
    "Usage: /note-new <json-payload>",
  )
  if (!payload) {
    return
  }

  const result = await createManagedKnowledgeNote(payload)
  if (isManagedKnowledgeNoteFailure(result)) {
    printColored(
      result.errorCode === "invalid_input" ? colors.yellow : colors.red,
      result.error,
    )
    return
  }

  printColored(
    colors.green,
    `Created knowledge note ${result.note.id}: ${result.note.title}`,
  )
}

async function handleEditKnowledgeNote(selection: string): Promise<void> {
  const parsed = parseKnowledgeNoteEditCommand(selection)
  if (!parsed) {
    return
  }

  const selectedNote = await resolveKnowledgeNoteSelectionForCli(
    parsed.selection,
  )
  if (!selectedNote) {
    return
  }

  const result = await updateManagedKnowledgeNote(
    selectedNote.id,
    parsed.payload,
  )
  if (isManagedKnowledgeNoteFailure(result)) {
    printColored(
      result.errorCode === "invalid_input" ? colors.yellow : colors.red,
      result.error,
    )
    return
  }

  printColored(
    colors.green,
    `Updated knowledge note ${result.note.id}: ${result.note.title}`,
  )
}

async function handleDeleteKnowledgeNote(selection: string): Promise<void> {
  const selectedNote = await resolveKnowledgeNoteSelectionForCli(selection)
  if (!selectedNote) {
    return
  }

  const confirmed = await promptForConfirmation(
    `Delete knowledge note ${selectedNote.id} (${selectedNote.title})?`,
  )
  if (!confirmed) {
    printColored(colors.dim, "Knowledge note delete cancelled.")
    return
  }

  const result = await deleteManagedKnowledgeNote(selectedNote.id)
  if (isManagedKnowledgeNoteFailure(result)) {
    printColored(colors.red, result.error)
    return
  }

  printColored(
    colors.green,
    `Deleted knowledge note ${selectedNote.id}: ${selectedNote.title}`,
  )
}

async function handleDeleteMultipleKnowledgeNotes(
  selection: string,
): Promise<void> {
  const selectors = parseCliJsonStringArray(
    selection,
    "Usage: /note-delete-many <json-array-of-note-ids-or-prefixes>",
  )
  if (!selectors) {
    return
  }

  const selectedNotes: KnowledgeNote[] = []
  const seenNoteIds = new Set<string>()
  for (const selector of selectors) {
    const selectedNote = await resolveKnowledgeNoteSelectionForCli(selector)
    if (!selectedNote) {
      return
    }
    if (seenNoteIds.has(selectedNote.id)) {
      continue
    }
    seenNoteIds.add(selectedNote.id)
    selectedNotes.push(selectedNote)
  }

  const preview = selectedNotes
    .slice(0, 3)
    .map((note) => note.title)
    .join(", ")
  const confirmed = await promptForConfirmation(
    `Delete ${selectedNotes.length} knowledge note${selectedNotes.length === 1 ? "" : "s"}${preview ? `: ${preview}${selectedNotes.length > 3 ? ", ..." : ""}` : ""}?`,
  )
  if (!confirmed) {
    printColored(colors.dim, "Knowledge note bulk delete cancelled.")
    return
  }

  const result = await deleteMultipleManagedKnowledgeNotes(
    selectedNotes.map((note) => note.id),
  )
  if (isManagedKnowledgeNoteFailure(result)) {
    printColored(colors.red, result.error)
    return
  }

  printColored(
    colors.green,
    `Deleted ${result.deletedCount} knowledge note${result.deletedCount === 1 ? "" : "s"}.`,
  )
}

async function handleDeleteAllKnowledgeNotes(): Promise<void> {
  const confirmed = await promptForConfirmation("Delete all knowledge notes?")
  if (!confirmed) {
    printColored(colors.dim, "Knowledge note delete-all cancelled.")
    return
  }

  const result = await deleteAllManagedKnowledgeNotes()
  if (isManagedKnowledgeNoteFailure(result)) {
    printColored(colors.red, result.error)
    return
  }

  printColored(
    colors.green,
    `Deleted ${result.deletedCount} knowledge note${result.deletedCount === 1 ? "" : "s"}.`,
  )
}

function printSettings() {
  const settings = getManagedSettingsSnapshot()

  console.log(`\n${colors.bold}Shared Settings:${colors.reset}`)
  console.log(formatApprovalArguments(settings))
  console.log()
  console.log(
    `${colors.dim}Use /settings-edit <json-payload> to update this shared settings surface.${colors.reset}`,
  )
  console.log()
}

async function handleEditSettings(input: string): Promise<void> {
  const payload = parseCliJsonObject(
    input,
    "Usage: /settings-edit <json-payload>",
  )
  if (!payload) {
    return
  }

  const updates = getManagedSettingsUpdates(payload)
  const updatedKeys = Object.keys(updates)
  if (updatedKeys.length === 0) {
    printColored(colors.red, "No valid settings to update.")
    return
  }

  await saveManagedConfig(updates, {
    remoteAccessLabel: "headless-cli-settings",
  })
  printColored(colors.green, `Updated settings: ${updatedKeys.join(", ")}`)
}

async function printWhatsappQrCode(qrValue: string): Promise<void> {
  if (configStore.get().streamerModeEnabled) {
    printColored(
      colors.yellow,
      "Streamer mode is enabled, so the WhatsApp QR code is hidden.",
    )
    return
  }

  try {
    const qrString = await QRCode.toString(qrValue, {
      type: "terminal",
      small: true,
      errorCorrectionLevel: "M",
    })

    console.log(`\n${colors.bold}WhatsApp QR Code${colors.reset}`)
    console.log(
      `${colors.dim}Scan this with WhatsApp on your phone to finish pairing.${colors.reset}`,
    )
    console.log()
    console.log(qrString)
    console.log()
  } catch (error) {
    printColored(
      colors.red,
      `Failed to render WhatsApp QR code: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

async function handleShowWhatsappStatus(): Promise<void> {
  const status = await getManagedWhatsappStatus()

  console.log(`\n${colors.bold}WhatsApp Status:${colors.reset}`)
  if (!status.available) {
    console.log(
      `  ${colors.yellow}${status.error || "WhatsApp server is not running"}${colors.reset}`,
    )
    console.log()
    return
  }

  if (status.connected) {
    const identityParts = [status.userName, status.phoneNumber].filter(Boolean)
    console.log(
      `  ${colors.green}connected${colors.reset}${identityParts.length > 0 ? ` ${colors.dim}(${identityParts.join(" • ")})${colors.reset}` : ""}`,
    )
  } else {
    console.log(`  ${colors.dim}not connected${colors.reset}`)
  }

  const metadata: string[] = []
  if (typeof status.hasCredentials === "boolean") {
    metadata.push(`saved credentials: ${status.hasCredentials ? "yes" : "no"}`)
  }
  if (typeof status.hasQrCode === "boolean") {
    metadata.push(`pending QR: ${status.hasQrCode ? "yes" : "no"}`)
  }
  if (metadata.length > 0) {
    console.log(`  ${colors.dim}${metadata.join(" • ")}${colors.reset}`)
  }

  if (status.lastError) {
    console.log(`  ${colors.yellow}${status.lastError}${colors.reset}`)
  } else if (status.error) {
    console.log(`  ${colors.yellow}${status.error}${colors.reset}`)
  } else if (status.message) {
    console.log(`  ${colors.dim}${status.message}${colors.reset}`)
  }

  console.log()

  if (status.qrCode && !status.connected) {
    await printWhatsappQrCode(status.qrCode)
  }
}

async function handleConnectWhatsapp(): Promise<void> {
  const result = await connectManagedWhatsapp()
  if (!result.success) {
    printColored(colors.red, result.error || "Failed to connect WhatsApp.")
    return
  }

  if (result.message) {
    printColored(colors.green, result.message)
  } else if (result.status === "connected") {
    printColored(colors.green, "WhatsApp connected.")
  } else {
    printColored(colors.green, "WhatsApp connection started.")
  }

  if (result.qrCode) {
    await printWhatsappQrCode(result.qrCode)
  }
}

async function handleDisconnectWhatsapp(): Promise<void> {
  const result = await disconnectManagedWhatsapp()
  if (!result.success) {
    printColored(colors.red, result.error || "Failed to disconnect WhatsApp.")
    return
  }

  printColored(colors.green, "Disconnected WhatsApp.")
}

async function handleLogoutWhatsapp(): Promise<void> {
  const confirmed = await promptForConfirmation(
    "Logout WhatsApp and clear saved credentials?",
  )
  if (!confirmed) {
    printColored(colors.dim, "WhatsApp logout cancelled.")
    return
  }

  const result = await logoutManagedWhatsapp()
  if (!result.success) {
    printColored(colors.red, result.error || "Failed to logout WhatsApp.")
    return
  }

  printColored(colors.green, "Logged out of WhatsApp.")
}

function printBundleExportableItemsSection(
  heading: string,
  lines: string[],
): void {
  console.log(`\n${colors.bold}${heading}${colors.reset}`)
  if (lines.length === 0) {
    console.log(`  ${colors.dim}(none)${colors.reset}`)
    return
  }

  for (const line of lines) {
    console.log(`  ${line}`)
  }
}

function printBundleExportableItems(): void {
  const items = getManagedBundleExportableItems()

  console.log(`\n${colors.bold}Bundle Exportable Items:${colors.reset}`)
  printBundleExportableItemsSection(
    "Agent Profiles",
    items.agentProfiles.map((profile) => {
      const metadata: string[] = []
      if (profile.role) {
        metadata.push(profile.role)
      }
      if (profile.referencedMcpServerNames.length > 0) {
        metadata.push(`mcp ${profile.referencedMcpServerNames.length}`)
      }
      if (profile.referencedSkillIds.length > 0) {
        metadata.push(`skills ${profile.referencedSkillIds.length}`)
      }

      return `${profile.id}: ${profile.displayName || profile.name}${metadata.length > 0 ? ` ${colors.dim}[${metadata.join(", ")}]${colors.reset}` : ""}`
    }),
  )
  printBundleExportableItemsSection(
    "MCP Servers",
    items.mcpServers.map(
      (server) =>
        `${server.name}${server.transport ? ` ${colors.dim}[${server.transport}]${colors.reset}` : ""}`,
    ),
  )
  printBundleExportableItemsSection(
    "Skills",
    items.skills.map((skill) => `${skill.id}: ${skill.name}`),
  )
  printBundleExportableItemsSection(
    "Repeat Tasks",
    items.repeatTasks.map(
      (task) =>
        `${task.id}: ${task.name} ${colors.dim}[${formatRelativeLoopInterval(task.intervalMinutes)}]${colors.reset}`,
    ),
  )
  printBundleExportableItemsSection(
    "Knowledge Notes",
    items.knowledgeNotes.map(
      (note) =>
        `${note.id}: ${note.title}${note.context ? ` ${colors.dim}[${note.context}]${colors.reset}` : ""}`,
    ),
  )
  console.log()
  console.log(
    `${colors.dim}Use /bundle-export <path> [json-payload] to write a bundle, /bundle-preview <path> to inspect one, and /bundle-import <path> [json-payload] to load one.${colors.reset}`,
  )
  console.log()
}

function formatBundlePreviewComponentSummary(
  items: ExportableBundleItems | BundlePreviewResult["bundle"],
): string {
  if (!items) {
    return "0 profiles • 0 MCP servers • 0 skills • 0 repeat tasks • 0 notes"
  }

  return [
    `${items.agentProfiles.length} profiles`,
    `${items.mcpServers.length} MCP servers`,
    `${items.skills.length} skills`,
    `${items.repeatTasks.length} repeat tasks`,
    `${items.knowledgeNotes.length} notes`,
  ].join(" • ")
}

function printBundlePreviewResult(result: BundlePreviewResult): void {
  if (!result.success || !result.bundle) {
    printColored(
      colors.red,
      result.error || "Failed to preview bundle file.",
    )
    return
  }

  const bundle = result.bundle
  console.log(`\n${colors.bold}${bundle.manifest.name}${colors.reset}`)
  if (result.filePath) {
    console.log(`  ${colors.dim}${result.filePath}${colors.reset}`)
  }
  console.log(
    `  ${colors.dim}created ${new Date(bundle.manifest.createdAt).toLocaleString()} • exported from ${bundle.manifest.exportedFrom}${colors.reset}`,
  )
  console.log(
    `  ${colors.dim}${formatBundlePreviewComponentSummary(bundle)}${colors.reset}`,
  )

  if (bundle.manifest.description) {
    console.log()
    console.log(bundle.manifest.description)
  }

  if (bundle.manifest.publicMetadata) {
    const publicMetadata = bundle.manifest.publicMetadata
    console.log(`\n${colors.bold}Public Metadata${colors.reset}`)
    console.log(`  ${publicMetadata.summary}`)
    console.log(
      `  ${colors.dim}author ${publicMetadata.author.displayName}${publicMetadata.author.handle ? ` (${publicMetadata.author.handle})` : ""}${colors.reset}`,
    )
    if (publicMetadata.tags.length > 0) {
      console.log(
        `  ${colors.dim}tags ${publicMetadata.tags.join(", ")}${colors.reset}`,
      )
    }
  }

  const conflicts = result.conflicts
  const conflictSections = [
    ["Agent Profiles", conflicts?.agentProfiles || []],
    ["MCP Servers", conflicts?.mcpServers || []],
    ["Skills", conflicts?.skills || []],
    ["Repeat Tasks", conflicts?.repeatTasks || []],
    ["Knowledge Notes", conflicts?.knowledgeNotes || []],
  ] as const
  const conflictCount = conflictSections.reduce(
    (count, [, items]) => count + items.length,
    0,
  )

  if (conflictCount === 0) {
    console.log()
    printColored(colors.green, "No import conflicts detected.")
    console.log()
    return
  }

  console.log(`\n${colors.bold}Conflicts${colors.reset}`)
  for (const [label, items] of conflictSections) {
    if (items.length === 0) continue
    console.log(`  ${label}:`)
    for (const item of items) {
      console.log(
        `    ${item.id}: ${item.name}${item.existingName ? ` ${colors.dim}[existing: ${item.existingName}]${colors.reset}` : ""}`,
      )
    }
  }
  console.log()
}

function printBundleImportResultSection(
  heading: string,
  items: ImportItemResult[],
): void {
  if (items.length === 0) {
    return
  }

  console.log(`\n${colors.bold}${heading}${colors.reset}`)
  for (const item of items) {
    const label =
      item.action === "imported"
        ? colors.green
        : item.action === "skipped"
          ? colors.dim
          : item.action === "overwritten"
            ? colors.yellow
            : colors.cyan
    const suffix =
      item.action === "renamed" && item.newId
        ? ` -> ${item.newId}`
        : item.error
          ? ` (${item.error})`
          : ""
    console.log(`  ${label}${item.action}${colors.reset} ${item.id}: ${item.name}${suffix}`)
  }
}

function printBundleImportResult(filePath: string, result: Awaited<ReturnType<typeof importManagedBundle>>): void {
  if (!result.success) {
    printColored(colors.red, `Bundle import failed for ${filePath}.`)
    for (const error of result.errors) {
      printColored(colors.red, error)
    }
    return
  }

  printColored(colors.green, `Imported bundle from ${filePath}.`)
  printBundleImportResultSection("Agent Profiles", result.agentProfiles)
  printBundleImportResultSection("MCP Servers", result.mcpServers)
  printBundleImportResultSection("Skills", result.skills)
  printBundleImportResultSection("Repeat Tasks", result.repeatTasks)
  printBundleImportResultSection("Knowledge Notes", result.knowledgeNotes)
  if (result.errors.length > 0) {
    console.log()
    for (const error of result.errors) {
      printColored(colors.red, error)
    }
  }
  console.log()
}

async function handleBundleExport(input: string): Promise<void> {
  const parsed = parseCliPathAndOptionalJsonObject(
    input,
    "Usage: /bundle-export <path> [json-payload]",
  )
  if (!parsed) {
    return
  }

  const options = parseBundleExportOptions(
    parsed.payload,
    "/bundle-export <path> [json-payload]",
  )
  if (!options) {
    return
  }

  const filePath = resolveCliFileSystemPath(parsed.filePath)

  if (fs.existsSync(filePath)) {
    const confirmed = await promptForConfirmation(
      `Overwrite existing bundle file ${filePath}?`,
    )
    if (!confirmed) {
      printColored(colors.dim, "Bundle export cancelled.")
      return
    }
  }

  try {
    const bundle = await exportManagedBundle(options)
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    fs.writeFileSync(filePath, JSON.stringify(bundle, null, 2), "utf8")
    printColored(
      colors.green,
      `Exported bundle ${bundle.manifest.name} to ${filePath}.`,
    )
    printColored(
      colors.dim,
      formatBundlePreviewComponentSummary(bundle),
    )
  } catch (error) {
    printColored(
      colors.red,
      error instanceof Error ? error.message : String(error),
    )
  }
}

async function handleBundlePreview(selection: string): Promise<void> {
  const rawPath = selection.trim()
  if (!rawPath) {
    printColored(colors.yellow, "Usage: /bundle-preview <path>")
    return
  }

  printBundlePreviewResult(
    previewManagedBundleWithConflicts(resolveCliFileSystemPath(rawPath)),
  )
}

async function handleBundleImport(input: string): Promise<void> {
  const parsed = parseCliPathAndOptionalJsonObject(
    input,
    "Usage: /bundle-import <path> [json-payload]",
  )
  if (!parsed) {
    return
  }

  const options = parseBundleImportOptions(parsed.payload)
  if (!options) {
    return
  }

  const filePath = resolveCliFileSystemPath(parsed.filePath)
  const result = await importManagedBundle(filePath, options)
  printBundleImportResult(filePath, result)
}

async function handleBundlePublishPayload(input: string): Promise<void> {
  const payload = parseCliJsonObject(
    input,
    "Usage: /bundle-publish-payload <json-payload>",
  )
  if (!payload) {
    return
  }

  const options = parseBundlePublishPayloadOptions(
    payload,
    "/bundle-publish-payload <json-payload>",
  )
  if (!options) {
    return
  }

  try {
    const result = await generateManagedBundlePublishPayload(options)
    console.log()
    console.log(JSON.stringify(result, null, 2))
    console.log()
  } catch (error) {
    printColored(
      colors.red,
      error instanceof Error ? error.message : String(error),
    )
  }
}

function printStatus() {
  const { activeSessions } = getManagedAgentSessions()
  const currentAgent = getManagedCurrentAgentProfile()
  const { model, providerDisplayName } = resolveChatModelDisplayInfo(
    configStore.get(),
  )

  console.log(`\n${colors.bold}Server Status:${colors.reset}`)
  console.log(
    `  Model: ${colors.cyan}${providerDisplayName}/${model}${colors.reset}`,
  )
  console.log(
    `  Current agent: ${colors.cyan}${currentAgent ? getAgentProfileDisplayName(currentAgent) : "(none)"}${colors.reset}${currentAgent ? `${colors.dim} (${currentAgent.id})${colors.reset}` : ""}`,
  )
  console.log(
    `  Current conversation: ${colors.cyan}${currentConversationId || "(none)"}${colors.reset}`,
  )
  console.log(
    `  Processing: ${isProcessing ? colors.yellow + "yes" : colors.green + "no"}${colors.reset}`,
  )

  printMcpServers({ includeHint: false })

  printAgentSessionSection("Active Sessions", activeSessions, {
    emptyMessage: "(no active sessions)",
    limit: SHOWN_AGENT_SESSION_LIMIT,
  })
  console.log()
}

function getAgentSessionTimestampLabel(session: AgentSession): string {
  const timestamp =
    session.status === "active"
      ? session.startTime
      : session.endTime ?? session.startTime
  const prefix = session.status === "active" ? "started" : "updated"
  return `${prefix} ${new Date(timestamp).toLocaleString()}`
}

function formatAgentSessionSelectionSummary(session: AgentSession): string {
  const title = session.conversationTitle || "(untitled)"
  const statusLabels: string[] = [session.status]
  if (session.isSnoozed) {
    statusLabels.push("snoozed")
  }

  return `${session.id} (${title}, ${statusLabels.join(", ")}, ${getAgentSessionTimestampLabel(session)})`
}

function printAgentSessionSection(
  title: string,
  sessions: AgentSession[],
  options: {
    emptyMessage: string
    limit?: number
  },
): void {
  console.log(`\n${colors.bold}${title}:${colors.reset}`)
  if (sessions.length === 0) {
    console.log(`  ${colors.dim}${options.emptyMessage}${colors.reset}`)
    return
  }

  const shownSessions = sessions.slice(0, options.limit ?? sessions.length)
  for (const session of shownSessions) {
    const labels: string[] = [session.status]
    if (session.isSnoozed) {
      labels.push("snoozed")
    }
    if (
      typeof session.currentIteration === "number" &&
      typeof session.maxIterations === "number" &&
      session.maxIterations > 0
    ) {
      labels.push(
        `${Math.min(session.currentIteration, session.maxIterations)}/${session.maxIterations} iters`,
      )
    }

    console.log(
      `  ${session.id}: ${session.conversationTitle || "(untitled)"} ${colors.dim}[${labels.join(", ")} | ${getAgentSessionTimestampLabel(session)}]${colors.reset}`,
    )
  }

  if (sessions.length > shownSessions.length) {
    console.log(
      `  ${colors.dim}Showing ${shownSessions.length} of ${sessions.length} sessions.${colors.reset}`,
    )
  }
}

function printAgentSessions(): void {
  const { activeSessions, recentSessions } = getManagedAgentSessions({
    recentLimit: SHOWN_AGENT_SESSION_LIMIT,
  })

  printAgentSessionSection("Active Sessions", activeSessions, {
    emptyMessage: "(no active sessions)",
    limit: SHOWN_AGENT_SESSION_LIMIT,
  })
  printAgentSessionSection("Recent Sessions", recentSessions, {
    emptyMessage: "(no recent sessions)",
    limit: SHOWN_AGENT_SESSION_LIMIT,
  })

  console.log()
  console.log(
    `${colors.dim}Use /session-stop <session-id-or-prefix> to stop a tracked run, or /sessions-clear to remove inactive sessions without queued follow-ups.${colors.reset}`,
  )
  console.log()
}

function printAgents() {
  const agents = getAvailableAgentsForCli()
  const availableSkillCount = getManagedSkillsCatalog().length
  console.log(`\n${colors.bold}Enabled Agents:${colors.reset}`)
  if (agents.length === 0) {
    console.log(`  ${colors.dim}(no enabled agents)${colors.reset}`)
  } else {
    for (const profile of agents) {
      console.log(`  ${formatAgentSelectionSummary(profile)}`)
      const summaryItems = getAgentProfileCatalogSummaryItems(profile, {
        availableSkillCount,
      })
      if (summaryItems.length > 0) {
        console.log(
          `    ${colors.dim}${summaryItems.join(" • ")}${colors.reset}`,
        )
      }
    }
  }
  console.log()
}

function printAgentProfiles() {
  const agents = getManagedAgentsForCli()
  const availableSkillCount = getManagedSkillsCatalog().length

  console.log(`\n${colors.bold}All Agents:${colors.reset}`)
  if (agents.length === 0) {
    console.log(`  ${colors.dim}(no agents configured)${colors.reset}`)
    console.log()
    return
  }

  for (const profile of agents) {
    console.log(`  ${formatAgentSelectionSummary(profile)}`)
    const summaryItems = getAgentProfileCatalogSummaryItems(profile, {
      availableSkillCount,
    })
    if (summaryItems.length > 0) {
      console.log(`    ${colors.dim}${summaryItems.join(" • ")}${colors.reset}`)
    }
  }

  console.log()
  console.log(
    `${colors.dim}Use /agent-show, /agent-new, /agent-edit, /agent-toggle, /agent-delete, /agent-export, /agent-export-file, /agent-import, or /agent-import-file to manage agent profiles.${colors.reset}`,
  )
  console.log()
}

function printAgentProfileDetails(profile: AgentProfile): void {
  const availableSkillCount = getManagedSkillsCatalog().length
  const summaryItems = getAgentProfileCatalogSummaryItems(profile, {
    availableSkillCount,
  })
  const statusLabels = getAgentProfileStatusLabels(profile, {
    isCurrent: profile.id === getManagedCurrentAgentProfile()?.id,
  })
  const headerMetadata: string[] = [profile.connection.type]

  if (profile.role) {
    headerMetadata.push(profile.role)
  }
  if (statusLabels.length > 0) {
    headerMetadata.push(statusLabels.join(", "))
  }
  if (profile.autoSpawn) {
    headerMetadata.push("auto-spawn")
  }
  if (profile.isStateful) {
    headerMetadata.push("stateful")
  }

  console.log(
    `\n${colors.bold}${getAgentProfileDisplayName(profile)}${colors.reset}`,
  )
  console.log(`  ${colors.dim}${profile.id}${colors.reset}`)
  if (headerMetadata.length > 0) {
    console.log(`  ${colors.dim}${headerMetadata.join(" • ")}${colors.reset}`)
  }
  if (summaryItems.length > 0) {
    console.log(`  ${colors.dim}${summaryItems.join(" • ")}${colors.reset}`)
  }

  const description = getAgentProfileCatalogDescription(profile)
  if (description) {
    console.log()
    console.log(description)
  }

  if (profile.connection.command) {
    const command = [
      profile.connection.command,
      ...(profile.connection.args ?? []),
    ].join(" ")
    console.log(`\n${colors.bold}Command${colors.reset}`)
    console.log(command)
  }

  if (profile.connection.cwd) {
    console.log(`\n${colors.bold}Working Directory${colors.reset}`)
    console.log(profile.connection.cwd)
  }

  if (profile.connection.baseUrl) {
    console.log(`\n${colors.bold}Base URL${colors.reset}`)
    console.log(profile.connection.baseUrl)
  }

  if (profile.guidelines?.trim()) {
    console.log(`\n${colors.bold}Guidelines${colors.reset}`)
    console.log(profile.guidelines)
  }

  if (profile.systemPrompt?.trim()) {
    console.log(`\n${colors.bold}System Prompt${colors.reset}`)
    console.log(profile.systemPrompt)
  }

  const properties = Object.entries(profile.properties ?? {})
  if (properties.length > 0) {
    console.log(`\n${colors.bold}Properties${colors.reset}`)
    for (const [key, value] of properties) {
      console.log(`  ${key}=${value}`)
    }
  }

  console.log()
}

function resolveCliFileSystemPath(selection: string): string {
  const trimmed = selection.trim()
  if (trimmed === "~") {
    return os.homedir()
  }
  if (trimmed.startsWith("~/")) {
    return path.join(os.homedir(), trimmed.slice(2))
  }
  return path.resolve(trimmed)
}

function formatSkillSelectionSummary(skill: AgentSkill): string {
  return `${skill.id} (${skill.name})`
}

function printSkillDetails(skill: AgentSkill): void {
  console.log(`\n${colors.bold}${skill.name}${colors.reset}`)
  console.log(`  ${colors.dim}${skill.id}${colors.reset}`)
  console.log(`  ${colors.dim}source ${skill.source}${colors.reset}`)

  const filePath = getManagedSkillCanonicalFilePath(skill.id)
  if (filePath) {
    console.log(`  ${colors.dim}path ${filePath}${colors.reset}`)
  }

  console.log(
    `  ${colors.dim}updated ${new Date(skill.updatedAt).toLocaleString()}${colors.reset}`,
  )

  if (skill.description) {
    console.log()
    console.log(`${colors.dim}${skill.description}${colors.reset}`)
  }

  console.log()
  console.log(skill.instructions)
  console.log()
}

function parseSkillEditCommand(
  input: string,
): { selection: string; payload: Record<string, unknown> } | null {
  const trimmed = input.trim()
  if (!trimmed) {
    printColored(
      colors.yellow,
      "Usage: /skill-edit <skill-id-or-name> <json-payload>",
    )
    return null
  }

  const firstWhitespaceIndex = trimmed.search(/\s/)
  if (firstWhitespaceIndex < 0) {
    printColored(
      colors.yellow,
      "Usage: /skill-edit <skill-id-or-name> <json-payload>",
    )
    return null
  }

  const selection = trimmed.slice(0, firstWhitespaceIndex).trim()
  const payloadText = trimmed.slice(firstWhitespaceIndex + 1).trim()
  const payload = parseCliJsonObject(
    payloadText,
    "Usage: /skill-edit <skill-id-or-name> <json-payload>",
  )
  if (!payload) {
    return null
  }

  return { selection, payload }
}

function resolveSkillSelectionForCli(
  selection: string,
  usage: string,
): AgentSkill | null {
  const query = selection.trim()
  if (!query) {
    printColored(colors.yellow, usage)
    return null
  }

  const skills = getManagedSkillsCatalog()
  const { selectedSkill, ambiguousSkills } = resolveManagedSkillSelection(
    skills,
    query,
  )

  if (selectedSkill) {
    return selectedSkill
  }

  if (ambiguousSkills?.length) {
    printColored(
      colors.yellow,
      `Skill selector "${query}" matches multiple skills:`,
    )
    for (const skill of ambiguousSkills) {
      console.log(`  ${formatSkillSelectionSummary(skill)}`)
    }
    return null
  }

  printColored(colors.red, `Skill not found: ${query}`)
  return null
}

function printSkills() {
  const { currentProfile, skills } = getManagedCurrentProfileSkills()

  console.log(`\n${colors.bold}Skills:${colors.reset}`)
  console.log(
    `  Current agent: ${colors.cyan}${currentProfile ? getAgentProfileDisplayName(currentProfile) : "(global defaults)"}${colors.reset}${currentProfile ? `${colors.dim} (${currentProfile.id})${colors.reset}` : ""}`,
  )

  if (skills.length === 0) {
    console.log(`  ${colors.dim}(no skills configured)${colors.reset}`)
    console.log()
    return
  }

  for (const skill of skills) {
    const stateLabel = skill.enabledForProfile
      ? `${colors.green}enabled`
      : `${colors.dim}disabled`
    console.log(
      `  ${skill.id}: ${stateLabel}${colors.reset} ${colors.dim}- ${skill.name}${colors.reset}`,
    )
    if (skill.description) {
      console.log(`    ${colors.dim}${skill.description}${colors.reset}`)
    }
  }

  console.log()
  console.log(
    `${colors.dim}Use /skill to toggle, or /skill-show, /skill-new, /skill-edit, /skill-delete, /skill-delete-many, /skill-export, /skill-path, /skill-import-file, /skill-import-folder, /skill-import-parent, /skill-import-github, /skill-scan, and /skill-cleanup to manage the catalog.${colors.reset}`,
  )
  console.log()
}

function getQueuedMessageStatusColor(status: QueuedMessage["status"]): string {
  switch (status) {
    case "processing":
      return colors.yellow
    case "failed":
      return colors.red
    case "cancelled":
      return colors.dim
    case "pending":
    default:
      return colors.cyan
  }
}

function formatQueuedMessagePreview(text: string, maxLength: number = 72): string {
  const singleLineText = text.replace(/\s+/g, " ").trim()
  if (singleLineText.length <= maxLength) {
    return singleLineText
  }

  return `${singleLineText.slice(0, Math.max(maxLength - 1, 1))}…`
}

function formatQueuedMessageSelectionSummary(message: QueuedMessage): string {
  return `${message.id} (${message.status}, ${formatQueuedMessagePreview(
    message.text,
    48,
  )})`
}

async function resolveConversationQueueForCli(
  selection: string | undefined,
  options: {
    requireMessages?: boolean
  } = {},
): Promise<{
  conversation: ConversationHistoryItem
  queue: ManagedMessageQueue
} | null> {
  const selectedConversation = await resolveConversationSelectionForCli(
    selection?.trim() || currentConversationId,
  )
  if (!selectedConversation) {
    return null
  }

  currentConversationId = selectedConversation.id
  const queue = getManagedMessageQueue(selectedConversation.id)
  if (options.requireMessages && queue.messages.length === 0) {
    printColored(
      colors.yellow,
      `No queued messages for conversation ${selectedConversation.id}.`,
    )
    return null
  }

  return {
    conversation: selectedConversation,
    queue,
  }
}

function resolveQueuedMessageForCli(
  messages: QueuedMessage[],
  selection: string,
): QueuedMessage | null {
  const query = selection.trim()
  if (!query) {
    printColored(colors.yellow, "A queued message ID or prefix is required.")
    return null
  }

  const { selectedMessage, ambiguousMessages } =
    resolveManagedQueuedMessageSelection(messages, query)
  if (selectedMessage) {
    return selectedMessage
  }

  if (ambiguousMessages?.length) {
    printColored(
      colors.yellow,
      `Queued message selector "${query}" matches multiple messages:`,
    )
    for (const message of ambiguousMessages.slice(0, SHOWN_QUEUE_MESSAGE_LIMIT)) {
      console.log(`  ${formatQueuedMessageSelectionSummary(message)}`)
    }
    return null
  }

  printColored(colors.red, `Queued message not found: ${query}`)
  return null
}

function printMessageQueues(
  queues: ManagedMessageQueue[],
  conversationsById: Map<string, ConversationHistoryItem>,
) {
  console.log(`\n${colors.bold}Queued Conversations:${colors.reset}`)
  if (queues.length === 0) {
    console.log(`  ${colors.dim}(no queued messages)${colors.reset}`)
    console.log()
    return
  }

  for (const queue of queues) {
    const conversation = conversationsById.get(queue.conversationId)
    const label = conversation?.title || "(unknown conversation)"
    const isCurrent = queue.conversationId === currentConversationId
    const marker = isCurrent ? `${colors.green} *${colors.reset}` : "  "
    const failedCount = queue.messages.filter(
      (message) => message.status === "failed",
    ).length
    const processingCount = queue.messages.filter(
      (message) => message.status === "processing",
    ).length
    const stateLabels: string[] = []
    if (queue.isPaused) {
      stateLabels.push("paused")
    }
    if (processingCount > 0) {
      stateLabels.push(`${processingCount} processing`)
    }
    if (failedCount > 0) {
      stateLabels.push(`${failedCount} failed`)
    }
    const stateSummary =
      stateLabels.length > 0
        ? ` ${colors.dim}[${stateLabels.join(", ")}]${colors.reset}`
        : ""

    console.log(
      `${marker} ${queue.conversationId}: ${label}${stateSummary} ${colors.dim}(${queue.messages.length} queued)${colors.reset}`,
    )
  }

  console.log()
  console.log(
    `${colors.dim}Use /queue [conversation-id-prefix] to inspect one queue, then /queue-edit, /queue-remove, /queue-retry, /queue-clear, /queue-pause, or /queue-resume to manage it.${colors.reset}`,
  )
  console.log()
}

function printConversationQueue(
  conversation: ConversationHistoryItem,
  queue: ManagedMessageQueue,
) {
  console.log(`\n${colors.bold}Queued Messages:${colors.reset}`)
  console.log(`  ${conversation.title}`)
  console.log(
    `  ${colors.dim}${conversation.id}${colors.reset}${queue.isPaused ? ` ${colors.dim}[paused]${colors.reset}` : ""}`,
  )

  if (queue.messages.length === 0) {
    console.log(`  ${colors.dim}(no queued messages)${colors.reset}`)
    console.log()
    return
  }

  console.log()
  for (const message of queue.messages.slice(0, SHOWN_QUEUE_MESSAGE_LIMIT)) {
    const statusColor = getQueuedMessageStatusColor(message.status)
    const statusLabel = `${statusColor}${message.status}${colors.reset}`
    const historyLabel = message.addedToHistory
      ? ` ${colors.dim}[history added]${colors.reset}`
      : ""
    console.log(
      `  ${message.id}: ${statusLabel}${historyLabel} ${colors.dim}(${new Date(message.createdAt).toLocaleString()})${colors.reset}`,
    )
    console.log(`    ${message.text}`)
    if (message.errorMessage) {
      console.log(`    ${colors.red}Error: ${message.errorMessage}${colors.reset}`)
    }
  }

  if (queue.messages.length > SHOWN_QUEUE_MESSAGE_LIMIT) {
    console.log()
    console.log(
      `${colors.dim}Showing the first ${SHOWN_QUEUE_MESSAGE_LIMIT} queued messages.${colors.reset}`,
    )
  }

  console.log()
  console.log(
    `${colors.dim}Use /queue-edit, /queue-remove, /queue-retry, /queue-clear, /queue-pause, or /queue-resume while this conversation is selected.${colors.reset}`,
  )
  console.log()
}

async function printQueuedConversations(): Promise<void> {
  const queues = getManagedMessageQueues()
  const history = await getManagedConversationHistory()
  const conversationsById = new Map(
    history.map((conversation) => [conversation.id, conversation]),
  )
  printMessageQueues(queues, conversationsById)
}

async function processCliQueuedMessages(conversationId: string): Promise<void> {
  if (isProcessing) {
    printColored(
      colors.red,
      "Agent is already processing. Use /stop to cancel before resuming a queue.",
    )
    return
  }

  isProcessing = true
  try {
    console.log(`${colors.dim}Processing queued messages...${colors.reset}`)
    const result = await processManagedQueuedMessages({
      conversationId,
      startResumeRun: (options) => startCliResumeRun(options),
      resolveStartSnoozed: () => true,
      onQueuedMessageStart: (message) => {
        printColored(
          colors.cyan,
          `Queued message ${message.id}: ${formatQueuedMessagePreview(message.text)}`,
        )
      },
      onQueuedMessageComplete: (_message, result) => {
        console.log()
        printColored(colors.green, result.content)
        console.log()
      },
      onQueuedMessageFailure: (message, errorMessage) => {
        printColored(
          colors.red,
          `Queued message ${message.id} failed: ${errorMessage}`,
        )
      },
    })

    if (result.processedCount > 0 && !result.failedMessageId) {
      printColored(
        colors.green,
        `Processed ${result.processedCount} queued message${result.processedCount === 1 ? "" : "s"}.`,
      )
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    printColored(colors.red, `Error: ${errorMessage}`)
  } finally {
    isProcessing = false
  }
}

async function printConversations() {
  const history = await getManagedConversationHistory()
  const sessionState = getConfiguredConversationSessionState()
  const pinnedSessionIds = new Set(sessionState.pinnedSessionIds)
  console.log(`\n${colors.bold}Recent Conversations:${colors.reset}`)
  if (history.length === 0) {
    console.log(`  ${colors.dim}(no conversations)${colors.reset}`)
  } else {
    const recent = orderItemsByPinnedFirst(history, (conversation) =>
      pinnedSessionIds.has(conversation.id),
    ).slice(0, RECENT_CONVERSATION_LIMIT)
    for (const conv of recent) {
      const isCurrent = conv.id === currentConversationId
      const marker = isCurrent ? colors.green + " *" : "  "
      const date = new Date(conv.updatedAt).toLocaleString()
      const stateLabel = formatConversationSessionStateLabel(
        conv.id,
        sessionState,
      )
      console.log(
        `${marker} ${conv.id}${colors.reset}: ${conv.title}${stateLabel} ${colors.dim}(${date})${colors.reset}`,
      )
    }
    console.log()
    console.log(
      `${colors.dim}Use /use, /show, /queue, /pin, /archive, or /delete with a conversation ID prefix to manage it.${colors.reset}`,
    )
  }
  console.log()
}

function formatConversationSelectionSummary(
  conversation: ConversationHistoryItem,
): string {
  const updatedAt = new Date(conversation.updatedAt).toLocaleString()
  return `${conversation.id} (${conversation.title}${formatConversationSessionStateLabel(
    conversation.id,
    getConfiguredConversationSessionState(),
  )}, updated ${updatedAt})`
}

async function resolveConversationSelectionForCli(
  selection: string | undefined,
): Promise<ConversationHistoryItem | null> {
  const query = selection?.trim() || currentConversationId
  if (!query) {
    printColored(
      colors.yellow,
      "No conversation selected. Use /conversations to list one or /new to start fresh.",
    )
    return null
  }

  const history = await getManagedConversationHistory()
  const { selectedConversation, ambiguousConversations } =
    resolveConversationHistorySelection(history, query)

  if (selectedConversation) {
    return selectedConversation
  }

  if (ambiguousConversations?.length) {
    printColored(
      colors.yellow,
      `Conversation prefix "${query}" matches multiple conversations:`,
    )
    for (const conversation of ambiguousConversations.slice(
      0,
      RECENT_CONVERSATION_LIMIT,
    )) {
      console.log(`  ${formatConversationSelectionSummary(conversation)}`)
    }
    return null
  }

  printColored(colors.red, `Conversation not found: ${query}`)
  return null
}

async function handleShowMessageQueue(selection: string): Promise<void> {
  const resolvedQueue = await resolveConversationQueueForCli(selection, {
    requireMessages: false,
  })
  if (!resolvedQueue) {
    return
  }

  printConversationQueue(resolvedQueue.conversation, resolvedQueue.queue)
}

async function handleEditQueuedMessage(input: string): Promise<void> {
  const trimmedInput = input.trim()
  const separatorIndex = trimmedInput.indexOf(" ")
  if (separatorIndex < 0) {
    printColored(
      colors.yellow,
      "Usage: /queue-edit <message-id-or-prefix> <new-text>",
    )
    return
  }

  const messageSelection = trimmedInput.slice(0, separatorIndex).trim()
  const nextText = trimmedInput.slice(separatorIndex + 1).trim()
  if (!messageSelection || !nextText) {
    printColored(
      colors.yellow,
      "Usage: /queue-edit <message-id-or-prefix> <new-text>",
    )
    return
  }

  const resolvedQueue = await resolveConversationQueueForCli(undefined, {
    requireMessages: true,
  })
  if (!resolvedQueue) {
    return
  }

  const selectedMessage = resolveQueuedMessageForCli(
    resolvedQueue.queue.messages,
    messageSelection,
  )
  if (!selectedMessage) {
    return
  }

  if (selectedMessage.status === "processing") {
    printColored(
      colors.red,
      "Cannot edit a queued message while it is processing.",
    )
    return
  }
  if (selectedMessage.addedToHistory) {
    printColored(
      colors.red,
      "Cannot edit a queued message after it was added to conversation history.",
    )
    return
  }

  const wasFailed = selectedMessage.status === "failed"
  const result = updateManagedQueuedMessageText(
    resolvedQueue.conversation.id,
    selectedMessage.id,
    nextText,
  )
  if (!result.success) {
    printColored(colors.red, "Failed to update queued message.")
    return
  }

  if (result.shouldProcessQueue) {
    await processCliQueuedMessages(resolvedQueue.conversation.id)
    return
  }

  if (wasFailed) {
    printColored(
      colors.green,
      `Updated queued message ${selectedMessage.id}. It will retry after the active session completes.`,
    )
    return
  }

  printColored(colors.green, `Updated queued message ${selectedMessage.id}.`)
}

async function handleRemoveQueuedMessage(input: string): Promise<void> {
  const [messageSelection, conversationSelection] = input.trim().split(/\s+/, 2)
  if (!messageSelection) {
    printColored(
      colors.yellow,
      "Usage: /queue-remove <message-id-or-prefix> [conversation-id-or-prefix]",
    )
    return
  }

  const resolvedQueue = await resolveConversationQueueForCli(
    conversationSelection,
    {
      requireMessages: true,
    },
  )
  if (!resolvedQueue) {
    return
  }

  const selectedMessage = resolveQueuedMessageForCli(
    resolvedQueue.queue.messages,
    messageSelection,
  )
  if (!selectedMessage) {
    return
  }

  if (selectedMessage.status === "processing") {
    printColored(
      colors.red,
      "Cannot remove a queued message while it is processing.",
    )
    return
  }

  const removed = removeManagedMessageFromQueue(
    resolvedQueue.conversation.id,
    selectedMessage.id,
  )
  if (!removed) {
    printColored(colors.red, "Failed to remove queued message.")
    return
  }

  printColored(colors.green, `Removed queued message ${selectedMessage.id}.`)
}

async function handleRetryQueuedMessage(input: string): Promise<void> {
  const [messageSelection, conversationSelection] = input.trim().split(/\s+/, 2)
  if (!messageSelection) {
    printColored(
      colors.yellow,
      "Usage: /queue-retry <message-id-or-prefix> [conversation-id-or-prefix]",
    )
    return
  }

  const resolvedQueue = await resolveConversationQueueForCli(
    conversationSelection,
    {
      requireMessages: true,
    },
  )
  if (!resolvedQueue) {
    return
  }

  const selectedMessage = resolveQueuedMessageForCli(
    resolvedQueue.queue.messages,
    messageSelection,
  )
  if (!selectedMessage) {
    return
  }

  if (selectedMessage.status !== "failed") {
    printColored(
      colors.red,
      "Only failed queued messages can be retried.",
    )
    return
  }

  const result = retryManagedQueuedMessage(
    resolvedQueue.conversation.id,
    selectedMessage.id,
  )
  if (!result.success) {
    printColored(colors.red, "Failed to retry queued message.")
    return
  }

  if (result.shouldProcessQueue) {
    await processCliQueuedMessages(resolvedQueue.conversation.id)
    return
  }

  printColored(
    colors.green,
    `Queued message ${selectedMessage.id} reset to pending. It will retry after the active session completes.`,
  )
}

async function handleClearMessageQueue(selection: string): Promise<void> {
  const resolvedQueue = await resolveConversationQueueForCli(selection, {
    requireMessages: true,
  })
  if (!resolvedQueue) {
    return
  }

  const cleared = clearManagedMessageQueue(resolvedQueue.conversation.id)
  if (!cleared) {
    printColored(
      colors.red,
      "Cannot clear the queue while a queued message is processing.",
    )
    return
  }

  printColored(
    colors.green,
    `Cleared queued messages for ${resolvedQueue.conversation.id}.`,
  )
}

async function handlePauseMessageQueue(selection: string): Promise<void> {
  const resolvedQueue = await resolveConversationQueueForCli(selection, {
    requireMessages: true,
  })
  if (!resolvedQueue) {
    return
  }

  pauseManagedMessageQueue(resolvedQueue.conversation.id)
  printColored(
    colors.green,
    `Paused queue for ${resolvedQueue.conversation.id}.`,
  )
}

async function handleResumeMessageQueue(selection: string): Promise<void> {
  const resolvedQueue = await resolveConversationQueueForCli(selection, {
    requireMessages: true,
  })
  if (!resolvedQueue) {
    return
  }

  const result = resumeManagedMessageQueue(resolvedQueue.conversation.id)
  if (!result.success) {
    printColored(colors.red, "Failed to resume the queue.")
    return
  }

  if (result.shouldProcessQueue) {
    await processCliQueuedMessages(resolvedQueue.conversation.id)
    return
  }

  printColored(
    colors.green,
    `Resumed queue for ${resolvedQueue.conversation.id}. It will continue after the active session completes.`,
  )
}

async function handleUseConversation(selection: string): Promise<void> {
  if (!selection.trim()) {
    printColored(colors.yellow, "Usage: /use <conversation-id-or-prefix>")
    return
  }

  const selectedConversation =
    await resolveConversationSelectionForCli(selection)
  if (!selectedConversation) {
    return
  }

  currentConversationId = selectedConversation.id
  printColored(
    colors.green,
    `Using conversation ${selectedConversation.id}: ${selectedConversation.title}`,
  )
}

async function handleUseAgent(selection: string): Promise<void> {
  const query = selection.trim()
  if (!query) {
    printColored(colors.yellow, "Usage: /agent <agent-id-or-name>")
    return
  }

  const { selectedProfile: selectedAgent, ambiguousProfiles: ambiguousAgents } =
    resolveAgentProfileSelection(getAvailableAgentsForCli(), query)
  if (selectedAgent) {
    const result = setManagedCurrentAgentProfile(selectedAgent.id)
    if (!result.success) {
      printColored(colors.red, result.error)
      return
    }
    const profile = result.profile
    printColored(
      colors.green,
      `Using agent ${getAgentProfileDisplayName(profile)} (${profile.id}) for future prompts.`,
    )
    return
  }

  if (ambiguousAgents?.length) {
    printColored(
      colors.yellow,
      `Agent selector "${query}" matches multiple agents:`,
    )
    for (const profile of ambiguousAgents) {
      console.log(`  ${formatAgentSelectionSummary(profile)}`)
    }
    return
  }

  printColored(colors.red, `Agent not found: ${query}`)
}

function resolveManagedAgentSelectionForCli(
  selection: string,
): AgentProfile | null {
  const query = selection.trim()
  if (!query) {
    printColored(
      colors.yellow,
      "Usage: /agent-show|/agent-edit|/agent-toggle|/agent-delete <agent-id-or-name>",
    )
    return null
  }

  const { selectedProfile, ambiguousProfiles } =
    resolveManagedAgentProfileSelection(getManagedAgentsForCli(), query)
  if (selectedProfile) {
    return selectedProfile
  }

  if (ambiguousProfiles?.length) {
    printColored(
      colors.yellow,
      `Agent selector "${query}" matches multiple agent profiles:`,
    )
    for (const profile of ambiguousProfiles) {
      console.log(`  ${formatAgentSelectionSummary(profile)}`)
    }
    return null
  }

  printColored(colors.red, `Agent profile not found: ${query}`)
  return null
}

async function handleShowAgentProfile(selection: string): Promise<void> {
  const profile = resolveManagedAgentSelectionForCli(selection)
  if (!profile) {
    return
  }

  printAgentProfileDetails(profile)
}

async function handleCreateAgentProfile(input: string): Promise<void> {
  const payload = parseCliJsonObject(input, "Usage: /agent-new <json-payload>")
  if (!payload) {
    return
  }

  const result = createManagedAgentProfile(payload)
  if (!result.success) {
    printColored(colors.red, result.error)
    return
  }

  printColored(
    colors.green,
    `Created agent profile ${getAgentProfileDisplayName(result.profile)} (${result.profile.id}).`,
  )
  printAgentProfileDetails(result.profile)
}

async function handleEditAgentProfile(input: string): Promise<void> {
  const parsedCommand = parseAgentProfileEditCommand(input)
  if (!parsedCommand) {
    return
  }

  const profile = resolveManagedAgentSelectionForCli(parsedCommand.selection)
  if (!profile) {
    return
  }

  const result = updateManagedAgentProfile(profile.id, parsedCommand.payload)
  if (!result.success) {
    printColored(colors.red, result.error)
    return
  }

  printColored(
    colors.green,
    `Updated agent profile ${getAgentProfileDisplayName(result.profile)} (${result.profile.id}).`,
  )
  printAgentProfileDetails(result.profile)
}

async function handleToggleAgentProfile(selection: string): Promise<void> {
  const profile = resolveManagedAgentSelectionForCli(selection)
  if (!profile) {
    return
  }

  const result = toggleManagedAgentProfileEnabled(profile.id)
  if (!result.success) {
    printColored(colors.red, result.error)
    return
  }

  const enabled = result.profile.enabled
  printColored(
    enabled ? colors.green : colors.yellow,
    `${enabled ? "Enabled" : "Disabled"} agent profile ${getAgentProfileDisplayName(result.profile)} (${result.profile.id}).`,
  )
}

async function handleDeleteAgentProfile(selection: string): Promise<void> {
  const profile = resolveManagedAgentSelectionForCli(selection)
  if (!profile) {
    return
  }

  const confirmed = await promptForConfirmation(
    `Delete agent profile ${getAgentProfileDisplayName(profile)} (${profile.id})?`,
  )
  if (!confirmed) {
    printColored(colors.dim, "Agent profile delete cancelled.")
    return
  }

  const result = deleteManagedAgentProfile(profile.id)
  if (!result.success) {
    printColored(colors.red, result.error)
    return
  }

  printColored(
    colors.green,
    `Deleted agent profile ${getAgentProfileDisplayName(profile)} (${profile.id}).`,
  )
}

async function handleExportAgentProfile(selection: string): Promise<void> {
  const profile = resolveManagedAgentSelectionForCli(selection)
  if (!profile) {
    return
  }

  const result = exportManagedAgentProfile(profile.id)
  if (!result.success) {
    printColored(colors.red, result.error)
    return
  }

  console.log()
  console.log(result.profileJson)
  console.log()
}

async function handleExportAgentProfileFile(input: string): Promise<void> {
  const parsedCommand = parseAgentProfileFileCommand(
    input,
    "Usage: /agent-export-file <agent-id-or-name> <path>",
  )
  if (!parsedCommand) {
    return
  }

  const profile = resolveManagedAgentSelectionForCli(parsedCommand.selection)
  if (!profile) {
    return
  }

  const result = exportManagedAgentProfile(profile.id)
  if (!result.success) {
    printColored(colors.red, result.error)
    return
  }

  const filePath = resolveCliFileSystemPath(parsedCommand.filePath)

  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    fs.writeFileSync(filePath, result.profileJson)
    printColored(
      colors.green,
      `Exported agent profile ${getAgentProfileDisplayName(result.profile)} (${result.profile.id}) to ${filePath}.`,
    )
  } catch (error) {
    printColored(
      colors.red,
      error instanceof Error ? error.message : String(error),
    )
  }
}

async function handleImportAgentProfile(input: string): Promise<void> {
  const profileJson = input.trim()
  if (!profileJson) {
    printColored(colors.yellow, "Usage: /agent-import <profile-json>")
    return
  }

  const result = importManagedAgentProfile(profileJson)
  if (!result.success) {
    printColored(
      result.errorCode === "invalid_input" ? colors.yellow : colors.red,
      result.error,
    )
    return
  }

  printColored(
    colors.green,
    `Imported agent profile ${getAgentProfileDisplayName(result.profile)} (${result.profile.id}).`,
  )
  printAgentProfileDetails(result.profile)
}

async function handleImportAgentProfileFile(selection: string): Promise<void> {
  const rawPath = selection.trim()
  if (!rawPath) {
    printColored(colors.yellow, "Usage: /agent-import-file <path>")
    return
  }

  try {
    const filePath = resolveCliFileSystemPath(rawPath)
    const profileJson = fs.readFileSync(filePath, "utf8")
    const result = importManagedAgentProfile(profileJson)
    if (!result.success) {
      printColored(
        result.errorCode === "invalid_input" ? colors.yellow : colors.red,
        result.error,
      )
      return
    }

    printColored(
      colors.green,
      `Imported agent profile ${getAgentProfileDisplayName(result.profile)} (${result.profile.id}) from ${filePath}.`,
    )
    printAgentProfileDetails(result.profile)
  } catch (error) {
    printColored(
      colors.red,
      error instanceof Error ? error.message : String(error),
    )
  }
}

function printMcpServerDetails(server: ManagedMcpServerDetails): void {
  console.log(`\n${colors.bold}${server.name}${colors.reset}`)
  console.log(
    `  ${colors.dim}${server.transport} • ${server.state} • ${server.toolCount} tools${colors.reset}`,
  )
  console.log(
    `  ${colors.dim}connected=${server.connected ? "yes" : "no"} runtime-enabled=${server.runtimeEnabled ? "yes" : "no"} config-disabled=${server.configDisabled ? "yes" : "no"}${colors.reset}`,
  )

  if (server.config?.command) {
    const commandParts = [server.config.command, ...(server.config.args || [])]
    console.log(
      `  ${colors.dim}command ${commandParts.join(" ")}${colors.reset}`,
    )
  }

  if (server.config?.url) {
    console.log(`  ${colors.dim}url ${server.config.url}${colors.reset}`)
  }

  if (typeof server.config?.timeout === "number") {
    console.log(
      `  ${colors.dim}timeout ${server.config.timeout}ms${colors.reset}`,
    )
  }

  if (server.envCount > 0) {
    console.log(
      `  ${colors.dim}${server.envCount} env vars configured${colors.reset}`,
    )
  }

  if (server.headerCount > 0) {
    console.log(
      `  ${colors.dim}${server.headerCount} HTTP headers configured${colors.reset}`,
    )
  }

  if (server.error) {
    console.log()
    console.log(`${colors.red}${server.error}${colors.reset}`)
  }

  console.log()
}

function resolveMcpServerSelectionForCli(
  selection: string,
): ManagedMcpServerDetails | null {
  const query = selection.trim()
  if (!query) {
    printColored(
      colors.yellow,
      "Usage: /mcp-show|/mcp-enable|/mcp-disable|/mcp-restart|/mcp-stop|/mcp-logs <server-name-or-prefix>",
    )
    return null
  }

  const servers = getManagedMcpServerSummaries(mcpManagementStore)
  const { selectedServer, ambiguousServers } = resolveManagedMcpServerSelection(
    servers,
    query,
  )

  if (selectedServer) {
    return (
      getManagedMcpServerSummary(selectedServer.name, mcpManagementStore) ||
      null
    )
  }

  if (ambiguousServers?.length) {
    printColored(
      colors.yellow,
      `MCP server selector "${query}" matches multiple servers:`,
    )
    for (const server of ambiguousServers) {
      console.log(`  ${formatManagedMcpServerSelectionSummary(server)}`)
    }
    return null
  }

  printColored(colors.red, `MCP server not found: ${query}`)
  return null
}

function handleShowMcpServer(selection: string): void {
  const selectedServer = resolveMcpServerSelectionForCli(selection)
  if (!selectedServer) {
    return
  }

  printMcpServerDetails(selectedServer)
}

function handleSetMcpServerRuntimeEnabled(
  selection: string,
  enabled: boolean,
): void {
  const selectedServer = resolveMcpServerSelectionForCli(selection)
  if (!selectedServer) {
    return
  }

  const result = setManagedMcpServerRuntimeEnabled(
    selectedServer.name,
    enabled,
    mcpManagementStore,
  )
  if (!result.success) {
    printColored(
      colors.red,
      result.error || `Failed to update MCP server ${selectedServer.name}.`,
    )
    return
  }

  printColored(
    colors.green,
    `${enabled ? "Runtime-enabled" : "Runtime-disabled"} MCP server ${selectedServer.name} for the current profile.`,
  )
}

async function handleRestartMcpServer(selection: string): Promise<void> {
  const selectedServer = resolveMcpServerSelectionForCli(selection)
  if (!selectedServer) {
    return
  }

  const result = await restartManagedMcpServer(
    selectedServer.name,
    mcpManagementStore,
  )
  if (!result.success) {
    printColored(
      colors.red,
      result.error || `Failed to restart MCP server ${selectedServer.name}.`,
    )
    return
  }

  printColored(colors.green, `Restarted MCP server ${selectedServer.name}.`)
}

async function handleStopMcpServer(selection: string): Promise<void> {
  const selectedServer = resolveMcpServerSelectionForCli(selection)
  if (!selectedServer) {
    return
  }

  const result = await stopManagedMcpServer(
    selectedServer.name,
    mcpManagementStore,
  )
  if (!result.success) {
    printColored(
      colors.red,
      result.error || `Failed to stop MCP server ${selectedServer.name}.`,
    )
    return
  }

  printColored(colors.green, `Stopped MCP server ${selectedServer.name}.`)
}

function handleShowMcpServerLogs(selection: string): void {
  const selectedServer = resolveMcpServerSelectionForCli(selection)
  if (!selectedServer) {
    return
  }

  const result = getManagedMcpServerLogs(
    selectedServer.name,
    mcpManagementStore,
  )
  if (!result.success) {
    printColored(
      colors.red,
      result.error ||
        `Failed to load logs for MCP server ${selectedServer.name}.`,
    )
    return
  }

  const logs = result.logs || []
  console.log(`\n${colors.bold}MCP Logs: ${selectedServer.name}${colors.reset}`)
  if (logs.length === 0) {
    console.log(`  ${colors.dim}(no logs)${colors.reset}`)
    console.log()
    return
  }

  for (const entry of logs.slice(-SHOWN_MCP_SERVER_LOG_LIMIT)) {
    console.log(
      `  ${colors.dim}${new Date(entry.timestamp).toLocaleString()}${colors.reset} ${entry.message}`,
    )
  }
  console.log()
}

function printLoopDetails(loop: LoopSummary): void {
  console.log(`\n${colors.bold}${loop.name}${colors.reset}`)
  console.log(`  ${colors.dim}${loop.id}${colors.reset}`)
  console.log(
    `  ${colors.dim}${formatLoopStatusLabels(loop).join(", ")}${colors.reset}`,
  )
  console.log(
    `  ${colors.dim}${formatRelativeLoopInterval(loop.intervalMinutes)}${colors.reset}`,
  )
  if (loop.profileName) {
    console.log(`  ${colors.dim}agent ${loop.profileName}${colors.reset}`)
  }
  if (typeof loop.maxIterations === "number") {
    console.log(
      `  ${colors.dim}max ${loop.maxIterations} iterations${colors.reset}`,
    )
  }

  const lastRunAt = formatLoopTimestamp(loop.lastRunAt)
  if (lastRunAt) {
    console.log(`  ${colors.dim}last run ${lastRunAt}${colors.reset}`)
  }

  const nextRunAt = formatLoopTimestamp(loop.nextRunAt)
  if (nextRunAt) {
    console.log(`  ${colors.dim}next run ${nextRunAt}${colors.reset}`)
  }

  console.log()
  console.log(loop.prompt)
  console.log()
}

async function resolveLoopSelectionForCli(
  selection: string,
): Promise<LoopSummary | null> {
  const query = selection.trim()
  if (!query) {
    printColored(
      colors.yellow,
      "Usage: /loop-show|/loop-edit|/loop-toggle|/loop-run|/loop-delete <loop-id-or-name>",
    )
    return null
  }

  const loops = getManagedLoopSummaries(loopService)
  const { selectedLoop, ambiguousLoops } = resolveManagedLoopSelection(
    loops,
    query,
  )

  if (selectedLoop) {
    return selectedLoop
  }

  if (ambiguousLoops?.length) {
    printColored(
      colors.yellow,
      `Repeat-task selector "${query}" matches multiple tasks:`,
    )
    for (const loop of ambiguousLoops) {
      console.log(`  ${formatLoopSelectionSummary(loop)}`)
    }
    return null
  }

  printColored(colors.red, `Repeat task not found: ${query}`)
  return null
}

function printManagedLoopFailure(
  result: ManagedLoopResult,
  fallbackMessage: string,
): void {
  if (result.error === "invalid_input" && result.errorMessage) {
    printColored(colors.red, result.errorMessage)
    return
  }
  if (result.error === "already_running") {
    printColored(colors.yellow, "Repeat task is already running.")
    return
  }
  if (result.error === "not_found") {
    printColored(colors.red, "Repeat task not found.")
    return
  }
  if (result.error === "delete_failed") {
    printColored(colors.red, "Failed to delete repeat task.")
    return
  }

  printColored(colors.red, fallbackMessage)
}

async function handleShowLoop(selection: string): Promise<void> {
  const selectedLoop = await resolveLoopSelectionForCli(selection)
  if (!selectedLoop) {
    return
  }

  printLoopDetails(selectedLoop)
}

async function handleCreateLoop(payloadText: string): Promise<void> {
  const payload = parseCliJsonObject(
    payloadText,
    "Usage: /loop-new <json-payload>",
  )
  if (!payload) {
    return
  }

  const result = createManagedLoop(loopService, payload)
  if (!result.success) {
    printManagedLoopFailure(result, "Failed to create repeat task.")
    return
  }

  printColored(
    colors.green,
    `Created repeat task ${result.loop?.id}: ${result.loop?.name}`,
  )
  if (result.summary) {
    printLoopDetails(result.summary)
  }
}

async function handleEditLoop(input: string): Promise<void> {
  const parsed = parseLoopEditCommand(input)
  if (!parsed) {
    return
  }

  const selectedLoop = await resolveLoopSelectionForCli(parsed.selection)
  if (!selectedLoop) {
    return
  }

  const result = updateManagedLoop(loopService, selectedLoop.id, parsed.payload)
  if (!result.success) {
    printManagedLoopFailure(result, "Failed to update repeat task.")
    return
  }

  printColored(
    colors.green,
    `Updated repeat task ${selectedLoop.id}: ${selectedLoop.name}`,
  )
  if (result.summary) {
    printLoopDetails(result.summary)
  }
}

async function handleToggleLoop(selection: string): Promise<void> {
  const selectedLoop = await resolveLoopSelectionForCli(selection)
  if (!selectedLoop) {
    return
  }

  const result = toggleManagedLoopEnabled(loopService, selectedLoop.id)
  if (!result.success) {
    printColored(
      colors.red,
      result.error === "persist_failed"
        ? "Failed to persist repeat task toggle."
        : `Repeat task not found: ${selectedLoop.id}`,
    )
    return
  }

  const actionLabel = result.loop?.enabled ? "Enabled" : "Disabled"
  printColored(
    colors.green,
    `${actionLabel} repeat task ${selectedLoop.id}: ${selectedLoop.name}`,
  )
}

async function handleRunLoop(selection: string): Promise<void> {
  const selectedLoop = await resolveLoopSelectionForCli(selection)
  if (!selectedLoop) {
    return
  }

  const result = await triggerManagedLoop(loopService, selectedLoop.id)
  if (!result.success) {
    printColored(
      result.error === "already_running" ? colors.yellow : colors.red,
      result.error === "already_running"
        ? `Repeat task is already running: ${selectedLoop.id}`
        : `Repeat task not found: ${selectedLoop.id}`,
    )
    return
  }

  printColored(
    colors.green,
    `Triggered repeat task ${selectedLoop.id}: ${selectedLoop.name}`,
  )
}

async function handleDeleteLoop(selection: string): Promise<void> {
  const selectedLoop = await resolveLoopSelectionForCli(selection)
  if (!selectedLoop) {
    return
  }

  const confirmed = await promptForConfirmation(
    `Delete repeat task ${selectedLoop.id} (${selectedLoop.name})?`,
  )
  if (!confirmed) {
    printColored(colors.dim, "Repeat-task delete cancelled.")
    return
  }

  const result = deleteManagedLoop(loopService, selectedLoop.id)
  if (!result.success) {
    printManagedLoopFailure(result, "Failed to delete repeat task.")
    return
  }

  printColored(
    colors.green,
    `Deleted repeat task ${selectedLoop.id}: ${selectedLoop.name}`,
  )
}

async function handleToggleSkill(selection: string): Promise<void> {
  const skillId = selection.trim()
  if (!skillId) {
    printColored(colors.yellow, "Usage: /skill <skill-id>")
    return
  }

  const result = toggleManagedSkillForCurrentProfile(skillId)
  if (!result.success) {
    if (result.errorCode === "profile_not_found") {
      printColored(
        colors.yellow,
        "No current agent profile. Use /agent <id-or-name> before toggling skills.",
      )
      return
    }

    printColored(colors.red, result.error)
    return
  }

  printColored(
    colors.green,
    `${result.enabledForProfile ? "Enabled" : "Disabled"} skill ${result.skill.name} (${result.skill.id}) for ${getAgentProfileDisplayName(result.profile)}.`,
  )
}

async function handleShowSkill(selection: string): Promise<void> {
  const selectedSkill = resolveSkillSelectionForCli(
    selection,
    "Usage: /skill-show <skill-id-or-name>",
  )
  if (!selectedSkill) {
    return
  }

  printSkillDetails(getManagedSkill(selectedSkill.id) || selectedSkill)
}

async function handleCreateSkill(payloadText: string): Promise<void> {
  const payload = parseCliJsonObject(
    payloadText,
    "Usage: /skill-new <json-payload>",
  )
  if (!payload) {
    return
  }

  try {
    const skill = createManagedSkill(
      payload as {
        name: string
        description?: string
        instructions: string
      },
    )
    printColored(colors.green, `Created skill ${skill.id}: ${skill.name}`)
    printSkillDetails(skill)
  } catch (error) {
    printColored(
      colors.red,
      error instanceof Error ? error.message : String(error),
    )
  }
}

async function handleEditSkill(input: string): Promise<void> {
  const parsed = parseSkillEditCommand(input)
  if (!parsed) {
    return
  }

  const selectedSkill = resolveSkillSelectionForCli(
    parsed.selection,
    "Usage: /skill-edit <skill-id-or-name> <json-payload>",
  )
  if (!selectedSkill) {
    return
  }

  try {
    const updatedSkill = updateManagedSkill(
      selectedSkill.id,
      parsed.payload as {
        name?: string
        description?: string
        instructions?: string
      },
    )
    printColored(
      colors.green,
      `Updated skill ${updatedSkill.id}: ${updatedSkill.name}`,
    )
    printSkillDetails(updatedSkill)
  } catch (error) {
    printColored(
      colors.red,
      error instanceof Error ? error.message : String(error),
    )
  }
}

async function handleDeleteSkill(selection: string): Promise<void> {
  const selectedSkill = resolveSkillSelectionForCli(
    selection,
    "Usage: /skill-delete <skill-id-or-name>",
  )
  if (!selectedSkill) {
    return
  }

  const confirmed = await promptForConfirmation(
    `Delete skill ${selectedSkill.id} (${selectedSkill.name})?`,
  )
  if (!confirmed) {
    printColored(colors.dim, "Skill delete cancelled.")
    return
  }

  const result = await deleteManagedSkill(selectedSkill.id)
  if (!result.success) {
    printColored(colors.red, `Failed to delete skill: ${selectedSkill.id}`)
    return
  }

  printColored(
    colors.green,
    `Deleted skill ${selectedSkill.id}: ${selectedSkill.name}`,
  )
  if (
    result.cleanupSummary &&
    result.cleanupSummary.removedReferenceCount > 0
  ) {
    printColored(
      colors.dim,
      `Removed ${result.cleanupSummary.removedReferenceCount} stale skill reference${result.cleanupSummary.removedReferenceCount === 1 ? "" : "s"} across ${result.cleanupSummary.updatedProfileIds.length} profile${result.cleanupSummary.updatedProfileIds.length === 1 ? "" : "s"}.`,
    )
  }
}

async function handleDeleteMultipleSkills(selection: string): Promise<void> {
  const selectors = parseCliJsonStringArray(
    selection,
    "Usage: /skill-delete-many <json-array-of-skill-ids-or-names>",
  )
  if (!selectors) {
    return
  }

  const selectedSkills: AgentSkill[] = []
  const seenSkillIds = new Set<string>()
  for (const selector of selectors) {
    const selectedSkill = resolveSkillSelectionForCli(
      selector,
      "Usage: /skill-delete-many <json-array-of-skill-ids-or-names>",
    )
    if (!selectedSkill) {
      return
    }
    if (seenSkillIds.has(selectedSkill.id)) {
      continue
    }
    seenSkillIds.add(selectedSkill.id)
    selectedSkills.push(selectedSkill)
  }

  const preview = selectedSkills
    .slice(0, 3)
    .map((skill) => skill.name)
    .join(", ")
  const confirmed = await promptForConfirmation(
    `Delete ${selectedSkills.length} skill${selectedSkills.length === 1 ? "" : "s"}${preview ? `: ${preview}${selectedSkills.length > 3 ? ", ..." : ""}` : ""}?`,
  )
  if (!confirmed) {
    printColored(colors.dim, "Skill bulk delete cancelled.")
    return
  }

  const result = await deleteManagedSkills(
    selectedSkills.map((skill) => skill.id),
  )
  const deletedSkillIds = new Set(
    result.results
      .filter((deleteResult) => deleteResult.success)
      .map((deleteResult) => deleteResult.id),
  )
  const failedSkills = selectedSkills.filter(
    (skill) => !deletedSkillIds.has(skill.id),
  )

  if (deletedSkillIds.size === 0) {
    printColored(colors.red, "Failed to delete the selected skills.")
    return
  }

  printColored(
    colors.green,
    `Deleted ${deletedSkillIds.size} skill${deletedSkillIds.size === 1 ? "" : "s"}.`,
  )

  if (failedSkills.length > 0) {
    printColored(
      colors.red,
      `Failed to delete: ${failedSkills.map((skill) => `${skill.id} (${skill.name})`).join(", ")}`,
    )
  }

  if (
    result.cleanupSummary &&
    result.cleanupSummary.removedReferenceCount > 0
  ) {
    printColored(
      colors.dim,
      `Removed ${result.cleanupSummary.removedReferenceCount} stale skill reference${result.cleanupSummary.removedReferenceCount === 1 ? "" : "s"} across ${result.cleanupSummary.updatedProfileIds.length} profile${result.cleanupSummary.updatedProfileIds.length === 1 ? "" : "s"}.`,
    )
  }
}

async function handleExportSkill(selection: string): Promise<void> {
  const selectedSkill = resolveSkillSelectionForCli(
    selection,
    "Usage: /skill-export <skill-id-or-name>",
  )
  if (!selectedSkill) {
    return
  }

  try {
    const markdown = exportManagedSkillToMarkdown(selectedSkill.id)
    console.log()
    console.log(markdown)
    console.log()
  } catch (error) {
    printColored(
      colors.red,
      error instanceof Error ? error.message : String(error),
    )
  }
}

async function handleShowSkillPath(selection: string): Promise<void> {
  const selectedSkill = resolveSkillSelectionForCli(
    selection,
    "Usage: /skill-path <skill-id-or-name>",
  )
  if (!selectedSkill) {
    return
  }

  const filePath = getManagedSkillCanonicalFilePath(selectedSkill.id)
  if (!filePath) {
    printColored(
      colors.red,
      `No canonical file path found for skill ${selectedSkill.id}`,
    )
    return
  }

  printColored(colors.green, filePath)
}

function printImportedSkillSummary(
  skill: AgentSkill,
  sourceLabel: string,
): void {
  printColored(
    colors.green,
    `Imported ${sourceLabel}: ${skill.id} (${skill.name})`,
  )
}

async function handleImportSkillFile(selection: string): Promise<void> {
  const rawPath = selection.trim()
  if (!rawPath) {
    printColored(colors.yellow, "Usage: /skill-import-file <path>")
    return
  }

  try {
    const skill = importManagedSkillFromFile(resolveCliFileSystemPath(rawPath))
    printImportedSkillSummary(skill, "skill file")
  } catch (error) {
    printColored(
      colors.red,
      error instanceof Error ? error.message : String(error),
    )
  }
}

async function handleImportSkillFolder(selection: string): Promise<void> {
  const rawPath = selection.trim()
  if (!rawPath) {
    printColored(colors.yellow, "Usage: /skill-import-folder <path>")
    return
  }

  try {
    const skill = importManagedSkillFromFolder(
      resolveCliFileSystemPath(rawPath),
    )
    printImportedSkillSummary(skill, "skill folder")
  } catch (error) {
    printColored(
      colors.red,
      error instanceof Error ? error.message : String(error),
    )
  }
}

async function handleImportSkillsFromParentFolder(
  selection: string,
): Promise<void> {
  const rawPath = selection.trim()
  if (!rawPath) {
    printColored(colors.yellow, "Usage: /skill-import-parent <path>")
    return
  }

  try {
    const result = importManagedSkillsFromParentFolder(
      resolveCliFileSystemPath(rawPath),
    )
    printColored(
      colors.green,
      `Imported ${result.imported.length} skill${result.imported.length === 1 ? "" : "s"} from ${rawPath}.`,
    )
    for (const skill of result.imported) {
      console.log(`  ${formatSkillSelectionSummary(skill)}`)
    }
    if (result.skipped.length > 0) {
      printColored(
        colors.dim,
        `Skipped already-imported folders: ${result.skipped.join(", ")}`,
      )
    }
    for (const error of result.errors) {
      printColored(colors.red, `${error.folder}: ${error.error}`)
    }
  } catch (error) {
    printColored(
      colors.red,
      error instanceof Error ? error.message : String(error),
    )
  }
}

async function handleImportSkillFromGitHub(selection: string): Promise<void> {
  const repoIdentifier = selection.trim()
  if (!repoIdentifier) {
    printColored(
      colors.yellow,
      "Usage: /skill-import-github <owner/repo[/path]>",
    )
    return
  }

  try {
    const result = await importManagedSkillFromGitHub(repoIdentifier)
    if (result.imported.length === 0 && result.errors.length === 0) {
      printColored(colors.yellow, `No skills imported from ${repoIdentifier}.`)
      return
    }

    if (result.imported.length > 0) {
      printColored(
        colors.green,
        `Imported ${result.imported.length} skill${result.imported.length === 1 ? "" : "s"} from ${repoIdentifier}.`,
      )
      for (const skill of result.imported) {
        console.log(`  ${formatSkillSelectionSummary(skill)}`)
      }
    }

    for (const error of result.errors) {
      printColored(colors.red, error)
    }
  } catch (error) {
    printColored(
      colors.red,
      error instanceof Error ? error.message : String(error),
    )
  }
}

async function handleScanSkills(): Promise<void> {
  const importedSkills = scanManagedSkillsFolder()
  const skillCount = getManagedSkillsCatalog().length
  printColored(
    colors.green,
    `Reloaded skills from .agents/skills. ${skillCount} skill${skillCount === 1 ? "" : "s"} available.`,
  )
  if (importedSkills.length > 0) {
    for (const skill of importedSkills) {
      console.log(`  ${formatSkillSelectionSummary(skill)}`)
    }
  }
}

async function handleCleanupSkillReferences(): Promise<void> {
  const result = await cleanupManagedStaleSkillReferences()
  if (result.removedReferenceCount === 0) {
    printColored(colors.dim, "No stale skill references found.")
    return
  }

  printColored(
    colors.green,
    `Removed ${result.removedReferenceCount} stale skill reference${result.removedReferenceCount === 1 ? "" : "s"} across ${result.updatedProfileIds.length} profile${result.updatedProfileIds.length === 1 ? "" : "s"}.`,
  )
}

async function toggleConversationSessionStateForCli(
  stateKey: ConversationSessionStateKey,
  selection: string,
): Promise<void> {
  const selectedConversation = await resolveConversationSelectionForCli(
    selection.trim() || currentConversationId,
  )
  if (!selectedConversation) {
    return
  }

  currentConversationId = selectedConversation.id

  const cfg = configStore.get()
  const currentSessionState = sanitizeConversationSessionState(cfg)
  const currentIds = currentSessionState[stateKey]
  const nextEnabled = !currentIds.includes(selectedConversation.id)
  const nextSessionState = setConversationSessionStateMembership(
    currentSessionState,
    stateKey,
    selectedConversation.id,
    nextEnabled,
  )

  configStore.save({
    ...cfg,
    ...nextSessionState,
  })

  const actionLabel =
    stateKey === "pinnedSessionIds"
      ? nextEnabled
        ? "Pinned"
        : "Unpinned"
      : nextEnabled
        ? "Archived"
        : "Unarchived"

  printColored(
    colors.green,
    `${actionLabel} conversation ${selectedConversation.id}: ${selectedConversation.title}`,
  )
}

function getConversationRoleColor(
  role: Conversation["messages"][number]["role"],
): string {
  if (role === "assistant") return colors.green
  if (role === "tool") return colors.yellow
  return colors.cyan
}

function printConversationDetails(conversation: Conversation): void {
  console.log(`\n${colors.bold}${conversation.title}${colors.reset}`)
  console.log(`  ${colors.dim}${conversation.id}${colors.reset}`)
  const stateLabel = formatConversationSessionStateLabel(
    conversation.id,
    getConfiguredConversationSessionState(),
  )
  if (stateLabel) {
    console.log(`  ${stateLabel}`)
  }
  console.log(
    `  ${colors.dim}${conversation.messages.length} messages, updated ${new Date(conversation.updatedAt).toLocaleString()}${colors.reset}`,
  )
  console.log()

  const recentMessages = conversation.messages.slice(
    -SHOWN_CONVERSATION_MESSAGE_LIMIT,
  )
  for (const message of recentMessages) {
    const roleColor = getConversationRoleColor(message.role)
    console.log(
      `${roleColor}${message.role}${colors.reset} ${colors.dim}${new Date(message.timestamp).toLocaleString()}${colors.reset}`,
    )
    console.log(`  ${message.content || "(empty)"}`)

    if (message.toolCalls?.length) {
      console.log(
        `  ${colors.dim}tool calls: ${message.toolCalls.map((toolCall) => toolCall.name).join(", ")}${colors.reset}`,
      )
    }

    if (message.toolResults?.length) {
      console.log(
        `  ${colors.dim}tool results: ${message.toolResults.length}${colors.reset}`,
      )
    }

    console.log()
  }

  if (conversation.messages.length > recentMessages.length) {
    console.log(
      `${colors.dim}Showing the last ${recentMessages.length} of ${conversation.messages.length} messages.${colors.reset}`,
    )
    console.log()
  }
}

async function handleShowConversation(selection: string): Promise<void> {
  const selectedConversation = await resolveConversationSelectionForCli(
    selection.trim() || currentConversationId,
  )
  if (!selectedConversation) {
    return
  }

  const conversation = await getManagedConversation(selectedConversation.id)
  if (!conversation) {
    printColored(
      colors.red,
      `Conversation could not be loaded: ${selectedConversation.id}`,
    )
    return
  }

  currentConversationId = conversation.id
  printConversationDetails(conversation)
}

async function handleRenameConversation(titleText: string): Promise<void> {
  const nextTitle = titleText.trim()
  if (!nextTitle) {
    printColored(colors.yellow, "Usage: /rename <new-title>")
    return
  }

  if (!currentConversationId) {
    printColored(
      colors.yellow,
      "No conversation selected. Use /use <conversation-id-or-prefix> first.",
    )
    return
  }

  const updatedConversation = await renameConversationTitleAndSyncSession(
    currentConversationId,
    nextTitle,
  )
  if (!updatedConversation) {
    printColored(
      colors.red,
      "Failed to rename conversation. Titles must contain visible text.",
    )
    return
  }

  printColored(
    colors.green,
    `Renamed conversation ${updatedConversation.id}: ${updatedConversation.title}`,
  )
}

async function handleDeleteConversation(selection: string): Promise<void> {
  const selectedConversation = await resolveConversationSelectionForCli(
    selection.trim() || currentConversationId,
  )
  if (!selectedConversation) {
    return
  }

  const confirmed = await promptForConfirmation(
    `Delete conversation ${selectedConversation.id} (${selectedConversation.title})?`,
  )
  if (!confirmed) {
    printColored(colors.dim, "Delete cancelled.")
    return
  }

  await deleteConversationAndSyncSessionState(selectedConversation.id)
  if (currentConversationId === selectedConversation.id) {
    currentConversationId = undefined
  }

  printColored(
    colors.green,
    `Deleted conversation ${selectedConversation.id}: ${selectedConversation.title}`,
  )
}

async function handleDeleteAllConversations(): Promise<void> {
  const confirmed = await promptForConfirmation(
    "Delete all conversations and clear pinned/archived session state?",
  )
  if (!confirmed) {
    printColored(colors.dim, "Delete-all cancelled.")
    return
  }

  await deleteAllConversationsAndSyncSessionState()
  currentConversationId = undefined
  printColored(
    colors.green,
    "Deleted all conversations and cleared pinned/archived session state.",
  )
}

function resolveAgentSessionSelectionForCli(
  selection: string,
  usage: string,
): AgentSession | null {
  const query = selection.trim()
  if (!query) {
    printColored(colors.yellow, usage)
    return null
  }

  const { activeSessions } = getManagedAgentSessions({
    recentLimit: SHOWN_AGENT_SESSION_LIMIT,
  })
  const { selectedSession, ambiguousSessions } =
    resolveManagedAgentSessionSelection(activeSessions, query)

  if (selectedSession) {
    return selectedSession
  }

  if (ambiguousSessions?.length) {
    printColored(
      colors.yellow,
      `Session selector "${query}" matches multiple active sessions:`,
    )
    for (const session of ambiguousSessions.slice(0, SHOWN_AGENT_SESSION_LIMIT)) {
      console.log(`  ${formatAgentSessionSelectionSummary(session)}`)
    }
    return null
  }

  printColored(colors.red, `Active session not found: ${query}`)
  return null
}

async function handleStopAgentSession(selection: string): Promise<void> {
  const selectedSession = resolveAgentSessionSelectionForCli(
    selection,
    "Usage: /session-stop <session-id-or-prefix>",
  )
  if (!selectedSession) {
    return
  }

  await stopManagedAgentSession(selectedSession.id)
  printColored(
    colors.green,
    `Stopped session ${selectedSession.id}: ${selectedSession.conversationTitle || "(untitled)"}`,
  )
}

function handleClearInactiveAgentSessions(): void {
  const { clearedCount } = clearManagedInactiveAgentSessions()
  if (clearedCount === 0) {
    printColored(colors.dim, "No inactive sessions were eligible for cleanup.")
    return
  }

  printColored(
    colors.green,
    `Cleared ${clearedCount} inactive session${clearedCount === 1 ? "" : "s"}.`,
  )
}

async function handleStop() {
  if (!isProcessing) {
    printColored(colors.yellow, "No agent session is currently running.")
    return
  }
  printColored(colors.yellow, "Stopping agent...")
  const result = await emergencyStopAll()
  printColored(
    colors.green,
    `Stopped. Killed ${result.before - result.after} processes.`,
  )
  isProcessing = false
}

function startNewConversation() {
  currentConversationId = undefined
  printColored(
    colors.green,
    "Started new conversation. Next message will create a new conversation.",
  )
}

async function handleSlashCommand(input: string): Promise<boolean> {
  const trimmedInput = input.trim()
  const [rawCommand = ""] = trimmedInput.split(/\s+/, 1)
  const command = rawCommand.toLowerCase()
  const argumentsText = trimmedInput.slice(rawCommand.length).trim()

  const cmd = command
  switch (cmd) {
    case "/help":
      printHelp()
      return true
    case "/quit":
    case "/exit":
      await requestShutdown("Shutting down gracefully...")
      return true
    case "/stop":
      await handleStop()
      return true
    case "/status":
      printStatus()
      return true
    case "/sessions":
      printAgentSessions()
      return true
    case "/session-stop":
      await handleStopAgentSession(argumentsText)
      return true
    case "/sessions-clear":
      handleClearInactiveAgentSessions()
      return true
    case "/queues":
      await printQueuedConversations()
      return true
    case "/queue":
      await handleShowMessageQueue(argumentsText)
      return true
    case "/queue-edit":
      await handleEditQueuedMessage(argumentsText)
      return true
    case "/queue-remove":
      await handleRemoveQueuedMessage(argumentsText)
      return true
    case "/queue-retry":
      await handleRetryQueuedMessage(argumentsText)
      return true
    case "/queue-clear":
      await handleClearMessageQueue(argumentsText)
      return true
    case "/queue-pause":
      await handlePauseMessageQueue(argumentsText)
      return true
    case "/queue-resume":
      await handleResumeMessageQueue(argumentsText)
      return true
    case "/settings":
      printSettings()
      return true
    case "/settings-edit":
      await handleEditSettings(argumentsText)
      return true
    case "/whatsapp-status":
      await handleShowWhatsappStatus()
      return true
    case "/whatsapp-connect":
      await handleConnectWhatsapp()
      return true
    case "/whatsapp-disconnect":
      await handleDisconnectWhatsapp()
      return true
    case "/whatsapp-logout":
      await handleLogoutWhatsapp()
      return true
    case "/mcp":
      printMcpServers()
      return true
    case "/mcp-show":
      handleShowMcpServer(argumentsText)
      return true
    case "/mcp-enable":
      handleSetMcpServerRuntimeEnabled(argumentsText, true)
      return true
    case "/mcp-disable":
      handleSetMcpServerRuntimeEnabled(argumentsText, false)
      return true
    case "/mcp-restart":
      await handleRestartMcpServer(argumentsText)
      return true
    case "/mcp-stop":
      await handleStopMcpServer(argumentsText)
      return true
    case "/mcp-logs":
      handleShowMcpServerLogs(argumentsText)
      return true
    case "/agents":
      printAgents()
      return true
    case "/agent":
      await handleUseAgent(argumentsText)
      return true
    case "/agent-profiles":
      printAgentProfiles()
      return true
    case "/agent-show":
      await handleShowAgentProfile(argumentsText)
      return true
    case "/agent-new":
      await handleCreateAgentProfile(argumentsText)
      return true
    case "/agent-edit":
      await handleEditAgentProfile(argumentsText)
      return true
    case "/agent-toggle":
      await handleToggleAgentProfile(argumentsText)
      return true
    case "/agent-delete":
      await handleDeleteAgentProfile(argumentsText)
      return true
    case "/agent-export":
      await handleExportAgentProfile(argumentsText)
      return true
    case "/agent-export-file":
      await handleExportAgentProfileFile(argumentsText)
      return true
    case "/agent-import":
      await handleImportAgentProfile(argumentsText)
      return true
    case "/agent-import-file":
      await handleImportAgentProfileFile(argumentsText)
      return true
    case "/loops":
      printLoops()
      return true
    case "/loop-show":
      await handleShowLoop(argumentsText)
      return true
    case "/loop-new":
      await handleCreateLoop(argumentsText)
      return true
    case "/loop-edit":
      await handleEditLoop(argumentsText)
      return true
    case "/loop-toggle":
      await handleToggleLoop(argumentsText)
      return true
    case "/loop-run":
      await handleRunLoop(argumentsText)
      return true
    case "/loop-delete":
      await handleDeleteLoop(argumentsText)
      return true
    case "/notes":
      await handleShowKnowledgeNotes()
      return true
    case "/note-show":
      await handleShowKnowledgeNote(argumentsText)
      return true
    case "/note-search":
      await handleSearchKnowledgeNotes(argumentsText)
      return true
    case "/note-new":
      await handleCreateKnowledgeNote(argumentsText)
      return true
    case "/note-edit":
      await handleEditKnowledgeNote(argumentsText)
      return true
    case "/note-delete":
      await handleDeleteKnowledgeNote(argumentsText)
      return true
    case "/note-delete-many":
      await handleDeleteMultipleKnowledgeNotes(argumentsText)
      return true
    case "/note-delete-all":
      await handleDeleteAllKnowledgeNotes()
      return true
    case "/skills":
      printSkills()
      return true
    case "/skill":
      await handleToggleSkill(argumentsText)
      return true
    case "/skill-show":
      await handleShowSkill(argumentsText)
      return true
    case "/skill-new":
      await handleCreateSkill(argumentsText)
      return true
    case "/skill-edit":
      await handleEditSkill(argumentsText)
      return true
    case "/skill-delete":
      await handleDeleteSkill(argumentsText)
      return true
    case "/skill-delete-many":
      await handleDeleteMultipleSkills(argumentsText)
      return true
    case "/skill-export":
      await handleExportSkill(argumentsText)
      return true
    case "/skill-path":
      await handleShowSkillPath(argumentsText)
      return true
    case "/skill-import-file":
      await handleImportSkillFile(argumentsText)
      return true
    case "/skill-import-folder":
      await handleImportSkillFolder(argumentsText)
      return true
    case "/skill-import-parent":
      await handleImportSkillsFromParentFolder(argumentsText)
      return true
    case "/skill-import-github":
      await handleImportSkillFromGitHub(argumentsText)
      return true
    case "/skill-scan":
      await handleScanSkills()
      return true
    case "/skill-cleanup":
      await handleCleanupSkillReferences()
      return true
    case "/bundle-items":
      printBundleExportableItems()
      return true
    case "/bundle-export":
      await handleBundleExport(argumentsText)
      return true
    case "/bundle-preview":
      await handleBundlePreview(argumentsText)
      return true
    case "/bundle-import":
      await handleBundleImport(argumentsText)
      return true
    case "/bundle-publish-payload":
      await handleBundlePublishPayload(argumentsText)
      return true
    case "/conversations":
      await printConversations()
      return true
    case "/use":
      await handleUseConversation(argumentsText)
      return true
    case "/show":
      await handleShowConversation(argumentsText)
      return true
    case "/rename":
      await handleRenameConversation(argumentsText)
      return true
    case "/pin":
      await toggleConversationSessionStateForCli(
        "pinnedSessionIds",
        argumentsText,
      )
      return true
    case "/archive":
      await toggleConversationSessionStateForCli(
        "archivedSessionIds",
        argumentsText,
      )
      return true
    case "/delete":
      await handleDeleteConversation(argumentsText)
      return true
    case "/delete-all":
      await handleDeleteAllConversations()
      return true
    case "/new":
      startNewConversation()
      return true
    default:
      if (cmd.startsWith("/")) {
        printColored(
          colors.red,
          `Unknown command: ${cmd}. Type /help for available commands.`,
        )
        return true
      }
      return false
  }
}

async function runAgentCLI(prompt: string): Promise<void> {
  if (isProcessing) {
    printColored(
      colors.red,
      "Agent is already processing. Use /stop to cancel.",
    )
    return
  }

  isProcessing = true
  try {
    console.log(`${colors.dim}Processing...${colors.reset}`)

    const { runPromise } = await startCliPromptRun(prompt)
    const agentResult = await runPromise

    // Print the response
    console.log()
    printColored(colors.green, agentResult.content)
    console.log()
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    printColored(colors.red, `Error: ${errorMessage}`)
  } finally {
    isProcessing = false
  }
}

export async function startHeadlessCLI(
  shutdownHandler?: () => Promise<void>,
): Promise<void> {
  onShutdown = shutdownHandler ?? (async () => process.exit(0))
  console.log(`
${colors.bold}${colors.cyan}═══════════════════════════════════════════════════${colors.reset}
${colors.bold}  DotAgents Headless CLI${colors.reset}
${colors.bold}${colors.cyan}═══════════════════════════════════════════════════${colors.reset}

${colors.dim}Type /help for available commands.${colors.reset}
`)

  const serverStatus = mcpService.getServerStatus()
  const connectedCount = countConnectedMcpServers(serverStatus)
  const totalCount = Object.keys(serverStatus).length
  printColored(
    colors.green,
    `MCP initialized: ${connectedCount}/${totalCount} servers connected`,
  )

  console.log()

  rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: `${colors.cyan}>${colors.reset} `,
  })

  rl.prompt()

  rl.on("line", async (line) => {
    const input = line.trim()

    if (!input) {
      rl?.prompt()
      return
    }

    // Handle slash commands
    const wasCommand = await handleSlashCommand(input)
    if (!wasCommand) {
      // Regular prompt - run the agent
      await runAgentCLI(input)
    }

    rl?.prompt()
  })

  rl.on("close", () => {
    if (!shutdownRequested) {
      void requestShutdown("Shutting down gracefully...")
    }
  })

  // Handle SIGINT gracefully
  process.on("SIGINT", async () => {
    if (isProcessing) {
      printColored(colors.yellow, "\nStopping agent...")
      await emergencyStopAll()
      isProcessing = false
      rl?.prompt()
    } else {
      await requestShutdown("Shutting down gracefully...")
    }
  })
}
