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
export const REMOTE_SERVER_PORT_MIN = 1;
export const REMOTE_SERVER_PORT_MAX = 65535;
export const DEFAULT_REMOTE_SERVER_ENABLED = false;
export const DEFAULT_REMOTE_SERVER_AUTO_SHOW_PANEL = false;
export const DEFAULT_REMOTE_SERVER_TERMINAL_QR_ENABLED = false;
export const DEFAULT_CLOUDFLARE_TUNNEL_AUTO_START = false;
export const DEFAULT_STREAMER_MODE_ENABLED = false;

export type RemoteServerBindAddress = (typeof REMOTE_SERVER_BIND_ADDRESS_OPTIONS)[number];
export type RemoteServerLogLevel = (typeof REMOTE_SERVER_LOG_LEVEL_OPTIONS)[number];
export type CloudflareTunnelMode = (typeof CLOUDFLARE_TUNNEL_MODE_OPTIONS)[number];

export type RemoteServerBindAddressOption = {
  value: RemoteServerBindAddress;
  label: string;
  compactLabel: string;
  successMessage: string;
};

export type RemoteServerAutoShowPanelFieldMetadata = {
  key: 'remoteServerAutoShowPanel';
  label: string;
  tooltip: string;
  helperText: string;
  pendingLabel: string;
  successMessage: string;
  accessibilityLabel: string;
};

export type RemoteServerBindAddressFieldMetadata = {
  key: 'remoteServerBindAddress';
  label: string;
  tooltip: string;
  helperText: string;
  lanWarningText: string;
  pendingLabel: string;
  accessibilityLabel: string;
};

export type RemoteServerEnabledFieldMetadata = {
  key: 'remoteServerEnabled';
  label: string;
  desktopLabel: string;
  helperText: string;
  pendingLabel: string;
  enableSuccessMessage: string;
  disableConfirmTitle: string;
  disableConfirmMessage: string;
  disableConfirmButtonLabel: string;
  disableSuccessMessage: string;
  updateSuccessMessage: string;
  accessibilityLabel: string;
};

export type RemoteServerTerminalQrFieldMetadata = {
  key: 'remoteServerTerminalQrEnabled';
  label: string;
  desktopLabel: string;
  tooltip: string;
  helperText: string;
  pendingLabel: string;
  successMessage: string;
  accessibilityLabel: string;
};

export type RemoteServerLogLevelOption = {
  value: RemoteServerLogLevel;
  label: string;
  successMessage: string;
};

export type RemoteServerLogLevelFieldMetadata = {
  key: 'remoteServerLogLevel';
  label: string;
  tooltip: string;
  pendingLabel: string;
  accessibilityLabel: string;
};

export type RemoteServerApiKeyFieldMetadata = {
  key: 'remoteServerApiKey';
  label: string;
  tooltip: string;
  secretMask: string;
  copyButtonLabel: string;
  copyHiddenLabel: string;
  copyStreamerModeTitle: string;
  copyUnavailableTitle: string;
  copyErrorLogMessage: string;
  regenerateButtonLabel: string;
  streamerCopyDisabledText: string;
  rotateConfirmTitle: string;
  rotateConfirmMessage: string;
  rotateConfirmButtonLabel: string;
  rotateAccessibilityLabel: string;
  rotateButtonLabel: string;
  rotatePendingButtonLabel: string;
  rotateHelperText: string;
};

export type RemoteServerPortFieldMetadata = {
  key: 'remoteServerPort';
  label: string;
  tooltip: string;
  placeholder: string;
  pendingLabel: string;
  formatSuccessMessage: (port: number) => string;
  accessibilityLabel: string;
  invalidTitle: string;
  invalidMessage: string;
};

export type RemoteServerCorsOriginsFieldMetadata = {
  key: 'remoteServerCorsOrigins';
  label: string;
  tooltip: string;
  placeholder: string;
  helperText: string;
  pendingLabel: string;
  successMessage: string;
  accessibilityLabel: string;
};

export type RemoteServerOperatorDeviceAllowlistFieldMetadata = {
  key: 'remoteServerOperatorAllowDeviceIds';
  sectionTitle: string;
  helperText: string;
  currentDeviceLabel: string;
  currentDeviceLoadingText: string;
  label: string;
  placeholder: string;
  pendingLabel: string;
  updateSuccessMessage: string;
  trustSuccessMessage: string;
  accessibilityLabel: string;
  trustAccessibilityLabel: string;
  trustButtonLabel: string;
  trustedButtonLabel: string;
};

