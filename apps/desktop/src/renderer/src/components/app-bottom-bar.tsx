import { useEffect, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import {
  CHAT_PROVIDERS,
  DEFAULT_MODEL_PRESET_ID,
  getBuiltInModelPresets,
  type CHAT_PROVIDER_ID,
} from "@dotagents/shared"
import type { Config, LoopConfig, ModelPreset } from "@shared/types"
import {
  queryClient,
  useAvailableModelsQuery,
  useConfigQuery,
  useSaveConfigMutation,
} from "@renderer/lib/queries"
import { rendererHandlers, tipcClient } from "@renderer/lib/tipc-client"
import { cn } from "@renderer/lib/utils"

type ReasoningEffort = NonNullable<Config["openaiReasoningEffort"]>
type CodexVerbosity = NonNullable<Config["codexTextVerbosity"]>

const BAR_SELECT_CLASS =
  "h-5 min-w-0 cursor-pointer rounded border-0 bg-transparent py-0 pl-0 pr-5 text-[11px] text-muted-foreground outline-none hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-default disabled:opacity-60"

const AGENT_MODEL_FALLBACKS: Record<CHAT_PROVIDER_ID, string> = {
  openai: "gpt-5.5",
  groq: "llama-3.3-70b-versatile",
  gemini: "gemini-2.5-pro",
  "chatgpt-web": "gpt-5.5",
}

const REASONING_EFFORT_OPTIONS: Array<{
  value: ReasoningEffort
  label: string
}> = [
  { value: "none", label: "None" },
  { value: "minimal", label: "Minimal" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "xhigh", label: "Extra high" },
]

const VERBOSITY_OPTIONS: Array<{ value: CodexVerbosity; label: string }> = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
]

const getAgentProviderId = (config: Config | undefined): CHAT_PROVIDER_ID => {
  return config?.agentProviderId || config?.mcpToolsProviderId || "openai"
}

const getMergedModelPresets = (config: Config | undefined): ModelPreset[] => {
  const builtIn = getBuiltInModelPresets()
  const saved = config?.modelPresets || []
  const mergedBuiltIn = builtIn.map((preset) => {
    const savedPreset = saved.find((candidate) => candidate.id === preset.id)
    if (!savedPreset) {
      if (preset.id === DEFAULT_MODEL_PRESET_ID && config?.openaiApiKey) {
        return { ...preset, apiKey: config.openaiApiKey }
      }
      return preset
    }
    const merged = { ...preset, ...savedPreset }
    if (
      preset.id === DEFAULT_MODEL_PRESET_ID &&
      !merged.apiKey &&
      config?.openaiApiKey
    ) {
      merged.apiKey = config.openaiApiKey
    }
    return merged
  })
  return [...mergedBuiltIn, ...saved.filter((preset) => !preset.isBuiltIn)]
}

const getActiveModelPreset = (
  config: Config | undefined,
): ModelPreset | undefined => {
  const currentPresetId =
    config?.currentModelPresetId || DEFAULT_MODEL_PRESET_ID
  return getMergedModelPresets(config).find(
    (preset) => preset.id === currentPresetId,
  )
}

const getConfiguredAgentModel = (
  config: Config | undefined,
  providerId: CHAT_PROVIDER_ID,
): string => {
  if (providerId === "openai") {
    const activePreset = getActiveModelPreset(config)
    return (
      config?.agentOpenaiModel ||
      config?.mcpToolsOpenaiModel ||
      activePreset?.agentModel ||
      activePreset?.mcpToolsModel ||
      AGENT_MODEL_FALLBACKS.openai
    )
  }
  if (providerId === "groq") {
    return (
      config?.agentGroqModel ||
      config?.mcpToolsGroqModel ||
      AGENT_MODEL_FALLBACKS.groq
    )
  }
  if (providerId === "gemini") {
    return (
      config?.agentGeminiModel ||
      config?.mcpToolsGeminiModel ||
      AGENT_MODEL_FALLBACKS.gemini
    )
  }
  return (
    config?.agentChatgptWebModel ||
    config?.mcpToolsChatgptWebModel ||
    AGENT_MODEL_FALLBACKS["chatgpt-web"]
  )
}

const getModelDisplayName = (model: string): string =>
  model.split("/").pop() || model

