import fs from "fs"
import path from "path"
import { safeWriteJsonFileSync } from "./safe-file"

export const AGENTS_SECRETS_LOCAL_JSON = "secrets.local.json"
export const SECRET_REF_PREFIX = "dotagents-secret://"

type SecretStoreFile = {
  version: 1
  secrets: Record<string, string>
}

type ExtractResult<T> = {
  value: T
  secrets: Record<string, string>
  clearedSecretIds: string[]
  changed: boolean
}

const NON_SECRET_KEY_NAMES = new Set([
  "publickey",
  "langfusepublickey",
  "tokenendpoint",
  "tokenendpointauthmethod",
  "tokenendpointauthmethodssupported",
  "tokentype",
  "tokencount",
  "tokenconfigured",
  "maxtokens",
])

function normalizeKeyName(key: string): string {
  return key.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()
}

function isSecretBearingKey(key: string): boolean {
  const normalized = normalizeKeyName(key)
  if (!normalized || NON_SECRET_KEY_NAMES.has(normalized)) return false
  if (normalized === "authorization" || normalized === "proxyauthorization") return true
  if (normalized === "apikey" || normalized.endsWith("apikey") || normalized.includes("xapikey")) return true
  if (normalized.includes("secret") || normalized.includes("password") || normalized.includes("credential")) return true
  if (normalized === "accesstoken" || normalized === "refreshtoken" || normalized.endsWith("authtoken")) return true
  if (normalized.includes("bearer")) return true
  if (normalized.includes("token") && !normalized.includes("endpoint")) return true
  if (normalized === "codeverifier") return true
  return false
}

function stablePathSegment(index: number, value: unknown): string {
  if (value && typeof value === "object") {
    const id = (value as Record<string, unknown>).id
    if (typeof id === "string" && id.trim()) return `id:${id.trim()}`
  }
  return `index:${index}`
}

function encodeSecretIdSegment(segment: string): string {
  return encodeURIComponent(segment).replace(/\./g, "%2E")
}

function secretIdForPath(pathSegments: string[]): string {
  return pathSegments.map(encodeSecretIdSegment).join(".")
}

export function getAgentsSecretsLocalPath(agentsDir: string): string {
  return path.join(agentsDir, AGENTS_SECRETS_LOCAL_JSON)
}

export function isSecretRef(value: unknown): value is string {
  return typeof value === "string" && value.startsWith(SECRET_REF_PREFIX)
}

export function makeSecretRef(secretId: string): string {
  return `${SECRET_REF_PREFIX}${encodeURIComponent(secretId)}`
}

function secretIdFromRef(ref: string): string | null {
  if (!isSecretRef(ref)) return null
  try {
    return decodeURIComponent(ref.slice(SECRET_REF_PREFIX.length))
  } catch {
    return null
  }
}

function readSecretStore(filePath: string): SecretStoreFile {
  try {
    if (!fs.existsSync(filePath)) return { version: 1, secrets: {} }
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8")) as Partial<SecretStoreFile>
    if (!parsed || typeof parsed !== "object" || typeof parsed.secrets !== "object" || !parsed.secrets) {
      return { version: 1, secrets: {} }
    }
    return {
      version: 1,
      secrets: Object.fromEntries(
        Object.entries(parsed.secrets).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
      ),
    }
  } catch {
    return { version: 1, secrets: {} }
  }
}

function writeSecretStore(filePath: string, store: SecretStoreFile): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  const tmpPath = `${filePath}.tmp-${process.pid}-${Date.now()}`
  fs.writeFileSync(tmpPath, `${JSON.stringify(store, null, 2)}\n`, { encoding: "utf8", mode: 0o600 })
  fs.renameSync(tmpPath, filePath)
  try {
    fs.chmodSync(filePath, 0o600)
  } catch {
    // Best effort: Windows and some filesystems may ignore POSIX permissions.
  }
}

export function mergeSecretsIntoLocalStore(
  filePath: string,
  secrets: Record<string, string>,
  clearedSecretIds: string[] = [],
): void {
  const store = readSecretStore(filePath)
  for (const id of clearedSecretIds) delete store.secrets[id]
  for (const [id, value] of Object.entries(secrets)) store.secrets[id] = value
  if (Object.keys(secrets).length === 0 && clearedSecretIds.length === 0) return
  writeSecretStore(filePath, store)
}

