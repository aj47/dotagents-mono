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
import { emergencyStopAll } from "./emergency-stop"
import type {
  AgentProgressUpdate,
  Conversation,
  ConversationHistoryItem,
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

function printHelp() {
  console.log(`
${colors.bold}Available Commands:${colors.reset}
  ${colors.cyan}/help${colors.reset}          - Show this help message
  ${colors.cyan}/quit${colors.reset}, ${colors.cyan}/exit${colors.reset}  - Exit the CLI
  ${colors.cyan}/stop${colors.reset}          - Emergency stop current agent session
  ${colors.cyan}/status${colors.reset}        - Show server status and active sessions
  ${colors.cyan}/conversations${colors.reset} - List recent conversations
  ${colors.cyan}/use <id>${colors.reset}      - Continue a previous conversation by ID or unique prefix
  ${colors.cyan}/show [id]${colors.reset}     - Show recent messages for the current or selected conversation
  ${colors.cyan}/new${colors.reset}           - Start a new conversation

${colors.dim}Type any message to interact with the agent.${colors.reset}
`)
}

function printStatus() {
  const serverStatus = mcpService.getServerStatus()
  const activeSessions = agentSessionTracker.getActiveSessions()
  const cfg = configStore.get()

  // Determine current model info
  const provider = cfg.mcpToolsProviderId || "openai"
  let modelName = "default"
  if (provider === "openai")
    modelName = cfg.mcpToolsOpenaiModel || "gpt-4.1-mini"
  else if (provider === "groq")
    modelName = cfg.mcpToolsGroqModel || "openai/gpt-oss-120b"
  else if (provider === "gemini")
    modelName = cfg.mcpToolsGeminiModel || "gemini-2.5-flash"

  console.log(`\n${colors.bold}Server Status:${colors.reset}`)
  console.log(`  Model: ${colors.cyan}${provider}/${modelName}${colors.reset}`)
  console.log(
    `  Current conversation: ${colors.cyan}${currentConversationId || "(none)"}${colors.reset}`,
  )
  console.log(
    `  Processing: ${isProcessing ? colors.yellow + "yes" : colors.green + "no"}${colors.reset}`,
  )

  console.log(`\n${colors.bold}MCP Servers:${colors.reset}`)
  const serverNames = Object.keys(serverStatus)
  if (serverNames.length === 0) {
    console.log(`  ${colors.dim}(no servers configured)${colors.reset}`)
  } else {
    for (const name of serverNames) {
      const s = serverStatus[name]
      const status = s.connected
        ? colors.green + "connected"
        : colors.red + "disconnected"
      const disabled = s.configDisabled
        ? ` ${colors.dim}(disabled)${colors.reset}`
        : ""
      console.log(
        `  ${name}: ${status}${colors.reset} (${s.toolCount} tools)${disabled}`,
      )
    }
  }

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

async function printConversations() {
  const history = await conversationService.getConversationHistory()
  console.log(`\n${colors.bold}Recent Conversations:${colors.reset}`)
  if (history.length === 0) {
    console.log(`  ${colors.dim}(no conversations)${colors.reset}`)
  } else {
    const recent = history.slice(0, RECENT_CONVERSATION_LIMIT)
    for (const conv of recent) {
      const isCurrent = conv.id === currentConversationId
      const marker = isCurrent ? colors.green + " *" : "  "
      const date = new Date(conv.updatedAt).toLocaleString()
      console.log(
        `${marker} ${conv.id}${colors.reset}: ${conv.title} ${colors.dim}(${date})${colors.reset}`,
      )
    }
    console.log()
    console.log(
      `${colors.dim}Use /use <conversation-id-prefix> to continue one, or /show <conversation-id-prefix> to inspect it.${colors.reset}`,
    )
  }
  console.log()
}

function formatConversationSelectionSummary(
  conversation: ConversationHistoryItem,
): string {
  const updatedAt = new Date(conversation.updatedAt).toLocaleString()
  return `${conversation.id} (${conversation.title}, updated ${updatedAt})`
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
    case "/conversations":
      await printConversations()
      return true
    case "/use":
      await handleUseConversation(argumentsText)
      return true
    case "/show":
      await handleShowConversation(argumentsText)
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
  const connectedCount = Object.values(serverStatus).filter(
    (s) => s.connected,
  ).length
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
