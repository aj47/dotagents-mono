import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Control, ControlLabel } from "@renderer/components/ui/control"
import { Input } from "@renderer/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@renderer/components/ui/select"
import { Button } from "@renderer/components/ui/button"
import {
  useConfigQuery,
  useSaveConfigMutation,
} from "@renderer/lib/query-client"
import { Config } from "@shared/types"

import { Mic, Bot, Volume2, FileText, CheckCircle2, ChevronDown, ChevronRight, Cpu, Download, Loader2 } from "lucide-react"

import { getSelectableMainAcpAgents } from "./settings-general-main-agent-options"

const SETTINGS_TEXT_SAVE_DEBOUNCE_MS = 400

type ProviderDraftKey = "groqApiKey" | "groqBaseUrl" | "geminiApiKey" | "geminiBaseUrl"

function getProviderDrafts(config?: Config | null): Record<ProviderDraftKey, string> {
  return {
    groqApiKey: config?.groqApiKey || "",
    groqBaseUrl: config?.groqBaseUrl || "",
    geminiApiKey: config?.geminiApiKey || "",
    geminiBaseUrl: config?.geminiBaseUrl || "",
  }
}

// Badge component to show which features are using this provider
function ActiveProviderBadge({ label, icon: Icon }: { label: string; icon: React.ElementType }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
      <Icon className="h-3 w-3" />
      {label}
    </span>
  )
}

// Parakeet Model Download Component
function ParakeetModelDownload() {
  const queryClient = useQueryClient()
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)

  const modelStatusQuery = useQuery({
    queryKey: ["parakeetModelStatus"],
    queryFn: () => window.electron.ipcRenderer.invoke("getParakeetModelStatus"),
    // Poll while downloading (either local state or server state) to keep progress updated
    refetchInterval: (query) => {
      const status = query.state.data as { downloading?: boolean } | undefined
      return (isDownloading || status?.downloading) ? 500 : false
    },
  })

  const handleDownload = async () => {
    setIsDownloading(true)
    setDownloadProgress(0)
    try {
      await window.electron.ipcRenderer.invoke("downloadParakeetModel")
    } catch (error) {
      console.error("Failed to download Parakeet model:", error)
    } finally {
      setIsDownloading(false)
      // Always invalidate to show final state (success or error)
      queryClient.invalidateQueries({ queryKey: ["parakeetModelStatus"] })
    }
  }

  const status = modelStatusQuery.data as { downloaded: boolean; downloading: boolean; progress: number; error?: string } | undefined

  if (modelStatusQuery.isLoading) {
    return <span className="text-xs text-muted-foreground">Checking...</span>
  }

  if (status?.downloaded) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-green-600">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Ready
      </span>
    )
  }

  if (status?.downloading || isDownloading) {
    const progress = status?.progress ?? downloadProgress
    return (
      <div className="flex flex-col gap-1.5 w-full">
        <div className="flex items-center gap-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground">
            Downloading... {Math.round(progress * 100)}%
          </span>
        </div>
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-200"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>
    )
  }

  if (status?.error) {
    return (
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-destructive">{status.error}</span>
        <Button size="sm" variant="outline" onClick={handleDownload}>
          <Download className="h-3.5 w-3.5 mr-1.5" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <Button size="sm" variant="outline" onClick={handleDownload}>
      <Download className="h-3.5 w-3.5 mr-1.5" />
      Download (~200MB)
    </Button>
  )
}

// Parakeet Provider Section Component
function ParakeetProviderSection({
  isActive,
  isCollapsed,
  onToggleCollapse,
  usageBadges,
  numThreads,
  onNumThreadsChange,
}: {
  isActive: boolean
  isCollapsed: boolean
  onToggleCollapse: () => void
  usageBadges: { label: string; icon: React.ElementType }[]
  numThreads: number
  onNumThreadsChange: (value: number) => void
}) {
  return (
    <div className={`rounded-lg border ${isActive ? 'border-primary/30 bg-primary/5' : ''}`}>
      <button
        type="button"
        className="px-3 py-2 flex items-center justify-between w-full hover:bg-muted/30 transition-colors cursor-pointer"
        onClick={onToggleCollapse}
        aria-expanded={!isCollapsed}
        aria-controls="parakeet-provider-content"
      >
        <span className="flex items-center gap-2 text-sm font-semibold">
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
          <Cpu className="h-4 w-4" />
          Parakeet (Local)
          {isActive && (
            <CheckCircle2 className="h-4 w-4 text-primary" />
          )}
        </span>
        {isActive && usageBadges.length > 0 && (
          <div className="flex gap-1.5 flex-wrap justify-end">
            {usageBadges.map((badge) => (
              <ActiveProviderBadge key={badge.label} label={badge.label} icon={badge.icon} />
            ))}
          </div>
        )}
      </button>
      {!isCollapsed && (
        <div id="parakeet-provider-content" className="divide-y border-t">
          <p className="px-3 py-1.5 text-[11px] text-muted-foreground">
            {isActive
              ? "Local speech-to-text with NVIDIA Parakeet on your device."
              : "Not selected above. You can still configure it here."}
          </p>

          {/* Model Download Section */}
          <Control
            label={
              <ControlLabel
                label="Model Status"
                tooltip="Download the Parakeet model (~200MB) for local transcription"
              />
            }
            className="px-3"
          >
            <ParakeetModelDownload />
          </Control>

          {/* Thread Count */}
          <Control
            label={
              <ControlLabel
                label="CPU Threads"
                tooltip="Number of CPU threads to use for transcription (higher = faster but uses more resources)"
              />
            }
            className="px-3"
          >
            <Select
              value={String(numThreads)}
              onValueChange={(value) => onNumThreadsChange(parseInt(value))}
            >
              <SelectTrigger className="w-full sm:w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 thread</SelectItem>
                <SelectItem value="2">2 threads</SelectItem>
                <SelectItem value="4">4 threads</SelectItem>
                <SelectItem value="8">8 threads</SelectItem>
              </SelectContent>
            </Select>
          </Control>
        </div>
      )}
    </div>
  )
}

