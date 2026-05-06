import type { AgentRunExecutor } from './agent-run-utils';
import type { OperatorRemoteServerStatusLike } from './operator-actions';
import type { RemoteServerLifecycleAction } from './remote-pairing';

export type RemoteServerMaybePromise<T> = T | Promise<T>;

export type RemoteServerRouteAuditContext = {
  action: string;
  path?: string;
  success: boolean;
  details?: Record<string, unknown>;
  failureReason?: string;
};

export type MobileApiRunAgentExecutor = AgentRunExecutor;

export type MobileApiActionResult = {
  statusCode: number;
  body?: unknown;
  headers?: Record<string, string>;
  remoteServerLifecycleAction?: RemoteServerLifecycleAction;
  auditContext?: RemoteServerRouteAuditContext;
};

export function buildMobileApiActionResult(
  body: unknown,
  statusCode = 200,
  headers?: Record<string, string>,
): MobileApiActionResult {
  return {
    statusCode,
    body,
    ...(headers ? { headers } : {}),
  };
}

export function buildMobileApiActionError(
  statusCode: number,
  message: string,
  headers?: Record<string, string>,
): MobileApiActionResult {
  return buildMobileApiActionResult({ error: message }, statusCode, headers);
}

export interface MobileApiRouteActions<Request = unknown, Reply = unknown> {
  handleChatCompletionRequest: (
    body: unknown,
    origin: string | string[] | undefined,
    reply: Reply,
    runAgent: MobileApiRunAgentExecutor,
  ) => RemoteServerMaybePromise<unknown>;
  getModels: () => MobileApiActionResult;
  getProviderModels: (providerId?: string) => RemoteServerMaybePromise<MobileApiActionResult>;
  getProfiles: () => MobileApiActionResult;
  getCurrentProfile: () => MobileApiActionResult;
  setCurrentProfile: (body: unknown) => MobileApiActionResult;
  exportProfile: (id?: string) => MobileApiActionResult;
  importProfile: (body: unknown) => MobileApiActionResult;
  getBundleExportableItems: () => MobileApiActionResult;
  exportBundle: (body: unknown) => RemoteServerMaybePromise<MobileApiActionResult>;
  getMcpServers: () => MobileApiActionResult;
  toggleMcpServer: (name: string | undefined, body: unknown) => MobileApiActionResult;
  exportMcpServerConfigs: () => MobileApiActionResult;
  importMcpServerConfigs: (body: unknown) => MobileApiActionResult;
  upsertMcpServerConfig: (name: string | undefined, body: unknown) => MobileApiActionResult;
  deleteMcpServerConfig: (name?: string) => MobileApiActionResult;
  getSettings: (providerSecretMask: string) => MobileApiActionResult;
  updateSettings: (
    body: unknown,
    masks: {
      providerSecretMask: string;
      remoteServerSecretMask: string;
      discordSecretMask: string;
      langfuseSecretMask: string;
    },
  ) => RemoteServerMaybePromise<MobileApiActionResult>;
  recordOperatorAuditEvent: (
    request: Request,
    context: NonNullable<MobileApiActionResult['auditContext']>,
  ) => void;
  getConversation: (id?: string) => RemoteServerMaybePromise<MobileApiActionResult>;
  getConversationVideoAsset: (
    id: string | undefined,
    fileName: string | undefined,
    rangeHeader: string | undefined,
  ) => RemoteServerMaybePromise<MobileApiActionResult>;
  synthesizeSpeech: (body: unknown) => RemoteServerMaybePromise<MobileApiActionResult>;
  registerPushToken: (body: unknown) => MobileApiActionResult;
  unregisterPushToken: (body: unknown) => MobileApiActionResult;
  getPushStatus: () => MobileApiActionResult;
  clearPushBadge: (body: unknown) => MobileApiActionResult;
  getConversations: () => RemoteServerMaybePromise<MobileApiActionResult>;
  createConversation: (
    body: unknown,
    notifyConversationHistoryChanged: () => void,
  ) => RemoteServerMaybePromise<MobileApiActionResult>;
  updateConversation: (
    id: string | undefined,
    body: unknown,
    notifyConversationHistoryChanged: () => void,
  ) => RemoteServerMaybePromise<MobileApiActionResult>;
  triggerEmergencyStop: () => RemoteServerMaybePromise<MobileApiActionResult>;
  getSkills: () => MobileApiActionResult;
  getSkill: (id?: string) => MobileApiActionResult;
  createSkill: (body: unknown) => MobileApiActionResult;
  updateSkill: (id: string | undefined, body: unknown) => MobileApiActionResult;
  deleteSkill: (id?: string) => MobileApiActionResult;
  toggleProfileSkill: (id?: string) => MobileApiActionResult;
  getKnowledgeNotes: () => RemoteServerMaybePromise<MobileApiActionResult>;
  getKnowledgeNote: (id?: string) => RemoteServerMaybePromise<MobileApiActionResult>;
  deleteKnowledgeNote: (id?: string) => RemoteServerMaybePromise<MobileApiActionResult>;
  getAgentProfiles: (role?: string) => MobileApiActionResult;
  toggleAgentProfile: (id?: string) => MobileApiActionResult;
  getAgentProfile: (id?: string) => MobileApiActionResult;
  createAgentProfile: (body: unknown) => MobileApiActionResult;
  updateAgentProfile: (id: string | undefined, body: unknown) => MobileApiActionResult;
  deleteAgentProfile: (id?: string) => MobileApiActionResult;
  getRepeatTasks: () => RemoteServerMaybePromise<MobileApiActionResult>;
  toggleRepeatTask: (id?: string) => RemoteServerMaybePromise<MobileApiActionResult>;
  runRepeatTask: (id?: string) => RemoteServerMaybePromise<MobileApiActionResult>;
  createKnowledgeNote: (body: unknown) => RemoteServerMaybePromise<MobileApiActionResult>;
  updateKnowledgeNote: (
    id: string | undefined,
    body: unknown,
  ) => RemoteServerMaybePromise<MobileApiActionResult>;
  createRepeatTask: (body: unknown) => RemoteServerMaybePromise<MobileApiActionResult>;
  updateRepeatTask: (
    id: string | undefined,
    body: unknown,
  ) => RemoteServerMaybePromise<MobileApiActionResult>;
  deleteRepeatTask: (id?: string) => RemoteServerMaybePromise<MobileApiActionResult>;
}

