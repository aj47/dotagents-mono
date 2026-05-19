import fs from "fs"
import os from "os"
import path from "path"

import type { AgentProgressUpdate, ConversationMessage } from "../shared/types"

export type SessionFileRoot = {
  path: string
  label: string
}

export type SessionFileEntry = {
  path: string
  relativePath: string
  name: string
  kind: "file" | "directory"
  size?: number
  modifiedAt: number
}

export type SessionFileListing = {
  entries: SessionFileEntry[]
  totalEntries: number
  limit: number
  truncated: boolean
}

export type SessionFilePreview = {
  path: string
  relativePath: string
  name: string
  kind: "directory" | "text" | "markdown" | "image" | "binary"
  size: number
  modifiedAt: number
  content?: string
  dataUrl?: string
  truncated?: boolean
}

const ROOT_MARKERS = [
  ".git",
  ".agents",
  "pnpm-lock.yaml",
  "package.json",
  "package-lock.json",
  "yarn.lock",
  "bun.lock",
  "bun.lockb",
  "Cargo.toml",
  "pyproject.toml",
  "go.mod",
]
const NOISY_ENTRY_NAMES = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  "coverage",
  ".next",
  "out",
  "target",
  "__pycache__",
])
const BLOCKED_ROOT_PATHS = new Set([
  path.resolve(path.sep),
  path.resolve(path.sep, "bin"),
  path.resolve(path.sep, "boot"),
  path.resolve(path.sep, "dev"),
  path.resolve(path.sep, "etc"),
  path.resolve(path.sep, "lib"),
  path.resolve(path.sep, "lib64"),
  path.resolve(path.sep, "proc"),
  path.resolve(path.sep, "sbin"),
  path.resolve(path.sep, "sys"),
  path.resolve(path.sep, "usr"),
  path.resolve(path.sep, "var"),
  path.resolve(os.homedir()),
])
const MARKDOWN_EXTENSIONS = new Set([".markdown", ".md", ".mdx"])
const TEXT_EXTENSIONS = new Set([
  ".c",
  ".cc",
  ".conf",
  ".cpp",
  ".css",
  ".csv",
  ".env",
  ".go",
  ".graphql",
  ".h",
  ".html",
  ".ini",
  ".java",
  ".js",
  ".json",
  ".jsx",
  ".log",
  ".mjs",
  ".py",
  ".rb",
  ".rs",
  ".scss",
  ".sh",
  ".sql",
  ".svg",
  ".toml",
  ".ts",
  ".tsx",
  ".txt",
  ".xml",
  ".yaml",
  ".yml",
  ".zsh",
])
const IMAGE_MIME_BY_EXTENSION = new Map<string, string>([
  [".gif", "image/gif"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".png", "image/png"],
  [".webp", "image/webp"],
])
const MAX_DIRECTORY_ENTRIES = 500
const DIRECTORY_HINT_KEYS = new Set([
  "cwd",
  "directory",
  "directorypath",
  "dir",
  "rootpath",
  "workspace",
  "workspacedir",
  "workspacefolder",
  "workspace_folder",
  "workspaceroot",
  "workingdirectory",
])
const FILE_HINT_KEYS = new Set([
  "file",
  "filepath",
  "outputpath",
  "path",
  "sourcepath",
  "targetpath",
])
const trackedSessionFileRoots = new Map<string, Set<string>>()

function realpathIfPossible(value: string): string {
  try {
    return fs.realpathSync(value)
  } catch {
    return path.resolve(value)
  }
}

function isAbsolutePathLike(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed || trimmed.startsWith("data:")) return false
  if (path.isAbsolute(trimmed)) return true
  return /^[A-Za-z]:[\\/]/.test(trimmed)
}

function nearestExistingAncestor(candidatePath: string): string | null {
  let current = path.resolve(candidatePath)
  while (true) {
    if (fs.existsSync(current)) return current
    const parent = path.dirname(current)
    if (parent === current) return null
    current = parent
  }
}

