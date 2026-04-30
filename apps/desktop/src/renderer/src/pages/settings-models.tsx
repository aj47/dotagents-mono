import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { ControlGroup } from "@renderer/components/ui/control"
import { Input } from "@renderer/components/ui/input"
import { Textarea } from "@renderer/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@renderer/components/ui/select"
import { Switch } from "@renderer/components/ui/switch"
import { useConfigQuery, useSaveConfigMutation } from "@renderer/lib/query-client"
import { ModelPresetManager } from "@renderer/components/model-preset-manager"
import { ModelSelector } from "@renderer/components/model-selector"
import { PresetModelSelector } from "@renderer/components/preset-model-selector"
import { Config, ModelPreset } from "@shared/types"
import {
  STT_PROVIDERS,
  CHAT_PROVIDERS,
  TTS_PROVIDERS,
  STT_PROVIDER_ID,
  CHAT_PROVIDER_ID,
  TTS_PROVIDER_ID,
  OPENAI_TTS_MODELS,
  OPENAI_TTS_VOICES,
  GROQ_TTS_MODELS,
  GROQ_TTS_VOICES_ARABIC,
  GROQ_TTS_VOICES_ENGLISH,
  GEMINI_TTS_MODELS,
  GEMINI_TTS_VOICES,
  EDGE_TTS_MODELS,
  EDGE_TTS_VOICES,
  KITTEN_TTS_VOICES,
  SUPERTONIC_TTS_LANGUAGES,
  SUPERTONIC_TTS_VOICES,
  DEFAULT_MODEL_PRESET_ID,
  getBuiltInModelPresets,
} from "@dotagents/shared"
import { getDefaultSttModel } from "@dotagents/shared/stt-models"
import { Mic, FileText, Volume2, Bot, BookOpen, Settings2, type LucideIcon } from "lucide-react"

const SETTINGS_TEXT_SAVE_DEBOUNCE_MS = 400

const DEFAULT_CHAT_MODELS: Record<CHAT_PROVIDER_ID, string> = {
  openai: "gpt-4.1-mini",
  groq: "openai/gpt-oss-120b",
  gemini: "gemini-2.5-flash",
  "chatgpt-web": "gpt-5.4-mini",
}

type ProviderOption = {
  label: string
  value: string
}

type OpenAiPresetModelType = "agentModel" | "transcriptProcessingModel" | "summarizationModel"

function RouteRow({
  icon: Icon,
  title,
  description,
  action,
  children,
}: {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="px-3 py-3">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)]">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-muted/30">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center justify-between gap-3">
              <h3 className="truncate text-sm font-semibold">{title}</h3>
              {action && <div className="shrink-0">{action}</div>}
            </div>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="min-w-0 space-y-3">{children}</div>
      </div>
    </div>
  )
}

