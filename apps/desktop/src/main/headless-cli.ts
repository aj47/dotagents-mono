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
  getManagedLoopSummaries,
  resolveManagedLoopSelection,
  toggleManagedLoopEnabled,
  triggerManagedLoop,
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
import { loopService } from "./loop-service"
import { skillsService } from "./skills-service"
import {
  deleteAllConversationsAndSyncSessionState,
  deleteConversationAndSyncSessionState,
  renameConversationTitleAndSyncSession,
} from "./conversation-management"
import { emergencyStopAll } from "./emergency-stop"
import {
  getEnabledSkillIdsForAgentProfile,
  type ConversationSessionState,
  type ConversationSessionStateKey,
  getAgentProfileCatalogDescription,
  getAgentProfileCatalogSummaryItems,
  getAgentProfileDisplayName,
  getEnabledAgentProfiles,
  getAgentProfileStatusLabels,
  isSkillEnabledForAgentProfile,
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
    rl?.question(`${colors.yellow}${message} [y/N] ${colors.reset}`, (answer) => {
      resolve(/^(y|yes)$/i.test(answer.trim()))
    })
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
  ${colors.cyan}/agents${colors.reset}        - List enabled agents and the active selection
  ${colors.cyan}/agent <id-or-name>${colors.reset} - Switch the active agent for future prompts
  ${colors.cyan}/loops${colors.reset}         - List repeat tasks with live status and profile info
  ${colors.cyan}/loop-show <id-or-name>${colors.reset} - Show full repeat-task details
  ${colors.cyan}/loop-toggle <id-or-name>${colors.reset} - Enable or disable a repeat task
  ${colors.cyan}/loop-run <id-or-name>${colors.reset} - Run a repeat task immediately
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

function getAvailableAgentsForCli(): AgentProfile[] {
  return sortAgentProfilesByPriority(
    getEnabledAgentProfiles(agentProfileService.getAll()),
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
  const description = summary
    ? ` ${colors.dim}- ${summary}${colors.reset}`
    : ""

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
  const agents = getAvailableAgentsForCli()
  const availableSkillCount = skillsService.getSkills().length
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
        console.log(`    ${colors.dim}${summaryItems.join(" • ")}${colors.reset}`)
      }
    }
  }
  console.log()
}

function getSortedSkillsForCli(): AgentSkill[] {
  return [...skillsService.getSkills()].sort((left, right) =>
    left.name.localeCompare(right.name),
  )
}

function printSkills() {
  const skills = getSortedSkillsForCli()
  const currentProfile = agentProfileService.getCurrentProfile()
  const enabledSkillIdSet = new Set(
    getEnabledSkillIdsForAgentProfile(
      currentProfile,
      skills.map((skill) => skill.id),
    ),
  )

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
    const enabledForProfile = enabledSkillIdSet.has(skill.id)
    const stateLabel = enabledForProfile
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
    const recent = orderItemsByPinnedFirst(
      history,
      (conversation) => pinnedSessionIds.has(conversation.id),
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
  const query = selection.trim()
  if (!query) {
    printColored(colors.yellow, "Usage: /agent <agent-id-or-name>")
    return
  }

  const { selectedProfile: selectedAgent, ambiguousProfiles: ambiguousAgents } =
    resolveAgentProfileSelection(getAvailableAgentsForCli(), query)
  if (selectedAgent) {
    const profile = activateAgentProfile(selectedAgent)
    printColored(
      colors.green,
      `Using agent ${getAgentProfileDisplayName(profile)} (${profile.id}) for future prompts.`,
    )
    return
  }

  if (ambiguousAgents?.length) {
    printColored(colors.yellow, `Agent selector "${query}" matches multiple agents:`)
    for (const profile of ambiguousAgents) {
      console.log(`  ${formatAgentSelectionSummary(profile)}`)
    }
    return
  }

  printColored(colors.red, `Agent not found: ${query}`)
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
    console.log(`  ${colors.dim}command ${commandParts.join(" ")}${colors.reset}`)
  }

  if (server.config?.url) {
    console.log(`  ${colors.dim}url ${server.config.url}${colors.reset}`)
  }

  if (typeof server.config?.timeout === "number") {
    console.log(`  ${colors.dim}timeout ${server.config.timeout}ms${colors.reset}`)
  }

  if (server.envCount > 0) {
    console.log(`  ${colors.dim}${server.envCount} env vars configured${colors.reset}`)
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
    return getManagedMcpServerSummary(selectedServer.name, mcpManagementStore) || null
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
      result.error || `Failed to load logs for MCP server ${selectedServer.name}.`,
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
    console.log(`  ${colors.dim}max ${loop.maxIterations} iterations${colors.reset}`)
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
    printColored(colors.yellow, "Usage: /loop-show|/loop-toggle|/loop-run <loop-id-or-name>")
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

async function handleShowLoop(selection: string): Promise<void> {
  const selectedLoop = await resolveLoopSelectionForCli(selection)
  if (!selectedLoop) {
    return
  }

  printLoopDetails(selectedLoop)
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

async function handleToggleSkill(selection: string): Promise<void> {
  const skillId = selection.trim()
  if (!skillId) {
    printColored(colors.yellow, "Usage: /skill <skill-id>")
    return
  }

  const currentProfile = agentProfileService.getCurrentProfile()
  if (!currentProfile) {
    printColored(
      colors.yellow,
      "No current agent profile. Use /agent <id-or-name> before toggling skills.",
    )
    return
  }

  const skill = skillsService.getSkill(skillId)
  if (!skill) {
    printColored(colors.red, `Skill not found: ${skillId}`)
    return
  }

  const updatedProfile = agentProfileService.toggleProfileSkill(
    currentProfile.id,
    skill.id,
    getSortedSkillsForCli().map((availableSkill) => availableSkill.id),
  )
  if (!updatedProfile) {
    printColored(colors.red, `Failed to toggle skill: ${skill.id}`)
    return
  }

  const enabledForProfile = isSkillEnabledForAgentProfile(
    updatedProfile,
    skill.id,
  )
  printColored(
    colors.green,
    `${enabledForProfile ? "Enabled" : "Disabled"} skill ${skill.name} (${skill.id}) for ${getAgentProfileDisplayName(updatedProfile)}.`,
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

  const actionLabel = stateKey === "pinnedSessionIds"
    ? (nextEnabled ? "Pinned" : "Unpinned")
    : (nextEnabled ? "Archived" : "Unarchived")

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
    case "/loops":
      printLoops()
      return true
    case "/loop-show":
      await handleShowLoop(argumentsText)
      return true
    case "/loop-toggle":
      await handleToggleLoop(argumentsText)
      return true
    case "/loop-run":
      await handleRunLoop(argumentsText)
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
