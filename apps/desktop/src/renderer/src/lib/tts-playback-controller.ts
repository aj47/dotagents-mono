import { useEffect, useRef } from "react"
import type { DesktopTTSPlaybackCommand, DesktopTTSPlaybackRequest, DesktopTTSPlaybackState } from "@shared/types"
import { rendererHandlers, tipcClient } from "@renderer/lib/tipc-client"
import { logUI } from "@renderer/lib/debug"

type MutablePlaybackState = DesktopTTSPlaybackState

function isAutoplayPolicyBlockedError(error: unknown): boolean {
  const name = error instanceof DOMException ? error.name.toLowerCase() : ""
  const message = error instanceof Error ? error.message.toLowerCase() : String(error ?? "").toLowerCase()
  return name === "notallowederror" || message.includes("autoplay") || message.includes("user gesture") || message.includes("not allowed")
}

function normalizeAudioData(audio: DesktopTTSPlaybackRequest["audio"]): BlobPart {
  if (audio instanceof ArrayBuffer) return audio
  if (ArrayBuffer.isView(audio)) {
    const view = audio as Uint8Array
    return view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength) as ArrayBuffer
  }
  if (Array.isArray(audio)) return new Uint8Array(audio).buffer
  const maybeBuffer = audio as unknown as { data?: number[] }
  if (Array.isArray(maybeBuffer?.data)) return new Uint8Array(maybeBuffer.data).buffer
  return audio as BlobPart
}

function canUseSinkId(audio: HTMLAudioElement): audio is HTMLAudioElement & { setSinkId: (sinkId: string) => Promise<void> } {
  return typeof (audio as HTMLAudioElement & { setSinkId?: unknown }).setSinkId === "function"
}

