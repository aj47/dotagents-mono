import { describe, expect, it } from 'vitest';
import {
  REMOTE_SERVER_API_BUILDERS,
  REMOTE_SERVER_API_PATHS,
  REMOTE_SERVER_API_PREFIX,
  REMOTE_SERVER_API_ROUTE_PATHS,
  REMOTE_SERVER_API_ROUTES,
  REMOTE_SERVER_MCP_PATHS,
  REMOTE_SERVER_MCP_ROUTES,
  REMOTE_SERVER_OPERATOR_API_PREFIX,
  buildRemoteServerApiQueryPath,
  getRemoteServerApiRouteKey,
  getRemoteServerApiRoutePath,
  getRemoteServerOperatorApiActionPath,
  isRemoteServerOperatorApiPath,
} from './remote-server-api';

describe('remote server API contract', () => {
  it('keeps route method/path keys unique', () => {
    const keys = REMOTE_SERVER_API_ROUTES.map(getRemoteServerApiRouteKey);

    expect(new Set(keys).size).toBe(keys.length);
    expect(keys.every((key) => key.includes(`${REMOTE_SERVER_API_PREFIX}/`))).toBe(true);
  });

  it('keeps injected MCP route method/path keys unique', () => {
    const keys = REMOTE_SERVER_MCP_ROUTES.map((route) => `${route.method} ${route.path}`);

    expect(new Set(keys).size).toBe(keys.length);
    expect(REMOTE_SERVER_MCP_PATHS.session).toBe('/mcp/:acpSessionToken');
    expect(REMOTE_SERVER_MCP_PATHS.sessionToolsCall).toBe('/mcp/:acpSessionToken/tools/call');
  });

  it('normalizes prefixed and unprefixed route paths consistently', () => {
    expect(getRemoteServerApiRoutePath(REMOTE_SERVER_API_PATHS.settings)).toBe('/v1/settings');
    expect(REMOTE_SERVER_API_ROUTE_PATHS.settings).toBe('/v1/settings');
    expect(REMOTE_SERVER_API_ROUTE_PATHS.agentSessionCandidates).toBe('/v1/agent-sessions/candidates');
    expect(REMOTE_SERVER_API_ROUTE_PATHS.conversation).toBe('/v1/conversations/:id');
    expect(REMOTE_SERVER_API_ROUTE_PATHS.bundleExportableItems).toBe('/v1/bundles/exportable-items');
    expect(REMOTE_SERVER_API_ROUTE_PATHS.bundleExport).toBe('/v1/bundles/export');
    expect(REMOTE_SERVER_API_ROUTE_PATHS.bundleImportPreview).toBe('/v1/bundles/import/preview');
    expect(REMOTE_SERVER_API_ROUTE_PATHS.bundleImport).toBe('/v1/bundles/import');
    expect(REMOTE_SERVER_API_ROUTE_PATHS.skillImportMarkdown).toBe('/v1/skills/import/markdown');
    expect(REMOTE_SERVER_API_ROUTE_PATHS.skillImportGitHub).toBe('/v1/skills/import/github');
    expect(REMOTE_SERVER_API_ROUTE_PATHS.skillExportMarkdown).toBe('/v1/skills/:id/export/markdown');
    expect(REMOTE_SERVER_API_ROUTE_PATHS.knowledgeNotesSearch).toBe('/v1/knowledge/notes/search');
    expect(REMOTE_SERVER_API_ROUTE_PATHS.knowledgeNotesDeleteMultiple).toBe('/v1/knowledge/notes/delete-multiple');
    expect(REMOTE_SERVER_API_ROUTE_PATHS.knowledgeNotesDeleteAll).toBe('/v1/knowledge/notes/delete-all');
    expect(REMOTE_SERVER_API_ROUTE_PATHS.agentProfileVerifyCommand).toBe('/v1/agent-profiles/verify-command');
    expect(REMOTE_SERVER_API_ROUTE_PATHS.loopImportMarkdown).toBe('/v1/loops/import/markdown');
    expect(REMOTE_SERVER_API_ROUTE_PATHS.loopStatuses).toBe('/v1/loops/statuses');
    expect(REMOTE_SERVER_API_ROUTE_PATHS.loopStart).toBe('/v1/loops/:id/start');
    expect(REMOTE_SERVER_API_ROUTE_PATHS.loopStop).toBe('/v1/loops/:id/stop');
    expect(REMOTE_SERVER_API_ROUTE_PATHS.loopExportMarkdown).toBe('/v1/loops/:id/export/markdown');
    expect(REMOTE_SERVER_API_ROUTE_PATHS.mcpConfigImport).toBe('/v1/mcp/config/import');
    expect(REMOTE_SERVER_API_ROUTE_PATHS.mcpConfigExport).toBe('/v1/mcp/config/export');
    expect(getRemoteServerApiRoutePath('/v1/settings')).toBe('/v1/settings');
    expect(getRemoteServerApiRoutePath('settings')).toBe('/v1/settings');
    expect(getRemoteServerApiRouteKey({ method: 'patch', path: REMOTE_SERVER_API_PATHS.settings })).toBe('PATCH /v1/settings');
    expect(getRemoteServerApiRouteKey({ method: 'PATCH', path: '/v1/settings' })).toBe('PATCH /v1/settings');
    expect(REMOTE_SERVER_OPERATOR_API_PREFIX).toBe('/v1/operator');
    expect(isRemoteServerOperatorApiPath('/v1/operator')).toBe(true);
    expect(isRemoteServerOperatorApiPath('/v1/operator/actions/restart-app')).toBe(true);
    expect(isRemoteServerOperatorApiPath('/v1/operatorish')).toBe(false);
    expect(getRemoteServerOperatorApiActionPath('/v1/operator/actions/restart-app')).toBe('actions/restart-app');
    expect(getRemoteServerOperatorApiActionPath('/v1/operator')).toBe('');
  });

  it('builds encoded dynamic paths and query paths for clients', () => {
    expect(REMOTE_SERVER_API_BUILDERS.profileExport('agent/name')).toBe('/profiles/agent%2Fname/export');
    expect(REMOTE_SERVER_API_BUILDERS.mcpServerToggle('filesystem/local')).toBe('/mcp/servers/filesystem%2Flocal/toggle');
    expect(REMOTE_SERVER_API_BUILDERS.mcpConfigServer('filesystem/local')).toBe('/mcp/config/servers/filesystem%2Flocal');
    expect(REMOTE_SERVER_API_BUILDERS.modelsByProvider('openai')).toBe('/models/openai');
    expect(REMOTE_SERVER_API_BUILDERS.conversationVideoAsset('conv 1', 'clip/name.mp4')).toBe('/conversations/conv%201/assets/videos/clip%2Fname.mp4');
    expect(REMOTE_SERVER_API_BUILDERS.operatorLogs(5, 'warning')).toBe('/operator/logs?count=5&level=warning');
    expect(REMOTE_SERVER_API_BUILDERS.operatorLogs(5)).toBe('/operator/logs?count=5');
    expect(REMOTE_SERVER_API_BUILDERS.operatorAgentSessionStop('session/active')).toBe('/operator/sessions/session%2Factive/stop');
    expect(REMOTE_SERVER_API_BUILDERS.operatorMessageQueueClear('conv/active')).toBe('/operator/message-queues/conv%2Factive/clear');
    expect(REMOTE_SERVER_API_BUILDERS.operatorMessageQueuePause('conv/active')).toBe('/operator/message-queues/conv%2Factive/pause');
    expect(REMOTE_SERVER_API_BUILDERS.operatorMessageQueueResume('conv/active')).toBe('/operator/message-queues/conv%2Factive/resume');
    expect(REMOTE_SERVER_API_BUILDERS.operatorMessageQueueMessage('conv/active', 'msg/1')).toBe('/operator/message-queues/conv%2Factive/messages/msg%2F1');
    expect(REMOTE_SERVER_API_BUILDERS.operatorMessageQueueMessageRetry('conv/active', 'msg/1')).toBe('/operator/message-queues/conv%2Factive/messages/msg%2F1/retry');
    expect(REMOTE_SERVER_API_BUILDERS.operatorMcpServerTest('filesystem/local')).toBe('/operator/mcp/filesystem%2Flocal/test');
    expect(REMOTE_SERVER_API_BUILDERS.operatorMcpTools('filesystem/local')).toBe('/operator/mcp/tools?server=filesystem%2Flocal');
    expect(REMOTE_SERVER_API_BUILDERS.operatorMcpToolToggle('filesystem/local:read')).toBe('/operator/mcp/tools/filesystem%2Flocal%3Aread/toggle');
    expect(REMOTE_SERVER_API_BUILDERS.operatorMcpServerLogs('filesystem/local', 5)).toBe('/operator/mcp/filesystem%2Flocal/logs?count=5');
    expect(REMOTE_SERVER_API_BUILDERS.operatorMcpServerLogsClear('filesystem/local')).toBe('/operator/mcp/filesystem%2Flocal/logs/clear');
    expect(REMOTE_SERVER_API_BUILDERS.skill('skill/name')).toBe('/skills/skill%2Fname');
    expect(REMOTE_SERVER_API_BUILDERS.skillExportMarkdown('skill/name')).toBe('/skills/skill%2Fname/export/markdown');
    expect(REMOTE_SERVER_API_BUILDERS.loopExportMarkdown('loop/name')).toBe('/loops/loop%2Fname/export/markdown');
    expect(REMOTE_SERVER_API_BUILDERS.loopStart('loop/name')).toBe('/loops/loop%2Fname/start');
    expect(REMOTE_SERVER_API_BUILDERS.loopStop('loop/name')).toBe('/loops/loop%2Fname/stop');
    expect(buildRemoteServerApiQueryPath(REMOTE_SERVER_API_PATHS.operatorErrors, {
      count: 3,
      empty: undefined,
      includeDetails: true,
    })).toBe('/operator/errors?count=3&includeDetails=true');
  });
});
