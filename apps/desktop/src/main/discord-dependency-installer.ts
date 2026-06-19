import fs from "fs/promises"
import { spawn } from "child_process"
import path from "path"
import { getDiscordRuntimeDependencyPath } from "./discord-dependency"

const DISCORD_DEPENDENCY_VERSION = "^14.25.1"

export type DiscordDependencyInstallResult = {
  success: boolean
  error?: string
}

let installPromise: Promise<DiscordDependencyInstallResult> | null = null

export function installDiscordDependency(): Promise<DiscordDependencyInstallResult> {
  if (installPromise) return installPromise
  installPromise = installDiscordDependencyInternal().finally(() => {
    installPromise = null
  })
  return installPromise
}

async function installDiscordDependencyInternal(): Promise<DiscordDependencyInstallResult> {
  const runtimePath = getDiscordRuntimeDependencyPath()
  await fs.mkdir(runtimePath, { recursive: true })
  await fs.writeFile(
    path.join(runtimePath, "package.json"),
    `${JSON.stringify({
      private: true,
      name: "@dotagents/discord-runtime",
      version: "1.0.0",
      dependencies: {
        "discord.js": DISCORD_DEPENDENCY_VERSION,
      },
    }, null, 2)}\n`,
  )

  return runPnpmInstall(runtimePath)
}

function runPnpmInstall(cwd: string): Promise<DiscordDependencyInstallResult> {
  return new Promise((resolve) => {
    let settled = false
    const settle = (result: DiscordDependencyInstallResult) => {
      if (settled) return
      settled = true
      resolve(result)
    }
    const child = spawn("pnpm", ["install", "--prod", "--ignore-scripts"], {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
      shell: process.platform === "win32",
    })
    let output = ""

    child.stdout?.on("data", (chunk) => {
      output += String(chunk)
    })
    child.stderr?.on("data", (chunk) => {
      output += String(chunk)
    })

    child.on("error", (error) => {
      settle({
        success: false,
        error: error.message.includes("ENOENT")
          ? "Could not run pnpm. Install pnpm, then try again."
          : error.message,
      })
    })

    child.on("close", (code) => {
      if (code === 0) {
        settle({ success: true })
        return
      }

      const trimmed = output.trim()
      settle({
        success: false,
        error: trimmed || `pnpm install exited with code ${code ?? "unknown"}`,
      })
    })
  })
}
