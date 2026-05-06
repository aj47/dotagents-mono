import { app } from "electron"
import path from "path"
import fs from "fs"
import type {
  AgentProfile,
  AgentProfileRole,
  AgentProfilesData,
  Profile,
  ProfilesData,
  ProfileMcpServerConfig,
  ProfileModelConfig,
  ProfileSkillsConfig,
} from "@dotagents/core"
import {
  ConversationMessage,
  PersonasData,
  MCPServerConfig,
  ACPAgentConfig,
  profileToAgentProfile,
  personaToAgentProfile,
  acpAgentConfigToAgentProfile,
} from "@shared/types"
import {
  createSessionSnapshotFromProfile,
  refreshSessionSnapshotSkillsFromProfile,
  toolConfigToMcpServerConfig,
} from "@dotagents/shared/agent-profile-session-snapshot"
import {
  buildAgentProfileUpdatePatch,
  canSetCurrentAgentProfile,
  createAgentProfileRecord,
  getDeletableAgentProfileIndex,
} from "@dotagents/shared/agent-profile-mutations"
import {
  addAgentProfileConversationMessage,
  clearAgentProfileConversationId,
  getAgentProfileConversation,
  removeAgentProfileConversation,
  setAgentProfileConversation,
} from "@dotagents/shared/agent-profile-conversations"
import {
  agentProfileToLegacyProfile,
  buildInternalDelegationAgentProfileCreateInput,
  createDefaultAgentProfiles,
} from "@dotagents/shared/agent-profile-factories"
import {
  buildAgentProfilesDataFromLayers,
  migrateAgentProfilesFromLegacySources,
} from "@dotagents/shared/agent-profile-storage"
import {
  isValidAgentProfileMcpServerConfig,
  isValidAgentProfileModelConfig,
  isValidAgentProfileSkillsConfig,
} from "@dotagents/shared/agent-profile-config-validation"
import {
  getAgentProfileSkillsConfigAfterEnable,
  hasAllAgentProfileSkillsEnabledByDefault,
  isAgentProfileSkillEnabled,
  mergeAgentProfileMcpConfig,
  mergeAgentProfileModelConfig,
  mergeAgentProfileSkillsConfig,
  toggleAgentProfileSkillConfig,
  getEnabledAgentProfileSkillIds,
} from "@dotagents/shared/agent-profile-config-updates"
import {
  getAgentProfileByName,
  getAgentProfilesByRole,
  getChatAgentProfiles,
  getCurrentAgentProfile,
  getDelegationAgentProfiles,
  getEnabledDelegationAgentProfiles,
  getExternalAgentProfiles,
} from "@dotagents/shared/agent-profile-queries"
import {
  mergeImportedAgentProfileMcpServers,
  parseAgentProfileImportJson,
  serializeAgentProfileExport,
} from "@dotagents/shared/agent-profile-import-export"
import {
  migrateAgentProfilesForAcpxRuntime,
  migrateLegacyAcpRuntimeConfig,
} from "@dotagents/shared/agent-profile-acpx-migration"
import { randomUUID } from "crypto"
import { logApp } from "./debug"
import { configStore, globalAgentsFolder, resolveWorkspaceAgentsFolder } from "./config"
import { getRuntimeToolNames } from "./runtime-tool-definitions"
import { getAgentsLayerPaths } from "./agents-files/modular-config"
import {
  loadAgentProfilesLayer,
  writeAgentsProfileFiles,
  writeAllAgentsProfileFiles,
  deleteAgentProfileFiles,
} from "./agents-files/agent-profiles"

/**
 * Path to the agent profiles storage file.
 */
export const agentProfilesPath = path.join(
  app.getPath("userData"),
  "agent-profiles.json"
)

/**
 * Path to the agent profile conversations storage file.
 */
export const agentProfileConversationsPath = path.join(
  app.getPath("userData"),
  "agent-profile-conversations.json"
)

