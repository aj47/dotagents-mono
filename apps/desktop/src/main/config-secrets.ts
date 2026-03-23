import crypto from "crypto"
import fs from "fs"
import path from "path"
import { safeStorage } from "electron"
import type { Config } from "@shared/types"

export type ConfigSecrets = Record<string, unknown>

export const CONFIG_SECRETS_FILE_NAME = "config-secrets.json"
export const CONFIG_SECRETS_KEY_FILE_NAME = ".config-secrets.key"

const SAFE_STORAGE_METHOD = "safeStorage"
const AES_GCM_METHOD = "aes-256-gcm"

type SplitSecretsResult = {
  sanitizedValue: unknown
  secretValue?: unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function normalizeSecretKeyName(key: string): string {
  return key.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()
}

function isSecretKeyName(key: string): boolean {
  const normalized = normalizeSecretKeyName(key)

  return (
    normalized.includes("apikey") ||
    normalized.includes("secret") ||
    normalized.endsWith("password") ||
    normalized.endsWith("token") ||
    normalized.endsWith("tokens") ||
    normalized.includes("accesstoken") ||
    normalized.includes("refreshtoken") ||
    normalized.includes("idtoken") ||
    normalized.includes("authorization") ||
    normalized.includes("bearer") ||
    normalized.includes("privatekey") ||
    normalized.includes("codeverifier") ||
    normalized.includes("cookie")
  )
}

function hasOwnEntries(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some((entry) => entry !== null && entry !== undefined)
  }

  if (isRecord(value)) {
    return Object.keys(value).length > 0
  }

  return value !== undefined
}

function trimTrailingNulls(values: unknown[]): unknown[] {
  const trimmed = [...values]

  while (trimmed.length > 0 && trimmed[trimmed.length - 1] === null) {
    trimmed.pop()
  }

  return trimmed
}

function splitValueSecrets(value: unknown): SplitSecretsResult {
  if (Array.isArray(value)) {
    const sanitizedItems: unknown[] = []
    const secretItems: unknown[] = []

    for (const item of value) {
      const splitItem = splitValueSecrets(item)
      sanitizedItems.push(splitItem.sanitizedValue)
      secretItems.push(splitItem.secretValue ?? null)
    }

    return {
      sanitizedValue: sanitizedItems,
      secretValue: hasOwnEntries(secretItems) ? trimTrailingNulls(secretItems) : undefined,
    }
  }

  if (!isRecord(value)) {
    return { sanitizedValue: value }
  }

  const sanitizedObject: Record<string, unknown> = {}
  const secretsObject: Record<string, unknown> = {}

  for (const [key, entryValue] of Object.entries(value)) {
    if (isSecretKeyName(key)) {
      if (entryValue !== "" && entryValue !== undefined) {
        secretsObject[key] = entryValue
      }
      continue
    }

    const splitEntry = splitValueSecrets(entryValue)
    sanitizedObject[key] = splitEntry.sanitizedValue

    if (splitEntry.secretValue !== undefined) {
      secretsObject[key] = splitEntry.secretValue
    }
  }

  return {
    sanitizedValue: sanitizedObject,
    secretValue: Object.keys(secretsObject).length > 0 ? secretsObject : undefined,
  }
}

function mergeSecretValue(baseValue: unknown, secretValue: unknown): unknown {
  if (secretValue === undefined || secretValue === null) {
    return baseValue
  }

  if (Array.isArray(secretValue)) {
    const baseItems = Array.isArray(baseValue) ? baseValue : []
    const mergedItems = secretValue.map((entry, index) => mergeSecretValue(baseItems[index], entry))

    if (baseItems.length > secretValue.length) {
      mergedItems.push(...baseItems.slice(secretValue.length))
    }

    return mergedItems
  }

  if (isRecord(secretValue)) {
    const baseRecord = isRecord(baseValue) ? baseValue : {}
    const mergedRecord: Record<string, unknown> = { ...baseRecord }

    for (const [key, value] of Object.entries(secretValue)) {
      mergedRecord[key] = mergeSecretValue(baseRecord[key], value)
    }

    return mergedRecord
  }

  return secretValue
}

function sortValueForComparison(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => sortValueForComparison(entry))
  }

  if (!isRecord(value)) {
    return value
  }

  const sortedEntries = Object.entries(value)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entryValue]) => [key, sortValueForComparison(entryValue)])

  return Object.fromEntries(sortedEntries)
}

function stableStringify(value: unknown): string {
  return JSON.stringify(sortValueForComparison(value))
}

export function splitConfigSecrets(config: Partial<Config> | undefined | null): {
  sanitizedConfig: Config
  secrets: ConfigSecrets
} {
  const source = (config ?? {}) as Config
  const split = splitValueSecrets(source)

  return {
    sanitizedConfig: split.sanitizedValue as Config,
    secrets: (split.secretValue as ConfigSecrets | undefined) ?? {},
  }
}

