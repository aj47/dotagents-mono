import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs"
import { dirname } from "path"
import { logApp } from "./debug"

export function loadPersistedJson<T>(filePath: string, label: string): T | undefined {
  try {
    if (!existsSync(filePath)) {
      return undefined
    }

    return JSON.parse(readFileSync(filePath, "utf8")) as T
  } catch (error) {
    logApp(`[${label}] Failed to load persisted state:`, error)
    return undefined
  }
}

export function savePersistedJson(filePath: string, value: unknown, label: string): void {
  try {
    mkdirSync(dirname(filePath), { recursive: true })
    writeFileSync(filePath, JSON.stringify(value, null, 2), "utf8")
  } catch (error) {
    logApp(`[${label}] Failed to persist state:`, error)
  }
}