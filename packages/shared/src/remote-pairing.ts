export interface DotAgentsConfigPairing {
  baseUrl?: string;
  apiKey?: string;
  model?: string;
}

export const DOTAGENTS_SECRET_REF_PREFIX = 'dotagents-secret://';
export const DEFAULT_REMOTE_SERVER_SECRET_MASK = '••••••••';

export type RemoteServerLifecycleAction = 'noop' | 'start' | 'stop' | 'restart';
export const REMOTE_SERVER_BIND_ADDRESS_OPTIONS = ['127.0.0.1', '0.0.0.0'] as const;
export const REMOTE_SERVER_LOG_LEVEL_OPTIONS = ['error', 'info', 'debug'] as const;
export const CLOUDFLARE_TUNNEL_MODE_OPTIONS = ['quick', 'named'] as const;
export const DEFAULT_REMOTE_SERVER_CORS_ORIGINS = ['*'] as const;

export type RemoteServerBindAddress = (typeof REMOTE_SERVER_BIND_ADDRESS_OPTIONS)[number];
export type RemoteServerLogLevel = (typeof REMOTE_SERVER_LOG_LEVEL_OPTIONS)[number];
export type CloudflareTunnelMode = (typeof CLOUDFLARE_TUNNEL_MODE_OPTIONS)[number];

export const DEFAULT_REMOTE_SERVER_BIND_ADDRESS: RemoteServerBindAddress = '127.0.0.1';
export const DEFAULT_REMOTE_SERVER_PORT = 3210;
export const DEFAULT_REMOTE_SERVER_LOG_LEVEL: RemoteServerLogLevel = 'info';
export const DEFAULT_CLOUDFLARE_TUNNEL_MODE: CloudflareTunnelMode = 'quick';

export function getDefaultRemoteServerCorsOrigins(): string[] {
  return [...DEFAULT_REMOTE_SERVER_CORS_ORIGINS];
}

export interface RemoteServerConfig {
  remoteServerEnabled?: boolean;
  remoteServerPort?: number;
  remoteServerBindAddress?: RemoteServerBindAddress;
  remoteServerApiKey?: string;
  remoteServerLogLevel?: RemoteServerLogLevel;
  remoteServerCorsOrigins?: string[];
  remoteServerOperatorAllowDeviceIds?: string[];
  remoteServerAutoShowPanel?: boolean;
  remoteServerTerminalQrEnabled?: boolean;
}

export interface CloudflareTunnelConfig {
  cloudflareTunnelMode?: CloudflareTunnelMode;
  cloudflareTunnelAutoStart?: boolean;
  cloudflareTunnelId?: string;
  cloudflareTunnelName?: string;
  cloudflareTunnelCredentialsPath?: string;
  cloudflareTunnelHostname?: string;
}

export interface StreamerModeConfig {
  streamerModeEnabled?: boolean;
}

export type RemoteServerLifecycleConfigLike = {
  remoteServerEnabled?: boolean;
  remoteServerPort?: number;
  remoteServerBindAddress?: RemoteServerBindAddress | string;
  remoteServerApiKey?: string;
  remoteServerLogLevel?: RemoteServerLogLevel | string;
  remoteServerCorsOrigins?: string[];
};

export type RemoteServerApiKeyConfigLike = {
  remoteServerApiKey?: string;
};

export type RemoteServerStartupPlanOptions = {
  forceEnabled?: boolean;
  bindAddressOverride?: string;
  resolveApiKey?: (value: string) => string | undefined;
};

export type RemoteServerStartupApiKeyAction = 'none' | 'generate' | 'warn-unresolved';

export type RemoteServerStartupPlan =
  | {
      shouldStart: false;
      reason: 'disabled';
    }
  | {
      shouldStart: true;
      bind: string;
      port: number;
      logLevel: string;
      corsOrigins: string[];
      resolvedApiKey: string;
      hasConfiguredApiKey: boolean;
      apiKeyAction: RemoteServerStartupApiKeyAction;
    };

export type RemoteServerCorsOptions = {
  origin: true | string[];
  methods: string[];
  allowedHeaders: string[];
  credentials: boolean;
  maxAge: number;
  preflight: boolean;
  strictPreflight: boolean;
};

export type RemoteServerPairingApiKeyConfigLike = RemoteServerApiKeyConfigLike & StreamerModeConfig;

