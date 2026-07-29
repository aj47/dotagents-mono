/**
 * RTK (Rust Token Killer) command-wrapping helpers.
 *
 * RTK is a CLI proxy (https://www.rtk-ai.app) that filters noisy command
 * output before it reaches the LLM. The `rtk` binary is bundled with the
 * desktop app (see apps/desktop/scripts/ensure-rtk-binary.ts) and resolved
 * from the app's `resources/bin/` directory at runtime — no user install
 * required.
 *
 * Wrapping is on by default and applied to "safe" single-command shell
 * invocations issued through `execute_command`. Set `DOTAGENTS_RTK=0`
 * (or any of `false`, `no`, `off`) to disable wrapping entirely.
 */

import { exec } from "child_process"
import { existsSync } from "fs"
import path from "path"

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
  if (value === undefined) return true
  const normalized = value.toLowerCase().trim()
  if (normalized === "" || normalized === "0" || normalized === "false" || normalized === "no" || normalized === "off") {
    return false
  }
  return true
}

function getBundledRtkBinaryPath(): string {
  const binaryName = process.platform === "win32" ? "rtk.exe" : "rtk"
  return path
    .join(__dirname, `../../resources/bin/${binaryName}`)
    .replace("app.asar", "app.asar.unpacked")
}

export function getRtkBinary(): string {
  const override = process.env[RTK_BINARY_ENV]
  if (override && override.trim().length > 0) return override
  return getBundledRtkBinaryPath()
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
  // The bundled binary path itself may be an absolute path containing `rtk`;
  // bail out if the command already starts with our binary.
  if (firstToken === getBundledRtkBinaryPath()) return false
  if (RTK_SKIP_COMMAND_PREFIXES.has(firstToken)) return false
  if (firstToken === "git") {
    const second = trimmed.split(/\s+/)[1]
    if (second === "push" || second === "reset" || second === "clean") return false
  }
  return true
}

let rtkAvailableCache: Promise<boolean> | null = null

function isAbsolutePathLike(binary: string): boolean {
  return path.isAbsolute(binary) || binary.includes(path.sep)
}

function probeRtkOnPath(binary: string): Promise<boolean> {
  return new Promise((resolve) => {
    const probe = process.platform === "win32" ? `where ${binary}` : `command -v ${binary}`
    exec(probe, { timeout: 2000 }, (error) => resolve(!error))
  })
}

async function detectRtkBinary(binary: string): Promise<boolean> {
  if (isAbsolutePathLike(binary)) {
    return existsSync(binary)
  }
  return probeRtkOnPath(binary)
}

export async function isRtkAvailable(): Promise<boolean> {
  if (!rtkAvailableCache) {
    rtkAvailableCache = detectRtkBinary(getRtkBinary())
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

function quoteIfNeeded(value: string): string {
  if (process.platform === "win32") {
    return value.includes(" ") ? `"${value}"` : value
  }
  return value.includes(" ") ? `'${value.replace(/'/g, "'\\''")}'` : value
}

export async function maybeWrapWithRtk(command: string): Promise<RtkWrapResult> {
  if (!isRtkEnabled()) return { command, wrapped: false }
  if (!shouldWrapWithRtk(command)) return { command, wrapped: false }
  if (!(await isRtkAvailable())) return { command, wrapped: false }
  const binary = getRtkBinary()
  return { command: `${quoteIfNeeded(binary)} ${command.trim()}`, wrapped: true }
}
