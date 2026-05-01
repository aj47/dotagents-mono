import { acpSmartRouter } from './acp/acp-smart-router'
import { acpService } from './acp-service'
import { getInternalAgentInfo } from './acp/internal-agent'
import { agentProfileService } from './agent-profile-service'
import type { KnowledgeNote } from "@dotagents/core"

import { DEFAULT_SYSTEM_PROMPT } from './system-prompts-default'

export { DEFAULT_SYSTEM_PROMPT }

/**
 * Format working knowledge notes for system prompt injection.
 * Prefers frontmatter summaries and falls back to a compact title/body excerpt.
 */
function normalizePromptNoteText(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[`*_>#]/g, '')
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function truncatePromptNoteText(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text
  return `${text.slice(0, Math.max(0, maxChars - 3)).trimEnd()}...`
}

function formatWorkingNotesForPrompt(notes: KnowledgeNote[], maxNotes: number = 6): string {
  if (!notes || notes.length === 0) return ""

  return notes
    .filter((note) => note.context === "auto")
    .slice(0, maxNotes)
    .map((note) => {
      const summary = truncatePromptNoteText(normalizePromptNoteText(note.summary ?? ''), 180)
      const body = truncatePromptNoteText(normalizePromptNoteText(note.body), 140)
      const fallback = body ? `${note.title}: ${body}` : note.title
      return `- [${note.id}] ${summary || fallback}`
    })
    .join("\n")
}

function getEffectiveSystemPrompt(customSystemPrompt?: string): string {
  if (customSystemPrompt && customSystemPrompt.trim()) {
    return customSystemPrompt.trim()
  }
  return DEFAULT_SYSTEM_PROMPT
}

function formatDateTimeForPrompt(date: Date, timeZone: string): string {
  const formatter = new Intl.DateTimeFormat('en-US-u-nu-latn', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  const parts: Record<string, string> = {}

  for (const part of formatter.formatToParts(date)) {
    if (part.type !== 'literal') {
      parts[part.type] = part.value
    }
  }

  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`
}

type PromptTool = {
  name: string
  description?: string
  inputSchema?: any
}

function hasPromptTool(tools: PromptTool[], toolName: string): boolean {
  return tools.some((tool) => tool.name === toolName)
}

function getToolDiscoveryPromptAddition(availableTools: PromptTool[]): string {
  const hasListServerTools = hasPromptTool(availableTools, 'list_server_tools')
  const hasGetToolSchema = hasPromptTool(availableTools, 'get_tool_schema')

  if (hasListServerTools && hasGetToolSchema) {
    return 'To discover tools: use list_server_tools(serverName) to inspect MCP tools from a real server, or get_tool_schema(toolName) for full parameter details on any available tool.'
  }

  if (hasListServerTools) {
    return 'To discover MCP tools from a real server, use list_server_tools(serverName).'
  }

  if (hasGetToolSchema) {
    return 'To inspect exact parameters for an available tool, use get_tool_schema(toolName).'
  }

  return ''
}

function getAgentModeAdditions(availableTools: PromptTool[]): string {
  const hasRespondToUser = hasPromptTool(availableTools, 'respond_to_user')
  const hasMarkWorkComplete = hasPromptTool(availableTools, 'mark_work_complete')
  const hasExecuteCommand = hasPromptTool(availableTools, 'execute_command')
  const hasLoadSkillInstructions = hasPromptTool(availableTools, 'load_skill_instructions')
  const hasReadMoreContext = hasPromptTool(availableTools, 'read_more_context')

  const sections = [
    'AGENT MODE: You can see tool results and make follow-up tool calls. Continue calling tools until the task is completely resolved.',
    `STATUS & CONTINUATION TURNS:
- When the current user message is asking for status, current state, what happened, why something failed, or the next safe step, answer from existing conversation evidence whenever it is sufficient
- Do not resume the broader original task or start exploratory work just because tools are available
- If more evidence is necessary, make at most one narrow read-only probe before responding
- If an approval boundary is active, mention it explicitly in the status answer and do not offer mutating next actions except as pending approval
- In the response, state what is known, what is unknown, the latest blocker, and the next safe action while preserving any active approval boundary`,
  ]

  if (hasRespondToUser) {
    sections.push(`RESPONDING TO USER:
- Use respond_to_user for direct user-facing messages
- Write natural, concise text; Markdown/images are allowed when useful`)
  } else {
    sections.push(`RESPONDING TO USER:
- No direct user-response tool is available in this run. Put the final user-facing answer in normal assistant text.`)
  }

  if (hasLoadSkillInstructions) {
    sections.push(`SKILLS:
- Skills are optional modules listed below; before using one, call load_skill_instructions(skillId) at most once per session, reuse successful loads, and retry only after failure or explicit reload request.
- If a skill exists on disk but cannot load, diagnose runtime skills-registry/refresh first; recommend refresh/restart/import before recreating or rewriting it.
- Do not infer a skill's contents from name/description.`)
  }

  if (hasRespondToUser && hasMarkWorkComplete) {
    sections.push(`COMPLETION SIGNAL:
- When all requested work is fully complete, call respond_to_user with the final answer first, then mark_work_complete with a concise internal summary
- Never put the final user-facing answer in plain assistant text when respond_to_user is available
- Do not call mark_work_complete for partial/in-progress work or send a second recap unless asked`)
  } else if (hasRespondToUser) {
    sections.push(`COMPLETION SIGNAL:
- When all requested work is fully complete, call respond_to_user with the final user-facing response.
- There is no separate completion tool in this run, so do not continue looping after that final response.`)
  } else if (hasMarkWorkComplete) {
    sections.push(`COMPLETION SIGNAL:
 - When all requested work is fully complete, provide the complete final user-facing answer in normal assistant text, then call mark_work_complete with a concise internal completion summary.
 - Do not send a second recap or post-completion summary unless the user explicitly asked for one.
- Do not call mark_work_complete while work is still in progress or partially done.`)
  } else {
    sections.push(`COMPLETION SIGNAL:
- When all requested work is fully complete, provide the complete final user-facing answer in normal assistant text and stop.`)
  }

  if (hasExecuteCommand) {
    sections.push(`AGENT FILE & COMMAND EXECUTION:
- Use execute_command for shell/file automation. Infer package manager from lockfiles (pnpm-lock.yaml, package-lock.json, yarn.lock, bun.lock*) and do not default to npm against another lockfile.
- For planning/status/context, prefer read-only probes (git status, ls, find, rg, sed/head/tail/cat). Do not run install/test/build/lint/typecheck unless asked or validating your code changes.
- Before reading large files, check size (wc -l) and read targeted ranges with sed/head/tail; avoid cat on large files. Output over 10K chars is truncated.`)
  }

  if (hasReadMoreContext) {
    sections.push(`COMPACTED CONTEXT:
- If a prior message says it was truncated or summarized and shows a "Context ref: ctx_...", use read_more_context to inspect the original source
- Prefer read_more_context(mode: "overview") first, then search/window reads for the exact detail you need
- Avoid pulling large heads/tails unless a narrower search or window is insufficient`)
  }

  sections.push(`LOCAL MEMORY & CONFIG:
- Durable notes live in ~/.agents/knowledge/ and ./.agents/knowledge/; edit note/config files directly and keep context:auto rare
- Prior conversations live under <appData>/<appId>/conversations/; infer the appId/path, search index.json then conv_*.json, and recover state before asking when the user wants to resume prior work
- DotAgents config is layered ~/.agents/ plus workspace ./.agents/ when DOTAGENTS_WORKSPACE_DIR is set; for unfamiliar config edits, load dotagents-config-admin if available`)

  return `\n\n${sections.join('\n\n')}`
}

/**
 * Split tools into external MCP tools and DotAgents runtime tools.
 */
function partitionPromptTools(
  tools: Array<{ name: string; description?: string; inputSchema?: any }>,
): {
  externalTools: Array<{ name: string; description?: string; inputSchema?: any }>
  runtimeTools: Array<{ name: string; description?: string; inputSchema?: any }>
} {
  return {
    externalTools: tools.filter((tool) => tool.name.includes(":")),
    runtimeTools: tools.filter((tool) => !tool.name.includes(":")),
  }
}

/**
 * Group external MCP tools by server and generate a brief description for each server.
 */
function getServerSummaries(
  tools: Array<{ name: string; description?: string; inputSchema?: any }>,
): Array<{ serverName: string; toolCount: number; toolNames: string[] }> {
  const serverMap = new Map<string, string[]>()

  for (const tool of tools) {
    const separatorIndex = tool.name.indexOf(":")
    if (separatorIndex === -1) continue
    const serverName = tool.name.slice(0, separatorIndex)
    const toolName = tool.name.slice(separatorIndex + 1)
    if (!serverMap.has(serverName)) {
      serverMap.set(serverName, [])
    }
    serverMap.get(serverName)!.push(toolName)
  }

  return Array.from(serverMap.entries()).map(([serverName, toolNames]) => ({
    serverName,
    toolCount: toolNames.length,
    toolNames,
  }))
}

/**
 * Format external MCP tools in a lightweight, server-centric way.
 */
function formatLightweightMcpToolInfo(
  tools: Array<{ name: string; description?: string; inputSchema?: any }>,
): string {
  const serverSummaries = getServerSummaries(tools)

  return serverSummaries
    .map((server) => {
      const toolList = server.toolNames.join(", ")
      return `- ${server.serverName} (${server.toolCount} tools): ${toolList}`
    })
    .join("\n")
}

/**
 * Format DotAgents runtime tools as plain tools rather than as a fake MCP server.
 */
function formatRuntimeToolInfo(
  tools: Array<{ name: string; description?: string; inputSchema?: any }>,
): string {
  return tools.map((tool) => tool.name).join(", ")
}

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
  workingNotes?: KnowledgeNote[],
  excludeAgentId?: string,
): string {
  let prompt = getEffectiveSystemPrompt(customSystemPrompt)

  // Inject local date/time so the LLM can reason about relative dates and timestamps.
  const now = new Date()
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
  const compactNow = formatDateTimeForPrompt(now, tz)
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

  // Format full tool info for relevant tools only (when provided)
  const formatFullToolInfo = (
    tools: Array<{ name: string; description: string; inputSchema?: any }>,
  ) => {
    return tools
      .map((tool) => {
        let info = `- ${tool.name}: ${tool.description}`
        if (tool.inputSchema?.properties) {
          const params = Object.entries(tool.inputSchema.properties)
            .map(([key, schema]: [string, any]) => {
              const type = schema.type || "any"
              const required = tool.inputSchema.required?.includes(key)
                ? " (required)"
                : ""
              return `${key}: ${type}${required}`
            })
            .join(", ")
          if (params) {
            info += `\n  Parameters: {${params}}`
          }
        }
        return info
      })
      .join("\n")
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
      prompt += `\n\nMOST RELEVANT TOOLS FOR THIS REQUEST:\n${formatFullToolInfo(relevantTools)}`
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
  availableTools: Array<{
    name: string
    description?: string
    inputSchema?: any
  }>,
  isAgentMode: boolean = false,
  relevantTools?: Array<{
    name: string
    description?: string
    inputSchema?: any
  }>,
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

  const list = (tools: Array<{ name: string; inputSchema?: any }>) =>
    tools
      .map((t) => {
        const keys = t.inputSchema?.properties
          ? Object.keys(t.inputSchema.properties)
          : []
        const params = keys.join(", ")
        return params ? `- ${t.name}(${params})` : `- ${t.name}()`
      })
      .join("\n")

  if (availableTools?.length) {
    const { externalTools, runtimeTools } = partitionPromptTools(availableTools)

    if (externalTools.length > 0) {
      prompt += `\n\nAVAILABLE MCP TOOLS:\n${list(externalTools)}`
    }

    if (runtimeTools.length > 0) {
      prompt += `\n\nAVAILABLE DOTAGENTS RUNTIME TOOLS:\n${list(runtimeTools)}`
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
    prompt += `\n\nMOST RELEVANT:\n${list(relevantTools)}`
  }

  return prompt
}
