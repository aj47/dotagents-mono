/**
 * SandboxService - Named config profile slots for trying Hub bundles
 * without overwriting the default config.
 *
 * Stores snapshots of the .agents directory as named slots under
 * ~/.agents/.sandboxes/<slot-name>/. Users can save the current config
 * as a baseline, import a bundle into a sandbox slot, and switch between
 * slots instantly.
 */

import fs from "fs"
import path from "path"
import { logApp } from "./debug"

// ============================================================================
// Types
// ============================================================================

export interface SandboxSlot {
  name: string
  createdAt: string
  updatedAt: string
  isDefault: boolean
  /** Source bundle name if created from a Hub bundle import */
  sourceBundleName?: string
}

export interface SandboxSlotManifest {
  name: string
  createdAt: string
  updatedAt: string
  isDefault: boolean
  sourceBundleName?: string
}

export interface SandboxState {
  activeSlot: string | null
  slots: SandboxSlot[]
}

export interface SwitchSlotResult {
  success: boolean
  previousSlot: string | null
  activeSlot: string | null
  error?: string
}

export interface SaveSlotResult {
  success: boolean
  slot?: SandboxSlot
  error?: string
}

export interface DeleteSlotResult {
  success: boolean
  error?: string
}

// ============================================================================
// Constants
// ============================================================================

const SANDBOXES_DIR = ".sandboxes"
const SLOT_MANIFEST_FILE = "slot-manifest.json"
const ACTIVE_SLOT_FILE = "active-slot.json"
const DEFAULT_SLOT_NAME = "default"

// Files/dirs from .agents that belong to a slot snapshot
const SNAPSHOT_ITEMS = [
  "dotagents-settings.json",
  "mcp.json",
  "models.json",
  "system-prompt.md",
  "agents.md",
  "layouts",
  "agents",
  "tasks",
  "skills",
  "memories",
]

// Directories that should not be included in snapshots
const EXCLUDED_DIRS = new Set([SANDBOXES_DIR, ".backups", ".restore-staging"])

// ============================================================================
// Helpers
// ============================================================================

function getSandboxesDir(agentsDir: string): string {
  return path.join(agentsDir, SANDBOXES_DIR)
}

function getSlotDir(agentsDir: string, slotName: string): string {
  return path.join(getSandboxesDir(agentsDir), sanitizeSlotName(slotName))
}

function getActiveSlotFilePath(agentsDir: string): string {
  return path.join(getSandboxesDir(agentsDir), ACTIVE_SLOT_FILE)
}

function sanitizeSlotName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\-_ ]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    || "slot"
}

function readJsonFileSync<T>(filePath: string, defaultValue: T): T {
  try {
    if (!fs.existsSync(filePath)) return defaultValue
    const content = fs.readFileSync(filePath, "utf-8")
    return JSON.parse(content) as T
  } catch {
    return defaultValue
  }
}

function writeJsonFileSync(filePath: string, data: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8")
}

function copyDirRecursiveSync(src: string, dest: string): void {
  if (!fs.existsSync(src)) return
  // Use lstatSync to avoid following symlinks — prevents traversing outside .agents
  const stats = fs.lstatSync(src)
  if (stats.isSymbolicLink()) return // skip symlinks for safety
  if (stats.isFile()) {
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    fs.copyFileSync(src, dest)
    return
  }
  if (!stats.isDirectory()) return
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src)) {
    copyDirRecursiveSync(path.join(src, entry), path.join(dest, entry))
  }
}

function removeDirRecursiveSync(dirPath: string): void {
  try {
    fs.rmSync(dirPath, { recursive: true, force: true })
  } catch {
    // ignore
  }
}

// ============================================================================
// Core Operations
// ============================================================================

function readActiveSlotName(agentsDir: string): string | null {
  const data = readJsonFileSync<{ activeSlot?: string }>(
    getActiveSlotFilePath(agentsDir),
    {}
  )
  return data.activeSlot || null
}

function writeActiveSlotName(agentsDir: string, slotName: string | null): void {
  writeJsonFileSync(getActiveSlotFilePath(agentsDir), { activeSlot: slotName })
}

function readSlotManifest(slotDir: string): SandboxSlotManifest | null {
  const manifestPath = path.join(slotDir, SLOT_MANIFEST_FILE)
  return readJsonFileSync<SandboxSlotManifest | null>(manifestPath, null)
}

