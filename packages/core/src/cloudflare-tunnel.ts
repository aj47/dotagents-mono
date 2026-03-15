import { spawn, ChildProcess } from "child_process"
import { configStore } from "./config"
import { diagnosticsService } from "./diagnostics"
import { access, constants } from "fs/promises"
import path from "path"
import os from "os"

// Helper to log to both diagnostics service and console for easier debugging
function debugLog(message: string): void {
  diagnosticsService.logInfo("cloudflare-tunnel", message)
  // eslint-disable-next-line no-console
  console.log(`[cloudflare-tunnel] ${message}`)
}

let tunnelProcess: ChildProcess | null = null
let tunnelUrl: string | null = null
let tunnelError: string | null = null
let isStarting = false
let currentTunnelMode: "quick" | "named" | null = null

// Regex to extract the tunnel URL from cloudflared output
const TUNNEL_URL_REGEX = /https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/

// Regex to detect when named tunnel is connected
const NAMED_TUNNEL_CONNECTED_REGEX = /Connection [a-f0-9-]+ registered|Registered tunnel connection|INF Connection [a-f0-9-]+ registered/i

/**
 * Expand tilde (~) in file paths to the user's home directory
 */
function expandTilde(filePath: string): string {
  if (filePath === "~") {
    return os.homedir()
  }
  if (filePath.startsWith("~/")) {
    return path.join(os.homedir(), filePath.slice(2))
  }
  return filePath
}

/**
 * Common paths where cloudflared might be installed
 */
function getCloudflaredSearchPaths(): string[] {
  const paths = [
    "/opt/homebrew/bin",
    "/usr/local/bin",
    "/usr/bin",
    "/bin",
    path.join(os.homedir(), ".cloudflared"),
    path.join(os.homedir(), "bin"),
  ]

  const systemPath = process.env.PATH || ""
  const pathSeparator = process.platform === "win32" ? ";" : ":"
  paths.push(...systemPath.split(pathSeparator).filter(Boolean))

  return [...new Set(paths)]
}

/**
 * Get an enhanced PATH that includes common cloudflared installation locations
 */
function getEnhancedPath(): string {
  const pathSeparator = process.platform === "win32" ? ";" : ":"
  const searchPaths = getCloudflaredSearchPaths()
  const currentPath = process.env.PATH || ""
  const currentPaths = currentPath.split(pathSeparator).filter(Boolean)

  for (const p of searchPaths) {
    if (!currentPaths.includes(p)) {
      currentPaths.push(p)
    }
  }

  return currentPaths.join(pathSeparator)
}

/**
 * Try to find the cloudflared binary path
 */
async function findCloudflaredPath(): Promise<string | null> {
  const searchPaths = getCloudflaredSearchPaths()
  const binaryName = process.platform === "win32" ? "cloudflared.exe" : "cloudflared"

  for (const dir of searchPaths) {
    const fullPath = path.join(dir, binaryName)
    try {
      await access(fullPath, constants.F_OK | constants.X_OK)
      debugLog(`Found cloudflared binary`)
      return fullPath
    } catch {
      // Binary not found in this path, continue searching
    }
  }

  debugLog(`cloudflared binary not found`)
  return null
}

/**
 * Check if cloudflared is installed and available
 */
export async function checkCloudflaredInstalled(): Promise<boolean> {
  const cloudflaredPath = await findCloudflaredPath()
  if (cloudflaredPath) {
    return true
  }

  const enhancedPath = getEnhancedPath()

  const spawnEnv: Record<string, string> = {}
  for (const [key, value] of Object.entries(process.env)) {
    if (typeof value === "string") {
      spawnEnv[key] = value
    }
  }
  spawnEnv.PATH = enhancedPath

  return new Promise<boolean>((resolve) => {
    const proc = spawn("cloudflared", ["--version"], {
      stdio: ["ignore", "pipe", "pipe"],
      env: spawnEnv as NodeJS.ProcessEnv,
    })

    proc.on("error", () => {
      resolve(false)
    })
    proc.on("close", (code: number | null) => {
      resolve(code === 0)
    })
  })
}

/**
 * Start a Cloudflare Quick Tunnel pointing to the remote server
 */
