import { useState, useCallback, useRef, useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@renderer/components/ui/button"
import { Input } from "@renderer/components/ui/input"
import { Textarea } from "@renderer/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@renderer/components/ui/select"
import { useConfigQuery, useSaveConfigMutation } from "@renderer/lib/query-client"
import { decodeBlobToPcm } from "@renderer/lib/audio-utils"
import type { AgentProfile, Config } from "@shared/types"
import { useNavigate } from "react-router-dom"
import { tipcClient } from "@renderer/lib/tipc-client"
import { Recorder } from "@renderer/lib/recorder"
import { useMutation } from "@tanstack/react-query"
import { KeyRecorder } from "@renderer/components/key-recorder"
import { getMcpToolsShortcutDisplay } from "@shared/key-utils"
import {
  EXTERNAL_AGENT_PRESETS,
  type ExternalAgentPresetKey,
} from "@shared/external-agent-presets"
import {
  ONBOARDING_MAIN_AGENT_OPTIONS,
  buildAcpOnboardingConfigUpdate,
  buildByokConfigUpdate,
  buildExternalAgentProfileInput,
  buildOpenCodeManagedEnv,
  findExistingExternalAgentProfile,
  type ByokProviderId,
  type OnboardingMainAgentChoiceId,
} from "@renderer/lib/onboarding-main-agent"

type OnboardingStep = "welcome" | "main-agent" | "setup" | "voice" | "finish"

type ExternalAgentCommandVerificationResult = {
  ok: boolean
  resolvedCommand?: string
  details?: string
  error?: string
  warnings?: string[]
}

type OpenCodeInstallStatus = {
  installed: boolean
  installing: boolean
  binaryPath: string
  version?: string
  error?: string
}

type CodexInstallStatus = {
  installed: boolean
  installing: boolean
  binaryPath: string
  version?: string
  error?: string
}

const BYOK_PROVIDER_DETAILS: Record<ByokProviderId, { label: string; placeholder: string; url: string }> = {
  openai: {
    label: "OpenAI",
    placeholder: "sk-...",
    url: "https://platform.openai.com/api-keys",
  },
  groq: {
    label: "Groq",
    placeholder: "gsk_...",
    url: "https://console.groq.com/keys",
  },
  gemini: {
    label: "Gemini",
    placeholder: "AIza...",
    url: "https://aistudio.google.com/app/apikey",
  },
}

function getProviderLabel(providerId?: string): string {
  switch (providerId) {
    case "openai":
      return "OpenAI"
    case "groq":
      return "Groq"
    case "gemini":
      return "Gemini"
    case "parakeet":
      return "Parakeet"
    case "kitten":
      return "Kitten"
    case "supertonic":
      return "Supertonic"
    default:
      return "Not configured"
  }
}

export function Component() {
  const [step, setStep] = useState<OnboardingStep>("welcome")
  const [selectedChoiceId, setSelectedChoiceId] = useState<OnboardingMainAgentChoiceId>("codex")
  const [byokProviderId, setByokProviderId] = useState<ByokProviderId>("groq")
  const [apiKey, setApiKey] = useState("")
  const [isApplyingSetup, setIsApplyingSetup] = useState(false)
  const [commandVerification, setCommandVerification] =
    useState<ExternalAgentCommandVerificationResult | null>(null)
  const [isVerifyingCommand, setIsVerifyingCommand] = useState(false)
  const [setupError, setSetupError] = useState<string | null>(null)
  const [provisionedAgentName, setProvisionedAgentName] = useState<string | null>(null)
  const [openCodeSetupMode, setOpenCodeSetupMode] = useState<"existing-auth" | "managed-api-key">("existing-auth")
  const [openCodeProviderId, setOpenCodeProviderId] = useState<ByokProviderId>("groq")
  const [openCodeApiKey, setOpenCodeApiKey] = useState("")
  const [openCodeInstallStatus, setOpenCodeInstallStatus] = useState<OpenCodeInstallStatus | null>(null)
  const [isInstallingOpenCode, setIsInstallingOpenCode] = useState(false)
  const [codexInstallStatus, setCodexInstallStatus] = useState<CodexInstallStatus | null>(null)
  const [isInstallingCodex, setIsInstallingCodex] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [dictationResult, setDictationResult] = useState<string | null>(null)
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null)
  const [micError, setMicError] = useState<string | null>(null)
  const [isParakeetDownloading, setIsParakeetDownloading] = useState(false)
  const navigate = useNavigate()
  const configQuery = useConfigQuery()
  const saveConfigMutation = useSaveConfigMutation()
  const queryClient = useQueryClient()
  const recorderRef = useRef<Recorder | null>(null)

  const parakeetStatusQuery = useQuery({
    queryKey: ["parakeetModelStatus"],
    queryFn: () => tipcClient.getParakeetModelStatus(),
    refetchInterval: (query) => {
      const status = query.state.data as { downloading?: boolean } | undefined
      return (isParakeetDownloading || status?.downloading) ? 500 : false
    },
  })

  const saveConfig = useCallback(
    (config: Partial<Config>) => {
      if (!configQuery.data) return
      saveConfigMutation.mutate({
        config: {
          ...configQuery.data,
          ...config,
        },
      })
    },
    [saveConfigMutation, configQuery.data]
  )

  const handleDownloadParakeet = useCallback(async () => {
    setIsParakeetDownloading(true)
    try {
      await tipcClient.downloadParakeetModel()
      queryClient.invalidateQueries({ queryKey: ["parakeetModelStatus"] })
      const currentConfig = configQuery.data || (await tipcClient.getConfig())
      await saveConfigMutation.mutateAsync({
        config: {
          ...currentConfig,
          sttProviderId: "parakeet" as const,
        },
      })
      await configQuery.refetch()
    } catch (error) {
      console.error("Failed to download Parakeet model:", error)
    } finally {
      setIsParakeetDownloading(false)
    }
  }, [queryClient, saveConfigMutation, configQuery])

  const selectedOption =
    ONBOARDING_MAIN_AGENT_OPTIONS.find((option) => option.id === selectedChoiceId)
    || ONBOARDING_MAIN_AGENT_OPTIONS[0]
  const selectedExternalPreset =
    selectedChoiceId === "byok" ? undefined : EXTERNAL_AGENT_PRESETS[selectedChoiceId]

  const saveConfigAsync = useCallback(
    async (config: Partial<Config>) => {
      const currentConfig = configQuery.data || (await tipcClient.getConfig())
      await saveConfigMutation.mutateAsync({
        config: {
          ...currentConfig,
          ...config,
        },
      })
    },
    [saveConfigMutation, configQuery.data]
  )

  useEffect(() => {
    setCommandVerification(null)
    setSetupError(null)
    setProvisionedAgentName(null)
  }, [selectedChoiceId])

  useEffect(() => {
    if (selectedChoiceId !== "opencode") return

    const config = configQuery.data
    if (!config) return

    if (!openCodeApiKey.trim()) {
      if (openCodeProviderId === "groq" && config.groqApiKey) {
        setOpenCodeApiKey(config.groqApiKey)
      } else if (openCodeProviderId === "openai" && config.openaiApiKey) {
        setOpenCodeApiKey(config.openaiApiKey)
      } else if (openCodeProviderId === "gemini" && config.geminiApiKey) {
        setOpenCodeApiKey(config.geminiApiKey)
      }
    }
  }, [configQuery.data, openCodeApiKey, openCodeProviderId, selectedChoiceId])

  useEffect(() => {
    if (selectedChoiceId !== "opencode") return
    void tipcClient.getOpencodeInstallStatus().then(setOpenCodeInstallStatus).catch(() => {
      setOpenCodeInstallStatus(null)
    })
  }, [selectedChoiceId])

  useEffect(() => {
    if (selectedChoiceId !== "codex") return
    void tipcClient.getCodexInstallStatus().then(setCodexInstallStatus).catch(() => {
      setCodexInstallStatus(null)
    })
  }, [selectedChoiceId])

  useEffect(() => {
    if (selectedChoiceId !== "opencode") return
    if (!openCodeInstallStatus?.installed) return
    if (commandVerification?.ok) return
    void handleVerifyExternalAgent()
  }, [selectedChoiceId, openCodeInstallStatus])

  useEffect(() => {
    if (selectedChoiceId !== "codex") return
    if (!codexInstallStatus?.installed) return
    if (commandVerification?.ok) return
    void handleVerifyExternalAgent()
  }, [selectedChoiceId, codexInstallStatus])

  useEffect(() => {
    if (!parakeetStatusQuery.data?.downloaded) return
    if (!configQuery.data) return
    if (configQuery.data.sttProviderId === "parakeet") return
    const currentConfig = configQuery.data
    saveConfigMutation.mutate({
      config: {
        ...currentConfig,
        sttProviderId: "parakeet" as const,
      },
    })
  }, [parakeetStatusQuery.data?.downloaded, configQuery.data, saveConfigMutation])

  const transcribeMutation = useMutation({
    mutationFn: async ({ blob, duration }: { blob: Blob; duration: number }) => {
      setIsTranscribing(true)
      setDictationResult(null)
      setTranscriptionError(null)
      const config = configQuery.data || (await tipcClient.getConfig())
      const isParakeet = config?.sttProviderId === "parakeet"
      const pcmRecording = isParakeet ? await decodeBlobToPcm(blob) : undefined
      return tipcClient.createRecording({
        recording: await blob.arrayBuffer(),
        pcmRecording,
        duration,
      })
    },
    onSuccess: (result) => {
      setIsTranscribing(false)
      if (result?.transcript) {
        setDictationResult(result.transcript)
      }
    },
    onError: (error: any) => {
      setIsTranscribing(false)
      const errorMessage = error?.message || String(error)
      if (
        errorMessage.includes("API key")
        || errorMessage.includes("401")
        || errorMessage.includes("403")
      ) {
        setTranscriptionError(
          "Speech-to-text is not ready yet. Add the required API key or switch to a local provider later in Settings → Providers."
        )
      } else if (errorMessage.includes("model")) {
        setTranscriptionError(
          "Speech-to-text model configuration needs attention. You can finish onboarding and adjust it later in Settings."
        )
      } else {
        setTranscriptionError(`Transcription failed: ${errorMessage}`)
      }
    },
  })

  useEffect(() => {
    if (recorderRef.current) return undefined

    const recorder = (recorderRef.current = new Recorder())

    recorder.on("record-start", () => {
      setIsRecording(true)
    })

    recorder.on("record-end", (blob, duration) => {
      setIsRecording(false)
      if (blob.size > 0 && duration >= 100) {
        transcribeMutation.mutate({ blob, duration })
      }
    })

    return () => {
      recorder.stopRecording()
    }
  }, [transcribeMutation])

  const handleStartRecording = useCallback(async () => {
    setDictationResult(null)
    setTranscriptionError(null)
    setMicError(null)
    try {
      const config = await tipcClient.getConfig()
      await recorderRef.current?.startRecording(config?.audioInputDeviceId)
    } catch (error: any) {
      const errorMessage = error?.message || String(error)
      if (errorMessage.includes("Permission denied") || errorMessage.includes("NotAllowedError")) {
        setMicError(
          "Microphone access was denied. Please allow microphone access in your system settings and try again."
        )
      } else if (errorMessage.includes("NotFoundError") || errorMessage.includes("no audio input")) {
        setMicError("No microphone found. Please connect a microphone and try again.")
      } else {
        setMicError(`Failed to start recording: ${errorMessage}`)
      }
    }
  }, [])

  const handleStopRecording = useCallback(() => {
    recorderRef.current?.stopRecording()
  }, [])

  const handleCompleteOnboarding = useCallback(async () => {
    await saveConfigAsync({ onboardingCompleted: true })
    navigate("/")
  }, [saveConfigAsync, navigate])

  const handleSkipOnboarding = useCallback(async () => {
    await saveConfigAsync({ onboardingCompleted: true })
    navigate("/")
  }, [saveConfigAsync, navigate])

  const ensureExternalAgentProfile = useCallback(async (
    presetKey: ExternalAgentPresetKey,
    options?: { env?: Record<string, string>; autoSpawn?: boolean },
  ) => {
    const profiles = ((await tipcClient.getAgentProfiles()) || []) as AgentProfile[]
    const existing = findExistingExternalAgentProfile(profiles, presetKey)
    const profileDraft = buildExternalAgentProfileInput(presetKey, { env: options?.env, autoSpawn: options?.autoSpawn })
    if (existing) {
      const nextEnv = options?.env ? { ...(existing.connection.env || {}), ...options.env } : existing.connection.env
      const shouldUpdateEnv = Boolean(options?.env)
      if (existing.enabled === false) {
        await tipcClient.updateAgentProfile({
          id: existing.id,
          updates: {
            enabled: true,
            ...(shouldUpdateEnv
              ? {
                  connection: {
                    ...existing.connection,
                    env: nextEnv,
                  },
                }
              : {}),
          },
        })
      } else if (shouldUpdateEnv) {
        await tipcClient.updateAgentProfile({
          id: existing.id,
          updates: {
            connection: {
              ...existing.connection,
              env: nextEnv,
            },
          },
        })
      }
      return existing.name || existing.displayName
    }

    const created = await tipcClient.createAgentProfile({
      profile: {
        name: profileDraft.displayName,
        ...profileDraft,
      },
    })

    return created?.name || created?.displayName || profileDraft.displayName
  }, [])

  const handleVerifyExternalAgent = useCallback(async () => {
    if (!selectedExternalPreset || selectedChoiceId === "byok") return

    setIsVerifyingCommand(true)
    setSetupError(null)

    try {
      const profiles = ((await tipcClient.getAgentProfiles()) || []) as AgentProfile[]
      const existing = findExistingExternalAgentProfile(profiles, selectedChoiceId)
      const managedEnv =
        selectedChoiceId === "opencode" && openCodeSetupMode === "managed-api-key" && openCodeApiKey.trim()
          ? buildOpenCodeManagedEnv(openCodeProviderId, openCodeApiKey)
          : undefined
      const draft = buildExternalAgentProfileInput(selectedChoiceId, { env: managedEnv })
      const result = await tipcClient.verifyExternalAgentCommand({
        command: existing?.connection.command || draft.connection.command,
        args: existing?.connection.args || draft.connection.args,
        cwd: existing?.connection.cwd || draft.connection.cwd,
        env: managedEnv,
        probeArgs: selectedExternalPreset.verifyArgs,
      })
      setCommandVerification(result)
      if (!result?.ok && result?.error) {
        setSetupError(result.error)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setCommandVerification({ ok: false, error: message })
      setSetupError(message)
    } finally {
      setIsVerifyingCommand(false)
    }
  }, [selectedExternalPreset, selectedChoiceId])

  const handleContinueFromSetup = useCallback(async () => {
    setSetupError(null)
    setIsApplyingSetup(true)

    try {
      const currentConfig = configQuery.data || (await tipcClient.getConfig())

      if (selectedChoiceId === "byok") {
        if (!apiKey.trim()) {
          setSetupError("Enter an API key before continuing.")
          return
        }

        await saveConfigAsync(buildByokConfigUpdate(byokProviderId, apiKey, currentConfig))
        await configQuery.refetch()
        setStep("voice")
        return
      }

      if (!commandVerification?.ok) {
        setSetupError("Verify the external agent command before continuing.")
        return
      }

      const openCodeManagedEnv =
        selectedChoiceId === "opencode" && openCodeSetupMode === "managed-api-key"
          ? (() => {
              if (!openCodeApiKey.trim()) {
                throw new Error("Enter an API key so DotAgents can configure OpenCode automatically.")
              }
              return buildOpenCodeManagedEnv(openCodeProviderId, openCodeApiKey)
            })()
          : undefined

      const agentName = await ensureExternalAgentProfile(selectedChoiceId, { env: openCodeManagedEnv, autoSpawn: true })
      setProvisionedAgentName(agentName)
      await saveConfigAsync(buildAcpOnboardingConfigUpdate(agentName, currentConfig))
      await configQuery.refetch()
      setStep("voice")
    } catch (error) {
      setSetupError(error instanceof Error ? error.message : String(error))
    } finally {
      setIsApplyingSetup(false)
    }
  }, [
    apiKey,
    byokProviderId,
    commandVerification?.ok,
    configQuery,
    ensureExternalAgentProfile,
    openCodeApiKey,
    openCodeProviderId,
    openCodeSetupMode,
    saveConfigAsync,
    selectedChoiceId,
  ])

  const handleInstallOpenCode = useCallback(async () => {
    setIsInstallingOpenCode(true)
    setSetupError(null)
    try {
      const status = await tipcClient.installManagedOpencode()
      setOpenCodeInstallStatus(status)
      if (!status.installed) {
        throw new Error(status.error || "OpenCode install did not complete successfully.")
      }
      await handleVerifyExternalAgent()
    } catch (error) {
      setSetupError(error instanceof Error ? error.message : String(error))
    } finally {
      setIsInstallingOpenCode(false)
    }
  }, [handleVerifyExternalAgent])

  const handleInstallCodex = useCallback(async () => {
    setIsInstallingCodex(true)
    setSetupError(null)
    try {
      const status = await tipcClient.installManagedCodex()
      setCodexInstallStatus(status)
      if (!status.installed) {
        throw new Error(status.error || "Codex install did not complete successfully.")
      }
      await handleVerifyExternalAgent()
    } catch (error) {
      setSetupError(error instanceof Error ? error.message : String(error))
    } finally {
      setIsInstallingCodex(false)
    }
  }, [handleVerifyExternalAgent])

  const shellClassName =
    step === "welcome"
      ? "w-full max-w-2xl mx-auto my-auto px-6 py-10"
      : "w-full max-w-2xl self-start mx-auto px-6 py-6 sm:py-8"

  return (
    <div className="app-drag-region flex h-dvh overflow-y-auto">
      <div className={shellClassName}>
        {step === "welcome" && (
          <WelcomeStep onNext={() => setStep("main-agent")} onSkip={handleSkipOnboarding} />
        )}
        {step === "main-agent" && (
          <MainAgentChoiceStep
            selectedChoiceId={selectedChoiceId}
            onSelect={setSelectedChoiceId}
            onNext={() => setStep("setup")}
            onBack={() => setStep("welcome")}
          />
        )}
        {step === "setup" && selectedChoiceId === "byok" && (
          <ByokSetupStep
            providerId={byokProviderId}
            onProviderChange={setByokProviderId}
            apiKey={apiKey}
            onApiKeyChange={setApiKey}
            onBack={() => setStep("main-agent")}
            onContinue={handleContinueFromSetup}
            isSubmitting={isApplyingSetup}
            error={setupError}
          />
        )}
        {step === "setup" && selectedChoiceId !== "byok" && selectedExternalPreset && (
          <ExternalAgentSetupStep
            presetKey={selectedChoiceId}
            openCodeInstallStatus={openCodeInstallStatus}
            onInstallOpenCode={handleInstallOpenCode}
            isInstallingOpenCode={isInstallingOpenCode}
            codexInstallStatus={codexInstallStatus}
            onInstallCodex={handleInstallCodex}
            isInstallingCodex={isInstallingCodex}
            openCodeSetupMode={openCodeSetupMode}
            onOpenCodeSetupModeChange={setOpenCodeSetupMode}
            openCodeProviderId={openCodeProviderId}
            onOpenCodeProviderChange={setOpenCodeProviderId}
            openCodeApiKey={openCodeApiKey}
            onOpenCodeApiKeyChange={setOpenCodeApiKey}
            onBack={() => setStep("main-agent")}
            onContinue={handleContinueFromSetup}
            onVerify={handleVerifyExternalAgent}
            isVerifyingCommand={isVerifyingCommand}
            isSubmitting={isApplyingSetup}
            commandVerification={commandVerification}
            error={setupError}
          />
        )}
        {step === "voice" && (
          <VoiceStep
            isRecording={isRecording}
            isTranscribing={isTranscribing}
            dictationResult={dictationResult}
            onDictationResultChange={setDictationResult}
            onStartRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
            onNext={() => setStep("finish")}
            onBack={() => setStep("setup")}
            config={configQuery.data}
            onSaveConfig={saveConfig}
            transcriptionError={transcriptionError}
            micError={micError}
            parakeetStatus={parakeetStatusQuery.data as { downloaded: boolean; downloading: boolean; progress: number; error?: string } | undefined}
            onDownloadParakeet={handleDownloadParakeet}
            isParakeetDownloading={isParakeetDownloading}
          />
        )}
        {step === "finish" && (
          <FinishStep
            selectedChoiceId={selectedChoiceId}
            byokProviderId={byokProviderId}
            provisionedAgentName={provisionedAgentName}
            selectedOptionDescription={selectedOption.description}
            selectedOptionMode={selectedOption.mode}
            onBack={() => setStep("voice")}
            onComplete={handleCompleteOnboarding}
            config={configQuery.data}
            onSaveConfig={saveConfig}
          />
        )}
      </div>
    </div>
  )
}

// Welcome Step
function WelcomeStep({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  return (
    <div className="mx-auto max-w-xl text-center">
      <div className="mb-4">
        <span className="i-mingcute-mic-fill text-5xl text-primary sm:text-6xl"></span>
      </div>
      <h1 className="mb-3 text-2xl font-bold tracking-tight sm:text-3xl">
        Welcome to {process.env.PRODUCT_NAME}!
      </h1>
      <p className="mx-auto mb-6 max-w-xl text-base text-muted-foreground sm:text-lg">
        Choose how you want DotAgents to think, then optionally try voice dictation and set your hotkeys.
      </p>
      <div className="flex flex-col items-center gap-2.5">
        <Button size="lg" onClick={onNext} className="w-full max-w-56">
          Get Started
        </Button>
        <Button variant="ghost" size="sm" onClick={onSkip} className="text-muted-foreground">
          Skip Tutorial
        </Button>
      </div>
    </div>
  )
}

function MainAgentChoiceStep({
  selectedChoiceId,
  onSelect,
  onNext,
  onBack,
}: {
  selectedChoiceId: OnboardingMainAgentChoiceId
  onSelect: (value: OnboardingMainAgentChoiceId) => void
  onNext: () => void
  onBack: () => void
}) {
  return (
    <div>
      <StepIndicator current={1} total={4} />
      <h2 className="mb-2 text-center text-2xl font-bold">Choose your main agent</h2>
      <p className="mb-6 text-center text-muted-foreground">
        Pick the brain DotAgents should use by default. You can change this later in Settings.
      </p>

      <div className="mb-8 space-y-3">
        {ONBOARDING_MAIN_AGENT_OPTIONS.map((option) => {
          const selected = option.id === selectedChoiceId
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option.id)}
              className={`w-full rounded-xl border p-4 text-left transition ${
                selected
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border bg-background hover:border-primary/40 hover:bg-muted/30"
              }`}
            >
              <div className="mb-2 flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{option.displayName}</h3>
                    {option.isRecommended && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                        Recommended
                      </span>
                    )}
                    <span className="rounded-full border px-2 py-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                      {option.mode}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{option.description}</p>
                </div>
                <span
                  className={`mt-0.5 h-4 w-4 rounded-full border ${
                    selected ? "border-primary bg-primary" : "border-muted-foreground/40"
                  }`}
                />
              </div>
              <p className="text-xs text-muted-foreground">{option.setupSummary}</p>
            </button>
          )
        })}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext}>Continue</Button>
      </div>
    </div>
  )
}

