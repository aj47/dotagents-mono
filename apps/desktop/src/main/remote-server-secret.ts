import fs from "fs"
import path from "path"
import { configStore, globalAgentsFolder } from "./config"
import type { Config } from "../shared/types"

export const DOTAGENTS_SECRET_REF_PREFIX = "dotagents-secret://"
export const DOTAGENTS_SECRETS_LOCAL_JSON = "secrets.local.json"

function getSecretReferenceCandidates(secretId: string): string[] {
  const candidates = new Set<string>([secretId])
  let current = secretId

  for (let i = 0; i < 3; i += 1) {
    try {
      const decoded = decodeURIComponent(current)
      if (decoded === current) break
      candidates.add(decoded)
      current = decoded
    } catch {
      break
    }
  }

  return [...candidates]
}

export function readDotAgentsSecretReference(value: string): string | undefined {
  if (!value.startsWith(DOTAGENTS_SECRET_REF_PREFIX)) {
    return value
  }

  const secretId = value.slice(DOTAGENTS_SECRET_REF_PREFIX.length)
  if (!secretId) return undefined

  try {
    const secretsPath = path.join(globalAgentsFolder, DOTAGENTS_SECRETS_LOCAL_JSON)
    const parsed = JSON.parse(fs.readFileSync(secretsPath, "utf8")) as { secrets?: Record<string, unknown> }
    const secrets = parsed && typeof parsed === "object" ? parsed.secrets : undefined
    if (!secrets || typeof secrets !== "object") return undefined

    for (const candidate of getSecretReferenceCandidates(secretId)) {
      const secret = secrets[candidate]
      if (typeof secret === "string" && secret.length > 0) {
        return secret
      }
    }
  } catch {
    // Missing or invalid local secret storage should not expose the reference.
  }

  return undefined
}

export function getResolvedRemoteServerApiKey(cfg: Pick<Config, "remoteServerApiKey"> = configStore.get()): string {
  const resolved = cfg.remoteServerApiKey
    ? readDotAgentsSecretReference(cfg.remoteServerApiKey)
    : undefined
  return resolved?.trim() || ""
}

export function hasConfiguredRemoteServerApiKey(cfg: Pick<Config, "remoteServerApiKey"> = configStore.get()): boolean {
  return (cfg.remoteServerApiKey ?? "").trim().length > 0
}