export function ensureAgentsSecretsGitignore(agentsDir: string): void {
  const gitignorePath = path.join(agentsDir, ".gitignore")
  const ignoreLine = `**/${AGENTS_SECRETS_LOCAL_JSON}*`
  try {
    fs.mkdirSync(agentsDir, { recursive: true })
    const existing = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, "utf8") : ""
    if (existing.split(/\r?\n/).some((line) => line.trim() === ignoreLine)) return
    const prefix = existing.length > 0 && !existing.endsWith("\n") ? "\n" : ""
    fs.writeFileSync(
      gitignorePath,
      `${existing}${prefix}# DotAgents local secret material\n${ignoreLine}\n`,
      "utf8",
    )
  } catch {
    // Best effort only; repository-level .gitignore also excludes this filename.
  }
}

export function extractSecretsForPersistence<T>(value: T, pathSegments: string[] = []): ExtractResult<T> {
  const secrets: Record<string, string> = {}
  const clearedSecretIds: string[] = []

  const visit = (current: unknown, currentPath: string[], currentKey?: string): { value: unknown; changed: boolean } => {
    if (Array.isArray(current)) {
      let changed = false
      const next = current.map((item, index) => {
        const result = visit(item, [...currentPath, stablePathSegment(index, item)])
        changed ||= result.changed
        return result.value
      })
      return { value: changed ? next : current, changed }
    }

    if (current && typeof current === "object") {
      let changed = false
      const next: Record<string, unknown> = {}
      for (const [key, child] of Object.entries(current as Record<string, unknown>)) {
        const result = visit(child, [...currentPath, key], key)
        next[key] = result.value
        changed ||= result.changed
      }
      return { value: changed ? next : current, changed }
    }

    if (currentKey && isSecretBearingKey(currentKey) && typeof current === "string") {
      const secretId = secretIdForPath(currentPath)
      if (current.trim().length === 0) {
        clearedSecretIds.push(secretId)
        return { value: current, changed: false }
      }
      if (isSecretRef(current)) return { value: current, changed: false }
      secrets[secretId] = current
      return { value: makeSecretRef(secretId), changed: true }
    }

    return { value: current, changed: false }
  }

  const result = visit(value, pathSegments)
  return {
    value: result.value as T,
    secrets,
    clearedSecretIds,
    changed: result.changed,
  }
}

export function prepareConfigForPersistence<T>(value: T, secretsFilePath: string): T {
  const extracted = extractSecretsForPersistence(value)
  if (extracted.changed || extracted.clearedSecretIds.length > 0) {
    mergeSecretsIntoLocalStore(secretsFilePath, extracted.secrets, extracted.clearedSecretIds)
    ensureAgentsSecretsGitignore(path.dirname(secretsFilePath))
  }
  return extracted.value
}

export function migrateJsonFileSecretsToLocalStore(
  filePath: string,
  secretsFilePath: string,
  pretty: boolean,
  options: { backupDir?: string; maxBackups?: number } = {},
): void {
  try {
    if (!fs.existsSync(filePath)) return
    const raw = fs.readFileSync(filePath, "utf8")
    const parsed = JSON.parse(raw)
    const sanitized = prepareConfigForPersistence(parsed, secretsFilePath)

    if (JSON.stringify(parsed) === JSON.stringify(sanitized)) return

    safeWriteJsonFileSync(filePath, sanitized, {
      backupDir: options.backupDir,
      maxBackups: options.maxBackups,
      pretty,
      skipIfUnchanged: true,
    })
  } catch {
    // Best effort: never block config writes on local secret migration.
  }
}

export function resolveSecretRefs<T>(value: T, secretsFilePath: string): T {
  const store = readSecretStore(secretsFilePath)

  const visit = (current: unknown): unknown => {
    if (Array.isArray(current)) return current.map(visit)
    if (current && typeof current === "object") {
      return Object.fromEntries(Object.entries(current as Record<string, unknown>).map(([key, child]) => [key, visit(child)]))
    }
    if (isSecretRef(current)) {
      const id = secretIdFromRef(current)
      return id ? (store.secrets[id] ?? current) : current
    }
    return current
  }

  return visit(value) as T
}
