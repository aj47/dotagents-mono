import { acpSmartRouter } from './acp/acp-smart-router'
import { acpService } from './acp-service'
import { getInternalAgentInfo } from './acp/internal-agent'
import { agentProfileService } from './agent-profile-service'
import type { KnowledgeNote } from "@dotagents/core"
import {
  formatFullPromptToolInfo,
  formatLightweightMcpToolInfo,
  formatMinimalPromptToolList,
  formatPromptNow,
  formatRuntimeToolInfo,
  formatWorkingNotesForPrompt,
  getAgentModeAdditions,
  getEffectiveSystemPrompt,
  getToolDiscoveryPromptAddition,
  hasPromptTool,
  partitionPromptTools,
  type PromptTool,
} from "@dotagents/shared/system-prompt-utils"

import { DEFAULT_SYSTEM_PROMPT } from './system-prompts-default'

export { DEFAULT_SYSTEM_PROMPT }

/**
 * Generate ACP routing prompt addition based on available agents.
 * Returns an empty string if no agents are ready.
 */
function getACPRoutingPromptAddition(): string {
  // Get agents from acpService which has runtime status
  const agentStatuses = acpService.getAgents()

  // Filter to only ready agents
  const readyAgents = agentStatuses.filter(a => a.status === 'ready')

  if (readyAgents.length === 0) {
    return ''
  }

  // Format agents for the smart router
  const formattedAgents = readyAgents.map(a => ({
    definition: {
      name: a.config.name,
      displayName: a.config.displayName,
      description: a.config.description || '',
    },
    status: 'ready' as const,
    activeRuns: 0,
  }))

  return acpSmartRouter.generateDelegationPromptAddition(formattedAgents)
}

/**
 * Generate prompt addition for the internal agent.
 * This instructs the agent on when and how to use the internal agent for parallel work.
 */
function getSubSessionPromptAddition(): string {
  const info = getInternalAgentInfo()

  return `
INTERNAL AGENT: Use \`delegate_to_agent\` with \`agentName: "internal"\` to spawn parallel sub-agents. Batch multiple calls for efficiency.
- USE FOR: Independent parallel tasks (analyzing multiple files, researching different topics, divide-and-conquer)
- AVOID FOR: Sequential dependencies, shared state/file conflicts, simple tasks
- LIMITS: Max depth ${info.maxRecursionDepth}, max ${info.maxConcurrent} concurrent per parent
`.trim()
}

/**
 * Generate prompt addition for available agents (delegation-targets).
 * These are agents that can be delegated to via delegate_to_agent.
 * Similar format to tools/skills for easy discoverability.
 */
export function getAgentsPromptAddition(excludeAgentId?: string): string {
  // Get the currently active agent so we can exclude it from delegation targets
  const currentProfile = agentProfileService.getCurrentProfile()
  const excludeId = excludeAgentId ?? currentProfile?.id

  // Get enabled delegation-target profiles, excluding the current agent
  const delegationTargets = agentProfileService.getByRole('delegation-target')
    .filter(p => p.enabled && (!excludeId || p.id !== excludeId))

  if (delegationTargets.length === 0) {
    return ''
  }

  // Format agents in a compact, discoverable format similar to tools/skills
  const agentsList = delegationTargets.map(p => {
    return `- **${p.displayName}**: ${p.description || 'No description'}`
  }).join('\n')

  return `
DELEGATION RULES (PRIORITY — check BEFORE responding):
  - Prefer doing the work directly when you can answer well with your own available tools, especially for simple questions, local lookups, and small tasks
  - Delegate when the user explicitly asks for a specific agent or when an agent has a clear specialty advantage for the task
  - Use delegation for substantial specialized work or for independent subtasks that can run in parallel
  - Match user intent to agent capabilities — e.g., web browsing tasks go to a web browsing agent
  - After delegating, incorporate the result into a complete answer instead of stopping at raw delegate output

AVAILABLE AGENTS (${delegationTargets.length}):
${agentsList}

To delegate: \`delegate_to_agent(agentName: "agent_name", task: "...", workingDirectory?: "path")\`
To prepare only: \`delegate_to_agent(agentName: "agent_name", prepareOnly: true, workingDirectory?: "path")\`
`.trim()
}