const buildAgentModelConfigUpdates = (
  config: Config,
  providerId: CHAT_PROVIDER_ID,
  modelId: string,
): Partial<Config> => {
  if (providerId === "openai") {
    const currentPresetId =
      config.currentModelPresetId || DEFAULT_MODEL_PRESET_ID
    const existingPresets = config.modelPresets || []
    const existingPreset = existingPresets.find(
      (preset) => preset.id === currentPresetId,
    )
    const builtInPreset = getBuiltInModelPresets().find(
      (preset) => preset.id === currentPresetId,
    )
    const presetBase = existingPreset || builtInPreset
    const updatedPreset: ModelPreset | undefined = presetBase
      ? {
          ...presetBase,
          apiKey:
            presetBase.apiKey ||
            (currentPresetId === DEFAULT_MODEL_PRESET_ID
              ? config.openaiApiKey || ""
              : ""),
          agentModel: modelId,
          mcpToolsModel: modelId,
          updatedAt: Date.now(),
        }
      : undefined

    return {
      agentOpenaiModel: modelId,
      mcpToolsOpenaiModel: modelId,
      ...(updatedPreset
        ? {
            modelPresets: existingPreset
              ? existingPresets.map((preset) =>
                  preset.id === currentPresetId ? updatedPreset : preset,
                )
              : [...existingPresets, updatedPreset],
          }
        : {}),
    }
  }

  if (providerId === "groq") {
    return { agentGroqModel: modelId, mcpToolsGroqModel: modelId }
  }
  if (providerId === "gemini") {
    return { agentGeminiModel: modelId, mcpToolsGeminiModel: modelId }
  }
  return { agentChatgptWebModel: modelId, mcpToolsChatgptWebModel: modelId }
}

const providerSupportsThinking = (providerId: CHAT_PROVIDER_ID): boolean =>
  providerId === "openai" || providerId === "chatgpt-web"

const providerSupportsVerbosity = (providerId: CHAT_PROVIDER_ID): boolean =>
  providerId === "chatgpt-web"

