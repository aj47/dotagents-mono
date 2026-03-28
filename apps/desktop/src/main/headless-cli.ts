/**
 * Interactive terminal CLI for headless mode.
 * Provides a readline-based REPL for interacting with the agent from SSH.
 */
import readline from "readline"
import { configStore } from "./config"
import { mcpService } from "./mcp-service"
import { toolApprovalManager } from "./state"
import { conversationService } from "./conversation-service"
import { agentSessionTracker } from "./agent-session-tracker"
import { startSharedPromptRun } from "./agent-mode-runner"
import { resolveConversationHistorySelection } from "./conversation-history-selection"
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
import { agentProfileService } from "./agent-profile-service"
import { activateAgentProfile } from "./agent-profile-activation"
import {
  createManagedAgentProfile,
  deleteManagedAgentProfile,
  getManagedAgentProfile,
  getManagedAgentProfiles,
  resolveManagedAgentProfileSelection,
  toggleManagedAgentProfileEnabled,
  updateManagedAgentProfile,
} from "./agent-profile-management"
import { loopService } from "./loop-service"
import {
  createManagedKnowledgeNote,
  deleteAllManagedKnowledgeNotes,
  deleteManagedKnowledgeNote,
  getManagedKnowledgeNote,
  getManagedKnowledgeNotes,
  isManagedKnowledgeNoteFailure,
  searchManagedKnowledgeNotes,
  updateManagedKnowledgeNote,
} from "./knowledge-note-management"
import {
  getManagedCurrentProfileSkills,
  getManagedSkillsCatalog,
  toggleManagedSkillForCurrentProfile,
} from "./profile-skill-management"
import {
  deleteAllConversationsAndSyncSessionState,
  deleteConversationAndSyncSessionState,
  renameConversationTitleAndSyncSession,
} from "./conversation-management"
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
  AgentProgressUpdate,
  Conversation,
  ConversationHistoryItem,
  KnowledgeNote,
  LoopSummary,
} from "@shared/types"

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
  ${colors.cyan}/mcp${colors.reset}           - List MCP servers with live status and transport
  ${colors.cyan}/mcp-show <name>${colors.reset} - Show full MCP server details
  ${colors.cyan}/mcp-enable <name>${colors.reset} - Runtime-enable an MCP server for this profile
  ${colors.cyan}/mcp-disable <name>${colors.reset} - Runtime-disable an MCP server for this profile
  ${colors.cyan}/mcp-restart <name>${colors.reset} - Restart an MCP server process
  ${colors.cyan}/mcp-stop <name>${colors.reset} - Stop an MCP server process
  ${colors.cyan}/mcp-logs <name>${colors.reset} - Show recent MCP server logs
  ${colors.cyan}/agents${colors.reset}        - List agent profiles and the active selection
  ${colors.cyan}/agent <id-or-name>${colors.reset} - Switch the active agent for future prompts
  ${colors.cyan}/agent-show <id-or-name>${colors.reset} - Show full agent profile details
  ${colors.cyan}/agent-new <json>${colors.reset} - Create an agent profile from a JSON payload
  ${colors.cyan}/agent-edit <id> <json>${colors.reset} - Update an agent profile from a JSON payload
  ${colors.cyan}/agent-toggle <id-or-name>${colors.reset} - Enable or disable an agent profile
  ${colors.cyan}/agent-delete <id-or-name>${colors.reset} - Delete an agent profile
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
  ${colors.cyan}/note-delete-all${colors.reset} - Delete all knowledge notes
  ${colors.cyan}/skills${colors.reset}        - List skills for the current agent profile
  ${colors.cyan}/skill <id>${colors.reset}    - Toggle a skill for the current agent profile
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

function getSelectableAgentsForCli(): AgentProfile[] {
  return sortAgentProfilesByPriority(
    getEnabledAgentProfiles(getManagedAgentProfiles()),
    {
      priorityProfileId: agentProfileService.getCurrentProfile()?.id,
    },
  )
}

