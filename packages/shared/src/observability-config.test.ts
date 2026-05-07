import { describe, expect, it } from 'vitest';

import {
  buildLangfuseDrafts,
  DEFAULT_LANGFUSE_ENABLED,
  DEFAULT_LOCAL_TRACE_LOGGING_ENABLED,
  LANGFUSE_CREDENTIAL_FIELD_METADATA,
  LOCAL_TRACE_LOG_PATH_FIELD_METADATA,
  LOCAL_TRACE_LOGGING_SETTING_METADATA,
} from './observability-config';
import type {
  LangfuseObservabilityConfig,
  LocalTraceLoggingConfig,
  ObservabilityConfig,
} from './observability-config';

function assertType<T>(_value: T): void {
  // Compile-time assertion only.
}

describe('observability config contracts', () => {
  it('exposes shared observability defaults', () => {
    expect(DEFAULT_LANGFUSE_ENABLED).toBe(false);
    expect(DEFAULT_LOCAL_TRACE_LOGGING_ENABLED).toBe(false);
  });

  it('exposes persisted Langfuse and local trace logging config contracts', () => {
    const langfuseConfig: LangfuseObservabilityConfig = {
      langfuseEnabled: true,
      langfusePublicKey: 'pk-lf',
      langfuseSecretKey: 'sk-lf',
      langfuseBaseUrl: 'https://langfuse.example',
    };
    const localTraceConfig: LocalTraceLoggingConfig = {
      localTraceLoggingEnabled: true,
      localTraceLogPath: '/tmp/dotagents-traces',
    };
    const observabilityConfig: ObservabilityConfig = {
      ...langfuseConfig,
      ...localTraceConfig,
    };

    assertType<LangfuseObservabilityConfig>(langfuseConfig);
    assertType<LocalTraceLoggingConfig>(localTraceConfig);
    assertType<ObservabilityConfig>(observabilityConfig);
    expect(observabilityConfig.langfuseBaseUrl).toBe('https://langfuse.example');
    expect(observabilityConfig.localTraceLogPath).toBe('/tmp/dotagents-traces');
  });

  it('builds Langfuse string drafts from optional config', () => {
    expect(buildLangfuseDrafts(undefined)).toEqual({
      langfusePublicKey: '',
      langfuseSecretKey: '',
      langfuseBaseUrl: '',
    });
    expect(buildLangfuseDrafts({
      langfusePublicKey: 'pk-lf',
      langfuseSecretKey: 'sk-lf',
      langfuseBaseUrl: 'https://langfuse.example',
    })).toEqual({
      langfusePublicKey: 'pk-lf',
      langfuseSecretKey: 'sk-lf',
      langfuseBaseUrl: 'https://langfuse.example',
    });
  });

  it('exposes shared Langfuse credential field placeholders', () => {
    expect(LANGFUSE_CREDENTIAL_FIELD_METADATA).toEqual({
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
    });
  });

  it('exposes shared local trace logging setting metadata', () => {
    expect(LOCAL_TRACE_LOGGING_SETTING_METADATA).toEqual({
      key: 'localTraceLoggingEnabled',
      label: 'Local trace logging',
      tooltip: 'Write each agent session trace to its own local JSONL file on this device. Independent of Langfuse Cloud.',
      helperText: 'Write agent session traces to JSONL files on the desktop machine.',
    });
    expect(LOCAL_TRACE_LOG_PATH_FIELD_METADATA).toEqual({
      key: 'localTraceLogPath',
      label: 'Trace Folder',
      placeholder: 'Use default traces folder',
      helperText: 'Optional desktop filesystem path for trace files.',
    });
  });
});