function hasWorkspaceMarker(dirPath: string): boolean {
  return ROOT_MARKERS.some((marker) => fs.existsSync(path.join(dirPath, marker)))
}

function resolveWorkspaceRoot(candidatePath: string): string | null {
  const existingAncestor = nearestExistingAncestor(candidatePath)
  if (!existingAncestor) return null

  let candidateDir = existingAncestor
  try {
    const stats = fs.lstatSync(existingAncestor)
    if (stats.isSymbolicLink()) return null
    if (stats.isFile()) candidateDir = path.dirname(existingAncestor)
  } catch {
    return null
  }

  let current = path.resolve(candidateDir)
  let markerRoot: string | null = null
  while (true) {
    if (hasWorkspaceMarker(current)) {
      const resolvedMarkerRoot = realpathIfPossible(current)
      if (!BLOCKED_ROOT_PATHS.has(resolvedMarkerRoot)) {
        markerRoot = resolvedMarkerRoot
        break
      }
    }
    const parent = path.dirname(current)
    if (parent === current) break
    current = parent
  }

  const rootPath = markerRoot ?? realpathIfPossible(candidateDir)
  return BLOCKED_ROOT_PATHS.has(rootPath) ? null : rootPath
}

function normalizeCandidatePath(rawValue: string, keyHint?: string): string | null {
  if (!isAbsolutePathLike(rawValue)) return null
  const normalized = path.normalize(rawValue.trim())
  const normalizedKey = (keyHint ?? "").toLowerCase().replace(/[^a-z]/g, "")

  try {
    const stats = fs.lstatSync(normalized)
    if (stats.isSymbolicLink()) return null
    if (stats.isDirectory()) return normalized
    if (stats.isFile()) return path.dirname(normalized)
  } catch {
    // Ignore missing paths and fall through to key-based heuristics.
  }

  if (DIRECTORY_HINT_KEYS.has(normalizedKey)) return normalized
  if (FILE_HINT_KEYS.has(normalizedKey) || path.extname(normalized)) return path.dirname(normalized)
  return normalized
}

function extractCandidatePathsFromValue(value: unknown, keyHint?: string): string[] {
  if (!value) return []
  if (typeof value === "string") {
    const candidate = normalizeCandidatePath(value, keyHint)
    return candidate ? [candidate] : []
  }
  if (Array.isArray(value)) {
    return value.flatMap((entry) => extractCandidatePathsFromValue(entry, keyHint))
  }
  if (typeof value === "object") {
    return Object.entries(value).flatMap(([key, nestedValue]) => extractCandidatePathsFromValue(nestedValue, key))
  }
  return []
}

function parseJsonObject(rawValue?: string): unknown {
  const trimmed = rawValue?.trim()
  if (!trimmed || (!trimmed.startsWith("{") && !trimmed.startsWith("["))) return null
  try {
    return JSON.parse(trimmed)
  } catch {
    return null
  }
}

function extractCandidatePathsFromToolResultContent(content?: string): string[] {
  const parsed = parseJsonObject(content)
  return parsed ? extractCandidatePathsFromValue(parsed) : []
}

function collectProgressCandidatePaths(update: Pick<AgentProgressUpdate, "steps" | "conversationHistory">): string[] {
  const results: string[] = []
  for (const step of update.steps ?? []) {
    results.push(...extractCandidatePathsFromValue(step.toolCall?.arguments))
    results.push(...extractCandidatePathsFromToolResultContent(step.toolResult?.content))
    results.push(...extractCandidatePathsFromToolResultContent(step.toolResult?.error))
  }
  for (const message of update.conversationHistory ?? []) {
    for (const toolCall of message.toolCalls ?? []) {
      results.push(...extractCandidatePathsFromValue(toolCall.arguments))
    }
    for (const toolResult of message.toolResults ?? []) {
      results.push(...extractCandidatePathsFromToolResultContent(toolResult.content))
      results.push(...extractCandidatePathsFromToolResultContent(toolResult.error))
    }
  }
  return results
}

