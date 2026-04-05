import { app } from "electron"
import fs from "fs"
import { spawn } from "child_process"
import os from "os"
import path from "path"

type CodexInstallStatus = {
  installed: boolean
  installing: boolean
  binaryPath: string
  version?: string
  error?: string
}

const installState: CodexInstallStatus = {
  installed: false,
  installing: false,
  binaryPath: "",
}

function getManagedInstallRoot(): string {
  return app.getPath("userData")
}

export function getManagedCodexBinaryPath(): string {
  return "codex-acp"
}

function updateInstallState(partial: Partial<CodexInstallStatus>): CodexInstallStatus {
  Object.assign(installState, partial)
  installState.installed = !!(installState.version || partial.installed)
  installState.binaryPath = "codex-acp"
  return { ...installState }
}

async function readInstalledVersion(): Promise<string | undefined> {
  return await new Promise((resolve) => {
    const child = spawn("codex-acp", ["--version"], { stdio: ["ignore", "pipe", "pipe"] })
    let stdout = ""
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString()
    })
    child.on("error", () => resolve(undefined))
    child.on("close", (code) => {
      if (code === 0) resolve(stdout.trim() || undefined)
      else resolve(undefined)
    })
  })
}

export async function getCodexInstallStatus(): Promise<CodexInstallStatus> {
  const version = await readInstalledVersion()
  return updateInstallState({ version })
}

export async function installManagedCodex(): Promise<CodexInstallStatus> {
  if (installState.installing) {
    throw new Error("Codex install already in progress")
  }

  updateInstallState({ installing: true, error: undefined })

  try {
    // Install via npm
    const npmCommand = process.platform === "win32" ? "npm" : "npm"
    const args = ["install", "-g", "@zed-industries/codex-acp"]

    await new Promise<void>((resolve, reject) => {
      const child = spawn(npmCommand, args, {
        stdio: "inherit",
        shell: process.platform === "win32",
      })
      child.on("error", (err) => {
        updateInstallState({ installing: false, error: err.message })
        reject(err)
      })
      child.on("close", (code) => {
        if (code === 0) resolve()
        else {
          const error = `npm install failed with code ${code}`
          updateInstallState({ installing: false, error })
          reject(new Error(error))
        }
      })
    })

    const version = await readInstalledVersion()
    return updateInstallState({ installing: false, version })
  } catch (error) {
    return updateInstallState({
      installing: false,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

export async function verifyCodexCommand(): Promise<{ ok: boolean; details?: string; error?: string }> {
  try {
    const version = await readInstalledVersion()
    if (version) {
      return { ok: true, details: `Codex ACP v${version}` }
    }
    return { ok: false, error: "Codex ACP not found" }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}