export function constructSystemPrompt(
  availableTools: PromptTool[],
  guidelines?: string,
  isAgentMode: boolean = false,
  relevantTools?: PromptTool[],
  customSystemPrompt?: string,
  skillsInstructions?: string,
  agentProperties?: Record<string, string>,
  workingNotes?: KnowledgeNote[],
  excludeAgentId?: string,
): string {
  let prompt = getEffectiveSystemPrompt(DEFAULT_SYSTEM_PROMPT, customSystemPrompt)

  // Inject local date/time so the LLM can reason about relative dates and timestamps.
  const now = new Date()
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
  const compactNow = formatPromptNow(now, tz)
  prompt += `\n\nNow: ${compactNow} ${tz}`

  if (isAgentMode) {
    prompt += getAgentModeAdditions(availableTools)

    const hasDelegationTool = hasPromptTool(availableTools, 'delegate_to_agent') || hasPromptTool(availableTools, 'send_to_agent')

    if (hasDelegationTool) {
      // Add ACP agent delegation information if agents are available
      const acpPromptAddition = getACPRoutingPromptAddition()
      if (acpPromptAddition) {
        prompt += '\n\n' + acpPromptAddition
      }

      // Add agents (delegation-targets) in a discoverable format
      // Pass excludeAgentId so sub-sessions don't list themselves as delegation targets
      const agentsAddition = getAgentsPromptAddition(excludeAgentId)
      if (agentsAddition) {
        prompt += '\n\n' + agentsAddition
      }

      // Add internal sub-session instructions when delegation is available
      prompt += '\n\n' + getSubSessionPromptAddition()
    }
  }

  // Add agent skills instructions if provided
  // Skills are injected early in the prompt so they can influence tool usage behavior
  if (skillsInstructions?.trim()) {
    prompt += `\n\n${skillsInstructions.trim()}`
  }

  // Add working notes if provided.
  // Only a tiny subset of context:auto knowledge notes should be injected at runtime.
  const formattedWorkingNotes = formatWorkingNotesForPrompt(workingNotes || [])
  if (formattedWorkingNotes) {
    prompt += `\n\nWORKING NOTES:\nThese were injected from ~/.agents/knowledge/ and/or ./.agents/knowledge/ because their frontmatter sets context: auto. Prefer note summaries when present, keep this subset tiny, and leave most notes as context: search-only.\n\n${formattedWorkingNotes}`
  }

  if (availableTools.length > 0) {
    const { externalTools, runtimeTools } = partitionPromptTools(availableTools)

    if (externalTools.length > 0) {
      prompt += `\n\nAVAILABLE MCP TOOLS (${externalTools.length} tools total):\n${formatLightweightMcpToolInfo(externalTools)}`
    }

    if (runtimeTools.length > 0) {
      prompt += `\n\nDOTAGENTS TOOLS: ${formatRuntimeToolInfo(runtimeTools)}`
    }

    const toolDiscoveryPromptAddition = getToolDiscoveryPromptAddition(availableTools)
    if (toolDiscoveryPromptAddition) {
      prompt += `\n\n${toolDiscoveryPromptAddition}`
    }

    // If relevant tools are identified, show them with full details
    if (
      relevantTools &&
      relevantTools.length > 0 &&
      relevantTools.length < availableTools.length
    ) {
      prompt += `\n\nMOST RELEVANT TOOLS FOR THIS REQUEST:\n${formatFullPromptToolInfo(relevantTools)}`
    }
  } else {
    prompt += `\n\nNo tools are currently available.`
  }

  // Add user guidelines if provided (with proper section header)
  if (guidelines?.trim()) {
    prompt += `\n\nUSER GUIDELINES:\n${guidelines.trim()}`
  }

  // Add agent properties if provided (dynamic key-value pairs)
  if (agentProperties && Object.keys(agentProperties).length > 0) {
    const propertiesText = Object.entries(agentProperties)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n\n')
    prompt += `\n\nAGENT PROPERTIES:\n${propertiesText}`
  }

  return prompt
}

