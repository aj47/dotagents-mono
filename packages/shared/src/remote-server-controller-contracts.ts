import type { AgentRunExecutor } from './agent-run-utils';
import type { RemoteServerAuthDecision } from './operator-actions';
import type {
  RemoteNetworkAddressLike,
  RemoteServerLifecycleAction,
  RemoteServerLifecycleConfigLike,
  RemoteServerPairingApiKeyConfigLike,
  RemoteServerStatusSnapshot,
} from './remote-pairing';

export type RemoteServerRunAgentExecutor = AgentRunExecutor;

export type RemoteServerControllerConfigLike = RemoteServerLifecycleConfigLike
  & RemoteServerPairingApiKeyConfigLike
  & {
    remoteServerOperatorAllowDeviceIds?: readonly unknown[];
    remoteServerTerminalQrEnabled?: boolean;
  };

export interface RemoteServerConfigStore<
  Config extends RemoteServerControllerConfigLike = RemoteServerControllerConfigLike,
> {
  get(): Config;
  save(config: Config): void;
}

export interface RemoteServerDiagnostics {
  logInfo(scope: string, message: string): void;
  logWarning(scope: string, message: string, error?: unknown): void;
  logError(scope: string, message: string, error?: unknown): void;
}

export type RemoteServerControllerMaybePromise<T> = T | Promise<T>;

export interface RemoteServerHttpServerOptions {
  logLevel: string;
  bodyLimitBytes: number;
  corsOrigins: readonly string[];
}

export interface RemoteServerHttpListenOptions {
  port: number;
  host: string;
}

export interface RemoteServerControllerAdapters<
  Request = unknown,
  Reply = unknown,
  Config extends RemoteServerControllerConfigLike = RemoteServerControllerConfigLike,
  Server = unknown,
> {
  createHttpServer: (options: RemoteServerHttpServerOptions) => RemoteServerControllerMaybePromise<Server>;
  addRequestHook: (
    server: Server,
    handler: (request: Request, reply: Reply) => RemoteServerControllerMaybePromise<void>,
  ) => RemoteServerControllerMaybePromise<void>;
  addResponseHook: (
    server: Server,
    handler: (request: Request, reply: Reply) => RemoteServerControllerMaybePromise<void>,
  ) => RemoteServerControllerMaybePromise<void>;
  listenHttpServer: (server: Server, options: RemoteServerHttpListenOptions) => Promise<void>;
  closeHttpServer: (server: Server) => Promise<void>;
  authorizeRequest: (
    request: Request,
    options: {
      currentApiKey?: string;
      trustedDeviceIds?: readonly unknown[];
    },
  ) => RemoteServerAuthDecision;
  generateApiKey: () => string;
  resolveApiKeyReference: (value: string) => string | undefined;
  resolveConfiguredApiKey: (config: Pick<Config, 'remoteServerApiKey'>) => string;
  getNetworkAddresses: () => RemoteNetworkAddressLike[];
  getConnectableBaseUrlForMobilePairing: (bind: string, port: number) => string | undefined;
  printTerminalQRCode: (url: string, apiKey: string) => Promise<boolean>;
  scheduleDelayedTask: (delayMs: number, task: () => void) => void;
  scheduleTaskAfterReply: (reply: Reply, task: () => void) => void;
  sendAuthFailure: (reply: Reply, response: { statusCode: number; error: string }) => void;
  writeTerminalInfo: (message: string) => void;
  writeTerminalWarning: (message: string) => void;
  recordRejectedOperatorDeviceAttempt: (request: Request, failureReason: string) => void;
  recordOperatorResponseAuditEvent: (request: Request, reply: Reply) => void;
}

export interface RemoteServerRouteContext<Reply = unknown> {
  providerSecretMask: string;
  remoteServerSecretMask: string;
  discordSecretMask: string;
  langfuseSecretMask: string;
  getRemoteServerStatus: () => RemoteServerStatusSnapshot;
  getAppVersion: () => string;
  runAgent: RemoteServerRunAgentExecutor;
  notifyConversationHistoryChanged: () => void;
  scheduleRemoteServerLifecycleActionAfterReply: (
    reply: Reply,
    action: RemoteServerLifecycleAction,
  ) => void;
  scheduleRemoteServerRestartFromOperator: () => void;
  scheduleAppRestartFromOperator: () => void;
  scheduleRemoteServerRestartAfterReply: (reply: Reply) => void;
}

export type RemoteServerRouteRegistrar<Server = unknown, Reply = unknown> = (
  server: Server,
  context: RemoteServerRouteContext<Reply>,
) => void;

export interface RemoteServerControllerOptions<
  Server = unknown,
  Request = unknown,
  Reply = unknown,
  Config extends RemoteServerControllerConfigLike = RemoteServerControllerConfigLike,
> {
  configStore: RemoteServerConfigStore<Config>;
  diagnosticsService: RemoteServerDiagnostics;
  registerRoutes: RemoteServerRouteRegistrar<Server, Reply>;
  adapters: RemoteServerControllerAdapters<Request, Reply, Config, Server>;
  providerSecretMask: string;
  remoteServerSecretMask: string;
  discordSecretMask: string;
  langfuseSecretMask: string;
  getAppVersion: () => string;
  isHeadlessEnvironment: () => boolean;
  relaunchApp: () => void;
  quitApp: () => void;
  runAgent: RemoteServerRunAgentExecutor;
  notifyConversationHistoryChanged: () => void;
}

export interface StartRemoteServerOptions {
  forceEnabled?: boolean;
  skipAutoPrintQR?: boolean;
  bindAddressOverride?: string;
}

export type StartRemoteServerResult =
  | { running: true; bind: string; port: number }
  | { running: false; error?: string };

export interface RemoteServerController {
  startRemoteServerForced(options?: { bindAddressOverride?: string }): Promise<StartRemoteServerResult>;
  startRemoteServer(): Promise<StartRemoteServerResult>;
  stopRemoteServer(): Promise<void>;
  restartRemoteServer(): Promise<StartRemoteServerResult>;
  getRemoteServerStatus(): RemoteServerStatusSnapshot;
  getRemoteServerPairingApiKey(): string;
  printQRCodeToTerminal(urlOverride?: string): Promise<boolean>;
}
