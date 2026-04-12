/**
 * Internal Sub-Session Service
 *
 * Allows DotAgents to spawn internal sub-sessions of itself as ACP-style agents.
 * Unlike external ACP agents, these run within the same process with isolated state.
 *
 * Key features:
 * - Runs in the same process (platform-agnostic, no OS process spawning)
 * - Isolated conversation history per sub-session
 * - Access to the same MCP tools as the parent
 * - Configurable recursion depth limits to prevent infinite loops
 * - Progress updates flow to parent session
 * - Embedded UI display in parent session via ACPDelegationProgress
 */

import { v4 as uuidv4 } from 'uuid';
import { processTranscriptWithAgentMode } from '../llm';
import { mcpService } from '../mcp-service';
import { agentSessionStateManager } from '../state';
import { agentSessionTracker } from '../agent-session-tracker';
import { emitAgentProgress } from '../emit-agent-progress';
import { skillsService } from '../skills-service';
import { agentProfileService, createSessionSnapshotFromProfile } from '../agent-profile-service';
import { getPreferredDelegationOutput } from '../agent-run-utils';
import { configStore } from '../config';
import { clearAcpToAppSessionMapping, setAcpToAppSessionMapping } from '../acp-session-state';
import { stringifySubAgentToolResultContent } from '@shared/delegation-tool-display'
import type { AgentProgressUpdate, SessionProfileSnapshot, ACPDelegationProgress, ACPSubAgentMessage, ConversationMessage, AgentProfile } from '../../shared/types';
import type { MCPToolCall, MCPToolResult } from '../mcp-service';

const logSubSession = (...args: unknown[]) => {
  console.log(`[${new Date().toISOString()}] [InternalSubSession]`, ...args);
};

// ============================================================================
// Configuration & Limits
// ============================================================================

/** Maximum recursion depth for sub-sessions (prevents infinite loops) */
const MAX_RECURSION_DEPTH = 3;

/** Maximum concurrent sub-sessions per parent session */
const MAX_CONCURRENT_SUB_SESSIONS = 5;

/** Default max iterations for sub-session agent loops (used when config has no explicit value) */
const DEFAULT_SUB_SESSION_MAX_ITERATIONS = 10;

// ============================================================================
// Sub-Session State Tracking
// ============================================================================

export interface InternalSubSession {
  /** Unique ID for this sub-session */
  id: string;
  /** Parent session ID that spawned this sub-session */
  parentSessionId: string;
  /** Parent session run ID captured when this sub-session started */
  parentRunId?: number;
  /** Current recursion depth (1 = first level sub-session) */
  depth: number;
  /** The task being executed */
  task: string;
  /** Current status */
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  /** Start timestamp */
  startTime: number;
  /** End timestamp (when completed/failed) */
  endTime?: number;
  /** Final result text */
  result?: string;
  /** Error message if failed */
  error?: string;
  /** Display name for the agent executing this sub-session */
  agentDisplayName?: string;
  /** DotAgents conversation ID used for stateful agent context */
  conversationId?: string;
  /** Conversation history for this sub-session */
  conversationHistory: ACPSubAgentMessage[];
}

/** Active sub-sessions indexed by their ID */
const activeSubSessions = new Map<string, InternalSubSession>();

/** Map parent session ID -> Set of child sub-session IDs */
const parentToChildren = new Map<string, Set<string>>();

/** Map sub-session ID -> recursion depth (includes parent chain) */
const sessionDepthMap = new Map<string, number>();

// ============================================================================
// Depth Tracking Helpers
// ============================================================================

/**
 * Get the recursion depth for a session.
 * Returns 0 for root sessions (no parent), 1+ for sub-sessions.
 */
export function getSessionDepth(sessionId: string): number {
  return sessionDepthMap.get(sessionId) ?? 0;
}

/**
 * Set the recursion depth for a session.
 */
function setSessionDepth(sessionId: string, depth: number): void {
  sessionDepthMap.set(sessionId, depth);
}

/**
 * Check if we can spawn a sub-session from the given parent.
 * Returns an error message if not allowed, undefined if OK.
 */