// Legacy paths for migration
const legacyProfilesPath = path.join(app.getPath("userData"), "profiles.json")
const legacyPersonasPath = path.join(app.getPath("userData"), "personas.json")

export {
  createSessionSnapshotFromProfile,
  refreshSessionSnapshotSkillsFromProfile,
  toolConfigToMcpServerConfig,
} from "@dotagents/shared/agent-profile-session-snapshot"

/**
 * Type for agent profile conversations storage.
 */
interface AgentProfileConversationsData {
  [profileId: string]: ConversationMessage[]
}

/**
 * Service for managing agent profiles.
 * Handles CRUD operations, migration, and queries.
 */
class AgentProfileService {
  private profilesData: AgentProfilesData | undefined
  private conversationsData: AgentProfileConversationsData = {}

  constructor() {
    this.loadProfiles()
    this.loadConversations()
    this.migrateAcpxRuntimeConfig()
  }

  private migrateAcpxRuntimeConfig(): void {
    if (!this.profilesData) return

    const config = configStore.get()
    const legacyAgents = Array.isArray(config.acpAgents) ? config.acpAgents as ACPAgentConfig[] : []
    const profileMigration = migrateAgentProfilesForAcpxRuntime(this.profilesData.profiles, legacyAgents)

    for (const agentName of profileMigration.skippedRemoteAgentNames) {
      logApp(`[AgentProfileService] Skipping unsupported legacy remote ACP agent during acpx migration: ${agentName}`)
    }

    if (profileMigration.changed) {
      this.profilesData.profiles = [
        ...profileMigration.profiles,
        ...profileMigration.legacyAgentsToAdd.map(acpAgentConfigToAgentProfile),
      ]
      this.saveProfiles()
    }

    const configMigration = migrateLegacyAcpRuntimeConfig(config)
    if (configMigration.changed) {
      configStore.save(configMigration.config)
    }
  }

  /**
   * Load profiles from storage, migrating from legacy formats if needed.
   *
   * Priority:
   * 1. `.agents/agents/` modular files (global + workspace overlay)
   * 2. `agent-profiles.json` (legacy monolithic file — triggers migration to modular)
   * 3. Legacy `profiles.json` / `personas.json` (very old formats)
   * 4. Built-in defaults
   */
  private loadProfiles(): AgentProfilesData {
    // 1. Try loading from modular .agents/agents/ directory
    const globalLayer = getAgentsLayerPaths(globalAgentsFolder)
    const globalResult = loadAgentProfilesLayer(globalLayer)

    const workspaceDir = resolveWorkspaceAgentsFolder()
    let workspaceProfiles: AgentProfile[] = []
    if (workspaceDir) {
      const workspaceLayer = getAgentsLayerPaths(workspaceDir)
      const workspaceResult = loadAgentProfilesLayer(workspaceLayer)
      workspaceProfiles = workspaceResult.profiles
    }

    if (globalResult.profiles.length > 0 || workspaceProfiles.length > 0) {
      // Also load currentProfileId from legacy JSON if available
      let currentProfileId: string | undefined
      try {
        if (fs.existsSync(agentProfilesPath)) {
          const legacyData = JSON.parse(fs.readFileSync(agentProfilesPath, "utf8")) as AgentProfilesData
          currentProfileId = legacyData.currentProfileId
        }
      } catch { /* best-effort */ }

      this.profilesData = buildAgentProfilesDataFromLayers(globalResult.profiles, workspaceProfiles, currentProfileId)
      logApp(`Loaded ${this.profilesData.profiles.length} agent profile(s) from .agents/agents/`)
      return this.profilesData
    }

    // 2. Try loading from legacy agent-profiles.json and migrate to modular
    try {
      if (fs.existsSync(agentProfilesPath)) {
        const data = JSON.parse(fs.readFileSync(agentProfilesPath, "utf8")) as AgentProfilesData
        this.profilesData = data
        // Migrate: write each profile as modular files
        this.migrateToModularFiles(data.profiles)
        return data
      }
    } catch (error) {
      logApp("Error loading agent profiles:", error)
    }

    // 3. Try to migrate from very old legacy formats
    const migratedProfiles = this.migrateFromLegacy()
    if (migratedProfiles.length > 0) {
      this.profilesData = { profiles: migratedProfiles }
      this.saveProfiles()
      return this.profilesData
    }

    // 4. Initialize with defaults
    const defaultProfiles = createDefaultAgentProfiles(randomUUID, Date.now()) as AgentProfile[]

    this.profilesData = { profiles: defaultProfiles }
    this.saveProfiles()
    return this.profilesData
  }

