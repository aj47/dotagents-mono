import type { AgentProfile, Config } from "@shared/types"
import {
  EXTERNAL_AGENT_PRESETS,
  detectExternalAgentPresetKey,
  type ExternalAgentPresetKey,
} from "@shared/external-agent-presets"

export type ByokProviderId = "openai" | "groq" | "gemini"

export type OnboardingMainAgentChoiceId = "byok" | ExternalAgentPresetKey

export type OnboardingMainAgentOption = {
  id: OnboardingMainAgentChoiceId
  displayName: string
  description: string
  setupSummary: string
  mode: "api" | "acp"
  isRecommended?: boolean
}

export type CreateAgentProfileInput = {
  displayName: string
  description?: string
  connection: {
    type: "acp" | "stdio"
    command: string
    args?: string[]
    env?: Record<string, string>
    cwd?: string
  }
  enabled: boolean
  isUserProfile: boolean
  isAgentTarget: boolean
  autoSpawn?: boolean
}

const DEFAULT_CHAT_MODELS = {
  openai: "gpt-4.1-mini",
  groq: "openai/gpt-oss-120b",
  gemini: "gemini-2.5-flash",
} as const

export const ONBOARDING_MAIN_AGENT_OPTIONS: OnboardingMainAgentOption[] = [
  {
    id: "opencode",
    displayName: EXTERNAL_AGENT_PRESETS.opencode.displayName,
    description: EXTERNAL_AGENT_PRESETS.opencode.description,
    setupSummary: "Provision an ACP profile now, then verify or finish external auth as needed.",
    mode: "acp",
    isRecommended: true,
  },
  {
    id: "auggie",
    displayName: EXTERNAL_AGENT_PRESETS.auggie.displayName,
    description: EXTERNAL_AGENT_PRESETS.auggie.description,
    setupSummary: "Connect your existing Auggie install over ACP.",
    mode: "acp",
  },
  {
    id: "claude-code",
    displayName: EXTERNAL_AGENT_PRESETS["claude-code"].displayName,
    description: EXTERNAL_AGENT_PRESETS["claude-code"].description,
    setupSummary: "Connect your existing Claude Code ACP adapter.",
    mode: "acp",
  },
  {
    id: "codex",
    displayName: EXTERNAL_AGENT_PRESETS.codex.displayName,
    description: EXTERNAL_AGENT_PRESETS.codex.description,
    setupSummary: "Connect your existing Codex ACP adapter.",
    mode: "acp",
  },
  {
    id: "byok",
    displayName: "Bring Your Own Key (BYOK)",
    description: "Use DotAgents' built-in main agent with your own provider key.",
    setupSummary: "Enter one API key for OpenAI, Groq, or Gemini.",
    mode: "api",
  },
]

function pickSttProvider(preferredProviderId: ByokProviderId, currentConfig?: Config): Config["sttProviderId"] | undefined {
  if (currentConfig?.parakeetModelDownloaded) return "parakeet"
  if (preferredProviderId === "openai" || preferredProviderId === "groq") return preferredProviderId
  if (currentConfig?.groqApiKey) return "groq"
  if (currentConfig?.openaiApiKey) return "openai"
  return currentConfig?.sttProviderId
}

function pickTtsProvider(preferredProviderId: ByokProviderId, currentConfig?: Config): Config["ttsProviderId"] | undefined {
  if (currentConfig?.kittenModelDownloaded) return "kitten"
  if (currentConfig?.supertonicModelDownloaded) return "supertonic"
  return preferredProviderId
}

export function buildByokConfigUpdate(
  providerId: ByokProviderId,
  apiKey: string,
  currentConfig?: Config,
): Partial<Config> {
  const trimmedApiKey = apiKey.trim()
  const sttProviderId = pickSttProvider(providerId, currentConfig)
  const ttsProviderId = pickTtsProvider(providerId, currentConfig)
  const update: Partial<Config> = {
    mainAgentMode: "api",
    mainAgentName: "",
    mcpToolsProviderId: providerId,
    transcriptPostProcessingProviderId: providerId,
  }

  if (sttProviderId) update.sttProviderId = sttProviderId
  if (ttsProviderId) update.ttsProviderId = ttsProviderId

  if (providerId === "openai") {
    update.openaiApiKey = trimmedApiKey
    update.mcpToolsOpenaiModel = currentConfig?.mcpToolsOpenaiModel || DEFAULT_CHAT_MODELS.openai
    update.transcriptPostProcessingOpenaiModel =
      currentConfig?.transcriptPostProcessingOpenaiModel || DEFAULT_CHAT_MODELS.openai
  } else if (providerId === "groq") {
    update.groqApiKey = trimmedApiKey
    update.mcpToolsGroqModel = currentConfig?.mcpToolsGroqModel || DEFAULT_CHAT_MODELS.groq
    update.transcriptPostProcessingGroqModel =
      currentConfig?.transcriptPostProcessingGroqModel || DEFAULT_CHAT_MODELS.groq
  } else {
    update.geminiApiKey = trimmedApiKey
    update.mcpToolsGeminiModel = currentConfig?.mcpToolsGeminiModel || DEFAULT_CHAT_MODELS.gemini
    update.transcriptPostProcessingGeminiModel =
      currentConfig?.transcriptPostProcessingGeminiModel || DEFAULT_CHAT_MODELS.gemini
  }

  return update
}

