import { describe, expect, it } from 'vitest';
import type {
  CloudflareTunnelConfig,
  RemoteServerConfig,
} from './remote-pairing';
import {
  buildDotAgentsConfigDeepLink,
  buildConnectableRemoteServerBaseUrl,
  buildConnectableRemoteServerBaseUrlForMobilePairing,
  buildRemoteServerBaseUrl,
  buildRemoteServerCorsOptions,
  buildRemoteServerStatusSnapshot,
  CLOUDFLARE_TUNNEL_MODE_OPTIONS,
  DEFAULT_CLOUDFLARE_TUNNEL_MODE,
  DEFAULT_REMOTE_SERVER_BIND_ADDRESS,
  DEFAULT_REMOTE_SERVER_CORS_ORIGINS,
  DEFAULT_REMOTE_SERVER_PORT,
  DEFAULT_REMOTE_SERVER_LOG_LEVEL,
  DEFAULT_REMOTE_SERVER_SECRET_MASK,
  ensureRemoteServerV1BaseUrl,
  formatConnectableRemoteHostWarning,
  formatHostForHttpUrl,
  getConnectableRemoteHostForMobilePairing,
  getConnectableRemoteHostResolutionForMobilePairing,
  getDotAgentsSecretReferenceId,
  getDotAgentsSecretsRecord,
  getDefaultRemoteServerCorsOrigins,
  getMaskedRemoteServerApiKey,
  getRemoteServerPairingApiKey,
  getRemoteServerLifecycleAction,
  getRemoteServerStartupPlan,
  resolveConnectableRemoteServerPairingBaseUrl,
  getSecretReferenceCandidates,
  hasConfiguredRemoteServerApiKey,
  isCloudflareTunnelModeUpdateValue,
  isHeadlessRemoteServerEnvironment,
  isConnectableIpv6Address,
  isLoopbackRemoteHost,
  isRemoteServerBindAddressUpdateValue,
  isRemoteServerLogLevelUpdateValue,
  redactSecretForDisplay,
  resolveDotAgentsSecretReference,
  resolveDotAgentsSecretReferenceFromStore,
  resolveRemoteServerApiKey,
  shouldAutoPrintRemoteServerPairingQr,
  isUnconnectableRemoteHostForMobilePairing,
  isWildcardRemoteHost,
  normalizeRemoteHostForComparison,
  parseDotAgentsConfigDeepLink,
  REMOTE_SERVER_BIND_ADDRESS_OPTIONS,
  REMOTE_SERVER_LOG_LEVEL_OPTIONS,
} from './remote-pairing';

function assertType<T>(_value: T): void {
  // Compile-time assertion only.
}

describe('remote server config contracts', () => {
  it('exposes persisted remote server and Cloudflare tunnel config contracts', () => {
    const remoteServerConfig: RemoteServerConfig = {
      remoteServerEnabled: true,
      remoteServerPort: 3210,
      remoteServerBindAddress: '0.0.0.0',
      remoteServerApiKey: 'secret',
      remoteServerLogLevel: 'debug',
      remoteServerCorsOrigins: ['https://app.example'],
      remoteServerOperatorAllowDeviceIds: ['device-1'],
      remoteServerAutoShowPanel: true,
      remoteServerTerminalQrEnabled: false,
    };
    const tunnelConfig: CloudflareTunnelConfig = {
      cloudflareTunnelMode: 'named',
      cloudflareTunnelAutoStart: true,
      cloudflareTunnelId: 'tunnel-id',
      cloudflareTunnelName: 'agent',
      cloudflareTunnelCredentialsPath: '/tmp/credentials.json',
      cloudflareTunnelHostname: 'agent.example.com',
    };

    assertType<RemoteServerConfig>(remoteServerConfig);
    assertType<CloudflareTunnelConfig>(tunnelConfig);
    expect(remoteServerConfig.remoteServerBindAddress).toBe('0.0.0.0');
    expect(tunnelConfig.cloudflareTunnelMode).toBe('named');
  });

  it('describes remote server option defaults and validators', () => {
    expect(DEFAULT_REMOTE_SERVER_BIND_ADDRESS).toBe('127.0.0.1');
    expect(REMOTE_SERVER_BIND_ADDRESS_OPTIONS).toEqual(['127.0.0.1', '0.0.0.0']);
    expect(DEFAULT_REMOTE_SERVER_PORT).toBe(3210);
    expect(DEFAULT_REMOTE_SERVER_LOG_LEVEL).toBe('info');
    expect(REMOTE_SERVER_LOG_LEVEL_OPTIONS).toEqual(['error', 'info', 'debug']);
    expect(DEFAULT_REMOTE_SERVER_CORS_ORIGINS).toEqual(['*']);
    expect(getDefaultRemoteServerCorsOrigins()).toEqual(['*']);
    expect(getDefaultRemoteServerCorsOrigins()).not.toBe(DEFAULT_REMOTE_SERVER_CORS_ORIGINS);
    expect(DEFAULT_CLOUDFLARE_TUNNEL_MODE).toBe('quick');
    expect(CLOUDFLARE_TUNNEL_MODE_OPTIONS).toEqual(['quick', 'named']);

    expect(isRemoteServerBindAddressUpdateValue('0.0.0.0')).toBe(true);
    expect(isRemoteServerBindAddressUpdateValue('localhost')).toBe(false);
    expect(isRemoteServerLogLevelUpdateValue('debug')).toBe(true);
    expect(isRemoteServerLogLevelUpdateValue('trace')).toBe(false);
    expect(isCloudflareTunnelModeUpdateValue('named')).toBe(true);
    expect(isCloudflareTunnelModeUpdateValue('persisted')).toBe(false);
  });
});