  /**
   * One-time migration: split agent-profiles.json into .agents/agents/ files.
   */
  private migrateToModularFiles(profiles: AgentProfile[]): void {
    try {
      const globalLayer = getAgentsLayerPaths(globalAgentsFolder)
      writeAllAgentsProfileFiles(globalLayer, profiles, { onlyIfMissing: true, maxBackups: 10 })
      logApp(`Migrated ${profiles.length} agent profile(s) to .agents/agents/`)
    } catch (error) {
      logApp("Error migrating agent profiles to modular files:", error)
    }
  }

  /**
   * Migrate from legacy Profile, Persona, and ACPAgentConfig formats (one-time migration).
   */
  private migrateFromLegacy(): AgentProfile[] {
    let legacyProfilesData: ProfilesData | undefined
    let legacyPersonasData: PersonasData | undefined
    let legacyAcpAgents: ACPAgentConfig[] | undefined

    // Migrate legacy Profile records into chat-agent profiles.
    try {
      if (fs.existsSync(legacyProfilesPath)) {
        const data = JSON.parse(fs.readFileSync(legacyProfilesPath, "utf8")) as ProfilesData
        legacyProfilesData = data
        logApp(`Migrated ${data.profiles.length} legacy profiles`)
      }
    } catch (error) {
      logApp("Error migrating legacy profiles:", error)
    }

    // Migrate legacy personas/agents (agent targets)
    try {
      if (fs.existsSync(legacyPersonasPath)) {
        const data = JSON.parse(fs.readFileSync(legacyPersonasPath, "utf8")) as PersonasData
        legacyPersonasData = data
        logApp(`Migrated ${data.personas.length} legacy agents (from personas.json)`)
      }
    } catch (error) {
      logApp("Error migrating legacy agents:", error)
    }

    // Migrate ACP agents from config
    try {
      const config = configStore.get()
      if (config.acpAgents) {
        legacyAcpAgents = config.acpAgents as ACPAgentConfig[]
        logApp(`Migrated ${config.acpAgents.length} legacy ACP agents`)
      }
    } catch (error) {
      logApp("Error migrating legacy ACP agents:", error)
    }

    return migrateAgentProfilesFromLegacySources(
      {
        legacyProfilesData,
        legacyPersonasData,
        legacyAcpAgents,
      },
      {
        profileToAgentProfile,
        personaToAgentProfile,
        acpAgentConfigToAgentProfile,
      },
    ).profiles as AgentProfile[]
  }

  /**
   * Save profiles to storage.
   */
  private saveProfiles(): void {
    if (!this.profilesData) return
    try {
      // Canonical: write modular .agents/agents/ files
      const globalLayer = getAgentsLayerPaths(globalAgentsFolder)
      writeAllAgentsProfileFiles(globalLayer, this.profilesData.profiles, { maxBackups: 10 })

      // Shadow: keep legacy agent-profiles.json for backward compatibility
      fs.writeFileSync(agentProfilesPath, JSON.stringify(this.profilesData, null, 2))
    } catch (error) {
      logApp("Error saving agent profiles:", error)
    }
  }

  /**
   * Save a single profile to modular files (used after individual updates).
   */
  private saveSingleProfile(profile: AgentProfile): void {
    try {
      const globalLayer = getAgentsLayerPaths(globalAgentsFolder)
      writeAgentsProfileFiles(globalLayer, profile, { maxBackups: 10 })
    } catch (error) {
      logApp("Error saving agent profile to modular files:", error)
    }
  }

