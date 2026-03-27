import { useState, useEffect, useCallback } from "react"

export interface AudioDeviceInfo {
  deviceId: string
  label: string
  kind: "audioinput" | "audiooutput"
}

export interface EnumeratedAudioDevices {
  inputDevices: AudioDeviceInfo[]
  outputDevices: AudioDeviceInfo[]
}

export async function enumerateAudioDevices({
  requestLabels = true,
}: {
  requestLabels?: boolean
} = {}): Promise<EnumeratedAudioDevices> {
  if (requestLabels) {
    // First, try to get permission for device labels (non-blocking)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((t) => t.stop())
    } catch {
      // Permission denied or no mic — we'll still enumerate, labels may be missing
    }
  }

  const devices = await navigator.mediaDevices.enumerateDevices()

  const inputDevices: AudioDeviceInfo[] = devices
    .filter((d) => d.kind === "audioinput" && d.deviceId)
    .map((d) => ({
      deviceId: d.deviceId,
      label: d.label || `Microphone (${d.deviceId.slice(0, 8)})`,
      kind: "audioinput" as const,
    }))

  const outputDevices: AudioDeviceInfo[] = devices
    .filter((d) => d.kind === "audiooutput" && d.deviceId)
    .map((d) => ({
      deviceId: d.deviceId,
      label: d.label || `Speaker (${d.deviceId.slice(0, 8)})`,
      kind: "audiooutput" as const,
    }))

  return { inputDevices, outputDevices }
}

/**
 * Hook to enumerate available audio input (microphone) and output (speaker) devices.
 * Re-enumerates when devices change (e.g. plugging in a USB mic).
 */
export function useAudioDevices(enabled: boolean = true) {
  const [inputDevices, setInputDevices] = useState<AudioDeviceInfo[]>([])
  const [outputDevices, setOutputDevices] = useState<AudioDeviceInfo[]>([])
  const [error, setError] = useState<string | null>(null)

  const enumerate = useCallback(async () => {
    try {
      const devices = await enumerateAudioDevices({ requestLabels: true })
      setInputDevices(devices.inputDevices)
      setOutputDevices(devices.outputDevices)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to enumerate audio devices")
    }
  }, [])

  useEffect(() => {
    if (!enabled) return undefined
    enumerate()

    // Re-enumerate when devices change (e.g. USB device plugged/unplugged)
    navigator.mediaDevices.addEventListener("devicechange", enumerate)
    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", enumerate)
    }
  }, [enumerate, enabled])

  return { inputDevices, outputDevices, error, refresh: enumerate }
}