export type ChannelOperatorAllowlistFieldKey =
  | 'discordOperatorAllowUserIds'
  | 'discordOperatorAllowGuildIds'
  | 'discordOperatorAllowChannelIds'
  | 'discordOperatorAllowRoleIds'
  | 'whatsappOperatorAllowFrom';

export type ChannelOperatorAllowlistTextFieldMetadata = {
  key: ChannelOperatorAllowlistFieldKey;
  label: string;
  placeholder: string;
  pendingLabel: string;
  successMessage: string;
  accessibilityLabel: string;
};

export type ChannelOperatorAllowlistsSectionMetadata = {
  sectionTitle: string;
  helperText: string;
  footerText: string;
  fields: Record<ChannelOperatorAllowlistFieldKey, ChannelOperatorAllowlistTextFieldMetadata>;
};

export type CloudflareTunnelModeOption = {
  value: CloudflareTunnelMode;
  label: string;
  compactLabel: string;
  successMessage: string;
};

export type CloudflareTunnelModeFieldMetadata = {
  key: 'cloudflareTunnelMode';
  label: string;
  tooltip: string;
  pendingLabel: string;
  accessibilityLabel: string;
};

export type CloudflareTunnelSectionMetadata = {
  sectionTitle: string;
  namedTunnelHelperText: string;
};

export type CloudflareTunnelAutoStartFieldMetadata = {
  key: 'cloudflareTunnelAutoStart';
  label: string;
  tooltip: string;
  helperText: string;
  pendingLabel: string;
  successMessage: string;
  accessibilityLabel: string;
};

export type CloudflareTunnelTextFieldMetadata = {
  key: 'cloudflareTunnelId' | 'cloudflareTunnelHostname' | 'cloudflareTunnelName' | 'cloudflareTunnelCredentialsPath';
  label: string;
  tooltip: string;
  desktopPlaceholder: string;
  mobilePlaceholder: string;
  pendingLabel: string;
  successMessage: string;
  accessibilityLabel: string;
};