export async function startCloudflareTunnel(): Promise<{
  success: boolean
  url?: string
  error?: string
}> {
  if (isStarting) {
    return { success: false, error: "Tunnel is already starting" }
  }

  if (tunnelProcess) {
    return { success: true, url: tunnelUrl || undefined }
  }

  const cfg = configStore.get()
  const port = cfg.remoteServerPort || 3210

  const cloudflaredPath = await findCloudflaredPath()
  if (!cloudflaredPath) {
    const installed = await checkCloudflaredInstalled()
    if (!installed) {
      tunnelError = "cloudflared is not installed. Please install it from https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/"
      diagnosticsService.logError("cloudflare-tunnel", tunnelError)
      return { success: false, error: tunnelError }
    }
  }

  isStarting = true
  tunnelError = null
  tunnelUrl = null
  currentTunnelMode = "quick"

  const command = cloudflaredPath || "cloudflared"

  const enhancedEnv: Record<string, string> = {}
  for (const [key, value] of Object.entries(process.env)) {
    if (typeof value === "string") {
      enhancedEnv[key] = value
    }
  }
  enhancedEnv.PATH = getEnhancedPath()

  debugLog(`Starting tunnel on port ${port}`)

  return new Promise<{ success: boolean; url?: string; error?: string }>((resolve) => {
    try {
      const proc = spawn(command, ["tunnel", "--url", `http://127.0.0.1:${port}`], {
        stdio: ["ignore", "pipe", "pipe"],
        env: enhancedEnv as NodeJS.ProcessEnv,
      })

      tunnelProcess = proc

      proc.stdout?.on("data", (data: Buffer) => {
        const output = data.toString()
        const match = output.match(TUNNEL_URL_REGEX)
        if (match && !tunnelUrl) {
          tunnelUrl = match[0]
          isStarting = false
          debugLog(`Tunnel URL established`)
          resolve({ success: true, url: tunnelUrl })
        }
      })

      proc.stderr?.on("data", (data: Buffer) => {
        const output = data.toString()
        const match = output.match(TUNNEL_URL_REGEX)
        if (match && !tunnelUrl) {
          tunnelUrl = match[0]
          isStarting = false
          debugLog(`Tunnel URL established`)
          resolve({ success: true, url: tunnelUrl })
        }
      })

      proc.on("error", (err: Error) => {
        tunnelError = err.message
        tunnelProcess = null
        isStarting = false
        currentTunnelMode = null
        diagnosticsService.logError("cloudflare-tunnel", "Process error", err)
        resolve({ success: false, error: tunnelError || undefined })
      })

      proc.on("close", (code: number | null) => {
        tunnelProcess = null
        isStarting = false

        if (!tunnelUrl) {
          tunnelError = `cloudflared exited with code ${code}`
          currentTunnelMode = null
          debugLog(`Tunnel failed with exit code ${code}`)
          resolve({ success: false, error: tunnelError })
        }
      })

      setTimeout(() => {
        if (isStarting && !tunnelUrl) {
          isStarting = false
          tunnelError = "Timeout waiting for tunnel URL"
          stopCloudflareTunnel({ preserveError: true })
          resolve({ success: false, error: tunnelError })
        }
      }, 30000)
    } catch (err) {
      isStarting = false
      currentTunnelMode = null
      tunnelError = err instanceof Error ? err.message : String(err)
      diagnosticsService.logError("cloudflare-tunnel", "Failed to start tunnel", err)
      resolve({ success: false, error: tunnelError })
    }
  })
}

/**
 * Stop the Cloudflare Tunnel
 */
export async function stopCloudflareTunnel(options?: { preserveError?: boolean }): Promise<void> {
  if (tunnelProcess) {
    try {
      tunnelProcess.kill("SIGTERM")
      diagnosticsService.logInfo("cloudflare-tunnel", "Tunnel stopped")
    } catch (err) {
      diagnosticsService.logError("cloudflare-tunnel", "Error stopping tunnel", err)
    } finally {
      tunnelProcess = null
      tunnelUrl = null
      if (!options?.preserveError) {
        tunnelError = null
      }
      isStarting = false
      currentTunnelMode = null
    }
  }
}

/**
 * Get the current tunnel status
 */
export function getCloudflareTunnelStatus(): {
  running: boolean
  starting: boolean
  url: string | null
  error: string | null
  mode: "quick" | "named" | null
} {
  return {
    running: tunnelProcess !== null && !isStarting,
    starting: isStarting,
    url: tunnelUrl,
    error: tunnelError,
    mode: currentTunnelMode,
  }
}

/**
 * Get the default credentials path for a named tunnel
 */
function getDefaultCredentialsPath(tunnelId: string): string {
  return path.join(os.homedir(), ".cloudflared", `${tunnelId}.json`)
}

/**
 * Ensure DNS route exists for a named tunnel hostname.
 */