  /**
   * Load conversations from storage.
   */
  private loadConversations(): void {
    try {
      if (fs.existsSync(agentProfileConversationsPath)) {
        this.conversationsData = JSON.parse(
          fs.readFileSync(agentProfileConversationsPath, "utf8")
        )
      }
    } catch (error) {
      logApp("Error loading agent profile conversations:", error)
    }
  }

  /**
   * Save conversations to storage.
   */
  private saveConversations(): void {
    try {
      fs.writeFileSync(
        agentProfileConversationsPath,
        JSON.stringify(this.conversationsData, null, 2)
      )
    } catch (error) {
      logApp("Error saving agent profile conversations:", error)
    }
  }

  // ============================================================================
  // CRUD Operations
  // ============================================================================

  /**
   * Get all profiles.
   */
  getAll(): AgentProfile[] {
    return this.profilesData?.profiles ?? []
  }

  /**
   * Get a profile by ID.
   */
  getById(id: string): AgentProfile | undefined {
    return this.profilesData?.profiles.find((p) => p.id === id)
  }

  /**
   * Get a profile by name.
   */
  getByName(name: string): AgentProfile | undefined {
    return getAgentProfileByName(this.getAll(), name)
  }

  /**
   * Create a new profile.
   */
  create(profile: Omit<AgentProfile, "id" | "createdAt" | "updatedAt">): AgentProfile {
    const now = Date.now()
    const newProfile = createAgentProfileRecord(profile, randomUUID(), now) as AgentProfile

    if (!this.profilesData) {
      this.profilesData = { profiles: [] }
    }
    this.profilesData.profiles.push(newProfile)
    this.saveProfiles()

    return newProfile
  }

  /**
   * Update a profile.
   */
  update(id: string, updates: Partial<AgentProfile>): AgentProfile | undefined {
    const profile = this.getById(id)
    if (!profile) return undefined

    Object.assign(profile, buildAgentProfileUpdatePatch(profile, updates, Date.now()))
    this.saveProfiles()

    return profile
  }

  /**
   * Delete a profile.
   */
  delete(id: string): boolean {
    if (!this.profilesData) return false

    const index = getDeletableAgentProfileIndex(this.profilesData.profiles, id)
    if (index === -1) return false

    this.profilesData.profiles.splice(index, 1)
    this.saveProfiles()

    // Delete modular files from .agents/agents/
    try {
      const globalLayer = getAgentsLayerPaths(globalAgentsFolder)
      deleteAgentProfileFiles(globalLayer, id)
    } catch (error) {
      logApp("Error deleting agent profile files:", error)
    }

    // Also delete conversation
    this.conversationsData = removeAgentProfileConversation(this.conversationsData, id)
    this.saveConversations()

    return true
  }

  // ============================================================================
  // Query Methods
  // ============================================================================

  /**
   * Get profiles by role.
   * Uses the new role field, falling back to legacy flags for backward compatibility.
   */
  getByRole(role: AgentProfileRole): AgentProfile[] {
    return getAgentProfilesByRole(this.getAll(), role)
  }

  /**
   * Get chat agents (shown in the agent picker).
   * Uses getByRole internally for consistency.
   */
  getUserProfiles(): AgentProfile[] {
    return getChatAgentProfiles(this.getAll())
  }

  /**
   * Get agent targets (available for delegation).
   * Uses getByRole internally for consistency.
   */
  getAgentTargets(): AgentProfile[] {
    return getDelegationAgentProfiles(this.getAll())
  }

  /**
   * Get external agents (acpx/remote agents).
   */
  getExternalAgents(): AgentProfile[] {
    return getExternalAgentProfiles(this.getAll())
  }

  /**
   * Get enabled agent targets.
   */
  getEnabledAgentTargets(): AgentProfile[] {
    return getEnabledDelegationAgentProfiles(this.getAll())
  }