export type RemoteServerPairingQrPrintOptions = StreamerModeConfig & {
  skipAutoPrintQR?: boolean;
  apiKey?: string;
  headlessEnvironment?: boolean;
  terminalQrEnabled?: boolean;
};

export type RemoteNetworkAddressLike = {
  address?: string;
  family?: string | number;
  internal?: boolean;
};

export type RemoteServerRuntimeEnvironmentLike = {
  platform?: string;
  env?: Record<string, string | undefined>;
};

export type ConnectableRemoteHostWarning =
  | { type: 'loopback'; host: string }
  | { type: 'missing-lan-address'; host: string; expectedFamily: 'IPv4' | 'IPv6' };

export type ConnectableRemoteHostResolution = {
  host: string;
  warning?: ConnectableRemoteHostWarning;
};

export type ConnectableRemoteServerPairingBaseUrlResolution = ConnectableRemoteHostResolution & {
  baseUrl?: string;
};

export type RemoteServerStatusSnapshot = {
  running: boolean;
  url?: string;
  connectableUrl?: string;
  bind: string;
  port: number;
  lastError?: string;
};

export type RemoteServerStatusSnapshotOptions = {
  running: boolean;
  bind?: string;
  port?: number;
  lastError?: string;
  addresses?: RemoteNetworkAddressLike[];
};

function areStringArraysEqual(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) {
    return false;
  }

  return a.every((value, index) => value === b[index]);
}

export function normalizeRemoteHostForComparison(host: string): string {
  const normalized = host.trim().toLowerCase();
  if (normalized.startsWith('[') && normalized.endsWith(']')) {
    return normalized.slice(1, -1);
  }
  return normalized;
}

export function isRemoteServerBindAddressUpdateValue(value: unknown): value is RemoteServerBindAddress {
  return typeof value === 'string'
    && REMOTE_SERVER_BIND_ADDRESS_OPTIONS.includes(value as RemoteServerBindAddress);
}

export function isRemoteServerLogLevelUpdateValue(value: unknown): value is RemoteServerLogLevel {
  return typeof value === 'string'
    && REMOTE_SERVER_LOG_LEVEL_OPTIONS.includes(value as RemoteServerLogLevel);
}

export function isCloudflareTunnelModeUpdateValue(value: unknown): value is CloudflareTunnelMode {
  return typeof value === 'string'
    && CLOUDFLARE_TUNNEL_MODE_OPTIONS.includes(value as CloudflareTunnelMode);
}

export function isWildcardRemoteHost(host: string): boolean {
  const normalizedHost = normalizeRemoteHostForComparison(host);
  return normalizedHost === '0.0.0.0' || normalizedHost === '::';
}

export function isLoopbackRemoteHost(host: string): boolean {
  const normalizedHost = normalizeRemoteHostForComparison(host);
  return normalizedHost === '127.0.0.1' || normalizedHost === 'localhost' || normalizedHost === '::1';
}

export function isUnconnectableRemoteHostForMobilePairing(host: string): boolean {
  return isWildcardRemoteHost(host) || isLoopbackRemoteHost(host);
}

export function isConnectableIpv6Address(host: string): boolean {
  const normalizedHost = normalizeRemoteHostForComparison(host);
  // Zone-scoped addresses (e.g. fe80::1%en0) are not reliable for QR/deep-link URLs.
  if (normalizedHost.includes('%')) {
    return false;
  }
  // Exclude unspecified/loopback/link-local/multicast ranges.
  if (normalizedHost === '::' || normalizedHost === '::1' || /^fe[89ab]/.test(normalizedHost) || normalizedHost.startsWith('ff')) {
    return false;
  }
  return true;
}

function isRemoteNetworkAddressFamily(address: RemoteNetworkAddressLike, family: 'IPv4' | 'IPv6'): boolean {
  return address.family === family
    || (family === 'IPv4' && address.family === 4)
    || (family === 'IPv6' && address.family === 6);
}

export function getConnectableRemoteHostForMobilePairing(
  bind: string,
  addresses: RemoteNetworkAddressLike[] = [],
): string {
  return getConnectableRemoteHostResolutionForMobilePairing(bind, addresses).host;
}

