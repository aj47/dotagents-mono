import { globalAgentsFolder } from "./config"
import {
  importBundle,
  previewBundle,
  type ImportBundleResult,
  type ImportOptions,
} from "./bundle-service"
import { refreshRuntimeAfterManagedBundleImport } from "./bundle-management"
import {
  createSlotFromCurrentState,
  deleteSlot,
  getSandboxState,
  renameSlot,
  restoreBaseline,
  sanitizeSlotName,
  saveBaseline,
  saveCurrentAsSlot,
  switchToSlot,
  type DeleteSlotResult,
  type SandboxSlot,
  type SandboxState,
  type SaveSlotResult,
  type SwitchSlotResult,
} from "./sandbox-service"

interface SandboxSelectionCandidate {
  name: string
}

export interface ResolvedManagedSandboxSlotSelection<
  T extends SandboxSelectionCandidate,
> {
  selectedSlot?: T
  ambiguousSlots?: T[]
}

export interface ManagedSandboxBundleImportResult extends ImportBundleResult {
  slotName?: string
  sourceBundleName?: string
}

function normalizeManagedSandboxSlotQuery(value: string): string {
  const trimmed = value.trim()
  return trimmed ? sanitizeSlotName(trimmed) : ""
}

function buildManagedSandboxBundleImportFailure(
  error: string,
  options: {
    slotName?: string
    sourceBundleName?: string
  } = {},
): ManagedSandboxBundleImportResult {
  return {
    success: false,
    agentProfiles: [],
    mcpServers: [],
    skills: [],
    repeatTasks: [],
    knowledgeNotes: [],
    errors: [error],
    slotName: options.slotName,
    sourceBundleName: options.sourceBundleName,
  }
}

export function sanitizeManagedSandboxSlotName(name: string): string {
  return sanitizeSlotName(name)
}

export function getManagedSandboxState(): SandboxState {
  return getSandboxState(globalAgentsFolder)
}

export function resolveManagedSandboxSlotSelection<
  T extends SandboxSelectionCandidate,
>(
  slots: readonly T[],
  query: string,
): ResolvedManagedSandboxSlotSelection<T> {
  const normalizedQuery = normalizeManagedSandboxSlotQuery(query)
  if (!normalizedQuery) {
    return {}
  }

  const exactMatch = slots.find(
    (slot) => normalizeManagedSandboxSlotQuery(slot.name) === normalizedQuery,
  )
  if (exactMatch) {
    return { selectedSlot: exactMatch }
  }

  const prefixMatches = slots.filter((slot) =>
    normalizeManagedSandboxSlotQuery(slot.name).startsWith(normalizedQuery),
  )

  if (prefixMatches.length === 1) {
    return { selectedSlot: prefixMatches[0] }
  }

  if (prefixMatches.length > 1) {
    return { ambiguousSlots: prefixMatches }
  }

  return {}
}

export function saveManagedSandboxBaseline(): SaveSlotResult {
  return saveBaseline(globalAgentsFolder)
}

export function saveManagedCurrentSandboxSlot(
  name: string,
  options?: { sourceBundleName?: string },
): SaveSlotResult {
  return saveCurrentAsSlot(globalAgentsFolder, name, options)
}

export async function switchManagedSandboxSlot(
  name: string,
): Promise<SwitchSlotResult> {
  const result = switchToSlot(globalAgentsFolder, name)
  if (result.success) {
    await refreshRuntimeAfterManagedBundleImport()
  }
  return result
}

export async function restoreManagedSandboxBaseline(): Promise<SwitchSlotResult> {
  const result = restoreBaseline(globalAgentsFolder)
  if (result.success) {
    await refreshRuntimeAfterManagedBundleImport()
  }
  return result
}

export function deleteManagedSandboxSlot(name: string): DeleteSlotResult {
  return deleteSlot(globalAgentsFolder, name)
}

export function renameManagedSandboxSlot(
  oldName: string,
  newName: string,
): SaveSlotResult {
  return renameSlot(globalAgentsFolder, oldName, newName)
}

export async function importManagedBundleToSandbox(options: {
  filePath: string
  slotName: string
  importOptions: ImportOptions
}): Promise<ManagedSandboxBundleImportResult> {
  const sourceBundleName = previewBundle(options.filePath)?.manifest.name
  const sanitizedSlotName = sanitizeManagedSandboxSlotName(options.slotName)

  if (sanitizedSlotName === "default") {
    return buildManagedSandboxBundleImportFailure(
      'Cannot import a bundle into the reserved "default" baseline slot',
      {
        slotName: sanitizedSlotName,
        sourceBundleName,
      },
    )
  }

  const slotResult = createSlotFromCurrentState(
    globalAgentsFolder,
    options.slotName,
    { sourceBundleName },
  )
  if (!slotResult.success) {
    return buildManagedSandboxBundleImportFailure(
      slotResult.error || "Failed to create sandbox slot",
      {
        slotName: sanitizedSlotName,
        sourceBundleName,
      },
    )
  }

  const switchResult = switchToSlot(globalAgentsFolder, options.slotName)
  if (!switchResult.success) {
    return buildManagedSandboxBundleImportFailure(
      switchResult.error || "Failed to switch to sandbox slot",
      {
        slotName: sanitizedSlotName,
        sourceBundleName,
      },
    )
  }

  const importResult = await importBundle(
    options.filePath,
    globalAgentsFolder,
    options.importOptions,
  )

  const saveResult = saveCurrentAsSlot(globalAgentsFolder, options.slotName, {
    sourceBundleName,
  })
  if (!saveResult.success) {
    return buildManagedSandboxBundleImportFailure(
      saveResult.error || "Failed to save sandbox slot after importing bundle",
      {
        slotName: sanitizedSlotName,
        sourceBundleName,
      },
    )
  }

  await refreshRuntimeAfterManagedBundleImport()

  return {
    ...importResult,
    slotName: saveResult.slot?.name || sanitizedSlotName,
    sourceBundleName,
  }
}

export type { SandboxSlot, SandboxState, SaveSlotResult, SwitchSlotResult }