// Kitten Model Download Component
function KittenModelDownload() {
  const queryClient = useQueryClient()
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)

  const modelStatusQuery = useQuery({
    queryKey: ["kittenModelStatus"],
    queryFn: () => window.electron.ipcRenderer.invoke("getKittenModelStatus"),
    // Poll while downloading (either local state or server state) to keep progress updated
    refetchInterval: (query) => {
      const status = query.state.data as { downloading?: boolean } | undefined
      return (isDownloading || status?.downloading) ? 500 : false
    },
  })

  const handleDownload = async () => {
    setIsDownloading(true)
    setDownloadProgress(0)
    try {
      await window.electron.ipcRenderer.invoke("downloadKittenModel")
    } catch (error) {
      console.error("Failed to download Kitten model:", error)
    } finally {
      setIsDownloading(false)
      // Always invalidate to show final state (success or error)
      queryClient.invalidateQueries({ queryKey: ["kittenModelStatus"] })
    }
  }

  const status = modelStatusQuery.data as { downloaded: boolean; downloading: boolean; progress: number; error?: string } | undefined

  if (modelStatusQuery.isLoading) {
    return <span className="text-xs text-muted-foreground">Checking...</span>
  }

  if (status?.downloaded) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-green-600">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Ready
      </span>
    )
  }

  if (status?.downloading || isDownloading) {
    const progress = status?.progress ?? downloadProgress
    return (
      <div className="flex flex-col gap-1.5 w-full">
        <div className="flex items-center gap-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground">
            Downloading... {Math.round(progress * 100)}%
          </span>
        </div>
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-200"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>
    )
  }

  if (status?.error) {
    return (
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-destructive">{status.error}</span>
        <Button size="sm" variant="outline" onClick={handleDownload}>
          <Download className="h-3.5 w-3.5 mr-1.5" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <Button size="sm" variant="outline" onClick={handleDownload}>
      <Download className="h-3.5 w-3.5 mr-1.5" />
      Download (~24MB)
    </Button>
  )
}

// Kitten Provider Section Component
function KittenProviderSection({
  isActive,
  isCollapsed,
  onToggleCollapse,
  usageBadges,
  voiceId,
}: {
  isActive: boolean
  isCollapsed: boolean
  onToggleCollapse: () => void
  usageBadges: { label: string; icon: React.ElementType }[]
  voiceId: number
}) {
  // Query model status to determine if voice controls should be shown
  const modelStatusQuery = useQuery({
    queryKey: ["kittenModelStatus"],
    queryFn: () => window.electron.ipcRenderer.invoke("getKittenModelStatus"),
  })
  const modelDownloaded = (modelStatusQuery.data as { downloaded: boolean } | undefined)?.downloaded ?? false
  const handleTestVoice = async () => {
    try {
      const result = await window.electron.ipcRenderer.invoke("synthesizeWithKitten", {
        text: "Hello! This is a test of the Kitten text to speech voice.",
        voiceId,
      }) as { audio: string; sampleRate: number }
      // Decode base64 WAV audio and play it
      const audioData = Uint8Array.from(atob(result.audio), c => c.charCodeAt(0))
      const blob = new Blob([audioData], { type: "audio/wav" })
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audio.onended = () => URL.revokeObjectURL(url)
      audio.onerror = () => URL.revokeObjectURL(url)
      await audio.play()
    } catch (error) {
      console.error("Failed to test Kitten voice:", error)
    }
  }

  return (
    <div className={`rounded-lg border ${isActive ? 'border-primary/30 bg-primary/5' : ''}`}>
      <button
        type="button"
        className="px-3 py-2 flex items-center justify-between w-full hover:bg-muted/30 transition-colors cursor-pointer"
        onClick={onToggleCollapse}
        aria-expanded={!isCollapsed}
        aria-controls="kitten-provider-content"
      >
        <span className="flex items-center gap-2 text-sm font-semibold">
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
          <Volume2 className="h-4 w-4" />
          Kitten (Local)
          {isActive && (
            <CheckCircle2 className="h-4 w-4 text-primary" />
          )}
        </span>
        {isActive && usageBadges.length > 0 && (
          <div className="flex gap-1.5 flex-wrap justify-end">
            {usageBadges.map((badge) => (
              <ActiveProviderBadge key={badge.label} label={badge.label} icon={badge.icon} />
            ))}
          </div>
        )}
      </button>
      {!isCollapsed && (
        <div id="kitten-provider-content" className="divide-y border-t">
          <p className="px-3 py-1.5 text-[11px] text-muted-foreground">
            {isActive
              ? "Local text-to-speech with Kitten on your device."
              : "Not selected above. You can still configure it here."}
          </p>

          {/* Model Download Section */}
          <Control
            label={
              <ControlLabel
                label="Model Status"
                tooltip="Download the Kitten TTS model (~24MB) for local speech synthesis"
              />
            }
            className="px-3"
          >
            <KittenModelDownload />
          </Control>

          <p className="px-3 py-1.5 text-[11px] text-muted-foreground border-t">
            Voice selection now lives in Voice Models above. Use this section for install status and quick voice testing.
          </p>

          {/* Test Voice Button - only shown when model is downloaded */}
          {modelDownloaded && (
            <Control
              label={
                <ControlLabel
                  label="Test Voice"
                  tooltip="Play a sample phrase using the selected voice"
                />
              }
              className="px-3"
            >
              <Button size="sm" variant="outline" onClick={handleTestVoice}>
                <Volume2 className="h-3.5 w-3.5 mr-1.5" />
                Test Voice
              </Button>
            </Control>
          )}
        </div>
      )}
    </div>
  )
}