function RouteField({
  label,
  description,
  children,
}: {
  label: string
  description?: string
  children: ReactNode
}) {
  return (
    <div className="grid gap-1.5 md:grid-cols-[112px_minmax(0,1fr)] md:items-start">
      <div className="min-w-0 pt-2">
        <div className="text-sm font-medium">{label}</div>
        {description && <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{description}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

function ProviderSelect({
  value,
  onChange,
  providers,
}: {
  value: string
  onChange: (value: string) => void
  providers: readonly ProviderOption[]
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full sm:w-[280px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {providers.map((provider) => (
          <SelectItem key={provider.value} value={provider.value}>
            {provider.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function PresetSelect({
  value,
  presets,
  onChange,
}: {
  value: string
  presets: ModelPreset[]
  onChange: (value: string) => void
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full sm:w-[280px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {presets.map((preset) => (
          <SelectItem key={preset.id} value={preset.id}>
            {preset.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function OpenAiPresetModelFields({
  presetId,
  preset,
  presets,
  modelValue,
  modelLabel,
  placeholder,
  onPresetChange,
  onModelChange,
}: {
  presetId: string
  preset?: ModelPreset
  presets: ModelPreset[]
  modelValue?: string
  modelLabel: string
  placeholder: string
  onPresetChange: (value: string) => void
  onModelChange: (value: string) => void
}) {
  return (
    <div className="space-y-3">
      <RouteField label="Preset" description="Base URL and API key">
        <PresetSelect value={presetId} presets={presets} onChange={onPresetChange} />
      </RouteField>
      <RouteField label="Model">
        {preset ? (
          <PresetModelSelector
            presetId={presetId}
            baseUrl={preset.baseUrl}
            apiKey={preset.apiKey}
            value={modelValue || ""}
            onValueChange={onModelChange}
            label={modelLabel}
            placeholder={placeholder}
          />
        ) : (
          <p className="py-2 text-sm text-muted-foreground">Select a valid OpenAI-compatible preset.</p>
        )}
      </RouteField>
    </div>
  )
}

function DisabledRouteNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
      {children}
    </p>
  )
}

export function Component() {
  const configQuery = useConfigQuery()
  const saveConfigMutation = useSaveConfigMutation()
  const transcriptProcessingPromptSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [transcriptProcessingPromptDraft, setTranscriptProcessingPromptDraft] = useState("")

  const saveConfig = useCallback((updates: Partial<Config>) => {
    if (!configQuery.data) return
    saveConfigMutation.mutate({ config: { ...configQuery.data, ...updates } })
  }, [configQuery.data, saveConfigMutation])

  const flushTranscriptProcessingPromptSave = useCallback((value: string) => {
    if (transcriptProcessingPromptSaveTimeoutRef.current) {
      clearTimeout(transcriptProcessingPromptSaveTimeoutRef.current)
      transcriptProcessingPromptSaveTimeoutRef.current = null
    }
    saveConfig({ transcriptPostProcessingPrompt: value })
  }, [saveConfig])

  const updateTranscriptProcessingPromptDraft = useCallback((value: string) => {
    setTranscriptProcessingPromptDraft(value)
    if (transcriptProcessingPromptSaveTimeoutRef.current) {
      clearTimeout(transcriptProcessingPromptSaveTimeoutRef.current)
    }
    transcriptProcessingPromptSaveTimeoutRef.current = setTimeout(() => {
      transcriptProcessingPromptSaveTimeoutRef.current = null
      saveConfig({ transcriptPostProcessingPrompt: value })
    }, SETTINGS_TEXT_SAVE_DEBOUNCE_MS)
  }, [saveConfig])

  useEffect(() => {
    setTranscriptProcessingPromptDraft(configQuery.data?.transcriptPostProcessingPrompt ?? "")
  }, [configQuery.data?.transcriptPostProcessingPrompt])

  useEffect(() => {
    return () => {
      if (transcriptProcessingPromptSaveTimeoutRef.current) {
        clearTimeout(transcriptProcessingPromptSaveTimeoutRef.current)
      }
    }
  }, [])

  const allPresets = useMemo(() => {
    const builtIn = getBuiltInModelPresets()
    const custom = configQuery.data?.modelPresets || []
    const mergedBuiltIn = builtIn.map((preset) => {
      const saved = custom.find((candidate) => candidate.id === preset.id)
      if (saved) {
        const merged = { ...preset, ...saved }
        if (preset.id === DEFAULT_MODEL_PRESET_ID && !merged.apiKey && configQuery.data?.openaiApiKey) {
          merged.apiKey = configQuery.data.openaiApiKey
        }
        return merged
      }
      if (preset.id === DEFAULT_MODEL_PRESET_ID && configQuery.data?.openaiApiKey) {
        return { ...preset, apiKey: configQuery.data.openaiApiKey }
      }
      return preset
    })

    return [...mergedBuiltIn, ...custom.filter((preset) => !preset.isBuiltIn)]
  }, [configQuery.data?.modelPresets, configQuery.data?.openaiApiKey])

  const getPresetById = useCallback((presetId?: string): ModelPreset | undefined => {
    if (!presetId) return undefined
    return allPresets.find((preset) => preset.id === presetId)
  }, [allPresets])

  if (!configQuery.data) return null

  const config = configQuery.data
  const currentPresetId = config.currentModelPresetId || DEFAULT_MODEL_PRESET_ID
  const currentPreset = getPresetById(currentPresetId)
  const sttProviderId = config.sttProviderId || "openai"
  const transcriptProcessingProviderId = config.transcriptPostProcessingProviderId || "openai"
  const ttsProviderId = config.ttsProviderId || "openai"
  const agentProviderId = config.agentProviderId || config.mcpToolsProviderId || "openai"
  const transcriptProcessingEnabled = config.transcriptPostProcessingEnabled ?? false
  const dualModelEnabled = config.dualModelEnabled ?? false
  const summarizationProviderId = (config.dualModelWeakProviderId || "openai") as CHAT_PROVIDER_ID
  const weakPresetId = config.dualModelWeakPresetId || config.currentModelPresetId || DEFAULT_MODEL_PRESET_ID
  const weakPreset = getPresetById(weakPresetId)

  const agentOpenAiModel = config.agentOpenaiModel || config.mcpToolsOpenaiModel || currentPreset?.agentModel || currentPreset?.mcpToolsModel || ""
  const agentModelValue = agentProviderId === "groq"
    ? config.agentGroqModel || config.mcpToolsGroqModel || DEFAULT_CHAT_MODELS.groq
    : agentProviderId === "gemini"
      ? config.agentGeminiModel || config.mcpToolsGeminiModel || DEFAULT_CHAT_MODELS.gemini
      : agentProviderId === "chatgpt-web"
        ? config.agentChatgptWebModel || config.mcpToolsChatgptWebModel || DEFAULT_CHAT_MODELS["chatgpt-web"]
        : agentOpenAiModel
  const transcriptProcessingOpenAiModel =
    config.transcriptPostProcessingOpenaiModel || currentPreset?.transcriptProcessingModel || ""
  const transcriptProcessingModel = transcriptProcessingProviderId === "openai"
    ? transcriptProcessingOpenAiModel
    : transcriptProcessingProviderId === "groq"
      ? config.transcriptPostProcessingGroqModel || config.agentGroqModel || config.mcpToolsGroqModel || DEFAULT_CHAT_MODELS.groq
      : transcriptProcessingProviderId === "gemini"
        ? config.transcriptPostProcessingGeminiModel || config.agentGeminiModel || config.mcpToolsGeminiModel || DEFAULT_CHAT_MODELS.gemini
        : config.transcriptPostProcessingChatgptWebModel || config.agentChatgptWebModel || config.mcpToolsChatgptWebModel || DEFAULT_CHAT_MODELS["chatgpt-web"]
  const summarizationModelValue = summarizationProviderId === "groq"
    ? config.dualModelWeakGroqModel || config.agentGroqModel || config.mcpToolsGroqModel || DEFAULT_CHAT_MODELS.groq
    : summarizationProviderId === "gemini"
      ? config.dualModelWeakGeminiModel || config.agentGeminiModel || config.mcpToolsGeminiModel || DEFAULT_CHAT_MODELS.gemini
      : summarizationProviderId === "chatgpt-web"
        ? config.dualModelWeakChatgptWebModel || config.agentChatgptWebModel || config.mcpToolsChatgptWebModel || DEFAULT_CHAT_MODELS["chatgpt-web"]
        : config.dualModelWeakModelName || weakPreset?.summarizationModel

  const saveModelWithPreset = (
    presetId: string,
    modelType: OpenAiPresetModelType,
    modelId: string,
    configUpdates: Partial<Config>,
  ) => {
    const existingPresets = config.modelPresets || []
    const presetIndex = existingPresets.findIndex((preset) => preset.id === presetId)
    let updatedPresets: ModelPreset[]

    if (presetIndex >= 0) {
      updatedPresets = existingPresets.map((preset) =>
        preset.id === presetId
          ? { ...preset, [modelType]: modelId, updatedAt: Date.now() }
          : preset,
      )
    } else {
      const builtInPreset = getBuiltInModelPresets().find((preset) => preset.id === presetId)
      if (!builtInPreset) {
        saveConfig(configUpdates)
        return
      }
      updatedPresets = [
        ...existingPresets,
        {
          ...builtInPreset,
          apiKey: "",
          [modelType]: modelId,
          updatedAt: Date.now(),
        },
      ]
    }

    saveConfig({
      ...configUpdates,
      modelPresets: updatedPresets,
    })
  }

  const handleCurrentPresetChange = (presetId: string) => {
    const preset = getPresetById(presetId)
    if (!preset) {
      saveConfig({ currentModelPresetId: presetId })
      return
    }

    const updates: Partial<Config> = {
      currentModelPresetId: presetId,
      openaiBaseUrl: preset.baseUrl,
      openaiApiKey: preset.apiKey,
    }
    const agentModel = preset.agentModel || preset.mcpToolsModel
    if (agentModel) {
      updates.agentOpenaiModel = agentModel
      updates.mcpToolsOpenaiModel = agentModel
    }
    if (preset.transcriptProcessingModel) {
      updates.transcriptPostProcessingOpenaiModel = preset.transcriptProcessingModel
    }
    if (preset.summarizationModel && !config.dualModelWeakPresetId) {
      updates.dualModelWeakModelName = preset.summarizationModel
    }
    saveConfig(updates)
  }

  const handleSummarizationPresetChange = (presetId: string) => {
    const preset = getPresetById(presetId)
    saveConfig({
      dualModelWeakPresetId: presetId,
      ...(preset?.summarizationModel ? { dualModelWeakModelName: preset.summarizationModel } : {}),
    })
  }

  const handleAgentProviderChange = (value: string) => {
    const providerId = value as CHAT_PROVIDER_ID
    const updates: Partial<Config> = { agentProviderId: providerId }

    if (providerId === "groq" && !config.agentGroqModel && !config.mcpToolsGroqModel) {
      updates.agentGroqModel = DEFAULT_CHAT_MODELS.groq
    } else if (providerId === "gemini" && !config.agentGeminiModel && !config.mcpToolsGeminiModel) {
      updates.agentGeminiModel = DEFAULT_CHAT_MODELS.gemini
    } else if (providerId === "chatgpt-web" && !config.agentChatgptWebModel && !config.mcpToolsChatgptWebModel) {
      updates.agentChatgptWebModel = DEFAULT_CHAT_MODELS["chatgpt-web"]
    }

    saveConfig(updates)
  }

  const handleSummarizationProviderChange = (value: string) => {
    const providerId = value as CHAT_PROVIDER_ID
    const updates: Partial<Config> = { dualModelWeakProviderId: providerId }

    if (providerId === "groq" && !config.dualModelWeakGroqModel) {
      updates.dualModelWeakGroqModel = config.agentGroqModel || config.mcpToolsGroqModel || DEFAULT_CHAT_MODELS.groq
    } else if (providerId === "gemini" && !config.dualModelWeakGeminiModel) {
      updates.dualModelWeakGeminiModel = config.agentGeminiModel || config.mcpToolsGeminiModel || DEFAULT_CHAT_MODELS.gemini
    } else if (providerId === "chatgpt-web" && !config.dualModelWeakChatgptWebModel) {
      updates.dualModelWeakChatgptWebModel =
        config.agentChatgptWebModel || config.mcpToolsChatgptWebModel || DEFAULT_CHAT_MODELS["chatgpt-web"]
    }

    saveConfig(updates)
  }

  const handleTranscriptProcessingProviderChange = (value: string) => {
    const providerId = value as CHAT_PROVIDER_ID
    const updates: Partial<Config> = { transcriptPostProcessingProviderId: providerId }

    if (providerId === "groq" && !config.transcriptPostProcessingGroqModel) {
      updates.transcriptPostProcessingGroqModel = config.agentGroqModel || config.mcpToolsGroqModel || DEFAULT_CHAT_MODELS.groq
    } else if (providerId === "gemini" && !config.transcriptPostProcessingGeminiModel) {
      updates.transcriptPostProcessingGeminiModel =
        config.agentGeminiModel || config.mcpToolsGeminiModel || DEFAULT_CHAT_MODELS.gemini
    } else if (providerId === "chatgpt-web" && !config.transcriptPostProcessingChatgptWebModel) {
      updates.transcriptPostProcessingChatgptWebModel =
        config.agentChatgptWebModel || config.mcpToolsChatgptWebModel || DEFAULT_CHAT_MODELS["chatgpt-web"]
    }

    saveConfig(updates)
  }

  const saveSummarizationModel = (value: string) => {
    if (summarizationProviderId === "groq") {
      saveConfig({ dualModelWeakGroqModel: value })
    } else if (summarizationProviderId === "gemini") {
      saveConfig({ dualModelWeakGeminiModel: value })
    } else if (summarizationProviderId === "chatgpt-web") {
      saveConfig({ dualModelWeakChatgptWebModel: value })
    } else {
      saveModelWithPreset(weakPresetId, "summarizationModel", value, { dualModelWeakModelName: value })
    }
  }

  const saveTranscriptProcessingModel = (value: string) => {
    if (transcriptProcessingProviderId === "groq") {
      saveConfig({ transcriptPostProcessingGroqModel: value })
    } else if (transcriptProcessingProviderId === "gemini") {
      saveConfig({ transcriptPostProcessingGeminiModel: value })
    } else if (transcriptProcessingProviderId === "chatgpt-web") {
      saveConfig({ transcriptPostProcessingChatgptWebModel: value })
    } else {
      saveModelWithPreset(currentPresetId, "transcriptProcessingModel", value, {
        transcriptPostProcessingOpenaiModel: value,
      })
    }
  }

  const saveAgentModel = (value: string) => {
    if (agentProviderId === "groq") {
      saveConfig({ agentGroqModel: value })
    } else if (agentProviderId === "gemini") {
      saveConfig({ agentGeminiModel: value })
    } else if (agentProviderId === "chatgpt-web") {
      saveConfig({ agentChatgptWebModel: value })
    } else {
      saveModelWithPreset(currentPresetId, "agentModel", value, {
        agentOpenaiModel: value,
        mcpToolsOpenaiModel: value,
      })
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 pb-10 pt-8">
      <div className="space-y-6">
        <div className="rounded-lg border bg-muted/20 px-4 py-3">
          <h2 className="text-sm font-semibold">Model Selection</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure each model-powered job in one place. Provider credentials, base URLs, and local engine downloads
            stay on the Providers page.
          </p>
        </div>

        <ControlGroup title="Model Routing">
          <RouteRow
            icon={Bot}
            title="Agent"
            description="Main reasoning model for agent work, skills, tools, and MCP calls."
          >
            <RouteField label="Provider">
              <ProviderSelect
                value={agentProviderId}
                onChange={handleAgentProviderChange}
                providers={CHAT_PROVIDERS}
              />
            </RouteField>
            {agentProviderId === "openai" ? (
              <OpenAiPresetModelFields
                presetId={currentPresetId}
                preset={currentPreset}
                presets={allPresets}
                modelValue={agentOpenAiModel}
                modelLabel="Agent model"
                placeholder="Select model for agent reasoning"
                onPresetChange={handleCurrentPresetChange}
                onModelChange={saveAgentModel}
              />
            ) : (
              <RouteField label="Model">
                <ModelSelector
                  providerId={agentProviderId}
                  value={agentModelValue}
                  onValueChange={saveAgentModel}
                  label="Agent model"
                  placeholder="Select model for agent reasoning"
                  excludeTranscriptionOnlyModels={true}
                />
              </RouteField>
            )}
          </RouteRow>

          <RouteRow
            icon={BookOpen}
            title="Summarization"
            description="Optional lightweight model for UI summaries and knowledge-note summaries."
            action={
              <Switch
                checked={dualModelEnabled}
                onCheckedChange={(checked) => saveConfig({ dualModelEnabled: checked })}
              />
            }
          >
            {dualModelEnabled ? (
              <>
                <RouteField label="Provider">
                  <ProviderSelect
                    value={summarizationProviderId}
                    onChange={handleSummarizationProviderChange}
                    providers={CHAT_PROVIDERS}
                  />
                </RouteField>
                {summarizationProviderId === "openai" ? (
                  <OpenAiPresetModelFields
                    presetId={weakPresetId}
                    preset={weakPreset}
                    presets={allPresets}
                    modelValue={summarizationModelValue}
                    modelLabel="Summarization model"
                    placeholder="Select model for summarization"
                    onPresetChange={handleSummarizationPresetChange}
                    onModelChange={saveSummarizationModel}
                  />
                ) : (
                  <RouteField label="Model">
                    <ModelSelector
                      providerId={summarizationProviderId}
                      value={summarizationModelValue || ""}
                      onValueChange={saveSummarizationModel}
                      label="Summarization model"
                      placeholder="Select model for summarization"
                      excludeTranscriptionOnlyModels={true}
                    />
                  </RouteField>
                )}
                <div className="grid gap-3 xl:grid-cols-2">
                  <RouteField label="Frequency">
                    <Select
                      value={config.dualModelSummarizationFrequency || "every_response"}
                      onValueChange={(value) =>
                        saveConfig({ dualModelSummarizationFrequency: value as "every_response" | "major_steps_only" })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="every_response">Every Response</SelectItem>
                        <SelectItem value="major_steps_only">Major Steps Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </RouteField>
                  <RouteField label="Detail">
                    <Select
                      value={config.dualModelSummaryDetailLevel || "compact"}
                      onValueChange={(value) =>
                        saveConfig({ dualModelSummaryDetailLevel: value as "compact" | "detailed" })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="compact">Compact</SelectItem>
                        <SelectItem value="detailed">Detailed</SelectItem>
                      </SelectContent>
                    </Select>
                  </RouteField>
                </div>
              </>
            ) : (
              <DisabledRouteNote>Summaries use the Agent model while this is off.</DisabledRouteNote>
            )}
          </RouteRow>

          <RouteRow
            icon={FileText}
            title="Transcript Cleanup"
            description="Optional pass that cleans transcription text before it is used elsewhere."
            action={
              <Switch
                checked={transcriptProcessingEnabled}
                onCheckedChange={(checked) => saveConfig({ transcriptPostProcessingEnabled: checked })}
              />
            }
          >
            {transcriptProcessingEnabled ? (
              <>
                <RouteField label="Provider">
                  <ProviderSelect
                    value={transcriptProcessingProviderId}
                    onChange={handleTranscriptProcessingProviderChange}
                    providers={CHAT_PROVIDERS}
                  />
                </RouteField>
                {transcriptProcessingProviderId === "openai" ? (
                  <OpenAiPresetModelFields
                    presetId={currentPresetId}
                    preset={currentPreset}
                    presets={allPresets}
                    modelValue={transcriptProcessingModel}
                    modelLabel="Transcript cleanup model"
                    placeholder="Select model for transcript cleanup"
                    onPresetChange={handleCurrentPresetChange}
                    onModelChange={saveTranscriptProcessingModel}
                  />
                ) : (
                  <RouteField label="Model">
                    <ModelSelector
                      providerId={transcriptProcessingProviderId}
                      value={transcriptProcessingModel || ""}
                      onValueChange={saveTranscriptProcessingModel}
                      label="Transcript cleanup model"
                      placeholder="Select model for transcript cleanup"
                      excludeTranscriptionOnlyModels={true}
                    />
                  </RouteField>
                )}
                <details className="rounded-md border">
                  <summary className="cursor-pointer px-3 py-2 text-sm font-medium">Prompt</summary>
                  <div className="border-t p-3">
                    <Textarea
                      rows={6}
                      value={transcriptProcessingPromptDraft}
                      onChange={(event) => updateTranscriptProcessingPromptDraft(event.currentTarget.value)}
                      onBlur={(event) => flushTranscriptProcessingPromptSave(event.currentTarget.value)}
                      placeholder="Custom instructions for transcript processing..."
                      className="min-h-[120px]"
                    />
                    <p className="mt-2 text-xs text-muted-foreground">
                      Use <span className="select-text">{"{transcript}"}</span> to insert the original transcript.
                    </p>
                  </div>
                </details>
              </>
            ) : (
              <DisabledRouteNote>Raw transcription text is passed through unchanged.</DisabledRouteNote>
            )}
          </RouteRow>

          <RouteRow
            icon={Mic}
            title="Speech-to-Text"
            description="Transcription model for microphone input and dictated messages."
          >
            <RouteField label="Provider">
              <ProviderSelect
                value={sttProviderId}
                onChange={(value) => saveConfig({ sttProviderId: value as STT_PROVIDER_ID })}
                providers={STT_PROVIDERS}
              />
            </RouteField>
            <RouteField label="Model">
              {sttProviderId === "parakeet" ? (
                <p className="py-2 text-sm text-muted-foreground">
                  Parakeet uses the local model bundle managed on Providers.
                </p>
              ) : (
                <ModelSelector
                  providerId={sttProviderId}
                  value={
                    sttProviderId === "openai"
                      ? config.openaiSttModel || getDefaultSttModel("openai")
                      : config.groqSttModel || getDefaultSttModel("groq")
                  }
                  onValueChange={(value) =>
                    saveConfig(sttProviderId === "openai" ? { openaiSttModel: value } : { groqSttModel: value })
                  }
                  label="Speech-to-Text model"
                  placeholder="Select model for speech transcription"
                  onlyTranscriptionModels={true}
                />
              )}
            </RouteField>
          </RouteRow>

          <RouteRow
            icon={Volume2}
            title="Text-to-Speech"
            description="Voice model, voice identity, and synthesis quality for spoken replies."
          >
            <RouteField label="Provider">
              <ProviderSelect
                value={ttsProviderId}
                onChange={(value) => saveConfig({ ttsProviderId: value as TTS_PROVIDER_ID })}
                providers={TTS_PROVIDERS}
              />
            </RouteField>

            {ttsProviderId === "openai" && (
              <>
                <RouteField label="Model">
                  <Select
                    value={config.openaiTtsModel || "gpt-4o-mini-tts"}
                    onValueChange={(value) =>
                      saveConfig({ openaiTtsModel: value as "gpt-4o-mini-tts" | "tts-1" | "tts-1-hd" })
                    }
                  >
                    <SelectTrigger className="w-full sm:w-[280px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OPENAI_TTS_MODELS.map((model) => (
                        <SelectItem key={model.value} value={model.value}>{model.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </RouteField>
                <RouteField label="Voice">
                  <Select
                    value={config.openaiTtsVoice || "alloy"}
                    onValueChange={(value) =>
                      saveConfig({ openaiTtsVoice: value as "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer" })
                    }
                  >
                    <SelectTrigger className="w-full sm:w-[280px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OPENAI_TTS_VOICES.map((voice) => (
                        <SelectItem key={voice.value} value={voice.value}>{voice.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </RouteField>
                <RouteField label="Speed">
                  <Input
                    type="number"
                    min="0.25"
                    max="4.0"
                    step="0.25"
                    defaultValue={config.openaiTtsSpeed?.toString()}
                    placeholder="1.0"
                    className="w-full sm:w-[140px]"
                    onChange={(event) => {
                      const speed = parseFloat(event.currentTarget.value)
                      if (!isNaN(speed) && speed >= 0.25 && speed <= 4.0) {
                        saveConfig({ openaiTtsSpeed: speed })
                      }
                    }}
                  />
                </RouteField>
              </>
            )}

            {ttsProviderId === "groq" && (
              <>
                <RouteField label="Model">
                  <Select
                    value={config.groqTtsModel || "canopylabs/orpheus-v1-english"}
                    onValueChange={(value) => {
                      const defaultVoice = value === "canopylabs/orpheus-arabic-saudi" ? "fahad" : "troy"
                      saveConfig({
                        groqTtsModel: value as "canopylabs/orpheus-v1-english" | "canopylabs/orpheus-arabic-saudi",
                        groqTtsVoice: defaultVoice,
                      })
                    }}
                  >
                    <SelectTrigger className="w-full sm:w-[280px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GROQ_TTS_MODELS.map((model) => (
                        <SelectItem key={model.value} value={model.value}>{model.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </RouteField>
                <RouteField label="Voice">
                  <Select
                    value={config.groqTtsVoice || (config.groqTtsModel === "canopylabs/orpheus-arabic-saudi" ? "fahad" : "troy")}
                    onValueChange={(value) => saveConfig({ groqTtsVoice: value })}
                  >
                    <SelectTrigger className="w-full sm:w-[280px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(config.groqTtsModel === "canopylabs/orpheus-arabic-saudi" ? GROQ_TTS_VOICES_ARABIC : GROQ_TTS_VOICES_ENGLISH).map((voice) => (
                        <SelectItem key={voice.value} value={voice.value}>{voice.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </RouteField>
              </>
            )}

            {ttsProviderId === "gemini" && (
              <>
                <RouteField label="Model">
                  <Select
                    value={config.geminiTtsModel || "gemini-2.5-flash-preview-tts"}
                    onValueChange={(value) =>
                      saveConfig({ geminiTtsModel: value as "gemini-2.5-flash-preview-tts" | "gemini-2.5-pro-preview-tts" })
                    }
                  >
                    <SelectTrigger className="w-full sm:w-[280px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GEMINI_TTS_MODELS.map((model) => (
                        <SelectItem key={model.value} value={model.value}>{model.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </RouteField>
                <RouteField label="Voice">
                  <Select value={config.geminiTtsVoice || "Kore"} onValueChange={(value) => saveConfig({ geminiTtsVoice: value })}>
                    <SelectTrigger className="w-full sm:w-[280px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GEMINI_TTS_VOICES.map((voice) => (
                        <SelectItem key={voice.value} value={voice.value}>{voice.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </RouteField>
              </>
            )}

            {ttsProviderId === "edge" && (
              <>
                <RouteField label="Model">
                  <Select value={config.edgeTtsModel || "edge-tts"} onValueChange={(value) => saveConfig({ edgeTtsModel: value as "edge-tts" })}>
                    <SelectTrigger className="w-full sm:w-[280px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EDGE_TTS_MODELS.map((model) => (
                        <SelectItem key={model.value} value={model.value}>{model.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </RouteField>
                <RouteField label="Voice">
                  <Select value={config.edgeTtsVoice || "en-US-AriaNeural"} onValueChange={(value) => saveConfig({ edgeTtsVoice: value })}>
                    <SelectTrigger className="w-full sm:w-[280px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EDGE_TTS_VOICES.map((voice) => (
                        <SelectItem key={voice.value} value={voice.value}>{voice.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </RouteField>
                <RouteField label="Speed">
                  <Input
                    type="number"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    defaultValue={config.edgeTtsRate?.toString()}
                    placeholder="1.0"
                    className="w-full sm:w-[140px]"
                    onChange={(event) => {
                      const speed = parseFloat(event.currentTarget.value)
                      if (!isNaN(speed) && speed >= 0.5 && speed <= 2.0) {
                        saveConfig({ edgeTtsRate: speed })
                      }
                    }}
                  />
                </RouteField>
                <p className="text-xs text-muted-foreground">Edge TTS is cloud-based and does not require an API key.</p>
              </>
            )}

            {ttsProviderId === "kitten" && (
              <>
                <RouteField label="Voice">
                  <Select value={String(config.kittenVoiceId ?? 0)} onValueChange={(value) => saveConfig({ kittenVoiceId: parseInt(value, 10) })}>
                    <SelectTrigger className="w-full sm:w-[280px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {KITTEN_TTS_VOICES.map((voice) => (
                        <SelectItem key={voice.value} value={String(voice.value)}>{voice.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </RouteField>
                <p className="text-xs text-muted-foreground">Kitten download and voice testing live on Providers.</p>
              </>
            )}

            {ttsProviderId === "supertonic" && (
              <>
                <RouteField label="Voice">
                  <Select value={config.supertonicVoice ?? "M1"} onValueChange={(value) => saveConfig({ supertonicVoice: value })}>
                    <SelectTrigger className="w-full sm:w-[280px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPERTONIC_TTS_VOICES.map((voice) => (
                        <SelectItem key={voice.value} value={voice.value}>{voice.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </RouteField>
                <RouteField label="Language">
                  <Select value={config.supertonicLanguage ?? "en"} onValueChange={(value) => saveConfig({ supertonicLanguage: value })}>
                    <SelectTrigger className="w-full sm:w-[280px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPERTONIC_TTS_LANGUAGES.map((language) => (
                        <SelectItem key={language.value} value={language.value}>{language.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </RouteField>
                <div className="grid gap-3 xl:grid-cols-2">
                  <RouteField label="Speed">
                    <Input
                      type="number"
                      min={0.5}
                      max={2.0}
                      step={0.05}
                      className="w-full sm:w-[140px]"
                      value={config.supertonicSpeed ?? 1.05}
                      onChange={(event) => {
                        const val = parseFloat(event.currentTarget.value)
                        if (!isNaN(val) && val >= 0.5 && val <= 2.0) {
                          saveConfig({ supertonicSpeed: val })
                        }
                      }}
                    />
                  </RouteField>
                  <RouteField label="Quality">
                    <Input
                      type="number"
                      min={2}
                      max={10}
                      step={1}
                      className="w-full sm:w-[140px]"
                      value={config.supertonicSteps ?? 5}
                      onChange={(event) => {
                        const val = parseInt(event.currentTarget.value, 10)
                        if (!isNaN(val) && val >= 2 && val <= 10) {
                          saveConfig({ supertonicSteps: val })
                        }
                      }}
                    />
                  </RouteField>
                </div>
                <p className="text-xs text-muted-foreground">Supertonic downloads and quick voice tests live on Providers.</p>
              </>
            )}
          </RouteRow>
        </ControlGroup>

        <ControlGroup
          title={
            <span className="inline-flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-muted-foreground" />
              OpenAI-Compatible Presets
            </span>
          }
          collapsible
          defaultCollapsed
        >
          <div className="px-3 py-3">
            <ModelPresetManager showAgentModel={false} showTranscriptCleanupModel={false} />
          </div>
        </ControlGroup>
      </div>
    </div>
  )
}