describe('remote pairing deep links', () => {
  it('normalizes hostnames for connectability checks and HTTP URLs', () => {
    expect(normalizeRemoteHostForComparison('[::1]')).toBe('::1');
    expect(isWildcardRemoteHost('0.0.0.0')).toBe(true);
    expect(isWildcardRemoteHost('[::]')).toBe(true);
    expect(isLoopbackRemoteHost('LOCALHOST')).toBe(true);
    expect(isLoopbackRemoteHost('[::1]')).toBe(true);
    expect(isUnconnectableRemoteHostForMobilePairing('127.0.0.1')).toBe(true);
    expect(isUnconnectableRemoteHostForMobilePairing('192.168.1.42')).toBe(false);
    expect(isConnectableIpv6Address('2001:db8::42')).toBe(true);
    expect(isConnectableIpv6Address('[2001:db8::42]')).toBe(true);
    expect(isConnectableIpv6Address('fe80::1%en0')).toBe(false);
    expect(isConnectableIpv6Address('::1')).toBe(false);
    expect(isConnectableIpv6Address('ff02::1')).toBe(false);
    expect(formatHostForHttpUrl('2001:db8::42')).toBe('[2001:db8::42]');
    expect(buildRemoteServerBaseUrl('2001:db8::42', 3210)).toBe('http://[2001:db8::42]:3210/v1');
    expect(buildConnectableRemoteServerBaseUrl('192.168.1.42', 3210)).toBe('http://192.168.1.42:3210/v1');
    expect(buildConnectableRemoteServerBaseUrl('127.0.0.1', 3210)).toBeUndefined();
    expect(ensureRemoteServerV1BaseUrl('https://agent.example.com')).toBe('https://agent.example.com/v1');
    expect(ensureRemoteServerV1BaseUrl('https://agent.example.com/v1')).toBe('https://agent.example.com/v1');
  });

  it('selects a mobile-connectable host from bind address and network interfaces', () => {
    const addresses = [
      { address: '10.0.0.2', family: 'IPv4', internal: true },
      { address: '192.168.1.10', family: 'IPv4', internal: false },
      { address: 'fe80::1%en0', family: 'IPv6', internal: false },
      { address: '2001:db8::42', family: 'IPv6', internal: false },
    ];

    expect(getConnectableRemoteHostForMobilePairing('127.0.0.1', addresses)).toBe('127.0.0.1');
    expect(getConnectableRemoteHostForMobilePairing('192.168.1.20', addresses)).toBe('192.168.1.20');
    expect(getConnectableRemoteHostForMobilePairing('0.0.0.0', addresses)).toBe('192.168.1.10');
    expect(getConnectableRemoteHostForMobilePairing('::', addresses)).toBe('2001:db8::42');
    expect(getConnectableRemoteHostForMobilePairing('::', [
      { address: '10.0.0.3', family: 4, internal: false },
    ])).toBe('10.0.0.3');
    expect(getConnectableRemoteHostForMobilePairing('0.0.0.0', [])).toBe('0.0.0.0');
    expect(buildConnectableRemoteServerBaseUrlForMobilePairing('0.0.0.0', 3210, addresses)).toBe('http://192.168.1.10:3210/v1');
    expect(buildConnectableRemoteServerBaseUrlForMobilePairing('127.0.0.1', 3210, addresses)).toBeUndefined();
    expect(resolveConnectableRemoteServerPairingBaseUrl('0.0.0.0', 3210, addresses)).toEqual({
      host: '192.168.1.10',
      baseUrl: 'http://192.168.1.10:3210/v1',
    });
    expect(resolveConnectableRemoteServerPairingBaseUrl('127.0.0.1', 3210, addresses)).toEqual({
      host: '127.0.0.1',
      warning: { type: 'loopback', host: '127.0.0.1' },
      baseUrl: undefined,
    });
    expect(resolveConnectableRemoteServerPairingBaseUrl('0.0.0.0', 3210, [])).toEqual({
      host: '0.0.0.0',
      warning: { type: 'missing-lan-address', host: '0.0.0.0', expectedFamily: 'IPv4' },
      baseUrl: undefined,
    });
    expect(getConnectableRemoteHostResolutionForMobilePairing('localhost')).toEqual({
      host: 'localhost',
      warning: { type: 'loopback', host: 'localhost' },
    });
    expect(getConnectableRemoteHostResolutionForMobilePairing('0.0.0.0', [])).toEqual({
      host: '0.0.0.0',
      warning: { type: 'missing-lan-address', host: '0.0.0.0', expectedFamily: 'IPv4' },
    });
    expect(formatConnectableRemoteHostWarning({
      type: 'loopback',
      host: '127.0.0.1',
    })).toContain('loopback only');
    expect(formatConnectableRemoteHostWarning({
      type: 'missing-lan-address',
      host: '0.0.0.0',
      expectedFamily: 'IPv4',
    })).toContain('Could not find LAN IPv4 address');
  });

  it('builds remote server status snapshots from runtime state', () => {
    expect(buildRemoteServerStatusSnapshot({
      running: true,
      bind: '0.0.0.0',
      port: 3210,
      lastError: 'previous failure',
      addresses: [
        { address: '192.168.1.10', family: 'IPv4', internal: false },
      ],
    })).toEqual({
      running: true,
      url: 'http://0.0.0.0:3210/v1',
      connectableUrl: 'http://192.168.1.10:3210/v1',
      bind: '0.0.0.0',
      port: 3210,
      lastError: 'previous failure',
    });

    expect(buildRemoteServerStatusSnapshot({ running: false })).toEqual({
      running: false,
      url: undefined,
      connectableUrl: undefined,
      bind: '127.0.0.1',
      port: 3210,
      lastError: undefined,
    });
  });

  it('detects headless remote server environments from plain runtime inputs', () => {
    expect(isHeadlessRemoteServerEnvironment({
      platform: 'linux',
      env: {},
    })).toBe(true);
    expect(isHeadlessRemoteServerEnvironment({
      platform: 'linux',
      env: { DISPLAY: ':0' },
    })).toBe(false);
    expect(isHeadlessRemoteServerEnvironment({
      platform: 'darwin',
      env: { DOTAGENTS_TERMINAL_MODE: '1' },
    })).toBe(true);
    expect(isHeadlessRemoteServerEnvironment({
      platform: 'darwin',
      env: {},
    })).toBe(false);
  });

  it('builds the DotAgents config deep link used for mobile pairing QR codes', () => {
    expect(buildDotAgentsConfigDeepLink({
      baseUrl: 'https://agent.example.com/v1',
      apiKey: 'secret key/with spaces',
      model: 'gpt-4.1-mini',
    })).toBe('dotagents://config?baseUrl=https%3A%2F%2Fagent.example.com%2Fv1&apiKey=secret+key%2Fwith+spaces&model=gpt-4.1-mini');
  });

  it('formats remote server secrets for display without exposing raw values', () => {
    expect(DEFAULT_REMOTE_SERVER_SECRET_MASK).toBe('••••••••');
    expect(redactSecretForDisplay(undefined)).toBe('');
    expect(redactSecretForDisplay('short')).toBe('***');
    expect(redactSecretForDisplay('1234567890abcdef')).toBe('1234...cdef');
    expect(getMaskedRemoteServerApiKey(undefined)).toBe('');
    expect(getMaskedRemoteServerApiKey('secret')).toBe(DEFAULT_REMOTE_SERVER_SECRET_MASK);
    expect(getMaskedRemoteServerApiKey('secret', 'MASK')).toBe('MASK');
    expect(hasConfiguredRemoteServerApiKey({ remoteServerApiKey: ' secret ' })).toBe(true);
    expect(hasConfiguredRemoteServerApiKey({ remoteServerApiKey: '   ' })).toBe(false);
    expect(resolveRemoteServerApiKey({ remoteServerApiKey: ' secret ' })).toBe('secret');
    expect(resolveRemoteServerApiKey({})).toBe('');
    expect(resolveRemoteServerApiKey(
      { remoteServerApiKey: 'dotagents-secret://remote' },
      () => ' resolved-secret ',
    )).toBe('resolved-secret');
    expect(resolveRemoteServerApiKey(
      { remoteServerApiKey: 'dotagents-secret://missing' },
      () => undefined,
    )).toBe('');
    expect(getRemoteServerPairingApiKey({ remoteServerApiKey: ' secret ' })).toBe('secret');
    expect(getRemoteServerPairingApiKey({ remoteServerApiKey: ' secret ', streamerModeEnabled: true })).toBe('');
    expect(shouldAutoPrintRemoteServerPairingQr({
      apiKey: 'secret',
      headlessEnvironment: true,
    })).toBe(true);
    expect(shouldAutoPrintRemoteServerPairingQr({
      apiKey: 'secret',
      terminalQrEnabled: true,
    })).toBe(true);
    expect(shouldAutoPrintRemoteServerPairingQr({
      skipAutoPrintQR: true,
      apiKey: 'secret',
      headlessEnvironment: true,
    })).toBe(false);
    expect(shouldAutoPrintRemoteServerPairingQr({
      apiKey: '',
      headlessEnvironment: true,
    })).toBe(false);
    expect(shouldAutoPrintRemoteServerPairingQr({
      apiKey: 'secret',
      streamerModeEnabled: true,
      headlessEnvironment: true,
    })).toBe(false);
  });

  it('builds remote server startup plans and CORS options from config', () => {
    expect(getRemoteServerStartupPlan({ remoteServerEnabled: false })).toEqual({
      shouldStart: false,
      reason: 'disabled',
    });

    expect(getRemoteServerStartupPlan({
      remoteServerEnabled: false,
      remoteServerPort: 4000,
      remoteServerBindAddress: '0.0.0.0',
      remoteServerLogLevel: 'debug',
      remoteServerCorsOrigins: ['https://app.example'],
      remoteServerApiKey: ' secret ',
    }, {
      forceEnabled: true,
      bindAddressOverride: '192.168.1.10',
    })).toEqual({
      shouldStart: true,
      bind: '192.168.1.10',
      port: 4000,
      logLevel: 'debug',
      corsOrigins: ['https://app.example'],
      resolvedApiKey: 'secret',
      hasConfiguredApiKey: true,
      apiKeyAction: 'none',
    });

    expect(getRemoteServerStartupPlan({ remoteServerEnabled: true })).toEqual(expect.objectContaining({
      shouldStart: true,
      bind: '127.0.0.1',
      port: 3210,
      logLevel: 'info',
      corsOrigins: ['*'],
      resolvedApiKey: '',
      hasConfiguredApiKey: false,
      apiKeyAction: 'generate',
    }));

    expect(getRemoteServerStartupPlan({
      remoteServerEnabled: true,
      remoteServerApiKey: 'dotagents-secret://remote',
    }, {
      resolveApiKey: () => undefined,
    })).toEqual(expect.objectContaining({
      shouldStart: true,
      resolvedApiKey: '',
      hasConfiguredApiKey: true,
      apiKeyAction: 'warn-unresolved',
    }));

    expect(buildRemoteServerCorsOptions(['*'])).toEqual({
      origin: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Device-Id', 'X-DotAgents-Device-Id'],
      credentials: true,
      maxAge: 86400,
      preflight: true,
      strictPreflight: false,
    });
    expect(buildRemoteServerCorsOptions(['https://app.example'])).toEqual(expect.objectContaining({
      origin: ['https://app.example'],
    }));
  });

  it('extracts and decodes DotAgents secret reference candidates', () => {
    expect(getDotAgentsSecretReferenceId('dotagents-secret://remote%252Fapi')).toBe('remote%252Fapi');
    expect(getDotAgentsSecretReferenceId('plain-secret')).toBeUndefined();
    expect(getDotAgentsSecretReferenceId('dotagents-secret://')).toBeUndefined();
    expect(getSecretReferenceCandidates('remote%252Fapi')).toEqual([
      'remote%252Fapi',
      'remote%2Fapi',
      'remote/api',
    ]);
    const secretStore = {
      secrets: {
        'remote/api': 'resolved-secret',
        empty: '',
        count: 1,
      },
    };
    expect(getDotAgentsSecretsRecord(secretStore)).toBe(secretStore.secrets);
    expect(getDotAgentsSecretsRecord({ secrets: null })).toBeUndefined();
    expect(getDotAgentsSecretsRecord({})).toBeUndefined();
    expect(resolveDotAgentsSecretReference('plain-secret', secretStore.secrets)).toBe('plain-secret');
    expect(resolveDotAgentsSecretReference('dotagents-secret://remote%252Fapi', secretStore.secrets)).toBe('resolved-secret');
    expect(resolveDotAgentsSecretReference('dotagents-secret://missing', secretStore.secrets)).toBeUndefined();
    expect(resolveDotAgentsSecretReference('dotagents-secret://empty', secretStore.secrets)).toBeUndefined();
    expect(resolveDotAgentsSecretReference('dotagents-secret://count', secretStore.secrets)).toBeUndefined();
    expect(resolveDotAgentsSecretReference('dotagents-secret://remote%252Fapi', undefined)).toBeUndefined();
    expect(resolveDotAgentsSecretReferenceFromStore('plain-secret', () => {
      throw new Error('should not load direct values');
    })).toBe('plain-secret');
    expect(resolveDotAgentsSecretReferenceFromStore('dotagents-secret://remote%252Fapi', () => secretStore)).toBe('resolved-secret');
    expect(resolveDotAgentsSecretReferenceFromStore('dotagents-secret://missing', () => secretStore)).toBeUndefined();
    expect(resolveDotAgentsSecretReferenceFromStore('dotagents-secret://remote%252Fapi', () => {
      throw new Error('bad store');
    })).toBeUndefined();
  });

  it('decides remote server lifecycle actions from settings changes', () => {
    expect(getRemoteServerLifecycleAction(
      { remoteServerEnabled: false },
      { remoteServerEnabled: true },
    )).toBe('start');

    expect(getRemoteServerLifecycleAction(
      { remoteServerEnabled: true },
      { remoteServerEnabled: false },
    )).toBe('stop');

    expect(getRemoteServerLifecycleAction(
      { remoteServerEnabled: false, remoteServerPort: 3210 },
      { remoteServerEnabled: false, remoteServerPort: 3211 },
    )).toBe('noop');

    expect(getRemoteServerLifecycleAction(
      { remoteServerEnabled: true, remoteServerPort: 3210 },
      { remoteServerEnabled: true, remoteServerPort: 3211 },
    )).toBe('restart');

    expect(getRemoteServerLifecycleAction(
      { remoteServerEnabled: true, remoteServerCorsOrigins: ['*'] },
      { remoteServerEnabled: true, remoteServerCorsOrigins: ['https://app.example'] },
    )).toBe('restart');

    expect(getRemoteServerLifecycleAction(
      { remoteServerEnabled: true },
      { remoteServerEnabled: true },
    )).toBe('noop');
  });

  it('parses generated pairing links', () => {
    const link = buildDotAgentsConfigDeepLink({
      baseUrl: 'http://192.168.1.42:3210/v1',
      apiKey: 'remote-secret',
    });

    expect(parseDotAgentsConfigDeepLink(link)).toEqual({
      baseUrl: 'http://192.168.1.42:3210/v1',
      apiKey: 'remote-secret',
      model: undefined,
    });
  });

  it('accepts path-style config links as a compatibility shape', () => {
    expect(parseDotAgentsConfigDeepLink('dotagents:///config?baseUrl=https%3A%2F%2Fexample.com%2Fv1')).toEqual({
      baseUrl: 'https://example.com/v1',
      apiKey: undefined,
      model: undefined,
    });
  });

  it('rejects unsupported or empty links', () => {
    expect(parseDotAgentsConfigDeepLink('https://example.com/config?baseUrl=x')).toBeNull();
    expect(parseDotAgentsConfigDeepLink('dotagents://config')).toBeNull();
    expect(parseDotAgentsConfigDeepLink('not a url')).toBeNull();
  });
});
