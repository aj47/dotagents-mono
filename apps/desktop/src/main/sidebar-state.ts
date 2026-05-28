import path from "path"
import { dataFolder } from "./config"
import { logApp } from "./debug"
import { safeReadJsonFileSync, safeWriteJsonFileSync } from "./agents-files/safe-file"

const SIDEBAR_STATE_PATH = path.join(dataFolder, "sidebar-state.json")
const SIDEBAR_STATE_BACKUP_DIR = path.join(dataFolder, ".backups")
const SIDEBAR_STATE_MAX_BACKUPS = 10

export type SidebarStatePayload = {
  groups: unknown[]
  ungroupedOrder: string[]
}

type PersistedSidebarState = {
  version: 1
} & SidebarStatePayload

const EMPTY_STATE: SidebarStatePayload = { groups: [], ungroupedOrder: [] }

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string")
}

function normalize(value: Partial<PersistedSidebarState> | undefined): SidebarStatePayload {
  if (!value || typeof value !== "object") return { ...EMPTY_STATE }
  const groups = Array.isArray(value.groups) ? value.groups : []
  const ungroupedOrder = isStringArray(value.ungroupedOrder) ? value.ungroupedOrder : []
  return { groups, ungroupedOrder }
}

export function loadSidebarState(): SidebarStatePayload {
  try {
    const persisted = safeReadJsonFileSync<Partial<PersistedSidebarState>>(SIDEBAR_STATE_PATH, {
      backupDir: SIDEBAR_STATE_BACKUP_DIR,
      defaultValue: {},
    })
    return normalize(persisted)
  } catch (error) {
    logApp("[sidebar-state] Failed to load persisted state:", error)
    return { ...EMPTY_STATE }
  }
}

function isEmptyPayload(payload: SidebarStatePayload): boolean {
  return payload.groups.length === 0 && payload.ungroupedOrder.length === 0
}

/**
 * Persist sidebar state.
 *
 * Safety net against renderer-side hydration races: refuse to overwrite a
 * non-empty on-disk state with a completely empty payload unless the caller
 * explicitly opts in via `force: true`. This is what protects against the
 * class of bugs where a half-hydrated renderer echos `{ groups: [],
 * ungroupedOrder: [] }` back to disk and silently wipes the user's groups.
 *
 * A genuine "user emptied everything" write still works because the renderer
 * passes `force: true` once it knows the user actually intended an empty
 * state (see active-agents-sidebar.tsx).
 */
export function saveSidebarState(
  state: SidebarStatePayload,
  options: { force?: boolean } = {},
): { written: boolean; reason?: string } {
  const next = normalize(state)
  if (isEmptyPayload(next) && !options.force) {
    const current = loadSidebarState()
    if (!isEmptyPayload(current)) {
      logApp(
        "[sidebar-state] Refusing to overwrite non-empty state with empty payload (no force flag). " +
          `Current groups=${current.groups.length}, ungroupedOrder=${current.ungroupedOrder.length}.`,
      )
      return { written: false, reason: "empty-payload-guard" }
    }
  }
  const payload: PersistedSidebarState = { version: 1, ...next }
  try {
    safeWriteJsonFileSync(SIDEBAR_STATE_PATH, payload, {
      backupDir: SIDEBAR_STATE_BACKUP_DIR,
      maxBackups: SIDEBAR_STATE_MAX_BACKUPS,
      skipIfUnchanged: true,
    })
    return { written: true }
  } catch (error) {
    logApp("[sidebar-state] Failed to persist state:", error)
    return { written: false, reason: "write-error" }
  }
}
