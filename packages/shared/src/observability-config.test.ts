import { describe, expect, it } from 'vitest';

import {
  buildLangfuseDrafts,
  DEFAULT_LANGFUSE_ENABLED,
  DEFAULT_LOCAL_TRACE_LOGGING_ENABLED,
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
});
