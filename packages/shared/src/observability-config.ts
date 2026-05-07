export const DEFAULT_LANGFUSE_ENABLED = false;
export const DEFAULT_LOCAL_TRACE_LOGGING_ENABLED = false;

export type LangfuseDraftKey = 'langfusePublicKey' | 'langfuseSecretKey' | 'langfuseBaseUrl';
export type LangfuseDrafts = Record<LangfuseDraftKey, string>;

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

export function buildLangfuseDrafts(config: LangfuseObservabilityConfig | undefined | null): LangfuseDrafts {
  return {
    langfusePublicKey: config?.langfusePublicKey ?? '',
    langfuseSecretKey: config?.langfuseSecretKey ?? '',
    langfuseBaseUrl: config?.langfuseBaseUrl ?? '',
  };
}
