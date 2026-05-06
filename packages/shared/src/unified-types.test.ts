import { describe, it, expect } from 'vitest'
import type { ModelPreset } from './providers'
import type { StreamerModeConfig } from './remote-pairing'
import type { QueuedMessage, MessageQueue, RecordingHistoryItem } from './types'
import type { DiscordIntegrationSettingsConfig } from './discord-config'
import type { WhatsAppIntegrationConfig } from './whatsapp-config'
import type {
  KnowledgeNoteCreateRequest,
  KnowledgeNoteResponse,
  KnowledgeNoteUpdateRequest,
  LoopCreateRequest,
  LoopUpdateRequest,
  EnhancedModelInfo,
  ModelInfo,
  ModelMatchResult,
  ModelsDevData,
  ModelsDevModel,
  AgentExecutionConfig,
  AgentModelSelectionConfig,
  ChatGptWebAuthConfig,
  ChatProviderCredentialsConfig,
  PredefinedPrompt,
  PredefinedPromptsConfig,
  SpeechToTextConfig,
  TextToSpeechConfig,
  TranscriptPostProcessingConfig,
  EmergencyStopResponse,
  OperatorDiscordLogsResponse,
  OperatorTunnelSetupSummary,
  SettingsUpdate,
} from './api-types'
import { RESPOND_TO_USER_TOOL } from './chat-utils'

/**
 * Type-level and runtime tests for unified types that serve as the single
 * source of truth across desktop, mobile, and shared packages.
 */

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Compile-time assertion that T is assignable. */
function assertType<T>(_value: T): void {
  // intentionally empty — compile-time check only
}

// ── ModelPreset ──────────────────────────────────────────────────────────────

describe('ModelPreset', () => {
  it('accepts a minimal preset (shared/mobile shape — no apiKey)', () => {
    const preset: ModelPreset = {
      id: 'builtin-openai',
      name: 'OpenAI',
      baseUrl: 'https://api.openai.com/v1',
    }
    assertType<ModelPreset>(preset)
    expect(preset.id).toBe('builtin-openai')
    expect(preset.apiKey).toBeUndefined()
  })

  it('accepts a preset with apiKey (desktop shape)', () => {
    const preset: ModelPreset = {
      id: 'builtin-openai',
      name: 'OpenAI',
      baseUrl: 'https://api.openai.com/v1',
      apiKey: 'sk-test-key',
      isBuiltIn: true,
    }
    assertType<ModelPreset>(preset)
    expect(preset.apiKey).toBe('sk-test-key')
  })

  it('accepts all desktop-specific fields as optional', () => {
    const preset: ModelPreset = {
      id: 'custom-1',
      name: 'Custom Provider',
      baseUrl: 'https://custom.api.com/v1',
      apiKey: 'key-123',
      isBuiltIn: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      mcpToolsModel: 'gpt-4o',
      transcriptProcessingModel: 'gpt-4o-mini',
    }
    assertType<ModelPreset>(preset)
    expect(preset.mcpToolsModel).toBe('gpt-4o')
  })

  it('accepts mobile shape with isBuiltIn as boolean', () => {
    const preset: ModelPreset = {
      id: 'builtin-groq',
      name: 'Groq',
      baseUrl: 'https://api.groq.com/v1',
      isBuiltIn: true,
    }
    assertType<ModelPreset>(preset)
    expect(preset.isBuiltIn).toBe(true)
  })

  it('accepts empty apiKey string (desktop convention)', () => {
    const preset: ModelPreset = {
      id: 'builtin-together',
      name: 'Together AI',
      baseUrl: 'https://api.together.xyz/v1',
      apiKey: '',
      isBuiltIn: true,
    }
    assertType<ModelPreset>(preset)
    expect(preset.apiKey).toBe('')
  })
})

// ── Model Metadata ──────────────────────────────────────────────────────────