// Supertonic Model Download Component
function SupertonicModelDownload() {
  const queryClient = useQueryClient()
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)

  const modelStatusQuery = useQuery({
    queryKey: ["supertonicModelStatus"],
    queryFn: () => window.electron.ipcRenderer.invoke("getSupertonicModelStatus"),
    refetchInterval: (query) => {
      const status = query.state.data as { downloading?: boolean } | undefined
      return (isDownloading || status?.downloading) ? 500 : false
    },
  })

  const handleDownload = async () => {
    setIsDownloading(true)
    setDownloadProgress(0)
    try {
      await window.electron.ipcRenderer.invoke("downloadSupertonicModel")
    } catch (error) {
      console.error("Failed to download Supertonic model:", error)
    } finally {
      setIsDownloading(false)
      queryClient.invalidateQueries({ queryKey: ["supertonicModelStatus"] })
    }
  }

  const status = modelStatusQuery.data as { downloaded: boolean; downloading: boolean; progress: number; error?: string } | undefined

  if (modelStatusQuery.isLoading) {
    return <span className="text-xs text-muted-foreground">Checking...</span>
  }

  if (status?.downloaded) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-green-600">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Ready
      </span>
    )
  }

  if (status?.downloading || isDownloading) {
    const progress = status?.progress ?? downloadProgress
    return (
      <div className="flex flex-col gap-1.5 w-full">
        <div className="flex items-center gap-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground">
            Downloading... {Math.round(progress * 100)}%
          </span>
        </div>
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-200"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>
    )
  }

  if (status?.error) {
    return (
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-destructive">{status.error}</span>
        <Button size="sm" variant="outline" onClick={handleDownload}>
          <Download className="h-3.5 w-3.5 mr-1.5" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <Button size="sm" variant="outline" onClick={handleDownload}>
      <Download className="h-3.5 w-3.5 mr-1.5" />
      Download (~263MB)
    </Button>
  )
}

// Supertonic Provider Section Component
function SupertonicProviderSection({
  isActive,
  isCollapsed,
  onToggleCollapse,
  usageBadges,
  voice,
  language,
  speed,
  steps,
}: {
  isActive: boolean
  isCollapsed: boolean
  onToggleCollapse: () => void
  usageBadges: { label: string; icon: React.ElementType }[]
  voice: string
  language: string
  speed: number
  steps: number
}) {
  const modelStatusQuery = useQuery({
    queryKey: ["supertonicModelStatus"],
    queryFn: () => window.electron.ipcRenderer.invoke("getSupertonicModelStatus"),
  })
  const modelDownloaded = (modelStatusQuery.data as { downloaded: boolean } | undefined)?.downloaded ?? false

  const handleTestVoice = async () => {
    try {
      const result = await window.electron.ipcRenderer.invoke("synthesizeWithSupertonic", {
        text: "Hello! This is a test of the Supertonic text to speech voice.",
        voice,
        lang: language,
        speed,
        steps,
      }) as { audio: string; sampleRate: number }
      const audioData = Uint8Array.from(atob(result.audio), c => c.charCodeAt(0))
      const blob = new Blob([audioData], { type: "audio/wav" })
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audio.onended = () => URL.revokeObjectURL(url)
      audio.onerror = () => URL.revokeObjectURL(url)
      await audio.play()
    } catch (error) {
      console.error("Failed to test Supertonic voice:", error)
    }
  }

  return (
    <div className={`rounded-lg border ${isActive ? 'border-primary/30 bg-primary/5' : ''}`}>
      <button
        type="button"
        className="px-3 py-2 flex items-center justify-between w-full hover:bg-muted/30 transition-colors cursor-pointer"
        onClick={onToggleCollapse}
        aria-expanded={!isCollapsed}
        aria-controls="supertonic-provider-content"
      >
        <span className="flex items-center gap-2 text-sm font-semibold">
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
          <Volume2 className="h-4 w-4" />
          Supertonic (Local)
          {isActive && (
            <CheckCircle2 className="h-4 w-4 text-primary" />
          )}
        </span>
        {isActive && usageBadges.length > 0 && (
          <div className="flex gap-1.5 flex-wrap justify-end">
            {usageBadges.map((badge) => (
              <ActiveProviderBadge key={badge.label} label={badge.label} icon={badge.icon} />
            ))}
          </div>
        )}
      </button>
      {!isCollapsed && (
        <div id="supertonic-provider-content" className="divide-y border-t">
          <p className="px-3 py-1.5 text-[11px] text-muted-foreground">
            {isActive
              ? "Local text-to-speech with Supertonic on your device. Supports English, Korean, Spanish, Portuguese, and French."
              : "Not selected above. You can still configure it here."}
          </p>

          {/* Model Download Section */}
          <Control
            label={
              <ControlLabel
                label="Model Status"
                tooltip="Download the Supertonic TTS model (~263MB) for local speech synthesis"
              />
            }
            className="px-3"
          >
            <SupertonicModelDownload />
          </Control>

          <p className="px-3 py-1.5 text-[11px] text-muted-foreground border-t">
            Voice, language, and quality settings now live in Voice Models above. Use this section for install status and quick voice testing.
          </p>

          {modelDownloaded && (
            <Control
              label={
                <ControlLabel
                  label="Test Voice"
                  tooltip="Play a sample phrase using the selected voice and settings"
                />
              }
              className="px-3"
            >
              <Button size="sm" variant="outline" onClick={handleTestVoice}>
                <Volume2 className="h-3.5 w-3.5 mr-1.5" />
                Test Voice
              </Button>
            </Control>
          )}
        </div>
      )}
    </div>
  )
}

