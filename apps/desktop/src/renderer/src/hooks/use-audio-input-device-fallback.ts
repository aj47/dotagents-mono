import { useEffect, useRef } from "react"
import { useConfigQuery, useSaveConfigMutation } from "@renderer/lib/queries"
import { enumerateAudioDevices, type AudioDeviceInfo } from "./use-audio-devices"
import {
  getValidatedAudioInputDeviceId,
  hasResolvedAudioInputDeviceLabel,
} from "./audio-input-device-utils"

/**
 * The enumeration is only authoritative once the browser has resolved
 * device labels. Without a real label the list is typically incomplete
 * (permission has not settled or a fresh `enumerateDevices` hasn't been
 * populated yet), so we must not treat a missing match as "device gone"
 * and overwrite the persisted selection. See issue #303.
 */
function hasResolvedLabels(devices: AudioDeviceInfo[]): boolean {
  return devices.some((device) => hasResolvedAudioInputDeviceLabel(device.label))
}

export function useAudioInputDeviceFallback() {
  const configQuery = useConfigQuery()
  const saveConfigMutation = useSaveConfigMutation()
  const lastRepairedDeviceIdRef = useRef<string | null>(null)

  useEffect(() => {
    const config = configQuery.data
    const savedDeviceId = config?.audioInputDeviceId
    const savedDeviceLabel = config?.audioInputDeviceLabel

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

        const validatedDeviceId = getValidatedAudioInputDeviceId(savedDeviceId, inputDevices, savedDeviceLabel)
        if (validatedDeviceId) {
          if (validatedDeviceId !== savedDeviceId) {
            const matchedDevice = inputDevices.find((device) => device.deviceId === validatedDeviceId)
            lastRepairedDeviceIdRef.current = savedDeviceId
            saveConfigMutation.mutate({
              config: {
                ...config,
                audioInputDeviceId: validatedDeviceId,
                audioInputDeviceLabel: matchedDevice?.label,
              },
            })
            return
          }

          lastRepairedDeviceIdRef.current = null
          return
        }

        // Only clear the persisted selection when the enumerated list has
        // fully resolved labels. Otherwise the device list is likely stale
        // or pre-permission, and clearing here would silently wipe a valid
        // saved microphone on every app start (issue #303).
        if (!hasResolvedLabels(inputDevices)) {
          return
        }

        // Legacy configs may only have device IDs. Those IDs can rotate between
        // restarts on some systems, so avoid clearing to default when we have no
        // stable label to confidently remap against.
        if (!hasResolvedAudioInputDeviceLabel(savedDeviceLabel)) {
          return
        }

        lastRepairedDeviceIdRef.current = savedDeviceId
        saveConfigMutation.mutate({
          config: {
            ...config,
            audioInputDeviceId: undefined,
            audioInputDeviceLabel: undefined,
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
