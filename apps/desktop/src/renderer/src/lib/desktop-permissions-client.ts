import { tipcClient } from "@renderer/lib/tipc-client"

export type DesktopMicrophoneStatus =
  | "not-determined"
  | "granted"
  | "denied"
  | "restricted"
  | "unknown"

export const desktopPermissionsClient = {
  getMicrophoneStatus(): Promise<DesktopMicrophoneStatus> {
    return tipcClient.getMicrophoneStatus() as Promise<DesktopMicrophoneStatus>
  },

  isAccessibilityGranted(): Promise<boolean> {
    return tipcClient.isAccessibilityGranted() as Promise<boolean>
  },

  requestAccessibilityAccess(): Promise<boolean> {
    return tipcClient.requestAccesssbilityAccess() as Promise<boolean>
  },

  requestMicrophoneAccess(): Promise<boolean> {
    return tipcClient.requestMicrophoneAccess() as Promise<boolean>
  },

  openMicrophoneSettings(): Promise<void> {
    return tipcClient.openMicrophoneInSystemPreferences()
  },

  restartApp(): Promise<void> {
    return tipcClient.restartApp()
  },
}
