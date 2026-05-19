import { spawnSync } from "child_process"

const strict = process.argv.includes("--strict")
const rawPassthroughArgs = process.argv.slice(2).filter((arg) => arg !== "--strict")
const passthroughArgs = rawPassthroughArgs[0] === "--"
  ? rawPassthroughArgs.slice(1)
  : rawPassthroughArgs
const env = { ...process.env }

env.LIVE_AGENT_LOOP_E2E ??= "1"
env.LIVE_AGENT_LOOP_LLM_JUDGE ??= "1"

if (strict) {
  env.LIVE_AGENT_LOOP_LLM_JUDGE_REQUIRED ??= "1"
}

const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm"
const judgeEnabled = env.LIVE_AGENT_LOOP_LLM_JUDGE !== "0"
const judgeRequired = env.LIVE_AGENT_LOOP_LLM_JUDGE_REQUIRED === "1"

console.log(
  `Running live agent-loop e2e with LLM judge ${judgeEnabled ? "enabled" : "disabled"}${judgeRequired ? " and required" : ""}.`,
)

const result = spawnSync(
  pnpm,
  [
    "exec",
    "vitest",
    "run",
    "src/main/llm.agent-loop.live.test.ts",
    ...passthroughArgs,
  ],
  {
    env,
    stdio: "inherit",
  },
)

if (result.error) {
  console.error(result.error)
  process.exit(1)
}

process.exit(result.status ?? 1)
