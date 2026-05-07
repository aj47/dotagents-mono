export const DEFAULT_LANGFUSE_ENABLED = false;
export const DEFAULT_LOCAL_TRACE_LOGGING_ENABLED = false;

export type LangfuseDraftKey = 'langfusePublicKey' | 'langfuseSecretKey' | 'langfuseBaseUrl';
export type LangfuseDrafts = Record<LangfuseDraftKey, string>;

export interface LocalTraceLoggingSettingMetadata {
  key: 'localTraceLoggingEnabled';
  label: string;
  tooltip: string;
  helperText: string;
}

export const LOCAL_TRACE_LOGGING_SETTING_METADATA: LocalTraceLoggingSettingMetadata = {
  key: 'localTraceLoggingEnabled',
  label: 'Local trace logging',
  tooltip: 'Write each agent session trace to its own local JSONL file on this device. Independent of Langfuse Cloud.',
  helperText: 'Write agent session traces to JSONL files on the desktop machine.',
};

export interface LocalTraceLogPathFieldMetadata {
  key: 'localTraceLogPath';
  label: string;
  placeholder: string;
  helperText: string;
}

export const LOCAL_TRACE_LOG_PATH_FIELD_METADATA: LocalTraceLogPathFieldMetadata = {
  key: 'localTraceLogPath',
  label: 'Trace Folder',
  placeholder: 'Use default traces folder',
  helperText: 'Optional desktop filesystem path for trace files.',
};

export interface LangfuseCredentialFieldMetadata {
  key: LangfuseDraftKey;
  placeholder: string;
}

export const LANGFUSE_CREDENTIAL_FIELD_METADATA: Record<LangfuseDraftKey, LangfuseCredentialFieldMetadata> = {
  langfusePublicKey: {
    key: 'langfusePublicKey',
    placeholder: 'pk-lf-...',
  },
  langfuseSecretKey: {
    key: 'langfuseSecretKey',
    placeholder: 'sk-lf-...',
  },
  langfuseBaseUrl: {
    key: 'langfuseBaseUrl',
    placeholder: 'https://cloud.langfuse.com (default)',
  },
};

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