function mergeTrackedPaths(sessionId: string, candidatePaths: Iterable<string>): void {
  const resolvedRoots = Array.from(candidatePaths)
    .map(resolveWorkspaceRoot)
    .filter((value): value is string => Boolean(value))
  if (resolvedRoots.length === 0) return

  const existing = trackedSessionFileRoots.get(sessionId) ?? new Set<string>()
  for (const rootPath of resolvedRoots) {
    existing.add(rootPath)
  }
  trackedSessionFileRoots.set(sessionId, existing)
}

function ensureTrackedRoot(sessionId: string, requestedRootPath: string): string {
  const normalizedRequestedRoot = realpathIfPossible(requestedRootPath)
  const allowedRoots = getTrackedSessionFileRoots(sessionId).map((root) => realpathIfPossible(root.path))
  if (!allowedRoots.includes(normalizedRequestedRoot)) {
    throw new Error("That workspace is not available for this session")
  }
  return normalizedRequestedRoot
}

function resolvePathWithinRoot(rootPath: string, requestedPath?: string): string {
  const normalizedRoot = realpathIfPossible(rootPath)
  if (!requestedPath || !requestedPath.trim()) return normalizedRoot

  const trimmed = requestedPath.trim()
  const resolvedPath = path.isAbsolute(trimmed)
    ? path.resolve(trimmed)
    : path.resolve(normalizedRoot, trimmed)

  // Anchor on the realpath of the nearest existing ancestor so symlinks inside
  // the workspace cannot be used to escape it via a parent-only containment check.
  let normalizedResolved: string
  if (fs.existsSync(resolvedPath)) {
    normalizedResolved = realpathIfPossible(resolvedPath)
  } else {
    const existingAncestor = nearestExistingAncestor(resolvedPath)
    if (!existingAncestor) {
      throw new Error("That path is outside the selected workspace")
    }
    const resolvedAncestor = realpathIfPossible(existingAncestor)
    const tail = path.relative(existingAncestor, resolvedPath)
    normalizedResolved = tail ? path.join(resolvedAncestor, tail) : resolvedAncestor
  }

  const withinRoot = normalizedResolved === normalizedRoot
    || normalizedResolved.startsWith(`${normalizedRoot}${path.sep}`)
  if (!withinRoot) {
    throw new Error("That path is outside the selected workspace")
  }

  return normalizedResolved
}

function ensureNonSymlink(targetPath: string): fs.Stats {
  const stats = fs.lstatSync(targetPath)
  if (stats.isSymbolicLink()) {
    throw new Error("Symlinks are not supported in File View")
  }
  return stats
}

function isTextPreviewable(filePath: string, sample?: Buffer): boolean {
  const extension = path.extname(filePath).toLowerCase()
  if (MARKDOWN_EXTENSIONS.has(extension) || TEXT_EXTENSIONS.has(extension)) return true
  if (!sample) return false
  return !sample.subarray(0, Math.min(sample.length, 1024)).includes(0)
}

export function recordSessionFileActivity(update: AgentProgressUpdate): void {
  if (!update.sessionId) return
  mergeTrackedPaths(update.sessionId, collectProgressCandidatePaths(update))
}

export function recordSessionConversationFileActivity(sessionId: string, messages: ConversationMessage[]): void {
  mergeTrackedPaths(sessionId, collectProgressCandidatePaths({ steps: [], conversationHistory: messages }))
}

export function clearSessionFileActivity(sessionId: string): void {
  trackedSessionFileRoots.delete(sessionId)
}

