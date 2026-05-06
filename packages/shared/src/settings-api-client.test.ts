import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildEmergencyStopErrorResponse,
  buildEmergencyStopResponse,
  buildSettingsResponse,
  buildSettingsSensitiveNoValidUpdateAuditContext,
  buildSettingsSensitiveUpdateAuditContext,
  buildSettingsSensitiveUpdateFailureAuditContext,
  buildSettingsUpdatePatch,
  buildSettingsUpdateResponse,
  DOTAGENTS_DEVICE_ID_HEADER,
  ExtendedSettingsApiClient,
  getSettingsAction,
  getSettingsUpdateRequestRecord,
  SettingsApiClient,
  triggerEmergencyStopAction,
  updateSettingsAction,
  type SettingsActionConfigLike,
  type SettingsActionOptions,
} from './settings-api-client';
import {
  buildRemoteServerApiQueryPath,
  REMOTE_SERVER_API_BUILDERS,
  REMOTE_SERVER_API_PATHS,
  REMOTE_SERVER_API_ROUTES,
  getRemoteServerApiRouteKey,
  getRemoteServerApiRoutePath,
} from './remote-server-api';
import {
  DEFAULT_DISCORD_DM_ENABLED,
  DEFAULT_DISCORD_LOG_MESSAGES,
  DEFAULT_DISCORD_REQUIRE_MENTION,
} from './discord-config';
import {
  DEFAULT_WHATSAPP_AUTO_REPLY,
  DEFAULT_WHATSAPP_ENABLED,
  DEFAULT_WHATSAPP_LOG_MESSAGES,
} from './whatsapp-config';
import {
  DEFAULT_LANGFUSE_ENABLED,
  DEFAULT_LOCAL_TRACE_LOGGING_ENABLED,
} from './observability-config';

