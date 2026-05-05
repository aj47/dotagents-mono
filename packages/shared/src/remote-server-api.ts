export const REMOTE_SERVER_API_PREFIX = "/v1" as const;
export const REMOTE_SERVER_OPERATOR_API_PREFIX = `${REMOTE_SERVER_API_PREFIX}/operator` as const;

export type RemoteServerHttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type RemoteServerApiRoute = {
  method: RemoteServerHttpMethod;
  path: string;
};

export const REMOTE_SERVER_API_PATHS = {
  operatorStatus: "/operator/status",
  operatorHealth: "/operator/health",
  operatorErrors: "/operator/errors",
  operatorLogs: "/operator/logs",
  operatorAudit: "/operator/audit",
  operatorConversations: "/operator/conversations",
  operatorRemoteServer: "/operator/remote-server",
  operatorTunnel: "/operator/tunnel",
  operatorTunnelSetup: "/operator/tunnel/setup",
  operatorIntegrations: "/operator/integrations",
  operatorUpdater: "/operator/updater",
  operatorUpdaterCheck: "/operator/updater/check",
  operatorUpdaterDownloadLatest: "/operator/updater/download-latest",
  operatorUpdaterRevealDownload: "/operator/updater/reveal-download",
  operatorUpdaterOpenDownload: "/operator/updater/open-download",
  operatorUpdaterOpenReleases: "/operator/updater/open-releases",
  operatorDiscord: "/operator/discord",
  operatorDiscordLogs: "/operator/discord/logs",
  operatorDiscordConnect: "/operator/discord/connect",
  operatorDiscordDisconnect: "/operator/discord/disconnect",
  operatorDiscordClearLogs: "/operator/discord/logs/clear",
  operatorWhatsApp: "/operator/whatsapp",
  operatorWhatsAppConnect: "/operator/whatsapp/connect",
  operatorWhatsAppLogout: "/operator/whatsapp/logout",
  operatorLocalSpeechModels: "/operator/local-speech-models",
  operatorLocalSpeechModel: "/operator/local-speech-models/:providerId",
  operatorLocalSpeechModelDownload: "/operator/local-speech-models/:providerId/download",
  operatorModelPresets: "/operator/model-presets",
  operatorModelPreset: "/operator/model-presets/:presetId",
  operatorTunnelStart: "/operator/tunnel/start",
  operatorTunnelStop: "/operator/tunnel/stop",
  operatorRestartRemoteServer: "/operator/actions/restart-remote-server",
  operatorRestartApp: "/operator/actions/restart-app",
  operatorRunAgent: "/operator/actions/run-agent",
  operatorAgentSessionStop: "/operator/sessions/:sessionId/stop",
  operatorMessageQueues: "/operator/message-queues",
  operatorMessageQueueClear: "/operator/message-queues/:conversationId/clear",
  operatorMessageQueuePause: "/operator/message-queues/:conversationId/pause",
  operatorMessageQueueResume: "/operator/message-queues/:conversationId/resume",
  operatorMessageQueueMessage: "/operator/message-queues/:conversationId/messages/:messageId",
  operatorMessageQueueMessageRetry: "/operator/message-queues/:conversationId/messages/:messageId/retry",
  operatorRotateApiKey: "/operator/access/rotate-api-key",
  chatCompletions: "/chat/completions",
  models: "/models",
  modelsByProvider: "/models/:providerId",
  profiles: "/profiles",
  currentProfile: "/profiles/current",
  profileExport: "/profiles/:id/export",
  profileImport: "/profiles/import",
  operatorMcp: "/operator/mcp",
  operatorMcpStart: "/operator/actions/mcp-start",
  operatorMcpStop: "/operator/actions/mcp-stop",
  operatorMcpRestart: "/operator/actions/mcp-restart",
  operatorMcpTools: "/operator/mcp/tools",
  operatorMcpToolToggle: "/operator/mcp/tools/:toolName/toggle",
  operatorMcpServerTest: "/operator/mcp/:server/test",
  operatorMcpServerLogs: "/operator/mcp/:server/logs",
  operatorMcpServerLogsClear: "/operator/mcp/:server/logs/clear",
  mcpServers: "/mcp/servers",
  mcpServerToggle: "/mcp/servers/:name/toggle",
  settings: "/settings",
  conversation: "/conversations/:id",
  conversationVideoAsset: "/conversations/:id/assets/videos/:fileName",
  ttsSpeak: "/tts/speak",
  pushRegister: "/push/register",
  pushUnregister: "/push/unregister",
  pushStatus: "/push/status",
  pushClearBadge: "/push/clear-badge",
  conversations: "/conversations",
  emergencyStop: "/emergency-stop",
  skills: "/skills",
  skill: "/skills/:id",
  skillToggleProfile: "/skills/:id/toggle-profile",
  knowledgeNotes: "/knowledge/notes",
  knowledgeNote: "/knowledge/notes/:id",
  agentProfiles: "/agent-profiles",
  agentProfileToggle: "/agent-profiles/:id/toggle",
  agentProfile: "/agent-profiles/:id",
  loops: "/loops",
  loopToggle: "/loops/:id/toggle",
  loopRun: "/loops/:id/run",
  loop: "/loops/:id",
} as const;