  /**
   * Get the current active agent profile.
   * Falls back to the default agent if no current profile is set.
   */
  getCurrentProfile(): AgentProfile | undefined {
    return getCurrentAgentProfile(this.getAll(), this.profilesData?.currentProfileId)
  }

  /**
   * Set the current active agent profile.
   */
  setCurrentProfile(id: string): void {
    if (!this.profilesData) return
    if (canSetCurrentAgentProfile(this.profilesData.profiles, id)) {
      this.profilesData.currentProfileId = id
      this.saveProfiles()
    }
  }

  // ============================================================================
  // Conversation State (for stateful agents)
  // ============================================================================

  /**
   * Get conversation for a profile.
   */
  getConversation(profileId: string): ConversationMessage[] {
    return getAgentProfileConversation(this.conversationsData, profileId)
  }

  /**
   * Set conversation for a profile.
   */
  setConversation(profileId: string, messages: ConversationMessage[]): void {
    this.conversationsData = setAgentProfileConversation(this.conversationsData, profileId, messages)
    this.saveConversations()
  }

  /**
   * Add message to a profile's conversation.
   */
  addToConversation(profileId: string, message: ConversationMessage): void {
    this.conversationsData = addAgentProfileConversationMessage(this.conversationsData, profileId, message)
    this.saveConversations()
  }

  /**
   * Clear conversation for a profile.
   */
  clearConversation(profileId: string): void {
    this.conversationsData = removeAgentProfileConversation(this.conversationsData, profileId)
    this.saveConversations()

    // Also clear conversationId on the profile
    const profile = this.getById(profileId)
    if (profile) {
      Object.assign(profile, clearAgentProfileConversationId(profile))
      this.saveProfiles()
    }
  }

  /**
   * Reload profiles from disk (for external changes).
   */
  reload(): void {
    this.profilesData = undefined
    this.loadProfiles()
    this.loadConversations()
  }

  // ============================================================================
  // Legacy ACP integration shim
  // ============================================================================

  syncAgentProfilesToACPRegistry(): void {
    logApp('[AgentProfileService] ACP registry sync is disabled; acpx agent profiles are used directly')
  }

  // ============================================================================
  // MCP Config Management (ported from ProfileService)
  // ============================================================================

  /**
   * Update the tool/MCP server configuration for a profile.
   * Merges with existing config - only provided fields are updated.
   * Accepts ProfileMcpServerConfig for backward compatibility with callers.
   */
  updateProfileMcpConfig(id: string, mcpServerConfig: Partial<ProfileMcpServerConfig>): AgentProfile | undefined {
    const profile = this.getById(id)
    if (!profile) return undefined

    const mergedToolConfig = mergeAgentProfileMcpConfig(profile.toolConfig, mcpServerConfig)

    return this.update(id, { toolConfig: mergedToolConfig })
  }

  /**
   * Save current MCP state to a profile.
   */
  saveCurrentMcpStateToProfile(
    id: string,
    disabledServers: string[],
    disabledTools: string[],
    enabledServers?: string[],
    enabledRuntimeTools?: string[],
  ): AgentProfile | undefined {
    return this.updateProfileMcpConfig(id, {
      disabledServers,
      disabledTools,
      ...(enabledServers !== undefined && { enabledServers }),
      ...(enabledRuntimeTools !== undefined && { enabledRuntimeTools }),
    })
  }

  // ============================================================================
  // Model Config Management (ported from ProfileService)
  // ============================================================================

  /**
   * Update the model configuration for a profile.
   * Merges with existing config - only provided fields are updated.
   */
  updateProfileModelConfig(id: string, modelConfig: Partial<ProfileModelConfig>): AgentProfile | undefined {
    const profile = this.getById(id)
    if (!profile) return undefined

    const mergedModelConfig = mergeAgentProfileModelConfig(profile.modelConfig, modelConfig)

    return this.update(id, { modelConfig: mergedModelConfig })
  }