function canSpawnSubSession(parentSessionId: string): string | undefined {
  const parentDepth = getSessionDepth(parentSessionId);
  
  if (parentDepth >= MAX_RECURSION_DEPTH) {
    return `Maximum recursion depth (${MAX_RECURSION_DEPTH}) reached. Cannot spawn more sub-sessions.`;
  }
  
  const childrenCount = parentToChildren.get(parentSessionId)?.size ?? 0;
  if (childrenCount >= MAX_CONCURRENT_SUB_SESSIONS) {
    return `Maximum concurrent sub-sessions (${MAX_CONCURRENT_SUB_SESSIONS}) reached for this parent.`;
  }
  
  return undefined;
}

// ============================================================================
// Sub-Session Management
// ============================================================================

/**
 * Get all active sub-sessions for a parent session.
 */
export function getChildSubSessions(parentSessionId: string): InternalSubSession[] {
  const childIds = parentToChildren.get(parentSessionId);
  if (!childIds) return [];
  
  return Array.from(childIds)
    .map(id => activeSubSessions.get(id))
    .filter((s): s is InternalSubSession => s !== undefined);
}

// ============================================================================
// Sub-Session Execution
// ============================================================================

/** Minimum interval between UI updates per sub-session (ms) */
const MIN_EMIT_INTERVAL_MS = 100;

/** Track last emit time per sub-session for rate limiting */
const lastEmitTime = new Map<string, number>();

/**
 * Emit delegation progress to the parent session's UI.
 * This allows the sub-session to be displayed inline in the parent's conversation.
 */
function emitSubSessionDelegationProgress(
  subSession: InternalSubSession,
  parentSessionId: string
): void {
  const now = Date.now();
  const lastEmit = lastEmitTime.get(subSession.id) ?? 0;

  // Check if this is a terminal state (completed, failed, cancelled)
  const isTerminalState = subSession.status === 'completed' ||
                          subSession.status === 'failed' ||
                          subSession.status === 'cancelled';

  // Rate limit emissions, but ALWAYS emit terminal states to ensure UI updates
  if (!isTerminalState && now - lastEmit < MIN_EMIT_INTERVAL_MS) {
    return;
  }
  lastEmitTime.set(subSession.id, now);

  // Convert internal conversation history to ACPSubAgentMessage format
  const conversation: ACPSubAgentMessage[] = subSession.conversationHistory.map(msg => ({ ...msg }));

  // Build delegation progress
  // Use the agent display name stored in the sub-session, falling back to 'Internal'
  const agentName = subSession.agentDisplayName || 'Internal';
  const delegationProgress: ACPDelegationProgress = {
    runId: subSession.id,
    agentName,
    connectionType: 'internal',
    task: subSession.task,
    status: subSession.status === 'pending' ? 'pending'
          : subSession.status === 'running' ? 'running'
          : subSession.status === 'completed' ? 'completed'
          : subSession.status === 'cancelled' ? 'cancelled'
          : 'failed',
    startTime: subSession.startTime,
    endTime: subSession.endTime,
    progressMessage: undefined,
    resultSummary: subSession.result?.substring(0, 200),
    error: subSession.error,
    subSessionId: subSession.id,
    conversationId: subSession.conversationId,
    conversation,
  };

  // Emit progress update to parent session's UI
  // IMPORTANT: isComplete is always false because this is a delegation progress update,
  // not a completion of the parent session. The parent session continues running after
  // the delegation completes. Setting isComplete: true here would incorrectly mark the
  // parent session as done in the UI while the main agent is still processing.
  emitAgentProgress({
    sessionId: parentSessionId,
    runId: subSession.parentRunId ?? agentSessionStateManager.getSessionRunId(parentSessionId),
    currentIteration: 0,
    maxIterations: 1,
    isComplete: false,
    steps: [
      {
        id: `delegation-${subSession.id}`,
        type: 'completion',
        title: `Sub-Agent: ${agentName}`,
        description: subSession.task.length > 100
          ? subSession.task.substring(0, 100) + '...'
          : subSession.task,
        status: subSession.status === 'completed' ? 'completed'
              : subSession.status === 'failed' || subSession.status === 'cancelled' ? 'error'
              : 'in_progress',
        timestamp: Date.now(),
        delegation: delegationProgress,
      },
    ],
  }).catch(err => {
    logSubSession('Failed to emit delegation progress:', err);
  });
}

