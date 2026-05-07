import type { PanelPosition } from "@dotagents/shared/api-types"
import type { AgentProfile } from "@dotagents/shared/agent-profile-domain"
import { tipcClient } from "@renderer/lib/tipc-client"

export interface DesktopSettingsGeneralActionResult {
  success?: boolean
  error?: string
}

export const desktopSettingsGeneralClient = {
  isLangfuseInstalled(): Promise<boolean> {
    return tipcClient.isLangfuseInstalled() as Promise<boolean>
  },

  getExternalAgents(): Promise<AgentProfile[]> {
    return tipcClient.getExternalAgents() as Promise<AgentProfile[]>
  },

  async showFloatingPanel(): Promise<void> {
    await tipcClient.resizePanelToNormal({})
    await tipcClient.showPanelWindow({})
  },

  resetFloatingPanel(): Promise<DesktopSettingsGeneralActionResult | undefined> {
    return tipcClient.resetFloatingPanel({}) as Promise<DesktopSettingsGeneralActionResult | undefined>
  },

  stopAllTts(): Promise<void> {
    return tipcClient.stopAllTts() as Promise<void>
  },

  setPanelPosition(position: PanelPosition): Promise<void> {
    return tipcClient.setPanelPosition({ position }) as Promise<void>
  },
}
