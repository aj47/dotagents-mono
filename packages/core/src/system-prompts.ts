/**
 * System Prompts Module (Core)
 *
 * Provides system prompt construction for the LLM engine.
 * ACP/profile-service dependencies are abstracted as optional parameters
 * so this module has zero Electron imports.
 */

import type { AgentMemory } from './types'

import { DEFAULT_SYSTEM_PROMPT } from './system-prompts-default'

export { DEFAULT_SYSTEM_PROMPT }

/**
 * Format memories for injection into the system prompt
 * Prioritizes high importance memories and limits count for context budget
 */
function formatMemoriesForPrompt(memories: AgentMemory[], maxMemories: number = 15): string {
  if (!memories || memories.length === 0) return ""

  // Sort by importance (critical > high > medium > low) then by recency
  const importanceOrder = { critical: 0, high: 1, medium: 2, low: 3 }
  const sorted = [...memories].sort((a, b) => {
    const impDiff = importanceOrder[a.importance] - importanceOrder[b.importance]
    if (impDiff !== 0) return impDiff
    return b.createdAt - a.createdAt // More recent first
  })

  // Take top N memories
  const selected = sorted.slice(0, maxMemories)
  if (selected.length === 0) return ""

  // Format as single-line entries for maximum compactness
  // Normalize any legacy multi-line content to single line
  return selected.map(mem => `- ${mem.content.replace(/[\r\n]+/g, ' ')}`).join("\n")
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

MEMORIES (optional):
- Use save_memory to store durable preferences/patterns you learn about the user.`

/**
 * Group tools by server and generate a brief description for each server
 */
function getServerSummaries(
  tools: Array<{ name: string; description: string; inputSchema?: any }>,
): Array<{ serverName: string; toolCount: number; toolNames: string[] }> {
  const serverMap = new Map<string, string[]>()

  for (const tool of tools) {
    const serverName = tool.name.includes(":") ? tool.name.split(":")[0] : "unknown"
    const toolName = tool.name.includes(":") ? tool.name.split(":")[1] : tool.name
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
 * Format tools in a lightweight, server-centric way
 * Shows server names with all tool names so the LLM knows what's available
 */
function formatLightweightToolInfo(
  tools: Array<{ name: string; description: string; inputSchema?: any }>,
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
 * Optional prompt additions that the caller can supply.
 * In the desktop app, these are computed from acp-service, acp-smart-router,
 * internal-agent, and agent-profile-service. By accepting them as plain strings
 * the core module stays free of Electron / singleton imports.
 */
export interface SystemPromptAdditions {
  /** ACP routing prompt (generated by acpSmartRouter) */
  acpRoutingPrompt?: string
  /** Agents delegation prompt (generated from agent-profile-service) */
  agentsDelegationPrompt?: string
  /** Internal sub-session instructions (generated from internal-agent info) */
  subSessionPrompt?: string
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
  memories?: AgentMemory[],
  /** Optional prompt additions for ACP, agents, and sub-sessions.
   *  In the desktop app the caller computes these from acp/profile services. */
  additions?: SystemPromptAdditions,
): string {
  let prompt = getEffectiveSystemPrompt(customSystemPrompt)

  if (isAgentMode) {
    prompt += AGENT_MODE_ADDITIONS

    // Add ACP agent delegation information if provided
    if (additions?.acpRoutingPrompt) {
      prompt += '\n\n' + additions.acpRoutingPrompt
    }

    // Add agents (delegation-targets) if provided
    if (additions?.agentsDelegationPrompt) {
      prompt += '\n\n' + additions.agentsDelegationPrompt
    }

    // Add internal sub-session instructions if provided
    if (additions?.subSessionPrompt) {
      prompt += '\n\n' + additions.subSessionPrompt
    }
  }

  // Add agent skills instructions if provided
  // Skills are injected early in the prompt so they can influence tool usage behavior
  if (skillsInstructions?.trim()) {
    prompt += `\n\n${skillsInstructions.trim()}`
  }

  // Add memories if provided (for agent mode context)
  // Memories are saved insights from previous sessions that help the agent
  // understand user preferences, past decisions, and important context
  const formattedMemories = formatMemoriesForPrompt(memories || [])
  if (formattedMemories) {
    prompt += `\n\nMEMORIES FROM PREVIOUS SESSIONS:\nThese are important insights and learnings saved from previous interactions. Use them to inform your decisions and provide context-aware assistance.\n\n${formattedMemories}`
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
    // Use lightweight format for ALL tools to reduce token usage
    // Full schemas are still available via native function calling
    prompt += `\n\nAVAILABLE MCP SERVERS (${availableTools.length} tools total):\n${formatLightweightToolInfo(availableTools)}`
    prompt += `\n\nTo discover tools: use list_server_tools(serverName) to see all tools in a server, or get_tool_schema(toolName) for full parameter details.`

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
  let prompt =
    "You are an autonomous AI assistant that uses tools to complete tasks. Work iteratively until goals are fully achieved. " +
    "Use tools proactively - prefer tools over asking users for information you can gather yourself. " +
    "When calling tools, use exact tool names and parameter keys. Be concise. Batch independent tool calls when possible."

  if (isAgentMode) {
    prompt += " Agent mode: continue calling tools until the task is completely resolved. If a tool fails, try alternative approaches before giving up."
  }

  // Preserve skills policy + IDs under Tier-3 shrinking (only if skills exist).
  if (skillsIndex?.trim()) {
    prompt +=
      " Skills are optional instruction modules. Before using a skill, call load_skill_instructions with { skillId }."
    prompt += `\n\nAVAILABLE AGENT SKILLS (IDs):\n${skillsIndex.trim()}`
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
    prompt += `\n\nAVAILABLE TOOLS:\n${list(availableTools)}`
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