export function AppBottomBar() {
  const navigate = useNavigate()
  const configQuery = useConfigQuery()
  const saveConfigMutation = useSaveConfigMutation()
  const config = configQuery.data
  const providerId = getAgentProviderId(config)
  const currentModel = getConfiguredAgentModel(config, providerId)
  const providerLabel =
    CHAT_PROVIDERS.find((provider) => provider.value === providerId)?.label ||
    providerId
  const activePreset = getActiveModelPreset(config)
  const modelsQuery = useAvailableModelsQuery(
    providerId,
    !!providerId,
    providerId === "openai"
      ? config?.currentModelPresetId || DEFAULT_MODEL_PRESET_ID
      : undefined,
  )
  const loopsQuery = useQuery({
    queryKey: ["loops"],
    queryFn: async () => tipcClient.getLoops(),
  })

  useEffect(() => {
    return rendererHandlers.loopsFolderChanged.listen(() => {
      queryClient.invalidateQueries({ queryKey: ["loops"] })
    })
  }, [])

  const modelOptions = useMemo(() => {
    const options = [...(modelsQuery.data || [])]
    if (currentModel && !options.some((model) => model.id === currentModel)) {
      options.unshift({
        id: currentModel,
        name: getModelDisplayName(currentModel),
      })
    }
    return options
  }, [currentModel, modelsQuery.data])

  const loops = (loopsQuery.data || []) as LoopConfig[]
  const enabledLoopCount = loops.filter((loop) => loop.enabled).length
  const loopSummary =
    loops.length > 0 ? `${enabledLoopCount}/${loops.length}` : "0"
  const reasoningValue: ReasoningEffort =
    (config?.openaiReasoningEffort as ReasoningEffort | undefined) ||
    (providerId === "chatgpt-web" ? "low" : "medium")
  const verbosityValue: CodexVerbosity =
    (config?.codexTextVerbosity as CodexVerbosity | undefined) || "medium"

  const saveConfig = (updates: Partial<Config>) => {
    if (!config) return
    saveConfigMutation.mutate({ config: { ...config, ...updates } })
  }

  const handleProviderChange = (nextProviderId: string) => {
    if (!config || nextProviderId === providerId) return
    saveConfig({ agentProviderId: nextProviderId as CHAT_PROVIDER_ID })
  }

  const handleModelChange = (modelId: string) => {
    if (!config || modelId === currentModel) return
    saveConfig(buildAgentModelConfigUpdates(config, providerId, modelId))
  }

  return (
    <footer
      className="app-bottom-bar bg-background/95 text-muted-foreground flex h-7 shrink-0 items-center justify-between gap-3 border-t px-2 text-[11px] backdrop-blur"
      aria-label="Application status and controls"
    >
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={() => navigate("/settings/repeat-tasks")}
          className="hover:bg-accent hover:text-foreground flex h-5 items-center gap-1 rounded px-1.5 transition-colors"
          title="Open and edit repeat tasks"
        >
          <span className="i-mingcute-refresh-3-line h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:inline">Repeat Tasks</span>
          <span className="tabular-nums">{loopSummary}</span>
        </button>
        <button
          type="button"
          onClick={() => navigate("/settings/models")}
          className="hover:bg-accent hover:text-foreground hidden h-5 items-center gap-1 rounded px-1.5 transition-colors md:flex"
          title="Open model settings"
        >
          <span className="i-mingcute-brain-line h-3.5 w-3.5 shrink-0" />
          <span>Models</span>
        </button>
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-center gap-2 overflow-hidden">
        <label className="flex min-w-0 items-center gap-1">
          <select
            value={providerId}
            onChange={(event) =>
              handleProviderChange(event.currentTarget.value)
            }
            disabled={!config || saveConfigMutation.isPending}
            className={cn(BAR_SELECT_CLASS, "max-w-[125px]")}
            title={`Agent provider (${providerLabel})`}
            aria-label="Change agent provider"
          >
            {CHAT_PROVIDERS.map((provider) => (
              <option key={provider.value} value={provider.value}>
                {provider.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex min-w-0 items-center gap-1">
          <select
            value={currentModel}
            onChange={(event) => handleModelChange(event.currentTarget.value)}
            disabled={!config || saveConfigMutation.isPending}
            className={cn(BAR_SELECT_CLASS, "max-w-[180px]")}
            title={`Agent model (${activePreset?.name || providerLabel}/${currentModel})`}
            aria-label="Change agent model"
          >
            {modelOptions.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name || getModelDisplayName(model.id)}
              </option>
            ))}
            {modelsQuery.isLoading && modelOptions.length === 0 && (
              <option value={currentModel}>Loading models...</option>
            )}
            {modelOptions.length === 0 && !modelsQuery.isLoading && (
              <option value={currentModel}>No models available</option>
            )}
          </select>
        </label>

        {providerSupportsThinking(providerId) && (
          <label className="flex shrink-0 items-center gap-1">
            <span className="i-mingcute-brain-line h-3.5 w-3.5" />
            <select
              value={reasoningValue}
              onChange={(event) =>
                saveConfig({
                  openaiReasoningEffort: event.currentTarget
                    .value as ReasoningEffort,
                })
              }
              disabled={!config || saveConfigMutation.isPending}
              className={cn(BAR_SELECT_CLASS, "max-w-[92px]")}
              title="Change thinking level"
              aria-label="Change thinking level"
            >
              {REASONING_EFFORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        )}

        {providerSupportsVerbosity(providerId) && (
          <label className="flex shrink-0 items-center gap-1">
            <span className="i-mingcute-chat-3-line h-3.5 w-3.5" />
            <select
              value={verbosityValue}
              onChange={(event) =>
                saveConfig({
                  codexTextVerbosity: event.currentTarget
                    .value as CodexVerbosity,
                })
              }
              disabled={!config || saveConfigMutation.isPending}
              className={cn(BAR_SELECT_CLASS, "max-w-[82px]")}
              title="Change verbosity"
              aria-label="Change verbosity"
            >
              {VERBOSITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <button
        type="button"
        onClick={() => navigate("/settings")}
        className="hover:bg-accent hover:text-foreground flex h-5 shrink-0 items-center gap-1 rounded px-1.5 tabular-nums transition-colors"
        title="Open settings"
      >
        <span className="i-mingcute-settings-3-line h-3.5 w-3.5" />
        <span>v{process.env.APP_VERSION}</span>
      </button>
    </footer>
  )
}