async function ensureDnsRoute(options: {
  tunnelId: string
  hostname: string
  cloudflaredPath: string | null
}): Promise<{ success: boolean; error?: string }> {
  const { tunnelId, hostname, cloudflaredPath } = options
  const command = cloudflaredPath || "cloudflared"

  const enhancedEnv: Record<string, string> = {}
  for (const [key, value] of Object.entries(process.env)) {
    if (typeof value === "string") {
      enhancedEnv[key] = value
    }
  }
  enhancedEnv.PATH = getEnhancedPath()

  debugLog(`Ensuring DNS route: ${hostname} -> tunnel ${tunnelId}`)

  return new Promise((resolve) => {
    const proc = spawn(command, [
      "tunnel",
      "route",
      "dns",
      "--overwrite-dns",
      tunnelId,
      hostname,
    ], {
      stdio: ["ignore", "pipe", "pipe"],
      env: enhancedEnv as NodeJS.ProcessEnv,
    })

    let stdout = ""
    let stderr = ""

    proc.stdout?.on("data", (data: Buffer) => {
      stdout += data.toString()
    })

    proc.stderr?.on("data", (data: Buffer) => {
      stderr += data.toString()
    })

    proc.on("error", (err: Error) => {
      diagnosticsService.logError("cloudflare-tunnel", "DNS route error", err)
      resolve({ success: false, error: `Failed to configure DNS route: ${err.message}` })
    })

    proc.on("close", (code: number | null) => {
      const output = stdout + stderr
      if (code === 0) {
        debugLog(`DNS route configured successfully: ${hostname}`)
        resolve({ success: true })
      } else {
        if (output.includes("already exists") || output.includes("CNAME")) {
          debugLog(`DNS route already exists for ${hostname}`)
          resolve({ success: true })
        } else {
          const errorMsg = `DNS route configuration failed (exit ${code}): ${output.trim()}`
          diagnosticsService.logError("cloudflare-tunnel", errorMsg)
          resolve({ success: false, error: errorMsg })
        }
      }
    })

    setTimeout(() => {
      proc.kill()
      resolve({ success: false, error: "Timeout configuring DNS route" })
    }, 30000)
  })
}

/**
 * Start a Named Cloudflare Tunnel for persistent URLs
 */
export async function startNamedCloudflareTunnel(options: {
  tunnelId: string
  hostname: string
  credentialsPath?: string
}): Promise<{
  success: boolean
  url?: string
  error?: string
}> {
  if (isStarting) {
    return { success: false, error: "Tunnel is already starting" }
  }

  if (tunnelProcess) {
    return { success: true, url: tunnelUrl || undefined }
  }

  const { tunnelId, hostname, credentialsPath } = options
  const cfg = configStore.get()
  const port = cfg.remoteServerPort || 3210

  const cloudflaredPath = await findCloudflaredPath()
  if (!cloudflaredPath) {
    const installed = await checkCloudflaredInstalled()
    if (!installed) {
      tunnelError = "cloudflared is not installed. Please install it from https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/"
      diagnosticsService.logError("cloudflare-tunnel", tunnelError)
      return { success: false, error: tunnelError }
    }
  }

  const credsPath = expandTilde(credentialsPath || getDefaultCredentialsPath(tunnelId))
  try {
    await access(credsPath, constants.F_OK | constants.R_OK)
  } catch {
    tunnelError = `Tunnel credentials file not found: ${credsPath}. Please run 'cloudflared tunnel login' and 'cloudflared tunnel create <name>' first.`
    diagnosticsService.logError("cloudflare-tunnel", tunnelError)
    return { success: false, error: tunnelError }
  }

  const dnsResult = await ensureDnsRoute({
    tunnelId,
    hostname,
    cloudflaredPath,
  })
  if (!dnsResult.success) {
    tunnelError = dnsResult.error || "Failed to configure DNS route"
    diagnosticsService.logError("cloudflare-tunnel", tunnelError)
    return { success: false, error: tunnelError }
  }

  isStarting = true
  tunnelError = null
  tunnelUrl = null
  currentTunnelMode = "named"

  const command = cloudflaredPath || "cloudflared"

  const enhancedEnv: Record<string, string> = {}
  for (const [key, value] of Object.entries(process.env)) {
    if (typeof value === "string") {
      enhancedEnv[key] = value
    }
  }
  enhancedEnv.PATH = getEnhancedPath()

  debugLog(`Starting named tunnel ${tunnelId} on port ${port}`)

  const publicUrl = `https://${hostname}`

  return new Promise<{ success: boolean; url?: string; error?: string }>((resolve) => {
    try {
      const args = [
        "tunnel",
        "--credentials-file", credsPath,
        "run",
        "--url", `http://127.0.0.1:${port}`,
        tunnelId,
      ]

      const proc = spawn(command, args, {
        stdio: ["ignore", "pipe", "pipe"],
        env: enhancedEnv as NodeJS.ProcessEnv,
      })

      tunnelProcess = proc

      let hasResolved = false

      proc.stdout?.on("data", (data: Buffer) => {
        const output = data.toString()
        debugLog(`[stdout] ${output.trim()}`)
        if (NAMED_TUNNEL_CONNECTED_REGEX.test(output) && !hasResolved) {
          tunnelUrl = publicUrl
          isStarting = false
          hasResolved = true
          debugLog(`Named tunnel connected: ${publicUrl}`)
          resolve({ success: true, url: tunnelUrl })
        }
      })

      proc.stderr?.on("data", (data: Buffer) => {
        const output = data.toString()
        debugLog(`[stderr] ${output.trim()}`)
        if (NAMED_TUNNEL_CONNECTED_REGEX.test(output) && !hasResolved) {
          tunnelUrl = publicUrl
          isStarting = false
          hasResolved = true
          debugLog(`Named tunnel connected: ${publicUrl}`)
          resolve({ success: true, url: tunnelUrl })
        }
      })

      proc.on("error", (err: Error) => {
        tunnelError = err.message
        tunnelProcess = null
        isStarting = false
        currentTunnelMode = null
        diagnosticsService.logError("cloudflare-tunnel", "Process error", err)
        if (!hasResolved) {
          hasResolved = true
          resolve({ success: false, error: tunnelError || undefined })
        }
      })

      proc.on("close", (code: number | null) => {
        tunnelProcess = null
        isStarting = false

        if (!tunnelUrl && !hasResolved) {
          tunnelError = `cloudflared exited with code ${code}`
          currentTunnelMode = null
          debugLog(`Named tunnel failed with exit code ${code}`)
          hasResolved = true
          resolve({ success: false, error: tunnelError })
        }
      })

      setTimeout(() => {
        if (isStarting && !tunnelUrl && !hasResolved) {
          isStarting = false
          tunnelError = "Timeout waiting for named tunnel to connect"
          stopCloudflareTunnel({ preserveError: true })
          hasResolved = true
          resolve({ success: false, error: tunnelError })
        }
      }, 30000)
    } catch (err) {
      isStarting = false
      currentTunnelMode = null
      tunnelError = err instanceof Error ? err.message : String(err)
      diagnosticsService.logError("cloudflare-tunnel", "Failed to start named tunnel", err)
      resolve({ success: false, error: tunnelError })
    }
  })
}

