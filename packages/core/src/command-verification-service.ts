import { spawn } from "node:child_process"
import { constants } from "node:fs"
import fs from "node:fs/promises"
import { getErrorMessage } from "./error-utils"

export interface ExternalAgentCommandVerificationInput {
  command: string
  args?: string[]
  cwd?: string
  probeArgs?: string[]
}

export interface ExternalAgentCommandVerificationResult {
  ok: boolean
  resolvedCommand?: string
  details?: string
  error?: string
  warnings?: string[]
}

/**
 * Interface for resolving command paths.
 * In the desktop app this is provided by mcpService.resolveCommandPath.
 */
export interface CommandPathResolver {
  resolveCommandPath(command: string): Promise<string>
}

/**
 * Default resolver that returns the command as-is (no resolution).
 */
const defaultResolver: CommandPathResolver = {
  resolveCommandPath: async (command: string) => command,
}

/** Module-level resolver that callers can set via setCommandPathResolver(). */
let commandPathResolver: CommandPathResolver = defaultResolver

/**
 * Set the command path resolver. Called at startup by the host app.
 */
export function setCommandPathResolver(resolver: CommandPathResolver): void {
  commandPathResolver = resolver
}

const VERIFY_TIMEOUT_MS = 4000
const OUTPUT_PREVIEW_LIMIT = 240

function normalizeArgs(args?: string[]): string[] {
  return (args || []).map(arg => arg.trim()).filter(Boolean)
}

function buildCommandPreview(command: string, args: string[]): string {
  return [command, ...args].filter(Boolean).join(" ")
}

function trimOutput(output: string): string | undefined {
  const trimmed = output.trim()
  if (!trimmed) return undefined
  return trimmed.length > OUTPUT_PREVIEW_LIMIT ? `${trimmed.slice(0, OUTPUT_PREVIEW_LIMIT)}…` : trimmed
}

async function verifyWorkingDirectory(cwd?: string): Promise<string | undefined> {
  const normalizedCwd = cwd?.trim()
  if (!normalizedCwd) return undefined

  const stats = await fs.stat(normalizedCwd)
  if (!stats.isDirectory()) {
    throw new Error(`Working directory is not a folder: ${normalizedCwd}`)
  }

  await fs.access(normalizedCwd, constants.R_OK)
  return normalizedCwd
}

async function runProbe(
  resolvedCommand: string,
  probeArgs: string[],
  cwd?: string,
): Promise<ExternalAgentCommandVerificationResult> {
  const probePreview = buildCommandPreview(resolvedCommand, probeArgs)

  return await new Promise((resolve) => {
    const child = spawn(resolvedCommand, probeArgs, {
      cwd: cwd || process.cwd(),
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
      shell: process.platform === "win32",
    })

    let stdout = ""
    let stderr = ""
    let settled = false

    const finish = (result: ExternalAgentCommandVerificationResult) => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      resolve(result)
    }

    const timeout = setTimeout(() => {
      child.kill()
      finish({
        ok: false,
        resolvedCommand,
        error: `${probePreview} did not exit within ${VERIFY_TIMEOUT_MS / 1000}s. Finish any first-run setup or login in your terminal, then retry.`,
        warnings: [trimOutput(stdout), trimOutput(stderr)].filter(Boolean) as string[],
      })
    }, VERIFY_TIMEOUT_MS)

    child.stdout.on("data", data => {
      stdout += data.toString()
    })
    child.stderr.on("data", data => {
      stderr += data.toString()
    })

    child.on("error", error => {
      finish({
        ok: false,
        resolvedCommand,
        error: `Failed to start ${probePreview}: ${getErrorMessage(error)}`,
      })
    })

    child.on("close", code => {
      const warnings = [trimOutput(stdout), trimOutput(stderr)].filter(Boolean) as string[]
      if (code === 0) {
        finish({
          ok: true,
          resolvedCommand,
          details: `Successfully ran ${probePreview}${cwd ? ` in ${cwd}` : ""}.`,
          warnings,
        })
        return
      }

      finish({
        ok: false,
        resolvedCommand,
        error: `${probePreview} exited with code ${code ?? "unknown"}. If this is the first run, complete login/setup in your terminal and try again.`,
        warnings,
      })
    })
  })
}

export async function verifyExternalAgentCommand(
  input: ExternalAgentCommandVerificationInput,
): Promise<ExternalAgentCommandVerificationResult> {
  const command = input.command.trim()
  if (!command) {
    return { ok: false, error: "Add a command before verifying." }
  }

  try {
    const cwd = await verifyWorkingDirectory(input.cwd)
    const args = normalizeArgs(input.args)
    const probeArgs = normalizeArgs(input.probeArgs)
    const resolvedCommand = await commandPathResolver.resolveCommandPath(command)

    if (probeArgs.length === 0) {
      return {
        ok: true,
        resolvedCommand,
        details: `Resolved ${buildCommandPreview(resolvedCommand, args)}${cwd ? ` with working directory ${cwd}` : ""}.`,
      }
    }

    return await runProbe(resolvedCommand, [...args, ...probeArgs], cwd)
  } catch (error) {
    return {
      ok: false,
      error: getErrorMessage(error),
    }
  }
}