// Smallest AI Provider Section Component
function SmallestProviderSection({
  isActive,
  isCollapsed,
  onToggleCollapse,
  usageBadges,
  apiKey,
  voice,
  onSaveConfig,
}: {
  isActive: boolean
  isCollapsed: boolean
  onToggleCollapse: () => void
  usageBadges: { label: string; icon: React.ElementType }[]
  apiKey: string
  voice: string
  onSaveConfig: (config: Partial<Config>) => void
}) {
  const [isTesting, setIsTesting] = useState(false)
  const [testError, setTestError] = useState<string | null>(null)

  const handleTestVoice = async () => {
    if (!apiKey) {
      setTestError("API key is required to test voice")
      return
    }
    setIsTesting(true)
    setTestError(null)
    try {
      const result = await window.electron.ipcRenderer.invoke("synthesizeWithSmallest", {
        text: "Hello! This is a test of the Smallest AI text to speech voice.",
        voice,
      }) as { audio: string; sampleRate: number }
      // Decode base64 WAV audio and play it
      const audioData = Uint8Array.from(atob(result.audio), c => c.charCodeAt(0))
      const blob = new Blob([audioData], { type: "audio/wav" })
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audio.onended = () => URL.revokeObjectURL(url)
      audio.onerror = () => URL.revokeObjectURL(url)
      await audio.play()
    } catch (error) {
      console.error("Failed to test Smallest AI voice:", error)
      setTestError(error instanceof Error ? error.message : "Failed to test voice")
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div className={`rounded-lg border ${isActive ? 'border-primary/30 bg-primary/5' : ''}`}>
      <button
        type="button"
        className="px-3 py-2 flex items-center justify-between w-full hover:bg-muted/30 transition-colors cursor-pointer"
        onClick={onToggleCollapse}
        aria-expanded={!isCollapsed}
        aria-controls={isActive ? "smallest-provider-content" : "smallest-provider-content-inactive"}
      >
        <span className="flex items-center gap-2 text-sm font-semibold">
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
          <Volume2 className="h-4 w-4" />
          Smallest AI
          {isActive && (
            <CheckCircle2 className="h-4 w-4 text-primary" />
          )}
        </span>
        {isActive && usageBadges.length > 0 && (
          <div className="flex gap-1.5 flex-wrap justify-end">
            {usageBadges.map((badge) => (
              <ActiveProviderBadge key={badge.label} label={badge.label} icon={badge.icon} />
            ))}
          </div>
        )}
      </button>
      {!isCollapsed && (
        <div id={isActive ? "smallest-provider-content" : "smallest-provider-content-inactive"} className="divide-y border-t">
          <p className="px-3 py-1.5 text-[11px] text-muted-foreground">
            {isActive
              ? "Cloud TTS via Smallest AI Lightning model. ~200ms latency, 80+ voices."
              : "Not selected above. You can still configure it here."}
          </p>
          <div className="px-3 py-2">
            <label className="text-xs font-medium text-muted-foreground block mb-1">API Key</label>
            <input
              type="password"
              className="w-full text-xs rounded border px-2 py-1 bg-background"
              placeholder="Enter Smallest AI API key"
              defaultValue={apiKey}
              onBlur={(e) => onSaveConfig({ smallestApiKey: e.target.value } as Partial<Config>)}
            />
          </div>
          <div className="px-3 py-2">
            <label className="text-xs font-medium text-muted-foreground block mb-1">Voice</label>
            <select
              className="w-full text-xs rounded border px-2 py-1 bg-background"
              value={voice}
              onChange={(e) => onSaveConfig({ smallestTtsVoice: e.target.value } as Partial<Config>)}
            >
              <option value="magnus">Magnus</option>
              <option value="emily">Emily</option>
              <option value="jasper">Jasper</option>
              <option value="aria">Aria</option>
              <option value="luna">Luna</option>
              <option value="ethan">Ethan</option>
            </select>
          </div>
          <Control
            label={
              <ControlLabel
                label="Test Voice"
                tooltip="Play a sample phrase using the selected voice"
              />
            }
            className="px-3"
          >
            <Button size="sm" variant="outline" onClick={handleTestVoice} disabled={isTesting || !apiKey}>
              {isTesting ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <Volume2 className="h-3.5 w-3.5 mr-1.5" />
              )}
              {isTesting ? "Testing..." : "Test Voice"}
            </Button>
          </Control>
          {testError && (
            <p className="px-3 py-1.5 text-[11px] text-destructive">{testError}</p>
          )}
        </div>
      )}
    </div>
  )
}


