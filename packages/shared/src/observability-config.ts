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