/**
 * List available tunnels (requires cloudflared to be logged in)
 */
export async function listCloudflareTunnels(): Promise<{
  success: boolean
  tunnels?: Array<{ id: string; name: string; created_at: string }>
  error?: string
}> {
  const cloudflaredPath = await findCloudflaredPath()
  if (!cloudflaredPath) {
    const installed = await checkCloudflaredInstalled()
    if (!installed) {
      return { success: false, error: "cloudflared is not installed" }
    }
  }

  const command = cloudflaredPath || "cloudflared"

  const enhancedEnv: Record<string, string> = {}
  for (const [key, value] of Object.entries(process.env)) {
    if (typeof value === "string") {
      enhancedEnv[key] = value
    }
  }
  enhancedEnv.PATH = getEnhancedPath()

  return new Promise((resolve) => {
    const proc = spawn(command, ["tunnel", "list", "--output", "json"], {
      stdio: ["ignore", "pipe", "pipe"],
      env: enhancedEnv as NodeJS.ProcessEnv,
    })

    let stdout = ""
    let stderr = ""

    proc.stdout?.on("data", (data: Buffer) => {
      stdout += data.toString()
    })

    proc.stderr?.on("data", (data: Buffer) => {
      stderr += data.toString()
    })

    proc.on("error", (err: Error) => {
      resolve({ success: false, error: err.message })
    })

    proc.on("close", (code: number | null) => {
      if (code === 0) {
        try {
          const tunnels = JSON.parse(stdout)
          resolve({ success: true, tunnels })
        } catch {
          resolve({ success: false, error: "Failed to parse tunnel list" })
        }
      } else {
        resolve({
          success: false,
          error: stderr.trim() || `cloudflared exited with code ${code}`,
        })
      }
    })
  })
}

/**
 * Check if the user is logged into cloudflared
 */
export async function checkCloudflaredLoggedIn(): Promise<boolean> {
  const certPath = path.join(os.homedir(), ".cloudflared", "cert.pem")
  try {
    await access(certPath, constants.F_OK | constants.R_OK)
    return true
  } catch {
    return false
  }
}