export const REMOTE_SERVER_API_ROUTES = [
  { method: "GET", path: REMOTE_SERVER_API_PATHS.operatorStatus },
  { method: "GET", path: REMOTE_SERVER_API_PATHS.operatorHealth },
  { method: "GET", path: REMOTE_SERVER_API_PATHS.operatorErrors },
  { method: "GET", path: REMOTE_SERVER_API_PATHS.operatorLogs },
  { method: "GET", path: REMOTE_SERVER_API_PATHS.operatorAudit },
  { method: "GET", path: REMOTE_SERVER_API_PATHS.operatorConversations },
  { method: "GET", path: REMOTE_SERVER_API_PATHS.operatorRemoteServer },
  { method: "GET", path: REMOTE_SERVER_API_PATHS.operatorTunnel },
  { method: "GET", path: REMOTE_SERVER_API_PATHS.operatorTunnelSetup },
  { method: "GET", path: REMOTE_SERVER_API_PATHS.operatorIntegrations },
  { method: "GET", path: REMOTE_SERVER_API_PATHS.operatorUpdater },
  { method: "POST", path: REMOTE_SERVER_API_PATHS.operatorUpdaterCheck },
  { method: "POST", path: REMOTE_SERVER_API_PATHS.operatorUpdaterDownloadLatest },
  { method: "POST", path: REMOTE_SERVER_API_PATHS.operatorUpdaterRevealDownload },
  { method: "POST", path: REMOTE_SERVER_API_PATHS.operatorUpdaterOpenDownload },
  { method: "POST", path: REMOTE_SERVER_API_PATHS.operatorUpdaterOpenReleases },
  { method: "GET", path: REMOTE_SERVER_API_PATHS.operatorDiscord },
  { method: "GET", path: REMOTE_SERVER_API_PATHS.operatorDiscordLogs },
  { method: "POST", path: REMOTE_SERVER_API_PATHS.operatorDiscordConnect },
  { method: "POST", path: REMOTE_SERVER_API_PATHS.operatorDiscordDisconnect },
  { method: "POST", path: REMOTE_SERVER_API_PATHS.operatorDiscordClearLogs },
  { method: "GET", path: REMOTE_SERVER_API_PATHS.operatorWhatsApp },
  { method: "POST", path: REMOTE_SERVER_API_PATHS.operatorWhatsAppConnect },
  { method: "POST", path: REMOTE_SERVER_API_PATHS.operatorWhatsAppLogout },
  { method: "GET", path: REMOTE_SERVER_API_PATHS.operatorLocalSpeechModels },
  { method: "GET", path: REMOTE_SERVER_API_PATHS.operatorLocalSpeechModel },
  { method: "POST", path: REMOTE_SERVER_API_PATHS.operatorLocalSpeechModelDownload },
  { method: "GET", path: REMOTE_SERVER_API_PATHS.operatorModelPresets },
  { method: "POST", path: REMOTE_SERVER_API_PATHS.operatorModelPresets },
  { method: "PATCH", path: REMOTE_SERVER_API_PATHS.operatorModelPreset },
  { method: "DELETE", path: REMOTE_SERVER_API_PATHS.operatorModelPreset },
  { method: "POST", path: REMOTE_SERVER_API_PATHS.operatorTunnelStart },
  { method: "POST", path: REMOTE_SERVER_API_PATHS.operatorTunnelStop },
  { method: "POST", path: REMOTE_SERVER_API_PATHS.operatorRestartRemoteServer },
  { method: "POST", path: REMOTE_SERVER_API_PATHS.operatorRestartApp },
  { method: "POST", path: REMOTE_SERVER_API_PATHS.operatorRunAgent },
  { method: "POST", path: REMOTE_SERVER_API_PATHS.operatorAgentSessionStop },
  { method: "GET", path: REMOTE_SERVER_API_PATHS.operatorMessageQueues },
  { method: "POST", path: REMOTE_SERVER_API_PATHS.operatorMessageQueueClear },
  { method: "POST", path: REMOTE_SERVER_API_PATHS.operatorMessageQueuePause },
  { method: "POST", path: REMOTE_SERVER_API_PATHS.operatorMessageQueueResume },
  { method: "PATCH", path: REMOTE_SERVER_API_PATHS.operatorMessageQueueMessage },
  { method: "DELETE", path: REMOTE_SERVER_API_PATHS.operatorMessageQueueMessage },
  { method: "POST", path: REMOTE_SERVER_API_PATHS.operatorMessageQueueMessageRetry },
  { method: "POST", path: REMOTE_SERVER_API_PATHS.operatorRotateApiKey },
  { method: "POST", path: REMOTE_SERVER_API_PATHS.chatCompletions },
  { method: "GET", path: REMOTE_SERVER_API_PATHS.models },
  { method: "GET", path: REMOTE_SERVER_API_PATHS.modelsByProvider },
  { method: "GET", path: REMOTE_SERVER_API_PATHS.profiles },
  { method: "GET", path: REMOTE_SERVER_API_PATHS.currentProfile },
  { method: "POST", path: REMOTE_SERVER_API_PATHS.currentProfile },
  { method: "GET", path: REMOTE_SERVER_API_PATHS.profileExport },
  { method: "POST", path: REMOTE_SERVER_API_PATHS.profileImport },
  { method: "GET", path: REMOTE_SERVER_API_PATHS.operatorMcp },
  { method: "POST", path: REMOTE_SERVER_API_PATHS.operatorMcpStart },
  { method: "POST", path: REMOTE_SERVER_API_PATHS.operatorMcpStop },
  { method: "POST", path: REMOTE_SERVER_API_PATHS.operatorMcpRestart },
  { method: "GET", path: REMOTE_SERVER_API_PATHS.operatorMcpTools },
  { method: "POST", path: REMOTE_SERVER_API_PATHS.operatorMcpToolToggle },
  { method: "POST", path: REMOTE_SERVER_API_PATHS.operatorMcpServerTest },
  { method: "GET", path: REMOTE_SERVER_API_PATHS.operatorMcpServerLogs },
  { method: "POST", path: REMOTE_SERVER_API_PATHS.operatorMcpServerLogsClear },
  { method: "GET", path: REMOTE_SERVER_API_PATHS.mcpServers },
  { method: "POST", path: REMOTE_SERVER_API_PATHS.mcpServerToggle },
  { method: "GET", path: REMOTE_SERVER_API_PATHS.settings },
  { method: "PATCH", path: REMOTE_SERVER_API_PATHS.settings },
  { method: "GET", path: REMOTE_SERVER_API_PATHS.conversation },
  { method: "GET", path: REMOTE_SERVER_API_PATHS.conversationVideoAsset },
  { method: "POST", path: REMOTE_SERVER_API_PATHS.ttsSpeak },
  { method: "POST", path: REMOTE_SERVER_API_PATHS.pushRegister },
  { method: "POST", path: REMOTE_SERVER_API_PATHS.pushUnregister },
  { method: "GET", path: REMOTE_SERVER_API_PATHS.pushStatus },
  { method: "POST", path: REMOTE_SERVER_API_PATHS.pushClearBadge },
  { method: "GET", path: REMOTE_SERVER_API_PATHS.conversations },
  { method: "POST", path: REMOTE_SERVER_API_PATHS.conversations },
  { method: "PUT", path: REMOTE_SERVER_API_PATHS.conversation },
  { method: "POST", path: REMOTE_SERVER_API_PATHS.emergencyStop },
  { method: "GET", path: REMOTE_SERVER_API_PATHS.skills },
  { method: "GET", path: REMOTE_SERVER_API_PATHS.skill },
  { method: "POST", path: REMOTE_SERVER_API_PATHS.skills },
  { method: "PATCH", path: REMOTE_SERVER_API_PATHS.skill },
  { method: "DELETE", path: REMOTE_SERVER_API_PATHS.skill },
  { method: "POST", path: REMOTE_SERVER_API_PATHS.skillToggleProfile },
  { method: "GET", path: REMOTE_SERVER_API_PATHS.knowledgeNotes },
  { method: "GET", path: REMOTE_SERVER_API_PATHS.knowledgeNote },
  { method: "DELETE", path: REMOTE_SERVER_API_PATHS.knowledgeNote },
  { method: "GET", path: REMOTE_SERVER_API_PATHS.agentProfiles },
  { method: "POST", path: REMOTE_SERVER_API_PATHS.agentProfileToggle },
  { method: "GET", path: REMOTE_SERVER_API_PATHS.agentProfile },
  { method: "POST", path: REMOTE_SERVER_API_PATHS.agentProfiles },
  { method: "PATCH", path: REMOTE_SERVER_API_PATHS.agentProfile },
  { method: "DELETE", path: REMOTE_SERVER_API_PATHS.agentProfile },
  { method: "GET", path: REMOTE_SERVER_API_PATHS.loops },
  { method: "POST", path: REMOTE_SERVER_API_PATHS.loopToggle },
  { method: "POST", path: REMOTE_SERVER_API_PATHS.loopRun },
  { method: "POST", path: REMOTE_SERVER_API_PATHS.knowledgeNotes },
  { method: "PATCH", path: REMOTE_SERVER_API_PATHS.knowledgeNote },
  { method: "POST", path: REMOTE_SERVER_API_PATHS.loops },
  { method: "PATCH", path: REMOTE_SERVER_API_PATHS.loop },
  { method: "DELETE", path: REMOTE_SERVER_API_PATHS.loop },
] as const satisfies readonly RemoteServerApiRoute[];

