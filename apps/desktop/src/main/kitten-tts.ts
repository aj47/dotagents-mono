// Re-export from @dotagents/core — single source of truth
// Core exports these under aliased names; re-alias back to original names
// for backward compatibility with desktop callers.
export {
  kittenSynthesize as synthesize,
  getKittenVoices as getAvailableVoices,
  getKittenModelStatus,
  downloadKittenModel,
  disposeKittenTts as disposeTts,
  setKittenTTSPathResolver,
} from "@dotagents/core"
export type {
  KittenVoice as Voice,
  KittenModelStatus,
  KittenSynthesisResult as SynthesisResult,
} from "@dotagents/core"
