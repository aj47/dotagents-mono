import type { MCPToolCall } from "./mcp-service"

export type ToolProgressCategory =
  | "research"
  | "execution"
  | "validation"
  | "communication"
  | "completion"
  | "meta"

export interface ToolBatchAssessment {
  categories: ToolProgressCategory[]
  communicationOnly: boolean
  researchOnly: boolean
  substantive: boolean
}

export interface ResearchBudgetPolicy {
  maxConsecutiveResearchTurns: number
  maxBlockedResearchBatches: number
}

export interface ResearchBudgetDecision {
  allowExecution: boolean
  shouldForceStop: boolean
  nudge?: string
}

const DEFAULT_POLICY: ResearchBudgetPolicy = {
  maxConsecutiveResearchTurns: 6,
  maxBlockedResearchBatches: 3,
}

const READ_ONLY_SHELL_COMMAND_RE = /\b(pwd|ls|find|rg|sed|head|tail|cat|wc|jq|git status|git diff|git show|echo|printf)\b/i
const WRITE_SHELL_INDICATOR_RE = /(^|[;&|]\s*)\s*(mkdir|touch|rm|mv|cp|tee|chmod|chown)\b|(^|[;&|]\s*)\s*git\s+(commit|push|checkout|switch|merge|rebase|apply|stash|tag)\b|(^|[;&|]\s*)\s*(pnpm|npm|yarn|bun)\s+(install|add|remove|update|upgrade|build|test|lint|typecheck)\b|(^|[;&|]\s*)\s*remotion\s+render\b|(^|[;&|]\s*)\s*ffmpeg\b|(^|[;&|]\s*)\s*python\d*\s+[^\n<]|(^|[;&|]\s*)\s*node\s+[^\n<]|(^|[;&|]\s*)\s*perl\s+/i
const VALIDATION_SHELL_INDICATOR_RE = /(^|[;&|]\s*)\s*(pnpm|npm|yarn|bun)\s+.*\b(test|lint|typecheck|build)\b|(^|[;&|]\s*)\s*(vitest|jest|playwright(?:\s+test)?|cypress|eslint|tsc)\b/i

function getExecuteCommandString(toolCall: MCPToolCall): string | undefined {
  if (toolCall.name !== "execute_command") return undefined
  if (!toolCall.arguments || typeof toolCall.arguments !== "object" || Array.isArray(toolCall.arguments)) {
    return undefined
  }
  const command = (toolCall.arguments as Record<string, unknown>).command
  return typeof command === "string" ? command : undefined
}

function isReadOnlyExecuteCommand(command: string): boolean {
  const normalized = command.trim()
  if (!normalized) return false
  if (VALIDATION_SHELL_INDICATOR_RE.test(normalized)) return false
  if (WRITE_SHELL_INDICATOR_RE.test(normalized)) return false
  return READ_ONLY_SHELL_COMMAND_RE.test(normalized)
}

export function classifyToolCall(toolCall: MCPToolCall): ToolProgressCategory {
  switch (toolCall.name) {
    case "respond_to_user":
      return "communication"
    case "mark_work_complete":
      return "completion"
    case "load_skill_instructions":
    case "read_more_context":
      return "research"
    case "set_session_title":
    case "list_running_agents":
    case "list_server_tools":
    case "get_tool_schema":
    case "list_available_agents":
    case "check_agent_status":
      return "meta"
    case "delegate_to_agent":
    case "spawn_agent":
    case "send_to_agent":
      return "execution"
    case "execute_command": {
      const command = getExecuteCommandString(toolCall)
      if (!command) return "execution"
      if (VALIDATION_SHELL_INDICATOR_RE.test(command)) return "validation"
      return isReadOnlyExecuteCommand(command) ? "research" : "execution"
    }
    default:
      return "execution"
  }
}

export function assessToolBatch(toolCalls: MCPToolCall[]): ToolBatchAssessment {
  const categories = toolCalls.map(classifyToolCall)
  const communicationOnly = categories.every((category) => category === "communication")
  const researchOnly = categories.every((category) => category === "research" || category === "meta")
  const substantive = categories.some(
    (category) => category === "execution" || category === "validation" || category === "completion",
  )

  return {
    categories,
    communicationOnly,
    researchOnly,
    substantive,
  }
}

export class ConvergenceController {
  private readonly policy: ResearchBudgetPolicy
  private consecutiveResearchTurns = 0
  private blockedResearchBatches = 0

  constructor(policy: Partial<ResearchBudgetPolicy> = {}) {
    this.policy = {
      ...DEFAULT_POLICY,
      ...policy,
    }
  }

  evaluateResearchBatch(toolCalls: MCPToolCall[]): ResearchBudgetDecision {
    const assessment = assessToolBatch(toolCalls)
    if (!assessment.researchOnly) {
      return { allowExecution: true, shouldForceStop: false }
    }

    if (this.consecutiveResearchTurns < this.policy.maxConsecutiveResearchTurns) {
      return { allowExecution: true, shouldForceStop: false }
    }

    this.blockedResearchBatches += 1

    if (this.blockedResearchBatches >= this.policy.maxBlockedResearchBatches) {
      return {
        allowExecution: false,
        shouldForceStop: true,
        nudge: "Research budget exhausted. Stop gathering more context and either (1) make the highest-leverage change now, (2) provide the best concrete answer you can from the information already gathered, or (3) explain the remaining blocker. Do not load more skills, inspect more references, or call more read-only tools.",
      }
    }

    return {
      allowExecution: false,
      shouldForceStop: false,
      nudge: "You have enough context. Do not call more read-only tools, load more skills, or inspect more references right now. Use the information already gathered to make a concrete change, produce a concrete plan, or deliver the user-facing answer.",
    }
  }

  recordSuccessfulToolBatch(toolCalls: MCPToolCall[]): void {
    const assessment = assessToolBatch(toolCalls)
    if (assessment.researchOnly) {
      this.consecutiveResearchTurns += 1
      return
    }

    if (assessment.substantive || assessment.communicationOnly) {
      this.resetResearchBudget()
    }
  }

  recordFailedToolBatch(toolCalls: MCPToolCall[]): void {
    const assessment = assessToolBatch(toolCalls)
    if (!assessment.researchOnly) {
      this.resetResearchBudget()
    }
  }

  resetResearchBudget(): void {
    this.consecutiveResearchTurns = 0
    this.blockedResearchBatches = 0
  }

  getState() {
    return {
      consecutiveResearchTurns: this.consecutiveResearchTurns,
      blockedResearchBatches: this.blockedResearchBatches,
    }
  }
}

