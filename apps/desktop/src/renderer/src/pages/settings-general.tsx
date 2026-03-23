import { Control, ControlGroup, ControlLabel } from "@renderer/components/ui/control"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@renderer/components/ui/select"
import { Switch } from "@renderer/components/ui/switch"
import { STT_PROVIDER_ID } from "@shared/index"
import { SUPPORTED_LANGUAGES } from "@shared/languages"
import { Textarea } from "@renderer/components/ui/textarea"
import { Input } from "@renderer/components/ui/input"
import { Button } from "@renderer/components/ui/button"
import {
  useConfigQuery,
  useSaveConfigMutation,
} from "@renderer/lib/query-client"
import { getSelectableMainAcpAgents } from "./settings-general-main-agent-options"
import { ttsManager } from "@renderer/lib/tts-manager"
import { tipcClient } from "@renderer/lib/tipc-client"
import { ExternalLink, FolderOpen, FolderUp, FileText } from "lucide-react"
import { toast } from "sonner"
import { useCallback, useEffect, useRef, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { Config } from "@shared/types"
import { KeyRecorder } from "@renderer/components/key-recorder"
import {
  getEffectiveShortcut,
  formatKeyComboForDisplay,
} from "@shared/key-utils"
import { RemoteServerSettingsGroups } from "./settings-remote-server"
import { useAudioDevices } from "@renderer/hooks/use-audio-devices"

const SETTINGS_TEXT_SAVE_DEBOUNCE_MS = 400
const MCP_MAX_ITERATIONS_MIN = 1
const MCP_MAX_ITERATIONS_MAX = 50
const MCP_MAX_ITERATIONS_DEFAULT = 10
const MCP_SESSION_COST_LIMIT_MIN = 0.01
const MCP_SESSION_COST_LIMIT_MAX = 100
const MCP_SESSION_COST_LIMIT_DEFAULT = 1

type LangfuseDraftKey = "langfusePublicKey" | "langfuseSecretKey" | "langfuseBaseUrl"

function getLangfuseDrafts(config: Config | undefined) {
  return {
    langfusePublicKey: config?.langfusePublicKey ?? "",
    langfuseSecretKey: config?.langfuseSecretKey ?? "",
    langfuseBaseUrl: config?.langfuseBaseUrl ?? "",
  }
}

function parseMcpMaxIterationsDraft(value: string) {
  const parsedValue = Number.parseInt(value, 10)
  if (Number.isNaN(parsedValue)) return null
  if (parsedValue < MCP_MAX_ITERATIONS_MIN || parsedValue > MCP_MAX_ITERATIONS_MAX) return null
  return parsedValue
}

function formatMcpSessionCostLimitDraft(value: number | undefined) {
  const normalizedValue = typeof value === "number" && value > 0
    ? value
    : MCP_SESSION_COST_LIMIT_DEFAULT
  return normalizedValue.toFixed(2)
}

function parseMcpSessionCostLimitDraft(value: string) {
  const parsedValue = Number.parseFloat(value)
  if (Number.isNaN(parsedValue)) return null
  if (parsedValue < MCP_SESSION_COST_LIMIT_MIN || parsedValue > MCP_SESSION_COST_LIMIT_MAX) return null
  return Math.round(parsedValue * 100) / 100
}

export function Component() {
  const configQuery = useConfigQuery()
  const navigate = useNavigate()
  const cfg = configQuery.data as Config | undefined

  const saveConfigMutation = useSaveConfigMutation()
  const cfgRef = useRef<Config | undefined>(cfg)
  const [langfuseDrafts, setLangfuseDrafts] = useState(() => getLangfuseDrafts(cfg))
  const langfuseSaveTimeoutsRef = useRef<Partial<Record<LangfuseDraftKey, ReturnType<typeof setTimeout>>>>({})
  const [groqSttPromptDraft, setGroqSttPromptDraft] = useState(() => cfg?.groqSttPrompt ?? "")
  const groqSttPromptSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [mcpMaxIterationsDraft, setMcpMaxIterationsDraft] = useState(
    () => String(cfg?.mcpMaxIterations ?? MCP_MAX_ITERATIONS_DEFAULT),
  )
  const mcpMaxIterationsSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [mcpSessionCostLimitDraft, setMcpSessionCostLimitDraft] = useState(
    () => formatMcpSessionCostLimitDraft(cfg?.mcpSessionCostLimitUsd),
  )
  const mcpSessionCostLimitSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Defer audio device enumeration until the user expands the Audio Devices section
  const [audioSectionOpen, setAudioSectionOpen] = useState(false)
  const { inputDevices: audioInputDevices, outputDevices: audioOutputDevices } = useAudioDevices(audioSectionOpen)

  // Check if langfuse package is installed
  const langfuseInstalledQuery = useQuery({
    queryKey: ["langfuseInstalled"],
    queryFn: async () => {
      return window.electron.ipcRenderer.invoke("isLangfuseInstalled")
    },
    staleTime: Infinity, // Only check once per session
  })

  const agentsFoldersQuery = useQuery({
    queryKey: ["agentsFolders"],
    queryFn: async () => {
      return tipcClient.getAgentsFolders()
    },
    staleTime: Infinity,
  })

  const externalAgentsQuery = useQuery({
    queryKey: ["externalAgents"],
    queryFn: async () => {
      return tipcClient.getExternalAgents()
    },
    staleTime: 30_000,
  })

  const isLangfuseInstalled = langfuseInstalledQuery.data ?? true // Default to true while loading
  const selectableMainAcpAgents = getSelectableMainAcpAgents(
    externalAgentsQuery.data,
    configQuery.data?.acpAgents
  )

  const openGlobalAgentsFolder = useCallback(async () => {
    try {
      const result = await tipcClient.openAgentsFolder()
      if (!result?.success) {
        toast.error(result?.error || "Failed to open global .agents folder")
      }
    } catch (error) {
      console.error("Failed to open global .agents folder:", error)
      toast.error("Failed to open global .agents folder")
    }
  }, [])

  const openWorkspaceAgentsFolder = useCallback(async () => {
    try {
      const result = await tipcClient.openWorkspaceAgentsFolder()
      if (!result?.success) {
        toast.error(result?.error || "Failed to open workspace .agents folder")
      }
    } catch (error) {
      console.error("Failed to open workspace .agents folder:", error)
      toast.error("Failed to open workspace .agents folder")
    }
  }, [])

  const openSystemPromptFile = useCallback(async () => {
    try {
      const result = await tipcClient.openSystemPromptFile()
      if (!result?.success) {
        toast.error(result?.error || "Failed to reveal system prompt file")
      }
    } catch (error) {
      console.error("Failed to reveal system prompt file:", error)
      toast.error("Failed to reveal system prompt file")
    }
  }, [])

  const openAgentsGuidelinesFile = useCallback(async () => {
    try {
      const result = await tipcClient.openAgentsGuidelinesFile()
      if (!result?.success) {
        toast.error(result?.error || "Failed to reveal guidelines file")
      }
    } catch (error) {
      console.error("Failed to reveal guidelines file:", error)
      toast.error("Failed to reveal guidelines file")
    }
  }, [])

  const showFloatingPanelNow = useCallback(async () => {
    try {
      await tipcClient.resizePanelToNormal({})
      await tipcClient.showPanelWindow({})
      toast.success("Floating panel shown")
    } catch (error) {
      console.error("Failed to show floating panel:", error)
      toast.error("Failed to show floating panel")
    }
  }, [])

  const resetFloatingPanel = useCallback(async () => {
    try {
      const result = await tipcClient.resetFloatingPanel({})
      if (result && "success" in result && result.success === false) {
        toast.error("Failed to reset floating panel")
        return
      }
      toast.success("Floating panel reset to the default position")
    } catch (error) {
      console.error("Failed to reset floating panel:", error)
      toast.error("Failed to reset floating panel")
    }
  }, [])

  const saveConfig = useCallback(
    (config: Partial<Config>) => {
      const currentConfig = cfgRef.current
      if (!currentConfig) return

      saveConfigMutation.mutate({
        config: {
          ...currentConfig,
          ...config,
        },
      })
    },
    [saveConfigMutation],
  )

  useEffect(() => {
    cfgRef.current = cfg
  }, [cfg])

  useEffect(() => {
    setLangfuseDrafts(getLangfuseDrafts(cfg))
  }, [cfg?.langfusePublicKey, cfg?.langfuseSecretKey, cfg?.langfuseBaseUrl])

  useEffect(() => {
    setGroqSttPromptDraft(cfg?.groqSttPrompt ?? "")
  }, [cfg?.groqSttPrompt])

  useEffect(() => {
    setMcpMaxIterationsDraft(String(cfg?.mcpMaxIterations ?? MCP_MAX_ITERATIONS_DEFAULT))
  }, [cfg?.mcpMaxIterations])

  useEffect(() => {
    setMcpSessionCostLimitDraft(formatMcpSessionCostLimitDraft(cfg?.mcpSessionCostLimitUsd))
  }, [cfg?.mcpSessionCostLimitUsd])

  useEffect(() => {
    return () => {
      for (const timeout of Object.values(langfuseSaveTimeoutsRef.current) as Array<ReturnType<typeof setTimeout> | undefined>) {
        if (timeout) clearTimeout(timeout)
      }

      if (groqSttPromptSaveTimeoutRef.current) {
        clearTimeout(groqSttPromptSaveTimeoutRef.current)
      }

      if (mcpMaxIterationsSaveTimeoutRef.current) {
        clearTimeout(mcpMaxIterationsSaveTimeoutRef.current)
      }

      if (mcpSessionCostLimitSaveTimeoutRef.current) {
        clearTimeout(mcpSessionCostLimitSaveTimeoutRef.current)
      }
    }
  }, [])

  const flushLangfuseSave = useCallback((key: LangfuseDraftKey, value: string) => {
    const pendingSave = langfuseSaveTimeoutsRef.current[key]
    if (pendingSave) {
      clearTimeout(pendingSave)
      delete langfuseSaveTimeoutsRef.current[key]
    }

    saveConfig({ [key]: value || undefined } as Partial<Config>)
  }, [saveConfig])

  const scheduleLangfuseSave = useCallback((key: LangfuseDraftKey, value: string) => {
    const pendingSave = langfuseSaveTimeoutsRef.current[key]
    if (pendingSave) {
      clearTimeout(pendingSave)
    }

    langfuseSaveTimeoutsRef.current[key] = setTimeout(() => {
      delete langfuseSaveTimeoutsRef.current[key]
      saveConfig({ [key]: value || undefined } as Partial<Config>)
    }, SETTINGS_TEXT_SAVE_DEBOUNCE_MS)
  }, [saveConfig])

  const updateLangfuseDraft = useCallback((key: LangfuseDraftKey, value: string) => {
    setLangfuseDrafts((currentDrafts) => ({
      ...currentDrafts,
      [key]: value,
    }))
    scheduleLangfuseSave(key, value)
  }, [scheduleLangfuseSave])

  const flushGroqSttPromptSave = useCallback((value: string) => {
    if (groqSttPromptSaveTimeoutRef.current) {
      clearTimeout(groqSttPromptSaveTimeoutRef.current)
      groqSttPromptSaveTimeoutRef.current = null
    }

    saveConfig({ groqSttPrompt: value || undefined })
  }, [saveConfig])

  const scheduleGroqSttPromptSave = useCallback((value: string) => {
    if (groqSttPromptSaveTimeoutRef.current) {
      clearTimeout(groqSttPromptSaveTimeoutRef.current)
    }

    groqSttPromptSaveTimeoutRef.current = setTimeout(() => {
      groqSttPromptSaveTimeoutRef.current = null
      saveConfig({ groqSttPrompt: value || undefined })
    }, SETTINGS_TEXT_SAVE_DEBOUNCE_MS)
  }, [saveConfig])

  const updateGroqSttPromptDraft = useCallback((value: string) => {
    setGroqSttPromptDraft(value)
    scheduleGroqSttPromptSave(value)
  }, [scheduleGroqSttPromptSave])

  const flushMcpMaxIterationsSave = useCallback((value: string) => {
    if (mcpMaxIterationsSaveTimeoutRef.current) {
      clearTimeout(mcpMaxIterationsSaveTimeoutRef.current)
      mcpMaxIterationsSaveTimeoutRef.current = null
    }

    const parsedValue = parseMcpMaxIterationsDraft(value)
    if (parsedValue === null) {
      setMcpMaxIterationsDraft(String(cfgRef.current?.mcpMaxIterations ?? MCP_MAX_ITERATIONS_DEFAULT))
      return
    }

    saveConfig({ mcpMaxIterations: parsedValue })
  }, [saveConfig])

  const scheduleMcpMaxIterationsSave = useCallback((value: string) => {
    if (mcpMaxIterationsSaveTimeoutRef.current) {
      clearTimeout(mcpMaxIterationsSaveTimeoutRef.current)
      mcpMaxIterationsSaveTimeoutRef.current = null
    }

    const parsedValue = parseMcpMaxIterationsDraft(value)
    if (parsedValue === null) return

    mcpMaxIterationsSaveTimeoutRef.current = setTimeout(() => {
      mcpMaxIterationsSaveTimeoutRef.current = null
      saveConfig({ mcpMaxIterations: parsedValue })
    }, SETTINGS_TEXT_SAVE_DEBOUNCE_MS)
  }, [saveConfig])

  const updateMcpMaxIterationsDraft = useCallback((value: string) => {
    setMcpMaxIterationsDraft(value)
    scheduleMcpMaxIterationsSave(value)
  }, [scheduleMcpMaxIterationsSave])

  const flushMcpSessionCostLimitSave = useCallback((value: string) => {
    if (mcpSessionCostLimitSaveTimeoutRef.current) {
      clearTimeout(mcpSessionCostLimitSaveTimeoutRef.current)
      mcpSessionCostLimitSaveTimeoutRef.current = null
    }

    const parsedValue = parseMcpSessionCostLimitDraft(value)
    if (parsedValue === null) {
      setMcpSessionCostLimitDraft(formatMcpSessionCostLimitDraft(cfgRef.current?.mcpSessionCostLimitUsd))
      return
    }

    saveConfig({ mcpSessionCostLimitUsd: parsedValue })
  }, [saveConfig])

  const scheduleMcpSessionCostLimitSave = useCallback((value: string) => {
    if (mcpSessionCostLimitSaveTimeoutRef.current) {
      clearTimeout(mcpSessionCostLimitSaveTimeoutRef.current)
      mcpSessionCostLimitSaveTimeoutRef.current = null
    }

    const parsedValue = parseMcpSessionCostLimitDraft(value)
    if (parsedValue === null) return

    mcpSessionCostLimitSaveTimeoutRef.current = setTimeout(() => {
      mcpSessionCostLimitSaveTimeoutRef.current = null
      saveConfig({ mcpSessionCostLimitUsd: parsedValue })
    }, SETTINGS_TEXT_SAVE_DEBOUNCE_MS)
  }, [saveConfig])

  const updateMcpSessionCostLimitDraft = useCallback((value: string) => {
    setMcpSessionCostLimitDraft(value)
    scheduleMcpSessionCostLimitSave(value)
  }, [scheduleMcpSessionCostLimitSave])

  // Sync theme preference from config to localStorage when config loads
  useEffect(() => {
    if ((configQuery.data as any)?.themePreference) {
      localStorage.setItem("theme-preference", (configQuery.data as any).themePreference)
      window.dispatchEvent(
        new CustomEvent("theme-preference-changed", {
          detail: (configQuery.data as any).themePreference,
        }),
      )
    }
  }, [(configQuery.data as any)?.themePreference])

  const sttProviderId: STT_PROVIDER_ID =
    (configQuery.data as any)?.sttProviderId || "openai"
  const shortcut = (configQuery.data as any)?.shortcut || "hold-ctrl"
  const textInputShortcut = (configQuery.data as any)?.textInputShortcut || "ctrl-t"
  const recordingShortcutMode = cfg?.customShortcutMode || "hold"
  const effectiveRecordingShortcut = getEffectiveShortcut(shortcut, cfg?.customShortcut)
  const customRecordingShortcutDisplay = effectiveRecordingShortcut
    ? formatKeyComboForDisplay(effectiveRecordingShortcut)
    : "your custom shortcut"
  const recordingShortcutHelperText = shortcut === "hold-ctrl"
    ? "Hold Ctrl to record, release it to finish, and press any other key to cancel."
    : shortcut === "custom"
      ? recordingShortcutMode === "toggle"
        ? `Press ${customRecordingShortcutDisplay} to start and finish recording. Press Esc to cancel.`
        : `Hold ${customRecordingShortcutDisplay} to record, release it to finish, and press any other key to cancel.`
      : "Press Ctrl+/ to start and finish recording. Press Esc to cancel."


  if (!configQuery.data) return null

  return (
    <div className="modern-panel h-full overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-6">

      <div className="grid gap-4">
        {/* Agent Settings */}
        <ControlGroup collapsible defaultCollapsed title="Agent Settings">
          {/* Main Agent Mode Selection */}
          <Control label={<ControlLabel label="Main Agent Mode" tooltip="Choose how the main agent processes your requests. API mode uses external LLM APIs (OpenAI, Groq, Gemini). ACP mode routes prompts to a configured ACP agent like Claude Code." />} className="px-3">
            <Select
              value={configQuery.data?.mainAgentMode || "api"}
              onValueChange={(value: "api" | "acp") => {
                saveConfig({ mainAgentMode: value })
              }}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="api">API (OpenAI, Groq, Gemini)</SelectItem>
                <SelectItem value="acp">ACP Agent</SelectItem>
              </SelectContent>
            </Select>
          </Control>

          {configQuery.data?.mainAgentMode === "acp" && (
            <>
              <Control label={<ControlLabel label="ACP Agent" tooltip="Select which configured ACP agent to use as the main agent. The agent must be configured in the Agents settings page." />} className="px-3">
                <Select
                  value={configQuery.data?.mainAgentName || ""}
                  onValueChange={(value: string) => {
                    saveConfig({ mainAgentName: value })
                  }}
                >
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Select an agent..." />
                  </SelectTrigger>
                  <SelectContent>
                    {selectableMainAcpAgents.map(agent => (
                      <SelectItem key={agent.name} value={agent.name}>
                        {agent.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Control>

              {configQuery.data?.mainAgentName && (
                <div className="px-3 py-2 text-sm text-muted-foreground bg-muted/30 rounded-md mx-3 mb-2">
                  <span className="font-medium">Note:</span> When using ACP mode, the agent will use its own MCP tools and LLM, not DotAgents's configured providers and tools.
                </div>
              )}

              <Control label={<ControlLabel label="Inject DotAgents Runtime Tools" tooltip="When enabled, DotAgents runtime tools (delegation, user communication, completion signaling, command execution, skill loading) are injected into ACP agent sessions. Requires Remote Server to be enabled." />} className="px-3">
                <Switch
                  checked={configQuery.data?.acpInjectRuntimeTools !== false}
                  disabled={!configQuery.data?.remoteServerEnabled}
                  onCheckedChange={(value) => saveConfig({ acpInjectRuntimeTools: value })}
                />
              </Control>
              {!configQuery.data?.remoteServerEnabled && (
                <div className="px-3 py-2 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-2 mx-3 mb-2">
                  <span className="i-mingcute-warning-line h-4 w-4" />
                  <span>Enable Remote Server in settings to use tool injection</span>
                </div>
              )}
            </>
          )}

          <Control label={<ControlLabel label="Message Queuing" tooltip="Allow queueing messages while the agent is processing. Messages will be processed in order after the current task completes." />} className="px-3">
            <Switch
              checked={configQuery.data?.mcpMessageQueueEnabled ?? true}
              onCheckedChange={(value) => saveConfig({ mcpMessageQueueEnabled: value })}
            />
          </Control>
          <Control label={<ControlLabel label="Require Tool Approval" tooltip="Adds a confirmation dialog before any tool executes. Recommended for safety." />} className="px-3">
            <Switch
              checked={configQuery.data?.mcpRequireApprovalBeforeToolCall ?? false}
              onCheckedChange={(value) => saveConfig({ mcpRequireApprovalBeforeToolCall: value })}
            />
          </Control>

          <Control label={<ControlLabel label="Verify Task Completion" tooltip="When enabled, the agent will verify whether the user's task has been completed before finishing. Disable for faster responses without verification." />} className="px-3">
            <Switch
              checked={configQuery.data?.mcpVerifyCompletionEnabled ?? true}
              onCheckedChange={(value) => saveConfig({ mcpVerifyCompletionEnabled: value })}
            />
          </Control>

          <Control label={<ControlLabel label="Final Summary" tooltip="When enabled, the agent will generate a concise final summary after completing a task. Disable for faster responses without the summary step." />} className="px-3">
            <Switch
              checked={configQuery.data?.mcpFinalSummaryEnabled ?? true}
              onCheckedChange={(value) => saveConfig({ mcpFinalSummaryEnabled: value })}
            />
          </Control>

          <Control label={<ControlLabel label="Unlimited Iterations" tooltip="Allow the agent to run indefinitely without an iteration limit. Use with caution as it may run for a long time." />} className="px-3">
            <Switch
              checked={configQuery.data?.mcpUnlimitedIterations ?? true}
              onCheckedChange={(checked) => saveConfig({ mcpUnlimitedIterations: checked })}
            />
          </Control>

          {!(configQuery.data?.mcpUnlimitedIterations ?? true) && (
            <Control label={<ControlLabel label="Max Iterations" tooltip="Maximum number of iterations the agent can perform before stopping. Higher values allow more complex tasks but may take longer." />} className="px-3">
              <Input
                type="number"
                min={String(MCP_MAX_ITERATIONS_MIN)}
                max={String(MCP_MAX_ITERATIONS_MAX)}
                step="1"
                value={mcpMaxIterationsDraft}
                onChange={(e) => updateMcpMaxIterationsDraft(e.currentTarget.value)}
                onBlur={(e) => flushMcpMaxIterationsSave(e.currentTarget.value)}
                placeholder={String(MCP_MAX_ITERATIONS_DEFAULT)}
                className="w-32"
              />
            </Control>
          )}

          <Control label={<ControlLabel label="Session Cost Limit (USD)" tooltip="Estimated LLM spend ceiling for a single agent session. Lower values stop runaway sessions sooner." />} className="px-3">
            <div className="space-y-2">
              <Input
                type="number"
                min={String(MCP_SESSION_COST_LIMIT_MIN)}
                max={String(MCP_SESSION_COST_LIMIT_MAX)}
                step="0.01"
                value={mcpSessionCostLimitDraft}
                onChange={(e) => updateMcpSessionCostLimitDraft(e.currentTarget.value)}
                onBlur={(e) => flushMcpSessionCostLimitSave(e.currentTarget.value)}
                placeholder={formatMcpSessionCostLimitDraft(MCP_SESSION_COST_LIMIT_DEFAULT)}
                className="w-32"
              />
              <p className="text-xs text-muted-foreground">
                Estimated from model pricing and token usage. Default: $1.00 per session.
              </p>
            </div>
          </Control>

          <Control label={<ControlLabel label="Emergency Kill Switch" tooltip="Provides a global hotkey to immediately stop agent mode and kill all agent-created processes" />} className="px-3">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Switch
                  checked={configQuery.data?.agentKillSwitchEnabled !== false}
                  onCheckedChange={(checked) => saveConfig({ agentKillSwitchEnabled: checked })}
                />
                <span className="text-sm text-muted-foreground">Enable kill switch</span>
              </div>

              {configQuery.data?.agentKillSwitchEnabled !== false && (
                <>
                  <Select
                    value={configQuery.data?.agentKillSwitchHotkey || "ctrl-shift-escape"}
                    onValueChange={(value: "ctrl-shift-escape" | "ctrl-alt-q" | "ctrl-shift-q" | "custom") => {
                      saveConfig({ agentKillSwitchHotkey: value })
                    }}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ctrl-shift-escape">Ctrl + Shift + Escape</SelectItem>
                      <SelectItem value="ctrl-alt-q">Ctrl + Alt + Q</SelectItem>
                      <SelectItem value="ctrl-shift-q">Ctrl + Shift + Q</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>

                  {configQuery.data?.agentKillSwitchHotkey === "custom" && (
                    <KeyRecorder
                      value={configQuery.data?.customAgentKillSwitchHotkey || ""}
                      onChange={(keyCombo) => saveConfig({ customAgentKillSwitchHotkey: keyCombo })}
                      placeholder="Click to record custom kill switch hotkey"
                    />
                  )}
                </>
              )}
            </div>
          </Control>
        </ControlGroup>

        <ControlGroup collapsible defaultCollapsed title="General">
          {process.env.IS_MAC && (
            <Control label="Hide Dock Icon" className="px-3">
              <Switch
                defaultChecked={configQuery.data.hideDockIcon}
                onCheckedChange={(value) => {
                  saveConfig({
                    hideDockIcon: value,
                  })
                }}
              />
            </Control>
          )}
          <Control label="Launch at Login" className="px-3">
            <Switch
              defaultChecked={configQuery.data.launchAtLogin ?? false}
              onCheckedChange={(value) => {
                saveConfig({
                  launchAtLogin: value,
                })
              }}
            />
          </Control>

          <Control label={<ControlLabel label="Streamer Mode" tooltip="Hide sensitive information (phone numbers, QR codes, API keys) when streaming or sharing your screen" />} className="px-3">
            <Switch
              defaultChecked={configQuery.data.streamerModeEnabled ?? false}
              onCheckedChange={(value) => {
                saveConfig({
                  streamerModeEnabled: value,
                })
              }}
            />
          </Control>
          {configQuery.data.streamerModeEnabled && (
            <div className="px-3 py-2 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <span className="i-mingcute-eye-off-line h-4 w-4" />
              <span>Streamer Mode is active - sensitive information is hidden</span>
            </div>
          )}
          <Control label="Theme" className="px-3">
            <Select
              value={configQuery.data.themePreference || "system"}
              onValueChange={(value: "system" | "light" | "dark") => {
                saveConfig({
                  themePreference: value,
                })
                // Update localStorage immediately to sync with ThemeProvider
                localStorage.setItem("theme-preference", value)
                // Apply theme immediately
                window.dispatchEvent(
                  new CustomEvent("theme-preference-changed", {
                    detail: value,
                  }),
                )
              }}
            >
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
              </SelectContent>
            </Select>
          </Control>
        </ControlGroup>

        <RemoteServerSettingsGroups collapsible defaultCollapsed />

        <ControlGroup
          collapsible
          defaultCollapsed
          title="Modular config (.agents)"
        >
          <div className="px-3 py-2 text-sm leading-5 text-muted-foreground">
            Advanced configuration can live in <span className="font-mono">.agents</span>. Workspace{" "}
            <span className="font-mono">.agents</span> overrides the global layer when present (or when{" "}
            <span className="font-mono">DOTAGENTS_WORKSPACE_DIR</span> is set). Skills live in{" "}
            <span className="font-mono">skills/&lt;id&gt;/skill.md</span> and knowledge notes in{" "}
            <span className="font-mono">knowledge/&lt;slug&gt;/&lt;slug&gt;.md</span>. Frontmatter uses simple{" "}
            <span className="font-mono">key: value</span> lines (not YAML).
          </div>
          <Control label="Global folder" className="px-3">
            <div className="text-right font-mono text-xs text-muted-foreground break-all">
              {agentsFoldersQuery.data?.global?.agentsDir ?? "Loading..."}
            </div>
          </Control>
          <Control
            label={
              <ControlLabel
                label="Workspace folder"
                tooltip="Optional overlay layer. When present, it overrides the global .agents layer."
              />
            }
            className="px-3"
          >
            <div className="text-right font-mono text-xs text-muted-foreground break-all">
              {agentsFoldersQuery.isLoading
                ? "Loading..."
                : agentsFoldersQuery.data?.workspace?.agentsDir ?? "Not detected"}
              {agentsFoldersQuery.data?.workspace?.agentsDir && agentsFoldersQuery.data?.workspaceSource
                ? ` (${agentsFoldersQuery.data.workspaceSource})`
                : ""}
            </div>
          </Control>
          <Control label="Open folders & files" className="px-3">
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={openGlobalAgentsFolder}>
                <FolderOpen className="h-3 w-3" />
                Global Folder
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={openWorkspaceAgentsFolder}
                disabled={!agentsFoldersQuery.data?.workspace?.agentsDir}
              >
                <FolderUp className="h-3 w-3" />
                Workspace Folder
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={openSystemPromptFile}>
                <FileText className="h-3 w-3" />
                System Prompt
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={openAgentsGuidelinesFile}>
                <FileText className="h-3 w-3" />
                Guidelines
              </Button>
            </div>
          </Control>
        </ControlGroup>

        <ControlGroup
          collapsible
          defaultCollapsed
          title="Shortcuts"
          endDescription={
            <div className="leading-relaxed">
              {recordingShortcutHelperText}
            </div>
          }
        >
          <Control label="Recording" className="px-3">
            <div className="space-y-2">
              <Select
                defaultValue={shortcut}
                onValueChange={(value) => {
                  saveConfig({
                    shortcut: value as typeof configQuery.data.shortcut,
                  })
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hold-ctrl">Hold Ctrl</SelectItem>
                  <SelectItem value="ctrl-slash">Ctrl+{"/"}</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>

              {shortcut === "custom" && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Mode</label>
                    <Select
                      value={configQuery.data?.customShortcutMode || "hold"}
                      onValueChange={(value: "hold" | "toggle") => {
                        saveConfig({
                          customShortcutMode: value,
                        })
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
                    value={configQuery.data?.customShortcut || ""}
                    onChange={(keyCombo) => {
                      saveConfig({
                        customShortcut: keyCombo,
                      })
                    }}
                    placeholder="Click to record custom shortcut"
                  />
                </>
              )}
            </div>
          </Control>

          <Control label="Toggle Voice Dictation" className="px-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Switch
                  checked={configQuery.data?.toggleVoiceDictationEnabled || false}
                  onCheckedChange={(checked) => {
                    saveConfig({
                      toggleVoiceDictationEnabled: checked,
                    })
                  }}
                />
                <span className="text-sm text-muted-foreground">
                  Enable toggle mode (press once to start, press again to stop)
                </span>
              </div>

              {configQuery.data?.toggleVoiceDictationEnabled && (
                <>
                  <Select
                    defaultValue={configQuery.data?.toggleVoiceDictationHotkey || "fn"}
                    onValueChange={(value) => {
                      saveConfig({
                        toggleVoiceDictationHotkey: value as typeof configQuery.data.toggleVoiceDictationHotkey,
                      })
                    }}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fn">Fn</SelectItem>
                      <SelectItem value="f1">F1</SelectItem>
                      <SelectItem value="f2">F2</SelectItem>
                      <SelectItem value="f3">F3</SelectItem>
                      <SelectItem value="f4">F4</SelectItem>
                      <SelectItem value="f5">F5</SelectItem>
                      <SelectItem value="f6">F6</SelectItem>
                      <SelectItem value="f7">F7</SelectItem>
                      <SelectItem value="f8">F8</SelectItem>
                      <SelectItem value="f9">F9</SelectItem>
                      <SelectItem value="f10">F10</SelectItem>
                      <SelectItem value="f11">F11</SelectItem>
                      <SelectItem value="f12">F12</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>

                  {configQuery.data?.toggleVoiceDictationHotkey === "custom" && (
                    <KeyRecorder
                      value={configQuery.data?.customToggleVoiceDictationHotkey || ""}
                      onChange={(keyCombo) => {
                        saveConfig({
                          customToggleVoiceDictationHotkey: keyCombo,
                        })
                      }}
                      placeholder="Click to record custom toggle shortcut"
                    />
                  )}
                </>
              )}
            </div>
          </Control>

          <Control label="Text Input" className="px-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Switch
                  checked={configQuery.data?.textInputEnabled ?? true}
                  onCheckedChange={(checked) => {
                    saveConfig({
                      textInputEnabled: checked,
                    })
                  }}
                />
                <Select
                  value={textInputShortcut}
                  onValueChange={(value) => {
                    saveConfig({
                      textInputShortcut:
                        value as typeof configQuery.data.textInputShortcut,
                    })
                  }}
                  disabled={!configQuery.data?.textInputEnabled}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ctrl-t">Ctrl+T</SelectItem>
                    <SelectItem value="ctrl-shift-t">Ctrl+Shift+T</SelectItem>
                    <SelectItem value="alt-t">Alt+T</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {textInputShortcut === "custom" &&
                configQuery.data?.textInputEnabled && (
                  <KeyRecorder
                    value={configQuery.data?.customTextInputShortcut || ""}
                    onChange={(keyCombo) => {
                      saveConfig({
                        customTextInputShortcut: keyCombo,
                      })
                    }}
                    placeholder="Click to record custom text input shortcut"
                  />
                )}
            </div>
          </Control>

          <Control label="Show Main Window" className="px-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Switch
                  checked={configQuery.data?.settingsHotkeyEnabled ?? true}
                  onCheckedChange={(checked) => {
                    saveConfig({
                      settingsHotkeyEnabled: checked,
                    })
                  }}
                />
                <Select
                  value={configQuery.data?.settingsHotkey || "ctrl-shift-s"}
                  onValueChange={(value) => {
                    saveConfig({
                      settingsHotkey:
                        value as typeof configQuery.data.settingsHotkey,
                    })
                  }}
                  disabled={!configQuery.data?.settingsHotkeyEnabled}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ctrl-shift-s">Ctrl+Shift+S</SelectItem>
                    <SelectItem value="ctrl-comma">Ctrl+,</SelectItem>
                    <SelectItem value="ctrl-shift-comma">Ctrl+Shift+,</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {configQuery.data?.settingsHotkey === "custom" &&
                configQuery.data?.settingsHotkeyEnabled && (
                  <KeyRecorder
                    value={configQuery.data?.customSettingsHotkey || ""}
                    onChange={(keyCombo) => {
                      saveConfig({
                        customSettingsHotkey: keyCombo,
                      })
                    }}
                    placeholder="Click to record custom hotkey"
                  />
                )}
            </div>
          </Control>

          <Control label={<ControlLabel label="Agent Mode" tooltip="Choose how to activate agent mode for MCP tool calling" />} className="px-3">
            <div className="space-y-2">
              <Select
                value={configQuery.data?.mcpToolsShortcut || "hold-ctrl-alt"}
                onValueChange={(value: "hold-ctrl-alt" | "toggle-ctrl-alt" | "ctrl-alt-slash" | "custom") => {
                  saveConfig({ mcpToolsShortcut: value })
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

              {configQuery.data?.mcpToolsShortcut === "custom" && (
                <KeyRecorder
                  value={configQuery.data?.customMcpToolsShortcut || ""}
                  onChange={(keyCombo) => {
                    saveConfig({ customMcpToolsShortcut: keyCombo })
                  }}
                  placeholder="Click to record custom agent mode shortcut"
                />
              )}
            </div>
          </Control>
        </ControlGroup>

        <ControlGroup collapsible defaultCollapsed title="Audio Devices" onOpenChange={setAudioSectionOpen}>
          <Control label={<ControlLabel label="Microphone" tooltip="Select which microphone to use for speech recognition. 'System Default' uses your OS default input device." />} className="px-3">
            <Select
              value={configQuery.data.audioInputDeviceId || "default"}
              onValueChange={(value) => {
                saveConfig({
                  audioInputDeviceId: value === "default" ? undefined : value,
                })
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="System Default" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">System Default</SelectItem>
                {audioInputDevices.map((device) => (
                  device.deviceId !== "default" && (
                    <SelectItem key={device.deviceId} value={device.deviceId}>
                      {device.label}
                    </SelectItem>
                  )
                ))}
              </SelectContent>
            </Select>
          </Control>

          <Control label={<ControlLabel label="Speaker" tooltip="Select which speaker/output device to use for text-to-speech audio playback. 'System Default' uses your OS default output device." />} className="px-3">
            <Select
              value={configQuery.data.audioOutputDeviceId || "default"}
              onValueChange={(value) => {
                saveConfig({
                  audioOutputDeviceId: value === "default" ? undefined : value,
                })
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="System Default" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">System Default</SelectItem>
                {audioOutputDevices.map((device) => (
                  device.deviceId !== "default" && (
                    <SelectItem key={device.deviceId} value={device.deviceId}>
                      {device.label}
                    </SelectItem>
                  )
                ))}
              </SelectContent>
            </Select>
          </Control>
        </ControlGroup>

        <ControlGroup collapsible defaultCollapsed title="Speech-to-Text">
          <Control label={<ControlLabel label="Model Selection" tooltip="Manage STT models from the Models page so speech-to-text choices stay with the rest of your provider model settings." />} className="px-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate("/settings/models")}>
                Open Models page
              </Button>
              <p className="text-sm text-muted-foreground">
                {sttProviderId === "parakeet"
                  ? "Parakeet uses its local downloaded model bundle."
                  : `Choose your ${sttProviderId === "openai" ? "OpenAI" : "Groq"} STT model from the Models page.`}
              </p>
            </div>
          </Control>

          <Control label={<ControlLabel label="Language" tooltip="Select the language for speech transcription. 'Auto-detect' lets the model determine the language automatically based on your speech." />} className="px-3">
            <Select
              value={configQuery.data.sttLanguage || "auto"}
              onValueChange={(value) => {
                saveConfig({
                  sttLanguage: value,
                })
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_LANGUAGES.map((language) => (
                  <SelectItem key={language.code} value={language.code}>
                    {language.nativeName} ({language.name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Control>

          {sttProviderId === "openai" && configQuery.data.openaiSttLanguage && configQuery.data.openaiSttLanguage !== configQuery.data.sttLanguage && (
            <Control label={<ControlLabel label="OpenAI Language Override" tooltip="Override the global language setting specifically for OpenAI's Whisper transcription service." />} className="px-3">
              <Select
                value={configQuery.data.openaiSttLanguage || "auto"}
                onValueChange={(value) => {
                  saveConfig({
                    openaiSttLanguage: value,
                  })
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_LANGUAGES.map((language) => (
                    <SelectItem key={language.code} value={language.code}>
                      {language.nativeName} ({language.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Control>
          )}

          {sttProviderId === "groq" && configQuery.data.groqSttLanguage && configQuery.data.groqSttLanguage !== configQuery.data.sttLanguage && (
            <Control label={<ControlLabel label="Groq Language Override" tooltip="Override the global language setting specifically for Groq's Whisper transcription service." />} className="px-3">
              <Select
                value={configQuery.data.groqSttLanguage || "auto"}
                onValueChange={(value) => {
                  saveConfig({
                    groqSttLanguage: value,
                  })
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_LANGUAGES.map((language) => (
                    <SelectItem key={language.code} value={language.code}>
                      {language.nativeName} ({language.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Control>
          )}

          {sttProviderId === "groq" && (
            <Control label={<ControlLabel label="Prompt" tooltip="Optional prompt to guide the model's style or specify how to spell unfamiliar words. Limited to 224 tokens." />} className="px-3">
              <Textarea
                placeholder="Optional prompt to guide the model's style or specify how to spell unfamiliar words (limited to 224 tokens)"
                value={groqSttPromptDraft}
                onChange={(e) => {
                  updateGroqSttPromptDraft(e.currentTarget.value)
                }}
                onBlur={(e) => {
                  flushGroqSttPromptSave(e.currentTarget.value)
                }}
                className="min-h-[80px]"
              />
            </Control>
          )}

          <Control label={<ControlLabel label="Transcription Preview" tooltip="Show a live transcription preview while recording. Audio is sent to your STT provider every ~10 seconds to display partial results. Note: this increases API usage — each chunk is billed separately (Groq has a 10-second minimum billing per request)." />} className="px-3">
            <Switch
              defaultChecked={configQuery.data.transcriptionPreviewEnabled}
              onCheckedChange={(value) => {
                saveConfig({
                  transcriptionPreviewEnabled: value,
                })
              }}
            />
          </Control>

        </ControlGroup>

        <ControlGroup collapsible defaultCollapsed title="Text to Speech">
          <Control label="Enabled" className="px-3">
            <Switch
              defaultChecked={configQuery.data.ttsEnabled ?? false}
              onCheckedChange={async (value) => {
                if (!value) {
                  ttsManager.stopAll("settings-global-tts-disabled")
                  try {
                    await tipcClient.stopAllTts()
                  } catch (error) {
                    console.error("Failed to stop TTS in all windows:", error)
                  }
                }

                saveConfig({
                  ttsEnabled: value,
                })
              }}
            />
          </Control>

          {configQuery.data.ttsEnabled && (
            <Control label={<ControlLabel label="Auto-play" tooltip="Automatically play TTS audio when assistant responses complete" />} className="px-3">
              <Switch
                defaultChecked={configQuery.data.ttsAutoPlay ?? true}
                onCheckedChange={(value) => {
                  saveConfig({
                    ttsAutoPlay: value,
                  })
                }}
              />
            </Control>
          )}

          {configQuery.data.ttsEnabled && (
            <div className="px-3 py-1.5">
              <button
                type="button"
                onClick={() => navigate("/settings/models")}
                className="text-xs text-primary hover:underline"
              >
                Configure TTS voice &amp; model →
              </button>
            </div>
          )}

          {configQuery.data.ttsEnabled && (
            <>
              <Control label={<ControlLabel label="Text Preprocessing" tooltip="Enable preprocessing to make text more speech-friendly by removing code blocks, URLs, and converting markdown" />} className="px-3">
                <Switch
                  defaultChecked={configQuery.data.ttsPreprocessingEnabled ?? true}
                  onCheckedChange={(value) => {
                    saveConfig({
                      ttsPreprocessingEnabled: value,
                    })
                  }}
                />
              </Control>

              {configQuery.data.ttsPreprocessingEnabled !== false && (
                <>
                  <Control label={<ControlLabel label="Remove Code Blocks" tooltip="Remove code blocks and replace with descriptive text" />} className="px-3">
                    <Switch
                      defaultChecked={configQuery.data.ttsRemoveCodeBlocks ?? true}
                      onCheckedChange={(value) => {
                        saveConfig({
                          ttsRemoveCodeBlocks: value,
                        })
                      }}
                    />
                  </Control>

                  <Control label={<ControlLabel label="Remove URLs" tooltip="Remove URLs and replace with descriptive text" />} className="px-3">
                    <Switch
                      defaultChecked={configQuery.data.ttsRemoveUrls ?? true}
                      onCheckedChange={(value) => {
                        saveConfig({
                          ttsRemoveUrls: value,
                        })
                      }}
                    />
                  </Control>

                  <Control label={<ControlLabel label="Convert Markdown" tooltip="Convert markdown formatting to speech-friendly text" />} className="px-3">
                    <Switch
                      defaultChecked={configQuery.data.ttsConvertMarkdown ?? true}
                      onCheckedChange={(value) => {
                        saveConfig({
                          ttsConvertMarkdown: value,
                        })
                      }}
                    />
                  </Control>

                  <Control label={<ControlLabel label="Use AI for TTS Preprocessing" tooltip="Use an LLM to intelligently convert text to natural speech. More robust handling of abbreviations, acronyms, and context-dependent pronunciation. Adds ~1-2 seconds latency. Falls back to regex if disabled or unavailable." />} className="px-3">
                    <Switch
                      defaultChecked={configQuery.data.ttsUseLLMPreprocessing ?? false}
                      onCheckedChange={(value) => {
                        saveConfig({
                          ttsUseLLMPreprocessing: value,
                        })
                      }}
                    />
                  </Control>
                </>
              )}
            </>
          )}
        </ControlGroup>

        {/* Panel Position Settings */}
        <ControlGroup collapsible defaultCollapsed title="Panel Position">
          <Control label={<ControlLabel label="Default Position" tooltip="Choose where the floating panel appears on your screen. Custom position: Panel can be dragged to any location and will remember its position." />} className="px-3">
            <Select
              value={configQuery.data?.panelPosition || "top-right"}
              onValueChange={(
                value:
                  | "top-left"
                  | "top-center"
                  | "top-right"
                  | "bottom-left"
                  | "bottom-center"
                  | "bottom-right"
                  | "custom",
              ) => {
                saveConfig({
                  panelPosition: value,
                })
                // Update panel position immediately if it's visible
                tipcClient.setPanelPosition({ position: value })
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="top-left">Top Left</SelectItem>
                <SelectItem value="top-center">Top Center</SelectItem>
                <SelectItem value="top-right">Top Right</SelectItem>
                <SelectItem value="bottom-left">Bottom Left</SelectItem>
                <SelectItem value="bottom-center">Bottom Center</SelectItem>
                <SelectItem value="bottom-right">Bottom Right</SelectItem>
                <SelectItem value="custom">Custom (Draggable)</SelectItem>
              </SelectContent>
            </Select>
          </Control>

          <Control label={<ControlLabel label="Enable Dragging" tooltip="Enable dragging to move the panel by holding the top bar." />} className="px-3">
            <Switch
              defaultChecked={configQuery.data?.panelDragEnabled ?? true}
              onCheckedChange={(value) => {
                saveConfig({
                  panelDragEnabled: value,
                })
              }}
            />
          </Control>

          <Control label={<ControlLabel label="Auto-Show Floating Panel" tooltip="When enabled, the floating panel automatically appears during agent sessions. When disabled, the panel only appears when manually triggered via hotkeys or menu. You can still access agent progress in the main window." />} className="px-3">
            <div className="space-y-2">
              <div className="flex justify-start sm:justify-end">
                <Switch
                  checked={configQuery.data?.floatingPanelAutoShow !== false}
                  onCheckedChange={(value) => {
                    saveConfig({
                      floatingPanelAutoShow: value,
                    })
                  }}
                />
              </div>
              {configQuery.data?.floatingPanelAutoShow === false && (
                <div className="text-xs text-muted-foreground sm:text-right">
                  Auto-show is off. Use the quick actions below or the tray menu to bring the floating panel back anytime.
                </div>
              )}
            </div>
          </Control>

          <Control label={<ControlLabel label="Hide Panel When Main App Focused" tooltip="When enabled, the floating panel automatically hides when the main DotAgents window is focused. The panel reappears when the main window loses focus." />} className="px-3">
            <Switch
              checked={configQuery.data?.hidePanelWhenMainFocused !== false}
              onCheckedChange={(value) => {
                saveConfig({
                  hidePanelWhenMainFocused: value,
                })
              }}
            />
          </Control>

          <Control label={<ControlLabel label="Quick Actions" tooltip="Useful recovery actions if the floating panel is hidden, off-screen, or just hard to find." />} className="px-3">
            <div className="flex flex-wrap justify-start gap-2 sm:justify-end">
              <Button variant="outline" size="sm" onClick={() => void showFloatingPanelNow()}>
                Show Now
              </Button>
              <Button variant="outline" size="sm" onClick={() => void resetFloatingPanel()}>
                Reset Position & Size
              </Button>
            </div>
          </Control>

        </ControlGroup>

        {/* WhatsApp Integration */}
        <ControlGroup
          collapsible
          defaultCollapsed
          title="WhatsApp Integration"
          endDescription={(
            <div className="break-words whitespace-normal">
              Enable WhatsApp messaging through DotAgents.{" "}
              <a href="/settings/whatsapp" className="underline">Configure WhatsApp settings</a>.
            </div>
          )}
        >
          <Control label={<ControlLabel label="Enable WhatsApp" tooltip="When enabled, allows sending and receiving WhatsApp messages through DotAgents" />} className="px-3">
            <Switch
              checked={configQuery.data?.whatsappEnabled ?? false}
              onCheckedChange={(value) => saveConfig({ whatsappEnabled: value })}
            />
          </Control>
        </ControlGroup>

        {/* Langfuse Observability */}
        <ControlGroup
          collapsible
          defaultCollapsed
          title="Langfuse Observability"
          endDescription={(
            <div className="break-words whitespace-normal">
              Optional tracing for LLM calls, agent sessions, and tools.{" "}
              <a
                href="https://langfuse.com"
                target="_blank"
                rel="noreferrer noopener"
                className="underline inline-flex items-center gap-1"
              >
                Docs
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        >
          <Control label="Enable tracing" className="px-3">
            <Switch
              checked={configQuery.data?.langfuseEnabled ?? false}
              disabled={!isLangfuseInstalled}
              onCheckedChange={(value) => {
                saveConfig({ langfuseEnabled: value })
              }}
            />
          </Control>

          {!isLangfuseInstalled && (
            <div className="mx-3 mb-3 rounded-md border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs leading-5 text-amber-700 dark:text-amber-300">
              Install the optional <span className="font-mono">langfuse</span> package with <span className="font-mono">pnpm add langfuse</span>, then restart DotAgents to enable tracing.
            </div>
          )}

          {configQuery.data?.langfuseEnabled && (
            <>
              <Control label={<ControlLabel label="Public Key" tooltip="Your Langfuse project's public key" />} className="px-3">
                <Input
                  type="text"
                  value={langfuseDrafts.langfusePublicKey}
                  onChange={(e) => updateLangfuseDraft("langfusePublicKey", e.currentTarget.value)}
                  onBlur={(e) => flushLangfuseSave("langfusePublicKey", e.currentTarget.value)}
                  placeholder="pk-lf-..."
                  className="w-full sm:w-[360px] max-w-full min-w-0 font-mono text-xs"
                />
              </Control>

              <Control label={<ControlLabel label="Secret Key" tooltip="Your Langfuse project's secret key" />} className="px-3">
                <Input
                  type="password"
                  value={langfuseDrafts.langfuseSecretKey}
                  onChange={(e) => updateLangfuseDraft("langfuseSecretKey", e.currentTarget.value)}
                  onBlur={(e) => flushLangfuseSave("langfuseSecretKey", e.currentTarget.value)}
                  placeholder="sk-lf-..."
                  className="w-full sm:w-[360px] max-w-full min-w-0 font-mono text-xs"
                />
              </Control>

              <Control label={<ControlLabel label="Base URL" tooltip="Langfuse API endpoint. Leave empty for Langfuse Cloud (cloud.langfuse.com)" />} className="px-3">
                <Input
                  type="text"
                  value={langfuseDrafts.langfuseBaseUrl}
                  onChange={(e) => updateLangfuseDraft("langfuseBaseUrl", e.currentTarget.value)}
                  onBlur={(e) => flushLangfuseSave("langfuseBaseUrl", e.currentTarget.value)}
                  placeholder="https://cloud.langfuse.com (default)"
                  className="w-full sm:w-[360px] max-w-full min-w-0"
                />
                <div className="mt-1 text-xs text-muted-foreground">
                  Use this for self-hosted Langfuse instances. Leave empty for Langfuse Cloud.
                </div>
              </Control>

              {/* Status indicator */}
              {configQuery.data?.langfusePublicKey && configQuery.data?.langfuseSecretKey && (
                <Control label="Status" className="px-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-sm text-green-600 dark:text-green-400">Configured</span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Traces will be sent to Langfuse for each agent session.
                  </div>
                </Control>
              )}

              {(!configQuery.data?.langfusePublicKey || !configQuery.data?.langfuseSecretKey) && (
                <div className="px-3 py-2">
                  <div className="text-sm text-amber-600 dark:text-amber-400">
                    Enter both Public Key and Secret Key to enable tracing.
                  </div>
                </div>
              )}
            </>
          )}
        </ControlGroup>

        {/* About Section */}
        <ControlGroup title="About">
          <Control label="Version" className="px-3">
            <div className="text-sm">{process.env.APP_VERSION}</div>
          </Control>
          <Control label="Onboarding" className="px-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                saveConfig({ onboardingCompleted: false })
                navigate("/onboarding")
              }}
            >
              Re-run Onboarding
            </Button>
          </Control>
        </ControlGroup>
      </div>
    </div>
  )
}