export interface MobileApiRouteOptions<Request = unknown, Reply = unknown> {
  actions: MobileApiRouteActions<Request, Reply>;
  providerSecretMask: string;
  remoteServerSecretMask: string;
  discordSecretMask: string;
  langfuseSecretMask: string;
  runAgent: MobileApiRunAgentExecutor;
  notifyConversationHistoryChanged: () => void;
  scheduleRemoteServerLifecycleActionAfterReply: (
    reply: Reply,
    action: RemoteServerLifecycleAction,
  ) => void;
}

export type OperatorRunAgentExecutor = AgentRunExecutor;

export type OperatorRouteAuditContext = RemoteServerRouteAuditContext;

export type OperatorRouteActionResult = {
  statusCode: number;
  body: unknown;
  auditContext?: OperatorRouteAuditContext;
  shouldRestartRemoteServer?: boolean;
  shouldRestartApp?: boolean;
};

export interface OperatorRouteActions<Request = unknown> {
  runOperatorAgent: (
    body: unknown,
    runAgent: OperatorRunAgentExecutor,
  ) => RemoteServerMaybePromise<OperatorRouteActionResult>;
  stopOperatorAgentSession: (sessionId?: string) => RemoteServerMaybePromise<OperatorRouteActionResult>;
  clearOperatorMcpServerLogs: (server?: string) => RemoteServerMaybePromise<OperatorRouteActionResult>;
  getOperatorMcpServerLogs: (
    server?: string,
    count?: string | number,
  ) => RemoteServerMaybePromise<OperatorRouteActionResult>;
  getOperatorMcpStatus: () => RemoteServerMaybePromise<OperatorRouteActionResult>;
  getOperatorMcpTools: (server?: string) => RemoteServerMaybePromise<OperatorRouteActionResult>;
  restartOperatorMcpServer: (body: unknown) => RemoteServerMaybePromise<OperatorRouteActionResult>;
  setOperatorMcpToolEnabled: (
    toolName: string | undefined,
    body: unknown,
  ) => RemoteServerMaybePromise<OperatorRouteActionResult>;
  startOperatorMcpServer: (body: unknown) => RemoteServerMaybePromise<OperatorRouteActionResult>;
  stopOperatorMcpServer: (body: unknown) => RemoteServerMaybePromise<OperatorRouteActionResult>;
  testOperatorMcpServer: (server?: string) => RemoteServerMaybePromise<OperatorRouteActionResult>;
  downloadOperatorLocalSpeechModel: (providerId?: string) => RemoteServerMaybePromise<OperatorRouteActionResult>;
  getOperatorLocalSpeechModelStatus: (providerId?: string) => RemoteServerMaybePromise<OperatorRouteActionResult>;
  getOperatorLocalSpeechModelStatuses: () => RemoteServerMaybePromise<OperatorRouteActionResult>;
  createOperatorModelPreset: (
    body: unknown,
    providerSecretMask: string,
  ) => RemoteServerMaybePromise<OperatorRouteActionResult>;
  deleteOperatorModelPreset: (
    presetId: string | undefined,
    providerSecretMask: string,
  ) => RemoteServerMaybePromise<OperatorRouteActionResult>;
  getOperatorModelPresets: (providerSecretMask: string) => RemoteServerMaybePromise<OperatorRouteActionResult>;
  updateOperatorModelPreset: (
    presetId: string | undefined,
    body: unknown,
    providerSecretMask: string,
  ) => RemoteServerMaybePromise<OperatorRouteActionResult>;
  getOperatorTunnel: () => RemoteServerMaybePromise<OperatorRouteActionResult>;
  getOperatorTunnelSetup: () => RemoteServerMaybePromise<OperatorRouteActionResult>;
  startOperatorTunnel: (isRemoteServerRunning: boolean) => RemoteServerMaybePromise<OperatorRouteActionResult>;
  stopOperatorTunnel: () => RemoteServerMaybePromise<OperatorRouteActionResult>;
  checkOperatorUpdater: () => RemoteServerMaybePromise<OperatorRouteActionResult>;
  downloadLatestOperatorUpdateAsset: () => RemoteServerMaybePromise<OperatorRouteActionResult>;
  getOperatorUpdater: (appVersion: string) => RemoteServerMaybePromise<OperatorRouteActionResult>;
  openOperatorReleasesPage: () => RemoteServerMaybePromise<OperatorRouteActionResult>;
  openOperatorUpdateAsset: () => RemoteServerMaybePromise<OperatorRouteActionResult>;
  revealOperatorUpdateAsset: () => RemoteServerMaybePromise<OperatorRouteActionResult>;
  clearOperatorDiscordLogs: () => RemoteServerMaybePromise<OperatorRouteActionResult>;
  connectOperatorDiscord: () => RemoteServerMaybePromise<OperatorRouteActionResult>;
  connectOperatorWhatsApp: () => RemoteServerMaybePromise<OperatorRouteActionResult>;
  disconnectOperatorDiscord: () => RemoteServerMaybePromise<OperatorRouteActionResult>;
  getOperatorDiscord: () => RemoteServerMaybePromise<OperatorRouteActionResult>;
  getOperatorDiscordLogs: (count?: string | number) => RemoteServerMaybePromise<OperatorRouteActionResult>;
  getOperatorIntegrations: () => RemoteServerMaybePromise<OperatorRouteActionResult>;
  getOperatorWhatsApp: () => RemoteServerMaybePromise<OperatorRouteActionResult>;
  logoutOperatorWhatsApp: () => RemoteServerMaybePromise<OperatorRouteActionResult>;
  clearOperatorMessageQueue: (conversationId?: string) => RemoteServerMaybePromise<OperatorRouteActionResult>;
  getOperatorMessageQueues: () => RemoteServerMaybePromise<OperatorRouteActionResult>;
  pauseOperatorMessageQueue: (conversationId?: string) => RemoteServerMaybePromise<OperatorRouteActionResult>;
  removeOperatorQueuedMessage: (
    conversationId: string | undefined,
    messageId: string | undefined,
  ) => RemoteServerMaybePromise<OperatorRouteActionResult>;
  resumeOperatorMessageQueue: (conversationId?: string) => RemoteServerMaybePromise<OperatorRouteActionResult>;
  retryOperatorQueuedMessage: (
    conversationId: string | undefined,
    messageId: string | undefined,
  ) => RemoteServerMaybePromise<OperatorRouteActionResult>;
  updateOperatorQueuedMessage: (
    conversationId: string | undefined,
    messageId: string | undefined,
    body: unknown,
  ) => RemoteServerMaybePromise<OperatorRouteActionResult>;
  getOperatorConversations: (count?: string | number) => RemoteServerMaybePromise<OperatorRouteActionResult>;
  getOperatorErrors: (count?: string | number) => RemoteServerMaybePromise<OperatorRouteActionResult>;
  getOperatorHealth: () => RemoteServerMaybePromise<OperatorRouteActionResult>;
  getOperatorLogs: (
    count?: string | number,
    level?: string,
  ) => RemoteServerMaybePromise<OperatorRouteActionResult>;
  getOperatorRemoteServer: (
    status: OperatorRemoteServerStatusLike,
  ) => RemoteServerMaybePromise<OperatorRouteActionResult>;
  getOperatorStatus: (
    status: OperatorRemoteServerStatusLike,
  ) => RemoteServerMaybePromise<OperatorRouteActionResult>;
  getOperatorAudit: (count?: string | number) => RemoteServerMaybePromise<OperatorRouteActionResult>;
  recordOperatorAuditEvent: (request: Request, context: OperatorRouteAuditContext) => void;
  setOperatorAuditContext: (request: Request, context: Partial<OperatorRouteAuditContext>) => void;
  restartOperatorApp: (appVersion: string) => RemoteServerMaybePromise<OperatorRouteActionResult>;
  restartOperatorRemoteServer: (isRunning: boolean) => RemoteServerMaybePromise<OperatorRouteActionResult>;
  rotateOperatorRemoteServerApiKey: () => RemoteServerMaybePromise<OperatorRouteActionResult>;
}