function jsonResponse(body: unknown, status: number = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function requestPath(url: unknown): string {
  const parsed = new URL(String(url));
  return `${parsed.pathname}${parsed.search}`;
}

describe('SettingsApiClient', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('normalizes the remote-server base URL and adds auth plus optional device ID headers', async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(jsonResponse({})));
    vi.stubGlobal('fetch', fetchMock);

    const client = new SettingsApiClient('127.0.0.1:3210', 'secret-token', {
      getDeviceId: () => 'device-123',
    });

    await client.getSettings();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe('http://127.0.0.1:3210/v1/settings');

    const headers = new Headers(fetchMock.mock.calls[0]?.[1]?.headers);
    expect(headers.get('Authorization')).toBe('Bearer secret-token');
    expect(headers.get(DOTAGENTS_DEVICE_ID_HEADER)).toBe('device-123');
    expect(headers.get('Content-Type')).toBeNull();
  });

  it('sets JSON content type only when a request body exists', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ success: true, updated: ['mcpMaxIterations'] }))
      .mockResolvedValueOnce(jsonResponse({ success: true, id: 'loop-1' }));
    vi.stubGlobal('fetch', fetchMock);

    const client = new ExtendedSettingsApiClient('https://example.com/v1', 'secret-token');

    await client.updateSettings({ mcpMaxIterations: 20 });
    await client.runLoop('loop-1');

    const updateHeaders = new Headers(fetchMock.mock.calls[0]?.[1]?.headers);
    const runHeaders = new Headers(fetchMock.mock.calls[1]?.[1]?.headers);

    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://example.com/v1/settings');
    expect(fetchMock.mock.calls[0]?.[1]?.method).toBe('PATCH');
    expect(updateHeaders.get('Content-Type')).toBe('application/json');
    expect(fetchMock.mock.calls[0]?.[1]?.body).toBe(JSON.stringify({ mcpMaxIterations: 20 }));

    expect(fetchMock.mock.calls[1]?.[0]).toBe('https://example.com/v1/loops/loop-1/run');
    expect(fetchMock.mock.calls[1]?.[1]?.method).toBe('POST');
    expect(runHeaders.get('Content-Type')).toBeNull();
  });

  it('builds route-compatible settings update patches', () => {
    expect(getSettingsUpdateRequestRecord(null)).toEqual({});

    const updates = buildSettingsUpdatePatch(
      {
        mcpToolsProviderId: 'groq',
        mcpToolsGroqModel: 'llama-3.3',
        mcpMaxIterations: 100,
        remoteServerApiKey: '   ',
        openaiApiKey: '••••••••',
        groqApiKey: ' groq-secret ',
        chatgptWebAccessToken: 'chatgpt-access',
        chatgptWebBaseUrl: 'https://chatgpt.example',
        openaiReasoningEffort: 'xhigh',
        codexTextVerbosity: 'high',
        themePreference: 'dark',
        floatingPanelAutoShow: false,
        hidePanelWhenMainFocused: false,
        hideDockIcon: true,
        launchAtLogin: true,
        panelPosition: 'custom',
        panelCustomPosition: { x: 10.4, y: -20.6 },
        panelDragEnabled: false,
        panelCustomSize: { width: 420.4, height: 128.6 },
        panelWaveformSize: { width: 360.2, height: 96.8 },
        panelTextInputSize: null,
        panelProgressSize: { width: 520, height: 180 },
        textInputEnabled: false,
        conversationsEnabled: false,
        maxConversationsToKeep: 250.9,
        autoSaveConversations: false,
        ttsLLMPreprocessingProviderId: 'chatgpt-web',
        mainAgentMode: 'acpx',
        openaiTtsSpeed: 1.25,
        edgeTtsRate: 0.8,
        supertonicSpeed: 1.1,
        openaiTtsResponseFormat: 'opus',
        remoteServerBindAddress: '0.0.0.0',
        remoteServerLogLevel: 'debug',
        remoteServerCorsOrigins: [' https://app.example ', '', 3],
        cloudflareTunnelMode: 'named',
        discordBotToken: '••••••••',
        discordAllowUserIds: [' user-1 ', 'user-1', ' '],
        mcpAutoPasteEnabled: true,
        mcpAutoPasteDelay: 1250.6,
        mcpRuntimeDisabledServers: [' github ', '', 'filesystem', 'github'],
        mcpDisabledTools: ['github:create_issue', ' ', 'github:create_issue', 3],
      },
      {},
      {
        providerSecretMask: '••••••••',
        remoteServerSecretMask: '••••••••',
        discordSecretMask: '••••••••',
      },
    );

    expect(updates).toMatchObject({
      agentProviderId: 'groq',
      mcpToolsProviderId: 'groq',
      agentGroqModel: 'llama-3.3',
      mcpToolsGroqModel: 'llama-3.3',
      mcpMaxIterations: 100,
      groqApiKey: 'groq-secret',
      chatgptWebAccessToken: 'chatgpt-access',
      chatgptWebBaseUrl: 'https://chatgpt.example',
      openaiReasoningEffort: 'xhigh',
      codexTextVerbosity: 'high',
      themePreference: 'dark',
      floatingPanelAutoShow: false,
      hidePanelWhenMainFocused: false,
      hideDockIcon: true,
      launchAtLogin: true,
      panelPosition: 'custom',
      panelCustomPosition: { x: 10, y: -21 },
      panelDragEnabled: false,
      panelCustomSize: { width: 420, height: 129 },
      panelWaveformSize: { width: 360, height: 97 },
      panelTextInputSize: undefined,
      panelProgressSize: { width: 520, height: 180 },
      textInputEnabled: false,
      conversationsEnabled: false,
      maxConversationsToKeep: 250,
      autoSaveConversations: false,
      ttsLLMPreprocessingProviderId: 'chatgpt-web',
      mainAgentMode: 'acpx',
      openaiTtsSpeed: 1.25,
      edgeTtsRate: 0.8,
      supertonicSpeed: 1.1,
      openaiTtsResponseFormat: 'opus',
      remoteServerBindAddress: '0.0.0.0',
      remoteServerLogLevel: 'debug',
      remoteServerCorsOrigins: ['https://app.example'],
      cloudflareTunnelMode: 'named',
      discordAllowUserIds: ['user-1'],
      mcpAutoPasteEnabled: true,
      mcpAutoPasteDelay: 1251,
      mcpRuntimeDisabledServers: ['github', 'filesystem'],
      mcpDisabledTools: ['github:create_issue'],
    });
    expect(updates).not.toHaveProperty('openaiApiKey');
    expect(updates).not.toHaveProperty('remoteServerApiKey');
    expect(updates).not.toHaveProperty('discordBotToken');

    expect(buildSettingsUpdatePatch(
      { mcpMaxIterations: 100.9 },
      {},
      {
        providerSecretMask: '••••••••',
        remoteServerSecretMask: '••••••••',
        discordSecretMask: '••••••••',
      },
    )).toMatchObject({ mcpMaxIterations: 100 });
    expect(buildSettingsUpdatePatch(
      { mcpMaxIterations: 101 },
      {},
      {
        providerSecretMask: '••••••••',
        remoteServerSecretMask: '••••••••',
        discordSecretMask: '••••••••',
      },
    )).not.toHaveProperty('mcpMaxIterations');
    expect(buildSettingsUpdatePatch(
      {
        openaiTtsSpeed: 0.24,
        edgeTtsRate: 2.1,
        supertonicSpeed: '1.1',
        groqTtsModel: 'playai-tts',
        groqTtsVoice: 'troy',
        geminiTtsModel: 'gemini-text-only',
        openaiTtsResponseFormat: 'json',
        parakeetNumThreads: 3,
        mainAgentMode: 'acp',
        themePreference: 'blue',
        openaiReasoningEffort: 'ultra',
        codexTextVerbosity: 'verbose',
        remoteServerBindAddress: 'localhost',
        remoteServerLogLevel: 'trace',
        cloudflareTunnelMode: 'persisted',
        supertonicVoice: 'X1',
        supertonicLanguage: 'de',
        supertonicSteps: 11,
      },
      {},
      {
        providerSecretMask: '••••••••',
        remoteServerSecretMask: '••••••••',
        discordSecretMask: '••••••••',
      },
    )).not.toMatchObject({
      openaiTtsSpeed: expect.any(Number),
      edgeTtsRate: expect.any(Number),
      supertonicSpeed: expect.any(Number),
      groqTtsModel: expect.any(String),
      groqTtsVoice: expect.any(String),
      geminiTtsModel: expect.any(String),
      openaiTtsResponseFormat: expect.any(String),
      parakeetNumThreads: expect.any(Number),
      mainAgentMode: expect.any(String),
      themePreference: expect.any(String),
      openaiReasoningEffort: expect.any(String),
      codexTextVerbosity: expect.any(String),
      remoteServerBindAddress: expect.any(String),
      remoteServerLogLevel: expect.any(String),
      cloudflareTunnelMode: expect.any(String),
      supertonicVoice: expect.any(String),
      supertonicLanguage: expect.any(String),
      supertonicSteps: expect.any(Number),
    });
  });

  it('resets Groq TTS voice to the model-specific shared default when changing model families', () => {
    const updates = buildSettingsUpdatePatch(
      { groqTtsModel: 'canopylabs/orpheus-arabic-saudi' },
      { groqTtsModel: 'canopylabs/orpheus-v1-english', groqTtsVoice: 'troy' },
      {
        providerSecretMask: '••••••••',
        remoteServerSecretMask: '••••••••',
        discordSecretMask: '••••••••',
      },
    );

    expect(updates).toMatchObject({
      groqTtsModel: 'canopylabs/orpheus-arabic-saudi',
      groqTtsVoice: 'fahad',
    });
  });

  it('builds masked settings responses with mobile-compatible defaults', () => {
    const response = buildSettingsResponse(
      {
        mcpToolsProviderId: 'groq',
        mcpToolsGroqModel: 'llama-3.3',
        openaiApiKey: 'sk-openai',
        groqBaseUrl: 'https://groq.example/v1',
        openaiReasoningEffort: 'high',
        codexTextVerbosity: 'low',
        themePreference: 'light',
        floatingPanelAutoShow: false,
        hidePanelWhenMainFocused: false,
        hideDockIcon: true,
        launchAtLogin: true,
        panelPosition: 'bottom-left',
        panelCustomPosition: { x: 40, y: 80 },
        panelDragEnabled: false,
        panelCustomSize: { width: 420, height: 128 },
        panelWaveformSize: { width: 360, height: 96 },
        panelTextInputSize: { width: 620, height: 240 },
        panelProgressSize: { width: 720, height: 360 },
        textInputEnabled: false,
        conversationsEnabled: false,
        maxConversationsToKeep: 250,
        autoSaveConversations: false,
        ttsLLMPreprocessingProviderId: 'gemini',
        openaiTtsResponseFormat: 'aac',
        currentModelPresetId: 'custom-1',
        modelPresets: [{
          id: 'custom-1',
          name: 'Custom',
          baseUrl: 'https://custom.example/v1',
          apiKey: 'sk-custom',
          isBuiltIn: false,
          createdAt: 1,
          updatedAt: 1,
        }],
        predefinedPrompts: [{
          id: 'prompt-1',
          name: 'Prompt',
          content: 'Use this',
          createdAt: 2,
          updatedAt: 3,
        }],
        pinnedSessionIds: ['conv-1', 42 as any],
        archivedSessionIds: [false as any, 'conv-2'],
        langfuseSecretKey: 'lf-secret',
        mcpAutoPasteEnabled: true,
        mcpAutoPasteDelay: 1500,
        mcpRuntimeDisabledServers: [' github ', '', 'filesystem', 'github'],
        mcpDisabledTools: ['github:create_issue', '', 'github:create_issue'],
      },
      {
        providerSecretMask: 'MASKED',
        remoteServerApiKey: 'REMOTE-MASK',
        discordBotToken: 'DISCORD-MASK',
        discordDefaultProfileId: 'agent-1',
        acpxAgents: [{ name: 'agent', displayName: 'Agent' }],
      },
    );

    expect(response).toMatchObject({
      agentProviderId: 'groq',
      agentGroqModel: 'llama-3.3',
      mcpToolsProviderId: 'groq',
      currentModelPresetId: 'custom-1',
      openaiApiKey: 'MASKED',
      groqBaseUrl: 'https://groq.example/v1',
      openaiReasoningEffort: 'high',
      codexTextVerbosity: 'low',
      themePreference: 'light',
      floatingPanelAutoShow: false,
      hidePanelWhenMainFocused: false,
      hideDockIcon: true,
      launchAtLogin: true,
      panelPosition: 'bottom-left',
      panelCustomPosition: { x: 40, y: 80 },
      panelDragEnabled: false,
      panelCustomSize: { width: 420, height: 128 },
      panelWaveformSize: { width: 360, height: 96 },
      panelTextInputSize: { width: 620, height: 240 },
      panelProgressSize: { width: 720, height: 360 },
      textInputEnabled: false,
      conversationsEnabled: false,
      maxConversationsToKeep: 250,
      autoSaveConversations: false,
      ttsLLMPreprocessingProviderId: 'gemini',
      openaiTtsModel: 'gpt-4o-mini-tts',
      openaiTtsVoice: 'alloy',
      openaiTtsSpeed: 1.0,
      openaiTtsResponseFormat: 'aac',
      groqTtsModel: 'canopylabs/orpheus-v1-english',
      groqTtsVoice: 'troy',
      geminiTtsModel: 'gemini-2.5-flash-preview-tts',
      geminiTtsVoice: 'Kore',
      edgeTtsModel: 'edge-tts',
      edgeTtsVoice: 'en-US-AriaNeural',
      edgeTtsRate: 1.0,
      kittenVoiceId: 0,
      supertonicVoice: 'M1',
      supertonicLanguage: 'en',
      supertonicSpeed: 1.05,
      supertonicSteps: 5,
      transcriptPostProcessingEnabled: true,
      whatsappEnabled: DEFAULT_WHATSAPP_ENABLED,
      whatsappAutoReply: DEFAULT_WHATSAPP_AUTO_REPLY,
      whatsappLogMessages: DEFAULT_WHATSAPP_LOG_MESSAGES,
      remoteServerApiKey: 'REMOTE-MASK',
      remoteServerPort: 3210,
      remoteServerBindAddress: '127.0.0.1',
      discordBotToken: 'DISCORD-MASK',
      discordDefaultProfileId: 'agent-1',
      discordDmEnabled: DEFAULT_DISCORD_DM_ENABLED,
      discordRequireMention: DEFAULT_DISCORD_REQUIRE_MENTION,
      discordLogMessages: DEFAULT_DISCORD_LOG_MESSAGES,
      langfuseEnabled: DEFAULT_LANGFUSE_ENABLED,
      langfuseSecretKey: 'MASKED',
      localTraceLoggingEnabled: DEFAULT_LOCAL_TRACE_LOGGING_ENABLED,
      acpxAgents: [{ name: 'agent', displayName: 'Agent' }],
      mcpAutoPasteEnabled: true,
      mcpAutoPasteDelay: 1500,
      mcpRuntimeDisabledServers: ['github', 'filesystem'],
      mcpDisabledTools: ['github:create_issue'],
      pinnedSessionIds: ['conv-1'],
      archivedSessionIds: ['conv-2'],
      predefinedPrompts: [{
        id: 'prompt-1',
        name: 'Prompt',
        content: 'Use this',
        createdAt: 2,
        updatedAt: 3,
      }],
    });
    expect(response.availablePresets).toContainEqual(expect.objectContaining({
      id: 'custom-1',
      apiKey: 'MASKED',
      hasApiKey: true,
    }));
  });

  it('builds settings update responses and sensitive audit contexts', () => {
    expect(buildSettingsUpdateResponse({
      remoteServerApiKey: 'secret',
      remoteServerPort: 3210,
    })).toEqual({
      success: true,
      updated: ['remoteServerApiKey', 'remoteServerPort'],
    });

    expect(buildSettingsSensitiveNoValidUpdateAuditContext(['remoteServerApiKey'])).toEqual({
      action: 'settings-sensitive-update',
      path: '/v1/settings',
      success: false,
      details: { attempted: ['remoteServerApiKey'] },
      failureReason: 'no-valid-settings-to-update',
    });

    expect(buildSettingsSensitiveUpdateAuditContext(
      ['remoteServerApiKey', 'discordBotToken'],
      {
        remoteServerLifecycleAction: 'restart',
        discordLifecycleAction: 'noop',
      },
    )).toEqual({
      action: 'settings-sensitive-update',
      path: '/v1/settings',
      success: true,
      details: {
        updated: ['remoteServerApiKey', 'discordBotToken'],
        remoteServerLifecycleAction: 'restart',
      },
    });

    expect(buildSettingsSensitiveUpdateFailureAuditContext(['discordBotToken'])).toEqual({
      action: 'settings-sensitive-update',
      path: '/v1/settings',
      success: false,
      details: { attempted: ['discordBotToken'] },
      failureReason: 'settings-update-error',
    });
  });

  it('runs shared settings actions through config and lifecycle adapters', async () => {
    let config: SettingsActionConfigLike = {
      remoteServerEnabled: false,
      remoteServerPort: 3210,
      discordEnabled: false,
      whatsappEnabled: false,
      hideDockIcon: false,
      launchAtLogin: false,
      mcpMaxIterations: 10,
      modelPresets: [],
    };
    const savedConfigs: SettingsActionConfigLike[] = [];
    const diagnosticsCalls: unknown[] = [];
    const lifecycleCalls: unknown[] = [];
    const options: SettingsActionOptions = {
      config: {
        get: () => config,
        save: async (nextConfig) => {
          config = nextConfig;
          savedConfigs.push(nextConfig);
        },
      },
      diagnostics: {
        logInfo: (source, message) => diagnosticsCalls.push({ level: 'info', source, message }),
        logError: (source, message, error) => diagnosticsCalls.push({ level: 'error', source, message, error }),
      },
      getMaskedRemoteServerApiKey: () => 'REMOTE-MASK',
      getMaskedDiscordBotToken: () => 'DISCORD-MASK',
      getDiscordDefaultProfileId: () => 'agent-1',
      getAcpxAgents: () => [{ name: 'agent', displayName: 'Agent' }],
      getDiscordLifecycleAction: (prev, next) => (!prev.discordEnabled && next.discordEnabled ? 'start' : 'noop'),
      applyDiscordLifecycleAction: async (action) => {
        lifecycleCalls.push({ type: 'discord', action });
      },
      applyWhatsappToggle: async (prevEnabled, nextEnabled) => {
        lifecycleCalls.push({
          type: 'whatsapp',
          prevEnabled,
          nextEnabled,
        });
      },
      applyDesktopShellSettings: async (prev, next) => {
        lifecycleCalls.push({
          type: 'desktop-shell',
          prevHideDock: prev.hideDockIcon,
          nextHideDock: next.hideDockIcon,
          prevLaunchAtLogin: prev.launchAtLogin,
          nextLaunchAtLogin: next.launchAtLogin,
        });
      },
    };

    expect(getSettingsAction('MASKED', options)).toMatchObject({
      statusCode: 200,
      body: {
        remoteServerApiKey: 'REMOTE-MASK',
        discordBotToken: 'DISCORD-MASK',
        discordDefaultProfileId: 'agent-1',
        acpxAgents: [{ name: 'agent', displayName: 'Agent' }],
      },
    });

    await expect(updateSettingsAction({
      remoteServerEnabled: true,
      discordEnabled: true,
      whatsappEnabled: true,
      hideDockIcon: true,
      launchAtLogin: true,
      mcpMaxIterations: 20,
    }, {
      providerSecretMask: 'MASKED',
      remoteServerSecretMask: 'REMOTE-MASK',
      discordSecretMask: 'DISCORD-MASK',
    }, options)).resolves.toMatchObject({
      statusCode: 200,
      body: {
        success: true,
        updated: ['whatsappEnabled', 'discordEnabled', 'mcpMaxIterations', 'hideDockIcon', 'launchAtLogin', 'remoteServerEnabled'],
      },
      remoteServerLifecycleAction: 'start',
      auditContext: {
        action: 'settings-sensitive-update',
        success: true,
        details: {
          updated: ['whatsappEnabled', 'discordEnabled', 'remoteServerEnabled'],
          remoteServerLifecycleAction: 'start',
          discordLifecycleAction: 'start',
        },
      },
    });
    expect(config).toMatchObject({
      remoteServerEnabled: true,
      discordEnabled: true,
      whatsappEnabled: true,
      hideDockIcon: true,
      launchAtLogin: true,
      mcpMaxIterations: 20,
    });
    expect(savedConfigs).toHaveLength(1);
    expect(diagnosticsCalls).toEqual([
      {
        level: 'info',
        source: 'settings-actions',
        message: 'Updated settings: whatsappEnabled, discordEnabled, mcpMaxIterations, hideDockIcon, launchAtLogin, remoteServerEnabled',
      },
    ]);
    expect(lifecycleCalls).toEqual([
      {
        type: 'desktop-shell',
        prevHideDock: false,
        nextHideDock: true,
        prevLaunchAtLogin: false,
        nextLaunchAtLogin: true,
      },
      { type: 'discord', action: 'start' },
      { type: 'whatsapp', prevEnabled: false, nextEnabled: true },
    ]);
  });

  it('returns shared settings action validation and failure audit responses', async () => {
    const options: SettingsActionOptions = {
      config: {
        get: () => ({
          remoteServerEnabled: false,
          modelPresets: [],
        }),
        save: async () => undefined,
      },
      diagnostics: {
        logInfo: () => {
          throw new Error('unexpected info log');
        },
        logError: () => {
          throw new Error('unexpected error log');
        },
      },
      getMaskedRemoteServerApiKey: () => '',
      getMaskedDiscordBotToken: () => '',
      getDiscordDefaultProfileId: () => '',
      getAcpxAgents: () => [],
      getDiscordLifecycleAction: () => 'noop',
      applyDiscordLifecycleAction: async () => undefined,
      applyWhatsappToggle: async () => undefined,
    };

    await expect(updateSettingsAction({
      remoteServerApiKey: 'REMOTE-MASK',
    }, {
      providerSecretMask: 'MASKED',
      remoteServerSecretMask: 'REMOTE-MASK',
      discordSecretMask: 'DISCORD-MASK',
    }, options)).resolves.toEqual({
      statusCode: 400,
      body: { error: 'No valid settings to update' },
      auditContext: buildSettingsSensitiveNoValidUpdateAuditContext(['remoteServerApiKey']),
    });

    const caughtFailure = new Error('config failed');
    const loggedErrors: unknown[] = [];
    const failingOptions: SettingsActionOptions = {
      ...options,
      config: {
        get: () => {
          throw caughtFailure;
        },
        save: async () => undefined,
      },
      diagnostics: {
        logInfo: () => undefined,
        logError: (source, message, error) => loggedErrors.push({ source, message, error }),
      },
    };

    await expect(updateSettingsAction({
      remoteServerApiKey: 'new-secret',
    }, {
      providerSecretMask: 'MASKED',
      remoteServerSecretMask: 'REMOTE-MASK',
      discordSecretMask: 'DISCORD-MASK',
    }, failingOptions)).resolves.toEqual({
      statusCode: 500,
      body: { error: 'config failed' },
      auditContext: buildSettingsSensitiveUpdateFailureAuditContext(['remoteServerApiKey']),
    });
    expect(loggedErrors).toEqual([
      {
        source: 'settings-actions',
        message: 'Failed to update settings',
        error: caughtFailure,
      },
    ]);
  });

  it('builds emergency stop responses for the recovery endpoint', () => {
    expect(buildEmergencyStopResponse(3, 1)).toEqual({
      success: true,
      message: 'Emergency stop executed',
      processesKilled: 3,
      processesRemaining: 1,
    });

    expect(buildEmergencyStopErrorResponse(new Error('stop failed'))).toEqual({
      success: false,
      error: 'stop failed',
    });

    expect(buildEmergencyStopErrorResponse(undefined)).toEqual({
      success: false,
      error: 'Emergency stop failed',
    });
  });

  it('runs shared emergency stop actions through adapters', async () => {
    const diagnosticsCalls: unknown[] = [];
    const loggerCalls: unknown[] = [];
    const result = await triggerEmergencyStopAction({
      stopAll: async () => ({ before: 3, after: 1 }),
      diagnostics: {
        logInfo: (source, message) => diagnosticsCalls.push({ level: 'info', source, message }),
        logError: (source, message, error) => diagnosticsCalls.push({ level: 'error', source, message, error }),
      },
      logger: {
        log: (message) => loggerCalls.push({ level: 'log', message }),
        error: (message, error) => loggerCalls.push({ level: 'error', message, error }),
      },
    });

    expect(result).toEqual({
      statusCode: 200,
      body: {
        success: true,
        message: 'Emergency stop executed',
        processesKilled: 3,
        processesRemaining: 1,
      },
    });
    expect(diagnosticsCalls).toEqual([
      {
        level: 'info',
        source: 'remote-server',
        message: 'Emergency stop triggered via API',
      },
      {
        level: 'info',
        source: 'remote-server',
        message: 'Emergency stop completed. Killed 3 processes. Remaining: 1',
      },
    ]);
    expect(loggerCalls).toEqual([
      { level: 'log', message: '[KILLSWITCH] /v1/emergency-stop endpoint called' },
      { level: 'log', message: '[KILLSWITCH] Loading emergency-stop module...' },
      { level: 'log', message: '[KILLSWITCH] Calling emergency stop handler...' },
      { level: 'log', message: '[KILLSWITCH] Emergency stop completed. Killed 3 processes. Remaining: 1' },
    ]);
  });

  it('logs shared emergency stop failures and returns the route error body', async () => {
    const error = new Error('stop failed');
    const diagnosticsCalls: unknown[] = [];
    const loggerCalls: unknown[] = [];
    const result = await triggerEmergencyStopAction({
      stopAll: async () => {
        throw error;
      },
      diagnostics: {
        logInfo: (source, message) => diagnosticsCalls.push({ level: 'info', source, message }),
        logError: (source, message, caughtError) => {
          diagnosticsCalls.push({ level: 'error', source, message, caughtError });
        },
      },
      logger: {
        log: (message) => loggerCalls.push({ level: 'log', message }),
        error: (message, caughtError) => loggerCalls.push({ level: 'error', message, caughtError }),
      },
    });

    expect(result).toEqual({
      statusCode: 500,
      body: {
        success: false,
        error: 'stop failed',
      },
    });
    expect(diagnosticsCalls).toEqual([
      {
        level: 'info',
        source: 'remote-server',
        message: 'Emergency stop triggered via API',
      },
      {
        level: 'error',
        source: 'remote-server',
        message: 'Emergency stop error',
        caughtError: error,
      },
    ]);
    expect(loggerCalls.at(-1)).toEqual({
      level: 'error',
      message: '[KILLSWITCH] Error during emergency stop:',
      caughtError: error,
    });
  });

  it('applies model preset settings updates consistently', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));

    const updates = buildSettingsUpdatePatch(
      {
        currentModelPresetId: 'custom-1',
        agentOpenaiModel: 'gpt-4.1-mini',
        transcriptPostProcessingOpenaiModel: 'gpt-4.1-mini-transcribe',
      },
      {
        currentModelPresetId: 'builtin-openai',
        openaiApiKey: 'sk-default',
        modelPresets: [{
          id: 'custom-1',
          name: 'Custom',
          baseUrl: 'https://custom.example/v1',
          apiKey: 'sk-custom',
          isBuiltIn: false,
          createdAt: 1,
          updatedAt: 1,
        }],
      },
      {
        providerSecretMask: '••••••••',
        remoteServerSecretMask: '••••••••',
        discordSecretMask: '••••••••',
      },
    );

    expect(updates).toMatchObject({
      currentModelPresetId: 'custom-1',
      openaiBaseUrl: 'https://custom.example/v1',
      openaiApiKey: 'sk-custom',
      agentOpenaiModel: 'gpt-4.1-mini',
      mcpToolsOpenaiModel: 'gpt-4.1-mini',
      transcriptPostProcessingOpenaiModel: 'gpt-4.1-mini-transcribe',
    });
    expect(updates.modelPresets).toEqual([{
      id: 'custom-1',
      name: 'Custom',
      baseUrl: 'https://custom.example/v1',
      apiKey: 'sk-custom',
      isBuiltIn: false,
      createdAt: 1,
      updatedAt: new Date('2026-01-01T00:00:00.000Z').getTime(),
      agentModel: 'gpt-4.1-mini',
      transcriptProcessingModel: 'gpt-4.1-mini-transcribe',
    }]);
  });

  it('exposes the active OpenAI-compatible models endpoint separately from provider model discovery', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({
        object: 'list',
        data: [{ id: 'gpt-4.1-mini', object: 'model', owned_by: 'system' }],
      }))
      .mockResolvedValueOnce(jsonResponse({
        providerId: 'openai',
        models: [{ id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini' }],
      }));
    vi.stubGlobal('fetch', fetchMock);

    const client = new SettingsApiClient('https://example.com/v1', 'secret-token');

    await client.getOpenAICompatibleModels();
    await client.getModels('openai');

    expect(fetchMock.mock.calls.map((call) => call[0])).toEqual([
      'https://example.com/v1/models',
      'https://example.com/v1/models/openai',
    ]);
  });

  it('exposes operator and extended endpoints from the shared client', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ count: 5, logs: [] }))
      .mockResolvedValueOnce(jsonResponse({ success: true, action: 'discord-clear-logs', message: 'cleared' }))
      .mockResolvedValueOnce(jsonResponse({ models: { parakeet: { downloaded: false, downloading: false, progress: 0 }, kitten: { downloaded: true, downloading: false, progress: 1 }, supertonic: { downloaded: false, downloading: true, progress: 0.5 } } }))
      .mockResolvedValueOnce(jsonResponse({ downloaded: true, downloading: false, progress: 1 }))
      .mockResolvedValueOnce(jsonResponse({ success: true, action: 'local-speech-model-download', message: 'Download started' }))
      .mockResolvedValueOnce(jsonResponse({ notes: [] }))
      .mockResolvedValueOnce(jsonResponse({ success: true, action: 'run-agent', conversationId: 'conv-1', content: 'Done', messageCount: 2 }));
    vi.stubGlobal('fetch', fetchMock);

    const client = new ExtendedSettingsApiClient('https://example.com', 'secret-token');

    await client.getOperatorDiscordLogs(5);
    await client.clearOperatorDiscordLogs();
    await client.getLocalSpeechModelStatuses();
    await client.getLocalSpeechModelStatus('kitten');
    await client.downloadLocalSpeechModel('supertonic');
    await client.getKnowledgeNotes();
    await client.runOperatorAgent({ prompt: 'check status', conversationId: 'conv-1' });

    expect(fetchMock.mock.calls.map((call) => [call[0], call[1]?.method, call[1]?.body])).toEqual([
      ['https://example.com/v1/operator/discord/logs?count=5', undefined, undefined],
      ['https://example.com/v1/operator/discord/logs/clear', 'POST', undefined],
      ['https://example.com/v1/operator/local-speech-models', undefined, undefined],
      ['https://example.com/v1/operator/local-speech-models/kitten', undefined, undefined],
      ['https://example.com/v1/operator/local-speech-models/supertonic/download', 'POST', undefined],
      ['https://example.com/v1/knowledge/notes', undefined, undefined],
      [
        'https://example.com/v1/operator/actions/run-agent',
        'POST',
        JSON.stringify({ prompt: 'check status', conversationId: 'conv-1' }),
      ],
    ]);
  });

  it('exposes model preset management endpoints from the shared client', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ currentModelPresetId: 'builtin-openai', presets: [] }))
      .mockResolvedValueOnce(jsonResponse({ success: true, currentModelPresetId: 'builtin-openai', presets: [], preset: { id: 'custom-1', name: 'Custom', baseUrl: 'https://example.com/v1', isBuiltIn: false } }))
      .mockResolvedValueOnce(jsonResponse({ success: true, currentModelPresetId: 'custom-1', presets: [], preset: { id: 'custom-1', name: 'Custom', baseUrl: 'https://example.com/v1', isBuiltIn: false } }))
      .mockResolvedValueOnce(jsonResponse({ success: true, currentModelPresetId: 'builtin-openai', presets: [], deletedPresetId: 'custom-1' }));
    vi.stubGlobal('fetch', fetchMock);

    const client = new ExtendedSettingsApiClient('https://example.com/v1', 'secret-token');

    await client.getModelPresets();
    await client.createModelPreset({ name: 'Custom', baseUrl: 'https://example.com/v1', apiKey: 'sk-test' });
    await client.updateModelPreset('custom-1', { agentModel: 'gpt-4.1-mini' });
    await client.deleteModelPreset('custom-1');

    expect(fetchMock.mock.calls.map((call) => [call[0], call[1]?.method, call[1]?.body])).toEqual([
      ['https://example.com/v1/operator/model-presets', undefined, undefined],
      [
        'https://example.com/v1/operator/model-presets',
        'POST',
        JSON.stringify({ name: 'Custom', baseUrl: 'https://example.com/v1', apiKey: 'sk-test' }),
      ],
      [
        'https://example.com/v1/operator/model-presets/custom-1',
        'PATCH',
        JSON.stringify({ agentModel: 'gpt-4.1-mini' }),
      ],
      ['https://example.com/v1/operator/model-presets/custom-1', 'DELETE', undefined],
    ]);
  });

  it('exposes push notification endpoints from the shared client', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ success: true, message: 'Token registered', tokenCount: 1 }))
      .mockResolvedValueOnce(jsonResponse({ success: true, message: 'Token unregistered', tokenCount: 0 }))
      .mockResolvedValueOnce(jsonResponse({ success: true }));
    vi.stubGlobal('fetch', fetchMock);

    const client = new ExtendedSettingsApiClient('https://example.com/v1', 'secret-token');

    await client.registerPushToken({ token: 'ExponentPushToken[abc]', type: 'expo', platform: 'ios' });
    await client.unregisterPushToken('ExponentPushToken[abc]');
    await client.clearPushBadge('ExponentPushToken[abc]');

    expect(fetchMock.mock.calls.map((call) => [call[0], call[1]?.method, call[1]?.body])).toEqual([
      [
        'https://example.com/v1/push/register',
        'POST',
        JSON.stringify({ token: 'ExponentPushToken[abc]', type: 'expo', platform: 'ios' }),
      ],
      [
        'https://example.com/v1/push/unregister',
        'POST',
        JSON.stringify({ token: 'ExponentPushToken[abc]' }),
      ],
      [
        'https://example.com/v1/push/clear-badge',
        'POST',
        JSON.stringify({ token: 'ExponentPushToken[abc]' }),
      ],
    ]);
  });

  it('covers every settings-manageable remote API route through shared client methods', async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(jsonResponse({})));
    vi.stubGlobal('fetch', fetchMock);

    const client = new ExtendedSettingsApiClient('https://example.com/v1', 'secret-token');
    const profileId = 'profile/id';
    const serverName = 'filesystem/local';
    const presetId = 'custom/preset';
    const conversationId = 'conv/id';
    const sessionId = 'session/id';
    const skillId = 'skill/id';
    const noteId = 'note/id';
    const agentProfileId = 'agent/id';
    const loopId = 'loop/id';

    const scenarios: Array<{
      route: { method: string; path: string };
      expectedPath: string;
      run: () => Promise<unknown>;
    }> = [
      { route: { method: 'GET', path: REMOTE_SERVER_API_PATHS.profiles }, expectedPath: REMOTE_SERVER_API_PATHS.profiles, run: () => client.getProfiles() },
      { route: { method: 'GET', path: REMOTE_SERVER_API_PATHS.currentProfile }, expectedPath: REMOTE_SERVER_API_PATHS.currentProfile, run: () => client.getCurrentProfile() },
      { route: { method: 'POST', path: REMOTE_SERVER_API_PATHS.currentProfile }, expectedPath: REMOTE_SERVER_API_PATHS.currentProfile, run: () => client.setCurrentProfile(profileId) },
      { route: { method: 'GET', path: REMOTE_SERVER_API_PATHS.profileExport }, expectedPath: REMOTE_SERVER_API_BUILDERS.profileExport(profileId), run: () => client.exportProfile(profileId) },
      { route: { method: 'POST', path: REMOTE_SERVER_API_PATHS.profileImport }, expectedPath: REMOTE_SERVER_API_PATHS.profileImport, run: () => client.importProfile('{}') },
      { route: { method: 'GET', path: REMOTE_SERVER_API_PATHS.bundleExportableItems }, expectedPath: REMOTE_SERVER_API_PATHS.bundleExportableItems, run: () => client.getBundleExportableItems() },
      { route: { method: 'POST', path: REMOTE_SERVER_API_PATHS.bundleExport }, expectedPath: REMOTE_SERVER_API_PATHS.bundleExport, run: () => client.exportBundle({ skillIds: ['skill-1'] }) },
      { route: { method: 'POST', path: REMOTE_SERVER_API_PATHS.bundleImportPreview }, expectedPath: REMOTE_SERVER_API_PATHS.bundleImportPreview, run: () => client.previewBundleImport({ bundleJson: '{}' }) },
      { route: { method: 'POST', path: REMOTE_SERVER_API_PATHS.bundleImport }, expectedPath: REMOTE_SERVER_API_PATHS.bundleImport, run: () => client.importBundle({ bundleJson: '{}', conflictStrategy: 'rename' }) },
      { route: { method: 'GET', path: REMOTE_SERVER_API_PATHS.mcpServers }, expectedPath: REMOTE_SERVER_API_PATHS.mcpServers, run: () => client.getMCPServers() },
      { route: { method: 'POST', path: REMOTE_SERVER_API_PATHS.mcpServerToggle }, expectedPath: REMOTE_SERVER_API_BUILDERS.mcpServerToggle(serverName), run: () => client.toggleMCPServer(serverName, true) },
      { route: { method: 'PUT', path: REMOTE_SERVER_API_PATHS.mcpConfigServer }, expectedPath: REMOTE_SERVER_API_BUILDERS.mcpConfigServer(serverName), run: () => client.upsertMCPServerConfig(serverName, { command: 'filesystem-mcp' }) },
      { route: { method: 'DELETE', path: REMOTE_SERVER_API_PATHS.mcpConfigServer }, expectedPath: REMOTE_SERVER_API_BUILDERS.mcpConfigServer(serverName), run: () => client.deleteMCPServerConfig(serverName) },
      { route: { method: 'POST', path: REMOTE_SERVER_API_PATHS.mcpConfigImport }, expectedPath: REMOTE_SERVER_API_PATHS.mcpConfigImport, run: () => client.importMCPServerConfigs({ mcpServers: { github: { command: 'github-mcp' } } }) },
      { route: { method: 'GET', path: REMOTE_SERVER_API_PATHS.mcpConfigExport }, expectedPath: REMOTE_SERVER_API_PATHS.mcpConfigExport, run: () => client.exportMCPServerConfigs() },
      { route: { method: 'GET', path: REMOTE_SERVER_API_PATHS.settings }, expectedPath: REMOTE_SERVER_API_PATHS.settings, run: () => client.getSettings() },
      { route: { method: 'PATCH', path: REMOTE_SERVER_API_PATHS.settings }, expectedPath: REMOTE_SERVER_API_PATHS.settings, run: () => client.updateSettings({ mcpMaxIterations: 20 }) },
      { route: { method: 'GET', path: REMOTE_SERVER_API_PATHS.agentSessionCandidates }, expectedPath: buildRemoteServerApiQueryPath(REMOTE_SERVER_API_PATHS.agentSessionCandidates, { limit: 20 }), run: () => client.getAgentSessionCandidates(20) },
      { route: { method: 'GET', path: REMOTE_SERVER_API_PATHS.models }, expectedPath: REMOTE_SERVER_API_PATHS.models, run: () => client.getOpenAICompatibleModels() },
      { route: { method: 'GET', path: REMOTE_SERVER_API_PATHS.modelsByProvider }, expectedPath: REMOTE_SERVER_API_BUILDERS.modelsByProvider('openai'), run: () => client.getModels('openai') },
      { route: { method: 'GET', path: REMOTE_SERVER_API_PATHS.operatorModelPresets }, expectedPath: REMOTE_SERVER_API_PATHS.operatorModelPresets, run: () => client.getModelPresets() },
      { route: { method: 'POST', path: REMOTE_SERVER_API_PATHS.operatorModelPresets }, expectedPath: REMOTE_SERVER_API_PATHS.operatorModelPresets, run: () => client.createModelPreset({ name: 'Custom', baseUrl: 'https://example.com/v1', apiKey: 'sk-test' }) },
      { route: { method: 'PATCH', path: REMOTE_SERVER_API_PATHS.operatorModelPreset }, expectedPath: REMOTE_SERVER_API_BUILDERS.operatorModelPreset(presetId), run: () => client.updateModelPreset(presetId, { agentModel: 'gpt-4.1-mini' }) },
      { route: { method: 'DELETE', path: REMOTE_SERVER_API_PATHS.operatorModelPreset }, expectedPath: REMOTE_SERVER_API_BUILDERS.operatorModelPreset(presetId), run: () => client.deleteModelPreset(presetId) },
      { route: { method: 'GET', path: REMOTE_SERVER_API_PATHS.operatorStatus }, expectedPath: REMOTE_SERVER_API_PATHS.operatorStatus, run: () => client.getOperatorStatus() },
      { route: { method: 'GET', path: REMOTE_SERVER_API_PATHS.operatorHealth }, expectedPath: REMOTE_SERVER_API_PATHS.operatorHealth, run: () => client.getOperatorHealth() },
      { route: { method: 'GET', path: REMOTE_SERVER_API_PATHS.operatorErrors }, expectedPath: REMOTE_SERVER_API_BUILDERS.operatorErrors(3), run: () => client.getOperatorErrors(3) },
      { route: { method: 'GET', path: REMOTE_SERVER_API_PATHS.operatorLogs }, expectedPath: REMOTE_SERVER_API_BUILDERS.operatorLogs(4, 'warning'), run: () => client.getOperatorLogs(4, 'warning') },
      { route: { method: 'GET', path: REMOTE_SERVER_API_PATHS.operatorAudit }, expectedPath: REMOTE_SERVER_API_BUILDERS.operatorAudit(5), run: () => client.getOperatorAudit(5) },
      { route: { method: 'GET', path: REMOTE_SERVER_API_PATHS.operatorMcp }, expectedPath: REMOTE_SERVER_API_PATHS.operatorMcp, run: () => client.getOperatorMCP() },
      { route: { method: 'POST', path: REMOTE_SERVER_API_PATHS.operatorMcpServerTest }, expectedPath: REMOTE_SERVER_API_BUILDERS.operatorMcpServerTest(serverName), run: () => client.testOperatorMCPServer(serverName) },
      { route: { method: 'GET', path: REMOTE_SERVER_API_PATHS.operatorMcpTools }, expectedPath: REMOTE_SERVER_API_BUILDERS.operatorMcpTools(serverName), run: () => client.getOperatorMCPTools(serverName) },
      { route: { method: 'POST', path: REMOTE_SERVER_API_PATHS.operatorMcpToolToggle }, expectedPath: REMOTE_SERVER_API_BUILDERS.operatorMcpToolToggle(`${serverName}:read`), run: () => client.setOperatorMCPToolEnabled(`${serverName}:read`, false) },
      { route: { method: 'GET', path: REMOTE_SERVER_API_PATHS.operatorMcpServerLogs }, expectedPath: REMOTE_SERVER_API_BUILDERS.operatorMcpServerLogs(serverName, 8), run: () => client.getOperatorMCPServerLogs(serverName, 8) },
      { route: { method: 'POST', path: REMOTE_SERVER_API_PATHS.operatorMcpServerLogsClear }, expectedPath: REMOTE_SERVER_API_BUILDERS.operatorMcpServerLogsClear(serverName), run: () => client.clearOperatorMCPServerLogs(serverName) },
      { route: { method: 'POST', path: REMOTE_SERVER_API_PATHS.operatorMcpStart }, expectedPath: REMOTE_SERVER_API_PATHS.operatorMcpStart, run: () => client.startMCPServer(serverName) },
      { route: { method: 'POST', path: REMOTE_SERVER_API_PATHS.operatorMcpStop }, expectedPath: REMOTE_SERVER_API_PATHS.operatorMcpStop, run: () => client.stopMCPServer(serverName) },
      { route: { method: 'POST', path: REMOTE_SERVER_API_PATHS.operatorMcpRestart }, expectedPath: REMOTE_SERVER_API_PATHS.operatorMcpRestart, run: () => client.restartMCPServer(serverName) },
      { route: { method: 'GET', path: REMOTE_SERVER_API_PATHS.operatorConversations }, expectedPath: REMOTE_SERVER_API_BUILDERS.operatorConversations(6), run: () => client.getOperatorConversations(6) },
      { route: { method: 'POST', path: REMOTE_SERVER_API_PATHS.operatorAgentSessionStop }, expectedPath: REMOTE_SERVER_API_BUILDERS.operatorAgentSessionStop(sessionId), run: () => client.stopOperatorAgentSession(sessionId) },
      { route: { method: 'GET', path: REMOTE_SERVER_API_PATHS.operatorMessageQueues }, expectedPath: REMOTE_SERVER_API_PATHS.operatorMessageQueues, run: () => client.getOperatorMessageQueues() },
      { route: { method: 'POST', path: REMOTE_SERVER_API_PATHS.operatorMessageQueueClear }, expectedPath: REMOTE_SERVER_API_BUILDERS.operatorMessageQueueClear(conversationId), run: () => client.clearOperatorMessageQueue(conversationId) },
      { route: { method: 'POST', path: REMOTE_SERVER_API_PATHS.operatorMessageQueuePause }, expectedPath: REMOTE_SERVER_API_BUILDERS.operatorMessageQueuePause(conversationId), run: () => client.pauseOperatorMessageQueue(conversationId) },
      { route: { method: 'POST', path: REMOTE_SERVER_API_PATHS.operatorMessageQueueResume }, expectedPath: REMOTE_SERVER_API_BUILDERS.operatorMessageQueueResume(conversationId), run: () => client.resumeOperatorMessageQueue(conversationId) },
      { route: { method: 'DELETE', path: REMOTE_SERVER_API_PATHS.operatorMessageQueueMessage }, expectedPath: REMOTE_SERVER_API_BUILDERS.operatorMessageQueueMessage(conversationId, 'msg-1'), run: () => client.removeOperatorQueuedMessage(conversationId, 'msg-1') },
      { route: { method: 'POST', path: REMOTE_SERVER_API_PATHS.operatorMessageQueueMessageRetry }, expectedPath: REMOTE_SERVER_API_BUILDERS.operatorMessageQueueMessageRetry(conversationId, 'msg-1'), run: () => client.retryOperatorQueuedMessage(conversationId, 'msg-1') },
      { route: { method: 'PATCH', path: REMOTE_SERVER_API_PATHS.operatorMessageQueueMessage }, expectedPath: REMOTE_SERVER_API_BUILDERS.operatorMessageQueueMessage(conversationId, 'msg-1'), run: () => client.updateOperatorQueuedMessageText(conversationId, 'msg-1', 'updated queued text') },
      { route: { method: 'GET', path: REMOTE_SERVER_API_PATHS.operatorRemoteServer }, expectedPath: REMOTE_SERVER_API_PATHS.operatorRemoteServer, run: () => client.getOperatorRemoteServer() },
      { route: { method: 'GET', path: REMOTE_SERVER_API_PATHS.operatorTunnel }, expectedPath: REMOTE_SERVER_API_PATHS.operatorTunnel, run: () => client.getOperatorTunnel() },
      { route: { method: 'GET', path: REMOTE_SERVER_API_PATHS.operatorTunnelSetup }, expectedPath: REMOTE_SERVER_API_PATHS.operatorTunnelSetup, run: () => client.getOperatorTunnelSetup() },
      { route: { method: 'POST', path: REMOTE_SERVER_API_PATHS.operatorTunnelStart }, expectedPath: REMOTE_SERVER_API_PATHS.operatorTunnelStart, run: () => client.startOperatorTunnel() },
      { route: { method: 'POST', path: REMOTE_SERVER_API_PATHS.operatorTunnelStop }, expectedPath: REMOTE_SERVER_API_PATHS.operatorTunnelStop, run: () => client.stopOperatorTunnel() },
      { route: { method: 'GET', path: REMOTE_SERVER_API_PATHS.operatorIntegrations }, expectedPath: REMOTE_SERVER_API_PATHS.operatorIntegrations, run: () => client.getOperatorIntegrations() },
      { route: { method: 'GET', path: REMOTE_SERVER_API_PATHS.operatorUpdater }, expectedPath: REMOTE_SERVER_API_PATHS.operatorUpdater, run: () => client.getOperatorUpdater() },
      { route: { method: 'POST', path: REMOTE_SERVER_API_PATHS.operatorUpdaterCheck }, expectedPath: REMOTE_SERVER_API_PATHS.operatorUpdaterCheck, run: () => client.checkOperatorUpdater() },
      { route: { method: 'POST', path: REMOTE_SERVER_API_PATHS.operatorUpdaterDownloadLatest }, expectedPath: REMOTE_SERVER_API_PATHS.operatorUpdaterDownloadLatest, run: () => client.downloadOperatorUpdateAsset() },
      { route: { method: 'POST', path: REMOTE_SERVER_API_PATHS.operatorUpdaterRevealDownload }, expectedPath: REMOTE_SERVER_API_PATHS.operatorUpdaterRevealDownload, run: () => client.revealOperatorUpdateAsset() },
      { route: { method: 'POST', path: REMOTE_SERVER_API_PATHS.operatorUpdaterOpenDownload }, expectedPath: REMOTE_SERVER_API_PATHS.operatorUpdaterOpenDownload, run: () => client.openOperatorUpdateAsset() },
      { route: { method: 'POST', path: REMOTE_SERVER_API_PATHS.operatorUpdaterOpenReleases }, expectedPath: REMOTE_SERVER_API_PATHS.operatorUpdaterOpenReleases, run: () => client.openOperatorReleasesPage() },
      { route: { method: 'GET', path: REMOTE_SERVER_API_PATHS.operatorDiscord }, expectedPath: REMOTE_SERVER_API_PATHS.operatorDiscord, run: () => client.getOperatorDiscord() },
      { route: { method: 'GET', path: REMOTE_SERVER_API_PATHS.operatorDiscordLogs }, expectedPath: REMOTE_SERVER_API_BUILDERS.operatorDiscordLogs(7), run: () => client.getOperatorDiscordLogs(7) },
      { route: { method: 'POST', path: REMOTE_SERVER_API_PATHS.operatorDiscordConnect }, expectedPath: REMOTE_SERVER_API_PATHS.operatorDiscordConnect, run: () => client.connectOperatorDiscord() },
      { route: { method: 'POST', path: REMOTE_SERVER_API_PATHS.operatorDiscordDisconnect }, expectedPath: REMOTE_SERVER_API_PATHS.operatorDiscordDisconnect, run: () => client.disconnectOperatorDiscord() },
      { route: { method: 'POST', path: REMOTE_SERVER_API_PATHS.operatorDiscordClearLogs }, expectedPath: REMOTE_SERVER_API_PATHS.operatorDiscordClearLogs, run: () => client.clearOperatorDiscordLogs() },
      { route: { method: 'GET', path: REMOTE_SERVER_API_PATHS.operatorWhatsApp }, expectedPath: REMOTE_SERVER_API_PATHS.operatorWhatsApp, run: () => client.getOperatorWhatsApp() },
      { route: { method: 'POST', path: REMOTE_SERVER_API_PATHS.operatorWhatsAppConnect }, expectedPath: REMOTE_SERVER_API_PATHS.operatorWhatsAppConnect, run: () => client.connectOperatorWhatsApp() },
      { route: { method: 'POST', path: REMOTE_SERVER_API_PATHS.operatorWhatsAppLogout }, expectedPath: REMOTE_SERVER_API_PATHS.operatorWhatsAppLogout, run: () => client.logoutOperatorWhatsApp() },
      { route: { method: 'GET', path: REMOTE_SERVER_API_PATHS.operatorLocalSpeechModels }, expectedPath: REMOTE_SERVER_API_PATHS.operatorLocalSpeechModels, run: () => client.getLocalSpeechModelStatuses() },
      { route: { method: 'GET', path: REMOTE_SERVER_API_PATHS.operatorLocalSpeechModel }, expectedPath: REMOTE_SERVER_API_BUILDERS.operatorLocalSpeechModel('kitten'), run: () => client.getLocalSpeechModelStatus('kitten') },
      { route: { method: 'POST', path: REMOTE_SERVER_API_PATHS.operatorLocalSpeechModelDownload }, expectedPath: REMOTE_SERVER_API_BUILDERS.operatorLocalSpeechModelDownload('supertonic'), run: () => client.downloadLocalSpeechModel('supertonic') },
      { route: { method: 'POST', path: REMOTE_SERVER_API_PATHS.emergencyStop }, expectedPath: REMOTE_SERVER_API_PATHS.emergencyStop, run: () => client.emergencyStop() },
      { route: { method: 'POST', path: REMOTE_SERVER_API_PATHS.operatorRestartRemoteServer }, expectedPath: REMOTE_SERVER_API_PATHS.operatorRestartRemoteServer, run: () => client.restartRemoteServer() },
      { route: { method: 'POST', path: REMOTE_SERVER_API_PATHS.operatorRestartApp }, expectedPath: REMOTE_SERVER_API_PATHS.operatorRestartApp, run: () => client.restartApp() },
      { route: { method: 'POST', path: REMOTE_SERVER_API_PATHS.operatorRunAgent }, expectedPath: REMOTE_SERVER_API_PATHS.operatorRunAgent, run: () => client.runOperatorAgent({ prompt: 'check status', conversationId }) },
      { route: { method: 'POST', path: REMOTE_SERVER_API_PATHS.operatorRotateApiKey }, expectedPath: REMOTE_SERVER_API_PATHS.operatorRotateApiKey, run: () => client.rotateOperatorApiKey() },
      { route: { method: 'GET', path: REMOTE_SERVER_API_PATHS.conversations }, expectedPath: REMOTE_SERVER_API_PATHS.conversations, run: () => client.getConversations() },
      { route: { method: 'GET', path: REMOTE_SERVER_API_PATHS.conversation }, expectedPath: REMOTE_SERVER_API_BUILDERS.conversation(conversationId), run: () => client.getConversation(conversationId) },
      { route: { method: 'POST', path: REMOTE_SERVER_API_PATHS.conversations }, expectedPath: REMOTE_SERVER_API_PATHS.conversations, run: () => client.createConversation({ title: 'New', messages: [] }) },
      { route: { method: 'PUT', path: REMOTE_SERVER_API_PATHS.conversation }, expectedPath: REMOTE_SERVER_API_BUILDERS.conversation(conversationId), run: () => client.updateConversation(conversationId, { title: 'Updated' }) },
      { route: { method: 'POST', path: REMOTE_SERVER_API_PATHS.pushRegister }, expectedPath: REMOTE_SERVER_API_PATHS.pushRegister, run: () => client.registerPushToken({ token: 'ExponentPushToken[abc]', type: 'expo', platform: 'ios' }) },
      { route: { method: 'POST', path: REMOTE_SERVER_API_PATHS.pushUnregister }, expectedPath: REMOTE_SERVER_API_PATHS.pushUnregister, run: () => client.unregisterPushToken('ExponentPushToken[abc]') },
      { route: { method: 'GET', path: REMOTE_SERVER_API_PATHS.pushStatus }, expectedPath: REMOTE_SERVER_API_PATHS.pushStatus, run: () => client.getPushStatus() },
      { route: { method: 'POST', path: REMOTE_SERVER_API_PATHS.pushClearBadge }, expectedPath: REMOTE_SERVER_API_PATHS.pushClearBadge, run: () => client.clearPushBadge('ExponentPushToken[abc]') },
      { route: { method: 'POST', path: REMOTE_SERVER_API_PATHS.ttsSpeak }, expectedPath: REMOTE_SERVER_API_PATHS.ttsSpeak, run: () => client.synthesizeSpeech({ text: 'Hello', providerId: 'edge' }) },
      { route: { method: 'GET', path: REMOTE_SERVER_API_PATHS.skills }, expectedPath: REMOTE_SERVER_API_PATHS.skills, run: () => client.getSkills() },
      { route: { method: 'GET', path: REMOTE_SERVER_API_PATHS.skill }, expectedPath: REMOTE_SERVER_API_BUILDERS.skill(skillId), run: () => client.getSkill(skillId) },
      { route: { method: 'POST', path: REMOTE_SERVER_API_PATHS.skills }, expectedPath: REMOTE_SERVER_API_PATHS.skills, run: () => client.createSkill({ name: 'Skill', description: 'Do work', instructions: 'Follow steps' }) },
      { route: { method: 'POST', path: REMOTE_SERVER_API_PATHS.skillImportMarkdown }, expectedPath: REMOTE_SERVER_API_PATHS.skillImportMarkdown, run: () => client.importSkillFromMarkdown('---\nname: Skill\n---\nFollow steps') },
      { route: { method: 'POST', path: REMOTE_SERVER_API_PATHS.skillImportGitHub }, expectedPath: REMOTE_SERVER_API_PATHS.skillImportGitHub, run: () => client.importSkillFromGitHub('owner/repo') },
      { route: { method: 'GET', path: REMOTE_SERVER_API_PATHS.skillExportMarkdown }, expectedPath: REMOTE_SERVER_API_BUILDERS.skillExportMarkdown(skillId), run: () => client.exportSkillToMarkdown(skillId) },
      { route: { method: 'PATCH', path: REMOTE_SERVER_API_PATHS.skill }, expectedPath: REMOTE_SERVER_API_BUILDERS.skill(skillId), run: () => client.updateSkill(skillId, { description: 'Updated' }) },
      { route: { method: 'DELETE', path: REMOTE_SERVER_API_PATHS.skill }, expectedPath: REMOTE_SERVER_API_BUILDERS.skill(skillId), run: () => client.deleteSkill(skillId) },
      { route: { method: 'POST', path: REMOTE_SERVER_API_PATHS.skillToggleProfile }, expectedPath: REMOTE_SERVER_API_BUILDERS.skillToggleProfile(skillId), run: () => client.toggleSkillForProfile(skillId) },
      {
        route: { method: 'GET', path: REMOTE_SERVER_API_PATHS.knowledgeNotes },
        expectedPath: buildRemoteServerApiQueryPath(REMOTE_SERVER_API_PATHS.knowledgeNotes, {
          context: 'auto',
          dateFilter: '30d',
          sort: 'updated-desc',
          limit: 100,
        }),
        run: () => client.getKnowledgeNotes({
          context: 'auto',
          dateFilter: '30d',
          sort: 'updated-desc',
          limit: 100,
        }),
      },
      { route: { method: 'GET', path: REMOTE_SERVER_API_PATHS.knowledgeNote }, expectedPath: REMOTE_SERVER_API_BUILDERS.knowledgeNote(noteId), run: () => client.getKnowledgeNote(noteId) },
      { route: { method: 'POST', path: REMOTE_SERVER_API_PATHS.knowledgeNotesSearch }, expectedPath: REMOTE_SERVER_API_PATHS.knowledgeNotesSearch, run: () => client.searchKnowledgeNotes({ query: 'project', limit: 100 }) },
      { route: { method: 'POST', path: REMOTE_SERVER_API_PATHS.knowledgeNotes }, expectedPath: REMOTE_SERVER_API_PATHS.knowledgeNotes, run: () => client.createKnowledgeNote({ title: 'Note', body: 'Body' }) },
      { route: { method: 'PATCH', path: REMOTE_SERVER_API_PATHS.knowledgeNote }, expectedPath: REMOTE_SERVER_API_BUILDERS.knowledgeNote(noteId), run: () => client.updateKnowledgeNote(noteId, { title: 'Updated' }) },
      { route: { method: 'DELETE', path: REMOTE_SERVER_API_PATHS.knowledgeNote }, expectedPath: REMOTE_SERVER_API_BUILDERS.knowledgeNote(noteId), run: () => client.deleteKnowledgeNote(noteId) },
      { route: { method: 'POST', path: REMOTE_SERVER_API_PATHS.knowledgeNotesDeleteMultiple }, expectedPath: REMOTE_SERVER_API_PATHS.knowledgeNotesDeleteMultiple, run: () => client.deleteKnowledgeNotes([noteId]) },
      { route: { method: 'POST', path: REMOTE_SERVER_API_PATHS.knowledgeNotesDeleteAll }, expectedPath: REMOTE_SERVER_API_PATHS.knowledgeNotesDeleteAll, run: () => client.deleteAllKnowledgeNotes() },
      { route: { method: 'GET', path: REMOTE_SERVER_API_PATHS.agentProfiles }, expectedPath: REMOTE_SERVER_API_PATHS.agentProfiles, run: () => client.getAgentProfiles() },
      { route: { method: 'POST', path: REMOTE_SERVER_API_PATHS.agentProfileVerifyCommand }, expectedPath: REMOTE_SERVER_API_PATHS.agentProfileVerifyCommand, run: () => client.verifyExternalAgentCommand({ command: 'codex-acp', args: [], probeArgs: ['--help'] }) },
      { route: { method: 'POST', path: REMOTE_SERVER_API_PATHS.agentProfilesReload }, expectedPath: REMOTE_SERVER_API_PATHS.agentProfilesReload, run: () => client.reloadAgentProfiles() },
      { route: { method: 'GET', path: REMOTE_SERVER_API_PATHS.agentProfile }, expectedPath: REMOTE_SERVER_API_BUILDERS.agentProfile(agentProfileId), run: () => client.getAgentProfile(agentProfileId) },
      { route: { method: 'POST', path: REMOTE_SERVER_API_PATHS.agentProfiles }, expectedPath: REMOTE_SERVER_API_PATHS.agentProfiles, run: () => client.createAgentProfile({ displayName: 'Agent', connectionType: 'internal' }) },
      { route: { method: 'PATCH', path: REMOTE_SERVER_API_PATHS.agentProfile }, expectedPath: REMOTE_SERVER_API_BUILDERS.agentProfile(agentProfileId), run: () => client.updateAgentProfile(agentProfileId, { displayName: 'Updated' }) },
      { route: { method: 'DELETE', path: REMOTE_SERVER_API_PATHS.agentProfile }, expectedPath: REMOTE_SERVER_API_BUILDERS.agentProfile(agentProfileId), run: () => client.deleteAgentProfile(agentProfileId) },
      { route: { method: 'POST', path: REMOTE_SERVER_API_PATHS.agentProfileToggle }, expectedPath: REMOTE_SERVER_API_BUILDERS.agentProfileToggle(agentProfileId), run: () => client.toggleAgentProfile(agentProfileId) },
      { route: { method: 'GET', path: REMOTE_SERVER_API_PATHS.loops }, expectedPath: REMOTE_SERVER_API_PATHS.loops, run: () => client.getLoops() },
      { route: { method: 'POST', path: REMOTE_SERVER_API_PATHS.loops }, expectedPath: REMOTE_SERVER_API_PATHS.loops, run: () => client.createLoop({ name: 'Loop', prompt: 'Run', intervalMinutes: 60, enabled: true }) },
      { route: { method: 'POST', path: REMOTE_SERVER_API_PATHS.loopImportMarkdown }, expectedPath: REMOTE_SERVER_API_PATHS.loopImportMarkdown, run: () => client.importLoopFromMarkdown('---\nkind: task\nname: Loop\n---\nRun') },
      { route: { method: 'GET', path: REMOTE_SERVER_API_PATHS.loopExportMarkdown }, expectedPath: REMOTE_SERVER_API_BUILDERS.loopExportMarkdown(loopId), run: () => client.exportLoopToMarkdown(loopId) },
      { route: { method: 'PATCH', path: REMOTE_SERVER_API_PATHS.loop }, expectedPath: REMOTE_SERVER_API_BUILDERS.loop(loopId), run: () => client.updateLoop(loopId, { name: 'Updated' }) },
      { route: { method: 'DELETE', path: REMOTE_SERVER_API_PATHS.loop }, expectedPath: REMOTE_SERVER_API_BUILDERS.loop(loopId), run: () => client.deleteLoop(loopId) },
      { route: { method: 'GET', path: REMOTE_SERVER_API_PATHS.loopStatuses }, expectedPath: REMOTE_SERVER_API_PATHS.loopStatuses, run: () => client.getLoopStatuses() },
      { route: { method: 'POST', path: REMOTE_SERVER_API_PATHS.loopStart }, expectedPath: REMOTE_SERVER_API_BUILDERS.loopStart(loopId), run: () => client.startLoop(loopId) },
      { route: { method: 'POST', path: REMOTE_SERVER_API_PATHS.loopStop }, expectedPath: REMOTE_SERVER_API_BUILDERS.loopStop(loopId), run: () => client.stopLoop(loopId) },
      { route: { method: 'POST', path: REMOTE_SERVER_API_PATHS.loopToggle }, expectedPath: REMOTE_SERVER_API_BUILDERS.loopToggle(loopId), run: () => client.toggleLoop(loopId) },
      { route: { method: 'POST', path: REMOTE_SERVER_API_PATHS.loopRun }, expectedPath: REMOTE_SERVER_API_BUILDERS.loopRun(loopId), run: () => client.runLoop(loopId) },
    ];

    for (const scenario of scenarios) {
      await scenario.run();
    }

    const excludedRoutes = new Set([
      getRemoteServerApiRouteKey({ method: 'POST', path: REMOTE_SERVER_API_PATHS.chatCompletions }),
      getRemoteServerApiRouteKey({ method: 'GET', path: REMOTE_SERVER_API_PATHS.conversationVideoAsset }),
    ]);
    const expectedRouteKeys = REMOTE_SERVER_API_ROUTES
      .map(getRemoteServerApiRouteKey)
      .filter((key) => !excludedRoutes.has(key));
    const scenarioRouteKeys = scenarios.map((scenario) => getRemoteServerApiRouteKey(scenario.route));

    expect([...new Set(scenarioRouteKeys)].sort()).toEqual([...new Set(expectedRouteKeys)].sort());
    expect(fetchMock).toHaveBeenCalledTimes(scenarios.length);
    expect(fetchMock.mock.calls.map((call) => [call[1]?.method ?? 'GET', requestPath(call[0])])).toEqual(
      scenarios.map((scenario) => [scenario.route.method, getRemoteServerApiRoutePath(scenario.expectedPath)]),
    );
  });

  it('returns raw audio bytes from the shared TTS endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(new Uint8Array([1, 2, 3]), {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'X-TTS-Provider': 'edge',
      },
    }));
    vi.stubGlobal('fetch', fetchMock);

    const client = new ExtendedSettingsApiClient('https://example.com/v1', 'secret-token');

    const result = await client.synthesizeSpeech({
      text: 'Hello',
      providerId: 'edge',
      voice: 'en-US-AriaNeural',
      speed: 1.2,
    });

    expect(new Uint8Array(result.audio)).toEqual(new Uint8Array([1, 2, 3]));
    expect(result.mimeType).toBe('audio/mpeg');
    expect(result.provider).toBe('edge');
    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://example.com/v1/tts/speak');
    expect(fetchMock.mock.calls[0]?.[1]?.method).toBe('POST');
    expect(fetchMock.mock.calls[0]?.[1]?.body).toBe(JSON.stringify({
      text: 'Hello',
      providerId: 'edge',
      voice: 'en-US-AriaNeural',
      speed: 1.2,
    }));

    const headers = new Headers(fetchMock.mock.calls[0]?.[1]?.headers);
    expect(headers.get('Accept')).toBe('audio/*');
    expect(headers.get('Content-Type')).toBe('application/json');
    expect(headers.get('Authorization')).toBe('Bearer secret-token');
  });

  it('throws the server error message for non-OK responses', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ error: 'No access' }, 403));
    vi.stubGlobal('fetch', fetchMock);

    const client = new SettingsApiClient('https://example.com', 'secret-token');

    await expect(client.getSettings()).rejects.toThrow('No access');
  });
});
