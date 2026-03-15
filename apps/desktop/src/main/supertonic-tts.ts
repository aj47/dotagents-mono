// Re-export from @dotagents/core — single source of truth
// Core exports these under aliased names; re-alias back to original names
// for backward compatibility with desktop callers.
export {
  supertonicSynthesize as synthesize,
  getSupertonicVoices as getAvailableVoices,
  getSupertonicModelStatus,
  downloadSupertonicModel,
  disposeSupertonicTts as disposeTts,
  setSupertonicTTSPathResolver,
} from "@dotagents/core"
export type {
  SupertonicModelStatus,
  SupertonicSynthesisResult,
} from "@dotagents/core"
