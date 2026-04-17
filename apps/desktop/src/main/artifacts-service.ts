/**
 * Artifacts service — agent-authored interactive HTML/CSS/JS mini-apps.
 *
 * Persistence layout under the active `.agents` directory (workspace wins over
 * global when a workspace is active):
 *
 *   <agents-dir>/artifacts/
 *     <id>/
 *       meta.json          Artifact minus versions[].files
 *       v<n>/index.html    Version files (one directory per version)
 *       v<n>/style.css
 *       v<n>/script.js
 *
 * All disk access is guarded by Zod validation. The service is a singleton,
 * matching the convention in other main-process services.
 */

import fs from "fs"
import path from "path"
import { z } from "zod"
import { logApp } from "./debug"
import { globalAgentsFolder, resolveWorkspaceAgentsFolder } from "./config"
import {
  ARTIFACT_FILE_BYTE_LIMIT,
  ARTIFACT_MAX_VERSIONS,
  ARTIFACT_TOTAL_BYTE_LIMIT,
  type Artifact,
  type ArtifactFiles,
  type ArtifactListItem,
  type ArtifactMeta,
  type ArtifactVersion,
} from "@dotagents/shared"

const META_FILENAME = "meta.json"

const artifactFilesSchema = z
  .object({
    "index.html": z.string().optional(),
    "style.css": z.string().optional(),
    "script.js": z.string().optional(),
  })
  .strict()

const versionSchema = z.object({
  version: z.number().int().positive(),
  files: artifactFilesSchema,
  note: z.string().max(1024).optional(),
  createdAt: z.number().int().nonnegative(),
})

const metaSchema = z.object({
  id: z.string().min(1).max(128),
  title: z.string().min(1).max(200),
  kind: z.literal("html"),
  currentVersion: z.number().int().positive(),
  createdAt: z.number().int().nonnegative(),
  updatedAt: z.number().int().nonnegative(),
  createdBy: z
    .object({
      source: z.enum(["agent", "user"]),
      sessionId: z.string().optional(),
      agentId: z.string().optional(),
    })
    .optional(),
})

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 8)
}

function buildArtifactId(title: string): string {
  const base = slugify(title) || "artifact"
  return `${base}-${randomSuffix()}`
}

function enforceSizeLimits(files: ArtifactFiles): void {
  let total = 0
  for (const [name, content] of Object.entries(files)) {
    if (typeof content !== "string") continue
    const bytes = Buffer.byteLength(content, "utf8")
    if (bytes > ARTIFACT_FILE_BYTE_LIMIT) {
      throw new Error(
        `File ${name} exceeds per-file byte limit (${bytes} > ${ARTIFACT_FILE_BYTE_LIMIT})`,
      )
    }
    total += bytes
  }
  if (total > ARTIFACT_TOTAL_BYTE_LIMIT) {
    throw new Error(
      `Artifact exceeds total byte limit (${total} > ${ARTIFACT_TOTAL_BYTE_LIMIT})`,
    )
  }
}

function resolveArtifactsRoot(): string {
  const workspace = resolveWorkspaceAgentsFolder()
  const base = workspace ?? globalAgentsFolder
  return path.join(base, "artifacts")
}

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true })
}

function artifactDir(id: string): string {
  return path.join(resolveArtifactsRoot(), id)
}

function versionDir(id: string, version: number): string {
  return path.join(artifactDir(id), `v${version}`)
}

function readJsonSafe<S extends z.ZodTypeAny>(file: string, schema: S): z.infer<S> | null {
  try {
    const raw = fs.readFileSync(file, "utf8")
    const parsed = JSON.parse(raw)
    const result = schema.safeParse(parsed)
    if (!result.success) {
      logApp(`[artifacts] invalid JSON at ${file}: ${result.error.message}`)
      return null
    }
    return result.data
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      logApp(`[artifacts] read failed for ${file}: ${(error as Error).message}`)
    }
    return null
  }
}

function writeJson(file: string, value: unknown): void {
  ensureDir(path.dirname(file))
  fs.writeFileSync(file, JSON.stringify(value, null, 2), "utf8")
}

function readVersionFiles(id: string, version: number): ArtifactFiles {
  const dir = versionDir(id, version)
  const files: ArtifactFiles = {}
  for (const name of ["index.html", "style.css", "script.js"] as const) {
    try {
      files[name] = fs.readFileSync(path.join(dir, name), "utf8")
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error
    }
  }
  return files
}

