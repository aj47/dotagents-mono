import type {
  SkillCreateRequest,
  SkillDeleteMultipleResult,
  SkillUpdateRequest,
} from "@dotagents/shared/api-types"
import type { AgentSkill } from "@dotagents/shared/types"
import type { AgentProfile } from "@dotagents/shared/agent-profile-domain"
import { tipcClient } from "@renderer/lib/tipc-client"

export type DesktopSkillUpdateRequest = SkillUpdateRequest & { id: string }

export interface DesktopSkillFolderImportResult {
  imported: AgentSkill[]
  skipped: string[]
  errors: Array<{ folder: string; error: string }>
}

export interface DesktopSkillGitHubImportResult {
  imported: AgentSkill[]
  errors: string[]
}

export interface DesktopSkillFileActionResult {
  success: boolean
  error?: string
  path?: string
}

export const desktopSkillsClient = {
  getSkills(): Promise<AgentSkill[]> {
    return tipcClient.getSkills() as Promise<AgentSkill[]>
  },

  scanSkillsFolder(): Promise<AgentSkill[]> {
    return tipcClient.scanSkillsFolder() as Promise<AgentSkill[]>
  },

  createSkill(request: Required<SkillCreateRequest>): Promise<AgentSkill> {
    return tipcClient.createSkill(request) as Promise<AgentSkill>
  },

  updateSkill(request: DesktopSkillUpdateRequest): Promise<AgentSkill | undefined> {
    return tipcClient.updateSkill(request) as Promise<AgentSkill | undefined>
  },

  deleteSkill(id: string): Promise<boolean> {
    return tipcClient.deleteSkill({ id }) as Promise<boolean>
  },

  deleteSkills(ids: string[]): Promise<SkillDeleteMultipleResult[]> {
    return tipcClient.deleteSkills({ ids }) as Promise<SkillDeleteMultipleResult[]>
  },

  toggleProfileSkill(profileId: string, skillId: string): Promise<AgentProfile | undefined> {
    return tipcClient.toggleProfileSkill({ profileId, skillId }) as Promise<AgentProfile | undefined>
  },

  importSkillFile(): Promise<AgentSkill | null> {
    return tipcClient.importSkillFile() as Promise<AgentSkill | null>
  },

  importSkillFolder(): Promise<AgentSkill | null> {
    return tipcClient.importSkillFolder() as Promise<AgentSkill | null>
  },

  importSkillsFromParentFolder(): Promise<DesktopSkillFolderImportResult | null> {
    return tipcClient.importSkillsFromParentFolder() as Promise<DesktopSkillFolderImportResult | null>
  },

  exportSkillFile(id: string): Promise<boolean> {
    return tipcClient.saveSkillFile({ id }) as Promise<boolean>
  },

  openSkillFile(skillId: string): Promise<DesktopSkillFileActionResult> {
    return tipcClient.openSkillFile({ skillId }) as Promise<DesktopSkillFileActionResult>
  },

  openSkillsFolder(): Promise<DesktopSkillFileActionResult> {
    return tipcClient.openSkillsFolder() as Promise<DesktopSkillFileActionResult>
  },

  openWorkspaceSkillsFolder(): Promise<DesktopSkillFileActionResult> {
    return tipcClient.openWorkspaceSkillsFolder() as Promise<DesktopSkillFileActionResult>
  },

  importSkillFromGitHub(repoIdentifier: string): Promise<DesktopSkillGitHubImportResult> {
    return tipcClient.importSkillFromGitHub({ repoIdentifier }) as Promise<DesktopSkillGitHubImportResult>
  },
}