describe('Model metadata API types', () => {
  it('accepts model list entries with desktop transcription metadata', () => {
    const model: ModelInfo = {
      id: 'whisper-1',
      name: 'Whisper',
      context_length: 16000,
      created: 1700000000,
      supportsTranscription: true,
    }

    assertType<ModelInfo>(model)
    expect(model.supportsTranscription).toBe(true)
  })

  it('accepts models.dev API records with optional provider metadata', () => {
    const model: ModelsDevModel = {
      id: 'gpt-5.5',
      name: 'GPT-5.5',
      reasoning: true,
      tool_call: true,
      modalities: {
        input: ['text', 'image'],
        output: ['text'],
      },
      cost: {
        input: 1.25,
        output: 10,
        cache_read: 0.125,
      },
      limit: {
        context: 400000,
        output: 128000,
      },
    }

    const data: ModelsDevData = {
      openai: {
        id: 'openai',
        name: 'OpenAI',
        env: ['OPENAI_API_KEY'],
        models: {
          [model.id]: model,
        },
      },
    }

    assertType<ModelsDevData>(data)
    expect(data.openai.models['gpt-5.5'].reasoning).toBe(true)
  })

  it('accepts enhanced model display data derived from models.dev', () => {
    const enhanced: EnhancedModelInfo = {
      id: 'gpt-5.5',
      name: 'GPT-5.5',
      supportsReasoning: true,
      supportsToolCalls: true,
      inputCost: 1.25,
      outputCost: 10,
      contextLimit: 400000,
      inputModalities: ['text', 'image'],
      outputModalities: ['text'],
    }

    const match: ModelMatchResult = {
      model: {
        id: enhanced.id,
        name: enhanced.name,
      },
      providerId: 'openai',
      matchType: 'fuzzy',
      score: 100,
    }

    assertType<EnhancedModelInfo>(enhanced)
    assertType<ModelMatchResult>(match)
    expect(match.model.id).toBe('gpt-5.5')
  })
})

// ── QueuedMessage ────────────────────────────────────────────────────────────

describe('QueuedMessage', () => {
  it('accepts a basic queued message (shared shape)', () => {
    const msg: QueuedMessage = {
      id: 'msg-1',
      conversationId: 'conv-1',
      text: 'Hello world',
      createdAt: Date.now(),
      status: 'pending',
    }
    assertType<QueuedMessage>(msg)
    expect(msg.status).toBe('pending')
    expect(msg.sessionId).toBeUndefined()
  })

  it('accepts a queued message with sessionId (desktop shape)', () => {
    const msg: QueuedMessage = {
      id: 'msg-2',
      conversationId: 'conv-1',
      sessionId: 'sess-42',
      text: 'A queued message',
      createdAt: Date.now(),
      status: 'processing',
    }
    assertType<QueuedMessage>(msg)
    expect(msg.sessionId).toBe('sess-42')
  })

  it('accepts all optional fields (errorMessage, addedToHistory)', () => {
    const msg: QueuedMessage = {
      id: 'msg-3',
      conversationId: 'conv-2',
      sessionId: 'sess-99',
      text: 'Failed message',
      createdAt: Date.now(),
      status: 'failed',
      errorMessage: 'Network error',
      addedToHistory: true,
    }
    assertType<QueuedMessage>(msg)
    expect(msg.errorMessage).toBe('Network error')
    expect(msg.addedToHistory).toBe(true)
  })

  it('supports all valid status values', () => {
    const statuses: QueuedMessage['status'][] = ['pending', 'processing', 'cancelled', 'failed']
    expect(statuses).toHaveLength(4)
  })
})

// ── RecordingHistoryItem ────────────────────────────────────────────────────

describe('RecordingHistoryItem', () => {
  it('accepts persisted recording transcript entries', () => {
    const item: RecordingHistoryItem = {
      id: 'recording-1',
      createdAt: 1700000000,
      duration: 12.5,
      transcript: 'Open settings',
    }

    assertType<RecordingHistoryItem>(item)
    expect(item.transcript).toBe('Open settings')
  })
})

// ── MessageQueue ─────────────────────────────────────────────────────────────

