import { tipcClient } from "@renderer/lib/tipc-client"

export interface DesktopSandboxSlot {
  name: string
  createdAt: string
  updatedAt: string
  isDefault: boolean
  sourceBundleName?: string
}

export interface DesktopSandboxState {
  activeSlot: string | null
  slots: DesktopSandboxSlot[]
}

export interface DesktopSandboxActionResult {
  success: boolean
  error?: string
  slot?: DesktopSandboxSlot
}

export const desktopSandboxClient = {
  getSandboxState(): Promise<DesktopSandboxState> {
    return tipcClient.getSandboxState() as Promise<DesktopSandboxState>
  },

  saveBaseline(): Promise<DesktopSandboxActionResult> {
    return tipcClient.saveBaseline() as Promise<DesktopSandboxActionResult>
  },

  switchToSlot(name: string): Promise<DesktopSandboxActionResult> {
    return tipcClient.switchToSlot({ name }) as Promise<DesktopSandboxActionResult>
  },

  restoreBaseline(): Promise<DesktopSandboxActionResult> {
    return tipcClient.restoreBaseline() as Promise<DesktopSandboxActionResult>
  },

  saveCurrentAsSlot(name: string): Promise<DesktopSandboxActionResult> {
    return tipcClient.saveCurrentAsSlot({ name }) as Promise<DesktopSandboxActionResult>
  },

  deleteSlot(name: string): Promise<DesktopSandboxActionResult> {
    return tipcClient.deleteSlot({ name }) as Promise<DesktopSandboxActionResult>
  },

  renameSlot(oldName: string, newName: string): Promise<DesktopSandboxActionResult> {
    return tipcClient.renameSlot({ oldName, newName }) as Promise<DesktopSandboxActionResult>
  },
}
