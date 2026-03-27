import { useEffect, useRef } from "react"
import { useConfigQuery, useSaveConfigMutation } from "@renderer/lib/queries"
import { enumerateAudioDevices } from "./use-audio-devices"
import { getValidatedAudioInputDeviceId } from "./audio-input-device-utils"

export function useAudioInputDeviceFallback() {
  const configQuery = useConfigQuery()
  const saveConfigMutation = useSaveConfigMutation()
  const lastRepairedDeviceIdRef = useRef<string | null>(null)

  useEffect(() => {
    const config = configQuery.data
    const savedDeviceId = config?.audioInputDeviceId

    if (!config || !savedDeviceId) {
      lastRepairedDeviceIdRef.current = null
      return undefined
    }

    if (lastRepairedDeviceIdRef.current === savedDeviceId) {
      return undefined
    }

    let cancelled = false

    const validateSavedDevice = async () => {
      if (!navigator.mediaDevices?.enumerateDevices) return

      try {
        const { inputDevices } = await enumerateAudioDevices({ requestLabels: false })
        if (cancelled || inputDevices.length === 0) return

        const validatedDeviceId = getValidatedAudioInputDeviceId(savedDeviceId, inputDevices)
        if (validatedDeviceId) {
          lastRepairedDeviceIdRef.current = null
          return
        }

        lastRepairedDeviceIdRef.current = savedDeviceId
        saveConfigMutation.mutate({
          config: {
            ...config,
            audioInputDeviceId: undefined,
          },
        })
      } catch {
        // Best-effort validation only. Recorder fallback still protects recording startup.
      }
    }

    void validateSavedDevice()

    return () => {
      cancelled = true
    }
  }, [configQuery.data, saveConfigMutation])
}