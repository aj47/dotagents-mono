import React, { useState, useRef, useEffect } from "react"
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
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioUrlRef = useRef<string | null>(null)

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

  useEffect(() => {
    if (autoPlay && hasAudio && audioRef.current && !isPlaying && !hasAutoPlayed && !wasStopped) {
      setHasAutoPlayed(true)

      ttsManager.playExclusive(audioRef.current, {
        source: "audio-player:auto",
        autoPlay: true,
        textPreview: text.slice(0, 80),
      }).catch((error) => {
        console.error("[AudioPlayer] Auto-play failed:", error)
      })
    }
  }, [autoPlay, hasAudio, isPlaying, hasAutoPlayed, wasStopped, text])

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
          await ttsManager.playExclusive(audioRef.current, {
            source: "audio-player:manual",
            autoPlay: false,
            textPreview: text.slice(0, 80),
          })
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
      : "Loading audio…"
    : isGenerating
      ? "Generating audio…"
      : error
        ? "Audio unavailable"
        : "Generate audio"

  const compactStatusDetail = hasAudio
    ? duration > 0
      ? compactStatusText
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
              {isGenerating ? "Generating audio..." : error ? "Audio unavailable. Check the error above and try again." : "Click play to generate audio"}
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
