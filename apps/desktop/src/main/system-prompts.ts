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

function formatPromptNow(now: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-US-u-ca-gregory-nu-latn', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now)

  const getPart = (type: Intl.DateTimeFormatPartTypes): string => {
    const value = parts.find((part) => part.type === type)?.value
    if (!value) throw new Error(`Missing ${type} while formatting prompt timestamp`)
    return value
  }

  return `${getPart('year')}-${getPart('month')}-${getPart('day')} ${getPart('hour')}:${getPart('minute')}`
}

type PromptTool = {
  name: string
  description?: string
  inputSchema?: any
}

function hasPromptTool(tools: PromptTool[], toolName: string): boolean {
  return tools.some((tool) => tool.name === toolName)
}

function getAgentModeAdditions(availableTools: PromptTool[]): string {
  const hasRespondToUser = hasPromptTool(availableTools, 'respond_to_user')
  const hasMarkWorkComplete = hasPromptTool(availableTools, 'mark_work_complete')
  const hasExecuteCommand = hasPromptTool(availableTools, 'execute_command')
  const hasReadMoreContext = hasPromptTool(availableTools, 'read_more_context')
  const hasSetSessionTitle = hasPromptTool(availableTools, 'set_session_title')
  const hasGoalOrchestratorTools = hasPromptTool(availableTools, 'create_goal')
    || hasPromptTool(availableTools, 'create_work_item')
    || hasPromptTool(availableTools, 'run_goal_orchestrator')
  const hasRepeatTaskTools = hasPromptTool(availableTools, 'create_repeat_task')
    || hasPromptTool(availableTools, 'update_repeat_task')
    || hasPromptTool(availableTools, 'run_repeat_task')

  const sections = [
    'AGENT MODE: You can see tool results and make follow-up tool calls. Continue calling tools until the task is completely resolved.',
    `STATUS & CONTINUATION TURNS:
- When the current user message is asking for status, current state, what happened, why something failed, or the next safe step, answer from existing conversation evidence whenever it is sufficient
- When the current user message asks to verify/debate/debug a specific issue, answer that issue directly and do not append next-safe-action boilerplate unless the user asks for next steps
- Do not resume the broader original task or start exploratory work just because tools are available
- If more evidence is necessary, make at most one narrow read-only probe before responding
- If an approval boundary is active, mention it explicitly in the status answer and do not offer mutating next actions except as pending approval
- In the response, state what is known, what is unknown, the latest blocker, and the next safe action while preserving any active approval boundary`,
  ]

  if (hasRespondToUser) {
    sections.push(`RESPONDING TO USER:
- Normal assistant text is valid user-facing output for ordinary chat, simple questions, and final answers
- Use respond_to_user when you specifically need explicit voice/messaging delivery semantics or need to attach images/videos
- On voice interfaces this will be spoken aloud; on messaging channels (mobile, WhatsApp) it will be sent as a message
- Write respond_to_user content naturally and conversationally
- Markdown is allowed when useful (for example links or image captions)
- To send images, use respond_to_user.images with either URL/data URL entries or local file paths
- MEDIA DELIVERY: When your final output includes generated, downloaded, or fetched media assets (images, videos, screenshots, thumbnails), prefer delivering them inline through respond_to_user.images / respond_to_user.videos rather than only returning a local filepath
- Treat local paths as a secondary reference for follow-up, not the primary delivery mechanism — include them alongside the inline asset when useful, but do not rely on a bare path when inline display is supported
- Only fall back to path-only responses when inline display/attachment is genuinely unavailable (unsupported media type, or the user explicitly asked for a path)`)
  } else {
    sections.push(`RESPONDING TO USER:
- No direct user-response tool is available in this run. Put the final user-facing answer in normal assistant text.`)
  }

  if (hasRespondToUser && hasMarkWorkComplete) {
    sections.push(`COMPLETION SIGNAL:
- When all requested work is fully complete, a normal assistant text final answer is valid and may be the only response
- For tool-driven work where an explicit completion signal is useful, call mark_work_complete with a concise internal completion summary after delivering the final answer
- If you use respond_to_user for the final answer, do not duplicate that same answer in plain assistant text
- Do not send a second recap or post-completion summary unless the user explicitly asked for one
- Do not call mark_work_complete while work is still in progress or partially done`)
  } else if (hasRespondToUser) {
    sections.push(`COMPLETION SIGNAL:
- When all requested work is fully complete, provide the final user-facing response in normal assistant text or via respond_to_user when explicit delivery semantics are needed.
- There is no separate completion tool in this run, so do not continue looping after that final response.`)
  } else if (hasMarkWorkComplete) {
    sections.push(`COMPLETION SIGNAL:
- When all requested work is fully complete, provide the complete final user-facing answer in normal assistant text first. For tool-driven work, you may then call mark_work_complete with a concise internal completion summary.
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
- Before reading large files, check size (wc -l) and read targeted ranges with sed/head/tail; avoid cat on large files. Output over 10K chars is truncated.
- Skills, settings, knowledge, tasks, prompts, runtime metadata, and past conversations are files. Use the absolute paths shown in this prompt when available; otherwise discover with filesystem search.
- For rare runtime discovery, inspect $DOTAGENTS_RUNTIME_DIR, $DOTAGENTS_AGENT_REGISTRY, $DOTAGENTS_TOOL_MANIFEST, or $DOTAGENTS_TOOL_SCHEMA_DIR with execute_command instead of expecting list/schema helper tools.`)
  }

  if (hasSetSessionTitle) {
    sections.push(`SESSION TITLE:
- When the task becomes clear, set a concise useful title with set_session_title early enough to improve the UI
- Keep titles short and specific; do not call set_session_title again with the same title
- Update later only if the conversation topic materially shifts and the title should change`)
  }

  if (hasReadMoreContext) {
    sections.push(`COMPACTED CONTEXT:
- If a prior message says it was truncated or summarized and shows a "Context ref: ctx_...", use read_more_context to inspect the original source
- If the needed detail or exact query is already known, call read_more_context(mode: "search") directly; use mode: "overview" first only when you need orientation before choosing a query/window
- Avoid pulling large heads/tails unless a narrower search or window is insufficient`)
  }

  if (hasGoalOrchestratorTools || hasRepeatTaskTools) {
    sections.push(`GOALS, WORK ITEMS & REPEAT TASKS:
- When the user asks to create, update, schedule, run, or answer goal/work/decision/repeat-task items, use the available runtime tools directly instead of only describing a next safe action
- For status-only questions, report the known state and next safe action without mutating state unless the user also asks you to do it
- Use Goal Orchestrator tools for durable goals, work items, decisions, and immediate orchestrator wake-ups
- Use repeat-task tools for scheduling automation; for Goal Orchestrator scheduling, create a repeat task with goalOrchestrator=true so the task wakes the orchestrator
- Before updating an existing goal, work item, decision, or repeat task by title/name, read the corresponding snapshot/list when needed and resolve exact matches`)
  }

  sections.push(`LOCAL MEMORY & CONFIG:
- Durable notes live in configured knowledge roots, defaulting to global/workspace .agents/knowledge; edit note/config files directly and keep context:auto rare
- Prior conversations live under the runtime-supplied conversations directory; whenever you need more context to answer or proceed - including continuation, status, debugging, and high-context planning - search index.json then conv_*.json as a standard step before asking the user, and use the recovered context to answer or continue when sufficient. Only ask the user when prior conversations do not contain the needed facts, or when credentials/approval are required. Always prefer knowledge notes over recalled conversation context when they conflict.
- For personal legal/immigration, health, finance, career, or other high-context planning, inspect both knowledge notes and recent conversations with execute_command before generic advice
- DotAgents config is layered global .agents plus workspace .agents when DOTAGENTS_WORKSPACE_DIR is set; for unfamiliar config edits, read the dotagents-config-admin SKILL.md path if it is listed under Available Skills`)

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
  filesystemContext?: string,
): string {
  let prompt = getEffectiveSystemPrompt(customSystemPrompt)

  // Inject local date/time so the LLM can reason about relative dates and timestamps.
  const now = new Date()
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
  const compactNow = formatPromptNow(now, tz)
  prompt += `\n\nNow: ${compactNow} ${tz}`

  if (filesystemContext?.trim()) {
    prompt += `\n\nFILESYSTEM LOCATIONS:\n${filesystemContext.trim()}`
  }

  if (isAgentMode) {
    prompt += getAgentModeAdditions(availableTools)

    const hasDelegationTool = hasPromptTool(availableTools, 'delegate_to_agent')

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
    prompt += `\n\nWORKING NOTES:\nThese were injected from configured knowledge roots because their frontmatter sets context: auto. Prefer note summaries when present, keep this subset tiny, and leave most notes as context: search-only.\n\n${formattedWorkingNotes}`
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
  filesystemContext?: string,
): string {
  const hasExecuteCommand = availableTools?.some((tool) => tool.name === 'execute_command') ?? false
  const hasReadMoreContext = availableTools?.some((tool) => tool.name === 'read_more_context') ?? false
  // IMPORTANT: This prompt is a last-resort fallback used when the full system prompt
  // cannot fit in the model context window. It must preserve the core policies:
  // - Use tools proactively to complete tasks
  // - Work iteratively until goals are fully achieved
  // - Preserve filesystem skill paths so skills remain discoverable under shrinking
  const compactPrompt = [
    "Tool assistant. Use exact tool names/parameter keys; verify; be concise. ",
    "Latest user request wins; preserve constraints/approval boundaries. No recaps, completion summaries, or next safe actions unless asked for status/next steps. ",
    "Continuation: preserve the exact next action from evidence; don't soften quit/reopen/verify. ",
    "Before asking, use available context; ask one focused follow-up only if facts are missing. ",
    hasExecuteCommand
      ? "personal legal/immigration/health/finance/career prep: use execute_command on both knowledge notes and recent conversations before generic advice. Skills, settings, knowledge, tasks, prompts, runtime metadata, and conversations are files; use rg/find/ls/wc/sed/head/tail. Runtime: $DOTAGENTS_RUNTIME_DIR, $DOTAGENTS_AGENT_REGISTRY, $DOTAGENTS_TOOL_MANIFEST, $DOTAGENTS_TOOL_SCHEMA_DIR. Knowledge: configured knowledge roots, <knowledge-root>/<slug>/<slug>.md, context: search-only default, context: auto rare. Prior DotAgents conversations are JSON in the runtime-supplied conversations directory; search index.json then conv_*.json. Config: layered global/workspace .agents folders; read dotagents-config-admin SKILL.md when available."
      : "When file tools are unavailable, answer from provided context and do not claim filesystem searches.",
  ].join("")
  const contextRecoveryPrompt = [
    "You are an autonomous AI assistant that uses tools to complete tasks. Use exact tool names and parameter keys, batch independent calls when useful, verify results, and be concise. ",
    "Respect earlier user constraints and approval boundaries. Answer the latest user request only; do not append workflow recaps, completion summaries, or next safe actions unless the user asks for status or next steps. ",
    "Before asking for facts, use available context and ask only the minimum high-signal follow-up if facts are missing. ",
    hasExecuteCommand
      ? "personal legal/immigration/health/finance/career prep: use execute_command on both knowledge notes and recent conversations before generic advice. Skills, settings, knowledge, tasks, prompts, runtime metadata, and conversations are files; use rg/find/ls/wc/sed/head/tail when filesystem paths are available. Inspect $DOTAGENTS_RUNTIME_DIR, $DOTAGENTS_AGENT_REGISTRY, $DOTAGENTS_TOOL_MANIFEST, or $DOTAGENTS_TOOL_SCHEMA_DIR for runtime discovery. Durable knowledge lives in configured knowledge roots as <knowledge-root>/<slug>/<slug>.md notes; use context: search-only by default, reserve context: auto for a tiny curated subset, and prefer direct file editing. Prior DotAgents conversations are JSON in the runtime-supplied conversations directory; use index.json then conv_*.json. DotAgents config lives in layered global/workspace .agents folders; read dotagents-config-admin SKILL.md when available before unfamiliar config edits."
      : "When execute_command is unavailable, rely on provided history and read_more_context results; do not claim filesystem searches.",
  ].join("")

  // Keep the fuller fallback when read_more_context is available; it preserves
  // context-ref recovery behavior while compacting answer-only continuations.
  let prompt = hasReadMoreContext ? contextRecoveryPrompt : compactPrompt

  if (isAgentMode) {
    prompt += hasReadMoreContext
      ? " Agent mode: continue with tools until the requested work is resolved. Whenever you need more context - continuation, status, debugging, or high-context planning - search the conversation store (index.json then conv_*.json) before asking follow-up questions, and use recovered context to answer or continue when sufficient."
      : " Agent mode: continue with tools until the requested work is resolved. Whenever you need more context - continuation, status, debugging, or high-context planning - search the conversation store (index.json then conv_*.json) before asking, and use recovered context to answer or continue when sufficient."
    if (hasReadMoreContext) {
      prompt += ' For compacted Context refs, call read_more_context(mode: "search") with the exact needed query when known; once the returned result contains the requested evidence, answer instead of searching again.'
    }
  }

  if (filesystemContext?.trim() && hasExecuteCommand) {
    prompt += `\n\nFILESYSTEM LOCATIONS:\n${filesystemContext.trim()}`
  }

  // Preserve filesystem skill paths under Tier-3 shrinking (only if skills exist).
  if (skillsIndex?.trim()) {
    prompt +=
      " Skills are optional filesystem instruction modules. When a task matches a listed skill, read its SKILL.md path with execute_command; do not bulk-read skill folders."
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