function ByokSetupStep({
  providerId,
  onProviderChange,
  apiKey,
  onApiKeyChange,
  onBack,
  onContinue,
  isSubmitting,
  error,
}: {
  providerId: ByokProviderId
  onProviderChange: (value: ByokProviderId) => void
  apiKey: string
  onApiKeyChange: (value: string) => void
  onBack: () => void
  onContinue: () => void
  isSubmitting: boolean
  error: string | null
}) {
  const provider = BYOK_PROVIDER_DETAILS[providerId]

  return (
    <div>
      <StepIndicator current={2} total={4} />
      <h2 className="mb-2 text-center text-2xl font-bold">Connect your provider</h2>
      <p className="mb-6 text-center text-muted-foreground">
        DotAgents will use its built-in main agent and your provider key for chat and model-backed features.
      </p>

      <div className="mb-6 space-y-4 rounded-xl border bg-muted/20 p-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium">Provider</label>
          <Select value={providerId} onValueChange={(value) => onProviderChange(value as ByokProviderId)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="openai">OpenAI</SelectItem>
              <SelectItem value="groq">Groq</SelectItem>
              <SelectItem value="gemini">Gemini</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">{provider.label} API key</label>
          <Input
            type="password"
            placeholder={provider.placeholder}
            value={apiKey}
            onChange={(event) => onApiKeyChange(event.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Get a key from{" "}
            <a href={provider.url} target="_blank" rel="noreferrer" className="text-primary underline">
              {provider.url.replace(/^https?:\/\//, "")}
            </a>
            .
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">
          <span className="i-mingcute-warning-fill mr-2"></span>
          {error}
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onContinue} disabled={isSubmitting || !apiKey.trim()}>
          {isSubmitting ? "Saving..." : "Continue"}
        </Button>
      </div>
    </div>
  )
}

function ExternalAgentSetupStep({
  presetKey,
  openCodeInstallStatus,
  onInstallOpenCode,
  isInstallingOpenCode,
  codexInstallStatus,
  onInstallCodex,
  isInstallingCodex,
  openCodeSetupMode,
  onOpenCodeSetupModeChange,
  openCodeProviderId,
  onOpenCodeProviderChange,
  openCodeApiKey,
  onOpenCodeApiKeyChange,
  onBack,
  onContinue,
  onVerify,
  isVerifyingCommand,
  isSubmitting,
  commandVerification,
  error,
}: {
  presetKey: ExternalAgentPresetKey
  openCodeInstallStatus: OpenCodeInstallStatus | null
  onInstallOpenCode: () => void
  isInstallingOpenCode: boolean
  codexInstallStatus: CodexInstallStatus | null
  onInstallCodex: () => void
  isInstallingCodex: boolean
  openCodeSetupMode: "existing-auth" | "managed-api-key"
  onOpenCodeSetupModeChange: (value: "existing-auth" | "managed-api-key") => void
  openCodeProviderId: ByokProviderId
  onOpenCodeProviderChange: (value: ByokProviderId) => void
  openCodeApiKey: string
  onOpenCodeApiKeyChange: (value: string) => void
  onBack: () => void
  onContinue: () => void
  onVerify: () => void
  isVerifyingCommand: boolean
  isSubmitting: boolean
  commandVerification: ExternalAgentCommandVerificationResult | null
  error: string | null
}) {
  const preset = EXTERNAL_AGENT_PRESETS[presetKey]
  const commandPreview = [preset.connectionCommand, preset.connectionArgs].filter(Boolean).join(" ")
  const isOpenCode = presetKey === "opencode"
  const isCodex = presetKey === "codex"
  const openCodeProvider = BYOK_PROVIDER_DETAILS[openCodeProviderId]
  const requiresManagedOpenCodeKey = isOpenCode && openCodeSetupMode === "managed-api-key" && !openCodeApiKey.trim()

  return (
    <div>
      <StepIndicator current={2} total={4} />
      <h2 className="mb-2 text-center text-2xl font-bold">Connect {preset.displayName}</h2>
      <p className="mb-6 text-center text-muted-foreground">
        DotAgents will use this ACP agent as the main brain after the command is verified.
      </p>

      <div className="mb-6 space-y-3 rounded-xl border bg-muted/20 p-4">
        <div>
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{preset.displayName}</h3>
            <span className="rounded-full border px-2 py-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">
              {preset.setupMode === "managed" ? "recommended ACP" : "existing install"}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{preset.description}</p>
          <p className="mt-2 text-xs text-muted-foreground">{preset.onboardingNote}</p>
        </div>

        {(preset.installCommand || preset.authHint || preset.cwdHint) && (
          <div className="grid gap-2 sm:grid-cols-3">
            {preset.installCommand && (
              <div className="space-y-1 rounded-md border bg-background/80 px-2.5 py-2">
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Install</p>
                <p className="font-mono text-[11px] leading-relaxed">{preset.installCommand}</p>
              </div>
            )}
            {preset.authHint && (
              <div className="space-y-1 rounded-md border bg-background/80 px-2.5 py-2">
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Auth</p>
                <p className="text-[11px] leading-relaxed text-muted-foreground">{preset.authHint}</p>
              </div>
            )}
            {preset.cwdHint && (
              <div className="space-y-1 rounded-md border bg-background/80 px-2.5 py-2">
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Working directory</p>
                <p className="text-[11px] leading-relaxed text-muted-foreground">{preset.cwdHint}</p>
              </div>
            )}
          </div>
        )}

        {isOpenCode && (
          <div className="space-y-3 rounded-md border bg-background/80 px-3 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 px-2.5 text-xs"
                disabled={isInstallingOpenCode}
                onClick={onInstallOpenCode}
              >
                <span className={`i-mingcute-download-2-line ${isInstallingOpenCode ? "animate-pulse" : ""}`}></span>
                {openCodeInstallStatus?.installed ? "Reinstall" : "Install"}
              </Button>
              {openCodeInstallStatus?.installed && (
                <span className="text-xs text-muted-foreground">v{openCodeInstallStatus.version}</span>
              )}
            </div>

            <div className="rounded-md border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
              {openCodeSetupMode === "managed-api-key" 
                ? "Using API key from DotAgents config."
                : "After installing, run in terminal: opencode auth login (requires free API key from opencode.ai)"}
            </div>
          </div>
        )}

        {isCodex && (
          <div className="space-y-3 rounded-md border bg-background/80 px-3 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 px-2.5 text-xs"
                disabled={isInstallingCodex}
                onClick={onInstallCodex}
              >
                <span className={`i-mingcute-download-2-line ${isInstallingCodex ? "animate-pulse" : ""}`}></span>
                {codexInstallStatus?.installed ? "Reinstall" : "Install"}
              </Button>
              {codexInstallStatus?.installed && (
                <span className="text-xs text-muted-foreground">v{codexInstallStatus.version}</span>
              )}
            </div>

            <div className="rounded-md border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
              After installing, run: codex login (requires OpenAI API key from platform.openai.com)
            </div>
          </div>
        )}

        {commandVerification && (
          <div
            className={`space-y-1 rounded-md border px-2.5 py-2 text-[11px] ${
              commandVerification.ok
                ? "border-emerald-500/40 bg-emerald-500/5"
                : "border-amber-500/40 bg-amber-500/5"
            }`}
          >
            <p className="font-medium">
              {commandVerification.ok ? "Verified" : "Verification needs attention"}
            </p>
            <p className="text-muted-foreground">
              {commandVerification.details || commandVerification.error}
            </p>
            {!commandVerification.ok && isOpenCode && openCodeSetupMode === "existing-auth" && (
              <p className="mt-1 font-medium text-amber-600">
                To authenticate: 1) Restart terminal 2) Run: opencode auth login 3) Get free key from opencode.ai
              </p>
            )}
          </div>
        )}
      </div>

      {error && !commandVerification?.error && (
        <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">
          <span className="i-mingcute-warning-fill mr-2"></span>
          {error}
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onContinue} disabled={isSubmitting || !commandVerification?.ok || requiresManagedOpenCodeKey}>
          {isSubmitting ? "Saving..." : "Continue"}
        </Button>
      </div>
    </div>
  )
}

function VoiceStep({
  isRecording,
  isTranscribing,
  dictationResult,
  onDictationResultChange,
  onStartRecording,
  onStopRecording,
  onNext,
  onBack,
  config,
  onSaveConfig,
  transcriptionError,
  micError,
  parakeetStatus,
  onDownloadParakeet,
  isParakeetDownloading,
}: {
  isRecording: boolean
  isTranscribing: boolean
  dictationResult: string | null
  onDictationResultChange: (value: string | null) => void
  onStartRecording: () => void
  onStopRecording: () => void
  onNext: () => void
  onBack: () => void
  config: Config | undefined
  onSaveConfig: (config: Partial<Config>) => void
  transcriptionError: string | null
  micError: string | null
  parakeetStatus?: { downloaded: boolean; downloading: boolean; progress: number; error?: string }
  onDownloadParakeet?: () => void
  isParakeetDownloading?: boolean
}) {
  const shortcut = config?.shortcut || "hold-ctrl"
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (dictationResult && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [dictationResult])

  const getShortcutDisplay = () => {
    if (shortcut === "hold-ctrl") return "Hold Ctrl"
    if (shortcut === "ctrl-slash") return "Press Ctrl+/"
    if (shortcut === "custom" && config?.customShortcut) {
      const mode = config.customShortcutMode || "hold"
      return mode === "hold" ? `Hold ${config.customShortcut}` : `Press ${config.customShortcut}`
    }
    return "Hold Ctrl"
  }

  const getButtonContent = () => {
    if (isTranscribing) return { icon: "i-mingcute-loading-fill animate-spin", text: "Transcribing..." }
    if (isRecording) return { icon: "i-mingcute-stop-fill", text: "Stop" }
    return { icon: "i-mingcute-mic-fill", text: "Record" }
  }

  const buttonContent = getButtonContent()

  const isSttReady = parakeetStatus?.downloaded || Boolean(config?.groqApiKey || config?.openaiApiKey || config?.geminiApiKey)

  return (
    <div>
      <StepIndicator current={3} total={4} />
      <h2 className="mb-2 text-center text-2xl font-bold">Try voice dictation</h2>
      <p className="mb-4 text-center text-muted-foreground">
        This step is optional. If speech-to-text is not ready yet, you can skip the demo and finish onboarding.
      </p>

      <div className="mb-4 rounded-lg border bg-primary/5 p-3 text-sm text-muted-foreground">
        Current voice stack: STT <strong className="text-foreground">{parakeetStatus?.downloaded ? "Parakeet" : getProviderLabel(config?.sttProviderId)}</strong>
        {" · "}
        TTS <strong className="text-foreground">{getProviderLabel(config?.ttsProviderId)}</strong>
      </div>

      {parakeetStatus && !parakeetStatus.downloaded && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 p-3">
          <div className="text-sm">
            <p className="font-medium">Install local STT (Parakeet)</p>
            <p className="text-xs text-muted-foreground">Works offline, no API key needed</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={onDownloadParakeet}
            disabled={isParakeetDownloading || parakeetStatus.downloading}
          >
            {parakeetStatus.downloading ? (
              <>Downloading {Math.round(parakeetStatus.progress * 100)}%</>
            ) : (
              "Install"
            )}
          </Button>
        </div>
      )}

      {parakeetStatus?.downloaded && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-green-500/20 bg-green-500/5 p-3">
          <div className="text-sm">
            <p className="font-medium text-green-600 dark:text-green-400">Parakeet STT ready</p>
            <p className="text-xs text-muted-foreground">Local model installed, works offline</p>
          </div>
          <span className="i-mingcute-check-circle-fill text-green-600 dark:text-green-400"></span>
        </div>
      )}

      <div className="mb-6 rounded-lg border bg-muted/30 p-4">
        <div className="mb-3 flex items-center gap-2">
          <span className="i-mingcute-keyboard-fill text-lg text-primary"></span>
          <label className="text-sm font-medium">Recording hotkey</label>
        </div>
        <div className="space-y-3">
          <Select
            value={shortcut}
            onValueChange={(value) => onSaveConfig({ shortcut: value as Config["shortcut"] })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hold-ctrl">Hold Ctrl</SelectItem>
              <SelectItem value="ctrl-slash">Ctrl+/</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>

          {shortcut === "custom" && (
            <>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Mode</label>
                <Select
                  value={config?.customShortcutMode || "hold"}
                  onValueChange={(value: "hold" | "toggle") => {
                    onSaveConfig({ customShortcutMode: value })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hold">Hold (Press and hold to record)</SelectItem>
                    <SelectItem value="toggle">Toggle (Press once to start, again to stop)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <KeyRecorder
                value={config?.customShortcut || ""}
                onChange={(keyCombo) => onSaveConfig({ customShortcut: keyCombo })}
                placeholder="Click to record custom shortcut"
              />
            </>
          )}
        </div>
      </div>

      <div className="mb-6 flex flex-col items-center gap-4">
        {isSttReady ? (
          <>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Button
                  size="lg"
                  variant={isRecording ? "destructive" : "default"}
                  onClick={isRecording ? onStopRecording : onStartRecording}
                  disabled={isTranscribing}
                  className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-full"
                >
                  <span className={`text-2xl ${buttonContent.icon}`}></span>
                  <span className="text-xs">{buttonContent.text}</span>
                </Button>
                {isRecording && (
                  <div className="pointer-events-none absolute inset-0 animate-ping rounded-full border-4 border-red-500"></div>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                <p className="font-medium">Or use your hotkey:</p>
                <p className="font-semibold text-primary">{getShortcutDisplay()}</p>
              </div>
            </div>

            <div className="w-full">
              <label className="mb-2 block text-sm font-medium">Transcription result</label>
              <Textarea
                ref={textareaRef}
                value={dictationResult || ""}
                onChange={(event) => onDictationResultChange(event.target.value || null)}
                placeholder={
                  isRecording
                    ? "Listening..."
                    : isTranscribing
                      ? "Transcribing..."
                      : "Your transcribed text will appear here..."
                }
                className="min-h-[100px] resize-none"
                readOnly={isRecording || isTranscribing}
              />
            </div>
          </>
        ) : (
          <div className="text-center text-sm text-muted-foreground">
            <p>Install the Parakeet model above or add an API key in Settings to use voice dictation.</p>
          </div>
        )}

        {micError && (
          <div className="w-full rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">
            <span className="i-mingcute-warning-fill mr-2"></span>
            {micError}
          </div>
        )}

        {transcriptionError && (
          <div className="w-full rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">
            <span className="i-mingcute-warning-fill mr-2"></span>
            {transcriptionError}
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={isRecording || isTranscribing}>
          Back
        </Button>
        <Button onClick={onNext} disabled={isRecording || isTranscribing}>
          Continue
        </Button>
      </div>
    </div>
  )
}

function FinishStep({
  selectedChoiceId,
  byokProviderId,
  provisionedAgentName,
  selectedOptionDescription,
  selectedOptionMode,
  onBack,
  onComplete,
  config,
  onSaveConfig,
}: {
  selectedChoiceId: OnboardingMainAgentChoiceId
  byokProviderId: ByokProviderId
  provisionedAgentName: string | null
  selectedOptionDescription: string
  selectedOptionMode: "api" | "acp"
  onBack: () => void
  onComplete: () => void
  config: Config | undefined
  onSaveConfig: (config: Partial<Config>) => void
}) {
  const mcpToolsShortcut = config?.mcpToolsShortcut || "hold-ctrl-alt"
  const mainAgentSummary =
    selectedChoiceId === "byok"
      ? `DotAgents built-in agent (${BYOK_PROVIDER_DETAILS[byokProviderId].label})`
      : provisionedAgentName || EXTERNAL_AGENT_PRESETS[selectedChoiceId].displayName

  return (
    <div>
      <StepIndicator current={4} total={4} />
      <h2 className="mb-2 text-center text-2xl font-bold">You’re ready to go</h2>
      <p className="mb-6 text-center text-muted-foreground">
        Review your default agent setup and pick the hotkey you want for agent mode.
      </p>

      <div className="mb-4 rounded-lg border bg-muted/30 p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="font-semibold">Main agent</h3>
          <span className="rounded-full border px-2 py-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">
            {selectedOptionMode}
          </span>
        </div>
        <p className="text-sm text-foreground">{mainAgentSummary}</p>
        <p className="mt-1 text-xs text-muted-foreground">{selectedOptionDescription}</p>
      </div>

      <div className="mb-6 rounded-lg border bg-muted/30 p-4">
        <div className="mb-3 flex items-center gap-2">
          <span className="i-mingcute-keyboard-fill text-lg text-primary"></span>
          <label className="text-sm font-medium">Agent mode hotkey</label>
        </div>
        <div className="space-y-3">
          <Select
            value={mcpToolsShortcut}
            onValueChange={(value) => {
              onSaveConfig({ mcpToolsShortcut: value as Config["mcpToolsShortcut"] })
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hold-ctrl-alt">Hold Ctrl+Alt</SelectItem>
              <SelectItem value="toggle-ctrl-alt">Toggle Ctrl+Alt</SelectItem>
              <SelectItem value="ctrl-alt-slash">Ctrl+Alt+/</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>

          {mcpToolsShortcut === "custom" && (
            <KeyRecorder
              value={config?.customMcpToolsShortcut || ""}
              onChange={(keyCombo) => onSaveConfig({ customMcpToolsShortcut: keyCombo })}
              placeholder="Click to record custom agent mode shortcut"
            />
          )}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Current shortcut: {getMcpToolsShortcutDisplay(mcpToolsShortcut, config?.customMcpToolsShortcut)}
        </p>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onComplete} size="lg">
          Start Using {process.env.PRODUCT_NAME}
        </Button>
      </div>
    </div>
  )
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="mb-6 flex justify-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`w-3 h-3 rounded-full transition-colors ${
            i + 1 <= current ? "bg-primary" : "bg-muted"
          }`}
        />
      ))}
    </div>
  )
}