export interface OperatorRouteOptions<Request = unknown, Reply = unknown> {
  actions: OperatorRouteActions<Request>;
  providerSecretMask: string;
  getRemoteServerStatus: () => OperatorRemoteServerStatusLike;
  getAppVersion: () => string;
  runAgent: OperatorRunAgentExecutor;
  scheduleRemoteServerRestartFromOperator: () => void;
  scheduleAppRestartFromOperator: () => void;
  scheduleRemoteServerRestartAfterReply: (reply: Reply) => void;
}

export type InjectedMcpRouteResult = unknown | Promise<unknown>;

export interface InjectedMcpRouteActions<Request = unknown, Reply = unknown> {
  handleInjectedMcpProtocolRequest: (
    req: Request,
    reply: Reply,
    acpSessionToken?: string,
  ) => InjectedMcpRouteResult;
  listInjectedMcpTools: (
    acpSessionToken: string | undefined,
    reply: Reply,
  ) => InjectedMcpRouteResult;
  callInjectedMcpTool: (
    req: Request,
    reply: Reply,
    acpSessionToken?: string,
  ) => InjectedMcpRouteResult;
}

export interface InjectedMcpRouteOptions<Request = unknown, Reply = unknown> {
  actions: InjectedMcpRouteActions<Request, Reply>;
}