function formatAgentSelectionSummary(profile: AgentProfile): string {
  const labels = getAgentProfileStatusLabels(profile, {
    isCurrent: profile.id === agentProfileService.getCurrentProfile()?.id,
  })
  const labelSuffix = labels.length
    ? ` ${colors.dim}[${labels.join(", ")}]${colors.reset}`
    : ""
  const summary = getAgentProfileCatalogDescription(profile)
  const description = summary ? ` ${colors.dim}- ${summary}${colors.reset}` : ""

  return `${profile.id}: ${getAgentProfileDisplayName(profile)}${labelSuffix}${description}`
}

function printAgentDetails(profile: AgentProfile): void {
  console.log(
    `\n${colors.bold}${getAgentProfileDisplayName(profile)}${colors.reset}`,
  )
  console.log(`  ${colors.dim}${profile.id}${colors.reset}`)
  console.log(
    `  ${colors.dim}${
      getAgentProfileStatusLabels(profile, {
        isCurrent: profile.id === agentProfileService.getCurrentProfile()?.id,
      }).join(", ") || "custom"
    }${colors.reset}`,
  )

  const summary = getAgentProfileCatalogDescription(profile)
  if (summary) {
    console.log(`  ${colors.dim}${summary}${colors.reset}`)
  }

  console.log()
  console.log(`${colors.bold}Connection${colors.reset}`)
  console.log(`  type: ${profile.connection.type}`)
  if (profile.connection.command) {
    console.log(
      `  command: ${profile.connection.command}${profile.connection.args?.length ? ` ${profile.connection.args.join(" ")}` : ""}`,
    )
  }
  if (profile.connection.baseUrl) {
    console.log(`  baseUrl: ${profile.connection.baseUrl}`)
  }
  if (profile.connection.cwd) {
    console.log(`  cwd: ${profile.connection.cwd}`)
  }

  const optionalSections: Array<[string, unknown]> = [
    ["description", profile.description],
    ["systemPrompt", profile.systemPrompt],
    ["guidelines", profile.guidelines],
    ["modelConfig", profile.modelConfig],
    ["toolConfig", profile.toolConfig],
    ["skillsConfig", profile.skillsConfig],
    ["properties", profile.properties],
  ]

  for (const [label, value] of optionalSections) {
    if (
      value === undefined ||
      value === null ||
      (typeof value === "string" && value === "") ||
      (typeof value === "object" &&
        !Array.isArray(value) &&
        Object.keys(value).length === 0)
    ) {
      continue
    }

    console.log()
    console.log(`${colors.bold}${label}${colors.reset}`)
    if (typeof value === "string") {
      console.log(value)
      continue
    }

    console.log(JSON.stringify(value, null, 2))
  }

  console.log()
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
      `${colors.dim}Use /note-show, /note-search, /note-new, /note-edit, /note-delete, or /note-delete-all to manage notes.${colors.reset}`,
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

function printStatus() {
  const activeSessions = agentSessionTracker.getActiveSessions()
  const currentAgent = agentProfileService.getCurrentProfile()
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

  console.log(`\n${colors.bold}Active Sessions:${colors.reset}`)
  if (activeSessions.length === 0) {
    console.log(`  ${colors.dim}(no active sessions)${colors.reset}`)
  } else {
    for (const session of activeSessions) {
      console.log(
        `  ${session.id}: ${session.conversationTitle || "(untitled)"}`,
      )
    }
  }
  console.log()
}

function printAgents() {
  const agents = getManagedAgentProfiles()
  const availableSkillCount = getManagedSkillsCatalog().length
  console.log(`\n${colors.bold}Agent Profiles:${colors.reset}`)
  if (agents.length === 0) {
    console.log(`  ${colors.dim}(no agent profiles)${colors.reset}`)
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
  console.log(
    `${colors.dim}Use /agent to switch enabled profiles, or /agent-show, /agent-new, /agent-edit, /agent-toggle, and /agent-delete for profile management.${colors.reset}`,
  )
  console.log()
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

function resolveAgentProfileSelectionForCli(
  selection: string,
  options: {
    enabledOnly?: boolean
    usage?: string
  } = {},
): AgentProfile | null {
  const query = selection.trim()
  if (!query) {
    printColored(
      colors.yellow,
      options.usage || "Usage: /agent <agent-id-or-name>",
    )
    return null
  }

  const candidateProfiles = options.enabledOnly
    ? getSelectableAgentsForCli()
    : getManagedAgentProfiles()
  const { selectedProfile, ambiguousProfiles } =
    resolveManagedAgentProfileSelection(candidateProfiles, query)
  if (selectedProfile) {
    return selectedProfile
  }

  if (ambiguousProfiles?.length) {
    printColored(
      colors.yellow,
      `Agent selector "${query}" matches multiple profiles:`,
    )
    for (const profile of ambiguousProfiles) {
      console.log(`  ${formatAgentSelectionSummary(profile)}`)
    }
    return null
  }

  if (options.enabledOnly) {
    const disabledMatch = resolveManagedAgentProfileSelection(
      getManagedAgentProfiles(),
      query,
    ).selectedProfile
    if (disabledMatch && disabledMatch.enabled === false) {
      printColored(
        colors.yellow,
        `Agent profile ${getAgentProfileDisplayName(disabledMatch)} is disabled. Use /agent-toggle or /agent-edit to enable it first.`,
      )
      return null
    }
  }

  printColored(colors.red, `Agent profile not found: ${query}`)
  return null
}

async function handleShowAgentProfile(selection: string): Promise<void> {
  const selectedProfile = resolveAgentProfileSelectionForCli(selection, {
    usage: "Usage: /agent-show <agent-id-or-name>",
  })
  if (!selectedProfile) {
    return
  }

  const latestProfile =
    getManagedAgentProfile(selectedProfile.id) || selectedProfile
  printAgentDetails(latestProfile)
}

async function handleCreateAgentProfile(payloadText: string): Promise<void> {
  const payload = parseCliJsonObject(
    payloadText,
    "Usage: /agent-new <json-payload>",
  )
  if (!payload) {
    return
  }

  const result = createManagedAgentProfile(payload)
  if (!result.success || !result.profile) {
    printColored(
      result.error === "invalid_input" ? colors.yellow : colors.red,
      result.errorMessage || "Failed to create agent profile.",
    )
    return
  }

  printColored(
    colors.green,
    `Created agent profile ${result.profile.id}: ${getAgentProfileDisplayName(result.profile)}`,
  )
  printAgentDetails(result.profile)
}

async function handleEditAgentProfile(input: string): Promise<void> {
  const parsed = parseAgentProfileEditCommand(input)
  if (!parsed) {
    return
  }

  const selectedProfile = resolveAgentProfileSelectionForCli(parsed.selection, {
    usage: "Usage: /agent-edit <agent-id-or-name> <json-payload>",
  })
  if (!selectedProfile) {
    return
  }

  const result = updateManagedAgentProfile(selectedProfile.id, parsed.payload, {
    allowBuiltInFieldUpdates: true,
  })
  if (!result.success || !result.profile) {
    printColored(
      result.error === "invalid_input" ? colors.yellow : colors.red,
      result.errorMessage || "Failed to update agent profile.",
    )
    return
  }

  printColored(
    colors.green,
    `Updated agent profile ${result.profile.id}: ${getAgentProfileDisplayName(result.profile)}`,
  )
  printAgentDetails(result.profile)
}

async function handleToggleAgentProfile(selection: string): Promise<void> {
  const selectedProfile = resolveAgentProfileSelectionForCli(selection, {
    usage: "Usage: /agent-toggle <agent-id-or-name>",
  })
  if (!selectedProfile) {
    return
  }

  const result = toggleManagedAgentProfileEnabled(selectedProfile.id)
  if (!result.success || !result.profile) {
    printColored(
      result.error === "not_found" ? colors.red : colors.yellow,
      result.errorMessage || "Failed to toggle agent profile.",
    )
    return
  }

  printColored(
    colors.green,
    `${result.profile.enabled ? "Enabled" : "Disabled"} agent profile ${result.profile.id}: ${getAgentProfileDisplayName(result.profile)}`,
  )
}

async function handleDeleteAgentProfile(selection: string): Promise<void> {
  const selectedProfile = resolveAgentProfileSelectionForCli(selection, {
    usage: "Usage: /agent-delete <agent-id-or-name>",
  })
  if (!selectedProfile) {
    return
  }

  const confirmed = await promptForConfirmation(
    `Delete agent profile ${selectedProfile.id} (${getAgentProfileDisplayName(selectedProfile)})?`,
  )
  if (!confirmed) {
    printColored(colors.dim, "Agent profile delete cancelled.")
    return
  }

  const result = deleteManagedAgentProfile(selectedProfile.id)
  if (!result.success) {
    printColored(
      result.error === "delete_forbidden" ? colors.yellow : colors.red,
      result.errorMessage || "Failed to delete agent profile.",
    )
    return
  }

  printColored(
    colors.green,
    `Deleted agent profile ${selectedProfile.id}: ${getAgentProfileDisplayName(selectedProfile)}`,
  )

  if (result.activatedProfile) {
    printColored(
      colors.dim,
      `Current agent switched to ${getAgentProfileDisplayName(result.activatedProfile)} (${result.activatedProfile.id}).`,
    )
  }
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
    `${colors.dim}Use /skill <id> to toggle a skill for the current agent profile.${colors.reset}`,
  )
  console.log()
}

async function printConversations() {
  const history = await conversationService.getConversationHistory()
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
      `${colors.dim}Use /use, /show, /pin, /archive, or /delete with a conversation ID prefix to manage it.${colors.reset}`,
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

  const history = await conversationService.getConversationHistory()
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
  const selectedProfile = resolveAgentProfileSelectionForCli(selection, {
    enabledOnly: true,
    usage: "Usage: /agent <agent-id-or-name>",
  })
  if (!selectedProfile) {
    return
  }

  const profile = activateAgentProfile(selectedProfile)
  printColored(
    colors.green,
    `Using agent ${getAgentProfileDisplayName(profile)} (${profile.id}) for future prompts.`,
  )
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

  const conversation = await conversationService.loadConversation(
    selectedConversation.id,
  )
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
    case "/note-delete-all":
      await handleDeleteAllKnowledgeNotes()
      return true
    case "/skills":
      printSkills()
      return true
    case "/skill":
      await handleToggleSkill(argumentsText)
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
  let activeSessionId: string | undefined
  try {
    // Track last shown step to avoid duplicates
    let lastShownStepId = ""
    let lastShownIteration = 0

    // Progress callback for terminal output
    const onProgress = (update: AgentProgressUpdate) => {
      // Show iteration changes
      if (update.currentIteration > lastShownIteration) {
        lastShownIteration = update.currentIteration
        console.log(
          `${colors.dim}  [Iteration ${update.currentIteration}/${update.maxIterations}]${colors.reset}`,
        )
      }

      // Format progress updates for terminal
      if (update.steps && update.steps.length > 0) {
        const lastStep = update.steps[update.steps.length - 1]
        // Only show new steps (avoid duplicates)
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

    console.log(`${colors.dim}Processing...${colors.reset}`)

    const { runPromise } = await startSharedPromptRun({
      prompt,
      requestedConversationId: currentConversationId,
      startSnoozed: true,
      approvalMode: "inline",
      onProgress,
      onPreparedContext: ({ conversationId, sessionId }) => {
        currentConversationId = conversationId
        activeSessionId = sessionId

        toolApprovalManager.registerSessionApprovalHandler(
          sessionId,
          ({ toolName, arguments: args }) =>
            promptForToolApproval(toolName, args),
        )
      },
    })
    const agentResult = await runPromise

    // Print the response
    console.log()
    printColored(colors.green, agentResult.content)
    console.log()
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    printColored(colors.red, `Error: ${errorMessage}`)
  } finally {
    if (activeSessionId) {
      toolApprovalManager.unregisterSessionApprovalHandler(activeSessionId)
    }
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