  /**
   * Save current model state to a profile.
   */
  saveCurrentModelStateToProfile(id: string, modelConfig: ProfileModelConfig): AgentProfile | undefined {
    return this.updateProfileModelConfig(id, modelConfig)
  }

  // ============================================================================
  // Skills Management (ported from ProfileService)
  // ============================================================================

  /**
   * Update the skills configuration for a profile.
   * Merges with existing config - only provided fields are updated.
   */
  updateProfileSkillsConfig(id: string, skillsConfig: Partial<ProfileSkillsConfig>): AgentProfile | undefined {
    const profile = this.getById(id)
    if (!profile) return undefined

    const mergedSkillsConfig = mergeAgentProfileSkillsConfig(profile.skillsConfig, skillsConfig)

    return this.update(id, { skillsConfig: mergedSkillsConfig })
  }

  /**
   * Toggle a skill's enabled state for a specific profile.
   * When transitioning from "all enabled by default" (unconfigured), populates
   * the enabled list with all skills minus the toggled one.
   */
  toggleProfileSkill(profileId: string, skillId: string, allSkillIds?: string[]): AgentProfile | undefined {
    const profile = this.getById(profileId)
    if (!profile) return undefined

    return this.updateProfileSkillsConfig(
      profileId,
      toggleAgentProfileSkillConfig(profile.skillsConfig, skillId, allSkillIds),
    )
  }

  /**
   * Check if a skill is enabled for a specific profile.
   * When skillsConfig is undefined (unconfigured), all skills are enabled by default.
   */
  isSkillEnabledForProfile(profileId: string, skillId: string): boolean {
    const profile = this.getById(profileId)
    if (!profile) return false
    return isAgentProfileSkillEnabled(profile.skillsConfig, skillId)
  }

  /**
   * Check if a profile has all skills enabled by default (unconfigured).
   */
  hasAllSkillsEnabledByDefault(profileId: string): boolean {
    const profile = this.getById(profileId)
    if (!profile) return false
    return hasAllAgentProfileSkillsEnabledByDefault(profile.skillsConfig)
  }

  /**
   * Get all enabled skill IDs for a profile.
   * Returns null when all skills are enabled by default (unconfigured skillsConfig).
   * Callers should interpret null as "all available skills are enabled".
   */
  getEnabledSkillIdsForProfile(profileId: string): string[] | null {
    const profile = this.getById(profileId)
    if (!profile) return []
    return getEnabledAgentProfileSkillIds(profile.skillsConfig)
  }

  /**
   * Enable a skill for the current profile (used when installing new skills).
   * If the profile has no skillsConfig (all skills enabled by default), this is a no-op.
   */
  enableSkillForCurrentProfile(skillId: string): AgentProfile | undefined {
    const currentProfile = this.getCurrentProfile()
    if (!currentProfile) return undefined

    const nextSkillsConfig = getAgentProfileSkillsConfigAfterEnable(currentProfile.skillsConfig, skillId)
    if (!nextSkillsConfig) return currentProfile

    return this.updateProfileSkillsConfig(currentProfile.id, nextSkillsConfig)
  }

  // ============================================================================
  // Import / Export (ported from ProfileService)
  // ============================================================================

  /**
   * Export a profile as a JSON string.
   */
  exportProfile(id: string): string {
    const profile = this.getById(id)
    if (!profile) throw new Error(`Profile with id ${id} not found`)

    const config = configStore.get()
    return serializeAgentProfileExport(profile, config.mcpConfig?.mcpServers)
  }