export function mergeConfigSecrets(
  baseConfig: Partial<Config> | undefined | null,
  secrets: ConfigSecrets | undefined | null,
): Config {
  return mergeSecretValue((baseConfig ?? {}) as Config, secrets ?? {}) as Config
}

export function mergeStoredConfigSecrets(
  currentSecrets: ConfigSecrets | undefined | null,
  incomingSecrets: ConfigSecrets | undefined | null,
): ConfigSecrets {
  return mergeSecretValue(currentSecrets ?? {}, incomingSecrets ?? {}) as ConfigSecrets
}

export function didConfigSecretsChange(
  previousSecrets: ConfigSecrets | undefined | null,
  nextSecrets: ConfigSecrets | undefined | null,
): boolean {
  return stableStringify(previousSecrets ?? {}) !== stableStringify(nextSecrets ?? {})
}

export function didSanitizedConfigChange(
  previousConfig: Partial<Config> | undefined | null,
  nextConfig: Partial<Config> | undefined | null,
): boolean {
  return stableStringify(previousConfig ?? {}) !== stableStringify(nextConfig ?? {})
}

function canUseSafeStorage(): boolean {
  if (process.env.DOTAGENTS_DISABLE_SAFE_STORAGE === "true") {
    return false
  }

  try {
    return safeStorage.isEncryptionAvailable()
  } catch {
    return false
  }
}

export class ConfigSecretStorage {
  private readonly storageFilePath: string
  private readonly encryptionKeyFilePath: string
  private fallbackKey: Buffer | null = null

  constructor(private readonly dataDirectory: string) {
    this.storageFilePath = path.join(dataDirectory, CONFIG_SECRETS_FILE_NAME)
    this.encryptionKeyFilePath = path.join(dataDirectory, CONFIG_SECRETS_KEY_FILE_NAME)
  }

  private getFallbackKey(): Buffer {
    if (this.fallbackKey) {
      return this.fallbackKey
    }

    if (fs.existsSync(this.encryptionKeyFilePath)) {
      this.fallbackKey = fs.readFileSync(this.encryptionKeyFilePath)
      return this.fallbackKey
    }

    this.fallbackKey = crypto.randomBytes(32)
    fs.mkdirSync(this.dataDirectory, { recursive: true })
    fs.writeFileSync(this.encryptionKeyFilePath, this.fallbackKey, { mode: 0o600 })
    return this.fallbackKey
  }

  private encrypt(data: string): string {
    if (canUseSafeStorage()) {
      return JSON.stringify({
        method: SAFE_STORAGE_METHOD,
        data: safeStorage.encryptString(data).toString("base64"),
      })
    }

    const iv = crypto.randomBytes(12)
    const cipher = crypto.createCipheriv("aes-256-gcm", this.getFallbackKey(), iv)
    const encrypted = Buffer.concat([cipher.update(data, "utf8"), cipher.final()])
    const authTag = cipher.getAuthTag()

    return JSON.stringify({
      method: AES_GCM_METHOD,
      data: encrypted.toString("base64"),
      iv: iv.toString("base64"),
      authTag: authTag.toString("base64"),
    })
  }

  private decrypt(encryptedData: string): string {
    const payload = JSON.parse(encryptedData) as {
      method: string
      data: string
      iv?: string
      authTag?: string
    }

    if (payload.method === SAFE_STORAGE_METHOD) {
      return safeStorage.decryptString(Buffer.from(payload.data, "base64"))
    }

    if (payload.method !== AES_GCM_METHOD || !payload.iv || !payload.authTag) {
      throw new Error("Unknown config secret storage format")
    }

    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      this.getFallbackKey(),
      Buffer.from(payload.iv, "base64"),
    )
    decipher.setAuthTag(Buffer.from(payload.authTag, "base64"))

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(payload.data, "base64")),
      decipher.final(),
    ])

    return decrypted.toString("utf8")
  }

  load(): ConfigSecrets {
    if (!fs.existsSync(this.storageFilePath)) {
      return {}
    }

    try {
      const encrypted = fs.readFileSync(this.storageFilePath, "utf8")
      const decrypted = this.decrypt(encrypted)
      const parsed = JSON.parse(decrypted)
      return isRecord(parsed) ? parsed : {}
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.warn(`[config-secrets] Failed to load ${this.storageFilePath}: ${message}`)
      return {}
    }
  }

  save(secrets: ConfigSecrets): void {
    if (Object.keys(secrets).length === 0) {
      try {
        fs.unlinkSync(this.storageFilePath)
      } catch {}
      return
    }

    fs.mkdirSync(this.dataDirectory, { recursive: true })
    const encrypted = this.encrypt(JSON.stringify(secrets))
    fs.writeFileSync(this.storageFilePath, encrypted, { mode: 0o600 })
  }
}
