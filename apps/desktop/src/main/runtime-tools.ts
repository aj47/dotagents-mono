/**
 * Runtime tools for DotAgents runtime actions and internal capabilities.
 *
 * These tools are registered with plain names (no server prefix) and provide
 * runtime operations that are not better expressed as direct `.agents` file edits.
 *
 * Unlike external MCP servers, these tools run directly in the main process
 * and have direct access to the app's services.
 */

import { mcpService, type MCPToolResult } from "./mcp-service"
import { agentSessionTracker } from "./agent-session-tracker"
import { agentSessionStateManager, toolApprovalManager } from "./state"
import { emergencyStopAll } from "./emergency-stop"
import { executeACPRouterTool, isACPRouterTool } from "./acp/acp-router-tools"
import { messageQueueService } from "./message-queue-service"
import { appendSessionUserResponse } from "./session-user-response-store"
import { conversationService } from "./conversation-service"
import { readMoreContext } from "./context-budget"
import { getRootAppSessionForAcpSession, setAcpSessionTitleOverride } from "./acp-session-state"
import { emitAgentProgress } from "./emit-agent-progress"
import { promises as fs } from "fs"
import { exec } from "child_process"
import { promisify } from "util"
import path from "path"
import {
  buildAgentSessionMissingConversationPayload,
  buildAgentSessionNotFoundPayload,
  buildGetToolSchemaPayload,
  buildKillAgentSessionPayload,
  buildKillAllAgentsNoopPayload,
  buildKillAllAgentsPayload,
  buildListRunningAgentsPayload,
  buildListServerToolsPayload,
  buildMarkWorkCompletePayload,
  buildSetSessionTitleMissingConversationPayload,
  buildSetSessionTitlePayload,
  buildSetSessionTitleProgressUpdate,
  buildSetSessionTitleRenameFailedPayload,
  buildSendAgentMessageQueuedPayload,
  parseReadMoreContextArgs,
  parseSendAgentMessageArgs,
  parseSetSessionTitleArgs,
} from "@dotagents/shared/runtime-tool-utils"
import {
  buildDisabledRuntimeSkillPayload,
  buildIgnoredExecuteCommandSkillIdWarning,
  buildRuntimeSkillInstructionsText,
  buildRuntimeSkillNotFoundPayload,
  getSkillRuntimeIds,
  isSkillEnabledByConfig,
  parseRuntimeSkillIdArg,
  resolveRuntimeSkill,
} from "@dotagents/shared/skills-api"
import {
  buildRuntimeCommandFailurePayload,
  buildRuntimeCommandPolicyBlockPayload,
  buildRuntimeCommandSuccessPayload,
  detectContextGatheringCommandBlock,
  detectPreferredPackageManager,
  detectPackageManagerMismatch,
  normalizeExecuteCommandWorkspacePaths,
  parseExecuteCommandArgs,
  truncateRuntimeCommandOutput,
} from "@dotagents/shared/runtime-command-utils"
import {
  materializeParsedRespondToUserResponse,
  parseRespondToUserArgs,
  validateRespondToUserImageFile,
  validateRespondToUserImagePath,
  validateRespondToUserVideoFile,
} from "@dotagents/shared/conversation-media-assets"

const execAsync = promisify(exec)

// Re-export from the dependency-free definitions module.
// This breaks the circular dependency: profile-service -> runtime-tool-definitions (no cycle)
// while runtime-tools -> profile-service is still valid since profile-service no longer imports from here.
export {
  RUNTIME_TOOLS_SERVER_NAME,
  runtimeToolDefinitions as runtimeTools,
  getRuntimeToolNames,
} from "./runtime-tool-definitions"

// Import for local use
import { runtimeToolDefinitions } from "./runtime-tool-definitions"

interface BuiltinToolContext {
  sessionId?: string
}

