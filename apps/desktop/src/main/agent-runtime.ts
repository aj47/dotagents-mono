import { processTranscriptWithAgentMode, type AgentModeResponse } from "./llm"
import {
  mcpService,
  type MCPTool,
  type MCPToolCall,
  type MCPToolResult,
} from "./mcp-service"
import type { AgentProgressUpdate, SessionProfileSnapshot } from "../shared/types"

type ToolProgressCallback = (message: string) => void

type ConversationHistory = AgentModeResponse["conversationHistory"]

type ProfileMcpServerConfig = SessionProfileSnapshot["mcpServerConfig"]

export interface AgentRuntimeToolService {
  initialize(): Promise<void>
  registerExistingProcessesWithAgentManager(): void
  getAvailableTools(): MCPTool[]
  getAvailableToolsForProfile(profileMcpConfig?: ProfileMcpServerConfig): MCPTool[]
  executeToolCall(
    toolCall: MCPToolCall,
    onProgress?: ToolProgressCallback,
    skipApprovalCheck?: boolean,
    sessionId?: string,
    profileMcpConfig?: ProfileMcpServerConfig,
  ): Promise<MCPToolResult>
}

export interface AgentRuntimeDependencies {
  toolService: AgentRuntimeToolService
  runAgentLoop: typeof processTranscriptWithAgentMode
}

function getDefaultAgentRuntimeDependencies(): AgentRuntimeDependencies {
  return {
    toolService: mcpService,
    runAgentLoop: processTranscriptWithAgentMode,
  }
}

export interface AgentRuntimeExecuteToolOptions {
  sessionId?: string
  profileSnapshot?: SessionProfileSnapshot
  skipApprovalCheck?: boolean
  beforeExecuteToolCall?: (
    toolCall: MCPToolCall,
    onProgress?: ToolProgressCallback,
  ) => Promise<MCPToolResult | void> | MCPToolResult | void
  afterExecuteToolCall?: (
    toolCall: MCPToolCall,
    result: MCPToolResult,
  ) => Promise<void> | void
}

export interface AgentRuntimeRunOptions extends AgentRuntimeExecuteToolOptions {
  transcript: string
  maxIterations?: number
  previousConversationHistory?: ConversationHistory
  conversationId?: string
  onProgress?: (update: AgentProgressUpdate) => void
  profileSnapshot?: SessionProfileSnapshot
  runId?: number
  initializeMcp?: boolean
  registerExistingProcesses?: boolean
}

export class AgentRuntime {
  constructor(private readonly explicitDeps?: AgentRuntimeDependencies) {}

  private get deps(): AgentRuntimeDependencies {
    return this.explicitDeps ?? getDefaultAgentRuntimeDependencies()
  }

  async initializeTools(options?: {
    initializeMcp?: boolean
    registerExistingProcesses?: boolean
  }): Promise<void> {
    const initializeMcp = options?.initializeMcp ?? true
    const registerExistingProcesses = options?.registerExistingProcesses ?? true

    if (initializeMcp) {
      await this.deps.toolService.initialize()
    }

    if (registerExistingProcesses) {
      this.deps.toolService.registerExistingProcessesWithAgentManager()
    }
  }

  getAvailableTools(profileSnapshot?: SessionProfileSnapshot): MCPTool[] {
    return profileSnapshot?.mcpServerConfig
      ? this.deps.toolService.getAvailableToolsForProfile(profileSnapshot.mcpServerConfig)
      : this.deps.toolService.getAvailableTools()
  }

  async executeToolCall(
    toolCall: MCPToolCall,
    onProgress: ToolProgressCallback | undefined,
    options: AgentRuntimeExecuteToolOptions,
  ): Promise<MCPToolResult> {
    const preExecuteResult = await options.beforeExecuteToolCall?.(toolCall, onProgress)
    if (preExecuteResult) {
      return preExecuteResult
    }

    const result = await this.deps.toolService.executeToolCall(
      toolCall,
      onProgress,
      options.skipApprovalCheck ?? false,
      options.sessionId,
      options.profileSnapshot?.mcpServerConfig,
    )

    await options.afterExecuteToolCall?.(toolCall, result)
    return result
  }

  async runAgentTurn(options: AgentRuntimeRunOptions): Promise<AgentModeResponse> {
    await this.initializeTools({
      initializeMcp: options.initializeMcp,
      registerExistingProcesses: options.registerExistingProcesses,
    })

    const availableTools = this.getAvailableTools(options.profileSnapshot)
    const executeToolCall = (toolCall: MCPToolCall, onProgress?: ToolProgressCallback) =>
      this.executeToolCall(toolCall, onProgress, options)

    return this.deps.runAgentLoop(
      options.transcript,
      availableTools,
      executeToolCall,
      options.maxIterations,
      options.previousConversationHistory,
      options.conversationId,
      options.sessionId,
      options.onProgress,
      options.profileSnapshot,
      options.runId,
    )
  }
}

export const agentRuntime = new AgentRuntime()