export const DEFAULT_REMOTE_SERVER_BIND_ADDRESS: RemoteServerBindAddress = '127.0.0.1';
export const DEFAULT_REMOTE_SERVER_PORT = 3210;
export const DEFAULT_REMOTE_SERVER_LOG_LEVEL: RemoteServerLogLevel = 'info';
export const DEFAULT_CLOUDFLARE_TUNNEL_MODE: CloudflareTunnelMode = 'quick';
export const REMOTE_SERVER_ENABLED_FIELD_METADATA: RemoteServerEnabledFieldMetadata = {
  key: 'remoteServerEnabled',
  label: 'Remote Server',
  desktopLabel: 'Enable Remote Server',
  helperText: 'Enable the desktop server that powers mobile operator access.',
  pendingLabel: 'remote server',
  enableSuccessMessage: 'Remote server enabled.',
  disableConfirmTitle: 'Disable Remote Server',
  disableConfirmMessage: 'Turn off the desktop remote server? This mobile operator session may disconnect immediately.',
  disableConfirmButtonLabel: 'Disable Server',
  disableSuccessMessage: 'Remote server disable scheduled.',
  updateSuccessMessage: 'Remote server updated.',
  accessibilityLabel: 'Remote Server',
};
export const REMOTE_SERVER_AUTO_SHOW_PANEL_FIELD_METADATA: RemoteServerAutoShowPanelFieldMetadata = {
  key: 'remoteServerAutoShowPanel',
  label: 'Auto-Show Panel',
  tooltip: 'Automatically show the floating panel when receiving messages from remote clients',
  helperText: 'Show the desktop operator panel when new remote work begins.',
  pendingLabel: 'auto-show panel',
  successMessage: 'Remote panel auto-show updated.',
  accessibilityLabel: 'Auto-Show Panel',
};
export const REMOTE_SERVER_TERMINAL_QR_FIELD_METADATA: RemoteServerTerminalQrFieldMetadata = {
  key: 'remoteServerTerminalQrEnabled',
  label: 'Terminal QR',
  desktopLabel: 'Terminal QR Code',
  tooltip: 'Print QR code to terminal on server start (auto-enabled in headless environments)',
  helperText: 'Print a pairing QR code in the desktop terminal when supported.',
  pendingLabel: 'terminal QR',
  successMessage: 'Terminal QR preference updated.',
  accessibilityLabel: 'Terminal QR',
};
export const REMOTE_SERVER_PORT_FIELD_METADATA: RemoteServerPortFieldMetadata = {
  key: 'remoteServerPort',
  label: 'Port',
  tooltip: 'HTTP port to listen on.',
  placeholder: String(DEFAULT_REMOTE_SERVER_PORT),
  pendingLabel: 'remote server port',
  formatSuccessMessage: (port) => `Remote server port saved as ${port}.`,
  accessibilityLabel: 'Remote server port',
  invalidTitle: 'Invalid Port',
  invalidMessage: `Enter a whole number between ${REMOTE_SERVER_PORT_MIN} and ${REMOTE_SERVER_PORT_MAX}.`,
};
export const REMOTE_SERVER_BIND_ADDRESS_FIELD_METADATA: RemoteServerBindAddressFieldMetadata = {
  key: 'remoteServerBindAddress',
  label: 'Bind Address',
  tooltip: '127.0.0.1 for local-only access; 0.0.0.0 to allow LAN access (requires API key).',
  helperText: 'Use 0.0.0.0 for LAN/mobile access. 127.0.0.1 keeps the server on the desktop only.',
  lanWarningText: 'Warning: Exposes the server on your local network. Keep your API key secure.',
  pendingLabel: 'bind address',
  accessibilityLabel: 'remote server bind address',
};
export const REMOTE_SERVER_LOG_LEVEL_FIELD_METADATA: RemoteServerLogLevelFieldMetadata = {
  key: 'remoteServerLogLevel',
  label: 'Log Level',
  tooltip: 'Fastify logger level.',
  pendingLabel: 'remote server log level',
  accessibilityLabel: 'remote server log level',
};
export const REMOTE_SERVER_API_KEY_FIELD_METADATA: RemoteServerApiKeyFieldMetadata = {
  key: 'remoteServerApiKey',
  label: 'API Key',
  tooltip: 'Bearer token required in Authorization header',
  secretMask: DEFAULT_REMOTE_SERVER_SECRET_MASK,
  copyButtonLabel: 'Copy',
  copyHiddenLabel: 'Hidden',
  copyStreamerModeTitle: 'Disabled in Streamer Mode',
  copyUnavailableTitle: 'API key unavailable',
  copyErrorLogMessage: 'Failed to copy remote server API key',
  regenerateButtonLabel: 'Regenerate',
  streamerCopyDisabledText: 'Copy disabled in Streamer Mode',
  rotateConfirmTitle: 'Rotate API Key',
  rotateConfirmMessage: 'Rotate the desktop remote server API key now? This phone will save the returned key locally, and any clients still using the old key will need to reconnect.',
  rotateConfirmButtonLabel: 'Rotate Key',
  rotateAccessibilityLabel: 'Rotate API key',
  rotateButtonLabel: 'Rotate API key',
  rotatePendingButtonLabel: 'Rotating API key…',
  rotateHelperText: 'Rotating the API key revokes the previous mobile/remote credential. This phone saves the new key automatically after confirmation.',
};
export const REMOTE_SERVER_BIND_ADDRESS_DISPLAY_OPTIONS: readonly RemoteServerBindAddressOption[] = [
  {
    value: '127.0.0.1',
    label: 'Localhost (127.0.0.1)',
    compactLabel: '127.0.0.1',
    successMessage: 'Bind address saved for local-only access.',
  },
  {
    value: '0.0.0.0',
    label: 'All Interfaces (0.0.0.0)',
    compactLabel: '0.0.0.0',
    successMessage: 'Bind address saved for LAN/mobile access.',
  },
];
export const REMOTE_SERVER_LOG_LEVEL_DISPLAY_OPTIONS: readonly RemoteServerLogLevelOption[] = [
  { value: 'error', label: 'error', successMessage: 'Remote server log level saved as error.' },
  { value: 'info', label: 'info', successMessage: 'Remote server log level saved as info.' },
  { value: 'debug', label: 'debug', successMessage: 'Remote server log level saved as debug.' },
];
export const REMOTE_SERVER_CORS_ORIGINS_FIELD_METADATA: RemoteServerCorsOriginsFieldMetadata = {
  key: 'remoteServerCorsOrigins',
  label: 'CORS Origins',
  tooltip: 'Allowed origins for CORS requests. Use * for all origins (development), or specify comma-separated URLs like http://localhost:8081.',
  placeholder: '* or http://localhost:8081, http://example.com',
  helperText: 'Use * for development or specify allowed origins separated by commas.',
  pendingLabel: 'remote server CORS origins',
  successMessage: 'Remote server CORS origins updated.',
  accessibilityLabel: 'Remote server CORS origins',
};
export const REMOTE_SERVER_OPERATOR_DEVICE_ALLOWLIST_FIELD_METADATA: RemoteServerOperatorDeviceAllowlistFieldMetadata = {
  key: 'remoteServerOperatorAllowDeviceIds',
  sectionTitle: 'Trusted operator devices',
  helperText: 'If this list is empty, any authenticated client can use operator/admin routes. Once set, non-loopback operator access requires a matching stable device ID.',
  currentDeviceLabel: 'Current device ID',
  currentDeviceLoadingText: 'Loading…',
  label: 'Trusted Device IDs',
  placeholder: 'device-id-1, device-id-2',
  pendingLabel: 'trusted operator devices',
  updateSuccessMessage: 'Trusted operator device allowlist updated.',
  trustSuccessMessage: 'This mobile device is now trusted for operator access.',
  accessibilityLabel: 'Trusted operator device IDs',
  trustAccessibilityLabel: 'Trust this device for operator access',
  trustButtonLabel: 'Trust this device',
  trustedButtonLabel: 'This device is trusted',
};
export const CHANNEL_OPERATOR_ALLOWLISTS_SECTION_METADATA: ChannelOperatorAllowlistsSectionMetadata = {
  sectionTitle: 'Channel operator allowlists',
  helperText: 'If left blank, /ops uses the current channel access rules. Once you add values here, /ops becomes restricted to the matching identities.',
  footerText: 'Use exact Discord IDs and WhatsApp sender numbers/LIDs. For WhatsApp, the sender or chat must match one of these identities once the operator allowlist is set.',
  fields: {
    discordOperatorAllowUserIds: {
      key: 'discordOperatorAllowUserIds',
      label: 'Discord Operator User IDs',
      placeholder: '1234567890, 9876543210',
      pendingLabel: 'Discord operator user IDs',
      successMessage: 'Discord operator user allowlist updated.',
      accessibilityLabel: 'Discord operator user IDs',
    },
    discordOperatorAllowGuildIds: {
      key: 'discordOperatorAllowGuildIds',
      label: 'Discord Operator Guild IDs',
      placeholder: '1122334455',
      pendingLabel: 'Discord operator guild IDs',
      successMessage: 'Discord operator guild allowlist updated.',
      accessibilityLabel: 'Discord operator guild IDs',
    },
    discordOperatorAllowChannelIds: {
      key: 'discordOperatorAllowChannelIds',
      label: 'Discord Operator Channel IDs',
      placeholder: '5566778899',
      pendingLabel: 'Discord operator channel IDs',
      successMessage: 'Discord operator channel allowlist updated.',
      accessibilityLabel: 'Discord operator channel IDs',
    },
    discordOperatorAllowRoleIds: {
      key: 'discordOperatorAllowRoleIds',
      label: 'Discord Operator Role IDs',
      placeholder: '9988776655',
      pendingLabel: 'Discord operator role IDs',
      successMessage: 'Discord operator role allowlist updated.',
      accessibilityLabel: 'Discord operator role IDs',
    },
    whatsappOperatorAllowFrom: {
      key: 'whatsappOperatorAllowFrom',
      label: 'WhatsApp Operator Allowlist',
      placeholder: '61400111222, 61400999888',
      pendingLabel: 'WhatsApp operator allowlist',
      successMessage: 'WhatsApp operator allowlist updated.',
      accessibilityLabel: 'WhatsApp operator allowlist',
    },
  },
};
export const CLOUDFLARE_TUNNEL_MODE_DISPLAY_OPTIONS: readonly CloudflareTunnelModeOption[] = [
  {
    value: 'quick',
    label: 'Quick Tunnel (Random URL)',
    compactLabel: 'quick',
    successMessage: 'Cloudflare tunnel mode set to quick.',
  },
  {
    value: 'named',
    label: 'Named Tunnel (Persistent)',
    compactLabel: 'named',
    successMessage: 'Cloudflare tunnel mode set to named.',
  },
];
export const CLOUDFLARE_TUNNEL_MODE_FIELD_METADATA: CloudflareTunnelModeFieldMetadata = {
  key: 'cloudflareTunnelMode',
  label: 'Tunnel Mode',
  tooltip: 'Quick tunnels are easy but have random URLs. Named tunnels require setup but have persistent URLs.',
  pendingLabel: 'tunnel mode',
  accessibilityLabel: 'Cloudflare tunnel mode',
};
export const CLOUDFLARE_TUNNEL_SECTION_METADATA: CloudflareTunnelSectionMetadata = {
  sectionTitle: 'Cloudflare tunnel',
  namedTunnelHelperText: 'Named tunnels need a tunnel ID and hostname. Credentials path is optional if the desktop already knows where to find the credentials file.',
};
export const CLOUDFLARE_TUNNEL_AUTO_START_FIELD_METADATA: CloudflareTunnelAutoStartFieldMetadata = {
  key: 'cloudflareTunnelAutoStart',
  label: 'Auto-Start Tunnel',
  tooltip: 'Automatically start the Cloudflare Tunnel when the application launches (requires Remote Server to be enabled)',
  helperText: 'Start the configured tunnel automatically when the desktop app is ready.',
  pendingLabel: 'tunnel auto-start',
  successMessage: 'Tunnel auto-start updated.',
  accessibilityLabel: 'Auto-Start Tunnel',
};
export const CLOUDFLARE_TUNNEL_ID_FIELD_METADATA: CloudflareTunnelTextFieldMetadata = {
  key: 'cloudflareTunnelId',
  label: 'Tunnel ID',
  tooltip: "The UUID of your named tunnel. Find it with 'cloudflared tunnel list'",
  desktopPlaceholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  mobilePlaceholder: 'Tunnel UUID',
  pendingLabel: 'tunnel id',
  successMessage: 'Tunnel ID saved.',
  accessibilityLabel: 'Cloudflare tunnel ID',
};
export const CLOUDFLARE_TUNNEL_HOSTNAME_FIELD_METADATA: CloudflareTunnelTextFieldMetadata = {
  key: 'cloudflareTunnelHostname',
  label: 'Hostname',
  tooltip: 'The public hostname for your tunnel (e.g., myapp.example.com). Must be configured in Cloudflare DNS.',
  desktopPlaceholder: 'myapp.example.com',
  mobilePlaceholder: 'agent.example.com',
  pendingLabel: 'tunnel hostname',
  successMessage: 'Tunnel hostname saved.',
  accessibilityLabel: 'Cloudflare tunnel hostname',
};
export const CLOUDFLARE_TUNNEL_NAME_FIELD_METADATA: CloudflareTunnelTextFieldMetadata = {
  key: 'cloudflareTunnelName',
  label: 'Tunnel Name',
  tooltip: 'Display name for the named Cloudflare tunnel.',
  desktopPlaceholder: 'my-dotagents-tunnel',
  mobilePlaceholder: 'my-dotagents-tunnel',
  pendingLabel: 'tunnel name',
  successMessage: 'Tunnel name saved.',
  accessibilityLabel: 'Cloudflare tunnel name',
};
export const CLOUDFLARE_TUNNEL_CREDENTIALS_PATH_FIELD_METADATA: CloudflareTunnelTextFieldMetadata = {
  key: 'cloudflareTunnelCredentialsPath',
  label: 'Credentials Path',
  tooltip: 'Path to credentials JSON file. Leave empty to use default (~/.cloudflared/<tunnel-id>.json)',
  desktopPlaceholder: '~/.cloudflared/<tunnel-id>.json (default)',
  mobilePlaceholder: '/path/to/credentials.json',
  pendingLabel: 'tunnel credentials path',
  successMessage: 'Tunnel credentials path saved.',
  accessibilityLabel: 'Cloudflare tunnel credentials path',
};

export function getDefaultRemoteServerCorsOrigins(): string[] {
  return [...DEFAULT_REMOTE_SERVER_CORS_ORIGINS];
}

export function isRemoteServerPortUpdateValue(value: unknown): value is number {
  return typeof value === 'number'
    && Number.isInteger(value)
    && value >= REMOTE_SERVER_PORT_MIN
    && value <= REMOTE_SERVER_PORT_MAX;
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
  return (config.streamerModeEnabled ?? DEFAULT_STREAMER_MODE_ENABLED)
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
  if (options.skipAutoPrintQR || !options.apiKey || (options.streamerModeEnabled ?? DEFAULT_STREAMER_MODE_ENABLED)) {
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
