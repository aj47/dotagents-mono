import { useCallback, useEffect, useRef, useState, type ElementType, type ReactNode } from "react"
import { Control, ControlGroup, ControlLabel } from "@renderer/components/ui/control"
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
import { ModelSelector, ProviderModelSelector } from "@renderer/components/model-selector"
import { PresetModelSelector } from "@renderer/components/preset-model-selector"
import { Config } from "@shared/types"
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
  getTranscriptPostProcessingModelSettingKey,
} from "@dotagents/shared/providers"
import { getDefaultSttModel } from "@dotagents/shared/stt-models"
import {
  DEFAULT_SUPERTONIC_TTS_LANGUAGE,
  DEFAULT_SUPERTONIC_TTS_STEPS,
  GROQ_ARABIC_TTS_MODEL,
  MAX_SUPERTONIC_TTS_STEPS,
  MIN_SUPERTONIC_TTS_STEPS,
  getTextToSpeechModelDefault,
  getTextToSpeechSpeedDefault,
  getTextToSpeechSpeedSetting,
  getTextToSpeechVoiceDefault,
} from "@dotagents/shared/text-to-speech-settings"
import {
  CODEX_TEXT_VERBOSITY_OPTIONS,
  DEFAULT_CODEX_REASONING_EFFORT,
  DEFAULT_CODEX_TEXT_VERBOSITY,
  OPENAI_REASONING_EFFORT_OPTIONS,
  type CodexTextVerbosity,
  type OpenAiReasoningEffort,
} from "@dotagents/shared/agent-generation-options"
import { Mic, FileText, Volume2, Bot } from "lucide-react"

