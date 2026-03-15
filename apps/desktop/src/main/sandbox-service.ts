// Re-export from @dotagents/core — single source of truth
export {
  getSandboxState,
  saveCurrentAsSlot,
  saveBaseline,
  switchToSlot,
  restoreBaseline,
  deleteSlot,
  createSlotFromCurrentState,
  renameSlot,
  sanitizeSlotName,
} from "@dotagents/core"
export type {
  SandboxSlot,
  SandboxSlotManifest,
  SandboxState,
  SwitchSlotResult,
  SaveSlotResult,
  DeleteSlotResult,
} from "@dotagents/core"