function writeSlotManifest(slotDir: string, manifest: SandboxSlotManifest): void {
  writeJsonFileSync(path.join(slotDir, SLOT_MANIFEST_FILE), manifest)
}

/**
 * Snapshot the current .agents config files into a slot directory.
 */
function snapshotAgentsDirToSlot(agentsDir: string, slotDir: string): void {
  fs.mkdirSync(slotDir, { recursive: true })

  for (const item of SNAPSHOT_ITEMS) {
    const src = path.join(agentsDir, item)
    const dest = path.join(slotDir, item)
    if (fs.existsSync(src)) {
      copyDirRecursiveSync(src, dest)
    }
  }
}

/**
 * Restore a slot's snapshot back into the .agents directory.
 * Uses a staging approach for failure-atomicity: copies slot contents to
 * a temp directory first, then swaps into the live .agents dir. If the
 * copy fails mid-way, the live config is left intact.
 */
function restoreSlotToAgentsDir(slotDir: string, agentsDir: string): void {
  // Stage: copy slot snapshot into a temp directory first so that a
  // mid-copy failure leaves the live .agents dir untouched.
  const stagingDir = path.join(agentsDir, ".restore-staging")
  try {
    removeDirRecursiveSync(stagingDir)
    fs.mkdirSync(stagingDir, { recursive: true })

    for (const item of SNAPSHOT_ITEMS) {
      const src = path.join(slotDir, item)
      const dest = path.join(stagingDir, item)
      if (fs.existsSync(src)) {
        copyDirRecursiveSync(src, dest)
      }
    }
  } catch (error) {
    // Staging failed — clean up and re-throw so the live dir stays intact
    removeDirRecursiveSync(stagingDir)
    throw error
  }

  // Swap: remove live config items, then move staged items into place
  for (const item of SNAPSHOT_ITEMS) {
    const target = path.join(agentsDir, item)
    if (fs.existsSync(target)) {
      const stats = fs.lstatSync(target)
      if (stats.isDirectory()) {
        removeDirRecursiveSync(target)
      } else {
        fs.unlinkSync(target)
      }
    }
  }

  for (const item of SNAPSHOT_ITEMS) {
    const staged = path.join(stagingDir, item)
    const dest = path.join(agentsDir, item)
    if (fs.existsSync(staged)) {
      fs.renameSync(staged, dest)
    }
  }

  removeDirRecursiveSync(stagingDir)
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Get the current sandbox state including all slots and active slot.
 */
export function getSandboxState(agentsDir: string): SandboxState {
  const sandboxesDir = getSandboxesDir(agentsDir)
  const activeSlot = readActiveSlotName(agentsDir)
  const slots: SandboxSlot[] = []

  try {
    if (!fs.existsSync(sandboxesDir)) {
      return { activeSlot, slots }
    }

    for (const entry of fs.readdirSync(sandboxesDir)) {
      if (entry === ACTIVE_SLOT_FILE) continue
      const entryPath = path.join(sandboxesDir, entry)
      if (!fs.statSync(entryPath).isDirectory()) continue

      const manifest = readSlotManifest(entryPath)
      if (manifest) {
        slots.push({
          name: manifest.name,
          createdAt: manifest.createdAt,
          updatedAt: manifest.updatedAt,
          isDefault: manifest.isDefault,
          sourceBundleName: manifest.sourceBundleName,
        })
      }
    }
  } catch (error) {
    logApp("[sandbox-service] Failed to read sandbox state", { error })
  }

  slots.sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1
    if (!a.isDefault && b.isDefault) return 1
    return a.name.localeCompare(b.name)
  })

  return { activeSlot, slots }
}

/**
 * Save the current .agents config as a named slot.
 * If the slot name is "default", it is marked as the baseline.
 */
