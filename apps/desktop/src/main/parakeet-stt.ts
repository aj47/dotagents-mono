// Re-export from @dotagents/core — single source of truth
export {
  isSherpaAvailable,
  getSherpaLoadError,
  isParakeetModelReady as isModelReady,
  getParakeetModelStatus as getModelStatus,
  downloadParakeetModel as downloadModel,
  initializeRecognizer,
  transcribe,
  disposeRecognizer,
  setParakeetSTTPathResolver,
} from "@dotagents/core"
export type {
  ParakeetModelStatus as ModelStatus,
} from "@dotagents/core"
