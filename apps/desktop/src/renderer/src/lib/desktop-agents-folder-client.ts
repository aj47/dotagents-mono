import { tipcClient } from "@renderer/lib/tipc-client"

export interface DesktopAgentsFolderLayer {
  agentsDir: string
  skillsDir: string
  knowledgeDir: string
  memoriesDir: string
  systemPromptExists: boolean
}

export interface DesktopAgentsFolders {
  global: DesktopAgentsFolderLayer
  workspace: DesktopAgentsFolderLayer | null
  workspaceSource: string | null
}

export interface DesktopAgentsFolderActionResult {
  success: boolean
  error?: string
}

export const desktopAgentsFolderClient = {
  getAgentsFolders(): Promise<DesktopAgentsFolders> {
    return tipcClient.getAgentsFolders() as Promise<DesktopAgentsFolders>
  },

  openGlobalAgentsFolder(): Promise<DesktopAgentsFolderActionResult> {
    return tipcClient.openAgentsFolder() as Promise<DesktopAgentsFolderActionResult>
  },

  openWorkspaceAgentsFolder(): Promise<DesktopAgentsFolderActionResult> {
    return tipcClient.openWorkspaceAgentsFolder() as Promise<DesktopAgentsFolderActionResult>
  },

  openSystemPromptFile(): Promise<DesktopAgentsFolderActionResult> {
    return tipcClient.openSystemPromptFile() as Promise<DesktopAgentsFolderActionResult>
  },

  openAgentsGuidelinesFile(): Promise<DesktopAgentsFolderActionResult> {
    return tipcClient.openAgentsGuidelinesFile() as Promise<DesktopAgentsFolderActionResult>
  },
}