export function saveCurrentAsSlot(
  agentsDir: string,
  slotName: string,
  options?: { sourceBundleName?: string }
): SaveSlotResult {
  try {
    const sanitized = sanitizeSlotName(slotName)
    const slotDir = getSlotDir(agentsDir, sanitized)
    const now = new Date().toISOString()

    // If slot already exists, clear it first
    if (fs.existsSync(slotDir)) {
      // Preserve manifest for createdAt
      const existingManifest = readSlotManifest(slotDir)
      removeDirRecursiveSync(slotDir)
      fs.mkdirSync(slotDir, { recursive: true })

      snapshotAgentsDirToSlot(agentsDir, slotDir)

      const manifest: SandboxSlotManifest = {
        name: sanitized,
        createdAt: existingManifest?.createdAt || now,
        updatedAt: now,
        isDefault: sanitized === DEFAULT_SLOT_NAME,
        sourceBundleName: options?.sourceBundleName,
      }
      writeSlotManifest(slotDir, manifest)

      logApp("[sandbox-service] Updated existing slot", { name: sanitized })
      return { success: true, slot: manifest }
    }

    fs.mkdirSync(slotDir, { recursive: true })
    snapshotAgentsDirToSlot(agentsDir, slotDir)

    const manifest: SandboxSlotManifest = {
      name: sanitized,
      createdAt: now,
      updatedAt: now,
      isDefault: sanitized === DEFAULT_SLOT_NAME,
      sourceBundleName: options?.sourceBundleName,
    }
    writeSlotManifest(slotDir, manifest)

    logApp("[sandbox-service] Saved new slot", { name: sanitized })
    return { success: true, slot: manifest }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    logApp("[sandbox-service] Failed to save slot", { slotName, error })
    return { success: false, error: msg }
  }
}

/**
 * Save baseline: snapshots the current config as "default" if not already saved.
 */
export function saveBaseline(agentsDir: string): SaveSlotResult {
  const state = getSandboxState(agentsDir)
  const hasDefault = state.slots.some((s) => s.isDefault)

  if (hasDefault) {
    // Update the existing default slot
    return saveCurrentAsSlot(agentsDir, DEFAULT_SLOT_NAME)
  }

  return saveCurrentAsSlot(agentsDir, DEFAULT_SLOT_NAME)
}

/**
 * Switch to a named slot. If there is an explicitly active slot, auto-saves
 * the current state into it first. Then restores the target slot.
 * If no slot is currently active (i.e. the user is in an untracked state),
 * the auto-save is skipped to avoid overwriting the baseline.
 */
