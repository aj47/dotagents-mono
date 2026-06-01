import type { MCPToolCall, MCPToolResult } from "./mcp-service"

const EXECUTE_COMMAND_TOOL = "execute_command"

// Window of recent successful execute_command observations we consider when
// deciding whether the agent is thrashing on broad/truncated inspection. Sized
// large enough to catch a 3-of-5 truncation cluster across a couple of mixed
// tool batches without holding state forever.
const HISTORY_WINDOW = 8

// Min successful + truncated execute_command results inside the window before
// we nudge the agent toward synthesis. The issue's observed thrash case had 56
// truncated results in 89 tool calls; 3-of-N is the smallest signal that
// reliably catches the pattern without firing on a single oversized output.
const TRUNCATED_THRASH_THRESHOLD = 3

// Min successful execute_command calls that share the same cwd + file basenames
// before we treat repeated inspection of one domain as thrash. Set higher than
// the truncated threshold because narrow repeated probes of one file can still
// be legitimate progress (e.g. iterating on a fix).
const DOMAIN_THRASH_THRESHOLD = 5

export const EXECUTE_COMMAND_THRASH_NUDGE_TEXT =
  "Recent execute_command results produced repeated/truncated inspection output. " +
  "Stop broad inspection now. Summarize the concrete facts already gathered, " +
  "produce the requested deliverable (or a minimal fill/action plan using known facts), " +
  "and explicitly list any remaining unknowns. If another command is necessary, " +
  "make it narrowly targeted (specific line ranges, single fields, exact paths) so " +
  "the result is not truncated."

export interface ExecuteCommandObservation {
  outputTruncated: boolean
  domainKey: string | undefined
}

export type ExecuteCommandThrashReason = "truncated" | "domain-overlap"

export interface ExecuteCommandThrashEvaluation {
  thrashing: boolean
  reason: ExecuteCommandThrashReason | undefined
  truncatedCount: number
  domainCount: number
  windowSize: number
  message: string | undefined
}

const PATH_TOKEN_REGEX = /(?:\.\.?\/|\/)[\w./\-]+|\b[\w.\-]+\.[A-Za-z][A-Za-z0-9]{0,5}\b/g

function safeParseJsonObject(text: string): Record<string, unknown> | undefined {
  try {
    const parsed = JSON.parse(text)
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>
    }
  } catch {
    // not a JSON object payload — caller falls back to text scanning
  }
  return undefined
}

function buildDomainKey(cwd: string | undefined, command: string | undefined): string | undefined {
  if (!command) return undefined
  const basenames = new Set<string>()
  for (const match of command.match(PATH_TOKEN_REGEX) ?? []) {
    const basename = match.split("/").filter(Boolean).pop()
    if (!basename) continue
    // Skip option-like fragments such as "-n" or argument values that are not file refs.
    if (basename.startsWith("-")) continue
    basenames.add(basename.toLowerCase())
  }
  if (basenames.size === 0) {
    return cwd ? `${cwd}::no-paths` : undefined
  }
  return `${cwd ?? ""}::${[...basenames].sort().join(",")}`
}

export function extractExecuteCommandObservation(
  toolCall: MCPToolCall,
  result: MCPToolResult,
): ExecuteCommandObservation | undefined {
  if (toolCall.name !== EXECUTE_COMMAND_TOOL || result.isError) return undefined
  const text = result.content.map((entry) => entry.text).join("\n")
  const parsed = safeParseJsonObject(text)
  if (parsed) {
    if (parsed.success !== true) return undefined
    const cwd = typeof parsed.cwd === "string" ? parsed.cwd : undefined
    const command = typeof parsed.command === "string" ? parsed.command : undefined
    const outputTruncated = parsed.outputTruncated === true
      || /\[OUTPUT TRUNCATED:/i.test(typeof parsed.stdout === "string" ? parsed.stdout : "")
    return {
      outputTruncated,
      domainKey: buildDomainKey(cwd, command),
    }
  }
  // Fallback for payloads that aren't a tidy JSON object: scan the raw text.
  if (!/"success"\s*:\s*true/.test(text)) return undefined
  return {
    outputTruncated: /"outputTruncated"\s*:\s*true/.test(text) || /\[OUTPUT TRUNCATED:/i.test(text),
    domainKey: undefined,
  }
}

export class ExecuteCommandThrashDetector {
  private observations: ExecuteCommandObservation[] = []
  private lastNudgedIteration: number | undefined

  record(observation: ExecuteCommandObservation): void {
    this.observations.push(observation)
    if (this.observations.length > HISTORY_WINDOW) {
      this.observations.splice(0, this.observations.length - HISTORY_WINDOW)
    }
  }

  recordBatch(observations: ExecuteCommandObservation[]): void {
    for (const observation of observations) this.record(observation)
  }

  evaluate(): ExecuteCommandThrashEvaluation {
    const truncatedCount = this.observations.filter((o) => o.outputTruncated).length
    const domainCounts = new Map<string, number>()
    for (const observation of this.observations) {
      if (!observation.domainKey) continue
      domainCounts.set(observation.domainKey, (domainCounts.get(observation.domainKey) ?? 0) + 1)
    }
    let topDomainCount = 0
    for (const count of domainCounts.values()) {
      if (count > topDomainCount) topDomainCount = count
    }

    const baseEvaluation = {
      truncatedCount,
      domainCount: topDomainCount,
      windowSize: this.observations.length,
    }

    if (truncatedCount >= TRUNCATED_THRASH_THRESHOLD) {
      return {
        ...baseEvaluation,
        thrashing: true,
        reason: "truncated",
        message: EXECUTE_COMMAND_THRASH_NUDGE_TEXT,
      }
    }
    if (topDomainCount >= DOMAIN_THRASH_THRESHOLD) {
      return {
        ...baseEvaluation,
        thrashing: true,
        reason: "domain-overlap",
        message: EXECUTE_COMMAND_THRASH_NUDGE_TEXT,
      }
    }
    return {
      ...baseEvaluation,
      thrashing: false,
      reason: undefined,
      message: undefined,
    }
  }

  // After firing a nudge we clear the window so the next batch starts a fresh
  // count. Otherwise the same observations would trip the threshold on every
  // subsequent iteration until they aged out.
  markNudged(iteration: number): void {
    this.lastNudgedIteration = iteration
    this.observations = []
  }

  wasNudgedAtIteration(iteration: number): boolean {
    return this.lastNudgedIteration === iteration
  }

  reset(): void {
    this.observations = []
    this.lastNudgedIteration = undefined
  }
}
