/**
 * Built-in tools for ACP agent routing/delegation.
 * These tools allow the main agent to discover, spawn, delegate to, and manage sub-agents.
 */

import { acpRouterToolDefinitions, resolveToolName } from './acp-router-tool-definitions';
import type {
  ACPRunResult,
  ACPSubAgentState,
} from './types';
import { acpBackgroundNotifier } from './acp-background-notifier';
import { configStore } from '../config';
import { acpService, ACPContentBlock, ACPToolCallUpdate } from '../acp-service';
import { buildProfileContext, getPreferredDelegationOutput } from '../agent-run-utils';
import { emitAgentProgress } from '../emit-agent-progress';
import { agentSessionStateManager } from '../state';
import type { ACPDelegationProgress, ACPSubAgentMessage } from '@dotagents/shared/agent-progress';
import type { LegacyAcpAgentConfig } from '@dotagents/shared/agent-profile-legacy-converters';
import type { AgentProfile } from '@dotagents/core';
import { RESPOND_TO_USER_TOOL } from '@dotagents/shared/chat-utils';
import { extractRespondToUserContentFromArgs } from '../respond-to-user-utils';
import {
  runInternalSubSession,
  cancelSubSession,
  getInternalAgentInfo,
  getSessionDepth,
  generateSubSessionId,
} from './internal-agent';
import { agentProfileService } from '../agent-profile-service';
import { getDelegationAcpxSessionName } from '../acp-session-state';
import { clearAcpToAppSessionMapping, setAcpToAppSessionMapping } from '../acp-session-state';

// ============================================================================
// Consolidated Delegation State
// ============================================================================

/**
 * Extended state for tracking delegated runs.
 * Consolidates ACPSubAgentState with conversation history and emit timing.
 */
interface DelegatedRun extends ACPSubAgentState {
  /** Conversation messages for this run */
  conversation: ACPSubAgentMessage[];
  /** Last time we emitted a progress update to the UI (for rate limiting) */
  lastEmitTime: number;
  /** Number of explicit check_agent_status calls served for this run */
  statusCheckCount: number;
}

/**
 * Generate a unique run ID for tracking delegated runs.
 */
function generateDelegationRunId(): string {
  const random = Math.random().toString(36).substring(2, 10);
  return `acp_delegation_${Date.now()}_${random}`;
}

/**
 * Cleanup per-run mapping state so stale entries don't leak or misroute future session updates.
 *
 * Note: deletion is conditional to avoid clobbering mappings for a newer run that may have
 * already replaced the agentName/session mapping.
 */
function cleanupDelegationMappings(runId: string, agentName: string): void {
  // Remove runId from the agentName → runIds set
  const activeRunIds = agentNameToActiveRunIds.get(agentName);
  if (activeRunIds) {
    activeRunIds.delete(runId);
    // Clean up empty sets to prevent memory accumulation
    if (activeRunIds.size === 0) {
      agentNameToActiveRunIds.delete(agentName);
    }
  }

  // Remove any sessionId → runId mappings pointing at this run.
  for (const [sessionId, mappedRunId] of sessionToRunId.entries()) {
    if (mappedRunId === runId) {
      sessionToRunId.delete(sessionId);
      clearAcpToAppSessionMapping(sessionId);
    }
  }
}

// ============================================================================
// Shared Delegation Helpers
// ============================================================================

/** Arguments for creating a sub-agent state */
interface CreateSubAgentStateArgs {
  agentName: string;
  task: string;
  parentSessionId: string;
  workingDirectory?: string;
  isInternal?: boolean;
  connectionType?: 'internal' | 'acpx' | 'remote';
  isAsync?: boolean;
}

/**
 * Create and register a new sub-agent state for tracking delegated runs.
 * Initializes conversation with the user's task message.
 */
function createSubAgentState(args: CreateSubAgentStateArgs): DelegatedRun {
  const runId = generateDelegationRunId();
  const now = Date.now();
  const userMessage: ACPSubAgentMessage = {
    role: 'user',
    content: args.task,
    timestamp: now,
  };
  const delegatedRun: DelegatedRun = {
    runId,
    agentName: args.agentName,
    connectionType: args.connectionType,
    parentSessionId: args.parentSessionId,
    parentRunId: agentSessionStateManager.getSessionRunId(args.parentSessionId),
    task: args.task,
    workingDirectory: args.workingDirectory,
    status: 'pending',
    startTime: now,
    isInternal: args.isInternal,
    isAsync: args.isAsync,
    conversation: [userMessage],
    lastEmitTime: 0,
    statusCheckCount: 0,
  };
  delegatedRuns.set(runId, delegatedRun);
  return delegatedRun;
}

/**
 * Result type for delegation operations.
 */
interface DelegationResult {
  success: boolean;
  runId: string;
  agentName: string;
  status: 'completed' | 'failed' | 'running' | 'cancelled';
  output?: string;
  error?: string;
  duration?: number;
  conversation?: ACPSubAgentMessage[];
  message?: string;
  note?: string;
}

/**
 * Create a completed delegation result.
 */
function createCompletedResult(
  subAgentState: DelegatedRun,
  output: string,
  conversation: ACPSubAgentMessage[]
): DelegationResult {
  subAgentState.status = 'completed';
  const resolvedOutput = getPreferredDelegationOutput(output, conversation);
  const endTime = Date.now();
  subAgentState.result = {
    runId: subAgentState.runId,
    agentName: subAgentState.agentName,
    status: 'completed',
    startTime: subAgentState.startTime,
    endTime,
    metadata: { duration: endTime - subAgentState.startTime },
    output: [{ role: 'assistant', parts: [{ content: resolvedOutput }] }],
  };
  return {
    success: true,
    runId: subAgentState.runId,
    agentName: subAgentState.agentName,
    status: 'completed',
    output: resolvedOutput,
    duration: endTime - subAgentState.startTime,
    conversation,
  };
}

/**
 * Create a failed delegation result.
 */
function createFailedResult(
  subAgentState: DelegatedRun,
  error: string,
  conversation?: ACPSubAgentMessage[]
): DelegationResult {
  subAgentState.status = 'failed';
  const endTime = Date.now();
  subAgentState.result = {
    runId: subAgentState.runId,
    agentName: subAgentState.agentName,
    status: 'failed',
    startTime: subAgentState.startTime,
    endTime,
    metadata: { duration: endTime - subAgentState.startTime },
    error,
  };
  return {
    success: false,
    runId: subAgentState.runId,
    agentName: subAgentState.agentName,
    status: 'failed',
    error,
    duration: endTime - subAgentState.startTime,
    conversation,
  };
}