async function isSkillEnabledForRuntimeContext(skillIds: string | string[], context: BuiltinToolContext): Promise<boolean> {
  const { agentProfileService } = await import("./agent-profile-service")

  if (context.sessionId) {
    const stateSnapshot = typeof agentSessionStateManager.getSessionProfileSnapshot === "function"
      ? agentSessionStateManager.getSessionProfileSnapshot(context.sessionId)
      : undefined
    const trackerSnapshot = typeof agentSessionTracker.getSessionProfileSnapshot === "function"
      ? agentSessionTracker.getSessionProfileSnapshot(context.sessionId)
      : undefined
    const snapshot = stateSnapshot ?? trackerSnapshot
    if (snapshot) {
      const currentProfile = agentProfileService.getCurrentProfile()
      if (currentProfile?.id === snapshot.profileId) {
        return isSkillEnabledByConfig(skillIds, currentProfile.skillsConfig)
      }
      return isSkillEnabledByConfig(skillIds, snapshot.skillsConfig)
    }
  }

  const profile = agentProfileService.getCurrentProfile()
  if (!profile) return false
  return isSkillEnabledByConfig(skillIds, profile.skillsConfig)
}

function disabledSkillToolResult(skillId: string, action: "load" | "execute"): MCPToolResult {
  return {
    content: [{
      type: "text",
      text: JSON.stringify(buildDisabledRuntimeSkillPayload(skillId, action)),
    }],
    isError: true,
  }
}

async function getLatestUserMessageForSession(sessionId?: string): Promise<string | null> {
  if (!sessionId) {
    return null
  }

  const trackedSessionId = getRootAppSessionForAcpSession(sessionId) ?? sessionId
  const session = agentSessionTracker.getSession(trackedSessionId)
  if (!session?.conversationId) {
    return null
  }

  const conversation = await conversationService.loadConversation(session.conversationId)
  if (!conversation) {
    return null
  }

  const storedMessages = Array.isArray(conversation.rawMessages) && conversation.rawMessages.length > 0
    ? conversation.rawMessages
    : conversation.messages

  const latestUserMessage = [...storedMessages]
    .reverse()
    .find((message) => message.role === "user" && typeof message.content === "string" && message.content.trim().length > 0)

  return latestUserMessage?.content?.trim() ?? null
}

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath)
    return true
  } catch {
    return false
  }
}

async function resolveValidImagePath(rawPath: string): Promise<{ resolvedPath: string; fileBytes: number }> {
  const resolvedPath = path.isAbsolute(rawPath)
    ? rawPath
    : path.resolve(process.cwd(), rawPath)

  const pathValidation = validateRespondToUserImagePath(rawPath, resolvedPath)
  if (pathValidation.success === false) {
    throw new Error(pathValidation.error)
  }

  const stat = await fs.stat(resolvedPath)
  const fileValidation = validateRespondToUserImageFile({
    rawPath,
    resolvedPath,
    isFile: stat.isFile(),
    fileBytes: stat.size,
  })
  if (fileValidation.success === false) {
    throw new Error(fileValidation.error)
  }

  return { resolvedPath, fileBytes: stat.size }
}

async function resolveValidVideoPath(rawPath: string): Promise<{ resolvedPath: string; fileBytes: number }> {
  const resolvedPath = path.isAbsolute(rawPath)
    ? rawPath
    : path.resolve(process.cwd(), rawPath)

  const stat = await fs.stat(resolvedPath)
  const fileValidation = validateRespondToUserVideoFile({
    rawPath,
    resolvedPath,
    isFile: stat.isFile(),
    fileBytes: stat.size,
  })
  if (fileValidation.success === false) {
    throw new Error(fileValidation.error)
  }

  return { resolvedPath, fileBytes: stat.size }
}

// Tool execution handlers
type ToolHandler = (
  args: Record<string, unknown>,
  context: BuiltinToolContext
) => Promise<MCPToolResult>