export interface RunSubSessionOptions {
  /** The task/prompt to execute in the sub-session */
  task: string;
  /** Optional additional context to prepend to the task */
  context?: string;
  /** Parent session ID (for tracking and depth calculation) */
  parentSessionId: string;
  /** Maximum agent iterations for this sub-session */
  maxIterations?: number;
  /** Profile snapshot to use (inherits from parent if not specified) */
  profileSnapshot?: SessionProfileSnapshot;
  /** Optional callback for progress updates */
  onProgress?: (update: AgentProgressUpdate) => void;
  /**
   * Optional pre-generated sub-session ID.
   * If provided, allows the caller to capture the ID before execution starts,
   * enabling cancellation of in-flight sub-sessions.
   */
  subSessionId?: string;
  /**
   * Optional AgentProfile to run the sub-session as.
   * When specified, the profile's configuration will be applied directly.
   * Takes precedence over agentProfileName if both are provided.
   */
  agentProfile?: AgentProfile;
  /**
   * Optional agent profile name to run the sub-session as.
   * When specified, the profile's system prompt and configuration will be applied.
   */
  agentProfileName?: string;
  /**
   * Legacy alias for agentProfileName.
   * @deprecated Use agentProfileName or agentProfile instead.
   */
  personaName?: string;
}

export interface SubSessionResult {
  success: boolean;
  subSessionId: string;
  conversationId?: string;
  result?: string;
  error?: string;
  conversationHistory: InternalSubSession['conversationHistory'];
  duration: number;
}

// Use the canonical createSessionSnapshotFromProfile from agent-profile-service.ts
// to avoid inconsistencies (e.g., allServersDisabledByDefault defaulting to true).

/**
 * Run an internal sub-session.
 * This creates an isolated agent session that runs within the same process.
 * When agentProfile or agentProfileName is provided, uses that configuration.
 * agentProfile takes precedence over agentProfileName if both are provided.
 */