export function getConnectableRemoteHostResolutionForMobilePairing(
  bind: string,
  addresses: RemoteNetworkAddressLike[] = [],
): ConnectableRemoteHostResolution {
  const normalizedBind = normalizeRemoteHostForComparison(bind);

  if (isLoopbackRemoteHost(normalizedBind)) {
    return {
      host: normalizedBind,
      warning: { type: 'loopback', host: normalizedBind },
    };
  }

  if (!isWildcardRemoteHost(normalizedBind)) {
    return { host: normalizedBind };
  }

  const wildcardWantsIpv6 = normalizedBind === '::';
  let firstIpv4Address: string | undefined;
  let firstIpv6Address: string | undefined;

  for (const address of addresses) {
    if (address.internal || typeof address.address !== 'string') {
      continue;
    }
    if (isRemoteNetworkAddressFamily(address, 'IPv4') && !firstIpv4Address) {
      firstIpv4Address = address.address;
    }
    if (isRemoteNetworkAddressFamily(address, 'IPv6') && !firstIpv6Address && isConnectableIpv6Address(address.address)) {
      firstIpv6Address = address.address;
    }
  }

  if (wildcardWantsIpv6) {
    const host = firstIpv6Address ?? firstIpv4Address ?? normalizedBind;
    return host === normalizedBind
      ? {
        host,
        warning: { type: 'missing-lan-address', host, expectedFamily: 'IPv6' },
      }
      : { host };
  }

  const host = firstIpv4Address ?? normalizedBind;
  return host === normalizedBind
    ? {
      host,
      warning: { type: 'missing-lan-address', host, expectedFamily: 'IPv4' },
    }
    : { host };
}

export function formatConnectableRemoteHostWarning(warning: ConnectableRemoteHostWarning): string {
  if (warning.type === 'loopback') {
    return `[Remote Server] Warning: Server is bound to ${warning.host} (loopback only). ` +
      'Mobile devices on the same network cannot connect. ' +
      'Change bind address to 0.0.0.0 or your LAN IP for mobile access.';
  }

  return `[Remote Server] Warning: Could not find LAN ${warning.expectedFamily} address. ` +
    `QR code will use ${warning.host} which may not be reachable from mobile devices.`;
}

export function formatHostForHttpUrl(host: string): string {
  const normalizedHost = host.trim();
  if (normalizedHost.includes(':') && !normalizedHost.startsWith('[') && !normalizedHost.endsWith(']')) {
    return `[${normalizedHost}]`;
  }
  return normalizedHost;
}

export function buildRemoteServerBaseUrl(host: string, port: number): string {
  return `http://${formatHostForHttpUrl(host)}:${port}/v1`;
}

export function buildConnectableRemoteServerBaseUrl(host: string, port: number): string | undefined {
  return isUnconnectableRemoteHostForMobilePairing(host)
    ? undefined
    : buildRemoteServerBaseUrl(host, port);
}

export function buildConnectableRemoteServerBaseUrlForMobilePairing(
  bind: string,
  port: number,
  addresses: RemoteNetworkAddressLike[] = [],
): string | undefined {
  return resolveConnectableRemoteServerPairingBaseUrl(bind, port, addresses).baseUrl;
}

export function resolveConnectableRemoteServerPairingBaseUrl(
  bind: string,
  port: number,
  addresses: RemoteNetworkAddressLike[] = [],
): ConnectableRemoteServerPairingBaseUrlResolution {
  const resolution = getConnectableRemoteHostResolutionForMobilePairing(bind, addresses);
  return {
    ...resolution,
    baseUrl: buildConnectableRemoteServerBaseUrl(resolution.host, port),
  };
}

export function buildRemoteServerStatusSnapshot(
  options: RemoteServerStatusSnapshotOptions,
): RemoteServerStatusSnapshot {
  const bind = options.bind || DEFAULT_REMOTE_SERVER_BIND_ADDRESS;
  const port = options.port || DEFAULT_REMOTE_SERVER_PORT;
  const url = options.running ? buildRemoteServerBaseUrl(bind, port) : undefined;
  const connectableUrl = options.running
    ? resolveConnectableRemoteServerPairingBaseUrl(bind, port, options.addresses).baseUrl
    : undefined;

  return {
    running: options.running,
    url,
    connectableUrl,
    bind,
    port,
    lastError: options.lastError,
  };
}

export function ensureRemoteServerV1BaseUrl(url: string): string {
  return url.endsWith('/v1') ? url : `${url}/v1`;
}