/**
 * Create an async running delegation result (for waitForResult=false).
 */
function createRunningResult(subAgentState: DelegatedRun): DelegationResult {
  return {
    success: true,
    runId: subAgentState.runId,
    agentName: subAgentState.agentName,
    status: 'running',
    message: `Task delegated to "${subAgentState.agentName}". Use check_agent_status with runId "${subAgentState.runId}" to check progress.`,
  };
}

function normalizeDelegatedToolName(toolName?: string): string | undefined {
  if (typeof toolName !== 'string') return undefined;

  const normalized = toolName
    .trim()
    .toLowerCase()
    .replace(/^tool:\s*/i, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  return normalized.length > 0 ? normalized : undefined;
}

function formatDelegatedToolCallName(toolCall: ACPToolCallUpdate): string {
  const title = toolCall.title?.trim();
  return normalizeDelegatedToolName(title) || title || 'tool_call';
}

function maybeTrackRespondToUserToolCall(
  conversation: ACPSubAgentMessage[],
  toolCall: ACPToolCallUpdate,
  timestamp: number,
): void {
  if (toolCall.status === 'failed') return;

  const toolName = formatDelegatedToolCallName(toolCall);
  if (toolName !== RESPOND_TO_USER_TOOL) return;

  const content = extractRespondToUserContentFromArgs(toolCall.rawInput);
  if (!content) return;

  const lastMessage = conversation[conversation.length - 1];
  if (
    lastMessage?.role === 'tool'
    && lastMessage.toolName === toolName
    && lastMessage.content === content
  ) {
    return;
  }

  conversation.push({
    role: 'tool',
    toolName,
    toolInput: toolCall.rawInput,
    content,
    timestamp,
  });
}

/**
 * Register agent name to run ID mapping for session update fallback.
 */
function registerAgentRunMapping(agentName: string, runId: string): void {
  let activeRunIds = agentNameToActiveRunIds.get(agentName);
  if (!activeRunIds) {
    activeRunIds = new Set();
    agentNameToActiveRunIds.set(agentName, activeRunIds);
  }
  activeRunIds.add(runId);
}

/**
 * Track delegated sub-agent runs for status checking.
 * Consolidates run state, conversation history, and emit timing.
 */
const delegatedRuns: Map<string, DelegatedRun> = new Map();

/** Map from agent session IDs to our delegation run IDs (needed for stdio agent session mapping) */
const sessionToRunId: Map<string, string> = new Map();

/**
 * Map from agent names to their currently active run IDs (for session mapping fallback).
 * Uses a Set to support parallel delegations to the same agent.
 */
const agentNameToActiveRunIds: Map<string, Set<string>> = new Map();

// ============================================================================
// Streaming Safeguards Configuration
// ============================================================================

/** Minimum interval between UI updates per run (ms) */
const MIN_EMIT_INTERVAL_MS = 100;

/** Maximum number of messages to keep in conversation history */
const MAX_CONVERSATION_MESSAGES = 100;

/** Maximum size of a single message content (characters) */
const MAX_MESSAGE_CONTENT_SIZE = 10000;

/** Maximum total conversation size to send to UI (characters) */
const MAX_CONVERSATION_SIZE_FOR_UI = 50000;

// Initialize background notifier with our delegated runs map
acpBackgroundNotifier.setDelegatedRunsMap(delegatedRuns);

/**
 * Truncate content to max size, adding ellipsis if truncated
 */
function truncateContent(content: string, maxSize: number): string {
  if (content.length <= maxSize) return content;
  return content.substring(0, maxSize - 3) + '...';
}

/**
 * Hard-cap content without appending ellipsis.
 * Keeps prefix checks stable for stream merge (delta vs cumulative snapshot detection).
 */
function capContent(content: string, maxSize: number): string {
  if (content.length <= maxSize) return content;
  return content.substring(0, maxSize);
}

/**
 * Safely stringify a value to JSON, catching errors from circular structures or BigInt.
 * Returns a fallback string if serialization fails.
 */
function safeJsonStringify(value: unknown, indent?: number): string {
  try {
    return JSON.stringify(value, null, indent);
  } catch {
    // Handle circular references, BigInt, or other non-serializable values
    return '[Unable to serialize value]';
  }
}

/**
 * Merge streaming assistant text into the latest assistant message.
 *
 * ACP agents may emit either token deltas ("he" + "llo") or cumulative snapshots
 * ("he" then "hello"). This helper handles both to avoid one-message-per-token UI spam.
 */
function mergeAssistantStreamText(
  conversation: ACPSubAgentMessage[],
  text: string,
  timestamp: number
): void {
  if (!text) return;

  const normalizedText = capContent(text, MAX_MESSAGE_CONTENT_SIZE);
  const lastMessage = conversation[conversation.length - 1];

  if (lastMessage?.role === 'assistant' && !lastMessage.toolName) {
    const previous = lastMessage.content || '';

    if (normalizedText === previous) {
      return;
    }

    if (normalizedText.startsWith(previous)) {
      // Cumulative snapshot update: replace with the fuller content.
      lastMessage.content = normalizedText;
      lastMessage.timestamp = timestamp;
      return;
    }

    if (previous.startsWith(normalizedText)) {
      // Older/stale partial chunk arrived after a newer one; ignore it.
      return;
    }

    // Delta chunk: append.
    const merged = capContent(previous + normalizedText, MAX_MESSAGE_CONTENT_SIZE);
    if (merged === previous) {
      return;
    }
    lastMessage.content = merged;
    lastMessage.timestamp = timestamp;
    return;
  }

  conversation.push({
    role: 'assistant',
    content: normalizedText,
    timestamp,
  });
}

/**
 * Prepare conversation for UI transmission with size limits
 */
function prepareConversationForUI(conversation: ACPSubAgentMessage[]): ACPSubAgentMessage[] {
  // Take only the last N messages
  const recentMessages = conversation.slice(-MAX_CONVERSATION_MESSAGES);

  // Calculate total size and truncate if needed
  let totalSize = 0;
  const result: ACPSubAgentMessage[] = [];

  // Process from end to start to keep most recent messages
  for (let i = recentMessages.length - 1; i >= 0; i--) {
    const msg = recentMessages[i];
    const truncatedContent = truncateContent(msg.content, MAX_MESSAGE_CONTENT_SIZE);
    const msgSize = truncatedContent.length;

    if (totalSize + msgSize > MAX_CONVERSATION_SIZE_FOR_UI) {
      // Add a truncation notice at the start
      result.unshift({
        role: 'assistant',
        content: `[${i + 1} earlier messages truncated for display]`,
        timestamp: msg.timestamp,
      });
      break;
    }

    totalSize += msgSize;
    result.unshift({
      ...msg,
      content: truncatedContent,
    });
  }

  return result;
}

/**
 * Listen to session updates from ACP service and forward to UI
 */
acpService.on('sessionUpdate', (event: {
  agentName: string;
  sessionId: string;
  content?: ACPContentBlock[];
  toolCall?: ACPToolCallUpdate;
  isComplete?: boolean;
  stopReason?: string;
  totalBlocks: number;
}) => {
  const { agentName, sessionId, content, toolCall, isComplete, stopReason } = event;

  // Find the run ID for this session
  const mappedRunId = sessionToRunId.get(sessionId);
  let runId = mappedRunId;

  // If no session mapping exists, try to find by agent name (fallback for race condition)
  // Note: With parallel delegations, we pick one of the active runs. This is best-effort
  // since we can't determine which run a session belongs to without the session ID mapping.
  if (!runId) {
    const activeRunIds = agentNameToActiveRunIds.get(agentName);
    const activeRunId = activeRunIds?.values().next().value;
    if (activeRunId) {
      // Establish the session mapping now that we have both IDs
      sessionToRunId.set(sessionId, activeRunId);
      runId = activeRunId;
    } else {
      return;
    }
  }

  let subAgentState = delegatedRuns.get(runId);
  if (!subAgentState) {
    // If we got a runId from session mapping but can't find state, the mapping is stale.
    // Clean it up and retry via agent-name fallback (fixes misrouting/dropping later updates).
    if (mappedRunId) {
      sessionToRunId.delete(sessionId);
      // Remove the stale runId from the agent's active runs set
      const activeRunIds = agentNameToActiveRunIds.get(agentName);
      if (activeRunIds) {
        activeRunIds.delete(mappedRunId);
        if (activeRunIds.size === 0) {
          agentNameToActiveRunIds.delete(agentName);
        }
      }

      // Try to find another active run for this agent
      const remainingRunIds = agentNameToActiveRunIds.get(agentName);
      const activeRunId = remainingRunIds?.values().next().value;
      if (!activeRunId) {
        return;
      }

      sessionToRunId.set(sessionId, activeRunId);
      runId = activeRunId;
      subAgentState = delegatedRuns.get(runId);
      if (!subAgentState) {
        return;
      }
    } else {
      return;
    }
  }

  // Use conversation from consolidated state
  const conversation = subAgentState.conversation;

  // Convert content blocks to conversation messages with size limits
  if (content && Array.isArray(content)) {
    for (const block of content) {
      const now = Date.now();
      const message: ACPSubAgentMessage = {
        role: 'assistant',
        content: '',
        timestamp: now,
      };

      if (block.type === 'text' && block.text) {
        mergeAssistantStreamText(conversation, block.text, now);
      } else if (block.type === 'tool_use' && block.name) {
        message.role = 'tool';
        message.toolName = block.name;
        message.toolInput = block.input;
        message.content = `Using tool: ${block.name}`;
        if (block.input) {
          message.content += `\nInput: ${truncateContent(safeJsonStringify(block.input, 2), 500)}`;
        }
        conversation.push(message);
      } else if (block.type === 'tool_result') {
        message.role = 'tool';
        const resultStr = typeof block.result === 'string' ? block.result : safeJsonStringify(block.result);
        message.content = `Tool result: ${truncateContent(resultStr, 500)}`;
        conversation.push(message);
      }
    }
  }

  if (toolCall) {
    maybeTrackRespondToUserToolCall(conversation, toolCall, Date.now());
  }

  // Enforce conversation size limit (keep most recent messages)
  if (conversation.length > MAX_CONVERSATION_MESSAGES * 2) {
    subAgentState.conversation = conversation.slice(-MAX_CONVERSATION_MESSAGES);
  }

  // Rate limiting: skip emit if we recently emitted (unless complete)
  const now = Date.now();
  if (!isComplete && now - subAgentState.lastEmitTime < MIN_EMIT_INTERVAL_MS) {
    return;
  }
  subAgentState.lastEmitTime = now;

  // Build delegation progress with size-limited conversation
  const delegationProgress: ACPDelegationProgress = {
    runId: subAgentState.runId,
    agentName: subAgentState.agentName,
    connectionType: subAgentState.connectionType,
    task: subAgentState.task,
    status: isComplete ? 'completed' : 'running',
    startTime: subAgentState.startTime,
    endTime: isComplete ? Date.now() : undefined,
    progressMessage: stopReason ? `Stop reason: ${stopReason}` : undefined,
    acpSessionId: subAgentState.acpSessionId,
    subSessionId: subAgentState.subSessionId,
    conversationId: subAgentState.conversationId,
    acpRunId: subAgentState.acpRunId,
    conversation: prepareConversationForUI(subAgentState.conversation),
  };

  // Emit progress update to UI
  // IMPORTANT: isComplete is always false because this is a delegation progress update,
  // not a completion of the parent session. The parent session continues running after
  // the delegation completes. Setting isComplete: true here would incorrectly mark the
  // parent session as done in the UI while the main agent is still processing.
  emitAgentProgress({
    sessionId: subAgentState.parentSessionId,
    runId: subAgentState.parentRunId ?? agentSessionStateManager.getSessionRunId(subAgentState.parentSessionId),
    currentIteration: 0,
    maxIterations: 1,
    isComplete: false,
    steps: [
      {
        id: `delegation-${runId}`,
        type: 'completion',
        title: `Sub-agent: ${agentName}`,
        description: subAgentState.task,
        status: isComplete ? 'completed' : 'in_progress',
        timestamp: Date.now(),
        delegation: delegationProgress,
      },
    ],
  }).catch(() => {
    // Ignore emit errors
  });

  // Once the agent reports completion for this session, the mappings are no longer needed.
  // Clean them up to prevent leaks / stale fallbacks affecting future runs.
  if (isComplete) {
    void acpBackgroundNotifier.resumeParentSessionIfNeeded(subAgentState);
    cleanupDelegationMappings(runId, subAgentState.agentName);
  }
});

// Re-export tool definitions from the dependency-free module
export { acpRouterToolDefinitions } from './acp-router-tool-definitions';

// ============================================================================
// Handler Functions
// ============================================================================

/**
 * Get the internal agent config, merged with enabled state from user config if present.
 */
export function getInternalAgentConfig(): LegacyAcpAgentConfig {
  const internalInfo = getInternalAgentInfo();
  const config = configStore.get();

  // Check if user has explicitly disabled internal agent
  const userInternalConfig = config.acpAgents?.find(a => a.name === 'internal');
  const enabled = userInternalConfig?.enabled !== false; // Default to true

  return {
    name: internalInfo.name,
    displayName: internalInfo.displayName,
    description: internalInfo.description,
    enabled,
    isInternal: true,
    connection: { type: 'internal' },
  };
}

/**
 * List all available ACP agents, optionally filtered by capability.
 * Uses configStore for agent definitions and acpService for runtime status.
 * Includes the built-in internal agent alongside configured external agents.
 * Also includes enabled internal agent profiles as available agents for delegation.
 * @param args - Arguments containing optional capability filter
 * @returns Object with list of available agents
 */
export async function handleListAvailableAgents(args: {
  capability?: string;
}): Promise<object> {
  try {
    // Get all enabled agent targets from the unified agent profile service
    const agentTargets = agentProfileService.getEnabledAgentTargets();

    // Note: capability filter parameter is deprecated and ignored

    // Get runtime status from acpService (for external agents)
    const agentStatuses = acpService.getAgents();
    const statusMap = new Map(
      agentStatuses.map((a) => [a.config.name, { status: a.status, error: a.error }])
    );

    // Format agents for output
    const formattedAgents = agentTargets.map((agent) => {
      // Internal agents are always ready
      if (agent.connection.type === 'internal') {
        return {
          name: agent.name,
          displayName: agent.displayName,
          description: agent.description || '',
          connectionType: agent.connection.type,
          status: 'ready' as const,
          error: undefined,
          isInternal: true,
          isAgentProfile: true,
        };
      }

      // External agents (acp, stdio, remote) - check runtime status
      const runtime = statusMap.get(agent.name);
      return {
        name: agent.name,
        displayName: agent.displayName,
        description: agent.description || '',
        connectionType: agent.connection.type,
        status: runtime?.status || (agent.connection.type === 'remote' ? 'ready' : 'stopped'),
        error: runtime?.error,
        isInternal: false,
        isAgentProfile: true,
      };
    });

    const agentTargetNames = new Set(agentTargets.map((a) => a.name));

    // BACKWARD COMPATIBILITY: Also include legacy ACP agents from config
    const config = configStore.get();
    const legacyAcpAgents = (config.acpAgents || []).filter(
      (a) => a.name !== 'internal' && !agentTargetNames.has(a.name)
    );

    const formattedLegacyAcpAgents = legacyAcpAgents
      .filter((agent) => agent.enabled !== false)
      .map((agent) => {
        const runtime = statusMap.get(agent.name);
        return {
          name: agent.name,
          displayName: agent.displayName,
          description: agent.description || '',
          connectionType: agent.connection.type,
          status: runtime?.status || 'stopped',
          error: runtime?.error,
          isInternal: agent.connection.type === 'internal',
          isLegacy: true,
        };
      });

    // Combine all agents
    const allAgents = [
      ...formattedAgents,
      ...formattedLegacyAcpAgents,
    ];

    return {
      success: true,
      agents: allAgents,
      count: allAgents.length,
      filter: args.capability || null,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      agents: [],
      count: 0,
    };
  }
}

/**
 * Delegate a task to a specialized ACP agent (external or internal).
 * Uses the unified AgentProfile system for agent lookup and routing.
 * @param args - Arguments containing agent name, task, optional context, and wait preference
 * @param parentSessionId - Optional parent session ID for tracking
 * @returns Object with delegation result or run ID for async delegation
 */
export async function handleDelegateToAgent(
  args: {
    agentName: string;
    task?: string;
    context?: string;
    workingDirectory?: string;
    prepareOnly?: boolean;
    waitForResult?: boolean;
  },
  parentSessionId?: string
): Promise<object> {
  const normalizedAgentName = typeof args.agentName === 'string'
    ? args.agentName.trim()
    : '';
  const normalizedWorkingDirectory = args.workingDirectory?.trim() || undefined;
  const prepareOnly = args.prepareOnly === true;
  const hasTask = typeof args.task === 'string' && args.task.trim().length > 0;

  if (!normalizedAgentName) {
    return {
      success: false,
      error: 'Missing required parameter: agentName',
    };
  }

  if (!prepareOnly && !hasTask) {
    return {
      success: false,
      error: 'Missing required parameter: task must be provided unless prepareOnly is true',
    };
  }

  const normalizedArgs = {
    ...args,
    agentName: normalizedAgentName,
    task: hasTask
      ? args.task!.trim()
      : `Prepare agent "${normalizedAgentName}" for future delegated work.`,
    workingDirectory: normalizedWorkingDirectory,
    prepareOnly,
  };

  const waitForResult = args.waitForResult === true; // Default to async/background

  // Try unified agent profile lookup first
  const profile = agentProfileService.getByName(normalizedArgs.agentName);
  if (profile) {
    // Check if agent is enabled
    if (!profile.enabled) {
      return {
        success: false,
        error: `Agent "${normalizedArgs.agentName}" is currently disabled.`,
      };
    }

    // Route based on connection type using the unified profile
    return executeAgentProfileDelegation(profile, normalizedArgs, parentSessionId, waitForResult);
  }

  // BACKWARD COMPATIBILITY: Handle explicit 'internal' agent name
  if (normalizedArgs.agentName === 'internal') {
    return executeInternalAgent(normalizedArgs, parentSessionId, waitForResult);
  }

  // BACKWARD COMPATIBILITY: Fall back to legacy ACP agent lookup from config
  return executeACPAgent(normalizedArgs, parentSessionId, waitForResult);
}

/**
 * Execute delegation based on unified AgentProfile.
 * Routes to appropriate execution method based on connection type.
 */
async function executeAgentProfileDelegation(
  profile: AgentProfile,
  args: {
    agentName: string;
    task: string;
    context?: string;
    workingDirectory?: string;
    prepareOnly?: boolean;
  },
  parentSessionId: string | undefined,
  waitForResult: boolean
): Promise<object> {
  switch (profile.connection.type) {
    case 'internal':
      // Use internal agent with profile's config
      // Pass profile name so it can use the profile's configuration
      return executeInternalAgent(
        { ...args, agentProfileName: profile.name },
        parentSessionId,
        waitForResult
      );

    case 'acpx':
      // Add profile context (system prompt, guidelines) to the task context
      const profileContext = buildProfileContext({
        ...profile,
        disableDelegation: true,
      }, args.context);
      return executeACPAgent(
        { ...args, context: profileContext },
        parentSessionId,
        waitForResult
      );

    case 'remote':
      // Remote HTTP endpoint - add profile context
      const remoteContext = buildProfileContext({
        ...profile,
        disableDelegation: true,
      }, args.context);
      return executeACPAgent(
        { ...args, context: remoteContext },
        parentSessionId,
        waitForResult
      );

    default:
      return {
        success: false,
        error: `Unsupported connection type for agent "${profile.name}": ${profile.connection.type}`,
      };
  }
}

/**
 * Execute delegation to the internal agent.
 * Uses the internal sub-session system with unified tracking.
 * Can optionally run as a specific agent profile when agentProfileName is provided.
 */
async function executeInternalAgent(
  args: {
    task: string;
    context?: string;
    agentProfileName?: string;
    /** @deprecated Use agentProfileName instead. */
    personaName?: string;
    workingDirectory?: string;
    prepareOnly?: boolean;
  },
  parentSessionId: string | undefined,
  waitForResult: boolean
): Promise<object> {
  // Check if internal agent is enabled
  const internalConfig = getInternalAgentConfig();
  if (internalConfig.enabled === false) {
    return { success: false, error: 'Internal agent is disabled' };
  }

  // Use agent profile name for agent identification if provided, otherwise 'internal'
  const agentProfileName = args.agentProfileName ?? args.personaName;
  const agentName = agentProfileName || 'internal';

  if (args.prepareOnly) {
    return {
      success: true,
      prepared: true,
      agentName,
      status: 'ready',
      message: `Internal agent "${agentName}" is always available and does not require spawning.`,
      note: args.workingDirectory
        ? 'workingDirectory is ignored for internal agent delegation.'
        : undefined,
    };
  }

  if (!parentSessionId) {
    return { success: false, error: 'Parent session ID is required for internal agent delegation' };
  }

  // Create unified sub-agent state (conversation initialized automatically)
  const subAgentState = createSubAgentState({
    agentName,
    task: args.task,
    parentSessionId,
    workingDirectory: args.workingDirectory,
    isInternal: true,
    connectionType: 'internal',
    isAsync: !waitForResult,
  });
  subAgentState.status = 'running';

  // Pre-generate sub-session ID and store it BEFORE starting execution.
  // This enables cancel_agent_run to work for in-flight internal tasks.
  const preGeneratedSubSessionId = generateSubSessionId();
  subAgentState.subSessionId = preGeneratedSubSessionId;

  if (!waitForResult) {
    void Promise.resolve()
      .then(() => runInternalSubSession({
        task: args.task,
        context: args.context,
        parentSessionId,
        subSessionId: preGeneratedSubSessionId,
        agentProfileName,
      }))
      .then((result) => {
        subAgentState.conversationId = result.conversationId;
        subAgentState.conversation = result.conversationHistory.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
        }));

        if (result.success) {
          subAgentState.status = 'completed';
          subAgentState.result = {
            runId: subAgentState.runId,
            agentName,
            status: 'completed',
            startTime: subAgentState.startTime,
            endTime: Date.now(),
            metadata: { duration: result.duration },
            output: [{ role: 'assistant', parts: [{ content: result.result || '' }] }],
          };
        } else {
          subAgentState.status = result.error === 'Sub-session was cancelled' ? 'cancelled' : 'failed';
          subAgentState.result = {
            runId: subAgentState.runId,
            agentName,
            status: subAgentState.status,
            startTime: subAgentState.startTime,
            endTime: Date.now(),
            metadata: { duration: result.duration },
            error: result.error || 'Unknown error',
          };
        }

        void acpBackgroundNotifier.resumeParentSessionIfNeeded(subAgentState);
      })
      .catch((error) => {
        const endTime = Date.now();
        subAgentState.status = 'failed';
        subAgentState.result = {
          runId: subAgentState.runId,
          agentName,
          status: 'failed',
          startTime: subAgentState.startTime,
          endTime,
          metadata: { duration: endTime - subAgentState.startTime },
          error: error instanceof Error ? error.message : String(error),
        };
        void acpBackgroundNotifier.resumeParentSessionIfNeeded(subAgentState);
      });

    return createRunningResult(subAgentState);
  }

  try {
    const result = await runInternalSubSession({
      task: args.task,
      context: args.context,
      parentSessionId,
      subSessionId: preGeneratedSubSessionId,
      agentProfileName,
    });

    subAgentState.conversationId = result.conversationId;

    // Update conversation history in consolidated state
    subAgentState.conversation = result.conversationHistory.map(msg => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp,
    }));

    if (result.success) {
      return createCompletedResult(subAgentState, result.result || '', subAgentState.conversation);
    } else {
      return createFailedResult(subAgentState, result.error || 'Unknown error', subAgentState.conversation);
    }
  } catch (error) {
    return createFailedResult(subAgentState, error instanceof Error ? error.message : String(error));
  }
}

