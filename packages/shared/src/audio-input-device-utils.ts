export type AudioInputDeviceLike = {
  deviceId: string
  label?: string
}

export function hasResolvedAudioInputDeviceLabel(label: string | undefined): boolean {
  const trimmedLabel = label?.trim() ?? ""
  if (!trimmedLabel) return false
  return !(trimmedLabel.startsWith("Microphone (") && trimmedLabel.endsWith(")"))
}

function normalizeAudioInputDeviceLabel(label: string | undefined): string | undefined {
  const trimmedLabel = label?.trim()
  if (!trimmedLabel || !hasResolvedAudioInputDeviceLabel(trimmedLabel)) return undefined
  return trimmedLabel.toLowerCase()
}

export function getValidatedAudioInputDeviceId(
  savedDeviceId: string | undefined,
  inputDevices: AudioInputDeviceLike[],
  savedDeviceLabel?: string,
): string | undefined {
  if (!savedDeviceId || inputDevices.length === 0) {
    return savedDeviceId
  }

  if (inputDevices.some((device) => device.deviceId === savedDeviceId)) {
    return savedDeviceId
  }

  const normalizedSavedLabel = normalizeAudioInputDeviceLabel(savedDeviceLabel)
  if (!normalizedSavedLabel) return undefined

  const matchingDevices = inputDevices.filter(
    (device) => normalizeAudioInputDeviceLabel(device.label) === normalizedSavedLabel,
  )
  if (matchingDevices.length !== 1) return undefined

  return matchingDevices[0].deviceId
}
