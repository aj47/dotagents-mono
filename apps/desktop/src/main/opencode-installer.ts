import { app } from "electron"
import fs from "fs"
import https from "https"
import os from "os"
import path from "path"
import { spawn } from "child_process"

type OpenCodeInstallStatus = {
  installed: boolean
  installing: boolean
  binaryPath: string
  version?: string
  error?: string
}

const RELEASE_BASE_URL = "https://github.com/anomalyco/opencode/releases/latest/download"

const installState: OpenCodeInstallStatus = {
  installed: false,
  installing: false,
  binaryPath: "",
}

function getBinaryName(): string {
  return process.platform === "win32" ? "opencode.exe" : "opencode"
}

function getManagedInstallRoot(): string {
  return path.join(app.getPath("userData"), "external-tools", "opencode")
}

export function getManagedOpencodeBinaryPath(): string {
  return path.join(getManagedInstallRoot(), "current", getBinaryName())
}

function getArchiveExtension(): ".zip" | ".tar.gz" {
  if (process.platform === "linux") return ".tar.gz"
  return ".zip"
}

function getReleaseAssetFileName(): string {
  const ext = getArchiveExtension()
  if (process.platform === "darwin") {
    if (process.arch === "arm64") return `opencode-darwin-arm64${ext}`
    if (process.arch === "x64") return `opencode-darwin-x64-baseline${ext}`
  }

  if (process.platform === "linux") {
    if (process.arch === "arm64") return "opencode-linux-arm64.tar.gz"
    if (process.arch === "x64") return "opencode-linux-x64.tar.gz"
  }

  if (process.platform === "win32" && process.arch === "x64") {
    return "opencode-windows-x64-baseline.zip"
  }

  throw new Error(`Unsupported platform for managed OpenCode install: ${process.platform}/${process.arch}`)
}

function getReleaseDownloadUrl(): string {
  return `${RELEASE_BASE_URL}/${getReleaseAssetFileName()}`
}

function updateInstallState(partial: Partial<OpenCodeInstallStatus>): OpenCodeInstallStatus {
  Object.assign(installState, partial)
  installState.binaryPath = getManagedOpencodeBinaryPath()
  installState.installed = fs.existsSync(installState.binaryPath)
  return { ...installState }
}

function downloadFile(url: string, destination: string): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(path.dirname(destination), { recursive: true })
    const file = fs.createWriteStream(destination)

    const cleanupAndReject = (error: Error) => {
      file.destroy()
      fs.unlink(destination, () => {})
      reject(error)
    }

    const request = (currentUrl: string) => {
      https
        .get(currentUrl, (response) => {
          if (
            response.statusCode
            && response.statusCode >= 300
            && response.statusCode < 400
            && response.headers.location
          ) {
            response.resume()
            request(new URL(response.headers.location, currentUrl).toString())
            return
          }

          if (response.statusCode !== 200) {
            cleanupAndReject(new Error(`OpenCode download failed with HTTP ${response.statusCode}: ${response.statusMessage}`))
            return
          }

          response.pipe(file)
          file.on("finish", () => {
            file.close()
            resolve()
          })
        })
        .on("error", cleanupAndReject)
    }

    request(url)
  })
}

async function extractTarArchive(archivePath: string, destination: string): Promise<void> {
  try {
    const tar = await import("tar")
    await tar.x({ file: archivePath, cwd: destination })
    return
  } catch {
    await new Promise<void>((resolve, reject) => {
      const child = spawn("tar", ["-xzf", archivePath, "-C", destination], {
        stdio: ["ignore", "pipe", "pipe"],
      })
      let stderr = ""
      child.stderr.on("data", (chunk) => {
        stderr += chunk.toString()
      })
      child.on("error", reject)
      child.on("close", (code) => {
        if (code === 0) resolve()
        else reject(new Error(stderr || `tar extraction failed with exit code ${code}`))
      })
    })
  }
}

async function extractZipArchive(archivePath: string, destination: string): Promise<void> {
  if (process.platform === "win32") {
    await new Promise<void>((resolve, reject) => {
      const command = `Expand-Archive -LiteralPath '${archivePath.replace(/'/g, "''")}' -DestinationPath '${destination.replace(/'/g, "''")}' -Force`
      const child = spawn("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", command], {
        stdio: ["ignore", "pipe", "pipe"],
      })
      let stderr = ""
      child.stderr.on("data", (chunk) => {
        stderr += chunk.toString()
      })
      child.on("error", reject)
      child.on("close", (code) => {
        if (code === 0) resolve()
        else reject(new Error(stderr || `Expand-Archive failed with exit code ${code}`))
      })
    })
    return
  }

  await new Promise<void>((resolve, reject) => {
    const child = spawn("unzip", ["-q", archivePath, "-d", destination], {
      stdio: ["ignore", "pipe", "pipe"],
    })
    let stderr = ""
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString()
    })
    child.on("error", reject)
    child.on("close", (code) => {
      if (code === 0) resolve()
      else reject(new Error(stderr || `unzip failed with exit code ${code}`))
    })
  })
}

async function extractArchive(archivePath: string, destination: string): Promise<void> {
  fs.mkdirSync(destination, { recursive: true })
  if (archivePath.endsWith(".tar.gz")) {
    await extractTarArchive(archivePath, destination)
    return
  }
  await extractZipArchive(archivePath, destination)
}

function findExtractedBinary(root: string): string {
  const directPath = path.join(root, getBinaryName())
  if (fs.existsSync(directPath)) return directPath

  const nestedPath = path.join(root, "opencode", getBinaryName())
  if (fs.existsSync(nestedPath)) return nestedPath

  throw new Error(`Could not find extracted OpenCode binary in ${root}`)
}

async function readInstalledVersion(binaryPath: string): Promise<string | undefined> {
  return await new Promise((resolve) => {
    const child = spawn(binaryPath, ["--version"], { stdio: ["ignore", "pipe", "pipe"] })
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

export async function getOpencodeInstallStatus(): Promise<OpenCodeInstallStatus> {
  const binaryPath = getManagedOpencodeBinaryPath()
  const version = fs.existsSync(binaryPath)
    ? await readInstalledVersion(binaryPath)
    : undefined
  return updateInstallState({ binaryPath, version })
}

export async function installManagedOpencode(): Promise<OpenCodeInstallStatus> {
  if (installState.installing) {
    throw new Error("OpenCode install already in progress")
  }

  updateInstallState({ installing: true, error: undefined })

  const installRoot = getManagedInstallRoot()
  const currentDir = path.join(installRoot, "current")
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dotagents-opencode-install-"))
  const archivePath = path.join(tempDir, getReleaseAssetFileName())
  const extractDir = path.join(tempDir, "extract")

  try {
    await downloadFile(getReleaseDownloadUrl(), archivePath)
    await extractArchive(archivePath, extractDir)

    const extractedBinaryPath = findExtractedBinary(extractDir)
    fs.rmSync(currentDir, { recursive: true, force: true })
    fs.mkdirSync(currentDir, { recursive: true })

    const installedBinaryPath = path.join(currentDir, getBinaryName())
    fs.copyFileSync(extractedBinaryPath, installedBinaryPath)
    if (process.platform !== "win32") {
      fs.chmodSync(installedBinaryPath, 0o755)
    }

    const version = await readInstalledVersion(installedBinaryPath)
    return updateInstallState({ installing: false, error: undefined, version })
  } catch (error) {
    return updateInstallState({
      installing: false,
      error: error instanceof Error ? error.message : String(error),
    })
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true })
  }
}