/**
 * Normalized agent configuration used by ACP delegation/spawn/stop handlers.
 * Prefers unified AgentProfile data, with legacy config fallback.
 */
interface ResolvedAcpAgentConfig {
  source: 'profile' | 'legacy';
  name: string;
  enabled: boolean;
  connectionType: 'acpx' | 'remote' | 'internal';
  baseUrl?: string;
}

/**
 * Resolve an ACP-capable agent by name from AgentProfile first, then legacy config.
 */
function resolveAcpAgentConfig(agentName: string): ResolvedAcpAgentConfig | null {
  const profile = agentProfileService.getByName(agentName);
  if (profile) {
    return {
      source: 'profile',
      name: profile.name,
      enabled: profile.enabled !== false,
      connectionType: profile.connection.type === 'remote'
        ? 'remote'
        : profile.connection.type === 'internal'
          ? 'internal'
          : 'acpx',
      baseUrl: profile.connection.baseUrl,
    };
  }

  const config = configStore.get();
  const legacy = config.acpAgents?.find((a) => a.name === agentName);
  if (!legacy) {
    return null;
  }

  return {
    source: 'legacy',
    name: legacy.name,
    enabled: legacy.enabled !== false,
    connectionType: legacy.connection.type === 'remote'
      ? 'remote'
      : legacy.connection.type === 'internal'
        ? 'internal'
        : 'acpx',
    baseUrl: legacy.connection.baseUrl,
  };
}

