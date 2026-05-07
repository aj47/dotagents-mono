import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./deviceIdentity', () => ({
  getDeviceIdentity: vi.fn().mockResolvedValue({
    deviceId: 'mobile-device-123',
    createdAt: 0,
  }),
}));

import { getDeviceIdentity } from './deviceIdentity';
import { SettingsApiClient } from './settingsApi';

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('SettingsApiClient operator endpoints', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('uses the normalized /v1 base URL for operator status requests', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({
      timestamp: Date.now(),
      remoteServer: { running: true, bind: '127.0.0.1', port: 3210 },
      health: { checkedAt: Date.now(), overall: 'healthy', checks: {} },
      tunnel: { running: false, starting: false, mode: null },
      integrations: {
        discord: { available: false, enabled: false, connected: false, connecting: false, logs: { total: 0 } },
        whatsapp: {
          enabled: false,
          available: false,
          connected: false,
          serverConfigured: false,
          serverConnected: false,
          autoReplyEnabled: false,
          logMessagesEnabled: false,
          allowedSenderCount: 0,
          logs: { total: 0 },
        },
        pushNotifications: { enabled: false, tokenCount: 0, platforms: [] },
      },
      updater: { enabled: false, mode: 'manual' },
      recentErrors: { total: 0, errorsInLastFiveMinutes: 0 },
    }));
    vi.stubGlobal('fetch', fetchMock);

    const client = new SettingsApiClient('127.0.0.1:3210', 'secret-token');
    await client.getOperatorStatus();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe('http://127.0.0.1:3210/v1/operator/status');

    const headers = new Headers(fetchMock.mock.calls[0]?.[1]?.headers);
    expect(headers.get('Authorization')).toBe('Bearer secret-token');
    expect(headers.get('x-dotagents-device-id')).toBe('mobile-device-123');
    expect(getDeviceIdentity).toHaveBeenCalled();
  });

  it('targets operator errors, audit, and action endpoints without duplicating the /v1 prefix', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ count: 0, errors: [] }))
      .mockResolvedValueOnce(jsonResponse({
        timestamp: 1,
        system: { platform: 'darwin', nodeVersion: 'v20.0.0', electronVersion: '30.0.0' },
        config: { mcpServersCount: 0 },
        mcp: { availableTools: 0, serverStatus: {} },
        errors: [],
      }))
      .mockResolvedValueOnce(jsonResponse({ success: true, action: 'operator-save-diagnostic-report', message: 'saved', filePath: '/tmp/report.json' }))
      .mockResolvedValueOnce(jsonResponse({ success: true, action: 'operator-clear-errors', message: 'cleared' }))
      .mockResolvedValueOnce(jsonResponse({ authenticated: false, callbackUrl: 'http://127.0.0.1:1455/callback' }))
      .mockResolvedValueOnce(jsonResponse({ success: true, action: 'chatgpt-web-oauth-login', message: 'connected', status: { authenticated: true, callbackUrl: 'http://127.0.0.1:1455/callback' } }))
      .mockResolvedValueOnce(jsonResponse({ success: true, action: 'chatgpt-web-oauth-logout', message: 'disconnected', status: { authenticated: false, callbackUrl: 'http://127.0.0.1:1455/callback' } }))
      .mockResolvedValueOnce(jsonResponse({ count: 1, entries: [] }))
      .mockResolvedValueOnce(jsonResponse({ success: true, action: 'restart-remote-server', message: 'scheduled' }))
      .mockResolvedValueOnce(jsonResponse({ success: true, action: 'restart-app', message: 'scheduled' }))
      .mockResolvedValueOnce(jsonResponse({ success: true, message: 'Emergency stop executed' }))
      .mockResolvedValueOnce(jsonResponse({
        success: true,
        action: 'rotate-api-key',
        message: 'Remote server API key rotated',
        scheduled: true,
        restartScheduled: true,
        apiKey: 'rotated-secret',
      }))
      .mockResolvedValueOnce(jsonResponse({ success: true, action: 'updater-check', message: 'No newer release found.' }))
      .mockResolvedValueOnce(jsonResponse({ success: true, action: 'updater-download-latest', message: 'downloaded' }))
      .mockResolvedValueOnce(jsonResponse({ success: true, action: 'updater-reveal-download', message: 'revealed' }))
      .mockResolvedValueOnce(jsonResponse({ success: true, action: 'updater-open-download', message: 'opened installer' }))
      .mockResolvedValueOnce(jsonResponse({ success: true, action: 'updater-open-releases', message: 'opened' }))
      .mockResolvedValueOnce(jsonResponse({ success: true, action: 'stop-tts-playback', message: 'stopped speech' }))
      .mockResolvedValueOnce(jsonResponse({ success: true, action: 'desktop-main-window-show', message: 'showed app' }))
      .mockResolvedValueOnce(jsonResponse({ success: true, action: 'desktop-panel-window-show', message: 'showed panel' }))
      .mockResolvedValueOnce(jsonResponse({ success: true, action: 'desktop-panel-window-hide', message: 'hid panel' }))
      .mockResolvedValueOnce(jsonResponse({ success: true, action: 'agent-session-show', message: 'showing' }))
      .mockResolvedValueOnce(jsonResponse({ success: true, action: 'agent-session-snooze', message: 'snoozed' }))
      .mockResolvedValueOnce(jsonResponse({ success: true, action: 'agent-session-unsnooze', message: 'unsnoozed' }))
      .mockResolvedValueOnce(jsonResponse({ success: true, action: 'agent-session-clear', message: 'cleared session' }))
      .mockResolvedValueOnce(jsonResponse({ success: true, action: 'agent-sessions-clear-inactive', message: 'cleared' }))
      .mockResolvedValueOnce(jsonResponse({ success: true, action: 'agent-sessions-snooze-hide-panel', message: 'hidden' }));
    vi.stubGlobal('fetch', fetchMock);

    const client = new SettingsApiClient('https://example.com/v1', 'secret-token');

    await client.getOperatorErrors(12);
    await client.getOperatorDiagnosticReport();
    await client.saveOperatorDiagnosticReport('/tmp/report.json');
    await client.clearOperatorErrors();
    await client.getChatGptWebAuthStatus();
    await client.loginChatGptWebOAuth();
    await client.logoutChatGptWebOAuth();
    await client.getOperatorAudit();
    await client.restartRemoteServer();
    await client.restartApp();
    await client.emergencyStop();
    await client.rotateOperatorApiKey();
    await client.checkOperatorUpdater();
    await client.downloadOperatorUpdateAsset();
    await client.revealOperatorUpdateAsset();
    await client.openOperatorUpdateAsset();
    await client.openOperatorReleasesPage();
    await client.stopOperatorTtsPlayback();
    await client.showOperatorMainWindow();
    await client.showOperatorPanelWindow();
    await client.hideOperatorPanelWindow();
    await client.showOperatorAgentSession('session/1');
    await client.snoozeOperatorAgentSession('session/1');
    await client.unsnoozeOperatorAgentSession('session/1');
    await client.clearOperatorAgentSession('session/1');
    await client.clearInactiveOperatorAgentSessions();
    await client.snoozeOperatorAgentSessionsAndHidePanel(['session/1']);

    expect(fetchMock.mock.calls.map((call) => call[0])).toEqual([
      'https://example.com/v1/operator/errors?count=12',
      'https://example.com/v1/operator/diagnostics/report',
      'https://example.com/v1/operator/diagnostics/report/save',
      'https://example.com/v1/operator/errors/clear',
      'https://example.com/v1/operator/providers/chatgpt-web/auth',
      'https://example.com/v1/operator/providers/chatgpt-web/auth/login',
      'https://example.com/v1/operator/providers/chatgpt-web/auth/logout',
      'https://example.com/v1/operator/audit?count=20',
      'https://example.com/v1/operator/actions/restart-remote-server',
      'https://example.com/v1/operator/actions/restart-app',
      'https://example.com/v1/emergency-stop',
      'https://example.com/v1/operator/access/rotate-api-key',
      'https://example.com/v1/operator/updater/check',
      'https://example.com/v1/operator/updater/download-latest',
      'https://example.com/v1/operator/updater/reveal-download',
      'https://example.com/v1/operator/updater/open-download',
      'https://example.com/v1/operator/updater/open-releases',
      'https://example.com/v1/operator/actions/stop-tts',
      'https://example.com/v1/operator/windows/main/show',
      'https://example.com/v1/operator/windows/panel/show',
      'https://example.com/v1/operator/windows/panel/hide',
      'https://example.com/v1/operator/sessions/session%2F1/show',
      'https://example.com/v1/operator/sessions/session%2F1/snooze',
      'https://example.com/v1/operator/sessions/session%2F1/unsnooze',
      'https://example.com/v1/operator/sessions/session%2F1/clear',
      'https://example.com/v1/operator/sessions/clear-inactive',
      'https://example.com/v1/operator/sessions/snooze-and-hide-panel',
    ]);

    for (const index of [2, 3, 5, 6, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26]) {
      expect(fetchMock.mock.calls[index]?.[1]?.method).toBe('POST');
    }
    expect(fetchMock.mock.calls[2]?.[1]?.body).toBe(JSON.stringify({ filePath: '/tmp/report.json' }));
    expect(fetchMock.mock.calls[26]?.[1]?.body).toBe(JSON.stringify({ sessionIds: ['session/1'] }));
  });

  it('targets tunnel, Discord, and WhatsApp operator endpoints with the expected HTTP methods', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ installed: true, loggedIn: true, mode: 'quick', autoStart: false, namedTunnelConfigured: false, credentialsPathConfigured: false, tunnelCount: 0, tunnels: [] }))
      .mockResolvedValueOnce(jsonResponse({ success: true, action: 'tunnel-start', message: 'started' }))
      .mockResolvedValueOnce(jsonResponse({ success: true, action: 'tunnel-stop', message: 'stopped' }))
      .mockResolvedValueOnce(jsonResponse({ available: true, enabled: true, connected: false, connecting: false, tokenConfigured: true, logs: { total: 2 } }))
      .mockResolvedValueOnce(jsonResponse({ count: 5, logs: [] }))
      .mockResolvedValueOnce(jsonResponse({ success: true, action: 'discord-connect', message: 'started' }))
      .mockResolvedValueOnce(jsonResponse({ success: true, action: 'discord-disconnect', message: 'stopped' }))
      .mockResolvedValueOnce(jsonResponse({ success: true, action: 'discord-clear-logs', message: 'cleared' }))
      .mockResolvedValueOnce(jsonResponse({ enabled: true, available: true, connected: false, serverConfigured: true, serverConnected: true, autoReplyEnabled: false, logMessagesEnabled: true, allowedSenderCount: 1, hasCredentials: true, logs: { total: 4 } }))
      .mockResolvedValueOnce(jsonResponse({ success: true, action: 'whatsapp-connect', message: 'started' }))
      .mockResolvedValueOnce(jsonResponse({ success: true, action: 'whatsapp-logout', message: 'done' }));
    vi.stubGlobal('fetch', fetchMock);

    const client = new SettingsApiClient('https://example.com', 'secret-token');

    await client.getOperatorTunnelSetup();
    await client.startOperatorTunnel();
    await client.stopOperatorTunnel();
    await client.getOperatorDiscord();
    await client.getOperatorDiscordLogs(5);
    await client.connectOperatorDiscord();
    await client.disconnectOperatorDiscord();
    await client.clearOperatorDiscordLogs();
    await client.getOperatorWhatsApp();
    await client.connectOperatorWhatsApp();
    await client.logoutOperatorWhatsApp();

    expect(fetchMock.mock.calls.map((call) => call[0])).toEqual([
      'https://example.com/v1/operator/tunnel/setup',
      'https://example.com/v1/operator/tunnel/start',
      'https://example.com/v1/operator/tunnel/stop',
      'https://example.com/v1/operator/discord',
      'https://example.com/v1/operator/discord/logs?count=5',
      'https://example.com/v1/operator/discord/connect',
      'https://example.com/v1/operator/discord/disconnect',
      'https://example.com/v1/operator/discord/logs/clear',
      'https://example.com/v1/operator/whatsapp',
      'https://example.com/v1/operator/whatsapp/connect',
      'https://example.com/v1/operator/whatsapp/logout',
    ]);

    expect(fetchMock.mock.calls[1]?.[1]?.method).toBe('POST');
    expect(fetchMock.mock.calls[2]?.[1]?.method).toBe('POST');
    expect(fetchMock.mock.calls[5]?.[1]?.method).toBe('POST');
    expect(fetchMock.mock.calls[6]?.[1]?.method).toBe('POST');
    expect(fetchMock.mock.calls[7]?.[1]?.method).toBe('POST');
    expect(fetchMock.mock.calls[9]?.[1]?.method).toBe('POST');
    expect(fetchMock.mock.calls[10]?.[1]?.method).toBe('POST');
  });
});