export async function runInternalSubSession(
  options: RunSubSessionOptions
): Promise<SubSessionResult> {
  const { task, context, parentSessionId, maxIterations, profileSnapshot, onProgress, agentProfile } = options;
  const agentProfileName = options.agentProfileName ?? options.personaName;

  // Check if we can spawn
  const canSpawnError = canSpawnSubSession(parentSessionId);
  if (canSpawnError) {
    return {
      success: false,
      subSessionId: '',
      error: canSpawnError,
      conversationHistory: [],
      duration: 0,
    };
  }

  // Calculate depth
  const parentDepth = getSessionDepth(parentSessionId);
  const subSessionDepth = parentDepth + 1;

  // Generate sub-session ID or use pre-generated one from caller
  // Using a pre-generated ID allows callers to track the sub-session for cancellation
  // before this async function completes
  const subSessionId = options.subSessionId ?? `subsession_${Date.now()}_${uuidv4().substring(0, 8)}`;

  // Determine the agent display name for UI display
  const agentDisplayName = agentProfile?.displayName ?? agentProfileName;

  // Create sub-session state
  const subSession: InternalSubSession = {
    id: subSessionId,
    parentSessionId,
    parentRunId: agentSessionStateManager.getSessionRunId(parentSessionId),
    depth: subSessionDepth,
    task,
    status: 'pending',
    startTime: Date.now(),
    agentDisplayName,
    conversationHistory: [],
  };

  // Register sub-session
  activeSubSessions.set(subSessionId, subSession);
  setSessionDepth(subSessionId, subSessionDepth);

  // Track parent -> child relationship
  if (!parentToChildren.has(parentSessionId)) {
    parentToChildren.set(parentSessionId, new Set());
  }
  parentToChildren.get(parentSessionId)!.add(subSessionId);

  const agentIdentifier = agentProfile?.name ?? agentProfileName;
  logSubSession(`Starting sub-session ${subSessionId} (depth: ${subSessionDepth}, parent: ${parentSessionId}${agentIdentifier ? `, agent: ${agentIdentifier}` : ''})`);

  // Get profile snapshot - prioritize agentProfile, then agentProfileName, then fallback
  let effectiveProfileSnapshot: SessionProfileSnapshot | undefined;

  // Priority 1: Use agentProfile directly if provided
  if (agentProfile) {
    // Check if this profile should delegate to an external acpx agent
    if (agentProfile.connection.type === 'acpx' || (agentProfile.connection as { acpAgentName?: string }).acpAgentName) {
      const acpAgentName = (agentProfile.connection as { acpAgentName?: string }).acpAgentName ?? agentProfile.name;
      logSubSession(`AgentProfile "${agentProfile.name}" uses external acpx agent "${acpAgentName}" - should be routed externally`);
      // Clean up the sub-session registration since we're not running internally
      activeSubSessions.delete(subSessionId);
      parentToChildren.get(parentSessionId)?.delete(subSessionId);
      return {
        success: false,
        subSessionId,
        error: `AgentProfile "${agentProfile.name}" is configured to use an external acpx agent and should be routed through the external-agent system, not the internal agent.`,
        conversationHistory: [],
        duration: Date.now() - subSession.startTime,
      };
    }

    logSubSession(`Using AgentProfile "${agentProfile.name}" configuration for sub-session`);

    // Get skills instructions for the profile's enabled skills
    const skillsInstructions = agentProfile.skillsConfig?.enabledSkillIds?.length
      ? skillsService.getEnabledSkillsInstructionsForProfile(agentProfile.skillsConfig.enabledSkillIds)
      : undefined;

    if (skillsInstructions) {
      logSubSession(`Loaded ${agentProfile.skillsConfig!.enabledSkillIds!.length} skill(s) for AgentProfile "${agentProfile.name}"`);
    }

    effectiveProfileSnapshot = createSessionSnapshotFromProfile(agentProfile, skillsInstructions);
  }
  // Priority 2: Look up by name in agent profile service
  else if (agentProfileName) {
    const unifiedProfile = agentProfileService.getByName(agentProfileName);
    if (unifiedProfile && unifiedProfile.enabled) {
      // Check if this profile should delegate to an external acpx/remote agent
      if (unifiedProfile.connection.type === 'acpx' || unifiedProfile.connection.type === 'remote') {
        logSubSession(`AgentProfile "${agentProfileName}" uses external connection "${unifiedProfile.connection.type}" - should be routed externally`);
        // Clean up the sub-session registration since we're not running internally
        activeSubSessions.delete(subSessionId);
        parentToChildren.get(parentSessionId)?.delete(subSessionId);
        return {
          success: false,
          subSessionId,
          error: `AgentProfile "${agentProfileName}" is configured to use external agent and should be routed through the ACP system, not the internal agent.`,
          conversationHistory: [],
          duration: Date.now() - subSession.startTime,
        };
      }

      logSubSession(`Using AgentProfile "${agentProfileName}" configuration for sub-session`);

      // Get skills instructions for the profile's enabled skills
      const skillsInstructions = unifiedProfile.skillsConfig?.enabledSkillIds?.length
        ? skillsService.getEnabledSkillsInstructionsForProfile(unifiedProfile.skillsConfig.enabledSkillIds)
        : undefined;

      if (skillsInstructions) {
        logSubSession(`Loaded ${unifiedProfile.skillsConfig!.enabledSkillIds!.length} skill(s) for AgentProfile "${agentProfileName}"`);
      }

      effectiveProfileSnapshot = createSessionSnapshotFromProfile(unifiedProfile, skillsInstructions);
    }

    // If not found, log and fall back to parent profile
    if (!effectiveProfileSnapshot) {
      logSubSession(`Agent "${agentProfileName}" not found in agent profile service, falling back to parent profile`);
    }
  }

  // Fall back to provided profile snapshot or inherit from parent
  if (!effectiveProfileSnapshot) {
    effectiveProfileSnapshot = profileSnapshot
      ?? agentSessionStateManager.getSessionProfileSnapshot(parentSessionId)
      ?? agentSessionTracker.getSessionProfileSnapshot(parentSessionId);
  }

  setAcpToAppSessionMapping(subSessionId, parentSessionId, subSession.parentRunId);

  // Create isolated session state for this sub-session
  agentSessionStateManager.createSession(subSessionId, effectiveProfileSnapshot);

  // Load previous conversation history for stateful agents
  let previousConversationHistory: Array<{
    role: 'user' | 'assistant' | 'tool';
    content: string;
    toolCalls?: MCPToolCall[];
    toolResults?: MCPToolResult[];
  }> | undefined;

  // Track agent info for saving conversation after completion
  let statefulAgentId: string | undefined;
  let useAgentProfileService = false;

  // Priority 1: Check agentProfile for statefulness
  if (agentProfile && agentProfile.isStateful) {
    statefulAgentId = agentProfile.id;
    useAgentProfileService = true;
    const existingMessages = agentProfileService.getConversation(agentProfile.id);
    if (existingMessages.length > 0) {
      // Convert ConversationMessage[] to the format expected by processTranscriptWithAgentMode
      previousConversationHistory = existingMessages.map(msg => ({
        role: msg.role,
        content: msg.content,
        // Note: toolCalls and toolResults from ConversationMessage use different types
        // but for context purposes, the content is sufficient
      }));
      logSubSession(`Loaded ${existingMessages.length} messages from stateful AgentProfile "${agentProfile.name}" conversation history`);
    }
  }
  // Priority 2: Check by agent profile name in agent profile service
  else if (agentProfileName) {
    const unifiedProfile = agentProfileService.getByName(agentProfileName);
    if (unifiedProfile && unifiedProfile.isStateful) {
      statefulAgentId = unifiedProfile.id;
      useAgentProfileService = true;
      const existingMessages = agentProfileService.getConversation(unifiedProfile.id);
      if (existingMessages.length > 0) {
        // Convert ConversationMessage[] to the format expected by processTranscriptWithAgentMode
        previousConversationHistory = existingMessages.map(msg => ({
          role: msg.role,
          content: msg.content,
          // Note: toolCalls and toolResults from ConversationMessage use different types
          // but for context purposes, the content is sufficient
        }));
        logSubSession(`Loaded ${existingMessages.length} messages from stateful AgentProfile "${agentProfileName}" conversation history`);
      }
    }
  }

  // Format the full prompt
  const fullPrompt = context
    ? `Context: ${context}\n\nTask: ${task}`
    : task;

  // Add user message to conversation history
  subSession.conversationHistory.push({
    role: 'user',
    content: fullPrompt,
    timestamp: Date.now(),
  });

  subSession.status = 'running';

  // Emit initial delegation progress to show sub-session starting in parent UI
  emitSubSessionDelegationProgress(subSession, parentSessionId);

  try {
    // Get available tools - use profile-filtered tools if we have a profile snapshot
    const availableTools = effectiveProfileSnapshot?.mcpServerConfig
      ? mcpService.getAvailableToolsForProfile(effectiveProfileSnapshot.mcpServerConfig)
      : mcpService.getAvailableTools();

    // Create tool executor that respects session isolation
    const executeToolCall = async (
      toolCall: MCPToolCall,
      toolOnProgress?: (message: string) => void
    ): Promise<MCPToolResult> => {
      // Check if session should stop
      if (agentSessionStateManager.shouldStopSession(subSessionId)) {
        return {
          content: [{ type: 'text', text: 'Sub-session was stopped.' }],
          isError: true,
        };
      }

      // Execute the tool via MCP service
      // Use executeToolCall which handles routing to correct server based on tool name
      const result = await mcpService.executeToolCall(
        toolCall,
        toolOnProgress,
        false, // skipApprovalCheck
        subSessionId,
        effectiveProfileSnapshot?.mcpServerConfig
      );

      // Add tool result to conversation history for UI display
      subSession.conversationHistory.push({
        role: 'tool',
        toolName: toolCall.name,
        toolInput: toolCall.arguments,
        content: stringifySubAgentToolResultContent(result.content),
        timestamp: Date.now(),
      });

      // Emit updated delegation progress with tool result
      emitSubSessionDelegationProgress(subSession, parentSessionId);

      return result;
    };

    // Sub-session progress handler
    const subSessionOnProgress = (update: AgentProgressUpdate) => {
      // Tag progress as coming from a sub-session
      const taggedUpdate: AgentProgressUpdate = {
        ...update,
        sessionId: subSessionId,
        parentSessionId,
      };

      // Forward to caller's progress callback
      onProgress?.(taggedUpdate);

      // Extract any assistant content from the update to add to conversation history
      if (update.conversationHistory) {
        const lastMsg = update.conversationHistory[update.conversationHistory.length - 1];
        if (lastMsg && lastMsg.role === 'assistant' && lastMsg.content) {
          // Check only against the last message in our history to avoid duplicates
          // Using .find() over full history can drop legitimate repeated assistant outputs
          const lastHistoryMsg = subSession.conversationHistory[subSession.conversationHistory.length - 1];
          const isDuplicate = lastHistoryMsg &&
            lastHistoryMsg.role === 'assistant' &&
            lastHistoryMsg.content === lastMsg.content;
          if (!isDuplicate) {
            subSession.conversationHistory.push({
              role: 'assistant',
              content: lastMsg.content,
              timestamp: lastMsg.timestamp || Date.now(),
            });
          }
        }
      }

      // Emit updated delegation progress to parent UI
      emitSubSessionDelegationProgress(subSession, parentSessionId);
    };

    // Run the agent loop in the sub-session
    // For stateful agents, pass the previous conversation history for context
    // Get conversation ID from the appropriate source
    let conversationId: string | undefined;
    if (statefulAgentId && useAgentProfileService) {
      // For AgentProfile, use the conversationId from the profile
      conversationId = agentProfile?.conversationId;
    }

    // Fallback: if no conversationId from profile, inherit from parent session
    // This ensures Langfuse traces for sub-sessions are grouped with their parent
    if (!conversationId) {
      conversationId = agentSessionTracker.getConversationIdForSession(parentSessionId);
    }

    // Determine effective max iterations: explicit value > config unlimited > config max > default
    const cfg = configStore.get();
    const effectiveSubSessionMaxIterations = maxIterations
      ?? (cfg.mcpUnlimitedIterations ? Infinity : (cfg.mcpMaxIterations ?? DEFAULT_SUB_SESSION_MAX_ITERATIONS));

    subSession.conversationId = conversationId;

    const result = await processTranscriptWithAgentMode(
      fullPrompt,
      availableTools,
      executeToolCall,
      effectiveSubSessionMaxIterations,
      previousConversationHistory, // Pass previous history for stateful agents
      conversationId, // Use appropriate conversation ID if stateful
      subSessionId,
      subSessionOnProgress,
      effectiveProfileSnapshot
    );

    // Update sub-session state only if not already cancelled
    // This prevents a cancelled sub-session from transitioning back to completed
    // Note: Re-fetch from map since cancelSubSession() can mutate status asynchronously
    const currentSubSession = activeSubSessions.get(subSessionId);
    const wasCancelled = currentSubSession?.status === 'cancelled';
    
    if (currentSubSession && !wasCancelled) {
      const resolvedResultContent = getPreferredDelegationOutput(result.content, subSession.conversationHistory);
      currentSubSession.status = 'completed';
      currentSubSession.endTime = Date.now();
      currentSubSession.result = resolvedResultContent;

      // Add final assistant message to conversation history only for completed runs (not cancelled)
      const existingFinal = subSession.conversationHistory.find(
        m => m.role === 'assistant' && m.content === resolvedResultContent
      );
      if (!existingFinal) {
        subSession.conversationHistory.push({
          role: 'assistant',
          content: resolvedResultContent,
          timestamp: Date.now(),
        });
      }

      // Save conversation to stateful agent if applicable
      if (statefulAgentId && useAgentProfileService) {
        // Convert sub-session conversation history to ConversationMessage format
        const newMessages: ConversationMessage[] = subSession.conversationHistory.map((msg, idx) => ({
          id: `${subSessionId}_msg_${idx}_${Date.now()}`,
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
        }));

        // Use agent profile service for AgentProfile
        const existingMessages = agentProfileService.getConversation(statefulAgentId);
        agentProfileService.setConversation(statefulAgentId, [...existingMessages, ...newMessages]);
        logSubSession(`Saved ${newMessages.length} messages to stateful AgentProfile conversation`);
      }
    }

    // Emit final delegation progress showing completion or cancelled state
    emitSubSessionDelegationProgress(subSession, parentSessionId);

    // If cancelled, return with cancelled status to properly signal to callers
    if (wasCancelled) {
      logSubSession(`Sub-session ${subSessionId} was cancelled`);
      return {
        success: false,
        subSessionId,
        conversationId: subSession.conversationId,
        error: 'Sub-session was cancelled',
        conversationHistory: subSession.conversationHistory,
        duration: Date.now() - subSession.startTime,
      };
    }

    logSubSession(`Sub-session ${subSessionId} completed successfully`);

    return {
      success: true,
      subSessionId,
      conversationId: subSession.conversationId,
      result: getPreferredDelegationOutput(result.content, subSession.conversationHistory),
      conversationHistory: subSession.conversationHistory,
      duration: Date.now() - subSession.startTime,
    };

  } catch (error) {
    subSession.status = 'failed';
    subSession.endTime = Date.now();
    subSession.error = error instanceof Error ? error.message : String(error);

    // Emit final delegation progress showing failure
    emitSubSessionDelegationProgress(subSession, parentSessionId);

    logSubSession(`Sub-session ${subSessionId} failed:`, error);

    return {
      success: false,
      subSessionId,
      conversationId: subSession.conversationId,
      error: subSession.error,
      conversationHistory: subSession.conversationHistory,
      duration: Date.now() - subSession.startTime,
    };

  } finally {
    // Clean up session state and rate limit tracking
    agentSessionStateManager.cleanupSession(subSessionId);
    clearAcpToAppSessionMapping(subSessionId);
    lastEmitTime.delete(subSessionId);
    
    // Clean up parent-child relationship to prevent MAX_CONCURRENT_SUB_SESSIONS from becoming a lifetime limit
    const children = parentToChildren.get(parentSessionId);
    if (children) {
      children.delete(subSessionId);
    }
  }
}

