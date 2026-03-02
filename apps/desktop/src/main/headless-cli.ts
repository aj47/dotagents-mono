/**
 * Interactive terminal CLI for headless mode.
 * Provides a readline-based REPL for interacting with the agent from SSH.
 */
import readline from "readline"
import { configStore } from "./config"
import { mcpService, MCPToolResult } from "./mcp-service"
import { processTranscriptWithAgentMode } from "./llm"
import { state } from "./state"
import { conversationService } from "./conversation-service"
import { agentSessionTracker } from "./agent-session-tracker"
import { agentProfileService, createSessionSnapshotFromProfile } from "./agent-profile-service"
import { emergencyStopAll } from "./emergency-stop"
import { getErrorMessage } from "./error-utils"
import { SessionProfileSnapshot, AgentProgressUpdate } from "@shared/types"

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

function printHelp() {
  console.log(`
${colors.bold}Available Commands:${colors.reset}
  ${colors.cyan}/help${colors.reset}          - Show this help message
  ${colors.cyan}/quit${colors.reset}, ${colors.cyan}/exit${colors.reset}  - Exit the CLI
  ${colors.cyan}/stop${colors.reset}          - Emergency stop current agent session
  ${colors.cyan}/status${colors.reset}        - Show server status and active sessions
  ${colors.cyan}/conversations${colors.reset} - List recent conversations
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
  if (provider === "openai") modelName = cfg.mcpToolsOpenaiModel || "gpt-4o"
  else if (provider === "groq") modelName = cfg.mcpToolsGroqModel || "llama-3.3-70b-versatile"
  else if (provider === "gemini") modelName = cfg.mcpToolsGeminiModel || "gemini-2.0-flash"

  console.log(`\n${colors.bold}Server Status:${colors.reset}`)
  console.log(`  Model: ${colors.cyan}${provider}/${modelName}${colors.reset}`)
  console.log(`  Current conversation: ${colors.cyan}${currentConversationId || "(none)"}${colors.reset}`)
  console.log(`  Processing: ${isProcessing ? colors.yellow + "yes" : colors.green + "no"}${colors.reset}`)

  console.log(`\n${colors.bold}MCP Servers:${colors.reset}`)
  const serverNames = Object.keys(serverStatus)
  if (serverNames.length === 0) {
    console.log(`  ${colors.dim}(no servers configured)${colors.reset}`)
  } else {
    for (const name of serverNames) {
      const s = serverStatus[name]
      const status = s.connected ? colors.green + "connected" : colors.red + "disconnected"
      const disabled = s.configDisabled ? ` ${colors.dim}(disabled)${colors.reset}` : ""
      console.log(`  ${name}: ${status}${colors.reset} (${s.toolCount} tools)${disabled}`)
    }
  }

  console.log(`\n${colors.bold}Active Sessions:${colors.reset}`)
  if (activeSessions.length === 0) {
    console.log(`  ${colors.dim}(no active sessions)${colors.reset}`)
  } else {
    for (const session of activeSessions) {
      console.log(`  ${session.id}: ${session.conversationTitle || "(untitled)"}`)
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
    const recent = history.slice(0, 10)
    for (const conv of recent) {
      const isCurrent = conv.id === currentConversationId
      const marker = isCurrent ? colors.green + " *" : "  "
      const date = new Date(conv.updatedAt).toLocaleString()
      console.log(`${marker} ${conv.id}${colors.reset}: ${conv.title} ${colors.dim}(${date})${colors.reset}`)
    }
  }
  console.log()
}

async function handleStop() {
  if (!isProcessing) {
    printColored(colors.yellow, "No agent session is currently running.")
    return
  }
  printColored(colors.yellow, "Stopping agent...")
  const result = await emergencyStopAll()
  printColored(colors.green, `Stopped. Killed ${result.before - result.after} processes.`)
  isProcessing = false
}

function startNewConversation() {
  currentConversationId = undefined
  printColored(colors.green, "Started new conversation. Next message will create a new conversation.")
}

async function handleSlashCommand(input: string): Promise<boolean> {
  const cmd = input.trim().toLowerCase()
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
    case "/new":
      startNewConversation()
      return true
    default:
      if (cmd.startsWith("/")) {
        printColored(colors.red, `Unknown command: ${cmd}. Type /help for available commands.`)
        return true
      }
      return false
  }
}

async function runAgentCLI(prompt: string): Promise<void> {
  if (isProcessing) {
    printColored(colors.red, "Agent is already processing. Use /stop to cancel.")
    return
  }

  isProcessing = true
  const cfg = configStore.get()

  // Set agent mode state
  state.isAgentModeActive = true
  state.shouldStopAgent = false
  state.agentIterationCount = 0

  // Load or create conversation
  let previousConversationHistory: Array<{
    role: "user" | "assistant" | "tool"
    content: string
    toolCalls?: any[]
    toolResults?: any[]
  }> | undefined

  let conversationId = currentConversationId

  if (conversationId) {
    const updatedConversation = await conversationService.addMessageToConversation(
      conversationId,
      prompt,
      "user"
    )
    if (updatedConversation) {
      const messagesToConvert = updatedConversation.messages.slice(0, -1)
      previousConversationHistory = messagesToConvert.map((msg) => ({
        role: msg.role,
        content: msg.content,
        toolCalls: msg.toolCalls,
        timestamp: msg.timestamp,
        toolResults: msg.toolResults?.map((tr) => ({
          content: [{ type: "text" as const, text: tr.success ? tr.content : (tr.error || tr.content) }],
          isError: !tr.success,
        })),
      }))
    } else {
      const newConversation = await conversationService.createConversationWithId(conversationId, prompt, "user")
      conversationId = newConversation.id
      previousConversationHistory = []
    }
  }

  if (!conversationId) {
    const newConversation = await conversationService.createConversationWithId(
      conversationService.generateConversationIdPublic(),
      prompt,
      "user"
    )
    conversationId = newConversation.id
  }

  currentConversationId = conversationId

  // Get profile snapshot
  let profileSnapshot: SessionProfileSnapshot | undefined
  const currentProfile = agentProfileService.getCurrentProfile()
  if (currentProfile) {
    profileSnapshot = createSessionSnapshotFromProfile(currentProfile)
  }

  // Start session
  const conversationTitle = prompt.length > 50 ? prompt.substring(0, 50) + "..." : prompt
  const sessionId = agentSessionTracker.startSession(conversationId, conversationTitle, true, profileSnapshot)

  try {
    await mcpService.initialize()
    mcpService.registerExistingProcessesWithAgentManager()

    const availableTools = profileSnapshot?.mcpServerConfig
      ? mcpService.getAvailableToolsForProfile(profileSnapshot.mcpServerConfig)
      : mcpService.getAvailableTools()

    const executeToolCall = async (toolCall: any, onProgress?: (message: string) => void): Promise<MCPToolResult> => {
      return await mcpService.executeToolCall(toolCall, onProgress, false, sessionId, profileSnapshot?.mcpServerConfig)
    }

    // Track last shown step to avoid duplicates
    let lastShownStepId = ""
    let lastShownIteration = 0

    // Progress callback for terminal output
    const onProgress = (update: AgentProgressUpdate) => {
      // Show iteration changes
      if (update.currentIteration > lastShownIteration) {
        lastShownIteration = update.currentIteration
        console.log(`${colors.dim}  [Iteration ${update.currentIteration}/${update.maxIterations}]${colors.reset}`)
      }

      // Format progress updates for terminal
      if (update.steps && update.steps.length > 0) {
        const lastStep = update.steps[update.steps.length - 1]
        // Only show new steps (avoid duplicates)
        if (lastStep.id !== lastShownStepId) {
          lastShownStepId = lastStep.id
          if (lastStep.type === "tool_call" && lastStep.status === "in_progress") {
            printColored(colors.cyan, `  → Tool: ${lastStep.title}`)
          } else if (lastStep.type === "tool_result") {
            const statusColor = lastStep.status === "completed" ? colors.green : colors.red
            console.log(`${statusColor}  ✓ ${lastStep.title}${colors.reset}`)
          } else if (lastStep.type === "completion") {
            console.log(`${colors.dim}  ${lastStep.title}${colors.reset}`)
          }
        }
      }
    }

    console.log(`${colors.dim}Processing...${colors.reset}`)

    const agentResult = await processTranscriptWithAgentMode(
      prompt,
      availableTools,
      executeToolCall,
      cfg.mcpUnlimitedIterations ? Infinity : (cfg.mcpMaxIterations ?? 10),
      previousConversationHistory,
      conversationId,
      sessionId,
      onProgress,
      profileSnapshot,
    )

    agentSessionTracker.completeSession(sessionId, "Agent completed successfully")

    // Print the response
    console.log()
    printColored(colors.green, agentResult.content)
    console.log()

  } catch (error) {
    const errorMessage = getErrorMessage(error)
    agentSessionTracker.errorSession(sessionId, errorMessage)
    printColored(colors.red, `Error: ${errorMessage}`)
  } finally {
    state.isAgentModeActive = false
    state.shouldStopAgent = false
    state.agentIterationCount = 0
    isProcessing = false
  }
}

export async function startHeadlessCLI(shutdownHandler?: () => Promise<void>): Promise<void> {
  onShutdown = shutdownHandler ?? (async () => process.exit(0))
  console.log(`
${colors.bold}${colors.cyan}═══════════════════════════════════════════════════${colors.reset}
${colors.bold}  DotAgents Headless CLI${colors.reset}
${colors.bold}${colors.cyan}═══════════════════════════════════════════════════${colors.reset}

${colors.dim}Type /help for available commands.${colors.reset}
`)

  const serverStatus = mcpService.getServerStatus()
  const connectedCount = Object.values(serverStatus).filter(s => s.connected).length
  const totalCount = Object.keys(serverStatus).length
  printColored(colors.green, `MCP initialized: ${connectedCount}/${totalCount} servers connected`)

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
