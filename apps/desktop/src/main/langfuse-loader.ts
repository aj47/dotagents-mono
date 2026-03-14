/**
 * Desktop langfuse-loader — re-exports from @dotagents/core.
 */
export {
  Langfuse,
  isLangfuseModuleInstalled as isInstalled,
} from "@dotagents/core"

export type {
  LangfuseInstance,
  LangfuseTraceClient,
  LangfuseSpanClient,
  LangfuseGenerationClient,
} from "@dotagents/core"
