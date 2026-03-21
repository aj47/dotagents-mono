/**
 * ACP Smart Router - Generates delegation prompt additions for ACP agents.
 */

import type { ACPAgentDefinition } from './types'

type ACPAgentForDelegationPrompt = {
  definition: {
    name: ACPAgentDefinition['name']
    displayName?: ACPAgentDefinition['displayName'] | undefined
    description?: ACPAgentDefinition['description'] | undefined
  }
}

/**
 * Smart router for ACP agent delegation decisions.
 */
export class ACPSmartRouter {
  /**
   * Generate system prompt text describing available agents.
   * This text can be injected into the main AI's system prompt to inform it
   * about delegation options.
   *
   * @param availableAgents - List of agents to include in the prompt
   * @returns Formatted string for system prompt injection
   *
   * @example
   * ```typescript
   * const agents = acpRegistry.getReadyAgents()
   * const promptAddition = acpSmartRouter.generateDelegationPromptAddition(agents)
   * // Returns: "You have access to the following specialized agents..."
   * ```
   */
  generateDelegationPromptAddition(availableAgents: ReadonlyArray<ACPAgentForDelegationPrompt>): string {
    if (availableAgents.length === 0) {
      return ''
    }

    const agentDescriptions = availableAgents.map(agent => {
      const def = agent.definition
      return `- **${def.displayName ?? def.name}**: ${def.description || 'No description available'}`
    }).join('\n')

    return `
## Available Specialized Agents

You have access to the following specialized agents that can help with specific tasks.
Consider delegating work to these agents when appropriate:

${agentDescriptions}

### When to Delegate
- Use the **research** agent for information gathering, web searches, and fact-finding
- Use the **coding** agent for complex programming tasks, debugging, or code generation
- Use the **analysis** agent for data analysis, comparisons, and evaluations
- Use the **writing** agent for document creation, summarization, and content drafting

### How to Delegate
Use delegate_to_agent with agentName and a clear task description.
If work must run in a specific path, pass workingDirectory.
Use prepareOnly: true when you only need to warm up/spawn the agent without running a task.
Use waitForResult: true when the delegated result is needed before your next step or user reply.
If you start background work with waitForResult: false, continue other work and only check status sparingly; never poll in a tight loop.
`.trim()
  }
}

/** Singleton instance of the ACP smart router */
export const acpSmartRouter = new ACPSmartRouter()