  /**
   * Import a profile from a JSON string.
   */
  importProfile(profileJson: string): AgentProfile {
    try {
      const importData = parseAgentProfileImportJson(profileJson)

      // Create default tool config with all servers disabled
      const appConfig = configStore.get()
      const allServerNames = Object.keys(appConfig.mcpConfig?.mcpServers || {})
      const runtimeToolNames = getRuntimeToolNames()

      const newProfile = this.create(buildInternalDelegationAgentProfileCreateInput(
        importData.name,
        importData.guidelines || "",
        importData.systemPrompt,
        allServerNames,
        runtimeToolNames,
      ) as Omit<AgentProfile, "id" | "createdAt" | "updatedAt">)

      const mcpServerMerge = mergeImportedAgentProfileMcpServers(
        appConfig.mcpConfig?.mcpServers || {},
        importData.mcpServers,
      )
      const importedServerNames = mcpServerMerge.importedServerNames
      if (mcpServerMerge.newServerCount > 0) {
        configStore.save({
          ...appConfig,
          mcpConfig: {
            ...appConfig.mcpConfig,
            mcpServers: mcpServerMerge.mcpServers as Record<string, MCPServerConfig>,
          },
        })
        logApp(`Imported ${mcpServerMerge.newServerCount} new MCP server(s)`)
      }

      // Apply MCP server configuration if present
      if (importData.mcpServerConfig && typeof importData.mcpServerConfig === "object") {
        if (isValidAgentProfileMcpServerConfig(importData.mcpServerConfig)) {
          this.updateProfileMcpConfig(newProfile.id, importData.mcpServerConfig)
        }
      } else if (importedServerNames.length > 0) {
        const current = this.getById(newProfile.id)
        const currentEnabled = current?.toolConfig?.enabledServers || []
        this.updateProfileMcpConfig(newProfile.id, {
          enabledServers: [...new Set([...currentEnabled, ...importedServerNames])],
        })
      }

      // Apply model configuration if present
      if (importData.modelConfig && typeof importData.modelConfig === "object") {
        if (isValidAgentProfileModelConfig(importData.modelConfig)) {
          this.updateProfileModelConfig(newProfile.id, importData.modelConfig)
        }
      }

      // Apply skills configuration if present
      if (importData.skillsConfig && typeof importData.skillsConfig === "object") {
        if (isValidAgentProfileSkillsConfig(importData.skillsConfig)) {
          this.updateProfileSkillsConfig(newProfile.id, importData.skillsConfig)
        }
      }

      return this.getById(newProfile.id)!
    } catch (error) {
      throw new Error(`Failed to import profile: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // ============================================================================
  // Backward Compatibility Helpers
  // ============================================================================

  /**
   * Get profiles in legacy Profile format (for backward-compatible IPC handlers).
   * Returns only chat-agent profiles shaped like the legacy Profile type.
   */
  getProfilesLegacy(): Profile[] {
    return this.getUserProfiles().map(p => agentProfileToLegacyProfile(p) as Profile)
  }

  /**
   * Get a single profile in legacy Profile format.
   */
  getProfileLegacy(id: string): Profile | undefined {
    const profile = this.getById(id)
    if (!profile) return undefined
    return agentProfileToLegacyProfile(profile) as Profile
  }

  /**
   * Get current profile in legacy Profile format.
   */
  getCurrentProfileLegacy(): Profile | undefined {
    const profile = this.getCurrentProfile()
    if (!profile) return undefined
    return agentProfileToLegacyProfile(profile) as Profile
  }

  /**
   * Create an agent with legacy-style parameters.
   * Used by backward-compatible IPC handlers and runtime tools.
   */
  createUserProfile(name: string, guidelines: string, systemPrompt?: string): AgentProfile {
    const config = configStore.get()
    const allServerNames = Object.keys(config.mcpConfig?.mcpServers || {})
    const runtimeToolNames = getRuntimeToolNames()

    return this.create(buildInternalDelegationAgentProfileCreateInput(
      name,
      guidelines,
      systemPrompt,
      allServerNames,
      runtimeToolNames,
    ) as Omit<AgentProfile, "id" | "createdAt" | "updatedAt">)
  }

  /**
   * Set current profile and return it (throws if not found, like legacy ProfileService).
   */
  setCurrentProfileStrict(id: string): AgentProfile {
    const profile = this.getById(id)
    if (!profile) throw new Error(`Profile with id ${id} not found`)
    this.setCurrentProfile(id)
    return profile
  }
}

export const agentProfileService = new AgentProfileService()
