/**
 * Desktop langfuse-service — re-exports from @dotagents/core.
 */
export {
  isLangfuseInstalled,
  isLangfuseEnabled,
  getLangfuse,
  reinitializeLangfuse,
  createAgentTrace,
  getAgentTrace,
  endAgentTrace,
  createToolSpan,
  endToolSpan,
  createLLMGeneration,
  endLLMGeneration,
  flushLangfuse,
  shutdownLangfuse,
} from "@dotagents/core"
