import React, { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "@renderer/components/ui/button"
import { Slider } from "@renderer/components/ui/slider"
import { Play, Pause, Volume2, VolumeX, Loader2 } from "lucide-react"
import { cn } from "@renderer/lib/utils"
import { tipcClient } from "@renderer/lib/tipc-client"
import { useAgentStore } from "@renderer/stores"
import { logUI } from "@renderer/lib/debug"

const AUTO_PLAY_ATTEMPT_SUPPRESSION_MS = 5_000
const recentAutoPlayAttemptByKey = new Map<string, number>()

type GeneratedAudioResult = ArrayBuffer | { audio: ArrayBuffer; mimeType?: string }

interface AudioPlayerProps {
  audioData?: ArrayBuffer
  audioMimeType?: string
  text: string
  onGenerateAudio?: () => Promise<GeneratedAudioResult>
  className?: string
  compact?: boolean
  isGenerating?: boolean
  error?: string | null
  autoPlay?: boolean
  playbackId?: string
  sessionId?: string
  ttsKeys?: string[]
  source?: "main" | "panel" | "tile" | "overlay" | "unknown" | string
  onPlaybackRequestError?: (error: unknown) => void
  /** Called when play/pause state changes so parent can reflect it (e.g. header icon) */
  onPlayStateChange?: (playing: boolean) => void
  /** Audio output device ID (from navigator.mediaDevices.enumerateDevices) */
  audioOutputDeviceId?: string
  /**
   * Optional discriminator used to scope the cross-instance auto-play
   * suppression window. Callers should pass a per-response identifier
   * (e.g. `${sessionId}-${responseEventId}`) so that two distinct
   * responses with identical wording aren't suppressed against each other.
   */
  autoPlaySuppressionKey?: string
}

function isAutoplayPolicyBlockedError(error: unknown): boolean {
  const name = error instanceof DOMException ? error.name.toLowerCase() : ""
  const message = error instanceof Error ? error.message.toLowerCase() : String(error ?? "").toLowerCase()

  return (
    name === "notallowederror" ||
    message.includes("autoplay") ||
    message.includes("user gesture") ||
    message.includes("user didn't interact") ||
    message.includes("not allowed")
  )
}

function normalizeGeneratedAudio(result: GeneratedAudioResult, fallbackMimeType?: string) {
  if (result instanceof ArrayBuffer) {
    return { audio: result, mimeType: fallbackMimeType || "audio/wav" }
  }
  return { audio: result.audio, mimeType: result.mimeType || fallbackMimeType || "audio/wav" }
}

function deriveSourceFromLocation(): string {
  if (typeof window === "undefined") return "unknown"
  const path = window.location?.pathname ?? ""
  if (path.includes("panel")) return "panel"
  return "main"
}

export function AudioPlayer({
  audioData,
  audioMimeType,
  text,
  onGenerateAudio,
  className,
  compact = false,
  isGenerating = false,
  error = null,
  autoPlay = false,
  playbackId,
  sessionId,
  ttsKeys,
  source,
  onPlaybackRequestError,
  onPlayStateChange,
  audioOutputDeviceId,
  autoPlaySuppressionKey,
}: AudioPlayerProps) {
  const generatedPlaybackIdRef = useRef(`tts-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  const effectivePlaybackId = playbackId ?? generatedPlaybackIdRef.current
  const playbackAttemptIdRef = useRef(0)
  const autoPlayAttemptKeyRef = useRef<string | null>(null)
  const [hasAudio, setHasAudio] = useState(!!audioData)
  const [hasAutoPlayed, setHasAutoPlayed] = useState(false)
  const [wasStopped, setWasStopped] = useState(false)
  const [isAutoplayBlocked, setIsAutoplayBlocked] = useState(false)
  const [localVolume, setLocalVolume] = useState(1)
  const [localMuted, setLocalMuted] = useState(false)
  const ttsPlaybackState = useAgentStore((state) => state.ttsPlaybackState) ?? {
    playbackId: null,
    status: "idle" as const,
    currentTime: 0,
    duration: 0,
    volume: 1,
    muted: false,
    updatedAt: 0,
  }
  const isActive = ttsPlaybackState?.playbackId === effectivePlaybackId
  const isPlaying = isActive && ttsPlaybackState.status === "playing"
  const currentTime = isActive ? ttsPlaybackState.currentTime : 0
  const duration = isActive ? ttsPlaybackState.duration : 0
  const volume = isActive ? ttsPlaybackState.volume : localVolume
  const isMuted = isActive ? ttsPlaybackState.muted : localMuted

  useEffect(() => {
    setHasAudio(!!audioData)
    setHasAutoPlayed(false)
    autoPlayAttemptKeyRef.current = null
    setWasStopped(false)
    setIsAutoplayBlocked(false)
    logUI("[AudioPlayer][TTS] audio props changed", {
      playbackId: effectivePlaybackId,
      sessionId,
      source,
      hasAudioData: !!audioData,
      mimeType: audioMimeType,
      textPreview: text.slice(0, 80),
    })
  }, [audioData, audioMimeType, text])

  useEffect(() => {
    onPlayStateChange?.(isPlaying)
  }, [isPlaying, onPlayStateChange])

  useEffect(() => {
    if (!isActive || ttsPlaybackState.status !== "error") return
    logUI("[AudioPlayer][TTS] active playback entered error state", {
      playbackId: effectivePlaybackId,
      sessionId,
      error: ttsPlaybackState.error,
    })
    setIsAutoplayBlocked(isAutoplayPolicyBlockedError(ttsPlaybackState.error))
  }, [isActive, ttsPlaybackState.status, ttsPlaybackState.error])

  const requestPlayback = useCallback(async (
    audio: ArrayBuffer,
    mimeType: string | undefined,
    requestSource: "auto" | "manual" | "autoplay-retry",
  ) => {
    const attemptId = ++playbackAttemptIdRef.current
    const shouldAutoPlay = requestSource !== "manual"

    try {
      logUI("[AudioPlayer][TTS] requestPlayback start", {
        playbackId: effectivePlaybackId,
        sessionId,
        requestSource,
        shouldAutoPlay,
        source: source ?? deriveSourceFromLocation(),
        keyCount: ttsKeys?.length ?? 0,
        audioByteLength: audio.byteLength,
        mimeType: mimeType || "audio/wav",
        audioOutputDeviceId,
      })
      const result = await tipcClient.requestTTSPlayback({
        playbackId: effectivePlaybackId,
        sourceWindowId: typeof window !== "undefined" ? window.location?.pathname || "renderer" : "renderer",
        source: source ?? deriveSourceFromLocation(),
        sessionId,
        ttsKeys,
        text,
        textPreview: text.slice(0, 120),
        audio,
        mimeType: mimeType || "audio/wav",
        autoPlay: shouldAutoPlay,
        audioOutputDeviceId,
      })

      if (result?.success === false) {
        logUI("[AudioPlayer][TTS] requestPlayback main rejected", {
          playbackId: effectivePlaybackId,
          sessionId,
          result,
        })
        throw new Error(result.error || "Failed to request TTS playback")
      }

      if (!shouldAutoPlay) {
        logUI("[AudioPlayer][TTS] sending manual play command after request", {
          playbackId: effectivePlaybackId,
          sessionId,
        })
        await tipcClient.controlTTSPlayback({ type: "play", playbackId: effectivePlaybackId, reason: "manual-replay" })
      }

      if (playbackAttemptIdRef.current === attemptId) {
        setIsAutoplayBlocked(false)
        setWasStopped(false)
      }
      logUI("[AudioPlayer][TTS] requestPlayback success", {
        playbackId: effectivePlaybackId,
        sessionId,
        requestSource,
      })
      return true
    } catch (playError) {
      if (playbackAttemptIdRef.current !== attemptId) return false

      if (requestSource !== "manual" && isAutoplayPolicyBlockedError(playError)) {
        console.warn("[AudioPlayer] Auto-play blocked until the next user gesture:", playError)
        setIsAutoplayBlocked(true)
      } else {
        console.error(requestSource === "manual" ? "[AudioPlayer] Playback failed:" : "[AudioPlayer] Auto-play failed:", playError)
      }
      logUI("[AudioPlayer][TTS] requestPlayback failed", {
        playbackId: effectivePlaybackId,
        sessionId,
        requestSource,
        error: playError instanceof Error ? playError.message : String(playError),
      })
      onPlaybackRequestError?.(playError)
      return false
    }
  }, [audioOutputDeviceId, effectivePlaybackId, onPlaybackRequestError, sessionId, source, text, ttsKeys])

  const playAudio = useCallback(async (requestSource: "auto" | "manual" | "autoplay-retry") => {
    logUI("[AudioPlayer][TTS] playAudio invoked", {
      playbackId: effectivePlaybackId,
      sessionId,
      requestSource,
      hasAudioData: !!audioData,
      hasGenerator: !!onGenerateAudio,
      isGenerating,
      error,
    })
    if (audioData) return requestPlayback(audioData, audioMimeType, requestSource)
    if (!onGenerateAudio || isGenerating || error) {
      logUI("[AudioPlayer][TTS] playAudio skipped", {
        playbackId: effectivePlaybackId,
        sessionId,
        reason: !onGenerateAudio ? "missing-generator" : isGenerating ? "already-generating" : "existing-error",
      })
      return false
    }

    try {
      const generated = normalizeGeneratedAudio(await onGenerateAudio(), audioMimeType)
      setHasAudio(true)
      logUI("[AudioPlayer][TTS] generated audio for playback", {
        playbackId: effectivePlaybackId,
        sessionId,
        audioByteLength: generated.audio.byteLength,
        mimeType: generated.mimeType,
      })
      return requestPlayback(generated.audio, generated.mimeType, requestSource)
    } catch (generationError) {
      logUI("[AudioPlayer][TTS] audio generation failed before playback request", {
        playbackId: effectivePlaybackId,
        sessionId,
        error: generationError instanceof Error ? generationError.message : String(generationError),
      })
      onPlaybackRequestError?.(generationError)
      return false
    }
  }, [audioData, audioMimeType, error, isGenerating, onGenerateAudio, onPlaybackRequestError, requestPlayback])

  useEffect(() => {
    if (autoPlay && hasAudio && !isPlaying && !hasAutoPlayed && !wasStopped) {
      const normalizedText = text.replace(/\s+/g, " ").trim().toLowerCase()
      const attemptKey = autoPlaySuppressionKey
        ? `${autoPlaySuppressionKey}::${normalizedText}`
        : normalizedText
      const now = Date.now()
      const lastAttemptAt = recentAutoPlayAttemptByKey.get(attemptKey) ?? 0
      if (now - lastAttemptAt < AUTO_PLAY_ATTEMPT_SUPPRESSION_MS) {
        logUI("[AudioPlayer][TTS] autoplay suppressed by recent attempt", {
          playbackId: effectivePlaybackId,
          sessionId,
          attemptKey,
          msSinceLastAttempt: now - lastAttemptAt,
        })
        return
      }
      recentAutoPlayAttemptByKey.set(attemptKey, now)

      for (const [key, attemptedAt] of recentAutoPlayAttemptByKey) {
        if (now - attemptedAt > AUTO_PLAY_ATTEMPT_SUPPRESSION_MS) {
          recentAutoPlayAttemptByKey.delete(key)
        }
      }

      if (autoPlayAttemptKeyRef.current === attemptKey) {
        logUI("[AudioPlayer][TTS] autoplay skipped because this instance already tried key", {
          playbackId: effectivePlaybackId,
          sessionId,
          attemptKey,
        })
        return
      }
      autoPlayAttemptKeyRef.current = attemptKey
      setHasAutoPlayed(true)
      logUI("[AudioPlayer][TTS] autoplay attempting", {
        playbackId: effectivePlaybackId,
        sessionId,
        attemptKey,
      })
      void playAudio("auto")
    }
  }, [autoPlay, hasAudio, isPlaying, hasAutoPlayed, wasStopped, playAudio, autoPlaySuppressionKey, text])

  useEffect(() => {
    if (!isAutoplayBlocked || !hasAudio) return undefined

    let retrying = false
    const retryPlayback = () => {
      if (retrying) return
      retrying = true
      window.removeEventListener("pointerdown", retryPlayback, { capture: true })
      window.removeEventListener("keydown", retryPlayback, { capture: true })
      setIsAutoplayBlocked(false)
      logUI("[AudioPlayer][TTS] retrying autoplay after user gesture", {
        playbackId: effectivePlaybackId,
        sessionId,
      })
      void playAudio("autoplay-retry")
    }

    window.addEventListener("pointerdown", retryPlayback, { once: true, capture: true })
    window.addEventListener("keydown", retryPlayback, { once: true, capture: true })

    return () => {
      window.removeEventListener("pointerdown", retryPlayback, { capture: true })
      window.removeEventListener("keydown", retryPlayback, { capture: true })
    }
  }, [hasAudio, isAutoplayBlocked, playAudio])

  const handlePlayPause = async () => {
    logUI("[AudioPlayer][TTS] handlePlayPause", {
      playbackId: effectivePlaybackId,
      sessionId,
      isPlaying,
      isActive,
      status: ttsPlaybackState.status,
      hasAudio,
    })
    if (isPlaying) {
      setWasStopped(true)
      await tipcClient.controlTTSPlayback({ type: "pause", playbackId: effectivePlaybackId, reason: "audio-player-pause" })
      return
    }

    if (isActive && ttsPlaybackState.status === "paused") {
      setWasStopped(false)
      await tipcClient.controlTTSPlayback({ type: "play", playbackId: effectivePlaybackId, reason: "audio-player-resume" })
      return
    }

    await playAudio("manual")
  }

  const handleSeek = (value: number[]) => {
    logUI("[AudioPlayer][TTS] seek", { playbackId: effectivePlaybackId, sessionId, currentTime: value[0] })
    void tipcClient.controlTTSPlayback({ type: "seek", playbackId: effectivePlaybackId, currentTime: value[0], reason: "audio-player-seek" })
  }

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    logUI("[AudioPlayer][TTS] set volume", { playbackId: effectivePlaybackId, sessionId, volume: newVolume })
    setLocalVolume(newVolume)
    setLocalMuted(newVolume === 0)
    void tipcClient.controlTTSPlayback({ type: "set-volume", playbackId: effectivePlaybackId, volume: newVolume, reason: "audio-player-volume" })
  }

  const toggleMute = () => {
    const nextMuted = !isMuted
    logUI("[AudioPlayer][TTS] set muted", { playbackId: effectivePlaybackId, sessionId, muted: nextMuted })
    setLocalMuted(nextMuted)
    void tipcClient.controlTTSPlayback({ type: "set-muted", playbackId: effectivePlaybackId, muted: nextMuted, reason: "audio-player-muted" })
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const playPauseLabel = isGenerating
    ? "Generating audio"
    : hasAudio
      ? isPlaying
        ? "Pause audio"
        : "Play audio"
      : "Generate audio"

  const compactStatusText = hasAudio
    ? duration > 0
      ? `${formatTime(currentTime)} / ${formatTime(duration)}`
      : isAutoplayBlocked
        ? "Autoplay blocked — press any key or click to listen"
        : "Loading audio…"
    : isGenerating
      ? "Generating audio…"
      : error
        ? "Audio unavailable"
        : "Generate audio"

  const compactStatusLabel = hasAudio
    ? duration > 0
      ? isPlaying
        ? "Playing audio"
        : "Audio ready"
      : isAutoplayBlocked
        ? "Autoplay blocked"
        : "Loading audio…"
    : isGenerating
      ? "Generating audio…"
      : error
        ? "Audio unavailable"
        : "Generate audio"

  const compactStatusDetail = hasAudio
    ? duration > 0
      ? compactStatusText
      : isAutoplayBlocked
        ? "Press any key or click once to start playback"
        : "Preparing centralized playback controls"
    : isGenerating
      ? "Creating spoken playback"
      : error
        ? "See details below"
        : "Tap play to listen"

  if (compact) {
    return (
      <div className={cn("inline-flex items-center", className)} title={compactStatusDetail} aria-label={compactStatusLabel}>
        <button
          type="button"
          onClick={handlePlayPause}
          disabled={isGenerating}
          className={cn(
            "shrink-0 rounded p-1 transition-colors hover:bg-muted",
            isPlaying && "text-primary",
          )}
          title={playPauseLabel}
          aria-label={playPauseLabel}
        >
          {isGenerating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : isPlaying ? (
            <Pause className="h-3.5 w-3.5" />
          ) : hasAudio ? (
            <Play className="h-3.5 w-3.5" />
          ) : (
            <Volume2 className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    )
  }

  return (
    <div className={cn("min-w-0 max-w-full space-y-2 rounded-lg bg-muted/50 p-3", className)}>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" onClick={handlePlayPause} disabled={isGenerating} className="h-10 w-10 shrink-0 p-0" title={playPauseLabel} aria-label={playPauseLabel}>
          {isGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </Button>

        <div className="min-w-0 flex-1 space-y-1">
          {hasAudio && duration > 0 ? (
            <>
              <Slider value={[currentTime]} max={duration} step={0.1} onValueChange={handleSeek} className="w-full" aria-label="Audio position" />
              <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
                <span className="shrink-0 font-mono tabular-nums">{formatTime(currentTime)}</span>
                <span className="shrink-0 font-mono tabular-nums">{formatTime(duration)}</span>
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground break-words" aria-live="polite">
              {isGenerating
                ? "Generating audio..."
                : error
                  ? "Audio unavailable. Check the error above and try again."
                  : isAutoplayBlocked
                    ? "Autoplay blocked. Click or press any key to start playback."
                    : "Click play to generate audio"}
            </div>
          )}
        </div>

        <div className="ml-auto flex min-w-0 max-w-full items-center gap-2">
          <Button variant="ghost" size="sm" onClick={toggleMute} className="h-8 w-8 shrink-0 p-0" title={isMuted ? "Unmute audio" : "Mute audio"} aria-label={isMuted ? "Unmute audio" : "Mute audio"}>
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          <Slider value={[isMuted ? 0 : volume]} max={1} step={0.1} onValueChange={handleVolumeChange} className="min-w-[5rem] max-w-[8rem] flex-1" aria-label="Audio volume" />
        </div>
      </div>
    </div>
  )
}