/**
 * Desktop system-prompts adapter.
 *
 * Re-exports core functions and augments constructSystemPrompt with
 * ACP/profile-service dependent additions.
 */

import { acpSmartRouter } from './acp/acp-smart-router'
import { acpService } from './acp-service'
import { getInternalAgentInfo } from './acp/internal-agent'
import { agentProfileService } from './agent-profile-service'
import type { AgentMemory } from "../shared/types"

// Re-export core utilities directly
export {
  DEFAULT_SYSTEM_PROMPT,
  getEffectiveSystemPrompt,
  AGENT_MODE_ADDITIONS,
  constructMinimalSystemPrompt,
  constructSystemPrompt as constructSystemPromptCore,
} from '@dotagents/core'
export type { SystemPromptAdditions } from '@dotagents/core'

/**
 * Generate ACP routing prompt addition based on available agents.
 * Returns an empty string if no agents are ready.
 */
export function getACPRoutingPromptAddition(): string {
  const agentStatuses = acpService.getAgents()
  const readyAgents = agentStatuses.filter(a => a.status === 'ready')

  if (readyAgents.length === 0) {
    return ''
  }

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
 */
export function getSubSessionPromptAddition(): string {
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
 */
export function getAgentsPromptAddition(excludeAgentId?: string): string {
  const currentProfile = agentProfileService.getCurrentProfile()
  const excludeId = excludeAgentId ?? currentProfile?.id

  const delegationTargets = agentProfileService.getByRole('delegation-target')
    .filter(p => p.enabled && (!excludeId || p.id !== excludeId))

  if (delegationTargets.length === 0) {
    return ''
  }

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

import { constructSystemPrompt as constructSystemPromptFromCore, type SystemPromptAdditions } from '@dotagents/core'

/**
 * Desktop wrapper that auto-injects ACP/profile additions.
 * Matches the original desktop signature for backward compatibility.
 */
export function constructSystemPrompt(
  availableTools: Array<{
    name: string
    description: string
    inputSchema?: any
  }>,
  guidelines?: string,
  isAgentMode: boolean = false,
  relevantTools?: Array<{
    name: string
    description: string
    inputSchema?: any
  }>,
  customSystemPrompt?: string,
  skillsInstructions?: string,
  agentProperties?: Record<string, string>,
  memories?: AgentMemory[],
  excludeAgentId?: string,
): string {
  // Compute ACP/profile additions for the core function
  const additions: SystemPromptAdditions = isAgentMode
    ? {
        acpRoutingPrompt: getACPRoutingPromptAddition() || undefined,
        agentsDelegationPrompt: getAgentsPromptAddition(excludeAgentId) || undefined,
        subSessionPrompt: getSubSessionPromptAddition() || undefined,
      }
    : {}

  return constructSystemPromptFromCore(
    availableTools,
    guidelines,
    isAgentMode,
    relevantTools,
    customSystemPrompt,
    skillsInstructions,
    agentProperties,
    memories,
    additions,
  )
}