function writeVersionFiles(id: string, version: number, files: ArtifactFiles): void {
  const dir = versionDir(id, version)
  ensureDir(dir)
  for (const [name, content] of Object.entries(files)) {
    if (typeof content !== "string") continue
    fs.writeFileSync(path.join(dir, name), content, "utf8")
  }
}

function listVersionDirs(id: string): number[] {
  const dir = artifactDir(id)
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^v\d+$/.test(entry.name))
    .map((entry) => Number(entry.name.slice(1)))
    .filter((n) => Number.isFinite(n) && n > 0)
    .sort((a, b) => a - b)
}

export interface CreateArtifactInput {
  title: string
  files: ArtifactFiles
  note?: string
  createdBy?: Artifact["createdBy"]
}

export interface UpdateArtifactInput {
  id: string
  files: ArtifactFiles
  note?: string
}

function readMetaFromDisk(file: string): ArtifactMeta | null {
  const parsed = readJsonSafe(file, metaSchema)
  return parsed ? (parsed as unknown as ArtifactMeta) : null
}

class ArtifactsService {
  list(): ArtifactListItem[] {
    const root = resolveArtifactsRoot()
    if (!fs.existsSync(root)) return []
    const entries = fs.readdirSync(root, { withFileTypes: true })
    const items: ArtifactListItem[] = []
    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      const meta = readMetaFromDisk(path.join(root, entry.name, META_FILENAME))
      if (!meta) continue
      items.push({ ...meta })
    }
    return items.sort((a, b) => b.updatedAt - a.updatedAt)
  }

  get(id: string): Artifact | null {
    const meta = readMetaFromDisk(path.join(artifactDir(id), META_FILENAME))
    if (!meta) return null
    const versions: ArtifactVersion[] = []
    for (const version of listVersionDirs(id)) {
      versions.push({
        version,
        files: readVersionFiles(id, version),
        createdAt: meta.createdAt,
      })
    }
    return { ...meta, versions }
  }

  create(input: CreateArtifactInput): Artifact {
    const parsedFiles = artifactFilesSchema.parse(input.files)
    if (!parsedFiles["index.html"]) {
      throw new Error("index.html is required for html artifacts")
    }
    enforceSizeLimits(parsedFiles)

    const now = Date.now()
    const id = buildArtifactId(input.title)
    const meta: Artifact = {
      id,
      title: input.title.trim().slice(0, 200),
      kind: "html",
      currentVersion: 1,
      createdAt: now,
      updatedAt: now,
      createdBy: input.createdBy,
      versions: [],
    }
    metaSchema.parse({ ...meta })
    ensureDir(artifactDir(id))
    writeVersionFiles(id, 1, parsedFiles)
    const { versions: _versions, ...metaOnDisk } = meta
    writeJson(path.join(artifactDir(id), META_FILENAME), metaOnDisk)
    logApp(`[artifacts] created ${id}`)
    return { ...meta, versions: [{ version: 1, files: parsedFiles, note: input.note, createdAt: now }] }
  }

  update(input: UpdateArtifactInput): Artifact {
    const metaPath = path.join(artifactDir(input.id), META_FILENAME)
    const meta = readMetaFromDisk(metaPath)
    if (!meta) throw new Error(`Artifact not found: ${input.id}`)
    const parsedFiles = artifactFilesSchema.parse(input.files)
    enforceSizeLimits(parsedFiles)

    const nextVersion = meta.currentVersion + 1
    writeVersionFiles(input.id, nextVersion, parsedFiles)
    const now = Date.now()
    const nextMeta = { ...meta, currentVersion: nextVersion, updatedAt: now }
    writeJson(metaPath, nextMeta)

    const existingVersions = listVersionDirs(input.id)
    if (existingVersions.length > ARTIFACT_MAX_VERSIONS) {
      const toRemove = existingVersions.slice(0, existingVersions.length - ARTIFACT_MAX_VERSIONS)
      for (const v of toRemove) {
        fs.rmSync(versionDir(input.id, v), { recursive: true, force: true })
      }
    }
    logApp(`[artifacts] updated ${input.id} -> v${nextVersion}`)
    return this.get(input.id)!
  }

  delete(id: string): boolean {
    const dir = artifactDir(id)
    if (!fs.existsSync(dir)) return false
    fs.rmSync(dir, { recursive: true, force: true })
    logApp(`[artifacts] deleted ${id}`)
    return true
  }
}

const artifactsService = new ArtifactsService()
export { artifactsService, ArtifactsService }

