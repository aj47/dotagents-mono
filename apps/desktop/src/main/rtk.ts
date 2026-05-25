/**
 * RTK (Rust Token Killer) command-wrapping helpers.
 *
 * RTK is a CLI proxy (https://www.rtk-ai.app) that filters noisy command
 * output before it reaches the LLM. When enabled, we transparently prepend
 * the `rtk` binary to safe shell invocations issued via `execute_command`
 * so the agent only sees a compact summary instead of full stdout/stderr.
 *
 * The integration is opt-in via the `DOTAGENTS_RTK` env var so existing
 * sessions are unaffected. If the `rtk` binary is not on PATH, wrapping is
 * skipped silently and the original command runs unchanged.
 */

import { exec } from "child_process"

export const RTK_ENABLE_ENV = "DOTAGENTS_RTK"
export const RTK_BINARY_ENV = "DOTAGENTS_RTK_BINARY"

const SHELL_METACHARACTER_REGEX = /[|&;<>(){}`$\\\n]/
const COMPOUND_OPERATOR_REGEX = /&&|\|\||>>/

// Commands we never wrap: destructive, interactive, or pipeline-sensitive
// commands where filtering output is unsafe or unhelpful.
const RTK_SKIP_COMMAND_PREFIXES = new Set([
  "rm",
  "rmdir",
  "mv",
  "dd",
  "sudo",
  "su",
  "kill",
  "pkill",
  "shutdown",
  "reboot",
  "docker",
  "kubectl",
  "ssh",
  "scp",
  "rsync",
  "vim",
  "vi",
  "nano",
  "less",
  "more",
  "top",
  "htop",
  "cd",
  "exit",
])

export function isRtkEnabled(): boolean {
  const value = process.env[RTK_ENABLE_ENV]
  if (!value) return false
  const normalized = value.toLowerCase()
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on"
}

export function getRtkBinary(): string {
  const configured = process.env[RTK_BINARY_ENV]
  return configured && configured.trim().length > 0 ? configured : "rtk"
}

export function shouldWrapWithRtk(command: string): boolean {
  const trimmed = command.trim()
  if (!trimmed) return false
  if (COMPOUND_OPERATOR_REGEX.test(trimmed)) return false
  if (SHELL_METACHARACTER_REGEX.test(trimmed)) return false
  const firstToken = trimmed.split(/\s+/)[0]
  if (!firstToken) return false
  // Leading inline env assignments (e.g. `FOO=bar pnpm test`) confuse RTK,
  // which expects to receive the program name directly.
  if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(firstToken)) return false
  if (firstToken === "rtk") return false
  if (RTK_SKIP_COMMAND_PREFIXES.has(firstToken)) return false
  // Skip destructive git subcommands like `git push`, `git reset --hard`.
  if (firstToken === "git") {
    const second = trimmed.split(/\s+/)[1]
    if (second === "push" || second === "reset" || second === "clean") return false
  }
  return true
}

let rtkAvailableCache: Promise<boolean> | null = null

function probeRtkBinary(binary: string): Promise<boolean> {
  return new Promise((resolve) => {
    const probe = process.platform === "win32" ? `where ${binary}` : `command -v ${binary}`
    exec(probe, { timeout: 2000 }, (error) => resolve(!error))
  })
}

export async function isRtkAvailable(): Promise<boolean> {
  if (!rtkAvailableCache) {
    rtkAvailableCache = probeRtkBinary(getRtkBinary())
  }
  return rtkAvailableCache
}

export function resetRtkAvailabilityCache(): void {
  rtkAvailableCache = null
}

export interface RtkWrapResult {
  command: string
  wrapped: boolean
}

export async function maybeWrapWithRtk(command: string): Promise<RtkWrapResult> {
  if (!isRtkEnabled()) return { command, wrapped: false }
  if (!shouldWrapWithRtk(command)) return { command, wrapped: false }
  if (!(await isRtkAvailable())) return { command, wrapped: false }
  const binary = getRtkBinary()
  return { command: `${binary} ${command.trim()}`, wrapped: true }
}
