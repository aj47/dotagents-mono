import React, { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@renderer/components/ui/button"
import { Slider } from "@renderer/components/ui/slider"
import { Play, Pause, Volume2, VolumeX, Loader2 } from "lucide-react"
import { cn } from "@renderer/lib/utils"
import { ttsManager } from "@renderer/lib/tts-manager"

interface AudioPlayerProps {
  audioData?: ArrayBuffer
  audioMimeType?: string
  text: string
  onGenerateAudio?: () => Promise<ArrayBuffer>
  className?: string
  compact?: boolean
  isGenerating?: boolean
  error?: string | null
  autoPlay?: boolean
  /** Called when play/pause state changes so parent can reflect it (e.g. header icon) */
  onPlayStateChange?: (playing: boolean) => void
  /** Audio output device ID (from navigator.mediaDevices.enumerateDevices) */
  audioOutputDeviceId?: string
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
  onPlayStateChange,
  audioOutputDeviceId,
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [hasAudio, setHasAudio] = useState(!!audioData)
  const [hasAutoPlayed, setHasAutoPlayed] = useState(false)
  const [wasStopped, setWasStopped] = useState(false)
  const [isAutoplayBlocked, setIsAutoplayBlocked] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioUrlRef = useRef<string | null>(null)
  const playbackAttemptIdRef = useRef(0)

  useEffect(() => {
    if (audioData) {
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current)
      }

      const blob = new Blob([audioData], { type: audioMimeType || "audio/wav" })
      audioUrlRef.current = URL.createObjectURL(blob)
      setHasAudio(true)
      setHasAutoPlayed(false)
      setWasStopped(false)
      setIsAutoplayBlocked(false)

      if (audioRef.current) {
        audioRef.current.src = audioUrlRef.current
        setIsPlaying(false)
        setCurrentTime(0)
      }
    }

    return () => {
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current)
      }
    }
  }, [audioData, audioMimeType])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !hasAudio) return undefined

    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
      onPlayStateChange?.(false)
    }

    const handlePlay = () => {
      setIsPlaying(true)
      onPlayStateChange?.(true)
    }

    const handlePause = () => {
      setIsPlaying(false)
      onPlayStateChange?.(false)
    }

    const handleError = (event: Event) => {
      console.error("[AudioPlayer] Audio error:", event)
      setIsPlaying(false)
    }

    audio.addEventListener("loadedmetadata", handleLoadedMetadata)
    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("ended", handleEnded)
    audio.addEventListener("play", handlePlay)
    audio.addEventListener("pause", handlePause)
    audio.addEventListener("error", handleError)

    if (audio.src && !audio.paused) {
      setIsPlaying(true)
    } else {
      setIsPlaying(false)
    }

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("ended", handleEnded)
      audio.removeEventListener("play", handlePlay)
      audio.removeEventListener("pause", handlePause)
      audio.removeEventListener("error", handleError)
    }
  }, [hasAudio, audioData])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return undefined

    const unregisterAudio = ttsManager.registerAudio(audio)

    const unregisterCallback = ttsManager.registerStopCallback(() => {
      if (audio) {
        audio.pause()
        audio.currentTime = 0
        setIsPlaying(false)
        setWasStopped(true)
        onPlayStateChange?.(false)
      }
    }, audio)

    return () => {
      unregisterAudio()
      unregisterCallback()
    }
  }, [onPlayStateChange])

  // Apply selected audio output device via setSinkId
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    // setSinkId is available in Chromium/Electron
    if (typeof (audio as any).setSinkId === "function") {
      (audio as any).setSinkId(audioOutputDeviceId || "").catch((err: unknown) => {
        console.warn("[AudioPlayer] Failed to set audio output device:", err)
      })
    }
  }, [audioOutputDeviceId])

  const playAudio = useCallback(async (source: "auto" | "manual" | "autoplay-retry") => {
    if (!audioRef.current || !hasAudio) return false

    const attemptId = ++playbackAttemptIdRef.current

    try {
      await ttsManager.playExclusive(audioRef.current, {
        source: `audio-player:${source}`,
        autoPlay: source !== "manual",
        textPreview: text.slice(0, 80),
      })

      if (playbackAttemptIdRef.current === attemptId) {
        setIsAutoplayBlocked(false)
      }
      return true
    } catch (playError) {
      if (playbackAttemptIdRef.current !== attemptId) {
        return false
      }

      if (source !== "manual" && isAutoplayPolicyBlockedError(playError)) {
        console.warn("[AudioPlayer] Auto-play blocked until the next user gesture:", playError)
        setIsAutoplayBlocked(true)
        setIsPlaying(false)
        return false
      }

      console.error(
        source === "manual" ? "[AudioPlayer] Playback failed:" : "[AudioPlayer] Auto-play failed:",
        playError,
      )
      setIsPlaying(false)
      return false
    }
  }, [hasAudio, text])

  useEffect(() => {
    if (autoPlay && hasAudio && audioRef.current && !isPlaying && !hasAutoPlayed && !wasStopped) {
      setHasAutoPlayed(true)
      void playAudio("auto")
    }
  }, [autoPlay, hasAudio, isPlaying, hasAutoPlayed, wasStopped, playAudio])

  useEffect(() => {
    if (!isAutoplayBlocked || !hasAudio) return undefined

    let retrying = false
    const retryPlayback = () => {
      if (retrying) return
      retrying = true
      window.removeEventListener("pointerdown", retryPlayback, { capture: true })
      window.removeEventListener("keydown", retryPlayback, { capture: true })
      setIsAutoplayBlocked(false)
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
    if (!hasAudio && onGenerateAudio && !isGenerating && !error) {
      try {
        await onGenerateAudio()
        return
      } catch (error) {
        return
      }
    }

    if (audioRef.current && hasAudio) {
      try {
        if (isPlaying) {
          audioRef.current.pause()
        } else {
          setWasStopped(false)
          await playAudio("manual")
        }
      } catch (playError) {
        console.error("[AudioPlayer] Playback failed:", playError)
        setIsPlaying(false)
      }
    }
  }

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0]
      setCurrentTime(value[0])
    }
  }

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume
        setIsMuted(false)
      } else {
        audioRef.current.volume = 0
        setIsMuted(true)
      }
    }
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
        : "Preparing playback controls"
    : isGenerating
      ? "Creating spoken playback"
      : error
        ? "See details below"
        : "Tap play to listen"

  if (compact) {
    return (
      <div
        className={cn(
          "inline-flex items-center",
          className
        )}
      >
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
        <audio ref={audioRef} />
      </div>
    )
  }

  return (
    <div className={cn("min-w-0 max-w-full space-y-2 rounded-lg bg-muted/50 p-3", className)}>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePlayPause}
          disabled={isGenerating}
          className="h-10 w-10 shrink-0 p-0"
          title={playPauseLabel}
          aria-label={playPauseLabel}
        >
          {isGenerating ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5" />
          )}
        </Button>

        <div className="min-w-0 flex-1 space-y-1">
          {hasAudio && duration > 0 ? (
            <>
              <Slider
                value={[currentTime]}
                max={duration}
                step={0.1}
                onValueChange={handleSeek}
                className="w-full"
                aria-label="Audio position"
              />
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
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMute}
            className="h-8 w-8 shrink-0 p-0"
            title={isMuted ? "Unmute audio" : "Mute audio"}
            aria-label={isMuted ? "Unmute audio" : "Mute audio"}
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          <Slider
            value={[isMuted ? 0 : volume]}
            max={1}
            step={0.1}
            onValueChange={handleVolumeChange}
            className="min-w-[5rem] max-w-[8rem] flex-1"
            aria-label="Audio volume"
          />
        </div>
      </div>

      <audio ref={audioRef} />
    </div>
  )
}