/**
 * Cancel a running sub-session.
 */
export function cancelSubSession(subSessionId: string): boolean {
  const subSession = activeSubSessions.get(subSessionId);
  if (!subSession || subSession.status !== 'running') {
    return false;
  }

  // Signal the session to stop
  agentSessionStateManager.stopSession(subSessionId);

  subSession.status = 'cancelled';
  subSession.endTime = Date.now();

  // Emit progress update to notify parent UI that the sub-session was cancelled
  emitSubSessionDelegationProgress(subSession, subSession.parentSessionId);

  // Clean up parent-child relationship to prevent MAX_CONCURRENT_SUB_SESSIONS from becoming a lifetime limit
  const children = parentToChildren.get(subSession.parentSessionId);
  if (children) {
    children.delete(subSessionId);
  }

  logSubSession(`Sub-session ${subSessionId} cancelled`);
  return true;
}

/**
 * Generate a unique sub-session ID.
 * Can be used by callers to pre-generate the ID before calling runInternalSubSession,
 * enabling cancellation of in-flight sub-sessions.
 */
export function generateSubSessionId(): string {
  return `subsession_${Date.now()}_${uuidv4().substring(0, 8)}`;
}

/**
 * Get the internal agent definition for use in tool listings.
 */
export function getInternalAgentInfo() {
  return {
    name: 'internal',
    displayName: 'Internal Sub-Agent',
    description: 'An internal sub-session of DotAgents itself. Can perform any task the main agent can, with access to all configured MCP tools. Useful for parallel task execution or isolating complex sub-tasks.',
    isInternal: true,
    maxRecursionDepth: MAX_RECURSION_DEPTH,
    maxConcurrent: MAX_CONCURRENT_SUB_SESSIONS,
  };
}
