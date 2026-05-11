import { execSync } from "child_process"
import fs from "fs"
import path from "path"

type PromptMessage = {
  content?: unknown
}

let cachedGitInfo:
  | { branch: string; gitSha: string; repoRoot: string }
  | undefined

function getGitInfo() {
  if (cachedGitInfo) return cachedGitInfo

  const repoRoot = execSync("git rev-parse --show-toplevel", {
    cwd: process.cwd(),
    encoding: "utf8",
  }).trim()
  const branch = execSync("git branch --show-current", {
    cwd: repoRoot,
    encoding: "utf8",
  }).trim()
  const gitSha = execSync("git rev-parse --short HEAD", {
    cwd: repoRoot,
    encoding: "utf8",
  }).trim()

  cachedGitInfo = { branch, gitSha, repoRoot }
  return cachedGitInfo
}

function resolveMetricsFile(metricsFile: string, repoRoot: string) {
  return path.isAbsolute(metricsFile)
    ? metricsFile
    : path.join(repoRoot, metricsFile)
}

export function summarizeToolCalls(toolCalls: Array<{ name?: string }>) {
  return toolCalls.reduce<Record<string, number>>((counts, toolCall) => {
    const name = toolCall.name || "unknown"
    counts[name] = (counts[name] || 0) + 1
    return counts
  }, {})
}

export function summarizePromptBatches(promptBatches: unknown[]) {
  const batches = promptBatches.filter(Array.isArray) as PromptMessage[][]
  const promptChars = batches.map((batch) =>
    batch.reduce(
      (sum, message) => sum + String(message.content ?? "").length,
      0,
    ),
  )
  const promptMessages = batches.map((batch) => batch.length)
  const joinedPrompts = batches
    .flat()
    .map((message) => String(message.content ?? ""))
    .join("\n")
  const omittedMessagesTotal = Array.from(
    joinedPrompts.matchAll(/\[Older context: (\d+) omitted\]/g),
  ).reduce((sum, match) => sum + Number(match[1] || 0), 0)

  return {
    promptCalls: batches.length,
    promptCharsTotal: promptChars.reduce((sum, value) => sum + value, 0),
    promptCharsMax: promptChars.length ? Math.max(...promptChars) : 0,
    promptMessagesTotal: promptMessages.reduce((sum, value) => sum + value, 0),
    promptMessagesMax: promptMessages.length ? Math.max(...promptMessages) : 0,
    contextDigestCount: (joinedPrompts.match(/\[Older context:/g) || []).length,
    omittedMessagesTotal,
  }
}

export function recordAgentLoopMetric(metric: Record<string, unknown>) {
  const metricsFile = process.env.AGENT_LOOP_METRICS_FILE?.trim()
  if (!metricsFile) return

  const gitInfo = getGitInfo()
  const outputFile = resolveMetricsFile(metricsFile, gitInfo.repoRoot)
  fs.mkdirSync(path.dirname(outputFile), { recursive: true })
  fs.appendFileSync(
    outputFile,
    JSON.stringify({
      timestamp: new Date().toISOString(),
      suiteVersion: "agent-loop-replay-metrics-v1",
      branch: gitInfo.branch,
      gitSha: gitInfo.gitSha,
      ...metric,
    }) + "\n",
  )
}
