import beginRecord from "@renderer/assets/begin-record.wav"
import endRecord from "@renderer/assets/end-record.wav"

const beginAudio = new Audio(beginRecord)
const endAudio = new Audio(endRecord)

const audios = {
  begin_record: beginAudio,
  end_record: endAudio,
}

/**
 * Set the audio output device for sound effects (recording start/stop).
 * Call this when the user changes their speaker selection in settings.
 */
export const setSoundOutputDevice = (deviceId?: string) => {
  const sinkId = deviceId || ""
  for (const audio of Object.values(audios)) {
    if (typeof (audio as any).setSinkId === "function") {
      (audio as any).setSinkId(sinkId).catch((err: unknown) => {
        console.warn("[Sound] Failed to set output device:", err)
      })
    }
  }
}

export const playSound = (sound: "begin_record" | "end_record") => {
  return new Promise<void>((resolve) => {
    const audio = audios[sound]

    audio.addEventListener("ended", () => {
      resolve()
    })

    audio.play()
  })
}