export function Component() {
  const configQuery = useConfigQuery()

  const saveConfigMutation = useSaveConfigMutation()
  const cfgRef = useRef(configQuery.data)
  const providerSaveTimeoutsRef = useRef<Partial<Record<ProviderDraftKey, ReturnType<typeof setTimeout>>>>({})
  const [providerDrafts, setProviderDrafts] = useState(() => getProviderDrafts(configQuery.data))

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
    cfgRef.current = configQuery.data
  }, [configQuery.data])

  useEffect(() => {
    setProviderDrafts(getProviderDrafts(configQuery.data))
  }, [
    configQuery.data?.groqApiKey,
    configQuery.data?.groqBaseUrl,
    configQuery.data?.geminiApiKey,
    configQuery.data?.geminiBaseUrl,
  ])

  useEffect(() => {
    return () => {
      for (const timeout of Object.values(providerSaveTimeoutsRef.current) as Array<ReturnType<typeof setTimeout> | undefined>) {
        if (timeout) clearTimeout(timeout)
      }
    }
  }, [])

  const flushProviderSave = useCallback((key: ProviderDraftKey, value: string) => {
    const pendingSave = providerSaveTimeoutsRef.current[key]
    if (pendingSave) {
      clearTimeout(pendingSave)
      delete providerSaveTimeoutsRef.current[key]
    }

    saveConfig({ [key]: value } as Partial<Config>)
  }, [saveConfig])

  const scheduleProviderSave = useCallback((key: ProviderDraftKey, value: string) => {
    const pendingSave = providerSaveTimeoutsRef.current[key]
    if (pendingSave) {
      clearTimeout(pendingSave)
    }

    providerSaveTimeoutsRef.current[key] = setTimeout(() => {
      delete providerSaveTimeoutsRef.current[key]
      saveConfig({ [key]: value } as Partial<Config>)
    }, SETTINGS_TEXT_SAVE_DEBOUNCE_MS)
  }, [saveConfig])

  const updateProviderDraft = useCallback((key: ProviderDraftKey, value: string) => {
    setProviderDrafts((currentDrafts) => ({
      ...currentDrafts,
      [key]: value,
    }))
    scheduleProviderSave(key, value)
  }, [scheduleProviderSave])

  // Compute which providers are actively being used for each function
  const activeProviders = useMemo(() => {
    if (!configQuery.data) return { openai: [], groq: [], gemini: [], parakeet: [], kitten: [], supertonic: [], smallest: [] }

    const isMainAgentAcpMode = configQuery.data.mainAgentMode === "acp"
    const stt = configQuery.data.sttProviderId || "openai"
    const transcript = configQuery.data.transcriptPostProcessingProviderId || "openai"
    const mcp = configQuery.data.mcpToolsProviderId || "openai"
    const tts = configQuery.data.ttsProviderId || "openai"

    return {
      openai: [
        ...(stt === "openai" ? [{ label: "STT", icon: Mic }] : []),
        ...(transcript === "openai" ? [{ label: "Cleanup", icon: FileText }] : []),
        ...(mcp === "openai" && !isMainAgentAcpMode ? [{ label: "Agent", icon: Bot }] : []),
        ...(tts === "openai" ? [{ label: "TTS", icon: Volume2 }] : []),
      ],
      groq: [
        ...(stt === "groq" ? [{ label: "STT", icon: Mic }] : []),
        ...(transcript === "groq" ? [{ label: "Cleanup", icon: FileText }] : []),
        ...(mcp === "groq" && !isMainAgentAcpMode ? [{ label: "Agent", icon: Bot }] : []),
        ...(tts === "groq" ? [{ label: "TTS", icon: Volume2 }] : []),
      ],
      gemini: [
        ...(transcript === "gemini" ? [{ label: "Cleanup", icon: FileText }] : []),
        ...(mcp === "gemini" && !isMainAgentAcpMode ? [{ label: "Agent", icon: Bot }] : []),
        ...(tts === "gemini" ? [{ label: "TTS", icon: Volume2 }] : []),
      ],
      parakeet: [
        ...(stt === "parakeet" ? [{ label: "STT", icon: Mic }] : []),
      ],
      kitten: [
        ...(tts === "kitten" ? [{ label: "TTS", icon: Volume2 }] : []),
      ],
      supertonic: [
        ...(tts === "supertonic" ? [{ label: "TTS", icon: Volume2 }] : []),
      ],
      smallest: [
        ...(tts === "smallest" ? [{ label: "TTS", icon: Volume2 }] : []),
      ],
    }
  }, [configQuery.data])

  const selectableMainAcpAgents = useMemo(
    () => getSelectableMainAcpAgents(configQuery.data?.agentProfiles || [], configQuery.data?.acpAgents || []),
    [configQuery.data?.agentProfiles, configQuery.data?.acpAgents]
  )

  const selectedMainAcpAgentDisplayName = useMemo(() => {
    const selectedAgentName = configQuery.data?.mainAgentName?.trim()
    if (!selectedAgentName) return null
    return selectableMainAcpAgents.find(agent => agent.name === selectedAgentName)?.displayName || selectedAgentName
  }, [configQuery.data?.mainAgentName, selectableMainAcpAgents])

  const isMainAgentAcpMode = configQuery.data?.mainAgentMode === "acp"

  // Determine which providers are active (selected for at least one feature)
  const isGroqActive = activeProviders.groq.length > 0
  const isGeminiActive = activeProviders.gemini.length > 0
  const isParakeetActive = activeProviders.parakeet.length > 0
  const isKittenActive = activeProviders.kitten.length > 0
  const isSupertonicActive = activeProviders.supertonic.length > 0
  const isSmallestActive = activeProviders.smallest.length > 0

  if (!configQuery.data) return null

  const renderProviderDraftInput = (
    key: ProviderDraftKey,
    {
      label,
      type,
      placeholder,
    }: {
      label: string
      type: "password" | "url"
      placeholder?: string
    },
  ) => (
    <Control label={label} className="px-3">
      <Input
        type={type}
        placeholder={placeholder}
        value={providerDrafts[key]}
        onChange={(e) => {
          updateProviderDraft(key, e.currentTarget.value)
        }}
        onBlur={(e) => {
          flushProviderSave(key, e.currentTarget.value)
        }}
      />
    </Control>
  )

  return (
    <div className="modern-panel h-full overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-6">

      <div className="grid gap-4">
        <div className="rounded-lg border bg-muted/20 px-4 py-3">
          <h2 className="text-sm font-semibold">Provider Setup</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Use this page for API keys, base URLs, local engine downloads, and quick provider diagnostics. All model and voice
            selection now lives on the Models page.
          </p>
          {isMainAgentAcpMode && (
            <div className="mt-3 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-xs">
              <div className="flex items-center gap-1.5 font-medium text-primary">
                <Bot className="h-3.5 w-3.5" />
                ACP Main Agent:{" "}
                <span className="text-foreground">{selectedMainAcpAgentDisplayName || "Not selected"}</span>
              </div>
              <p className="mt-1 text-muted-foreground">
                ACP mode handles chat submissions through the selected agent. Provider setup below still applies to API-backed
                tools, voice, and local engines.
              </p>
            </div>
          )}
        </div>

        {/* OpenAI Compatible Provider Section */}
        <div className={`rounded-lg border ${activeProviders.openai.length > 0 ? 'border-primary/30 bg-primary/5' : ''}`}>
          <button
            type="button"
            className="px-3 py-2 flex items-center justify-between w-full hover:bg-muted/30 transition-colors cursor-pointer"
            onClick={() => saveConfig({ providerSectionCollapsedOpenai: !configQuery.data.providerSectionCollapsedOpenai })}
            aria-expanded={!configQuery.data.providerSectionCollapsedOpenai}
            aria-controls="openai-provider-content"
          >
            <span className="flex items-center gap-2 text-sm font-semibold">
              {configQuery.data.providerSectionCollapsedOpenai ? (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
              OpenAI Compatible
              {activeProviders.openai.length > 0 && (
                <CheckCircle2 className="h-4 w-4 text-primary" />
              )}
            </span>
            {activeProviders.openai.length > 0 && (
              <div className="flex gap-1.5 flex-wrap justify-end">
                {activeProviders.openai.map((badge) => (
                  <ActiveProviderBadge key={badge.label} label={badge.label} icon={badge.icon} />
                ))}
              </div>
            )}
          </button>
          {!configQuery.data.providerSectionCollapsedOpenai && (
            <div id="openai-provider-content" className="divide-y border-t">
              {activeProviders.openai.length === 0 && (
                <p className="px-3 py-1.5 text-[11px] text-muted-foreground">
                  OpenAI-compatible presets are selected from the Models page.
                </p>
              )}

              <div className="px-3 py-2">
                <p className="text-sm text-muted-foreground">
                  OpenAI-compatible presets, agent models, and transcript cleanup models are now managed on the Models page.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Groq Provider Section - rendered in order based on active status */}
        {isGroqActive && (
          <div className="rounded-lg border border-primary/30 bg-primary/5">
            <button
              type="button"
              className="px-3 py-2 flex items-center justify-between w-full hover:bg-muted/30 transition-colors cursor-pointer"
              onClick={() => saveConfig({ providerSectionCollapsedGroq: !configQuery.data.providerSectionCollapsedGroq })}
              aria-expanded={!configQuery.data.providerSectionCollapsedGroq}
              aria-controls="groq-provider-content"
            >
              <span className="flex items-center gap-2 text-sm font-semibold">
                {configQuery.data.providerSectionCollapsedGroq ? (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
                Groq
                <CheckCircle2 className="h-4 w-4 text-primary" />
              </span>
              <div className="flex gap-1.5 flex-wrap justify-end">
                {activeProviders.groq.map((badge) => (
                  <ActiveProviderBadge key={badge.label} label={badge.label} icon={badge.icon} />
                ))}
              </div>
            </button>
            {!configQuery.data.providerSectionCollapsedGroq && (
              <div id="groq-provider-content" className="divide-y border-t">
                {renderProviderDraftInput("groqApiKey", {
                  label: "API Key",
                  type: "password",
                })}

                {renderProviderDraftInput("groqBaseUrl", {
                  label: "API Base URL",
                  type: "url",
                  placeholder: "https://api.groq.com/openai/v1",
                })}

                <p className="px-3 py-1.5 text-[11px] text-muted-foreground border-t">
                  Groq model selection now lives on the Models page.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Gemini Provider Section - rendered in order based on active status */}
        {isGeminiActive && (
          <div className="rounded-lg border border-primary/30 bg-primary/5">
            <button
              type="button"
              className="px-3 py-2 flex items-center justify-between w-full hover:bg-muted/30 transition-colors cursor-pointer"
              onClick={() => saveConfig({ providerSectionCollapsedGemini: !configQuery.data.providerSectionCollapsedGemini })}
              aria-expanded={!configQuery.data.providerSectionCollapsedGemini}
              aria-controls="gemini-provider-content"
            >
              <span className="flex items-center gap-2 text-sm font-semibold">
                {configQuery.data.providerSectionCollapsedGemini ? (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
                Gemini
                <CheckCircle2 className="h-4 w-4 text-primary" />
              </span>
              <div className="flex gap-1.5 flex-wrap justify-end">
                {activeProviders.gemini.map((badge) => (
                  <ActiveProviderBadge key={badge.label} label={badge.label} icon={badge.icon} />
                ))}
              </div>
            </button>
            {!configQuery.data.providerSectionCollapsedGemini && (
              <div id="gemini-provider-content" className="divide-y border-t">
                {renderProviderDraftInput("geminiApiKey", {
                  label: "API Key",
                  type: "password",
                })}

                {renderProviderDraftInput("geminiBaseUrl", {
                  label: "API Base URL",
                  type: "url",
                  placeholder: "https://generativelanguage.googleapis.com",
                })}

                <p className="px-3 py-1.5 text-[11px] text-muted-foreground border-t">
                  Gemini model selection now lives on the Models page.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Parakeet (Local) Provider Section */}
        {isParakeetActive && (
          <ParakeetProviderSection
            isActive={true}
            isCollapsed={configQuery.data.providerSectionCollapsedParakeet ?? true}
            onToggleCollapse={() => saveConfig({ providerSectionCollapsedParakeet: !(configQuery.data.providerSectionCollapsedParakeet ?? true) })}
            usageBadges={activeProviders.parakeet}
            numThreads={configQuery.data.parakeetNumThreads || 2}
            onNumThreadsChange={(value) => saveConfig({ parakeetNumThreads: value })}
          />
        )}

        {/* Kitten (Local) TTS Provider Section */}
        {isKittenActive && (
          <KittenProviderSection
            isActive={true}
            isCollapsed={configQuery.data.providerSectionCollapsedKitten ?? true}
            onToggleCollapse={() => saveConfig({ providerSectionCollapsedKitten: !(configQuery.data.providerSectionCollapsedKitten ?? true) })}
            usageBadges={activeProviders.kitten}
            voiceId={configQuery.data.kittenVoiceId ?? 0}
          />
        )}

        {/* Supertonic (Local) TTS Provider Section */}
        {isSupertonicActive && (
          <SupertonicProviderSection
            isActive={true}
            isCollapsed={configQuery.data.providerSectionCollapsedSupertonic ?? true}
            onToggleCollapse={() => saveConfig({ providerSectionCollapsedSupertonic: !(configQuery.data.providerSectionCollapsedSupertonic ?? true) } as Partial<Config>)}
            usageBadges={activeProviders.supertonic}
            voice={configQuery.data.supertonicVoice ?? "M1"}
            language={configQuery.data.supertonicLanguage ?? "en"}
            speed={configQuery.data.supertonicSpeed ?? 1.05}
            steps={configQuery.data.supertonicSteps ?? 5}
          />
        )}
        {/* Smallest AI TTS Provider Section */}
        {isSmallestActive && (
          <SmallestProviderSection
            isActive={true}
            isCollapsed={configQuery.data.providerSectionCollapsedSmallest ?? true}
            onToggleCollapse={() => saveConfig({ providerSectionCollapsedSmallest: !(configQuery.data.providerSectionCollapsedSmallest ?? true) } as Partial<Config>)}
            usageBadges={activeProviders.smallest}
            apiKey={configQuery.data.smallestApiKey || ""}
            voice={configQuery.data.smallestTtsVoice || "magnus"}
            onSaveConfig={saveConfig}
          />
        )}

        {/* Inactive Groq Provider Section - shown at bottom when not selected */}
        {!isGroqActive && (
          <div className="rounded-lg border">
            <button
              type="button"
              className="px-3 py-2 flex items-center justify-between w-full hover:bg-muted/30 transition-colors cursor-pointer"
              onClick={() => saveConfig({ providerSectionCollapsedGroq: !configQuery.data.providerSectionCollapsedGroq })}
              aria-expanded={!configQuery.data.providerSectionCollapsedGroq}
              aria-controls="groq-provider-content-inactive"
            >
              <span className="flex items-center gap-2 text-sm font-semibold">
                {configQuery.data.providerSectionCollapsedGroq ? (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
                Groq
              </span>
            </button>
            {!configQuery.data.providerSectionCollapsedGroq && (
              <div id="groq-provider-content-inactive" className="divide-y border-t">
                <p className="px-3 py-1.5 text-[11px] text-muted-foreground">
                  Not selected above. You can still configure it here.
                </p>

                {renderProviderDraftInput("groqApiKey", {
                  label: "API Key",
                  type: "password",
                })}

                {renderProviderDraftInput("groqBaseUrl", {
                  label: "API Base URL",
                  type: "url",
                  placeholder: "https://api.groq.com/openai/v1",
                })}

                <p className="px-3 py-1.5 text-[11px] text-muted-foreground border-t">
                  Groq model selection now lives on the Models page.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Inactive Gemini Provider Section - shown at bottom when not selected */}
        {!isGeminiActive && (
          <div className="rounded-lg border">
            <button
              type="button"
              className="px-3 py-2 flex items-center justify-between w-full hover:bg-muted/30 transition-colors cursor-pointer"
              onClick={() => saveConfig({ providerSectionCollapsedGemini: !configQuery.data.providerSectionCollapsedGemini })}
              aria-expanded={!configQuery.data.providerSectionCollapsedGemini}
              aria-controls="gemini-provider-content-inactive"
            >
              <span className="flex items-center gap-2 text-sm font-semibold">
                {configQuery.data.providerSectionCollapsedGemini ? (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
                Gemini
              </span>
            </button>
            {!configQuery.data.providerSectionCollapsedGemini && (
              <div id="gemini-provider-content-inactive" className="divide-y border-t">
                <p className="px-3 py-1.5 text-[11px] text-muted-foreground">
                  Not selected above. You can still configure it here.
                </p>

                {renderProviderDraftInput("geminiApiKey", {
                  label: "API Key",
                  type: "password",
                })}

                {renderProviderDraftInput("geminiBaseUrl", {
                  label: "API Base URL",
                  type: "url",
                  placeholder: "https://generativelanguage.googleapis.com",
                })}

                <p className="px-3 py-1.5 text-[11px] text-muted-foreground border-t">
                  Gemini model selection now lives on the Models page.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Inactive Parakeet Provider Section - shown at bottom when not selected */}
        {!isParakeetActive && (
          <ParakeetProviderSection
            isActive={false}
            isCollapsed={configQuery.data.providerSectionCollapsedParakeet ?? true}
            onToggleCollapse={() => saveConfig({ providerSectionCollapsedParakeet: !(configQuery.data.providerSectionCollapsedParakeet ?? true) })}
            usageBadges={activeProviders.parakeet}
            numThreads={configQuery.data.parakeetNumThreads || 2}
            onNumThreadsChange={(value) => saveConfig({ parakeetNumThreads: value })}
          />
        )}

        {/* Inactive Kitten Provider Section - shown at bottom when not selected */}
        {!isKittenActive && (
          <KittenProviderSection
            isActive={false}
            isCollapsed={configQuery.data.providerSectionCollapsedKitten ?? true}
            onToggleCollapse={() => saveConfig({ providerSectionCollapsedKitten: !(configQuery.data.providerSectionCollapsedKitten ?? true) })}
            usageBadges={activeProviders.kitten}
            voiceId={configQuery.data.kittenVoiceId ?? 0}
          />
        )}

        {/* Inactive Supertonic Provider Section - shown at bottom when not selected */}
        {!isSupertonicActive && (
          <SupertonicProviderSection
            isActive={false}
            isCollapsed={configQuery.data.providerSectionCollapsedSupertonic ?? true}
            onToggleCollapse={() => saveConfig({ providerSectionCollapsedSupertonic: !(configQuery.data.providerSectionCollapsedSupertonic ?? true) } as Partial<Config>)}
            usageBadges={activeProviders.supertonic}
            voice={configQuery.data.supertonicVoice ?? "M1"}
            language={configQuery.data.supertonicLanguage ?? "en"}
            speed={configQuery.data.supertonicSpeed ?? 1.05}
            steps={configQuery.data.supertonicSteps ?? 5}
          />
        )}

        {/* Inactive Smallest AI Provider Section */}
        {!isSmallestActive && (
          <SmallestProviderSection
            isActive={false}
            isCollapsed={configQuery.data.providerSectionCollapsedSmallest ?? true}
            onToggleCollapse={() => saveConfig({ providerSectionCollapsedSmallest: !(configQuery.data.providerSectionCollapsedSmallest ?? true) } as Partial<Config>)}
            usageBadges={activeProviders.smallest}
            apiKey={configQuery.data.smallestApiKey || ""}
            voice={configQuery.data.smallestTtsVoice || "magnus"}
            onSaveConfig={saveConfig}
          />
        )}

      </div>
    </div>
  )
}