export function redactSecretForDisplay(value?: string): string {
  if (!value) return '';
  if (value.length <= 8) return '***';
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

export function getMaskedRemoteServerApiKey(
  apiKey: string | undefined,
  secretMask: string = DEFAULT_REMOTE_SERVER_SECRET_MASK,
): string {
  return apiKey ? secretMask : '';
}

export function hasConfiguredRemoteServerApiKey(config: RemoteServerApiKeyConfigLike): boolean {
  return (config.remoteServerApiKey ?? '').trim().length > 0;
}

export function resolveRemoteServerApiKey(
  config: RemoteServerApiKeyConfigLike,
  resolveValue: (value: string) => string | undefined = (value) => value,
): string {
  const configuredValue = config.remoteServerApiKey;
  if (!configuredValue) {
    return '';
  }

  return resolveValue(configuredValue)?.trim() || '';
}

export function getRemoteServerPairingApiKey(
  config: RemoteServerPairingApiKeyConfigLike,
  resolveValue: (value: string) => string | undefined = (value) => value,
): string {
  return config.streamerModeEnabled
    ? ''
    : resolveRemoteServerApiKey(config, resolveValue);
}

export function getRemoteServerStartupPlan(
  config: RemoteServerLifecycleConfigLike,
  options: RemoteServerStartupPlanOptions = {},
): RemoteServerStartupPlan {
  if (!options.forceEnabled && !config.remoteServerEnabled) {
    return {
      shouldStart: false,
      reason: 'disabled',
    };
  }

  const resolvedApiKey = resolveRemoteServerApiKey(config, options.resolveApiKey);
  const hasConfiguredApiKey = hasConfiguredRemoteServerApiKey(config);
  const apiKeyAction: RemoteServerStartupApiKeyAction = !resolvedApiKey && !hasConfiguredApiKey
    ? 'generate'
    : !resolvedApiKey
      ? 'warn-unresolved'
      : 'none';

  return {
    shouldStart: true,
    bind: options.bindAddressOverride || config.remoteServerBindAddress || DEFAULT_REMOTE_SERVER_BIND_ADDRESS,
    port: config.remoteServerPort || DEFAULT_REMOTE_SERVER_PORT,
    logLevel: config.remoteServerLogLevel || DEFAULT_REMOTE_SERVER_LOG_LEVEL,
    corsOrigins: config.remoteServerCorsOrigins || getDefaultRemoteServerCorsOrigins(),
    resolvedApiKey,
    hasConfiguredApiKey,
    apiKeyAction,
  };
}

export function buildRemoteServerCorsOptions(corsOrigins: readonly string[] = DEFAULT_REMOTE_SERVER_CORS_ORIGINS): RemoteServerCorsOptions {
  return {
    // When origin is ["*"] or includes "*", use true to reflect the request origin.
    // This is needed because credentials: true doesn't work with literal "*".
    origin: corsOrigins.includes('*') ? true : [...corsOrigins],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Device-Id', 'X-DotAgents-Device-Id'],
    credentials: true,
    maxAge: 86400,
    preflight: true,
    strictPreflight: false,
  };
}

export function shouldAutoPrintRemoteServerPairingQr(
  options: RemoteServerPairingQrPrintOptions,
): boolean {
  if (options.skipAutoPrintQR || !options.apiKey || options.streamerModeEnabled) {
    return false;
  }

  return !!options.headlessEnvironment || !!options.terminalQrEnabled;
}

export function isHeadlessRemoteServerEnvironment(
  environment: RemoteServerRuntimeEnvironmentLike,
): boolean {
  const env = environment.env ?? {};

  if (environment.platform === 'linux') {
    const hasDisplay = env.DISPLAY || env.WAYLAND_DISPLAY;
    if (!hasDisplay) {
      return true;
    }
  }

  return env.DOTAGENTS_TERMINAL_MODE === '1';
}

export function getSecretReferenceCandidates(secretId: string): string[] {
  const candidates = new Set<string>([secretId]);
  let current = secretId;

  for (let i = 0; i < 3; i += 1) {
    try {
      const decoded = decodeURIComponent(current);
      if (decoded === current) break;
      candidates.add(decoded);
      current = decoded;
    } catch {
      break;
    }
  }

  return [...candidates];
}

export function getDotAgentsSecretReferenceId(value: string): string | undefined {
  if (!value.startsWith(DOTAGENTS_SECRET_REF_PREFIX)) {
    return undefined;
  }

  const secretId = value.slice(DOTAGENTS_SECRET_REF_PREFIX.length);
  return secretId || undefined;
}

export function getDotAgentsSecretsRecord(
  store: unknown,
): Record<string, unknown> | undefined {
  if (!store || typeof store !== 'object') {
    return undefined;
  }

  const secrets = (store as { secrets?: unknown }).secrets;
  return secrets && typeof secrets === 'object'
    ? secrets as Record<string, unknown>
    : undefined;
}

export function resolveDotAgentsSecretReference(
  value: string,
  secrets: Record<string, unknown> | undefined,
): string | undefined {
  const secretId = getDotAgentsSecretReferenceId(value);
  if (!secretId) {
    return value;
  }

  if (!secrets) {
    return undefined;
  }

  for (const candidate of getSecretReferenceCandidates(secretId)) {
    const secret = secrets[candidate];
    if (typeof secret === 'string' && secret.length > 0) {
      return secret;
    }
  }

  return undefined;
}

export function resolveDotAgentsSecretReferenceFromStore(
  value: string,
  loadStore: () => unknown,
): string | undefined {
  const directValue = resolveDotAgentsSecretReference(value, undefined);
  if (directValue !== undefined) {
    return directValue;
  }

  try {
    const secrets = getDotAgentsSecretsRecord(loadStore());
    return resolveDotAgentsSecretReference(value, secrets);
  } catch {
    return undefined;
  }
}

export function getRemoteServerLifecycleAction(
  prev: RemoteServerLifecycleConfigLike,
  next: RemoteServerLifecycleConfigLike,
): RemoteServerLifecycleAction {
  const prevEnabled = !!prev.remoteServerEnabled;
  const nextEnabled = !!next.remoteServerEnabled;

  if (!prevEnabled && nextEnabled) {
    return 'start';
  }

  if (prevEnabled && !nextEnabled) {
    return 'stop';
  }

  if (!nextEnabled) {
    return 'noop';
  }

  const runtimeChanged =
    (prev.remoteServerPort ?? DEFAULT_REMOTE_SERVER_PORT) !== (next.remoteServerPort ?? DEFAULT_REMOTE_SERVER_PORT)
    || (prev.remoteServerBindAddress ?? DEFAULT_REMOTE_SERVER_BIND_ADDRESS) !== (next.remoteServerBindAddress ?? DEFAULT_REMOTE_SERVER_BIND_ADDRESS)
    || (prev.remoteServerApiKey ?? '') !== (next.remoteServerApiKey ?? '')
    || (prev.remoteServerLogLevel ?? DEFAULT_REMOTE_SERVER_LOG_LEVEL) !== (next.remoteServerLogLevel ?? DEFAULT_REMOTE_SERVER_LOG_LEVEL)
    || !areStringArraysEqual(prev.remoteServerCorsOrigins ?? DEFAULT_REMOTE_SERVER_CORS_ORIGINS, next.remoteServerCorsOrigins ?? DEFAULT_REMOTE_SERVER_CORS_ORIGINS);

  return runtimeChanged ? 'restart' : 'noop';
}

export function buildDotAgentsConfigDeepLink(config: DotAgentsConfigPairing): string {
  const params = new URLSearchParams();

  if (config.baseUrl) params.set('baseUrl', config.baseUrl);
  if (config.apiKey) params.set('apiKey', config.apiKey);
  if (config.model) params.set('model', config.model);

  return `dotagents://config?${params.toString()}`;
}

export function parseDotAgentsConfigDeepLink(rawValue: string): DotAgentsConfigPairing | null {
  try {
    const parsed = new URL(rawValue);
    const protocol = parsed.protocol.replace(/:$/, '');
    const path = parsed.pathname.replace(/^\/+/, '');
    const isConfigPath = parsed.hostname === 'config' || path === 'config';

    if (protocol !== 'dotagents' || !isConfigPath) {
      return null;
    }

    const baseUrl = parsed.searchParams.get('baseUrl') || undefined;
    const apiKey = parsed.searchParams.get('apiKey') || undefined;
    const model = parsed.searchParams.get('model') || undefined;

    if (!baseUrl && !apiKey && !model) {
      return null;
    }

    return { baseUrl, apiKey, model };
  } catch {
    return null;
  }
}
