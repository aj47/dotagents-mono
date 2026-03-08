import { Control, ControlGroup, ControlLabel } from "@renderer/components/ui/control"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@renderer/components/ui/select"
import { Switch } from "@renderer/components/ui/switch"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@renderer/components/ui/tooltip"
import { STT_PROVIDER_ID } from "@shared/index"
import { SUPPORTED_LANGUAGES } from "@shared/languages"
import { Textarea } from "@renderer/components/ui/textarea"
import { Input } from "@renderer/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@renderer/components/ui/dialog"
import { ModelSelector } from "@renderer/components/model-selector"
import { Button } from "@renderer/components/ui/button"
import {
  useConfigQuery,
  useSaveConfigMutation,
} from "@renderer/lib/query-client"
import { getSelectableMainAcpAgents } from "./settings-general-main-agent-options"
import { ttsManager } from "@renderer/lib/tts-manager"
import { tipcClient } from "@renderer/lib/tipc-client"
import { ExternalLink, AlertCircle, FolderOpen, FolderUp, FileText } from "lucide-react"
import { toast } from "sonner"
import { useCallback, useEffect, useRef, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { Config } from "@shared/types"
import { KeyRecorder } from "@renderer/components/key-recorder"
import {
  getAgentKillSwitchShortcutDisplay,
  getDictationShortcutDisplay,
  getMcpToolsShortcutDisplay,
  getSettingsHotkeyDisplay,
  getTextInputShortcutDisplay,
  getToggleVoiceDictationShortcutDisplay,
} from "@shared/key-utils"
import { RemoteServerSettingsGroups } from "./settings-remote-server"

const GENERAL_TEXT_INPUT_SAVE_DEBOUNCE_MS = 400

type GeneralTextDraftKey =
  | "langfusePublicKey"
  | "langfuseSecretKey"
  | "langfuseBaseUrl"
  | "groqSttPrompt"
  | "transcriptPostProcessingPrompt"

function getGeneralTextDrafts(config?: Partial<Config>) {
  return {
    langfusePublicKey: config?.langfusePublicKey ?? "",
    langfuseSecretKey: config?.langfuseSecretKey ?? "",
    langfuseBaseUrl: config?.langfuseBaseUrl ?? "",
    groqSttPrompt: config?.groqSttPrompt ?? "",
    transcriptPostProcessingPrompt: config?.transcriptPostProcessingPrompt ?? "",
  }
}

function getOptionalStringConfigUpdate<Key extends GeneralTextDraftKey>(
  key: Key,
  value: string,
): Pick<Config, Key> {
  return {
    [key]: value || undefined,
  } as Pick<Config, Key>
}

export function Component() {
  const configQuery = useConfigQuery()
  const navigate = useNavigate()

  const saveConfigMutation = useSaveConfigMutation()
  const configRef = useRef<Config | undefined>(configQuery.data as Config | undefined)
  const [generalTextDrafts, setGeneralTextDrafts] = useState(() =>
    getGeneralTextDrafts(configQuery.data as Config | undefined),
  )
  const generalTextSaveTimeoutsRef = useRef<Record<GeneralTextDraftKey, ReturnType<typeof setTimeout> | null>>({
    langfusePublicKey: null,
    langfuseSecretKey: null,
    langfuseBaseUrl: null,
    groqSttPrompt: null,
    transcriptPostProcessingPrompt: null,
  })

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
      saveConfigMutation.mutate({
        config: {
          ...(configRef.current as any),
          ...config,
        },
      })
    },
    [saveConfigMutation],
  )

  const flushGeneralTextDraft = useCallback(
    (key: GeneralTextDraftKey, value: string) => {
      const timeout = generalTextSaveTimeoutsRef.current[key]
      if (timeout) {
        clearTimeout(timeout)
        generalTextSaveTimeoutsRef.current[key] = null
      }

      saveConfig(getOptionalStringConfigUpdate(key, value))
    },
    [saveConfig],
  )

  const scheduleGeneralTextSave = useCallback(
    (key: GeneralTextDraftKey, value: string) => {
      const timeout = generalTextSaveTimeoutsRef.current[key]
      if (timeout) clearTimeout(timeout)

      generalTextSaveTimeoutsRef.current[key] = setTimeout(() => {
        generalTextSaveTimeoutsRef.current[key] = null
        saveConfig(getOptionalStringConfigUpdate(key, value))
      }, GENERAL_TEXT_INPUT_SAVE_DEBOUNCE_MS)
    },
    [saveConfig],
  )

  useEffect(() => {
    configRef.current = configQuery.data as Config | undefined
  }, [configQuery.data])

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

  useEffect(() => {
    setGeneralTextDrafts(getGeneralTextDrafts(configQuery.data as Config | undefined))
  }, [
    configQuery.data?.langfusePublicKey,
    configQuery.data?.langfuseSecretKey,
    configQuery.data?.langfuseBaseUrl,
    configQuery.data?.groqSttPrompt,
    configQuery.data?.transcriptPostProcessingPrompt,
  ])

  useEffect(() => {
    return () => {
      for (const timeout of Object.values(generalTextSaveTimeoutsRef.current)) {
        if (timeout) clearTimeout(timeout)
      }
    }
  }, [])

  // Memoize model change handler to prevent infinite re-renders
  const handleTranscriptModelChange = useCallback(
    (value: string) => {
      const transcriptPostProcessingProviderId =
        (configQuery.data as any)?.transcriptPostProcessingProviderId || "openai"

      if (transcriptPostProcessingProviderId === "openai") {
        saveConfig({
          transcriptPostProcessingOpenaiModel: value,
        })
      } else if (transcriptPostProcessingProviderId === "groq") {
        saveConfig({
          transcriptPostProcessingGroqModel: value,
        })
      } else {
        saveConfig({
          transcriptPostProcessingGeminiModel: value,
        })
      }
    },
    [saveConfig, (configQuery.data as any)?.transcriptPostProcessingProviderId],
  )

  const sttProviderId: STT_PROVIDER_ID =
    (configQuery.data as any)?.sttProviderId || "openai"
  const shortcut = (configQuery.data as any)?.shortcut || "hold-ctrl"
  const customRecordingShortcutMode = configQuery.data?.customShortcutMode || "hold"
  const hasCustomRecordingShortcut = Boolean(configQuery.data?.customShortcut?.trim())
  const recordingShortcutDisplay = getDictationShortcutDisplay(
    shortcut,
    configQuery.data?.customShortcut,
    customRecordingShortcutMode,
  )
  const isHoldRecordingShortcut =
    shortcut === "hold-ctrl" ||
    (shortcut === "custom" && customRecordingShortcutMode === "hold")
  const recordingShortcutSummary =
    shortcut === "custom" && !hasCustomRecordingShortcut
      ? "Record a custom shortcut to finish setup. Until then, keyboard voice dictation won't start. Changes save immediately."
      : isHoldRecordingShortcut
        ? `${recordingShortcutDisplay} to start voice dictation, then release to stop and transcribe. Changes save immediately.`
        : `${recordingShortcutDisplay} once to start voice dictation, then use the same shortcut again to stop and transcribe. Changes save immediately.`
  const recordingShortcutEndDescription =
    shortcut === "custom" && !hasCustomRecordingShortcut
      ? "Finish recording a custom shortcut to enable voice dictation"
      : isHoldRecordingShortcut
        ? `${recordingShortcutDisplay} to record, release to finish`
        : `${recordingShortcutDisplay} to start and finish recording`
  const recordingShortcutTooltip =
    shortcut === "custom" && !hasCustomRecordingShortcut
      ? "Custom recording hotkey stays off until one is saved"
      : isHoldRecordingShortcut
        ? "Press any other key to cancel before recording starts"
        : shortcut === "ctrl-slash"
          ? "Press Esc to cancel"
          : "Press the same shortcut again to stop"
  const toggleVoiceDictationEnabled =
    configQuery.data?.toggleVoiceDictationEnabled ?? false
  const toggleVoiceDictationHotkey = configQuery.data?.toggleVoiceDictationHotkey || "fn"
  const hasCustomToggleVoiceDictationHotkey = Boolean(
    configQuery.data?.customToggleVoiceDictationHotkey?.trim(),
  )
  const toggleVoiceDictationShortcutDisplay = getToggleVoiceDictationShortcutDisplay(
    toggleVoiceDictationHotkey,
    configQuery.data?.customToggleVoiceDictationHotkey,
  )
  const toggleVoiceDictationShortcutSummary =
    !toggleVoiceDictationEnabled
      ? "Toggle voice dictation is off. Turn it on if you want one shortcut press to start recording and another press to stop it. Changes save immediately."
      : toggleVoiceDictationHotkey === "custom" && !hasCustomToggleVoiceDictationHotkey
        ? "Record a custom shortcut to finish setup. Until then, toggle voice dictation won't start from the keyboard. Changes save immediately."
        : `Press ${toggleVoiceDictationShortcutDisplay} once to start voice dictation, then press it again to stop and submit. Changes save immediately.`
  const textInputShortcut = (configQuery.data as any)?.textInputShortcut || "ctrl-t"
  const textInputEnabled = configQuery.data?.textInputEnabled ?? true
  const hasCustomTextInputShortcut = Boolean(configQuery.data?.customTextInputShortcut?.trim())
  const textInputShortcutDisplay = getTextInputShortcutDisplay(
    textInputShortcut,
    configQuery.data?.customTextInputShortcut,
  )
  const textInputShortcutSummary =
    !textInputEnabled
      ? "Keyboard shortcut is off. Turn it on to open the panel directly in text input mode from anywhere. Changes save immediately."
      : textInputShortcut === "custom" && !hasCustomTextInputShortcut
        ? "Record a custom shortcut to finish setup. Until then, the keyboard shortcut to open text input will stay off. Changes save immediately."
        : textInputShortcut === "ctrl-t" || textInputShortcut === "alt-t"
          ? `Press ${textInputShortcutDisplay} to open the panel directly in text input mode. Add Shift to continue your most recent conversation instead. Changes save immediately.`
          : textInputShortcut === "ctrl-shift-t"
            ? `Press ${textInputShortcutDisplay} to open the panel directly in text input mode. This shortcut opens a fresh text draft because Shift is already part of it. Changes save immediately.`
            : `Press ${textInputShortcutDisplay} to open the panel directly in text input mode. Custom text input shortcuts do not currently have a separate continue-last-conversation variant. Changes save immediately.`
  const settingsHotkeyEnabled = configQuery.data?.settingsHotkeyEnabled ?? true
  const settingsHotkey = configQuery.data?.settingsHotkey || "ctrl-shift-s"
  const hasCustomSettingsHotkey = Boolean(configQuery.data?.customSettingsHotkey?.trim())
  const settingsHotkeyDisplay = getSettingsHotkeyDisplay(
    settingsHotkey,
    configQuery.data?.customSettingsHotkey,
  )
  const settingsHotkeySummary =
    !settingsHotkeyEnabled
      ? "Keyboard shortcut is off. Turn it on to show or focus the main window from anywhere. Changes save immediately."
      : settingsHotkey === "custom" && !hasCustomSettingsHotkey
        ? "Record a custom shortcut to finish setup. Until then, the keyboard shortcut to show the main window will stay off. This shortcut also pauses while recording so it doesn't interrupt capture. Changes save immediately."
        : `Press ${settingsHotkeyDisplay} to show or focus the main window from anywhere. This shortcut pauses while recording so it doesn't interrupt capture. Changes save immediately.`
  const killSwitchHotkey = configQuery.data?.agentKillSwitchHotkey || "ctrl-shift-escape"
  const hasCustomAgentKillSwitchHotkey = Boolean(
    configQuery.data?.customAgentKillSwitchHotkey?.trim(),
  )
  const killSwitchShortcutDisplay = getAgentKillSwitchShortcutDisplay(
    killSwitchHotkey,
    configQuery.data?.customAgentKillSwitchHotkey,
  )
  const killSwitchSummary =
    killSwitchHotkey === "custom" && !hasCustomAgentKillSwitchHotkey
      ? "Record a custom shortcut to finish setup. Until then, Ctrl+Shift+Escape remains the active emergency stop. Changes save immediately."
      : killSwitchHotkey === "ctrl-shift-escape"
        ? "Press Ctrl+Shift+Escape anytime to stop agent mode and kill agent-created processes. Changes save immediately."
        : `Press ${killSwitchShortcutDisplay} to stop agent mode and kill agent-created processes. Ctrl+Shift+Escape always works as a hard emergency stop too. Changes save immediately.`
  const mcpToolsShortcut = configQuery.data?.mcpToolsShortcut || "hold-ctrl-alt"
  const customMcpToolsShortcutMode =
    configQuery.data?.customMcpToolsShortcutMode || "hold"
  const hasCustomMcpToolsShortcut = Boolean(
    configQuery.data?.customMcpToolsShortcut?.trim(),
  )
  const agentModeShortcutDisplay = getMcpToolsShortcutDisplay(
    mcpToolsShortcut,
    configQuery.data?.customMcpToolsShortcut,
    customMcpToolsShortcutMode,
  )
  const agentModeShortcutSummary =
    mcpToolsShortcut === "custom" && !hasCustomMcpToolsShortcut
      ? "Record a custom shortcut to finish setup. Until then, keyboard Agent Mode won't start. Changes save immediately."
      : mcpToolsShortcut === "hold-ctrl-alt" ||
          (mcpToolsShortcut === "custom" && customMcpToolsShortcutMode === "hold")
        ? `${agentModeShortcutDisplay} to start agent mode, then release the keys to send or stop. Changes save immediately.`
        : `${agentModeShortcutDisplay} once to start agent mode, then press it again to send or stop. Changes save immediately.`


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

              <Control label={<ControlLabel label="Inject DotAgents Tools" tooltip="When enabled, DotAgents's builtin tools (delegation, settings management) are injected into ACP agent sessions. This allows the ACP agent to delegate tasks to other agents. Requires Remote Server to be enabled." />} className="px-3">
                <Switch
                  checked={configQuery.data?.acpInjectBuiltinTools !== false}
                  disabled={!configQuery.data?.remoteServerEnabled}
                  onCheckedChange={(value) => saveConfig({ acpInjectBuiltinTools: value })}
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
              checked={configQuery.data?.mcpUnlimitedIterations ?? false}
              onCheckedChange={(checked) => saveConfig({ mcpUnlimitedIterations: checked })}
            />
          </Control>

          {!(configQuery.data?.mcpUnlimitedIterations) && (
            <Control label={<ControlLabel label="Max Iterations" tooltip="Maximum number of iterations the agent can perform before stopping. Higher values allow more complex tasks but may take longer." />} className="px-3">
              <Input
                type="number"
                min="1"
                max="50"
                step="1"
                value={configQuery.data?.mcpMaxIterations ?? 10}
                onChange={(e) => saveConfig({ mcpMaxIterations: parseInt(e.target.value) || 1 })}
                className="w-32"
              />
            </Control>
          )}

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
                    value={killSwitchHotkey}
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

                  <div className="text-xs text-muted-foreground">
                    {killSwitchSummary}
                  </div>

                  {killSwitchHotkey === "custom" && (
                    <>
                      <KeyRecorder
                        value={configQuery.data?.customAgentKillSwitchHotkey || ""}
                        onChange={(keyCombo) => saveConfig({ customAgentKillSwitchHotkey: keyCombo })}
                        placeholder="Click to record custom kill switch hotkey"
                      />
                      {!hasCustomAgentKillSwitchHotkey && (
                        <div className="rounded-md border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                          Record a custom shortcut to finish setup. Ctrl+Shift+Escape still works as the fallback hard emergency stop until then.
                        </div>
                      )}
                    </>
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
          endDescription={
            <div>
              Workspace overlay is enabled when a <span className="font-mono">.agents</span> folder exists in your workspace
              (or when <span className="font-mono">DOTAGENTS_WORKSPACE_DIR</span> is set).
            </div>
          }
        >
          <div className="px-3 py-2 text-sm text-muted-foreground">
            Advanced configuration can be stored as files in <span className="font-mono">.agents</span>. Skills live in{" "}
            <span className="font-mono">skills/&lt;id&gt;/skill.md</span> and memories in{" "}
            <span className="font-mono">memories/&lt;id&gt;.md</span>. Frontmatter uses simple{" "}
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
          <Control label="Open" className="px-3">
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={openGlobalAgentsFolder}>
                <FolderOpen className="h-3 w-3" />
                Open Global
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={openWorkspaceAgentsFolder}
                disabled={!agentsFoldersQuery.data?.workspace?.agentsDir}
              >
                <FolderUp className="h-3 w-3" />
                Open Workspace
              </Button>
            </div>
          </Control>
          <Control label="Reveal files in Finder/Explorer" className="px-3">
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={openSystemPromptFile}>
                <FileText className="h-3 w-3" />
                Reveal System Prompt
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={openAgentsGuidelinesFile}>
                <FileText className="h-3 w-3" />
                Reveal Guidelines
              </Button>
            </div>
          </Control>
        </ControlGroup>

        <ControlGroup
          collapsible
          defaultCollapsed
          title="Shortcuts"
          endDescription={
            <div className="flex items-center gap-1">
              <div>{recordingShortcutEndDescription}</div>
              <TooltipProvider disableHoverableContent delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger className="inline-flex items-center justify-center">
                    <span className="i-mingcute-information-fill text-base"></span>
                  </TooltipTrigger>
                  <TooltipContent collisionPadding={5}>
                    {recordingShortcutTooltip}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          }
        >
          <Control label="Recording" className="px-3">
            <div className="space-y-2">
              <Select
                value={shortcut}
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

              <div className="text-xs text-muted-foreground">{recordingShortcutSummary}</div>

              {shortcut === "custom" && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Mode</label>
                    <Select
                      value={customRecordingShortcutMode}
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
                    placeholder="Click to record custom voice dictation shortcut"
                  />
                  {!hasCustomRecordingShortcut && (
                    <div className="rounded-md border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                      Record a custom shortcut to finish setup. Voice dictation won't start from the keyboard until one is saved.
                    </div>
                  )}
                </>
              )}
            </div>
          </Control>

          <Control label="Toggle Voice Dictation" className="px-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Switch
                  checked={toggleVoiceDictationEnabled}
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

              <Select
                value={toggleVoiceDictationHotkey}
                onValueChange={(value) => {
                  saveConfig({
                    toggleVoiceDictationHotkey:
                      value as typeof configQuery.data.toggleVoiceDictationHotkey,
                  })
                }}
                disabled={!toggleVoiceDictationEnabled}
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

              <div className="text-xs text-muted-foreground">
                {toggleVoiceDictationShortcutSummary}
              </div>

              {toggleVoiceDictationHotkey === "custom" && toggleVoiceDictationEnabled && (
                <>
                  <KeyRecorder
                    value={configQuery.data?.customToggleVoiceDictationHotkey || ""}
                    onChange={(keyCombo) => {
                      saveConfig({
                        customToggleVoiceDictationHotkey: keyCombo,
                      })
                    }}
                    placeholder="Click to record custom toggle voice dictation shortcut"
                  />
                  {!hasCustomToggleVoiceDictationHotkey && (
                    <div className="rounded-md border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                      Record a custom shortcut to finish setup. Toggle voice dictation won't start from the keyboard until one is saved.
                    </div>
                  )}
                </>
              )}
            </div>
          </Control>

          <Control label="Text Input" className="px-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Switch
                  checked={textInputEnabled}
                  onCheckedChange={(checked) => {
                    saveConfig({
                      textInputEnabled: checked,
                    })
                  }}
                />
                <span className="text-sm text-muted-foreground">Enable shortcut</span>
                <Select
                  value={textInputShortcut}
                  onValueChange={(value) => {
                    saveConfig({
                      textInputShortcut:
                        value as typeof configQuery.data.textInputShortcut,
                    })
                  }}
                  disabled={!textInputEnabled}
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

              <div className="text-xs text-muted-foreground">
                {textInputShortcutSummary}
              </div>

              {textInputShortcut === "custom" && textInputEnabled && (
                <>
                  <KeyRecorder
                    value={configQuery.data?.customTextInputShortcut || ""}
                    onChange={(keyCombo) => {
                      saveConfig({
                        customTextInputShortcut: keyCombo,
                      })
                    }}
                    placeholder="Click to record custom text input shortcut"
                  />
                  {!hasCustomTextInputShortcut && (
                    <div className="rounded-md border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                      Record a custom shortcut to finish setup. Text input won't open from the keyboard until one is saved.
                    </div>
                  )}
                </>
              )}
            </div>
          </Control>

          <Control label="Show Main Window" className="px-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Switch
                  checked={settingsHotkeyEnabled}
                  onCheckedChange={(checked) => {
                    saveConfig({
                      settingsHotkeyEnabled: checked,
                    })
                  }}
                />
                <span className="text-sm text-muted-foreground">Enable shortcut</span>
                <Select
                  value={settingsHotkey}
                  onValueChange={(value) => {
                    saveConfig({
                      settingsHotkey:
                        value as typeof configQuery.data.settingsHotkey,
                    })
                  }}
                  disabled={!settingsHotkeyEnabled}
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

              <div className="text-xs text-muted-foreground">
                {settingsHotkeySummary}
              </div>

              {settingsHotkey === "custom" && settingsHotkeyEnabled && (
                <>
                  <KeyRecorder
                    value={configQuery.data?.customSettingsHotkey || ""}
                    onChange={(keyCombo) => {
                      saveConfig({
                        customSettingsHotkey: keyCombo,
                      })
                    }}
                    placeholder="Click to record custom main window shortcut"
                  />
                  {!hasCustomSettingsHotkey && (
                    <div className="rounded-md border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                      Record a custom shortcut to finish setup. The main window shortcut stays off until one is saved.
                    </div>
                  )}
                </>
              )}
            </div>
          </Control>

          <Control label={<ControlLabel label="Agent Mode" tooltip="Choose how to activate agent mode for MCP tool calling" />} className="px-3">
            <div className="space-y-2">
              <Select
                value={mcpToolsShortcut}
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

              <div className="text-xs text-muted-foreground">
                {agentModeShortcutSummary}
              </div>

              {mcpToolsShortcut === "custom" && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Mode</label>
                    <Select
                      value={customMcpToolsShortcutMode}
                      onValueChange={(value: "hold" | "toggle") => {
                        saveConfig({ customMcpToolsShortcutMode: value })
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hold">Hold (Press and hold to start agent mode)</SelectItem>
                        <SelectItem value="toggle">Toggle (Press once to start, again to send)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <KeyRecorder
                    value={configQuery.data?.customMcpToolsShortcut || ""}
                    onChange={(keyCombo) => {
                      saveConfig({ customMcpToolsShortcut: keyCombo })
                    }}
                    placeholder="Click to record custom agent mode shortcut"
                  />
                  {!hasCustomMcpToolsShortcut && (
                    <div className="rounded-md border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                      Record a custom shortcut to finish setup. Agent Mode won't start from the keyboard until one is saved.
                    </div>
                  )}
                </>
              )}
            </div>
          </Control>
        </ControlGroup>

        <ControlGroup collapsible defaultCollapsed title="Speech-to-Text">
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
                value={generalTextDrafts.groqSttPrompt}
                onChange={(e) => {
                  const value = e.currentTarget.value
                  setGeneralTextDrafts((current) => ({
                    ...current,
                    groqSttPrompt: value,
                  }))
                  scheduleGeneralTextSave("groqSttPrompt", value)
                }}
                onBlur={(e) => flushGeneralTextDraft("groqSttPrompt", e.currentTarget.value)}
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

          <Control label={<ControlLabel label="Post-Processing" tooltip="Enable AI-powered post-processing to clean up and improve transcripts" />} className="px-3">
            <Switch
              defaultChecked={configQuery.data.transcriptPostProcessingEnabled}
              onCheckedChange={(value) => {
                saveConfig({
                  transcriptPostProcessingEnabled: value,
                })
              }}
            />
          </Control>

          {configQuery.data.transcriptPostProcessingEnabled && (
            <Control label={<ControlLabel label="Post-Processing Prompt" tooltip="Custom prompt for transcript post-processing. Use {transcript} placeholder to insert the original transcript." />} className="px-3">
              <div className="flex flex-col items-end gap-1 text-right">
                {configQuery.data.transcriptPostProcessingPrompt && (
                  <div className="line-clamp-3 text-sm text-neutral-500 dark:text-neutral-400">
                    {configQuery.data.transcriptPostProcessingPrompt}
                  </div>
                )}
                <Dialog>
                  <DialogTrigger className="" asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 gap-1 px-2"
                    >
                      <span className="i-mingcute-edit-2-line"></span>
                      Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Post-Processing Prompt</DialogTitle>
                    </DialogHeader>
                    <Textarea
                      rows={10}
                      value={generalTextDrafts.transcriptPostProcessingPrompt}
                      onChange={(e) => {
                        const value = e.currentTarget.value
                        setGeneralTextDrafts((current) => ({
                          ...current,
                          transcriptPostProcessingPrompt: value,
                        }))
                        scheduleGeneralTextSave("transcriptPostProcessingPrompt", value)
                      }}
                      onBlur={(e) => flushGeneralTextDraft("transcriptPostProcessingPrompt", e.currentTarget.value)}
                    ></Textarea>
                    <div className="text-sm text-muted-foreground">
                      Use{" "}
                      <span className="select-text">{"{transcript}"}</span>{" "}
                      placeholder to insert the original transcript
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </Control>
          )}
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
              <a
                href="https://langfuse.com"
                target="_blank"
                rel="noreferrer noopener"
                className="underline inline-flex items-center gap-1"
              >
                Langfuse
                <ExternalLink className="h-3 w-3" />
              </a>{" "}
              is an open-source LLM observability platform. Enable this to trace LLM calls, agent sessions, and tool executions for debugging and monitoring.
            </div>
          )}
        >
          {/* Show warning if langfuse package is not installed */}
          {!isLangfuseInstalled && (
            <div className="mx-3 mb-3 p-3 rounded-md bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-amber-600 dark:text-amber-400">
                    Langfuse package not installed
                  </p>
                  <p className="text-muted-foreground mt-1">
                    Langfuse is an optional dependency. To enable observability features, install it by running:
                  </p>
                  <code className="mt-2 block bg-muted px-2 py-1 rounded text-xs font-mono">
                    pnpm add langfuse
                  </code>
                  <p className="text-muted-foreground mt-2 text-xs">
                    After installing, restart the app to enable Langfuse integration.
                  </p>
                </div>
              </div>
            </div>
          )}

          <Control label="Enable Langfuse Tracing" className="px-3">
            <Switch
              checked={configQuery.data?.langfuseEnabled ?? false}
              disabled={!isLangfuseInstalled}
              onCheckedChange={(value) => {
                saveConfig({ langfuseEnabled: value })
              }}
            />
          </Control>

          {configQuery.data?.langfuseEnabled && (
            <>
              <Control label={<ControlLabel label="Public Key" tooltip="Your Langfuse project's public key" />} className="px-3">
                <Input
                  type="text"
                  value={generalTextDrafts.langfusePublicKey}
                  onChange={(e) => {
                    const value = e.currentTarget.value
                    setGeneralTextDrafts((current) => ({
                      ...current,
                      langfusePublicKey: value,
                    }))
                    scheduleGeneralTextSave("langfusePublicKey", value)
                  }}
                  onBlur={(e) => flushGeneralTextDraft("langfusePublicKey", e.currentTarget.value)}
                  placeholder="pk-lf-..."
                  className="w-full sm:w-[360px] max-w-full min-w-0 font-mono text-xs"
                />
              </Control>

              <Control label={<ControlLabel label="Secret Key" tooltip="Your Langfuse project's secret key" />} className="px-3">
                <Input
                  type="password"
                  value={generalTextDrafts.langfuseSecretKey}
                  onChange={(e) => {
                    const value = e.currentTarget.value
                    setGeneralTextDrafts((current) => ({
                      ...current,
                      langfuseSecretKey: value,
                    }))
                    scheduleGeneralTextSave("langfuseSecretKey", value)
                  }}
                  onBlur={(e) => flushGeneralTextDraft("langfuseSecretKey", e.currentTarget.value)}
                  placeholder="sk-lf-..."
                  className="w-full sm:w-[360px] max-w-full min-w-0 font-mono text-xs"
                />
              </Control>

              <Control label={<ControlLabel label="Base URL" tooltip="Langfuse API endpoint. Leave empty for Langfuse Cloud (cloud.langfuse.com)" />} className="px-3">
                <Input
                  type="text"
                  value={generalTextDrafts.langfuseBaseUrl}
                  onChange={(e) => {
                    const value = e.currentTarget.value
                    setGeneralTextDrafts((current) => ({
                      ...current,
                      langfuseBaseUrl: value,
                    }))
                    scheduleGeneralTextSave("langfuseBaseUrl", value)
                  }}
                  onBlur={(e) => flushGeneralTextDraft("langfuseBaseUrl", e.currentTarget.value)}
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
