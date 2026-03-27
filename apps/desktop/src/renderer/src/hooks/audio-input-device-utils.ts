import type { AudioDeviceInfo } from "./use-audio-devices"

export function getValidatedAudioInputDeviceId(savedDeviceId: string | undefined, inputDevices: AudioDeviceInfo[]) {
  if (!savedDeviceId || inputDevices.length === 0) {
    return savedDeviceId
  }

  return inputDevices.some((device) => device.deviceId === savedDeviceId) ? savedDeviceId : undefined
}