export function getTrackedSessionFileRoots(sessionId: string): SessionFileRoot[] {
  const uniqueRoots = Array.from(trackedSessionFileRoots.get(sessionId) ?? [])
    .map((rootPath) => realpathIfPossible(rootPath))
    .sort((a, b) => a.length - b.length || a.localeCompare(b))
    .filter((rootPath, index, allRoots) => {
      return !allRoots.some((candidate, candidateIndex) => {
        if (candidateIndex === index) return false
        return rootPath.startsWith(`${candidate}${path.sep}`)
      })
    })

  return uniqueRoots.map((rootPath) => ({
    path: rootPath,
    label: path.basename(rootPath) || rootPath,
  }))
}

export function resolveTrackedSessionPath(input: {
  sessionId: string
  rootPath: string
  targetPath?: string
}): string {
  const rootPath = ensureTrackedRoot(input.sessionId, input.rootPath)
  return resolvePathWithinRoot(rootPath, input.targetPath)
}

export function listTrackedSessionFiles(input: {
  sessionId: string
  rootPath: string
  directoryPath?: string
}): SessionFileListing {
  const rootPath = ensureTrackedRoot(input.sessionId, input.rootPath)
  const directoryPath = resolvePathWithinRoot(rootPath, input.directoryPath)
  const stats = ensureNonSymlink(directoryPath)
  if (!stats.isDirectory()) throw new Error("Only directories can be listed")

  const visibleEntries = fs.readdirSync(directoryPath, { withFileTypes: true })
    .filter((entry) => !entry.name.startsWith(".") && !NOISY_ENTRY_NAMES.has(entry.name) && !entry.isSymbolicLink())
    .sort((a, b) => {
      if (a.isDirectory() !== b.isDirectory()) return a.isDirectory() ? -1 : 1
      if (a.name === b.name) return 0
      return a.name < b.name ? -1 : 1
    })

  const entries = visibleEntries.slice(0, MAX_DIRECTORY_ENTRIES)
    .map((entry) => {
      const entryPath = path.join(directoryPath, entry.name)
      const entryStats = fs.lstatSync(entryPath)
      return {
        path: entryPath,
        relativePath: path.relative(rootPath, entryPath) || ".",
        name: entry.name,
        kind: entryStats.isDirectory() ? "directory" : "file",
        ...(entryStats.isDirectory() ? {} : { size: entryStats.size }),
        modifiedAt: entryStats.mtimeMs,
      } satisfies SessionFileEntry
    })

  return {
    entries,
    totalEntries: visibleEntries.length,
    limit: MAX_DIRECTORY_ENTRIES,
    truncated: visibleEntries.length > MAX_DIRECTORY_ENTRIES,
  }
}

export function readTrackedSessionFilePreview(input: {
  sessionId: string
  rootPath: string
  filePath: string
}): SessionFilePreview {
  const rootPath = ensureTrackedRoot(input.sessionId, input.rootPath)
  const filePath = resolvePathWithinRoot(rootPath, input.filePath)
  const stats = ensureNonSymlink(filePath)
  const relativePath = path.relative(rootPath, filePath) || path.basename(filePath)
  if (stats.isDirectory()) {
    return {
      path: filePath,
      relativePath,
      name: path.basename(filePath) || rootPath,
      kind: "directory",
      size: 0,
      modifiedAt: stats.mtimeMs,
    }
  }

  const extension = path.extname(filePath).toLowerCase()
  const maxTextBytes = 200_000
  const maxImageBytes = 5 * 1024 * 1024

  const binaryFallback = (): SessionFilePreview => ({
    path: filePath,
    relativePath,
    name: path.basename(filePath),
    kind: "binary",
    size: stats.size,
    modifiedAt: stats.mtimeMs,
  })

  if (IMAGE_MIME_BY_EXTENSION.has(extension)) {
    if (stats.size > maxImageBytes) return binaryFallback()
    const fileBuffer = fs.readFileSync(filePath)
    return {
      path: filePath,
      relativePath,
      name: path.basename(filePath),
      kind: "image",
      size: stats.size,
      modifiedAt: stats.mtimeMs,
      dataUrl: `data:${IMAGE_MIME_BY_EXTENSION.get(extension)};base64,${fileBuffer.toString("base64")}`,
    }
  }

  // Read only up to maxTextBytes so large logs or generated artifacts cannot
  // pin the Electron main process while we decide whether to preview them.
  const bytesToRead = Math.min(stats.size, maxTextBytes)
  const sampleBuffer = Buffer.alloc(bytesToRead)
  if (bytesToRead > 0) {
    const fd = fs.openSync(filePath, "r")
    try {
      fs.readSync(fd, sampleBuffer, 0, bytesToRead, 0)
    } finally {
      fs.closeSync(fd)
    }
  }

  if (isTextPreviewable(filePath, sampleBuffer)) {
    return {
      path: filePath,
      relativePath,
      name: path.basename(filePath),
      kind: MARKDOWN_EXTENSIONS.has(extension) ? "markdown" : "text",
      size: stats.size,
      modifiedAt: stats.mtimeMs,
      content: sampleBuffer.toString("utf8"),
      ...(stats.size > maxTextBytes ? { truncated: true } : {}),
    }
  }

  return binaryFallback()
}

