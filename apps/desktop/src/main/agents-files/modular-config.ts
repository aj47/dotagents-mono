// Re-export directly from source so desktop main-process code sees in-repo changes
// immediately without depending on a prebuilt @dotagents/core package artifact.
export {
  AGENTS_AGENT_PROFILES_DIR,
  AGENTS_AGENTS_MD,
  AGENTS_BACKUPS_DIR_NAME,
  AGENTS_DEFAULT_LAYOUT_JSON,
  AGENTS_DIR_NAME,
  AGENTS_LAYOUTS_DIR,
  AGENTS_MCP_JSON,
  AGENTS_MODELS_JSON,
  AGENTS_SETTINGS_JSON,
  AGENTS_SYSTEM_PROMPT_MD,
  AGENTS_TASKS_DIR,
  findAgentsDirUpward,
  getAgentsLayerPaths,
  layerHasAnyAgentsConfig,
  loadAgentsLayerConfig,
  loadAgentsPrompts,
  loadMergedAgentsConfig,
  splitConfigIntoAgentsFiles,
  writeAgentsLayerFromConfig,
  writeAgentsPrompts,
} from "../../../../../packages/core/src/agents-files/modular-config"

export type {
  AgentsLayerPaths,
  SplitAgentsConfig,
} from "../../../../../packages/core/src/agents-files/modular-config"