const toolHandlers: Record<string, ToolHandler> = {
  list_running_agents: async (): Promise<MCPToolResult> => {
    const activeSessions = agentSessionTracker.getActiveSessions()
    const payload = buildListRunningAgentsPayload(activeSessions)

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(payload, null, 2),
        },
      ],
      isError: false,
    }
  },

  send_agent_message: async (args: Record<string, unknown>): Promise<MCPToolResult> => {
    const parsedArgs = parseSendAgentMessageArgs(args)
    if (parsedArgs.success === false) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: false,
              error: parsedArgs.error,
            }),
          },
        ],
        isError: true,
      }
    }

    const { sessionId, message } = parsedArgs

    // Get target session
    const session = agentSessionTracker.getSession(sessionId)
    if (!session) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(buildAgentSessionNotFoundPayload(sessionId)),
          },
        ],
        isError: true,
      }
    }

    // Must have a conversation to queue message
    if (!session.conversationId) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(buildAgentSessionMissingConversationPayload()),
          },
        ],
        isError: true,
      }
    }

    // Queue message for the target agent's conversation
    const queuedMessage = messageQueueService.enqueue(session.conversationId, message)

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(buildSendAgentMessageQueuedPayload({
            sessionId,
            conversationId: session.conversationId,
            queuedMessageId: queuedMessage.id,
            conversationTitle: session.conversationTitle,
          }), null, 2),
        },
      ],
      isError: false,
    }
  },

  kill_agent: async (args: Record<string, unknown>): Promise<MCPToolResult> => {
    const sessionId = args.sessionId as string | undefined

    if (sessionId) {
      // Kill specific session
      const session = agentSessionTracker.getSession(sessionId)
      if (!session) {
        return {
          content: [{ type: "text", text: JSON.stringify(buildAgentSessionNotFoundPayload(sessionId)) }],
          isError: true,
        }
      }
      agentSessionStateManager.stopSession(sessionId)
      toolApprovalManager.cancelSessionApprovals(sessionId)
      agentSessionTracker.stopSession(sessionId)
      return {
        content: [{ type: "text", text: JSON.stringify(buildKillAgentSessionPayload({ sessionId, conversationTitle: session.conversationTitle }), null, 2) }],
        isError: false,
      }
    }

    // Kill all agents
    const activeSessions = agentSessionTracker.getActiveSessions()
    if (activeSessions.length === 0) {
      return {
        content: [{ type: "text", text: JSON.stringify(buildKillAllAgentsNoopPayload(), null, 2) }],
        isError: false,
      }
    }
    toolApprovalManager.cancelAllApprovals()
    const { before, after } = await emergencyStopAll()
    return {
      content: [{ type: "text", text: JSON.stringify(buildKillAllAgentsPayload({
        sessionsTerminated: activeSessions.length,
        processesBefore: before,
        processesAfter: after,
      }), null, 2) }],
      isError: false,
    }
  },

  respond_to_user: async (args: Record<string, unknown>, context: BuiltinToolContext): Promise<MCPToolResult> => {
    if (!context.sessionId) {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: "respond_to_user requires an active agent session" }) }],
        isError: true,
      }
    }

    const parsedArgs = parseRespondToUserArgs(args)
    if (parsedArgs.success === false) {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: parsedArgs.error }) }],
        isError: true,
      }
    }

    const mappedAppSessionId = getRootAppSessionForAcpSession(context.sessionId)
    const trackedSessionId = mappedAppSessionId ?? context.sessionId

    // Guard: don't store the response if the session was already stopped/cancelled.
    // This prevents zombie sessions from reappearing after the user stops them.
    const activeSession = agentSessionTracker.getSession(trackedSessionId)
    if (!activeSession) {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: "Session is no longer active (was stopped or completed)" }) }],
        isError: true,
      }
    }

    const conversationId = activeSession.conversationId
    if ((parsedArgs.imageInputs.length > 0 || parsedArgs.videoInputs.length > 0) && !conversationId) {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: "Media assets require an active conversation" }) }],
        isError: true,
      }
    }

    const materializedResponse = await materializeParsedRespondToUserResponse(parsedArgs, {
      storeDataImageUrlAsAsset: (url) =>
        conversationService.storeDataImageUrlAsConversationAsset(conversationId!, url),
      resolveImagePath: resolveValidImagePath,
      storeImagePathAsAsset: (resolvedPath) =>
        conversationService.storeImagePathAsConversationAsset(conversationId!, resolvedPath),
      resolveVideoPath: resolveValidVideoPath,
      storeVideoPathAsAsset: (resolvedPath) =>
        conversationService.storeVideoPathAsConversationAsset(conversationId!, resolvedPath),
    })

    if (materializedResponse.success === false) {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: materializedResponse.error }) }],
        isError: true,
      }
    }

    appendSessionUserResponse({
      sessionId: trackedSessionId,
      runId: agentSessionStateManager.getSessionRunId(trackedSessionId),
      text: materializedResponse.responseContent,
    })

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: true,
            message: "Response recorded for delivery to user.",
            textLength: parsedArgs.text.length,
            responseContentLength: materializedResponse.responseContent.length,
            responseContentBytes: materializedResponse.responseContentBytes,
            imageCount: materializedResponse.imageCount,
            videoCount: materializedResponse.videoCount,
            localImageCount: materializedResponse.localImageCount,
            localVideoCount: materializedResponse.localVideoCount,
            embeddedImageBytes: materializedResponse.embeddedImageBytes,
            localVideoBytes: materializedResponse.localVideoBytes,
          }, null, 2),
        },
      ],
      isError: false,
    }
  },

  set_session_title: async (args: Record<string, unknown>, context: BuiltinToolContext): Promise<MCPToolResult> => {
    if (!context.sessionId) {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: "set_session_title requires an active agent session" }) }],
        isError: true,
      }
    }

    const parsedArgs = parseSetSessionTitleArgs(args)
    if (parsedArgs.success === false) {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: parsedArgs.error }) }],
        isError: true,
      }
    }

    const mappedAppSessionId = getRootAppSessionForAcpSession(context.sessionId)
    const trackedSessionId = mappedAppSessionId ?? context.sessionId
    const session = agentSessionTracker.getSession(trackedSessionId)
    if (!session?.conversationId) {
      return {
        content: [{ type: "text", text: JSON.stringify(buildSetSessionTitleMissingConversationPayload()) }],
        isError: true,
      }
    }

    const updatedConversation = await conversationService.renameConversationTitle(
      session.conversationId,
      parsedArgs.title,
    )

    if (!updatedConversation) {
      return {
        content: [{ type: "text", text: JSON.stringify(buildSetSessionTitleRenameFailedPayload()) }],
        isError: true,
      }
    }

    agentSessionTracker.updateSession(trackedSessionId, {
      conversationTitle: updatedConversation.title,
    })

    if (mappedAppSessionId) {
      setAcpSessionTitleOverride(context.sessionId, updatedConversation.title)
      const parentSessionId = mappedAppSessionId
      const runId = agentSessionStateManager.getSessionRunId(trackedSessionId)

      await emitAgentProgress(buildSetSessionTitleProgressUpdate({
        sessionId: context.sessionId,
        parentSessionId,
        runId,
        conversationTitle: updatedConversation.title,
        sessionStatus: session.status,
      }))
    }

    return {
      content: [{ type: "text", text: JSON.stringify(buildSetSessionTitlePayload(updatedConversation.title), null, 2) }],
      isError: false,
    }
  },

  mark_work_complete: async (args: Record<string, unknown>): Promise<MCPToolResult> => {
    const payload = buildMarkWorkCompletePayload(args)

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(payload, null, 2),
        },
      ],
      isError: payload.success === false,
    }
  },

  execute_command: async (args: Record<string, unknown>, context: BuiltinToolContext): Promise<MCPToolResult> => {
    const { skillsService } = await import("./skills-service")

    const parsedArgs = parseExecuteCommandArgs(args)
    if (parsedArgs.success === false) {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: parsedArgs.error }) }],
        isError: true,
      }
    }

    const { command, skillId, timeout } = parsedArgs

    // Determine the working directory
    let cwd: string | undefined
    let skillName: string | undefined
    let ignoredInvalidSkillIdWarning: ReturnType<typeof buildIgnoredExecuteCommandSkillIdWarning> | undefined

    if (skillId) {
      // Pick up skills added or edited directly in .agents/skills while the app
      // process is still running.
      skillsService.refreshFromDisk()

      // Find the skill and get its directory. Prefer exact IDs, but also accept
      // the canonical .agents/skills/<id>/ folder ID for imported skills whose
      // frontmatter id/name drifted from the on-disk folder.
      let skill = resolveRuntimeSkill(skillId, skillsService)
      if (!skill) {
        const availableSkillIds = skillsService
          .getSkills()
          .map((skill) => skill.id)
          .filter((id): id is string => typeof id === "string" && id.trim().length > 0)
        ignoredInvalidSkillIdWarning = buildIgnoredExecuteCommandSkillIdWarning(skillId, availableSkillIds)
      } else {

        if (!(await isSkillEnabledForRuntimeContext(getSkillRuntimeIds(skill, skillId), context))) {
          return disabledSkillToolResult(skillId, "execute")
        }

        if (!skill.filePath) {
          return {
            content: [{ type: "text", text: JSON.stringify({ success: false, error: `Skill has no file path (not imported from disk): ${skill.name}` }) }],
            isError: true,
          }
        }

        // For local files, use the directory containing SKILL.md
        // For GitHub skills, automatically upgrade to local clone
        if (skill.filePath.startsWith("github:")) {
          try {
            // Dynamically import skills-service to avoid circular dependency
            const { skillsService: skillsSvc } = await import("./skills-service")
            skill = await skillsSvc.upgradeGitHubSkillToLocal(skill.id)
          } catch (upgradeError) {
            return {
              content: [{ type: "text", text: JSON.stringify({ success: false, error: `Failed to upgrade GitHub skill to local: ${upgradeError instanceof Error ? upgradeError.message : String(upgradeError)}` }) }],
              isError: true,
            }
          }
        }

        cwd = path.dirname(skill.filePath!)
        skillName = skill.name
      }
    }

    const effectiveCwd = cwd || process.cwd()
    const normalizedCommandResult = await normalizeExecuteCommandWorkspacePaths(command, effectiveCwd, pathExists)
    const effectiveCommand = normalizedCommandResult.command
    const preferredPackageManager = await detectPreferredPackageManager(effectiveCwd, {
      resolve: path.resolve,
      join: path.join,
      dirname: path.dirname,
    }, pathExists)
    const packageManagerMismatch = detectPackageManagerMismatch(
      effectiveCommand,
      preferredPackageManager
        ? {
          name: preferredPackageManager.name,
          lockfile: preferredPackageManager.lockfile,
          packageManagerLockfile: path.join(preferredPackageManager.directory, preferredPackageManager.lockfile),
        }
        : null,
    )

    if (packageManagerMismatch) {
      const payload = buildRuntimeCommandPolicyBlockPayload({
        command: effectiveCommand,
        originalCommand: command,
        cwd: effectiveCwd,
        skillName,
        ignoredInvalidSkillIdWarning,
        normalizedPaths: normalizedCommandResult.normalizedPaths,
      }, packageManagerMismatch)

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(payload, null, 2),
          },
        ],
        isError: true,
      }
    }

    const latestUserMessage = await getLatestUserMessageForSession(context.sessionId)
    const contextGatheringCommandBlock = detectContextGatheringCommandBlock(effectiveCommand, latestUserMessage)

    if (contextGatheringCommandBlock) {
      const payload = buildRuntimeCommandPolicyBlockPayload({
        command: effectiveCommand,
        originalCommand: command,
        cwd: effectiveCwd,
        skillName,
        ignoredInvalidSkillIdWarning,
        normalizedPaths: normalizedCommandResult.normalizedPaths,
      }, contextGatheringCommandBlock)

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(payload, null, 2),
          },
        ],
        isError: true,
      }
    }

    try {
      const execOptions: { cwd?: string; timeout?: number; maxBuffer?: number; shell?: string } = {
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large outputs
        shell: process.platform === "win32" ? "cmd.exe" : "/bin/bash",
      }

      if (cwd) {
        execOptions.cwd = cwd
      }

      if (timeout > 0) {
        execOptions.timeout = timeout
      }

      const { stdout, stderr } = await execAsync(effectiveCommand, execOptions)

      const truncatedStdout = truncateRuntimeCommandOutput(stdout || "")
      const payload = buildRuntimeCommandSuccessPayload({
        command: effectiveCommand,
        originalCommand: command,
        cwd: effectiveCwd,
        skillName,
        ignoredInvalidSkillIdWarning,
        normalizedPaths: normalizedCommandResult.normalizedPaths,
        stdout: truncatedStdout.output,
        stderr,
        outputTruncated: truncatedStdout.outputTruncated,
      })

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(payload, null, 2),
          },
        ],
        isError: false,
      }
    } catch (error: any) {
      // exec errors include stdout/stderr in the error object
      let stdout = error.stdout || ""
      const stderr = error.stderr || ""
      const errorMessage = error.message || String(error)
      const exitCode = error.code

      const truncatedStdout = truncateRuntimeCommandOutput(stdout, { errorOutput: true })
      stdout = truncatedStdout.output
      const payload = buildRuntimeCommandFailurePayload({
        command: effectiveCommand,
        originalCommand: command,
        cwd: effectiveCwd,
        skillName,
        ignoredInvalidSkillIdWarning,
        normalizedPaths: normalizedCommandResult.normalizedPaths,
        errorMessage,
        exitCode,
        stdout,
        stderr,
      })

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(payload, null, 2),
          },
        ],
        isError: true,
      }
    }
  },

  list_server_tools: async (args: Record<string, unknown>): Promise<MCPToolResult> => {
    const result = buildListServerToolsPayload(
      args,
      mcpService.getAvailableTools(),
      mcpService.getServerStatus(),
    )

    return {
      content: [{
        type: "text",
        text: JSON.stringify(result.payload, null, 2),
      }],
      isError: result.isError,
    }
  },

  get_tool_schema: async (args: Record<string, unknown>): Promise<MCPToolResult> => {
    const result = buildGetToolSchemaPayload(args, mcpService.getAvailableTools())

    return {
      content: [{
        type: "text",
        text: JSON.stringify(result.payload, null, 2),
      }],
      isError: result.isError,
    }
  },

  load_skill_instructions: async (args: Record<string, unknown>, context: BuiltinToolContext): Promise<MCPToolResult> => {
    const parsedArgs = parseRuntimeSkillIdArg(args)
    if (parsedArgs.success === false) {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: parsedArgs.error }) }],
        isError: true,
      }
    }

    const skillId = parsedArgs.skillId
    const { skillsService } = await import("./skills-service")
    // Pick up skills added or edited directly in .agents/skills while the app
    // process is still running.
    skillsService.refreshFromDisk()
    const skill = resolveRuntimeSkill(skillId, skillsService)

    if (!skill) {

      return {
        content: [{
          type: "text",
          text: JSON.stringify(buildRuntimeSkillNotFoundPayload(skillId)),
        }],
        isError: true,
      }
    }

    if (!(await isSkillEnabledForRuntimeContext(getSkillRuntimeIds(skill, skillId), context))) {
      return disabledSkillToolResult(skillId, "load")
    }

    return {
      content: [{
        type: "text",
        text: buildRuntimeSkillInstructionsText(skill),
      }],
      isError: false,
    }
  },

  read_more_context: async (args: Record<string, unknown>, context: BuiltinToolContext): Promise<MCPToolResult> => {
    if (!context.sessionId) {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: "read_more_context requires an active agent session" }) }],
        isError: true,
      }
    }

    const parsedArgs = parseReadMoreContextArgs(args)
    if (parsedArgs.success === false) {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: parsedArgs.error }) }],
        isError: true,
      }
    }

    const result = readMoreContext(context.sessionId, parsedArgs.contextRef, parsedArgs.options)

    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      isError: result.success === false,
    }
  },

}

/**
 * Execute a runtime tool by name.
 * @param toolName The tool name (for example, "respond_to_user")
 * @param args The tool arguments
 * @param sessionId Optional session ID for ACP router tools
 * @returns The tool result
 */
export async function executeRuntimeTool(
  toolName: string,
  args: Record<string, unknown>,
  sessionId?: string
): Promise<MCPToolResult | null> {
  // Check for ACP router tools first
  if (isACPRouterTool(toolName)) {
    const result = await executeACPRouterTool(toolName, args, sessionId)
    return {
      content: [{ type: "text", text: result.content }],
      isError: result.isError
    }
  }

  const actualToolName = toolName

  // Find and execute the handler
  const handler = toolHandlers[actualToolName]
  if (!handler) {
    return null
  }

  try {
    return await handler(args, { sessionId })
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error executing runtime tool: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    }
  }
}

/**
 * Check if a tool name is a DotAgents runtime tool.
 */
export function isRuntimeTool(toolName: string): boolean {
  // Check ACP router tools
  if (isACPRouterTool(toolName)) return true
  // Check if it's in our handler map (plain name match)
  if (toolName in toolHandlers) return true
  return false
}
