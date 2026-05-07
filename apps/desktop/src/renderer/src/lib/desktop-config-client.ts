import type { Config } from "@shared/types"
import { tipcClient } from "@renderer/lib/tipc-client"

export const desktopConfigClient = {
  getConfig(): Promise<Config> {
    return tipcClient.getConfig() as Promise<Config>
  },

  saveConfig(config: Partial<Config>): Promise<void> {
    return tipcClient.saveConfig({ config }) as Promise<void>
  },
}