export function buildExternalAgentProfileInput(
  presetKey: ExternalAgentPresetKey,
  options?: {
    cwd?: string
    env?: Record<string, string>
  },
): CreateAgentProfileInput {
  const preset = EXTERNAL_AGENT_PRESETS[presetKey]
  return {
    displayName: preset.displayName,
    description: preset.description,
    connection: {
      type: preset.connectionType,
      command: preset.connectionCommand,
      args: preset.connectionArgs ? preset.connectionArgs.split(" ").filter(Boolean) : undefined,
      env: options?.env,
      cwd: options?.cwd?.trim() || undefined,
    },
    enabled: true,
    isUserProfile: false,
    isAgentTarget: true,
    autoSpawn: false,
  }
}

const OPENCODE_MANAGED_PROVIDER_ENV_KEY = "DOTAGENTS_OPENCODE_PROVIDER_API_KEY"

const OPENCODE_PROVIDER_ENV_BY_PROVIDER: Record<ByokProviderId, string> = {
  openai: "OPENAI_API_KEY",
  groq: "GROQ_API_KEY",
  gemini: "GEMINI_API_KEY",
}

const OPENCODE_PROVIDER_NAME_BY_PROVIDER: Record<ByokProviderId, string> = {
  openai: "openai",
  groq: "groq",
  gemini: "google",
}

const OPENCODE_DEFAULT_MODEL_BY_PROVIDER: Record<ByokProviderId, string> = {
  openai: "openai/gpt-4.1-mini",
  groq: "groq/openai/gpt-oss-120b",
  gemini: "google/gemini-2.5-flash",
}

export function buildOpenCodeManagedEnv(providerId: ByokProviderId, apiKey: string): Record<string, string> {
  const trimmedApiKey = apiKey.trim()
  const providerEnvKey = OPENCODE_PROVIDER_ENV_BY_PROVIDER[providerId]
  const providerName = OPENCODE_PROVIDER_NAME_BY_PROVIDER[providerId]
  const config = {
    $schema: "https://opencode.ai/config.json",
    autoupdate: false,
    model: OPENCODE_DEFAULT_MODEL_BY_PROVIDER[providerId],
    provider: {
      [providerName]: {
        options: {
          apiKey: `{env:${OPENCODE_MANAGED_PROVIDER_ENV_KEY}}`,
        },
      },
    },
    disabled_providers: ["openai", "groq", "google"].filter((candidate) => candidate !== providerName),
  }

  return {
    OPENCODE_CONFIG_CONTENT: JSON.stringify(config),
    [OPENCODE_MANAGED_PROVIDER_ENV_KEY]: trimmedApiKey,
    [providerEnvKey]: trimmedApiKey,
    OPENCODE_DISABLE_UPDATE_CHECK: "1",
  }
}

export function findExistingExternalAgentProfile(
  profiles: AgentProfile[],
  presetKey: ExternalAgentPresetKey,
): AgentProfile | undefined {
  return profiles.find((profile) =>
    detectExternalAgentPresetKey({
      connectionType: profile.connection.type,
      connectionCommand: profile.connection.command,
      connectionArgs: profile.connection.args,
    }) === presetKey
  )
}

export function buildAcpOnboardingConfigUpdate(
  profileName: string,
  currentConfig?: Config,
): Partial<Config> {
  return {
    mainAgentMode: "acp",
    mainAgentName: profileName,
    acpInjectRuntimeTools: currentConfig?.acpInjectRuntimeTools ?? true,
    ...(currentConfig?.parakeetModelDownloaded ? { sttProviderId: "parakeet" as const } : {}),
    ...(currentConfig?.kittenModelDownloaded
      ? { ttsProviderId: "kitten" as const }
      : currentConfig?.supertonicModelDownloaded
        ? { ttsProviderId: "supertonic" as const }
        : {}),
  }
}
