export const DEFAULT_LANGFUSE_ENABLED = false;
export const DEFAULT_LOCAL_TRACE_LOGGING_ENABLED = false;

export interface LangfuseObservabilityConfig {
  langfuseEnabled?: boolean;
  langfusePublicKey?: string;
  langfuseSecretKey?: string;
  langfuseBaseUrl?: string;
}

export interface LocalTraceLoggingConfig {
  localTraceLoggingEnabled?: boolean;
  localTraceLogPath?: string;
}

export interface ObservabilityConfig extends LangfuseObservabilityConfig, LocalTraceLoggingConfig {}