/**
 * Execute delegation to an external acpx agent.
 * Handles both synchronous and asynchronous execution modes.
 */
async function executeACPAgent(
  args: {
    agentName: string;
    task: string;
    context?: string;
    workingDirectory?: string;
    prepareOnly?: boolean;
  },
  parentSessionId: string | undefined,
  waitForResult: boolean
): Promise<object> {
  try {
    const resolvedAgent = resolveAcpAgentConfig(args.agentName);
    if (!resolvedAgent) {
      return {
        success: false,
        error: `Agent "${args.agentName}" not found in agent profiles or legacy configuration`,
      };
    }

    if (!resolvedAgent.enabled) {
      return { success: false, error: `Agent "${args.agentName}" is disabled` };
    }

    if (resolvedAgent.connectionType === 'internal') {
      return {
        success: false,
        error: `Agent "${args.agentName}" is configured as internal and cannot be delegated through external-agent routing`,
      };
    }

    if (resolvedAgent.connectionType === 'remote') {
      return {
        success: false,
        error: `Remote ACP agents are not supported by the acpx runtime path. Reconfigure "${args.agentName}" as an acpx agent profile.`,
      };
    }

    if (args.prepareOnly) {
      return {
        success: true,
        prepared: true,
        agentName: args.agentName,
        status: 'ready',
        message: `Agent "${args.agentName}" is ready for delegated acpx work.`,
      };
    }

    // Create unified sub-agent state (conversation initialized automatically)
    const subAgentState = createSubAgentState({
      agentName: args.agentName,
      task: args.task,
      parentSessionId: parentSessionId || `orphaned-${Date.now()}`,
      workingDirectory: args.workingDirectory,
      connectionType: resolvedAgent.connectionType,
      isAsync: !waitForResult,
    });
    subAgentState.status = 'running';
    registerAgentRunMapping(args.agentName, subAgentState.runId);

    const registerSessionMapping = (sessionId?: string) => {
      const resolvedSessionId = sessionId ?? acpService.getAgentSessionId(args.agentName);
      if (resolvedSessionId) {
        subAgentState.acpSessionId = resolvedSessionId;
        sessionToRunId.set(resolvedSessionId, subAgentState.runId);
        if (parentSessionId) {
          setAcpToAppSessionMapping(
            resolvedSessionId,
            parentSessionId,
            agentSessionStateManager.getSessionRunId(parentSessionId),
            { registerAppSession: true },
          );
        }
      }
    };

    const sessionName = getDelegationAcpxSessionName(
      parentSessionId || `orphaned-${Date.now()}`,
      subAgentState.runId,
    );

    const ensureAcpxSession = async (): Promise<string> => {
      const sessionId = await acpService.getOrCreateSession(
        args.agentName,
        false,
        args.workingDirectory,
        parentSessionId ? { appSessionId: parentSessionId } : undefined,
        sessionName,
      );
      registerSessionMapping(sessionId);
      return sessionId;
    };

    if (waitForResult) {
      return executeACPAgentSync(subAgentState, args, ensureAcpxSession, sessionName);
    } else {
      return executeACPAgentAsync(subAgentState, args, resolvedAgent, ensureAcpxSession, sessionName);
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Execute synchronous ACP agent delegation.
 */
async function executeACPAgentSync(
  subAgentState: DelegatedRun,
  args: { agentName: string; task: string; context?: string; workingDirectory?: string },
  ensureAcpxSession: () => Promise<string>,
  sessionName: string,
): Promise<object> {
  try {
    await ensureAcpxSession();

    const result = await acpService.sendPrompt(
      args.agentName,
      sessionName,
      args.task,
      args.context,
    );

    if (result.sessionId) {
      subAgentState.acpSessionId = result.sessionId;
    }

    // Add final assistant message if we got a result
    if (result.response) {
      mergeAssistantStreamText(subAgentState.conversation, result.response, Date.now());
    }

    // Note: Don't cleanup delegation mappings here - the sessionUpdate handler
    // will clean up when isComplete arrives. Early cleanup can cause late
    // session/update notifications to be dropped/misrouted.

    if (result.success) {
      return createCompletedResult(subAgentState, result.response || '', subAgentState.conversation);
    } else {
      return createFailedResult(subAgentState, result.error || 'Unknown error', subAgentState.conversation);
    }
  } catch (error) {
    // Note: Don't cleanup delegation mappings here - the sessionUpdate handler
    // will clean up when isComplete arrives. Early cleanup can cause late
    // session/update notifications to be dropped/misrouted.
    throw error;
  }
}

/**
 * Execute asynchronous ACP agent delegation.
 */
function executeACPAgentAsync(
  subAgentState: DelegatedRun,
  args: { agentName: string; task: string; context?: string; workingDirectory?: string },
  agentConfig: ResolvedAcpAgentConfig,
  ensureAcpxSession: () => Promise<string>,
  sessionName: string,
): DelegationResult {
  // Start background polling for notifications
  acpBackgroundNotifier.startPolling();

  if (agentConfig.connectionType === 'internal' || agentConfig.connectionType === 'remote') {
    subAgentState.status = 'failed';
    return createFailedResult(subAgentState, `Agent "${args.agentName}" is not executable via the acpx external delegation path`);
  }

  executeStdioAgentAsync(subAgentState, args, ensureAcpxSession, sessionName);

  return createRunningResult(subAgentState);
}

/**
 * Execute async acpx agent delegation (fire-and-forget).
 */
function executeStdioAgentAsync(
  subAgentState: DelegatedRun,
  args: { agentName: string; task: string; context?: string; workingDirectory?: string },
  ensureAcpxSession: () => Promise<string>,
  sessionName: string,
): void {
  Promise.resolve()
    .then(() => ensureAcpxSession())
    .then(() => acpService.sendPrompt(
      args.agentName,
      sessionName,
      args.task,
      args.context,
    ))
    .then(
    (result) => {
      if (result.sessionId) {
        subAgentState.acpSessionId = result.sessionId;
      }
      const endTime = Date.now();

      if (result.success) {
        subAgentState.status = 'completed';
        subAgentState.result = {
          runId: subAgentState.runId,
          agentName: args.agentName,
          status: 'completed',
          startTime: subAgentState.startTime,
          endTime,
          metadata: { duration: endTime - subAgentState.startTime },
          output: [{ role: 'assistant', parts: [{ content: result.response || '' }] }],
        };
      } else {
        subAgentState.status = 'failed';
        subAgentState.result = {
          runId: subAgentState.runId,
          agentName: args.agentName,
          status: 'failed',
          startTime: subAgentState.startTime,
          endTime,
          metadata: { duration: endTime - subAgentState.startTime },
          error: result.error || 'Unknown error',
        };
      }
      void acpBackgroundNotifier.resumeParentSessionIfNeeded(subAgentState);
      // Note: Don't cleanup delegation mappings here - the sessionUpdate handler
      // will clean up when isComplete arrives. Early cleanup can cause late
      // session/update notifications to be dropped/misrouted.
    },
    (error) => {
      finalizeAsyncRunWithError(subAgentState, args.agentName, error);
    }
  );
}

/**
 * Finalize an async run that failed with an error.
 */
function finalizeAsyncRunWithError(
  subAgentState: DelegatedRun,
  agentName: string,
  error: unknown
): void {
  subAgentState.status = 'failed';
  const endTime = Date.now();
  subAgentState.result = {
    runId: subAgentState.runId,
    agentName,
    status: 'failed',
    startTime: subAgentState.startTime,
    endTime,
    metadata: { duration: endTime - subAgentState.startTime },
    error: error instanceof Error ? error.message : String(error),
  };
  void acpBackgroundNotifier.resumeParentSessionIfNeeded(subAgentState);
  // Note: Don't cleanup delegation mappings here - the sessionUpdate handler
  // will clean up when isComplete arrives. Early cleanup can cause late
  // session/update notifications to be dropped/misrouted.
}


/**
 * Check the status of a running delegated agent task.
 * @param args - Arguments containing the run ID and optional history length
 * @returns Object with current status of the run
 */
export async function handleCheckAgentStatus(args: { runId: string; historyLength?: number }): Promise<object> {
  try {
    const subAgentState = delegatedRuns.get(args.runId);

    if (!subAgentState) {
      return {
        success: false,
        error: `Run "${args.runId}" not found. It may have expired or never existed.`,
      };
    }

    const statusCheckCount = subAgentState.statusCheckCount ?? 0;
    subAgentState.statusCheckCount = statusCheckCount + 1;

    const response: Record<string, unknown> = {
      success: true,
      runId: subAgentState.runId,
      agentName: subAgentState.agentName,
      task: subAgentState.task,
      workingDirectory: subAgentState.workingDirectory,
      status: subAgentState.status,
      startTime: subAgentState.startTime,
      duration: Date.now() - subAgentState.startTime,
      pollCount: subAgentState.statusCheckCount,
    };

    if (subAgentState.progress) {
      response.progress = subAgentState.progress;
    }

    if (subAgentState.status === 'completed' && subAgentState.result) {
      const outputText = subAgentState.result.output
        ?.map((msg) => msg.parts.map((p) => p.content).join('\n'))
        .join('\n\n') || '';
      response.output = outputText;
      response.metadata = subAgentState.result.metadata;
    }

    if (subAgentState.status === 'failed' && subAgentState.result?.error) {
      response.error = subAgentState.result.error;
    }

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Prepare an ACP agent without executing delegated work.
 * Compatibility wrapper that routes to delegate_to_agent with prepareOnly=true.
 */
export async function handleSpawnAgent(
  args: { agentName: string; workingDirectory?: string }
): Promise<object> {
  return handleDelegateToAgent(
    {
      agentName: args.agentName,
      task: `Prepare agent "${args.agentName}" for upcoming delegated work.`,
      workingDirectory: args.workingDirectory,
      prepareOnly: true,
      waitForResult: false,
    },
    undefined
  );
}

/**
 * Stop a running ACP agent process.
 * Uses acpService to stop agents.
 * @param args - Arguments containing the agent name
 * @returns Object with stop result
 */
export async function handleStopAgent(args: { agentName: string }): Promise<object> {
  try {
    const resolvedAgent = resolveAcpAgentConfig(args.agentName);
    if (!resolvedAgent) {
      return {
        success: false,
        error: `Agent "${args.agentName}" not found in agent profiles or legacy configuration`,
      };
    }

    if (resolvedAgent.connectionType === 'remote') {
      return {
        success: false,
        error: `Agent "${args.agentName}" is a remote agent and cannot be stopped locally.`,
      };
    }

    if (resolvedAgent.connectionType === 'internal') {
      return {
        success: false,
        error: `Agent "${args.agentName}" is internal and cannot be stopped via external ACP process controls.`,
      };
    }

    // Check current status
    const agentStatus = acpService.getAgentStatus(args.agentName);

    // Check if agent is already stopped
    if (agentStatus?.status === 'stopped' || !agentStatus) {
      return {
        success: true,
        message: `Agent "${args.agentName}" is already stopped`,
        status: 'stopped',
      };
    }

    // Stop the agent via acpService
    await acpService.stopAgent(args.agentName);

    return {
      success: true,
      message: `Agent "${args.agentName}" stopped successfully`,
      agentName: args.agentName,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}



// ============================================================================
// Main Dispatcher
// ============================================================================

/**
 * Execute an ACP router tool by name.
 * This is the main entry point for invoking ACP router tools.
 *
 * @param toolName - The tool name (e.g., 'list_available_agents')
 * @param args - Arguments to pass to the tool handler
 * @param parentSessionId - Optional parent session ID for tracking delegations
 * @returns Object with content string and error flag
 */
export async function executeACPRouterTool(
  toolName: string,
  args: Record<string, unknown>,
  parentSessionId?: string
): Promise<{ content: string; isError: boolean }> {
  // Resolve alias tool names to their canonical handlers
  const resolvedToolName = resolveToolName(toolName);

  try {
    let result: object;

    switch (resolvedToolName) {
      case 'list_available_agents':
        result = await handleListAvailableAgents(args as { capability?: string; skillName?: string });
        break;

      case 'delegate_to_agent':
        // Handle both 'runId' and 'taskId' terminology
        result = await handleDelegateToAgent(
          args as {
            agentName: string;
            task?: string;
            context?: string;
            workingDirectory?: string;
            prepareOnly?: boolean;
            contextId?: string;
            waitForResult?: boolean;
          },
          parentSessionId
        );
        break;

      case 'check_agent_status':
        // Handle both 'runId' and 'taskId' parameter names
        const statusArgs = args as { runId?: string; taskId?: string; agentName?: string; historyLength?: number };
        let statusRunId = statusArgs.runId || statusArgs.taskId;

        // Fallback: if no runId provided, try to find the most recent run
        // This handles the common case where the LLM forgets to pass the runId.
        // Scoped to parentSessionId to prevent cross-session leakage.
        if (!statusRunId) {
          // Try by agentName first, scoped to this session's runs
          if (statusArgs.agentName) {
            const agentRuns = agentNameToActiveRunIds.get(statusArgs.agentName);
            if (agentRuns && agentRuns.size > 0) {
              // Filter to runs belonging to this parent session
              for (const candidateRunId of Array.from(agentRuns).reverse()) {
                const run = delegatedRuns.get(candidateRunId);
                if (run && (!parentSessionId || run.parentSessionId === parentSessionId)) {
                  statusRunId = candidateRunId;
                  break;
                }
              }
            }
          }
          // If still no runId, find the most recent delegated run scoped to this session
          if (!statusRunId) {
            let latestTime = 0;
            delegatedRuns.forEach((state, runId) => {
              if (parentSessionId && state.parentSessionId !== parentSessionId) return;
              if (state.startTime > latestTime) {
                latestTime = state.startTime;
                statusRunId = runId;
              }
            });
          }
        }

        if (!statusRunId) {
          result = {
            success: false,
            error: 'No runId provided and no active delegated runs found. Provide the runId returned from delegate_to_agent.',
          };
        } else {
          result = await handleCheckAgentStatus({
            runId: statusRunId,
            historyLength: statusArgs.historyLength,
          });
        }
        break;

      case 'spawn_agent':
        result = await handleSpawnAgent(args as { agentName: string; workingDirectory?: string });
        break;

      case 'stop_agent':
        result = await handleStopAgent(args as { agentName: string });
        break;

      case 'cancel_agent_run':
        // Handle both 'runId' and 'taskId' parameter names
        const cancelArgs = args as { runId?: string; taskId?: string };
        const cancelRunId = cancelArgs.runId || cancelArgs.taskId;
        if (!cancelRunId) {
          result = {
            success: false,
            error: 'Missing required parameter: runId or taskId must be provided',
          };
        } else {
          result = await handleCancelAgentRun({ 
            runId: cancelRunId 
          });
        }
        break;

      default:
        return {
          content: JSON.stringify({
            success: false,
            error: `Unknown ACP router tool: ${toolName}`,
          }),
          isError: true,
        };
    }

    const isError = 'success' in result && result.success === false;
    return {
      content: JSON.stringify(result, null, 2),
      isError,
    };
  } catch (error) {
    return {
      content: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
      isError: true,
    };
  }
}

/**
 * Check if a tool name is an ACP router tool.
 * Includes both canonical names and aliases.
 * @param toolName - The tool name to check
 * @returns True if the tool is an ACP router tool
 */
export function isACPRouterTool(toolName: string): boolean {
  // Check both the original name and any aliases
  return acpRouterToolDefinitions.some((def) => def.name === toolName);
}

/**
 * Get the list of delegated run IDs for a parent session.
 * @param parentSessionId - The parent session ID to filter by
 * @returns Array of run IDs
 */
export function getDelegatedRunsForSession(parentSessionId: string): string[] {
  const runIds: string[] = [];
  delegatedRuns.forEach((state, runId) => {
    if (state.parentSessionId === parentSessionId) {
      runIds.push(runId);
    }
  });
  return runIds;
}

/**
 * Get detailed information about a delegated run, including conversation.
 * @param runId - The run ID to look up
 * @returns The delegation progress with conversation, or null if not found
 */
export function getDelegatedRunDetails(runId: string): ACPDelegationProgress | null {
  const state = delegatedRuns.get(runId);
  if (!state) {
    return null;
  }

  return {
    runId: state.runId,
    agentName: state.agentName,
    connectionType: state.connectionType,
    task: state.task,
    status: state.status,
    startTime: state.startTime,
    // Use stored endTime from result if available, otherwise undefined for in-progress runs
    endTime: state.result?.endTime,
    progressMessage: state.progress,
    resultSummary: state.result?.output?.[0]?.parts?.[0]?.content?.substring(0, 200),
    error: state.result?.error,
    acpSessionId: state.acpSessionId,
    subSessionId: state.subSessionId,
    conversationId: state.conversationId,
    acpRunId: state.acpRunId,
    conversation: [...state.conversation],
  };
}

/**
 * Get all delegated runs with their conversations for a session.
 * Useful for inspecting subagent activity.
 * @param parentSessionId - The parent session ID
 * @returns Array of delegation progress objects with conversations
 */
export function getAllDelegationsForSession(parentSessionId: string): ACPDelegationProgress[] {
  const results: ACPDelegationProgress[] = [];

  delegatedRuns.forEach((state, runId) => {
    if (state.parentSessionId === parentSessionId) {
      const details = getDelegatedRunDetails(runId);
      if (details) {
        results.push(details);
      }
    }
  });

  return results;
}

/**
 * Clean up completed/failed delegated runs older than the specified age.
 * @param maxAgeMs - Maximum age in milliseconds (default: 1 hour)
 */
export function cleanupOldDelegatedRuns(maxAgeMs: number = 60 * 60 * 1000): void {
  const now = Date.now();
  const toDelete: string[] = [];

  delegatedRuns.forEach((state, runId) => {
    if (
      (state.status === 'completed' || state.status === 'failed') &&
      now - state.startTime > maxAgeMs
    ) {
      toDelete.push(runId);
    }
  });

  for (const runId of toDelete) {
    const state = delegatedRuns.get(runId);
    if (state) {
      cleanupDelegationMappings(runId, state.agentName);
    }
    delegatedRuns.delete(runId);
  }
}

// ============================================================================
// Cancellation Support
// ============================================================================

/**
 * Cancel a running agent task (internal or external).
 * @param args - Arguments containing the run ID
 * @returns Object with cancellation result
 */
async function handleCancelAgentRun(args: { runId: string }): Promise<object> {
  const state = delegatedRuns.get(args.runId);
  if (!state) {
    return {
      success: false,
      error: `Run "${args.runId}" not found`,
    };
  }

  if (state.status !== 'running' && state.status !== 'pending') {
    return {
      success: false,
      error: `Run "${args.runId}" is not running (status: ${state.status})`,
    };
  }

  try {
    // Handle internal agent cancellation
    if (state.isInternal) {
      // Use the stored subSessionId for cancellation (this is the actual internal sub-session ID,
      // whereas state.runId is the delegation tracking ID 'acp_delegation_*')
      const subSessionId = state.subSessionId;
      if (!subSessionId) {
        return {
          success: false,
          error: `Failed to cancel internal agent run "${args.runId}": sub-session ID not found (task may have completed before cancellation was attempted)`,
        };
      }
      const cancelled = cancelSubSession(subSessionId);
      if (cancelled) {
        state.status = 'cancelled';
        return {
          success: true,
          message: `Internal agent run "${args.runId}" cancelled`,
        };
      }
      // Sub-session not found or already completed - report failure
      // Don't mark local state as cancelled since sub-session cancellation failed
      return {
        success: false,
        error: `Failed to cancel internal agent run "${args.runId}": sub-session not found or already completed`,
      };
    }

    // For external agents, we can't really cancel mid-run but we can mark it
    state.status = 'cancelled';
    return {
      success: true,
      message: `Agent run "${args.runId}" marked as cancelled`,
      note: 'External agent tasks cannot be forcefully stopped mid-execution',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