describe('MessageQueue', () => {
  it('accepts a queue with messages', () => {
    const queue: MessageQueue = {
      conversationId: 'conv-1',
      messages: [
        {
          id: 'msg-1',
          conversationId: 'conv-1',
          text: 'First',
          createdAt: Date.now(),
          status: 'pending',
        },
        {
          id: 'msg-2',
          conversationId: 'conv-1',
          sessionId: 'sess-1',
          text: 'Second',
          createdAt: Date.now(),
          status: 'processing',
        },
      ],
    }
    assertType<MessageQueue>(queue)
    expect(queue.messages).toHaveLength(2)
  })
})

// ── RESPOND_TO_USER_TOOL ─────────────────────────────────────────────────────

describe('RESPOND_TO_USER_TOOL', () => {
  it('equals "respond_to_user"', () => {
    expect(RESPOND_TO_USER_TOOL).toBe('respond_to_user')
  })

  it('is a string constant', () => {
    expect(typeof RESPOND_TO_USER_TOOL).toBe('string')
  })
})

// ── Mobile Settings API Contracts ────────────────────────────────────────────

describe('settings API request/response contracts', () => {
  it('accepts knowledge note create/update payloads from mobile editors', () => {
    const createPayload: KnowledgeNoteCreateRequest = {
      id: 'note-id',
      title: 'Architecture note',
      body: 'Details',
      summary: 'Short summary',
      context: 'search-only',
      tags: ['architecture'],
      references: ['docs/architecture.md'],
    }
    const updatePayload: KnowledgeNoteUpdateRequest = {
      title: 'Updated note',
      context: 'auto',
      tags: [],
      references: [],
    }
    const response: KnowledgeNoteResponse = {
      note: {
        id: 'note-id',
        title: 'Architecture note',
        context: 'search-only',
        body: 'Details',
        tags: [],
        updatedAt: Date.now(),
        group: 'engineering',
        series: 'notes',
        entryType: 'entry',
      },
    }

    assertType<KnowledgeNoteCreateRequest>(createPayload)
    assertType<KnowledgeNoteUpdateRequest>(updatePayload)
    assertType<KnowledgeNoteResponse>(response)
    expect(response.note.group).toBe('engineering')
  })

  it('accepts predefined prompt records shared by desktop config and mobile settings', () => {
    const prompt: PredefinedPrompt = {
      id: 'prompt-1',
      name: 'Standup',
      content: 'Summarize the last session.',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    assertType<PredefinedPrompt>(prompt)
    expect(prompt.name).toBe('Standup')
  })

  it('accepts predefined prompt config shared by desktop and mobile settings', () => {
    const config: PredefinedPromptsConfig = {
      predefinedPrompts: [{
        id: 'prompt-1',
        name: 'Standup',
        content: 'Summarize the last session.',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }],
    }

    assertType<PredefinedPromptsConfig>(config)
    expect(config.predefinedPrompts?.[0]?.name).toBe('Standup')
  })

  it('accepts agent execution config shared by desktop and mobile settings', () => {
    const config: AgentExecutionConfig = {
      mcpRequireApprovalBeforeToolCall: true,
      mcpMaxIterations: 12,
      mcpUnlimitedIterations: false,
      mcpVerifyCompletionEnabled: true,
      mcpFinalSummaryEnabled: false,
      mcpContextReductionEnabled: true,
      mcpToolResponseProcessingEnabled: true,
      mcpParallelToolExecution: true,
      mcpMessageQueueEnabled: true,
      dualModelEnabled: false,
    }

    assertType<AgentExecutionConfig>(config)
    expect(config.mcpMaxIterations).toBe(12)
  })

  it('accepts provider model and credential config shared by desktop and mobile settings', () => {
    const modelConfig: AgentModelSelectionConfig = {
      agentProviderId: 'chatgpt-web',
      agentOpenaiModel: 'gpt-4.1-mini',
      agentGroqModel: 'openai/gpt-oss-120b',
      agentGeminiModel: 'gemini-2.5-flash',
      agentChatgptWebModel: 'gpt-5.1-codex',
      mcpToolsProviderId: 'chatgpt-web',
      mcpToolsOpenaiModel: 'gpt-4.1-mini',
      mcpToolsGroqModel: 'openai/gpt-oss-120b',
      mcpToolsGeminiModel: 'gemini-2.5-flash',
      mcpToolsChatgptWebModel: 'gpt-5.1-codex',
      currentModelPresetId: 'builtin-openai',
    }
    const credentials: ChatProviderCredentialsConfig = {
      openaiApiKey: 'sk-openai',
      openaiBaseUrl: 'https://api.openai.com/v1',
      groqApiKey: 'gsk_groq',
      groqBaseUrl: 'https://api.groq.com/openai/v1',
      geminiApiKey: 'gemini-key',
      geminiBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    }
    const chatgptWebAuth: ChatGptWebAuthConfig = {
      chatgptWebAccessToken: 'access-token',
      chatgptWebSessionToken: 'session-token',
      chatgptWebAccountId: 'account-1',
      chatgptWebBaseUrl: 'https://chatgpt.com',
      chatgptWebAuthEmail: 'agent@example.com',
      chatgptWebPlanType: 'plus',
      chatgptWebConnectedAt: 123,
    }
    const update: SettingsUpdate = {
      ...modelConfig,
      ...credentials,
      ...chatgptWebAuth,
    }

    assertType<SettingsUpdate>(update)
    expect(update.agentProviderId).toBe('chatgpt-web')
    expect(update.chatgptWebBaseUrl).toBe('https://chatgpt.com')
  })

  it('accepts streamer mode config shared by settings and remote pairing', () => {
    const config: StreamerModeConfig = {
      streamerModeEnabled: true,
    }

    assertType<StreamerModeConfig>(config)
    expect(config.streamerModeEnabled).toBe(true)
  })

  it('accepts speech-to-text config shared by desktop and mobile settings', () => {
    const config: SpeechToTextConfig = {
      sttProviderId: 'groq',
      sttLanguage: 'en',
      openaiSttLanguage: 'en',
      openaiSttModel: 'whisper-1',
      groqSttLanguage: 'en',
      groqSttModel: 'whisper-large-v3-turbo',
      groqSttPrompt: 'Prefer product names verbatim.',
      transcriptionPreviewEnabled: true,
      parakeetNumThreads: 2,
    }

    assertType<SpeechToTextConfig>(config)
    expect(config.sttProviderId).toBe('groq')
  })

  it('accepts transcript post-processing config shared by desktop and mobile settings', () => {
    const config: TranscriptPostProcessingConfig = {
      transcriptPostProcessingEnabled: true,
      transcriptPostProcessingProviderId: 'gemini',
      transcriptPostProcessingOpenaiModel: 'gpt-4.1-mini',
      transcriptPostProcessingGroqModel: 'llama-3.1-8b-instant',
      transcriptPostProcessingGeminiModel: 'gemini-2.5-flash',
      transcriptPostProcessingChatgptWebModel: 'gpt-5.1-codex',
      transcriptPostProcessingPrompt: 'Clean up punctuation only.',
    }

    assertType<TranscriptPostProcessingConfig>(config)
    expect(config.transcriptPostProcessingProviderId).toBe('gemini')
  })

  it('accepts text-to-speech config shared by desktop and mobile settings', () => {
    const config: TextToSpeechConfig = {
      ttsEnabled: true,
      ttsAutoPlay: false,
      ttsProviderId: 'supertonic',
      ttsPreprocessingEnabled: true,
      ttsRemoveCodeBlocks: true,
      ttsRemoveUrls: true,
      ttsConvertMarkdown: true,
      ttsUseLLMPreprocessing: false,
      openaiTtsModel: 'gpt-4o-mini-tts',
      openaiTtsVoice: 'alloy',
      openaiTtsSpeed: 1,
      groqTtsModel: 'canopylabs/orpheus-v1-english',
      groqTtsVoice: 'troy',
      geminiTtsModel: 'gemini-2.5-flash-preview-tts',
      geminiTtsVoice: 'Kore',
      edgeTtsModel: 'edge-tts',
      edgeTtsVoice: 'en-US-AriaNeural',
      edgeTtsRate: 1,
      kittenVoiceId: 0,
      supertonicVoice: 'M1',
      supertonicLanguage: 'en',
      supertonicSpeed: 1.05,
      supertonicSteps: 5,
    }

    assertType<TextToSpeechConfig>(config)
    expect(config.ttsProviderId).toBe('supertonic')
  })

  it('accepts operator integration settings shared by desktop and mobile settings', () => {
    const discordConfig: DiscordIntegrationSettingsConfig = {
      discordEnabled: true,
      discordBotToken: 'token',
      discordDmEnabled: true,
      discordRequireMention: false,
      discordAllowUserIds: ['user-1'],
      discordAllowGuildIds: ['guild-1'],
      discordAllowChannelIds: ['channel-1'],
      discordAllowRoleIds: ['role-1'],
      discordDmAllowUserIds: ['user-2'],
      discordOperatorAllowUserIds: ['operator-1'],
      discordOperatorAllowGuildIds: ['guild-2'],
      discordOperatorAllowChannelIds: ['channel-2'],
      discordOperatorAllowRoleIds: ['role-2'],
      discordDefaultProfileId: 'agent-1',
      discordLogMessages: true,
    }
    const whatsappConfig: WhatsAppIntegrationConfig = {
      whatsappEnabled: true,
      whatsappAllowFrom: ['15551234567'],
      whatsappOperatorAllowFrom: ['15557654321'],
      whatsappAutoReply: true,
      whatsappLogMessages: false,
    }
    const update: SettingsUpdate = {
      ...discordConfig,
      ...whatsappConfig,
    }

    assertType<SettingsUpdate>(update)
    expect(update.discordDefaultProfileId).toBe('agent-1')
    expect(update.whatsappAllowFrom).toEqual(['15551234567'])
  })

  it('accepts repeat task create/update payloads with nullable schedules', () => {
    const createPayload: LoopCreateRequest = {
      name: 'Daily standup',
      prompt: 'Summarize yesterday',
      intervalMinutes: 60,
      enabled: true,
      runContinuously: false,
      schedule: { type: 'daily', times: ['09:00'] },
    }
    const updatePayload: LoopUpdateRequest = {
      intervalMinutes: 15,
      runContinuously: false,
      schedule: null,
    }

    assertType<LoopCreateRequest>(createPayload)
    assertType<LoopUpdateRequest>(updatePayload)
    expect(createPayload.schedule?.type).toBe('daily')
  })

  it('accepts operator diagnostics contracts consumed by mobile Operations', () => {
    const tunnelSetup: OperatorTunnelSetupSummary = {
      installed: true,
      loggedIn: true,
      mode: 'named',
      autoStart: false,
      namedTunnelConfigured: true,
      configuredTunnelId: 'abc',
      configuredHostname: 'ops.example.com',
      credentialsPathConfigured: true,
      tunnelCount: 1,
      tunnels: [{ id: 'abc', name: 'ops', createdAt: '2026-01-01T00:00:00Z' }],
    }
    const discordLogs: OperatorDiscordLogsResponse = {
      count: 1,
      logs: [{ id: 'log-1', level: 'info', message: 'Connected', timestamp: Date.now() }],
    }
    const emergencyStop: EmergencyStopResponse = {
      success: true,
      message: 'Emergency stop executed',
      processesKilled: 2,
      processesRemaining: 0,
    }

    assertType<OperatorTunnelSetupSummary>(tunnelSetup)
    assertType<OperatorDiscordLogsResponse>(discordLogs)
    assertType<EmergencyStopResponse>(emergencyStop)
    expect(tunnelSetup.tunnels[0].name).toBe('ops')
  })
})
