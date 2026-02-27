import { logUI } from "@renderer/lib/debug"

type StopCallbackRegistration = {
  callback: () => void
  audio?: HTMLAudioElement
}

class TTSManager {
  private audioElements: Set<HTMLAudioElement> = new Set()
  private stopCallbacks: Set<StopCallbackRegistration> = new Set()

  registerAudio(audio: HTMLAudioElement): () => void {
    this.audioElements.add(audio)
    logUI("[TTS Manager] Registered audio element", {
      trackedAudioCount: this.audioElements.size,
    })

    return () => {
      this.audioElements.delete(audio)
      logUI("[TTS Manager] Unregistered audio element", {
        trackedAudioCount: this.audioElements.size,
      })
    }
  }

  registerStopCallback(callback: () => void, audio?: HTMLAudioElement): () => void {
    const registration: StopCallbackRegistration = { callback, audio }
    this.stopCallbacks.add(registration)

    return () => {
      this.stopCallbacks.delete(registration)
    }
  }

  private stopAudio(audio: HTMLAudioElement, reason: string): void {
    try {
      audio.pause()
      audio.currentTime = 0
    } catch (error) {
      console.error("[TTS Manager] Error stopping audio:", error)
    }

    this.stopCallbacks.forEach((registration) => {
      // Scoped callbacks run only for their associated audio element.
      // Unscoped callbacks are handled once in stopAll.
      if (!registration.audio || registration.audio !== audio) return

      try {
        registration.callback()
      } catch (error) {
        console.error("[TTS Manager] Error calling stop callback:", error)
      }
    })

    logUI("[TTS Manager] Stopped audio element", {
      reason,
      trackedAudioCount: this.audioElements.size,
    })
  }

  stopAllExcept(audioToKeep: HTMLAudioElement, reason: string = "exclusive-playback"): void {
    let stoppedCount = 0

    this.audioElements.forEach((audio) => {
      if (audio === audioToKeep) return
      this.stopAudio(audio, reason)
      stoppedCount += 1
    })

    if (stoppedCount > 0) {
      logUI("[TTS Manager] Stopped competing audio", {
        reason,
        stoppedCount,
      })
    }
  }

  async playExclusive(
    audio: HTMLAudioElement,
    context: { source: string; autoPlay: boolean; textPreview?: string },
  ): Promise<void> {
    this.stopAllExcept(audio, `play-request:${context.source}`)

    logUI("[TTS Manager] Starting exclusive playback", {
      source: context.source,
      autoPlay: context.autoPlay,
      textPreview: context.textPreview,
      trackedAudioCount: this.audioElements.size,
    })

    await audio.play()
  }

  stopAll(reason: string = "manual-stop"): void {
    logUI("[TTS Manager] Stopping all TTS audio", {
      reason,
      trackedAudioCount: this.audioElements.size,
      callbackCount: this.stopCallbacks.size,
    })

    this.audioElements.forEach((audio) => {
      this.stopAudio(audio, reason)
    })

    // Run unscoped callbacks once for global-stop events.
    this.stopCallbacks.forEach((registration) => {
      if (registration.audio) return

      try {
        registration.callback()
      } catch (error) {
        console.error("[TTS Manager] Error calling unscoped stop callback:", error)
      }
    })
  }

  getAudioCount(): number {
    return this.audioElements.size
  }
}

export const ttsManager = new TTSManager()