export function switchToSlot(agentsDir: string, targetSlotName: string): SwitchSlotResult {
  try {
    const sanitized = sanitizeSlotName(targetSlotName)
    const targetSlotDir = getSlotDir(agentsDir, sanitized)

    if (!fs.existsSync(targetSlotDir)) {
      return {
        success: false,
        previousSlot: readActiveSlotName(agentsDir),
        activeSlot: readActiveSlotName(agentsDir),
        error: `Slot "${sanitized}" does not exist`,
      }
    }

    const currentActive = readActiveSlotName(agentsDir)

    // If already on this slot, no-op
    if (currentActive === sanitized) {
      return {
        success: true,
        previousSlot: currentActive,
        activeSlot: sanitized,
      }
    }

    // Auto-save current state into the active slot before switching.
    // Only auto-save if there is an explicit active slot — otherwise the user
    // is in an untracked state and we must not overwrite the baseline.
    if (currentActive) {
      const saveIntoDir = getSlotDir(agentsDir, currentActive)
      if (fs.existsSync(saveIntoDir)) {
        const existingManifest = readSlotManifest(saveIntoDir)
        for (const item of SNAPSHOT_ITEMS) {
          const target = path.join(saveIntoDir, item)
          if (fs.existsSync(target)) {
            const stats = fs.statSync(target)
            if (stats.isDirectory()) {
              removeDirRecursiveSync(target)
            } else {
              fs.unlinkSync(target)
            }
          }
        }
        snapshotAgentsDirToSlot(agentsDir, saveIntoDir)
        if (existingManifest) {
          existingManifest.updatedAt = new Date().toISOString()
          writeSlotManifest(saveIntoDir, existingManifest)
        }
      }
    }

    // Restore target slot
    restoreSlotToAgentsDir(targetSlotDir, agentsDir)
    writeActiveSlotName(agentsDir, sanitized)

    logApp("[sandbox-service] Switched slot", { from: currentActive, to: sanitized })
    return {
      success: true,
      previousSlot: currentActive,
      activeSlot: sanitized,
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    logApp("[sandbox-service] Failed to switch slot", { targetSlotName, error })
    return {
      success: false,
      previousSlot: readActiveSlotName(agentsDir),
      activeSlot: readActiveSlotName(agentsDir),
      error: msg,
    }
  }
}

/**
 * Restore the default baseline slot.
 */
export function restoreBaseline(agentsDir: string): SwitchSlotResult {
  return switchToSlot(agentsDir, DEFAULT_SLOT_NAME)
}

/**
 * Delete a sandbox slot. Cannot delete the default slot or the currently active slot.
 */
export function deleteSlot(agentsDir: string, slotName: string): DeleteSlotResult {
  try {
    const sanitized = sanitizeSlotName(slotName)

    if (sanitized === DEFAULT_SLOT_NAME) {
      return { success: false, error: "Cannot delete the default baseline slot" }
    }

    const activeSlot = readActiveSlotName(agentsDir)
    if (activeSlot === sanitized) {
      return { success: false, error: "Cannot delete the currently active slot. Switch to another slot first." }
    }

    const slotDir = getSlotDir(agentsDir, sanitized)
    if (!fs.existsSync(slotDir)) {
      return { success: false, error: `Slot "${sanitized}" does not exist` }
    }

    removeDirRecursiveSync(slotDir)
    logApp("[sandbox-service] Deleted slot", { name: sanitized })
    return { success: true }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    logApp("[sandbox-service] Failed to delete slot", { slotName, error })
    return { success: false, error: msg }
  }
}

/**
 * Create a new sandbox slot by snapshotting the current .agents config.
 * Ensures a baseline slot exists before saving, so the user can always
 * restore their original configuration.
 *
 * Steps:
 * 1. Ensure a baseline (default) slot exists; create one if missing
 * 2. Snapshot the current .agents config into a new named slot
 *
 * Note: This function does NOT import a bundle — bundle importing is
 * handled separately by the caller (e.g. importBundleToSandbox in tipc).
 */
export function createSlotFromCurrentState(
  agentsDir: string,
  slotName: string,
  options?: { sourceBundleName?: string }
): SaveSlotResult {
  // Ensure baseline is saved
  const state = getSandboxState(agentsDir)
  if (!state.slots.some((s) => s.isDefault)) {
    const baselineResult = saveBaseline(agentsDir)
    if (!baselineResult.success) {
      return { success: false, error: `Failed to save baseline before creating slot: ${baselineResult.error}` }
    }
  }

  return saveCurrentAsSlot(agentsDir, slotName, options)
}

/**
 * Rename a sandbox slot.
 */
export function renameSlot(
  agentsDir: string,
  oldName: string,
  newName: string
): SaveSlotResult {
  try {
    const sanitizedOld = sanitizeSlotName(oldName)
    const sanitizedNew = sanitizeSlotName(newName)

    if (sanitizedOld === DEFAULT_SLOT_NAME) {
      return { success: false, error: "Cannot rename the default baseline slot" }
    }

    if (sanitizedNew === DEFAULT_SLOT_NAME) {
      return { success: false, error: "Cannot rename a slot to \"default\" — this name is reserved for the baseline" }
    }

    const oldDir = getSlotDir(agentsDir, sanitizedOld)
    if (!fs.existsSync(oldDir)) {
      return { success: false, error: `Slot "${sanitizedOld}" does not exist` }
    }

    const newDir = getSlotDir(agentsDir, sanitizedNew)
    if (fs.existsSync(newDir)) {
      return { success: false, error: `Slot "${sanitizedNew}" already exists` }
    }

    fs.renameSync(oldDir, newDir)

    // Update manifest
    const manifest = readSlotManifest(newDir)
    if (manifest) {
      manifest.name = sanitizedNew
      manifest.updatedAt = new Date().toISOString()
      writeSlotManifest(newDir, manifest)
    }

    // Update active slot reference if needed
    const activeSlot = readActiveSlotName(agentsDir)
    if (activeSlot === sanitizedOld) {
      writeActiveSlotName(agentsDir, sanitizedNew)
    }

    logApp("[sandbox-service] Renamed slot", { from: sanitizedOld, to: sanitizedNew })
    return {
      success: true,
      slot: manifest || undefined,
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    logApp("[sandbox-service] Failed to rename slot", { oldName, newName, error })
    return { success: false, error: msg }
  }
}
