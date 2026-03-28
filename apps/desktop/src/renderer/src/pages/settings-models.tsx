import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ElementType,
  type ReactNode,
} from "react"
import {
  Control,
  ControlGroup,
  ControlLabel,
} from "@renderer/components/ui/control"
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
import {
  useConfigQuery,
  useSaveConfigMutation,
} from "@renderer/lib/query-client"
import { ModelPresetManager } from "@renderer/components/model-preset-manager"
import {
  ModelSelector,
  ProviderModelSelector,
} from "@renderer/components/model-selector"
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
  KITTEN_TTS_VOICES,
  SUPERTONIC_TTS_LANGUAGES,
  SUPERTONIC_TTS_VOICES,
  DEFAULT_MODEL_PRESET_ID,
  getBuiltInModelPresets,
  resolveChatModelSelection,
  resolveChatProviderId,
  resolveSttModelSelection,
  resolveSttProviderId,
  resolveTtsProviderId,
  resolveTtsSelection,
} from "@dotagents/shared"
import {
  Mic,
  FileText,
  Volume2,
  Bot,
  Zap,
  BookOpen,
  Settings2,
} from "lucide-react"

const SETTINGS_TEXT_SAVE_DEBOUNCE_MS = 400

function RoleProviderSelector({
  label,
  tooltip,
  value,
  onChange,
  providers,
  icon: Icon,
}: {
  label: ReactNode
  tooltip: string
  value: string
  onChange: (value: string) => void
  providers: readonly { label: string; value: string }[]
  icon: ElementType
}) {
  return (
    <Control
      label={
        <ControlLabel
          label={
            <span className="flex items-center gap-2">
              <Icon className="text-muted-foreground h-4 w-4" />
              {label}
            </span>
          }
          tooltip={tooltip}
        />
      }
      className="px-3"
    >
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full sm:w-[220px]">
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
    </Control>
  )
}