export function createTrackedSessionFileEntry(input: {
  sessionId: string
  rootPath: string
  targetPath: string
  kind: "file" | "directory"
  content?: string
}): { path: string; relativePath: string } {
  const rootPath = ensureTrackedRoot(input.sessionId, input.rootPath)
  const targetPath = resolvePathWithinRoot(rootPath, input.targetPath)
  if (targetPath === rootPath) throw new Error("Cannot create over the workspace root")
  if (fs.existsSync(targetPath)) throw new Error("That path already exists")

  fs.mkdirSync(path.dirname(targetPath), { recursive: true })
  if (input.kind === "directory") {
    fs.mkdirSync(targetPath, { recursive: true })
  } else {
    fs.writeFileSync(targetPath, input.content ?? "", "utf8")
  }

  return {
    path: targetPath,
    relativePath: path.relative(rootPath, targetPath) || ".",
  }
}

export function moveTrackedSessionFileEntry(input: {
  sessionId: string
  rootPath: string
  sourcePath: string
  targetPath: string
}): { path: string; relativePath: string } {
  const rootPath = ensureTrackedRoot(input.sessionId, input.rootPath)
  const sourcePath = resolvePathWithinRoot(rootPath, input.sourcePath)
  const targetPath = resolvePathWithinRoot(rootPath, input.targetPath)
  if (sourcePath === rootPath || targetPath === rootPath) {
    throw new Error("Cannot rename or move the workspace root")
  }
  if (!fs.existsSync(sourcePath)) throw new Error("That path no longer exists")
  if (fs.existsSync(targetPath) && realpathIfPossible(targetPath) !== realpathIfPossible(sourcePath)) {
    throw new Error("The destination already exists")
  }

  ensureNonSymlink(sourcePath)
  fs.mkdirSync(path.dirname(targetPath), { recursive: true })
  fs.renameSync(sourcePath, targetPath)

  return {
    path: targetPath,
    relativePath: path.relative(rootPath, targetPath) || ".",
  }
}

export function deleteTrackedSessionFileEntry(input: {
  sessionId: string
  rootPath: string
  targetPath: string
}): void {
  const rootPath = ensureTrackedRoot(input.sessionId, input.rootPath)
  const targetPath = resolvePathWithinRoot(rootPath, input.targetPath)
  if (targetPath === rootPath) throw new Error("Cannot delete the workspace root")
  if (!fs.existsSync(targetPath)) throw new Error("That path no longer exists")

  ensureNonSymlink(targetPath)
  fs.rmSync(targetPath, { recursive: true, force: false })
}

export function resetTrackedSessionFileActivityForTests(): void {
  trackedSessionFileRoots.clear()
}
