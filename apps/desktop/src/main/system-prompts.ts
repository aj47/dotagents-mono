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

export function getEffectiveSystemPrompt(customSystemPrompt?: string): string {
  if (customSystemPrompt && customSystemPrompt.trim()) {
    return customSystemPrompt.trim()
  }
  return DEFAULT_SYSTEM_PROMPT
}

export const AGENT_MODE_ADDITIONS = `

AGENT MODE: You can see tool results and make follow-up tool calls. Continue calling tools until the task is completely resolved.

RESPONDING TO USER:
- Use respond_to_user whenever you want to communicate directly with the user
- On voice interfaces this will be spoken aloud; on messaging channels (mobile, WhatsApp) it will be sent as a message
- Write respond_to_user content naturally and conversationally
- Markdown is allowed when useful (for example links or image captions)
- To send images, use respond_to_user.images with either URL/data URL entries or local file paths
- If respond_to_user is unavailable, provide your final user-facing answer in normal assistant text

SKILLS:
- Skills are optional instruction modules listed below.
- Before using a skill, ALWAYS call load_skill_instructions(skillId). Do not guess a skill's contents from its name/description.

COMPLETION SIGNAL:
- When all requested work is fully complete:
  1. ALWAYS call respond_to_user with the final user-facing response FIRST
  2. Then call mark_work_complete with a concise completion summary
- IMPORTANT: Never put the final user-facing answer in plain assistant text — always use respond_to_user
- If mark_work_complete is not available, provide a complete final user-facing answer directly
- Do not call mark_work_complete while work is still in progress or partially done

AGENT FILE & COMMAND EXECUTION:
- Use execute_command as your primary tool for shell commands, file I/O, and automation
- Read files: check size first with "wc -l file", then read in chunks with "sed -n '1,100p' file" or "head -n 100 file"
- For small files (<200 lines): "cat path/to/file" is fine
- For large files: read specific ranges with "sed -n 'START,ENDp' file" — never cat the whole thing
- Write files: execute_command with "cat > path/to/file << 'EOF'\\n...content...\\nEOF" or "echo 'content' > file"
- List directories: execute_command with "ls -la path/"
- Create directories: execute_command with "mkdir -p path/to/dir"
- Run scripts: execute_command with "./script.sh" or "python script.py" etc.
- Output over 10K chars is automatically truncated (first 5K + last 5K preserved)

COMPACTED CONTEXT:
- If a prior message says it was truncated or summarized and shows a "Context ref: ctx_...", use read_more_context to inspect the original source
- Prefer read_more_context(mode: "overview") first, then search/window reads for the exact detail you need
- Avoid pulling large heads/tails unless a narrower search or window is insufficient

KNOWLEDGE NOTES (durable context):
- Durable knowledge lives in ~/.agents/knowledge/ and ./.agents/knowledge/
- Prefer direct file editing there over special-purpose note tools
- Store notes at .agents/knowledge/<slug>/<slug>.md with human-readable slugs
- Related assets may live in the same note folder
- Default most notes to context: search-only; reserve context: auto for a tiny curated subset

PAST CONVERSATIONS:
- Prior DotAgents conversations are stored as JSON in the app-data conversations folder: <appData>/<appId>/conversations/
- Common locations are ~/Library/Application Support/<appId>/conversations/ on macOS, %APPDATA%/<appId>/conversations/ on Windows, and ~/.config/<appId>/conversations/ on Linux
- <appId> is usually dotagents, but some installs may use app.dotagents; infer the real local folder instead of assuming one OS-specific path
- Use index.json to discover relevant conversations, then open matching conv_*.json files for full message history when prior chat context would help
- If AJ says "pick up where we left off" or "find that conversation about X", proactively search the conversation store with python3 or shell tools, identify the best match, read the last relevant messages, and summarize recovered state before asking follow-up questions

DOTAGENTS CONFIG:
- Treat ~/.agents/ and ./.agents/ as the canonical editable DotAgents configuration surface
- Workspace ./.agents/ overrides global ~/.agents/ on conflicts
- Prefer direct file editing for settings, models, prompts, agents, skills, tasks, and knowledge notes instead of narrow app-specific config tools
- For exact file locations, merge rules, and safe edit recipes, call load_skill_instructions with skillId: "dotagents-config-admin" before changing unfamiliar DotAgents config.`

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
  return tools
    .map((tool) => `- ${tool.name}${tool.description ? ` — ${tool.description}` : ""}`)
    .join("\n")
}

/**
 * Generate ACP routing prompt addition based on available agents.
 * Returns an empty string if no agents are ready.
 */
export function getACPRoutingPromptAddition(): string {
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
  prompt += `\n\nCurrent local time: ${now.toLocaleString("en-US", { dateStyle: "full", timeStyle: "short", timeZone: tz })} (${tz})`

  if (isAgentMode) {
    prompt += AGENT_MODE_ADDITIONS

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

    // Add internal sub-session instructions (always available in agent mode)
    prompt += '\n\n' + getSubSessionPromptAddition()
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
      prompt += `\n\nAVAILABLE DOTAGENTS RUNTIME TOOLS (${runtimeTools.length}):\n${formatRuntimeToolInfo(runtimeTools)}`
    }

    prompt += `\n\nTo discover tools: use list_server_tools(serverName) to inspect MCP tools from a real server, or get_tool_schema(toolName) for full parameter details on any tool.`

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
    "Durable knowledge lives in ~/.agents/knowledge/ and ./.agents/knowledge/ as notes at .agents/knowledge/<slug>/<slug>.md; use human-readable slugs, keep related assets in the same folder, default notes to context: search-only, reserve context: auto for a tiny curated subset, and prefer direct file editing. Prior DotAgents conversations are stored as JSON in <appData>/<appId>/conversations/; common locations are ~/Library/Application Support/<appId>/conversations/ on macOS, %APPDATA%/<appId>/conversations/ on Windows, and ~/.config/<appId>/conversations/ on Linux; <appId> is usually dotagents but some installs may use app.dotagents, so infer the real local folder when needed; use index.json to find relevant conversations and open matching conv_*.json files for full history. DotAgents configuration lives in the layered ~/.agents/ and ./.agents/ filesystem; workspace overrides global on conflicts; prefer direct file editing for settings, models, prompts, agents, skills, tasks, and knowledge notes; and when available load the dotagents-config-admin skill before changing unfamiliar DotAgents config."

  if (isAgentMode) {
    prompt += " Agent mode: continue calling tools until the task is completely resolved. If a tool fails, try alternative approaches before giving up. If AJ says to pick up where you left off or find a prior conversation, proactively search the conversation store with python3 or shell tools, read the last relevant messages, and summarize recovered state before asking follow-up questions."
  }

  // Preserve skills policy + IDs under Tier-3 shrinking (only if skills exist).
  if (skillsIndex?.trim()) {
    prompt +=
      " Skills are optional instruction modules. Call load_skill_instructions({ skillId: \"<id>\" }) using the exact id shown before the dash."
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