const SETTINGS_TEXT_SAVE_DEBOUNCE_MS = 400
const DEFAULT_OPENAI_TTS_MODEL = getTextToSpeechModelDefault("openai")!
const DEFAULT_OPENAI_TTS_VOICE = String(getTextToSpeechVoiceDefault("openai"))
const DEFAULT_GROQ_TTS_MODEL = getTextToSpeechModelDefault("groq")!
const DEFAULT_GROQ_TTS_VOICE = String(getTextToSpeechVoiceDefault("groq"))
const DEFAULT_GEMINI_TTS_MODEL = getTextToSpeechModelDefault("gemini")!
const DEFAULT_GEMINI_TTS_VOICE = String(getTextToSpeechVoiceDefault("gemini"))
const DEFAULT_EDGE_TTS_MODEL = getTextToSpeechModelDefault("edge")!
const DEFAULT_EDGE_TTS_VOICE = String(getTextToSpeechVoiceDefault("edge"))
const DEFAULT_KITTEN_TTS_VOICE_ID = Number(getTextToSpeechVoiceDefault("kitten") ?? 0)
const DEFAULT_SUPERTONIC_TTS_VOICE = String(getTextToSpeechVoiceDefault("supertonic"))
const OPENAI_TTS_SPEED_SETTING = getTextToSpeechSpeedSetting("openai")!
const EDGE_TTS_SPEED_SETTING = getTextToSpeechSpeedSetting("edge")!
const SUPERTONIC_TTS_SPEED_SETTING = getTextToSpeechSpeedSetting("supertonic")!

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
      label={<ControlLabel label={<span className="flex items-center gap-2"><Icon className="h-4 w-4 text-muted-foreground" />{label}</span>} tooltip={tooltip} />}
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

  if (!configQuery.data) return null

  const config = configQuery.data
  const sttProviderId = config.sttProviderId || "openai"
  const transcriptProcessingProviderId = config.transcriptPostProcessingProviderId || "openai"
  const ttsProviderId = config.ttsProviderId || "openai"
  const agentProviderId = config.agentProviderId || config.mcpToolsProviderId || "openai"
  const transcriptProcessingEnabled = config.transcriptPostProcessingEnabled ?? false
  const transcriptProcessingModelKey = getTranscriptPostProcessingModelSettingKey(transcriptProcessingProviderId)
  const usesOpenAiCompatiblePreset =
    agentProviderId === "openai" ||
    (transcriptProcessingEnabled && transcriptProcessingProviderId === "openai")
  const transcriptProcessingModel = transcriptProcessingModelKey
    ? config[transcriptProcessingModelKey]
    : undefined

  return (
    <div className="mx-auto max-w-4xl px-6 pb-10 pt-8">
      <div className="space-y-6">
        <div className="rounded-lg border bg-muted/20 px-4 py-3">
          <h2 className="text-sm font-semibold">Model Selection</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose which provider powers each job, then pick the model or voice for that job here. API keys, base URLs,
            and local engine downloads live on the Providers page.
          </p>
        </div>

        <ControlGroup title="Agent Models">
          <div className="mx-3 my-2 rounded-md border border-muted bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            Choose which model powers the main agent. OpenAI-compatible presets can carry both an agent model and a transcript processing model.
          </div>

          {usesOpenAiCompatiblePreset && (
            <div className="px-3 py-2 border-b">
              <div className="pb-3">
                <span className="text-sm font-medium">OpenAI-Compatible Preset</span>
                <p className="text-xs text-muted-foreground">
                  Use this when Agent or Transcript Processing is set to OpenAI-compatible.
                </p>
              </div>
              <ModelPresetManager
                showAgentModel={agentProviderId === "openai"}
                showTranscriptCleanupModel={transcriptProcessingEnabled && transcriptProcessingProviderId === "openai"}
              />
            </div>
          )}

          {(agentProviderId === "groq" || agentProviderId === "gemini" || agentProviderId === "chatgpt-web") && (
            <div className="px-3 py-2">
              <ProviderModelSelector
                providerId={agentProviderId}
                mcpModel={
                  agentProviderId === "groq"
                    ? config.agentGroqModel || config.mcpToolsGroqModel
                    : agentProviderId === "gemini"
                      ? config.agentGeminiModel || config.mcpToolsGeminiModel
                      : config.agentChatgptWebModel || config.mcpToolsChatgptWebModel
                }
                onMcpModelChange={(value) =>
                  saveConfig(
                    agentProviderId === "groq"
                      ? { agentGroqModel: value }
                      : agentProviderId === "gemini"
                        ? { agentGeminiModel: value }
                        : { agentChatgptWebModel: value },
                  )
                }
                showMcpModel={true}
                showTranscriptModel={false}
              />
            </div>
          )}

          {agentProviderId === "chatgpt-web" && (
            <div className="border-t px-3 py-2">
              <div className="pb-2">
                <span className="text-sm font-medium">Codex options</span>
                <p className="text-xs text-muted-foreground">
                  Tune how the Codex (ChatGPT Web) model thinks and how verbose its replies are.
                </p>
              </div>
              <Control
                label={<ControlLabel label="Thinking level" tooltip="Reasoning effort sent to Codex reasoning models. Defaults to Low when unset. 'None' lets the provider answer with no extra reasoning." />}
              >
                <Select
                  value={config.openaiReasoningEffort || DEFAULT_CODEX_REASONING_EFFORT}
                  onValueChange={(value) =>
                    saveConfig({
                      openaiReasoningEffort: value as OpenAiReasoningEffort,
                    })
                  }
                >
                  <SelectTrigger className="w-full sm:w-[220px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OPENAI_REASONING_EFFORT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.value === DEFAULT_CODEX_REASONING_EFFORT ? `${option.label} (default)` : option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Control>
              <Control
                label={<ControlLabel label="Verbosity" tooltip="Output verbosity passed as text.verbosity in the Codex responses payload." />}
              >
                <Select
                  value={config.codexTextVerbosity || DEFAULT_CODEX_TEXT_VERBOSITY}
                  onValueChange={(value) =>
                    saveConfig({
                      codexTextVerbosity: value as CodexTextVerbosity,
                    })
                  }
                >
                  <SelectTrigger className="w-full sm:w-[220px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CODEX_TEXT_VERBOSITY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.value === DEFAULT_CODEX_TEXT_VERBOSITY ? `${option.label} (default)` : option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Control>
            </div>
          )}

          {!usesOpenAiCompatiblePreset && agentProviderId === "openai" && (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              OpenAI-compatible preset controls appear here when Agent or Transcript Processing uses that provider.
            </p>
          )}
        </ControlGroup>


        <ControlGroup title="Choose a Provider for Each Job" collapsible>
          <RoleProviderSelector
            label="Speech-to-Text"
            tooltip="Choose which provider listens to your audio and turns it into text."
            value={sttProviderId}
            onChange={(value) => saveConfig({ sttProviderId: value as STT_PROVIDER_ID })}
            providers={STT_PROVIDERS}
            icon={Mic}
          />

          <RoleProviderSelector
            label="Text-to-Speech"
            tooltip="Choose which provider turns text back into audio."
            value={ttsProviderId}
            onChange={(value) => saveConfig({ ttsProviderId: value as TTS_PROVIDER_ID })}
            providers={TTS_PROVIDERS}
            icon={Volume2}
          />

          <RoleProviderSelector
            label="Agent"
            tooltip="Choose which provider powers the main agent model for reasoning, skills, and tools."
            value={agentProviderId}
            onChange={(value) => saveConfig({ agentProviderId: value as CHAT_PROVIDER_ID })}
            providers={CHAT_PROVIDERS}
            icon={Bot}
          />
        </ControlGroup>

        <ControlGroup title="Transcript Processing" collapsible>
          <Control
            label={<ControlLabel label="Enabled" tooltip="Optionally clean up punctuation, formatting, or wording after transcription and before the transcript is used elsewhere." />}
            className="px-3"
          >
            <Switch
              checked={transcriptProcessingEnabled}
              onCheckedChange={(checked) => saveConfig({ transcriptPostProcessingEnabled: checked })}
            />
          </Control>

          {transcriptProcessingEnabled && (
            <>
              <RoleProviderSelector
                label="Provider"
                tooltip="Choose which provider handles transcript processing when it is enabled."
                value={transcriptProcessingProviderId}
                onChange={(value) => saveConfig({ transcriptPostProcessingProviderId: value as CHAT_PROVIDER_ID })}
                providers={CHAT_PROVIDERS}
                icon={FileText}
              />

              <div className="border-t px-3 py-2">
                {transcriptProcessingProviderId === "openai" ? (
                  <Control
                    label={<ControlLabel label="Transcript Processing model" tooltip="OpenAI-compatible transcript processing is selected through the preset section below." />}
                  >
                    <p className="text-sm text-muted-foreground">
                      OpenAI-compatible transcript processing models are selected in the OpenAI-Compatible Preset section below.
                    </p>
                  </Control>
                ) : (
                  <ModelSelector
                    providerId={transcriptProcessingProviderId}
                    value={transcriptProcessingModel}
                    onValueChange={(value) => {
                      const modelKey = getTranscriptPostProcessingModelSettingKey(transcriptProcessingProviderId)
                      if (modelKey) {
                        saveConfig({ [modelKey]: value } as Partial<Config>)
                      }
                    }}
                    label="Transcript Processing model"
                    placeholder="Select model for transcript processing"
                    excludeTranscriptionOnlyModels={true}
                  />
                )}
              </div>

              <Control
                label={<ControlLabel label="Prompt" tooltip="Custom prompt for transcript processing. Use {transcript} to insert the original transcript." />}
                className="border-t px-3 py-2"
              >
                <div className="w-full space-y-2">
                  <Textarea
                    rows={6}
                    value={transcriptProcessingPromptDraft}
                    onChange={(e) => updateTranscriptProcessingPromptDraft(e.currentTarget.value)}
                    onBlur={(e) => flushTranscriptProcessingPromptSave(e.currentTarget.value)}
                    placeholder="Custom instructions for transcript processing..."
                    className="min-h-[120px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use <span className="select-text">{"{transcript}"}</span> to insert the original transcript.
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
                label={<ControlLabel label="Speech-to-Text model" tooltip="Parakeet uses the local speech-to-text model bundle managed on the Providers page." />}
              >
                <p className="text-sm text-muted-foreground">
                  Parakeet uses its local downloaded model bundle. Manage installation and runtime settings on Providers.
                </p>
              </Control>
            ) : (
              <ModelSelector
                providerId={sttProviderId}
                value={sttProviderId === "openai" ? config.openaiSttModel || getDefaultSttModel("openai") : config.groqSttModel || getDefaultSttModel("groq")}
                onValueChange={(value) => saveConfig(sttProviderId === "openai" ? { openaiSttModel: value } : { groqSttModel: value })}
                label="Speech-to-Text model"
                placeholder="Select model for speech transcription"
                onlyTranscriptionModels={true}
              />
            )}
          </div>

          <div className="border-t px-3 py-2">
            <div className="pb-2">
              <span className="text-sm font-medium">Text-to-Speech model and voice</span>
              <p className="text-xs text-muted-foreground">
                Pick the voice stack for the currently selected text-to-speech provider.
              </p>
            </div>

            {ttsProviderId === "openai" && (
              <>
                <Control label={<ControlLabel label="Text-to-Speech model" tooltip="Choose the OpenAI TTS model to use." />}>
                  <Select value={config.openaiTtsModel || DEFAULT_OPENAI_TTS_MODEL} onValueChange={(value) => saveConfig({ openaiTtsModel: value as Config["openaiTtsModel"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {OPENAI_TTS_MODELS.map((model) => <SelectItem key={model.value} value={model.value}>{model.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Control>

                <Control label={<ControlLabel label="Text-to-Speech voice" tooltip="Choose the voice for OpenAI TTS." />}>
                  <Select value={config.openaiTtsVoice || DEFAULT_OPENAI_TTS_VOICE} onValueChange={(value) => saveConfig({ openaiTtsVoice: value as Config["openaiTtsVoice"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {OPENAI_TTS_VOICES.map((voice) => <SelectItem key={voice.value} value={voice.value}>{voice.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Control>

                <Control label={<ControlLabel label="Text-to-Speech speed" tooltip="Speech speed between 0.25 and 4.0." />}>
                  <Input
                    type="number"
                    min={OPENAI_TTS_SPEED_SETTING.minimumValue}
                    max={OPENAI_TTS_SPEED_SETTING.maximumValue}
                    step={OPENAI_TTS_SPEED_SETTING.step}
                    defaultValue={config.openaiTtsSpeed?.toString()}
                    placeholder={String(getTextToSpeechSpeedDefault("openai"))}
                    onChange={(e) => {
                      const speed = parseFloat(e.currentTarget.value)
                      if (!isNaN(speed) && speed >= OPENAI_TTS_SPEED_SETTING.minimumValue && speed <= OPENAI_TTS_SPEED_SETTING.maximumValue) {
                        saveConfig({ openaiTtsSpeed: speed })
                      }
                    }}
                  />
                </Control>
              </>
            )}

            {ttsProviderId === "groq" && (
              <>
                <Control label={<ControlLabel label="Text-to-Speech model" tooltip="Choose the Groq TTS model to use." />}>
                  <Select
                    value={config.groqTtsModel || DEFAULT_GROQ_TTS_MODEL}
                    onValueChange={(value) => {
                      const defaultVoice = String(getTextToSpeechVoiceDefault("groq", value))
                      saveConfig({ groqTtsModel: value as Config["groqTtsModel"], groqTtsVoice: defaultVoice })
                    }}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {GROQ_TTS_MODELS.map((model) => <SelectItem key={model.value} value={model.value}>{model.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Control>

                <Control label={<ControlLabel label="Text-to-Speech voice" tooltip="Choose the voice for Groq TTS." />}>
                  <Select
                    value={config.groqTtsVoice || String(getTextToSpeechVoiceDefault("groq", config.groqTtsModel || DEFAULT_GROQ_TTS_MODEL) ?? DEFAULT_GROQ_TTS_VOICE)}
                    onValueChange={(value) => saveConfig({ groqTtsVoice: value })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {((config.groqTtsModel || DEFAULT_GROQ_TTS_MODEL) === GROQ_ARABIC_TTS_MODEL ? GROQ_TTS_VOICES_ARABIC : GROQ_TTS_VOICES_ENGLISH).map((voice) => (
                        <SelectItem key={voice.value} value={voice.value}>{voice.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Control>
              </>
            )}

            {ttsProviderId === "gemini" && (
              <>
                <Control label={<ControlLabel label="Text-to-Speech model" tooltip="Choose the Gemini TTS model to use." />}>
                  <Select value={config.geminiTtsModel || DEFAULT_GEMINI_TTS_MODEL} onValueChange={(value) => saveConfig({ geminiTtsModel: value as Config["geminiTtsModel"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {GEMINI_TTS_MODELS.map((model) => <SelectItem key={model.value} value={model.value}>{model.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Control>

                <Control label={<ControlLabel label="Text-to-Speech voice" tooltip="Choose the voice for Gemini TTS." />}>
                  <Select value={config.geminiTtsVoice || DEFAULT_GEMINI_TTS_VOICE} onValueChange={(value) => saveConfig({ geminiTtsVoice: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {GEMINI_TTS_VOICES.map((voice) => <SelectItem key={voice.value} value={voice.value}>{voice.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Control>
              </>
            )}

            {ttsProviderId === "edge" && (
              <>
                <Control label={<ControlLabel label="Text-to-Speech model" tooltip="Choose the Edge TTS model to use." />}>
                  <Select value={config.edgeTtsModel || DEFAULT_EDGE_TTS_MODEL} onValueChange={(value) => saveConfig({ edgeTtsModel: value as Config["edgeTtsModel"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EDGE_TTS_MODELS.map((model) => <SelectItem key={model.value} value={model.value}>{model.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Control>

                <Control label={<ControlLabel label="Text-to-Speech voice" tooltip="Choose the voice for Edge TTS." />}>
                  <Select value={config.edgeTtsVoice || DEFAULT_EDGE_TTS_VOICE} onValueChange={(value) => saveConfig({ edgeTtsVoice: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EDGE_TTS_VOICES.map((voice) => <SelectItem key={voice.value} value={voice.value}>{voice.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Control>

                <Control label={<ControlLabel label="Text-to-Speech speed" tooltip="Speech speed between 0.5 and 2.0." />}>
                  <Input
                    type="number"
                    min={EDGE_TTS_SPEED_SETTING.minimumValue}
                    max={EDGE_TTS_SPEED_SETTING.maximumValue}
                    step={EDGE_TTS_SPEED_SETTING.step}
                    defaultValue={config.edgeTtsRate?.toString()}
                    placeholder={String(getTextToSpeechSpeedDefault("edge"))}
                    onChange={(e) => {
                      const speed = parseFloat(e.currentTarget.value)
                      if (!isNaN(speed) && speed >= EDGE_TTS_SPEED_SETTING.minimumValue && speed <= EDGE_TTS_SPEED_SETTING.maximumValue) {
                        saveConfig({ edgeTtsRate: speed })
                      }
                    }}
                  />
                </Control>
                <p className="pb-2 text-xs text-muted-foreground">Edge TTS is cloud-based and does not require an API key.</p>
              </>
            )}

            {ttsProviderId === "kitten" && (
              <>
                <Control label={<ControlLabel label="Text-to-Speech voice" tooltip="Choose the local Kitten voice to use." />}>
                  <Select value={String(config.kittenVoiceId ?? DEFAULT_KITTEN_TTS_VOICE_ID)} onValueChange={(value) => saveConfig({ kittenVoiceId: parseInt(value) })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {KITTEN_TTS_VOICES.map((voice) => <SelectItem key={voice.value} value={String(voice.value)}>{voice.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Control>
                <p className="pb-2 text-xs text-muted-foreground">Kitten download and voice testing live on Providers.</p>
              </>
            )}

            {ttsProviderId === "supertonic" && (
              <>
                <Control label={<ControlLabel label="Text-to-Speech voice" tooltip="Select the Supertonic voice style." />}>
                  <Select value={config.supertonicVoice ?? DEFAULT_SUPERTONIC_TTS_VOICE} onValueChange={(value) => saveConfig({ supertonicVoice: value })}>
                    <SelectTrigger className="w-full sm:w-[180px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SUPERTONIC_TTS_VOICES.map((voice) => <SelectItem key={voice.value} value={voice.value}>{voice.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Control>

                <Control label={<ControlLabel label="Language" tooltip="Select the language for speech synthesis." />}>
                  <Select value={config.supertonicLanguage ?? DEFAULT_SUPERTONIC_TTS_LANGUAGE} onValueChange={(value) => saveConfig({ supertonicLanguage: value })}>
                    <SelectTrigger className="w-full sm:w-[180px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SUPERTONIC_TTS_LANGUAGES.map((language) => <SelectItem key={language.value} value={language.value}>{language.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Control>

                <Control label={<ControlLabel label="Speed" tooltip="Speech speed multiplier." />}>
                  <Input
                    type="number"
                    min={SUPERTONIC_TTS_SPEED_SETTING.minimumValue}
                    max={SUPERTONIC_TTS_SPEED_SETTING.maximumValue}
                    step={SUPERTONIC_TTS_SPEED_SETTING.step}
                    className="w-full sm:w-[100px]"
                    value={config.supertonicSpeed ?? SUPERTONIC_TTS_SPEED_SETTING.defaultValue}
                    onChange={(e) => {
                      const val = parseFloat(e.currentTarget.value)
                      if (!isNaN(val) && val >= SUPERTONIC_TTS_SPEED_SETTING.minimumValue && val <= SUPERTONIC_TTS_SPEED_SETTING.maximumValue) {
                        saveConfig({ supertonicSpeed: val })
                      }
                    }}
                  />
                </Control>

                <Control label={<ControlLabel label="Quality Steps" tooltip="Higher values improve quality but slow synthesis." />}>
                  <Input
                    type="number"
                    min={MIN_SUPERTONIC_TTS_STEPS}
                    max={MAX_SUPERTONIC_TTS_STEPS}
                    step={1}
                    className="w-full sm:w-[100px]"
                    value={config.supertonicSteps ?? DEFAULT_SUPERTONIC_TTS_STEPS}
                    onChange={(e) => {
                      const val = parseInt(e.currentTarget.value)
                      if (!isNaN(val) && val >= MIN_SUPERTONIC_TTS_STEPS && val <= MAX_SUPERTONIC_TTS_STEPS) {
                        saveConfig({ supertonicSteps: val })
                      }
                    }}
                  />
                </Control>
                <p className="pb-2 text-xs text-muted-foreground">Supertonic downloads and quick voice tests live on Providers.</p>
              </>
            )}
          </div>
        </ControlGroup>

      </div>
    </div>
  )
}