function encodePathParam(value: string): string {
  return encodeURIComponent(value);
}

export type RemoteServerApiQueryParamValue = string | number | boolean | null | undefined;

export function buildRemoteServerApiQueryPath(
  path: string,
  params: Record<string, RemoteServerApiQueryParamValue>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      search.set(key, String(value));
    }
  }

  const query = search.toString();
  return query ? `${path}?${query}` : path;
}

function withQuery(path: string, params: URLSearchParams): string {
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

export function prefixRemoteServerApiPath(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (normalizedPath === REMOTE_SERVER_API_PREFIX || normalizedPath.startsWith(`${REMOTE_SERVER_API_PREFIX}/`)) {
    return normalizedPath;
  }
  return `${REMOTE_SERVER_API_PREFIX}${normalizedPath}`;
}

export const getRemoteServerApiRoutePath = prefixRemoteServerApiPath;

export function getRemoteServerApiRouteKey(route: { method: string; path: string }): string {
  return `${route.method.toUpperCase()} ${prefixRemoteServerApiPath(route.path)}`;
}

export type RemoteServerApiPathKey = keyof typeof REMOTE_SERVER_API_PATHS;

export const REMOTE_SERVER_API_ROUTE_PATHS = Object.fromEntries(
  Object.entries(REMOTE_SERVER_API_PATHS).map(([key, path]) => [key, prefixRemoteServerApiPath(path)]),
) as { readonly [K in RemoteServerApiPathKey]: string };

export const REMOTE_SERVER_MCP_PATHS = {
  session: "/mcp/:acpSessionToken",
  toolsList: "/mcp/tools/list",
  sessionToolsList: "/mcp/:acpSessionToken/tools/list",
  toolsCall: "/mcp/tools/call",
  sessionToolsCall: "/mcp/:acpSessionToken/tools/call",
} as const;

export type RemoteServerMcpPathKey = keyof typeof REMOTE_SERVER_MCP_PATHS;

export const REMOTE_SERVER_MCP_ROUTES = [
  { method: "POST", path: REMOTE_SERVER_MCP_PATHS.session },
  { method: "GET", path: REMOTE_SERVER_MCP_PATHS.session },
  { method: "DELETE", path: REMOTE_SERVER_MCP_PATHS.session },
  { method: "POST", path: REMOTE_SERVER_MCP_PATHS.toolsList },
  { method: "POST", path: REMOTE_SERVER_MCP_PATHS.sessionToolsList },
  { method: "POST", path: REMOTE_SERVER_MCP_PATHS.toolsCall },
  { method: "POST", path: REMOTE_SERVER_MCP_PATHS.sessionToolsCall },
] as const satisfies readonly RemoteServerApiRoute[];

export function isRemoteServerOperatorApiPath(pathname: string): boolean {
  return pathname === REMOTE_SERVER_OPERATOR_API_PREFIX
    || pathname.startsWith(`${REMOTE_SERVER_OPERATOR_API_PREFIX}/`);
}

export function getRemoteServerOperatorApiActionPath(pathname: string): string {
  if (pathname === REMOTE_SERVER_OPERATOR_API_PREFIX) {
    return "";
  }

  return pathname.startsWith(`${REMOTE_SERVER_OPERATOR_API_PREFIX}/`)
    ? pathname.slice(REMOTE_SERVER_OPERATOR_API_PREFIX.length + 1)
    : pathname;
}

export const REMOTE_SERVER_API_BUILDERS = {
  operatorErrors(count: number = 10): string {
    return withQuery(REMOTE_SERVER_API_PATHS.operatorErrors, new URLSearchParams({ count: String(count) }));
  },
  operatorLogs(count: number = 20, level?: "error" | "warning" | "info"): string {
    const params = new URLSearchParams({ count: String(count) });
    if (level) params.set("level", level);
    return withQuery(REMOTE_SERVER_API_PATHS.operatorLogs, params);
  },
  operatorAudit(count: number = 20): string {
    return withQuery(REMOTE_SERVER_API_PATHS.operatorAudit, new URLSearchParams({ count: String(count) }));
  },
  operatorConversations(count: number = 10): string {
    return withQuery(REMOTE_SERVER_API_PATHS.operatorConversations, new URLSearchParams({ count: String(count) }));
  },
  operatorAgentSessionStop(sessionId: string): string {
    return `/operator/sessions/${encodePathParam(sessionId)}/stop`;
  },
  operatorMessageQueueClear(conversationId: string): string {
    return `/operator/message-queues/${encodePathParam(conversationId)}/clear`;
  },
  operatorMessageQueuePause(conversationId: string): string {
    return `/operator/message-queues/${encodePathParam(conversationId)}/pause`;
  },
  operatorMessageQueueResume(conversationId: string): string {
    return `/operator/message-queues/${encodePathParam(conversationId)}/resume`;
  },
  operatorMessageQueueMessage(conversationId: string, messageId: string): string {
    return `/operator/message-queues/${encodePathParam(conversationId)}/messages/${encodePathParam(messageId)}`;
  },
  operatorMessageQueueMessageRetry(conversationId: string, messageId: string): string {
    return `/operator/message-queues/${encodePathParam(conversationId)}/messages/${encodePathParam(messageId)}/retry`;
  },
  operatorDiscordLogs(count: number = 20): string {
    return withQuery(REMOTE_SERVER_API_PATHS.operatorDiscordLogs, new URLSearchParams({ count: String(count) }));
  },
  operatorLocalSpeechModel(providerId: string): string {
    return `/operator/local-speech-models/${encodePathParam(providerId)}`;
  },
  operatorLocalSpeechModelDownload(providerId: string): string {
    return `/operator/local-speech-models/${encodePathParam(providerId)}/download`;
  },
  operatorModelPreset(presetId: string): string {
    return `/operator/model-presets/${encodePathParam(presetId)}`;
  },
  operatorMcpServerLogs(server: string, count?: number): string {
    const path = `/operator/mcp/${encodePathParam(server)}/logs`;
    return count === undefined
      ? path
      : withQuery(path, new URLSearchParams({ count: String(count) }));
  },
  operatorMcpServerTest(server: string): string {
    return `/operator/mcp/${encodePathParam(server)}/test`;
  },
  operatorMcpTools(server?: string): string {
    return server === undefined
      ? REMOTE_SERVER_API_PATHS.operatorMcpTools
      : withQuery(REMOTE_SERVER_API_PATHS.operatorMcpTools, new URLSearchParams({ server }));
  },
  operatorMcpToolToggle(toolName: string): string {
    return `/operator/mcp/tools/${encodePathParam(toolName)}/toggle`;
  },
  operatorMcpServerLogsClear(server: string): string {
    return `/operator/mcp/${encodePathParam(server)}/logs/clear`;
  },
  modelsByProvider(providerId: string): string {
    return `/models/${encodePathParam(providerId)}`;
  },
  profileExport(profileId: string): string {
    return `/profiles/${encodePathParam(profileId)}/export`;
  },
  mcpServerToggle(serverName: string): string {
    return `/mcp/servers/${encodePathParam(serverName)}/toggle`;
  },
  conversation(id: string): string {
    return `/conversations/${encodePathParam(id)}`;
  },
  conversationVideoAsset(id: string, fileName: string): string {
    return `/conversations/${encodePathParam(id)}/assets/videos/${encodePathParam(fileName)}`;
  },
  skillToggleProfile(skillId: string): string {
    return `/skills/${encodePathParam(skillId)}/toggle-profile`;
  },
  skill(skillId: string): string {
    return `/skills/${encodePathParam(skillId)}`;
  },
  knowledgeNote(id: string): string {
    return `/knowledge/notes/${encodePathParam(id)}`;
  },
  agentProfile(id: string): string {
    return `/agent-profiles/${encodePathParam(id)}`;
  },
  agentProfileToggle(id: string): string {
    return `/agent-profiles/${encodePathParam(id)}/toggle`;
  },
  loop(id: string): string {
    return `/loops/${encodePathParam(id)}`;
  },
  loopToggle(id: string): string {
    return `/loops/${encodePathParam(id)}/toggle`;
  },
  loopRun(id: string): string {
    return `/loops/${encodePathParam(id)}/run`;
  },
} as const;
