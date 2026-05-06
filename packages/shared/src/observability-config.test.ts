import { describe, expect, it } from 'vitest';

import type {
  LangfuseObservabilityConfig,
  LocalTraceLoggingConfig,
  ObservabilityConfig,
} from './observability-config';

function assertType<T>(_value: T): void {
  // Compile-time assertion only.
}

describe('observability config contracts', () => {
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
});
