// Re-export from @dotagents/core — single source of truth
export {
  builtinTools,
  executeBuiltinTool,
  isBuiltinTool,
  setBuiltinToolsSessionTracker,
  setBuiltinToolsMessageQueue,
  setBuiltinToolsEmergencyStop,
  setBuiltinToolsMcpService,
  setBuiltinToolsACPRouter,
} from "@dotagents/core"
export type {
  BuiltinToolsSessionTracker,
  BuiltinToolsMessageQueue,
  EmergencyStopFn,
  BuiltinToolsMcpService,
  BuiltinToolsACPRouter,
} from "@dotagents/core"

// Re-export BUILTIN_SERVER_NAME for backward compatibility
export { BUILTIN_SERVER_NAME } from "@dotagents/core"