export function Component() {
  const configQuery = useConfigQuery()
  const saveConfigMutation = useSaveConfigMutation()
  const transcriptProcessingPromptSaveTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null)
  const [transcriptProcessingPromptDraft, setTranscriptProcessingPromptDraft] =
    useState("")

  const saveConfig = useCallback(
    (updates: Partial<Config>) => {
      if (!configQuery.data) return
      saveConfigMutation.mutate({ config: { ...configQuery.data, ...updates } })
    },
    [configQuery.data, saveConfigMutation],
  )

  const flushTranscriptProcessingPromptSave = useCallback(
    (value: string) => {
      if (transcriptProcessingPromptSaveTimeoutRef.current) {
        clearTimeout(transcriptProcessingPromptSaveTimeoutRef.current)
        transcriptProcessingPromptSaveTimeoutRef.current = null
      }
      saveConfig({ transcriptPostProcessingPrompt: value })
    },
    [saveConfig],
  )

  const updateTranscriptProcessingPromptDraft = useCallback(
    (value: string) => {
      setTranscriptProcessingPromptDraft(value)
      if (transcriptProcessingPromptSaveTimeoutRef.current) {
        clearTimeout(transcriptProcessingPromptSaveTimeoutRef.current)
      }
      transcriptProcessingPromptSaveTimeoutRef.current = setTimeout(() => {
        transcriptProcessingPromptSaveTimeoutRef.current = null
        saveConfig({ transcriptPostProcessingPrompt: value })
      }, SETTINGS_TEXT_SAVE_DEBOUNCE_MS)
    },
    [saveConfig],
  )

  useEffect(() => {
    setTranscriptProcessingPromptDraft(
      configQuery.data?.transcriptPostProcessingPrompt ?? "",
    )
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
        if (
          preset.id === DEFAULT_MODEL_PRESET_ID &&
          !merged.apiKey &&
          configQuery.data?.openaiApiKey
        ) {
          merged.apiKey = configQuery.data.openaiApiKey
        }
        return merged
      }
      if (
        preset.id === DEFAULT_MODEL_PRESET_ID &&
        configQuery.data?.openaiApiKey
      ) {
        return { ...preset, apiKey: configQuery.data.openaiApiKey }
      }
      return preset
    })

    return [...mergedBuiltIn, ...custom.filter((preset) => !preset.isBuiltIn)]
  }, [configQuery.data?.modelPresets, configQuery.data?.openaiApiKey])

  const getPresetById = useCallback(
    (presetId?: string): ModelPreset | undefined => {
      if (!presetId) return undefined
      return allPresets.find((preset) => preset.id === presetId)
    },
    [allPresets],
  )

  if (!configQuery.data) return null

  const config = configQuery.data
  const sttProviderId = resolveSttProviderId(config)
  const transcriptProcessingProviderId = resolveChatProviderId(
    config,
    "transcript",
  )
  const ttsProviderId = resolveTtsProviderId(config)
  const agentProviderId = resolveChatProviderId(config)
  const transcriptProcessingEnabled =
    config.transcriptPostProcessingEnabled ?? false
  const usesOpenAiCompatiblePreset =
    agentProviderId === "openai" ||
    (transcriptProcessingEnabled &&
      transcriptProcessingProviderId === "openai") ||
    (config.dualModelEnabled ?? false)
  const { model: transcriptProcessingModel } = resolveChatModelSelection(
    config,
    "transcript",
  )
  const openaiSttSelection = resolveSttModelSelection(config, "openai")
  const groqSttSelection = resolveSttModelSelection(config, "groq")
  const openaiTtsSelection = resolveTtsSelection(config, "openai")
  const groqTtsSelection = resolveTtsSelection(config, "groq")
  const geminiTtsSelection = resolveTtsSelection(config, "gemini")
  const kittenTtsSelection = resolveTtsSelection(config, "kitten")
  const supertonicTtsSelection = resolveTtsSelection(config, "supertonic")
  const dualModelEnabled = config.dualModelEnabled ?? false
  const strongPresetId =
    config.dualModelStrongPresetId ||
    config.currentModelPresetId ||
    DEFAULT_MODEL_PRESET_ID
  const weakPresetId =
    config.dualModelWeakPresetId ||
    config.currentModelPresetId ||
    DEFAULT_MODEL_PRESET_ID
  const strongPreset = getPresetById(strongPresetId)
  const weakPreset = getPresetById(weakPresetId)

  return (
    <div className="mx-auto max-w-4xl px-6 pb-10 pt-8">
      <div className="space-y-6">
        <div className="bg-muted/20 rounded-lg border px-4 py-3">
          <h2 className="text-sm font-semibold">Model Selection</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Choose which provider powers each job, then pick the model or voice
            for that job here. API keys, base URLs, and local engine downloads
            live on the Providers page.
          </p>
        </div>

        <ControlGroup title="Choose a Provider for Each Job" collapsible>
          <RoleProviderSelector
            label="Speech-to-Text"
            tooltip="Choose which provider listens to your audio and turns it into text."
            value={sttProviderId}
            onChange={(value) =>
              saveConfig({ sttProviderId: value as STT_PROVIDER_ID })
            }
            providers={STT_PROVIDERS}
            icon={Mic}
          />

          <RoleProviderSelector
            label="Text-to-Speech"
            tooltip="Choose which provider turns text back into audio."
            value={ttsProviderId}
            onChange={(value) =>
              saveConfig({ ttsProviderId: value as TTS_PROVIDER_ID })
            }
            providers={TTS_PROVIDERS}
            icon={Volume2}
          />

          <RoleProviderSelector
            label="Agent/MCP Tools"
            tooltip="Choose which provider powers the main agent model for tool calling and reasoning."
            value={agentProviderId}
            onChange={(value) =>
              saveConfig({ mcpToolsProviderId: value as CHAT_PROVIDER_ID })
            }
            providers={CHAT_PROVIDERS}
            icon={Bot}
          />
        </ControlGroup>

        <ControlGroup title="Transcript Processing" collapsible>
          <Control
            label={
              <ControlLabel
                label="Enabled"
                tooltip="Optionally clean up punctuation, formatting, or wording after transcription and before the transcript is used elsewhere."
              />
            }
            className="px-3"
          >
            <Switch
              checked={transcriptProcessingEnabled}
              onCheckedChange={(checked) =>
                saveConfig({ transcriptPostProcessingEnabled: checked })
              }
            />
          </Control>

          {transcriptProcessingEnabled && (
            <>
              <RoleProviderSelector
                label="Provider"
                tooltip="Choose which provider handles transcript processing when it is enabled."
                value={transcriptProcessingProviderId}
                onChange={(value) =>
                  saveConfig({
                    transcriptPostProcessingProviderId:
                      value as CHAT_PROVIDER_ID,
                  })
                }
                providers={CHAT_PROVIDERS}
                icon={FileText}
              />

              <div className="border-t px-3 py-2">
                {transcriptProcessingProviderId === "openai" ? (
                  <Control
                    label={
                      <ControlLabel
                        label="Transcript Processing model"
                        tooltip="OpenAI-compatible transcript processing is selected through the preset section below."
                      />
                    }
                  >
                    <p className="text-muted-foreground text-sm">
                      OpenAI-compatible transcript processing models are
                      selected in the OpenAI-Compatible Preset section below.
                    </p>
                  </Control>
                ) : (
                  <ModelSelector
                    providerId={transcriptProcessingProviderId}
                    value={transcriptProcessingModel}
                    onValueChange={(value) => {
                      if (transcriptProcessingProviderId === "groq") {
                        saveConfig({ transcriptPostProcessingGroqModel: value })
                      } else {
                        saveConfig({
                          transcriptPostProcessingGeminiModel: value,
                        })
                      }
                    }}
                    label="Transcript Processing model"
                    placeholder="Select model for transcript processing"
                    excludeTranscriptionOnlyModels={true}
                  />
                )}
              </div>

              <Control
                label={
                  <ControlLabel
                    label="Prompt"
                    tooltip="Custom prompt for transcript processing. Use {transcript} to insert the original transcript."
                  />
                }
                className="border-t px-3 py-2"
              >
                <div className="w-full space-y-2">
                  <Textarea
                    rows={6}
                    value={transcriptProcessingPromptDraft}
                    onChange={(e) =>
                      updateTranscriptProcessingPromptDraft(
                        e.currentTarget.value,
                      )
                    }
                    onBlur={(e) =>
                      flushTranscriptProcessingPromptSave(e.currentTarget.value)
                    }
                    placeholder="Custom instructions for transcript processing..."
                    className="min-h-[120px]"
                  />
                  <p className="text-muted-foreground text-xs">
                    Use <span className="select-text">{"{transcript}"}</span> to
                    insert the original transcript.
                  </p>
                </div>
              </Control>
            </>
          )}
        </ControlGroup>

        <ControlGroup title="Speech & Voice Models" collapsible>
          <div className="px-3 py-2">
            {sttProviderId === "parakeet" ? (
              <Control
                label={
                  <ControlLabel
                    label="Speech-to-Text model"
                    tooltip="Parakeet uses the local speech-to-text model bundle managed on the Providers page."
                  />
                }
              >
                <p className="text-muted-foreground text-sm">
                  Parakeet uses its local downloaded model bundle. Manage
                  installation and runtime settings on Providers.
                </p>
              </Control>
            ) : (
              <ModelSelector
                providerId={sttProviderId}
                value={
                  sttProviderId === "openai"
                    ? openaiSttSelection.model || ""
                    : groqSttSelection.model || ""
                }
                onValueChange={(value) =>
                  saveConfig(
                    sttProviderId === "openai"
                      ? { openaiSttModel: value }
                      : { groqSttModel: value },
                  )
                }
                label="Speech-to-Text model"
                placeholder="Select model for speech transcription"
                onlyTranscriptionModels={true}
              />
            )}
          </div>

          <div className="border-t px-3 py-2">
            <div className="pb-2">
              <span className="text-sm font-medium">
                Text-to-Speech model and voice
              </span>
              <p className="text-muted-foreground text-xs">
                Pick the voice stack for the currently selected text-to-speech
                provider.
              </p>
            </div>

            {ttsProviderId === "openai" && (
              <>
                <Control
                  label={
                    <ControlLabel
                      label="Text-to-Speech model"
                      tooltip="Choose the OpenAI TTS model to use."
                    />
                  }
                >
                  <Select
                    value={openaiTtsSelection.model}
                    onValueChange={(value) =>
                      saveConfig({
                        openaiTtsModel: value as
                          | "gpt-4o-mini-tts"
                          | "tts-1"
                          | "tts-1-hd",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OPENAI_TTS_MODELS.map((model) => (
                        <SelectItem key={model.value} value={model.value}>
                          {model.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Control>

                <Control
                  label={
                    <ControlLabel
                      label="Text-to-Speech voice"
                      tooltip="Choose the voice for OpenAI TTS."
                    />
                  }
                >
                  <Select
                    value={openaiTtsSelection.voice}
                    onValueChange={(value) =>
                      saveConfig({
                        openaiTtsVoice: value as
                          | "alloy"
                          | "echo"
                          | "fable"
                          | "onyx"
                          | "nova"
                          | "shimmer",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OPENAI_TTS_VOICES.map((voice) => (
                        <SelectItem key={voice.value} value={voice.value}>
                          {voice.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Control>

                <Control
                  label={
                    <ControlLabel
                      label="Text-to-Speech speed"
                      tooltip="Speech speed between 0.25 and 4.0."
                    />
                  }
                >
                  <Input
                    type="number"
                    min="0.25"
                    max="4.0"
                    step="0.25"
                    defaultValue={config.openaiTtsSpeed?.toString()}
                    placeholder="1.0"
                    onChange={(e) => {
                      const speed = parseFloat(e.currentTarget.value)
                      if (!isNaN(speed) && speed >= 0.25 && speed <= 4.0) {
                        saveConfig({ openaiTtsSpeed: speed })
                      }
                    }}
                  />
                </Control>
              </>
            )}

            {ttsProviderId === "groq" && (
              <>
                <Control
                  label={
                    <ControlLabel
                      label="Text-to-Speech model"
                      tooltip="Choose the Groq TTS model to use."
                    />
                  }
                >
                  <Select
                    value={groqTtsSelection.model}
                    onValueChange={(value) => {
                      const defaultVoice = resolveTtsSelection(
                        {
                          ...config,
                          groqTtsModel: value,
                          groqTtsVoice: undefined,
                        },
                        "groq",
                      ).voice
                      saveConfig({
                        groqTtsModel: value as
                          | "canopylabs/orpheus-v1-english"
                          | "canopylabs/orpheus-arabic-saudi",
                        groqTtsVoice: defaultVoice,
                      })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GROQ_TTS_MODELS.map((model) => (
                        <SelectItem key={model.value} value={model.value}>
                          {model.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Control>

                <Control
                  label={
                    <ControlLabel
                      label="Text-to-Speech voice"
                      tooltip="Choose the voice for Groq TTS."
                    />
                  }
                >
                  <Select
                    value={groqTtsSelection.voice}
                    onValueChange={(value) =>
                      saveConfig({ groqTtsVoice: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(groqTtsSelection.model ===
                      "canopylabs/orpheus-arabic-saudi"
                        ? GROQ_TTS_VOICES_ARABIC
                        : GROQ_TTS_VOICES_ENGLISH
                      ).map((voice) => (
                        <SelectItem key={voice.value} value={voice.value}>
                          {voice.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Control>
              </>
            )}

            {ttsProviderId === "gemini" && (
              <>
                <Control
                  label={
                    <ControlLabel
                      label="Text-to-Speech model"
                      tooltip="Choose the Gemini TTS model to use."
                    />
                  }
                >
                  <Select
                    value={geminiTtsSelection.model}
                    onValueChange={(value) =>
                      saveConfig({
                        geminiTtsModel: value as
                          | "gemini-2.5-flash-preview-tts"
                          | "gemini-2.5-pro-preview-tts",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GEMINI_TTS_MODELS.map((model) => (
                        <SelectItem key={model.value} value={model.value}>
                          {model.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Control>

                <Control
                  label={
                    <ControlLabel
                      label="Text-to-Speech voice"
                      tooltip="Choose the voice for Gemini TTS."
                    />
                  }
                >
                  <Select
                    value={geminiTtsSelection.voice}
                    onValueChange={(value) =>
                      saveConfig({ geminiTtsVoice: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GEMINI_TTS_VOICES.map((voice) => (
                        <SelectItem key={voice.value} value={voice.value}>
                          {voice.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Control>
              </>
            )}

            {ttsProviderId === "kitten" && (
              <>
                <Control
                  label={
                    <ControlLabel
                      label="Text-to-Speech voice"
                      tooltip="Choose the local Kitten voice to use."
                    />
                  }
                >
                  <Select
                    value={String(kittenTtsSelection.voiceId)}
                    onValueChange={(value) =>
                      saveConfig({ kittenVoiceId: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {KITTEN_TTS_VOICES.map((voice) => (
                        <SelectItem
                          key={voice.value}
                          value={String(voice.value)}
                        >
                          {voice.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Control>
                <p className="text-muted-foreground pb-2 text-xs">
                  Kitten download and voice testing live on Providers.
                </p>
              </>
            )}

            {ttsProviderId === "supertonic" && (
              <>
                <Control
                  label={
                    <ControlLabel
                      label="Text-to-Speech voice"
                      tooltip="Select the Supertonic voice style."
                    />
                  }
                >
                  <Select
                    value={supertonicTtsSelection.voice}
                    onValueChange={(value) =>
                      saveConfig({ supertonicVoice: value })
                    }
                  >
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPERTONIC_TTS_VOICES.map((voice) => (
                        <SelectItem key={voice.value} value={voice.value}>
                          {voice.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Control>

                <Control
                  label={
                    <ControlLabel
                      label="Language"
                      tooltip="Select the language for speech synthesis."
                    />
                  }
                >
                  <Select
                    value={supertonicTtsSelection.language}
                    onValueChange={(value) =>
                      saveConfig({ supertonicLanguage: value })
                    }
                  >
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPERTONIC_TTS_LANGUAGES.map((language) => (
                        <SelectItem key={language.value} value={language.value}>
                          {language.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Control>

                <Control
                  label={
                    <ControlLabel
                      label="Speed"
                      tooltip="Speech speed multiplier."
                    />
                  }
                >
                  <Input
                    type="number"
                    min={0.5}
                    max={2.0}
                    step={0.05}
                    className="w-full sm:w-[100px]"
                    value={supertonicTtsSelection.speed}
                    onChange={(e) => {
                      const val = parseFloat(e.currentTarget.value)
                      if (!isNaN(val) && val >= 0.5 && val <= 2.0) {
                        saveConfig({ supertonicSpeed: val })
                      }
                    }}
                  />
                </Control>

                <Control
                  label={
                    <ControlLabel
                      label="Quality Steps"
                      tooltip="Higher values improve quality but slow synthesis."
                    />
                  }
                >
                  <Input
                    type="number"
                    min={2}
                    max={10}
                    step={1}
                    className="w-full sm:w-[100px]"
                    value={supertonicTtsSelection.steps}
                    onChange={(e) => {
                      const val = parseInt(e.currentTarget.value)
                      if (!isNaN(val) && val >= 2 && val <= 10) {
                        saveConfig({ supertonicSteps: val })
                      }
                    }}
                  />
                </Control>
                <p className="text-muted-foreground pb-2 text-xs">
                  Supertonic downloads and quick voice tests live on Providers.
                </p>
              </>
            )}
          </div>
        </ControlGroup>

        <ControlGroup title="Agent Models" collapsible>
          <div className="border-muted bg-muted/30 text-muted-foreground mx-3 my-2 rounded-md border px-3 py-2 text-xs">
            Keep agent model choices here. OpenAI-compatible presets can carry
            both an agent model and a transcript processing model.
          </div>

          {usesOpenAiCompatiblePreset && (
            <div className="border-b px-3 py-2">
              <div className="pb-3">
                <span className="text-sm font-medium">
                  OpenAI-Compatible Preset
                </span>
                <p className="text-muted-foreground text-xs">
                  Use this when Agent/MCP Tools or Transcript Processing is set
                  to OpenAI-compatible.
                </p>
              </div>
              <ModelPresetManager
                showAgentModel={agentProviderId === "openai"}
                showTranscriptCleanupModel={
                  transcriptProcessingEnabled &&
                  transcriptProcessingProviderId === "openai"
                }
              />
            </div>
          )}

          {(agentProviderId === "groq" || agentProviderId === "gemini") && (
            <div className="px-3 py-2">
              <ProviderModelSelector
                providerId={agentProviderId}
                mcpModel={
                  agentProviderId === "groq"
                    ? config.mcpToolsGroqModel
                    : config.mcpToolsGeminiModel
                }
                onMcpModelChange={(value) =>
                  saveConfig(
                    agentProviderId === "groq"
                      ? { mcpToolsGroqModel: value }
                      : { mcpToolsGeminiModel: value },
                  )
                }
                showMcpModel={true}
                showTranscriptModel={false}
              />
            </div>
          )}

          {!usesOpenAiCompatiblePreset && (
            <p className="text-muted-foreground px-3 py-2 text-sm">
              OpenAI-compatible preset controls appear here when Agent/MCP Tools
              or Transcript Processing uses that provider.
            </p>
          )}
        </ControlGroup>

        <ControlGroup title="Advanced Agent Models" collapsible>
          <Control
            label={
              <ControlLabel
                label="Enable summarization model"
                tooltip="Use a separate model for UI and knowledge-note summaries."
              />
            }
            className="px-3"
          >
            <Switch
              checked={dualModelEnabled}
              onCheckedChange={(checked) =>
                saveConfig({ dualModelEnabled: checked })
              }
            />
          </Control>

          {dualModelEnabled && (
            <>
              <div className="space-y-3 border-t px-3 py-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  Strong Model (Planning)
                </div>
                <p className="text-muted-foreground text-xs">
                  Primary model for reasoning and tool calls. Uses the current
                  agent model if not set.
                </p>
                <Control
                  label={
                    <ControlLabel
                      label="Preset"
                      tooltip="Select which preset to use."
                    />
                  }
                >
                  <Select
                    value={strongPresetId}
                    onValueChange={(value) =>
                      saveConfig({ dualModelStrongPresetId: value })
                    }
                  >
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {allPresets.map((preset) => (
                        <SelectItem key={preset.id} value={preset.id}>
                          {preset.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Control>
                {strongPreset && (
                  <Control
                    label={
                      <ControlLabel
                        label="Model"
                        tooltip="Select the strong planning model."
                      />
                    }
                  >
                    <PresetModelSelector
                      presetId={strongPresetId}
                      baseUrl={strongPreset.baseUrl}
                      apiKey={strongPreset.apiKey}
                      value={config.dualModelStrongModelName || ""}
                      onValueChange={(value) =>
                        saveConfig({ dualModelStrongModelName: value })
                      }
                      label="Strong Model"
                      placeholder="Select model..."
                    />
                  </Control>
                )}
              </div>

              <div className="space-y-3 border-t px-3 py-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <BookOpen className="h-4 w-4 text-blue-500" />
                  Summarization Model
                </div>
                <p className="text-muted-foreground text-xs">
                  Faster, cheaper model for summarizing agent steps.
                </p>
                <Control
                  label={
                    <ControlLabel
                      label="Preset"
                      tooltip="Select which preset to use."
                    />
                  }
                >
                  <Select
                    value={weakPresetId}
                    onValueChange={(value) =>
                      saveConfig({ dualModelWeakPresetId: value })
                    }
                  >
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {allPresets.map((preset) => (
                        <SelectItem key={preset.id} value={preset.id}>
                          {preset.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Control>
                {weakPreset && (
                  <Control
                    label={
                      <ControlLabel
                        label="Model"
                        tooltip="Select the summarization model."
                      />
                    }
                  >
                    <PresetModelSelector
                      presetId={weakPresetId}
                      baseUrl={weakPreset.baseUrl}
                      apiKey={weakPreset.apiKey}
                      value={config.dualModelWeakModelName || ""}
                      onValueChange={(value) =>
                        saveConfig({ dualModelWeakModelName: value })
                      }
                      label="Summarization Model"
                      placeholder="Select model..."
                    />
                  </Control>
                )}
              </div>

              <div className="space-y-3 border-t px-3 py-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Settings2 className="h-4 w-4" />
                  Summarization Settings
                </div>
                <Control
                  label={
                    <ControlLabel
                      label="Frequency"
                      tooltip="How often to generate summaries."
                    />
                  }
                >
                  <Select
                    value={
                      config.dualModelSummarizationFrequency || "every_response"
                    }
                    onValueChange={(value) =>
                      saveConfig({
                        dualModelSummarizationFrequency: value as
                          | "every_response"
                          | "major_steps_only",
                      })
                    }
                  >
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="every_response">
                        Every Response
                      </SelectItem>
                      <SelectItem value="major_steps_only">
                        Major Steps Only
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </Control>
                <Control
                  label={
                    <ControlLabel
                      label="Detail Level"
                      tooltip="How detailed the summaries should be."
                    />
                  }
                >
                  <Select
                    value={config.dualModelSummaryDetailLevel || "compact"}
                    onValueChange={(value) =>
                      saveConfig({
                        dualModelSummaryDetailLevel: value as
                          | "compact"
                          | "detailed",
                      })
                    }
                  >
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="compact">Compact</SelectItem>
                      <SelectItem value="detailed">Detailed</SelectItem>
                    </SelectContent>
                  </Select>
                </Control>
              </div>
            </>
          )}
        </ControlGroup>
      </div>
    </div>
  )
}