export function useTTSPlaybackController() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const objectUrlRef = useRef<string | null>(null)
  const requestRef = useRef<DesktopTTSPlaybackRequest | null>(null)
  const stateRef = useRef<MutablePlaybackState>({
    playbackId: null,
    status: "idle",
    currentTime: 0,
    duration: 0,
    volume: 1,
    muted: false,
    updatedAt: Date.now(),
  })

  useEffect(() => {
    const audio = new Audio()
    audio.preload = "auto"
    audio.volume = stateRef.current.volume
    audio.muted = stateRef.current.muted
    audioRef.current = audio
    logUI("[TTSPlaybackController] mounted main-renderer playback host")

    const publishState = (patch: Partial<DesktopTTSPlaybackState>) => {
      const nextState: DesktopTTSPlaybackState = {
        ...stateRef.current,
        ...patch,
        updatedAt: Date.now(),
      }
      stateRef.current = nextState
      if (patch.status || patch.error || patch.playbackId !== undefined) {
        logUI("[TTSPlaybackController] publishState", {
          playbackId: nextState.playbackId,
          status: nextState.status,
          sessionId: nextState.sessionId,
          source: nextState.source,
          currentTime: nextState.currentTime,
          duration: nextState.duration,
          error: nextState.error,
        })
      }
      void tipcClient.publishTTSPlaybackState(nextState).catch((error: unknown) => {
        console.warn("[TTSPlaybackController] Failed to publish playback state:", error)
      })
    }

    const resetAudioSource = () => {
      audio.pause()
      audio.removeAttribute("src")
      audio.load()
      if (objectUrlRef.current) {
        logUI("[TTSPlaybackController] revoking previous object URL", {
          playbackId: stateRef.current.playbackId,
        })
        URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = null
      }
    }

    const applyOutputDevice = async (audioOutputDeviceId?: string) => {
      if (!canUseSinkId(audio)) {
        logUI("[TTSPlaybackController] setSinkId unavailable", { audioOutputDeviceId })
        return
      }
      try {
        logUI("[TTSPlaybackController] applying output device", { audioOutputDeviceId })
        await audio.setSinkId(audioOutputDeviceId || "")
        logUI("[TTSPlaybackController] applied output device", { audioOutputDeviceId })
      } catch (error) {
        console.warn("[TTSPlaybackController] Failed to set audio output device:", error)
        publishState({ status: "error", error: "Failed to set audio output device" })
      }
    }

    const matchesActivePlayback = (playbackId?: string) => !playbackId || stateRef.current.playbackId === playbackId

    // Blob URLs can report duration asynchronously. Waiting for metadata before
    // starting playback avoids Chromium beginning a newly-loaded TTS stream with
    // an incomplete duration/buffer and then ending it early.
    const waitForMetadata = () => new Promise<void>((resolve, reject) => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        resolve()
        return
      }
      const onMetadata = () => {
        cleanup()
        resolve()
      }
      const onError = () => {
        cleanup()
        reject(new Error(audio.error?.message || "Audio metadata failed to load"))
      }
      const cleanup = () => {
        audio.removeEventListener("loadedmetadata", onMetadata)
        audio.removeEventListener("error", onError)
      }
      audio.addEventListener("loadedmetadata", onMetadata, { once: true })
      audio.addEventListener("error", onError, { once: true })
    })

    const handleRequest = async (request: DesktopTTSPlaybackRequest) => {
      logUI("[TTSPlaybackController] received playback request", {
        playbackId: request.playbackId,
        sessionId: request.sessionId,
        source: request.source,
        autoPlay: request.autoPlay,
        keyCount: request.ttsKeys?.length ?? 0,
        mimeType: request.mimeType,
        audioOutputDeviceId: request.audioOutputDeviceId,
      })
      resetAudioSource()
      requestRef.current = request

      audio.volume = stateRef.current.volume
      audio.muted = stateRef.current.muted
      await applyOutputDevice(request.audioOutputDeviceId)

      const blob = new Blob([normalizeAudioData(request.audio)], { type: request.mimeType || "audio/wav" })
      const objectUrl = URL.createObjectURL(blob)
      objectUrlRef.current = objectUrl
      audio.src = objectUrl
      audio.currentTime = 0
      audio.load()
      logUI("[TTSPlaybackController] audio source prepared", {
        playbackId: request.playbackId,
        blobSize: blob.size,
        mimeType: blob.type,
      })

      publishState({
        playbackId: request.playbackId,
        sourceWindowId: request.sourceWindowId,
        source: request.source,
        sessionId: request.sessionId,
        ttsKey: request.ttsKeys?.[0],
        textPreview: request.textPreview ?? request.text.slice(0, 120),
        status: "loading",
        currentTime: 0,
        duration: 0,
        audioOutputDeviceId: request.audioOutputDeviceId,
        error: undefined,
      })

      if (!request.autoPlay) {
        logUI("[TTSPlaybackController] request prepared without autoplay", {
          playbackId: request.playbackId,
        })
        publishState({ status: "paused" })
        return
      }

      try {
        await waitForMetadata()
        // The request may have been replaced while metadata was loading. Never
        // let an older response restart the shared audio element.
        if (requestRef.current !== request || !matchesActivePlayback(request.playbackId)) return

        logUI("[TTSPlaybackController] calling audio.play for request", {
          playbackId: request.playbackId,
          sessionId: request.sessionId,
        })
        await audio.play()
        logUI("[TTSPlaybackController] audio.play resolved", {
          playbackId: request.playbackId,
        })
      } catch (error) {
        const autoplayBlocked = isAutoplayPolicyBlockedError(error)
        logUI("[TTSPlaybackController] audio.play rejected", {
          playbackId: request.playbackId,
          autoplayBlocked,
          error: error instanceof Error ? error.message : String(error),
        })
        publishState({
          status: "error",
          error: autoplayBlocked
            ? "Autoplay blocked. Click or press any key to start playback."
            : error instanceof Error ? error.message : "Audio playback failed",
        })
      }
    }

    const handleCommand = async (command: DesktopTTSPlaybackCommand) => {
      logUI("[TTSPlaybackController] received playback command", {
        command,
        activePlaybackId: stateRef.current.playbackId,
        activeStatus: stateRef.current.status,
      })
      if (command.type !== "stop" && !matchesActivePlayback(command.playbackId)) {
        logUI("[TTSPlaybackController] ignored command for inactive playback", {
          command,
          activePlaybackId: stateRef.current.playbackId,
        })
        return
      }

      try {
        switch (command.type) {
          case "play":
            await audio.play()
            break
          case "pause":
            audio.pause()
            publishState({ status: "paused" })
            break
          case "stop":
            requestRef.current = null
            resetAudioSource()
            publishState({ playbackId: null, status: "idle", currentTime: 0, duration: 0, error: command.reason })
            break
          case "seek":
            audio.currentTime = command.currentTime
            publishState({ currentTime: command.currentTime })
            break
          case "set-volume":
            audio.volume = Math.max(0, Math.min(1, command.volume))
            publishState({ volume: audio.volume, muted: audio.volume === 0 ? true : stateRef.current.muted })
            break
          case "set-muted":
            audio.muted = command.muted
            publishState({ muted: command.muted })
            break
          case "set-output-device":
            await applyOutputDevice(command.audioOutputDeviceId)
            publishState({ audioOutputDeviceId: command.audioOutputDeviceId })
            break
        }
      } catch (error) {
        logUI("[TTSPlaybackController] command failed", {
          command,
          error: error instanceof Error ? error.message : String(error),
        })
        publishState({ status: "error", error: error instanceof Error ? error.message : "Audio playback failed" })
      }
    }

    const onLoadedMetadata = () => {
      logUI("[TTSPlaybackController] loadedmetadata", {
        playbackId: stateRef.current.playbackId,
        duration: audio.duration,
      })
      publishState({ duration: Number.isFinite(audio.duration) ? audio.duration : 0 })
    }
    const onTimeUpdate = () => publishState({ currentTime: audio.currentTime, duration: Number.isFinite(audio.duration) ? audio.duration : stateRef.current.duration })
    const onPlay = () => {
      logUI("[TTSPlaybackController] play event", { playbackId: stateRef.current.playbackId })
      publishState({ status: "playing", error: undefined })
    }
    const onPause = () => {
      if (
        !requestRef.current ||
        stateRef.current.status === "ended" ||
        stateRef.current.status === "idle" ||
        stateRef.current.status === "error"
      ) return
      logUI("[TTSPlaybackController] pause event", { playbackId: stateRef.current.playbackId })
      publishState({ status: "paused" })
    }
    const onEnded = () => {
      logUI("[TTSPlaybackController] ended event", { playbackId: stateRef.current.playbackId })
      publishState({ status: "ended", currentTime: Number.isFinite(audio.duration) ? audio.duration : stateRef.current.currentTime, duration: Number.isFinite(audio.duration) ? audio.duration : stateRef.current.duration })
    }
    const onError = () => {
      logUI("[TTSPlaybackController] error event", {
        playbackId: stateRef.current.playbackId,
        mediaErrorCode: audio.error?.code,
        mediaErrorMessage: audio.error?.message,
      })
      publishState({ status: "error", error: audio.error?.message || "Audio playback failed" })
    }

    audio.addEventListener("loadedmetadata", onLoadedMetadata)
    audio.addEventListener("timeupdate", onTimeUpdate)
    audio.addEventListener("play", onPlay)
    audio.addEventListener("pause", onPause)
    audio.addEventListener("ended", onEnded)
    audio.addEventListener("error", onError)
    const unlistenRequest = rendererHandlers.ttsPlaybackRequest.listen(handleRequest)
    const unlistenCommand = rendererHandlers.ttsPlaybackCommand.listen(handleCommand)

    return () => {
      logUI("[TTSPlaybackController] unmounting playback host", {
        playbackId: stateRef.current.playbackId,
        status: stateRef.current.status,
      })
      unlistenRequest()
      unlistenCommand()
      audio.removeEventListener("loadedmetadata", onLoadedMetadata)
      audio.removeEventListener("timeupdate", onTimeUpdate)
      audio.removeEventListener("play", onPlay)
      audio.removeEventListener("pause", onPause)
      audio.removeEventListener("ended", onEnded)
      audio.removeEventListener("error", onError)
      resetAudioSource()
      audioRef.current = null
    }
  }, [])
}