/**
 * Construct a compact minimal system prompt that preserves tool and parameter names
 * Used for context summarization when full prompt is too long
 */
export function constructMinimalSystemPrompt(
  availableTools: PromptTool[],
  isAgentMode: boolean = false,
  relevantTools?: PromptTool[],
  skillsIndex?: string,
): string {
  // IMPORTANT: This prompt is a last-resort fallback used when the full system prompt
  // cannot fit in the model context window. It must preserve the core policies:
  // - Use tools proactively to complete tasks
  // - Work iteratively until goals are fully achieved
  // - Preserve skills discoverability (IDs) so skills aren't silently dropped
  let prompt =
    "You are an autonomous AI assistant that uses tools to complete tasks. Work iteratively until goals are fully achieved. " +
    "Use tools proactively - prefer tools over asking users for information you can gather yourself. " +
    "When calling tools, use exact tool names and parameter keys. Be concise. Batch independent tool calls when possible. " +
    "You are highly autonomous and proactive. Make as many tool calls as needed to completely finish the task. Do NOT stop to ask the user for permission or confirmation. Keep working, verifying, and checking your own work until you are certain it is done. " +
    "Before asking the user for facts, check relevant knowledge notes and prior conversations first; if user/project-specific facts are still missing, do not ask for permission, only ask the minimum high-signal follow-ups. " +
    "Durable knowledge lives in ~/.agents/knowledge/ and ./.agents/knowledge/ as notes at .agents/knowledge/<slug>/<slug>.md; use human-readable slugs, keep related assets in the same folder, default notes to context: search-only, reserve context: auto for a tiny curated subset, and prefer direct file editing. Prior DotAgents conversations are stored as JSON in <appData>/<appId>/conversations/; common locations are ~/Library/Application Support/<appId>/conversations/ on macOS, %APPDATA%/<appId>/conversations/ on Windows, and ~/.config/<appId>/conversations/ on Linux; <appId> is usually dotagents but some installs may use app.dotagents, so infer the real local folder when needed; use index.json to find relevant conversations and open matching conv_*.json files for full history. DotAgents configuration lives in the layered ~/.agents/ and ./.agents/ filesystem; workspace overrides global on conflicts; prefer direct file editing for settings, models, prompts, agents, skills, tasks, and knowledge notes; and when available load the dotagents-config-admin skill before changing unfamiliar DotAgents config."

  if (isAgentMode) {
    prompt += " Agent mode: continue calling tools until the task is completely resolved. If a tool fails, try alternative approaches before giving up. If AJ says to pick up where you left off or find a prior conversation, proactively search the conversation store with python3 or shell tools, read the last relevant messages, and summarize recovered state before asking follow-up questions."
  }

  // Preserve skills policy + IDs under Tier-3 shrinking (only if skills exist).
  if (skillsIndex?.trim()) {
    prompt +=
      " Skills are optional instruction modules. Call load_skill_instructions({ skillId: \"<id>\" }) at most once per skill per agent session, using the exact id shown before the dash. If already loaded, reuse the prior instructions."
    prompt += `\n\nAVAILABLE SKILLS:\n${skillsIndex.trim()}`
  }

  if (availableTools?.length) {
    const { externalTools, runtimeTools } = partitionPromptTools(availableTools)

    if (externalTools.length > 0) {
      prompt += `\n\nAVAILABLE MCP TOOLS:\n${formatMinimalPromptToolList(externalTools)}`
    }

    if (runtimeTools.length > 0) {
      prompt += `\n\nAVAILABLE DOTAGENTS RUNTIME TOOLS:\n${formatMinimalPromptToolList(runtimeTools)}`
    }
  } else {
    prompt += `\n\nNo tools are currently available.`
  }

  if (
    relevantTools &&
    relevantTools.length > 0 &&
    availableTools &&
    relevantTools.length < availableTools.length
  ) {
    prompt += `\n\nMOST RELEVANT:\n${formatMinimalPromptToolList(relevantTools)}`
  }

  return prompt
}
