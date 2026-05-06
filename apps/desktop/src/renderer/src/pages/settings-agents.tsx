import { useState, useEffect, useRef, useMemo } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@renderer/components/ui/button"
import { Input } from "@renderer/components/ui/input"
import { Label } from "@renderer/components/ui/label"
import { Textarea } from "@renderer/components/ui/textarea"
import { Switch } from "@renderer/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@renderer/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@renderer/components/ui/card"
import { Badge } from "@renderer/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@renderer/components/ui/tabs"
import { Trash2, Plus, Edit2, Save, X, Server, Sparkles, Brain, Settings2, ChevronDown, ChevronRight, Wrench, RefreshCw, ExternalLink, Download, Upload, Globe } from "lucide-react"
import { Facehash } from "facehash"
import { toast } from "sonner"
import {
  AGENT_PROFILE_PRESETS,
  detectAgentProfilePresetKey,
  type AgentProfilePresetKey,
} from "@dotagents/shared/agent-profile-presets"
import { sanitizeAgentProfileConnection } from "@dotagents/shared/agent-profile-connection"
import {
  buildAgentProfileAgentModelUpdate,
  getAgentProfileAgentModelProvider,
  getAgentProfileAgentModelValue,
  getAgentProfileMcpConfigAfterServerToggle,
  getAgentProfileMcpConfigAfterSetAllServersEnabled,
  getAgentProfileMcpConfigAfterToolToggle,
  getAgentProfileRuntimeToolsConfigAfterSetAllEnabled,
  getAgentProfileRuntimeToolsConfigAfterToggle,
  isAgentProfileMcpServerEnabled,
  isAgentProfileMcpToolEnabled,
  isAgentProfileRuntimeToolEnabled,
  isAgentProfileSkillEnabled,
  toggleAgentProfileSkillConfig,
} from "@dotagents/shared/agent-profile-config-updates"

// Curated palette of vivid colors to pick from deterministically
const AVATAR_PALETTE = [
  "#ef4444","#f97316","#eab308","#22c55e","#14b8a6",
  "#3b82f6","#8b5cf6","#ec4899","#06b6d4","#84cc16",
  "#f43f5e","#a855f7","#0ea5e9","#10b981","#f59e0b",
  "#e11d48","#7c3aed","#0891b2","#059669","#d97706",
]
function agentColors(seed: string): string[] {
  let h = 5381
  for (let i = 0; i < seed.length; i++) h = ((h * 33) ^ seed.charCodeAt(i)) >>> 0
  return [0, 7, 13].map(offset => AVATAR_PALETTE[(h + offset) % AVATAR_PALETTE.length])
}
import { tipcClient } from "@renderer/lib/tipc-client"
import { sortAgentsWithDefaultFirst } from "@renderer/lib/agent-order"
import { ModelSelector } from "@renderer/components/model-selector"
import { BundleImportDialog } from "@renderer/components/bundle-import-dialog"
import { BundleExportDialog } from "@renderer/components/bundle-export-dialog"
import { BundlePublishDialog } from "@renderer/components/bundle-publish-dialog"
import { invalidateAgentProfileQueries } from "@renderer/lib/invalidate-agent-profile-queries"
import { SandboxSlotSwitcher } from "@renderer/components/sandbox-slot-switcher"
import {
  AgentProfile, AgentProfileConnectionType,
  ProfileModelConfig, AgentProfileToolConfig, ProfileSkillsConfig, AgentSkill, DetailedToolInfo,
} from "../../../shared/types"

type ConnectionType = AgentProfileConnectionType

interface EditingAgent {
  id?: string
  presetKey?: AgentProfilePresetKey
  displayName: string
  description: string
  systemPrompt: string
  guidelines: string
  connectionType: ConnectionType
  connectionCommand?: string
  connectionArgs?: string
  connectionBaseUrl?: string
  connectionCwd?: string
  enabled: boolean
  autoSpawn?: boolean
  modelConfig?: ProfileModelConfig
  toolConfig?: AgentProfileToolConfig
  skillsConfig?: ProfileSkillsConfig
  properties?: Record<string, string>
  avatarDataUrl?: string | null
}

interface ExternalAgentCommandVerificationResult {
  ok: boolean
  resolvedCommand?: string
  details?: string
  error?: string
  warnings?: string[]
}

type ServerInfo = { connected: boolean; toolCount: number; runtimeEnabled?: boolean; configDisabled?: boolean }

function buildCommandPreview(command?: string, args?: string): string {
  return [command?.trim(), args?.trim()].filter(Boolean).join(" ")
}

function emptyAgent(): EditingAgent {
  return {
    displayName: "", description: "", systemPrompt: "", guidelines: "",
    connectionType: "internal", enabled: true,
    modelConfig: undefined, toolConfig: undefined,
    skillsConfig: undefined, properties: {},
  }
}

function getAgentCardSummaryItems(agent: AgentProfile, availableSkillCount: number, availableRuntimeToolCount: number): string[] {
  const items: string[] = [agent.connection.type]

  const agentProviderId = agent.modelConfig?.agentProviderId || agent.modelConfig?.mcpToolsProviderId
  if (agentProviderId) {
    items.push(agentProviderId)
  }

  const enabledServerCount = agent.toolConfig?.enabledServers?.length ?? 0
  if (enabledServerCount > 0) {
    items.push(`${enabledServerCount} server${enabledServerCount === 1 ? "" : "s"}`)
  }

  if (availableSkillCount > 0) {
    const enabledSkillCount = (!agent.skillsConfig || !agent.skillsConfig.allSkillsDisabledByDefault)
      ? availableSkillCount
      : (agent.skillsConfig.enabledSkillIds?.length ?? 0)
    items.push(`${enabledSkillCount} skill${enabledSkillCount === 1 ? "" : "s"}`)
  }

  if (availableRuntimeToolCount > 0) {
    const runtimeList = agent.toolConfig?.enabledRuntimeTools
    const enabledRuntimeCount = (!runtimeList || runtimeList.length === 0)
      ? availableRuntimeToolCount
      : runtimeList.length
    items.push(`${enabledRuntimeCount} runtime tool${enabledRuntimeCount === 1 ? "" : "s"}`)
  }

  const propertyCount = agent.properties ? Object.keys(agent.properties).length : 0
  if (propertyCount > 0) {
    items.push(`${propertyCount} prop${propertyCount === 1 ? "" : "s"}`)
  }

  return items
}

export function SettingsAgents() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [agents, setAgents] = useState<AgentProfile[]>([])
  const [editing, setEditing] = useState<EditingAgent | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [serverStatus, setServerStatus] = useState<Record<string, ServerInfo>>({})
  const [allTools, setAllTools] = useState<{name: string, description: string, serverName: string}[]>([])
  const [skills, setSkills] = useState<AgentSkill[]>([])
  const [expandedServers, setExpandedServers] = useState<Set<string>>(new Set())
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())
  const [newPropKey, setNewPropKey] = useState("")
  const [newPropValue, setNewPropValue] = useState("")
  const [showSystemPrompt, setShowSystemPrompt] = useState(false)
  const [defaultSystemPrompt, setDefaultSystemPrompt] = useState("")
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [prefilledImportFilePath, setPrefilledImportFilePath] = useState<string | null>(null)
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false)
  const avatarFileInputRef = useRef<HTMLInputElement>(null)
  const [commandVerification, setCommandVerification] = useState<ExternalAgentCommandVerificationResult | null>(null)
  const [isVerifyingCommand, setIsVerifyingCommand] = useState(false)
  const sortedAgents = useMemo(() => sortAgentsWithDefaultFirst(agents), [agents])
  const selectedAgentModelProvider = editing
    ? getAgentProfileAgentModelProvider(editing.modelConfig)
    : undefined

  useEffect(() => {
    loadAgents()
    loadSkills()
    loadAllTools()
    tipcClient.getDefaultSystemPrompt().then(setDefaultSystemPrompt).catch(console.error)
  }, [])
  useEffect(() => { if (editing) { loadServers(); loadSkills(); loadAllTools() } }, [!!editing])

  useEffect(() => {
    const installBundlePath = searchParams.get("installBundle")
    if (!installBundlePath) return

    setEditing(null)
    setIsCreating(false)
    setPrefilledImportFilePath(installBundlePath)
    setIsImportDialogOpen(true)

    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete("installBundle")
    setSearchParams(nextParams, { replace: true })
  }, [searchParams, setSearchParams])

  useEffect(() => {
    setCommandVerification(null)
  }, [editing?.presetKey, editing?.connectionType, editing?.connectionCommand, editing?.connectionArgs, editing?.connectionCwd])

  // Handle URL-driven navigation: ?edit=<agentId> opens edit, ?create=1 opens
  // the create form, ?view=list returns to list
  useEffect(() => {
    const editId = searchParams.get("edit")
    const viewMode = searchParams.get("view")
    const createFlag = searchParams.get("create")

    if (viewMode === "list") {
      setEditing(null)
      setIsCreating(false)
      setSearchParams({}, { replace: true })
      return
    }

    if (createFlag && !isCreating) {
      setIsCreating(true)
      setEditing(emptyAgent())
      setCommandVerification(null)
      setSearchParams({}, { replace: true })
      return
    }

    if (editId && agents.length > 0 && editing?.id !== editId) {
      const agent = agents.find(a => a.id === editId)
      if (agent) {
        handleEdit(agent)
        // Clear the param so refreshing doesn't re-trigger
        setSearchParams({}, { replace: true })
      }
    }
  }, [searchParams, agents])

  const loadAgents = async () => {
    const all = await tipcClient.getAgentProfiles()
    setAgents(all)
  }
  const loadServers = async () => {
    try { const s = await tipcClient.getMcpServerStatus(); setServerStatus(s as Record<string, ServerInfo>) } catch {}
  }
  const loadAllTools = async () => {
    try {
      const list = await tipcClient.getMcpDetailedToolList()
      setAllTools(list)
    } catch {}
  }
  const loadSkills = async () => {
    try { const s = await tipcClient.getSkills(); setSkills(s) } catch {}
  }

  const handleCreate = () => { setIsCreating(true); setEditing(emptyAgent()); setCommandVerification(null) }

  const refreshAgentProfileQueries = () => invalidateAgentProfileQueries(queryClient)

  const applyPreset = (presetKey: AgentProfilePresetKey) => {
    const preset = AGENT_PROFILE_PRESETS[presetKey]
    setEditing({ ...emptyAgent(), ...preset, presetKey })
    setCommandVerification(null)
  }

  const handleEdit = (agent: AgentProfile) => {
    setIsCreating(false)
    const connectionArgs = agent.connection.args?.join(" ")
    setEditing({
      id: agent.id, displayName: agent.displayName,
      description: agent.description ?? "", systemPrompt: agent.systemPrompt ?? "",
      guidelines: agent.guidelines ?? "", connectionType: agent.connection.type,
      connectionCommand: agent.connection.command,
      connectionArgs,
      connectionBaseUrl: agent.connection.baseUrl,
      connectionCwd: agent.connection.cwd,
      enabled: agent.enabled, autoSpawn: agent.autoSpawn,
      modelConfig: agent.modelConfig ? { ...agent.modelConfig } : undefined,
      toolConfig: agent.toolConfig ? { ...agent.toolConfig } : undefined,
      skillsConfig: agent.skillsConfig ? { ...agent.skillsConfig } : undefined,
      properties: agent.properties ? { ...agent.properties } : {},
      avatarDataUrl: agent.avatarDataUrl ?? null,
      presetKey: detectAgentProfilePresetKey({
        connectionType: agent.connection.type,
        connectionCommand: agent.connection.command,
        connectionArgs,
      }),
    })
  }

  const handleSave = async () => {
    if (!editing) return
    if (editing.connectionType === 'acpx' && !editing.connectionCommand?.trim()) {
      toast.error('Add a command for acpx agents before saving.')
      return
    }
    if (editing.connectionType === "remote" && !editing.connectionBaseUrl?.trim()) {
      toast.error("Add a base URL before saving a remote agent.")
      return
    }
    const connection = sanitizeAgentProfileConnection({
      connectionType: editing.connectionType,
      connectionCommand: editing.connectionCommand,
      connectionArgs: editing.connectionArgs,
      connectionBaseUrl: editing.connectionBaseUrl,
      connectionCwd: editing.connectionCwd,
    })
    const data: any = {
      displayName: editing.displayName,
      description: editing.description || undefined,
      systemPrompt: editing.systemPrompt || undefined,
      guidelines: editing.guidelines || undefined,
      connection, enabled: editing.enabled,
      isUserProfile: false, isAgentTarget: true,
      autoSpawn: editing.autoSpawn,
      modelConfig: editing.modelConfig,
      toolConfig: editing.toolConfig,
      skillsConfig: editing.skillsConfig,
      properties: editing.properties && Object.keys(editing.properties).length > 0 ? editing.properties : undefined,
      avatarDataUrl: editing.avatarDataUrl ?? null,
    }
    if (isCreating) await tipcClient.createAgentProfile({ profile: data })
    else if (editing.id) await tipcClient.updateAgentProfile({ id: editing.id, updates: data })
    setEditing(null); setIsCreating(false); setNewPropKey(""); setNewPropValue(""); setCommandVerification(null); loadAgents()
    refreshAgentProfileQueries()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this agent?")) return
    await tipcClient.deleteAgentProfile({ id }); loadAgents()
    refreshAgentProfileQueries()
  }

  const handleCancel = () => { setEditing(null); setIsCreating(false); setNewPropKey(""); setNewPropValue(""); setCommandVerification(null) }

  // Derived tool data
  const typedTools = allTools as DetailedToolInfo[]
  const runtimeTools = typedTools.filter(t => t.sourceKind === "runtime")
  const externalTools = typedTools.filter(t => t.sourceKind === "mcp")
  const serverNames = Object.keys(serverStatus)
  const toolsByServer = (serverName: string) => externalTools.filter(t => t.sourceName === serverName)

  // Tool config helpers
  const isServerEnabled = (serverName: string): boolean => {
    return isAgentProfileMcpServerEnabled(editing?.toolConfig, serverName)
  }

  const isToolDisabled = (toolName: string): boolean => {
    return !isAgentProfileMcpToolEnabled(editing?.toolConfig, toolName)
  }

  const isRuntimeToolEnabled = (toolName: string): boolean => {
    return isAgentProfileRuntimeToolEnabled(editing?.toolConfig, toolName)
  }

  const isSkillEnabled = (skillId: string): boolean => {
    return isAgentProfileSkillEnabled(editing?.skillsConfig, skillId)
  }

  const toggleServer = (serverName: string) => {
    if (!editing) return
    setEditing({ ...editing, toolConfig: getAgentProfileMcpConfigAfterServerToggle(editing.toolConfig, serverName) })
  }

  const toggleTool = (toolName: string) => {
    if (!editing) return
    setEditing({ ...editing, toolConfig: getAgentProfileMcpConfigAfterToolToggle(editing.toolConfig, toolName) })
  }

  const toggleRuntimeTool = (toolName: string) => {
    if (!editing) return
    setEditing({
      ...editing,
      toolConfig: getAgentProfileRuntimeToolsConfigAfterToggle(
        editing.toolConfig,
        toolName,
        runtimeTools.map(t => t.name),
      ),
    })
  }

  const toggleSkill = (skillId: string) => {
    if (!editing) return
    setEditing({
      ...editing,
      skillsConfig: toggleAgentProfileSkillConfig(editing.skillsConfig, skillId, skills.map(s => s.id)),
    })
  }

  // Bulk toggle helpers
  const enableAllSkills = () => {
    if (!editing) return
    setEditing({ ...editing, skillsConfig: { enabledSkillIds: [], allSkillsDisabledByDefault: false } })
  }
  const disableAllSkills = () => {
    if (!editing) return
    setEditing({ ...editing, skillsConfig: { enabledSkillIds: [], allSkillsDisabledByDefault: true } })
  }
  const allSkillsEnabled = !editing?.skillsConfig?.allSkillsDisabledByDefault || (editing?.skillsConfig?.enabledSkillIds?.length === skills.length)
  const allSkillsDisabled = !!editing?.skillsConfig?.allSkillsDisabledByDefault && (editing?.skillsConfig?.enabledSkillIds?.length ?? 0) === 0

  const enableAllServers = () => {
    if (!editing) return
    setEditing({ ...editing, toolConfig: getAgentProfileMcpConfigAfterSetAllServersEnabled(editing.toolConfig, true) })
  }
  const disableAllServers = () => {
    if (!editing) return
    setEditing({ ...editing, toolConfig: getAgentProfileMcpConfigAfterSetAllServersEnabled(editing.toolConfig, false) })
  }
  const allServersEnabled = serverNames.length > 0 && serverNames.every(n => isServerEnabled(n))
  const allServersDisabled = serverNames.length > 0 && serverNames.every(n => !isServerEnabled(n))

  const enableAllRuntimeTools = () => {
    if (!editing) return
    setEditing({ ...editing, toolConfig: getAgentProfileRuntimeToolsConfigAfterSetAllEnabled(editing.toolConfig, true) })
  }
  const disableAllRuntimeTools = () => {
    if (!editing) return
    setEditing({ ...editing, toolConfig: getAgentProfileRuntimeToolsConfigAfterSetAllEnabled(editing.toolConfig, false) })
  }
  const allRuntimeEnabled = !editing?.toolConfig?.enabledRuntimeTools || editing.toolConfig.enabledRuntimeTools.length === 0
  const allRuntimeDisabled = (editing?.toolConfig?.enabledRuntimeTools?.length ?? 0) > 0 && editing?.toolConfig?.enabledRuntimeTools?.every(n => n === "mark_work_complete")

  // Section collapse helpers
  const isSectionCollapsed = (section: string) => collapsedSections.has(section)
  const toggleSection = (section: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev)
      if (next.has(section)) next.delete(section); else next.add(section)
      return next
    })
  }
  const toggleExpandServer = (serverName: string) => {
    setExpandedServers(prev => {
      const next = new Set(prev)
      if (next.has(serverName)) next.delete(serverName); else next.add(serverName)
      return next
    })
  }

  // Property helpers
  const addProperty = () => {
    if (!editing || !newPropKey.trim()) return
    setEditing({ ...editing, properties: { ...editing.properties, [newPropKey.trim()]: newPropValue } })
    setNewPropKey(""); setNewPropValue("")
  }
  const removeProperty = (key: string) => {
    if (!editing?.properties) return
    const { [key]: _, ...rest } = editing.properties
    setEditing({ ...editing, properties: rest })
  }

  // Model config helper
  const updateModelConfig = (updates: Partial<ProfileModelConfig>) => {
    if (!editing) return
    setEditing({ ...editing, modelConfig: { ...editing.modelConfig, ...updates } })
  }

  // Avatar upload helper
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editing) return
    const reader = new FileReader()
    reader.onload = () => setEditing({ ...editing, avatarDataUrl: reader.result as string })
    reader.readAsDataURL(file)
    // Reset so the same file can be re-selected
    e.target.value = ""
  }

  const handleImportComplete = () => {
    void loadAgents()
    void loadSkills()
    void loadServers()
    void loadAllTools()
    refreshAgentProfileQueries()
    queryClient.invalidateQueries({ queryKey: ["skills"] })
    queryClient.invalidateQueries({ queryKey: ["skillsSidebar"] })
    queryClient.invalidateQueries({ queryKey: ["mcp-server-status"] })
    queryClient.invalidateQueries({ queryKey: ["mcp-initialization-status"] })
    queryClient.invalidateQueries({ queryKey: ["serverStatusSidebar"] })
    queryClient.invalidateQueries({ queryKey: ["toolsSidebar"] })
    queryClient.invalidateQueries({ queryKey: ["loops"] })
    queryClient.invalidateQueries({ queryKey: ["loop-statuses"] })
    queryClient.invalidateQueries({ queryKey: ["knowledgeNotes"] })
    queryClient.invalidateQueries({ queryKey: ["config"] })
  }

  const handleImportDialogOpenChange = (open: boolean) => {
    setIsImportDialogOpen(open)
    if (!open) {
      setPrefilledImportFilePath(null)
    }
  }

  const selectedPresetKey = editing ? editing.presetKey || detectAgentProfilePresetKey(editing) : undefined
  const selectedPreset = selectedPresetKey ? AGENT_PROFILE_PRESETS[selectedPresetKey] : undefined

  const handleVerifyExternalAgent = async () => {
    if (!editing || editing.connectionType !== 'acpx') return

    setIsVerifyingCommand(true)
    try {
      const result = await tipcClient.verifyExternalAgentCommand({
        command: editing.connectionCommand || "",
        args: editing.connectionArgs?.split(" ").filter(Boolean),
        cwd: editing.connectionCwd || undefined,
        probeArgs: selectedPreset?.verifyArgs,
      })
      setCommandVerification(result)

      if (result.ok) toast.success(result.details || "External agent command looks ready.")
      else toast.error(result.error || "External agent verification failed.")
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setCommandVerification({ ok: false, error: message })
      toast.error(message)
    } finally {
      setIsVerifyingCommand(false)
    }
  }

  return (
    <div className="modern-panel h-full overflow-y-auto overflow-x-hidden px-6 py-4">
      {!editing && (
        <div className="mb-3 flex flex-wrap items-center justify-end gap-1.5">
          <Button size="sm" variant="outline" className="h-8 gap-1.5 whitespace-nowrap px-2.5" onClick={() => handleImportDialogOpenChange(true)}>
            <Upload className="h-4 w-4" />Import Bundle
          </Button>
          <Button size="sm" variant="outline" className="h-8 gap-1.5 whitespace-nowrap px-2.5" onClick={() => setIsExportDialogOpen(true)}>
            <Download className="h-4 w-4" />Export Bundle
          </Button>
          <Button size="sm" variant="outline" className="h-8 gap-1.5 whitespace-nowrap px-2.5" onClick={() => setIsPublishDialogOpen(true)}>
            <Globe className="h-4 w-4" />Export for Hub
          </Button>
          <Button size="sm" variant="outline" className="h-8 gap-1.5 whitespace-nowrap px-2.5" onClick={async () => { await tipcClient.reloadAgentProfiles(); loadAgents(); refreshAgentProfileQueries() }}>
            <RefreshCw className="h-4 w-4" />Rescan Files
          </Button>
          <Button size="sm" className="h-8 gap-1.5 whitespace-nowrap px-2.5" onClick={handleCreate}><Plus className="h-4 w-4" />Add Agent</Button>
        </div>
      )}
      {!editing && (
        <div className="mb-4">
          <SandboxSlotSwitcher />
        </div>
      )}
      {editing ? renderEditForm() : renderAgentList()}
      <BundleImportDialog
        open={isImportDialogOpen}
        onOpenChange={handleImportDialogOpenChange}
        onImportComplete={handleImportComplete}
        initialFilePath={prefilledImportFilePath || undefined}
        title={prefilledImportFilePath ? "Install Hub Bundle" : undefined}
        description={prefilledImportFilePath
          ? "Preview and import the downloaded Hub .dotagents bundle using the existing conflict-aware flow."
          : undefined}
      />
      <BundleExportDialog
        open={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
      />
      <BundlePublishDialog
        open={isPublishDialogOpen}
        onOpenChange={setIsPublishDialogOpen}
      />
    </div>
  )

  function renderAgentList() {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 pb-12">
        {sortedAgents.map(agent => {
          const summaryItems = getAgentCardSummaryItems(agent, skills.length, runtimeTools.length)

          return (
            <Card key={agent.id} className={`overflow-hidden flex flex-col transition-all hover:shadow-md ${!agent.enabled ? "opacity-60 grayscale-[0.5]" : ""}`}>
              <CardHeader className="p-3 pb-2 flex flex-row items-start gap-3 flex-none">
                <div className="w-10 h-10 rounded-md shadow-sm flex items-center justify-center overflow-hidden shrink-0 bg-muted">
                  {agent.avatarDataUrl
                    ? <img src={agent.avatarDataUrl} alt={agent.displayName} className="w-full h-full object-cover" />
                    : <Facehash name={agent.id} size={40} colors={agentColors(agent.id)} />
                  }
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <CardTitle className="text-sm font-semibold truncate leading-none mt-0.5">
                    {agent.displayName}
                  </CardTitle>
                  <CardDescription className="line-clamp-2 mt-1 text-[11px] leading-tight min-h-[1.75rem]">
                    {agent.description || agent.guidelines?.slice(0, 100) || "No description provided."}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col justify-end pt-1 pb-2 px-3">
                <div className="space-y-1.5 mb-2">
                  {(agent.isBuiltIn || agent.isDefault || !agent.enabled) && (
                    <div className="flex gap-1 flex-wrap">
                      {agent.isBuiltIn && <Badge variant="secondary" className="text-[10px] px-1 py-0 h-3.5 shadow-sm font-medium">Built-in</Badge>}
                      {agent.isDefault && <Badge variant="secondary" className="text-[10px] px-1 py-0 h-3.5 shadow-sm font-medium">Default</Badge>}
                      {!agent.enabled && <Badge variant="outline" className="text-[10px] px-1 py-0 h-3.5 bg-background/50 shadow-sm font-medium">Disabled</Badge>}
                    </div>
                  )}
                  <p className="text-[11px] leading-tight text-muted-foreground">
                    {summaryItems.join(" • ")}
                  </p>
                </div>
                <div className="flex items-center gap-1 pt-2 border-t mt-auto">
                  <Button variant="ghost" size="sm" className="flex-1 h-6 text-[11px] text-muted-foreground hover:text-foreground px-0" onClick={() => handleEdit(agent)}>
                    <Edit2 className="h-3 w-3 mr-1" /> Edit
                  </Button>
                  {!agent.isBuiltIn && !agent.isDefault && (
                    <>
                      <div className="w-[1px] h-3 bg-border"></div>
                      <Button variant="ghost" size="sm" className="flex-1 h-6 text-[11px] text-destructive/80 hover:text-destructive hover:bg-destructive/10 px-0" onClick={() => handleDelete(agent.id)}>
                        <Trash2 className="h-3 w-3 mr-1" /> Delete
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
        {sortedAgents.length === 0 && (
          <div className="col-span-full rounded-lg border border-dashed bg-muted/20 px-4 py-7 text-center">
            <p className="text-sm font-medium text-foreground">No agents yet.</p>
            <p className="mt-1 text-sm text-muted-foreground">Create one with Add Agent or import an existing bundle.</p>
          </div>
        )}
      </div>
    )
  }

  function renderEditForm() {
    if (!editing) return null
    const isInternal = editing.connectionType === "internal"
    const externalCommandPreview = buildCommandPreview(editing.connectionCommand, editing.connectionArgs)

    return (
      <Card className="max-w-5xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{isCreating ? "Create Agent" : `Edit: ${editing.displayName}`}</CardTitle>
          <CardDescription>Configure agent identity, behavior, model, and capabilities.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="mb-3 h-auto flex-wrap gap-1">
              <TabsTrigger value="general" className="gap-1.5"><Settings2 className="h-3.5 w-3.5" />General</TabsTrigger>
              {isInternal && <TabsTrigger value="model" className="gap-1.5"><Brain className="h-3.5 w-3.5" />Model</TabsTrigger>}
              <TabsTrigger value="capabilities" className="gap-1.5"><Wrench className="h-3.5 w-3.5" />Capabilities</TabsTrigger>
              <TabsTrigger value="properties" className="gap-1.5">Properties</TabsTrigger>
            </TabsList>

            {/* ── General Tab ── */}
            <TabsContent value="general" className="space-y-4">
              {/* Avatar upload */}
              <div className="space-y-2">
                <Label>Avatar</Label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl border-2 border-border overflow-hidden flex items-center justify-center bg-muted/40 flex-shrink-0">
                    {editing.avatarDataUrl
                      ? <img src={editing.avatarDataUrl} alt="avatar" className="w-full h-full object-cover" />
                      : <Facehash name={editing.id || "new"} size={64} colors={agentColors(editing.id || "new")} />
                    }
                  </div>
                  <div className="flex flex-col gap-2">
                    <input ref={avatarFileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFileChange} />
                    <Button type="button" variant="outline" size="sm" onClick={() => avatarFileInputRef.current?.click()}>
                      Upload photo
                    </Button>
                    {editing.avatarDataUrl && (
                      <Button type="button" variant="ghost" size="sm" className="text-destructive/80 hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setEditing({ ...editing, avatarDataUrl: null })}>
                        Remove photo
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              {isCreating && (
                <div className="space-y-2 rounded-lg border border-dashed bg-muted/20 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <Label>Quick Setup</Label>
                    <p className="text-[11px] text-muted-foreground">Start with a preset, or configure manually below.</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(AGENT_PROFILE_PRESETS).map(([key, preset]) => (
                      <Button key={key} type="button" variant="outline" size="sm" className="h-8 px-2.5 text-xs"
                        onClick={() => applyPreset(key as AgentProfilePresetKey)}
                      >{preset.displayName}</Button>
                    ))}
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="displayName">Name</Label>
                <Input id="displayName" value={editing.displayName} onChange={e => setEditing({ ...editing, displayName: e.target.value })} placeholder="My Agent" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" value={editing.description} onChange={e => setEditing({ ...editing, description: e.target.value })} placeholder="What this agent does..." />
                <p className="text-[11px] text-muted-foreground">Shown only in the UI. Not visible to the agent—use Guidelines for instructions.</p>
              </div>
              {isInternal && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="guidelines">Guidelines</Label>
                    <Textarea id="guidelines" value={editing.guidelines} onChange={e => setEditing({ ...editing, guidelines: e.target.value })} rows={4} placeholder="e.g. You are an expert in React. Always check types before writing code..." className="font-mono text-sm" />
                    <p className="text-xs text-muted-foreground">
                      Additional instructions for this agent. These are appended to the core tool-calling system prompt.
                    </p>
                  </div>
                  <div className="space-y-2 pt-2 border-t">
                    <div
                      className="flex items-center gap-2 cursor-pointer select-none"
                      onClick={() => setShowSystemPrompt(!showSystemPrompt)}
                    >
                      {showSystemPrompt ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                      <Label className="cursor-pointer font-semibold">Base System Prompt (Advanced)</Label>
                    </div>
                    {showSystemPrompt && (
                      <div className="space-y-3 pt-2">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <p className="text-xs text-muted-foreground text-amber-600 dark:text-amber-500">
                            Not recommended to change. This replaces the core tool-calling instructions. Leave empty to use the default.
                          </p>
                          <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => setEditing({ ...editing, systemPrompt: "" })} disabled={!editing.systemPrompt}>
                            Reset to Default
                          </Button>
                        </div>
                        <Textarea
                          id="systemPrompt"
                          value={editing.systemPrompt || defaultSystemPrompt}
                          onChange={e => setEditing({ ...editing, systemPrompt: e.target.value })}
                          rows={8}
                          className={`font-mono text-xs resize-y min-h-[120px] max-h-[400px] ${!editing.systemPrompt ? "text-muted-foreground" : ""}`}
                        />
                      </div>
                    )}
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="connectionType">Connection Type</Label>
                <Select value={editing.connectionType} onValueChange={(v: ConnectionType) => setEditing({ ...editing, connectionType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">Internal (built-in agent)</SelectItem>
                    <SelectItem value="acpx">acpx (external agent)</SelectItem>
                    <SelectItem value="remote">Remote (HTTP endpoint)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {editing.connectionType === 'acpx' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="command">Command</Label>
                    <Input id="command" value={editing.connectionCommand ?? ""} onChange={e => setEditing({ ...editing, connectionCommand: e.target.value })} placeholder="e.g., claude-code-acp" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="args">Arguments (space-separated)</Label>
                    <Input id="args" value={editing.connectionArgs ?? ""} onChange={e => setEditing({ ...editing, connectionArgs: e.target.value })} placeholder="e.g., --acp" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cwd">Working Directory (optional)</Label>
                    <Input id="cwd" value={editing.connectionCwd ?? ""} onChange={e => setEditing({ ...editing, connectionCwd: e.target.value })} placeholder="e.g., /path/to/project or leave empty" />
                  </div>
                  <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Label>{selectedPreset ? `${selectedPreset.displayName} Setup` : "External Agent Setup"}</Label>
                          {selectedPresetKey && <Badge variant="secondary" className="text-[10px] uppercase">Preset</Badge>}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {selectedPreset?.description || "Verify that DotAgents can resolve your command and working directory before saving."}
                        </p>
                      </div>
                      {selectedPreset?.docsUrl && (
                        <Button type="button" variant="ghost" size="sm" className="h-7 gap-1.5 px-2 text-xs" onClick={() => window.open(selectedPreset.docsUrl, "_blank")}>Open docs<ExternalLink className="h-3.5 w-3.5" /></Button>
                      )}
                    </div>

                    {(selectedPreset?.installCommand || selectedPreset?.authHint || selectedPreset?.cwdHint) && (
                      <div className="grid gap-2 sm:grid-cols-3">
                        {selectedPreset?.installCommand && (
                          <div className="space-y-1 rounded-md border bg-background/80 px-2.5 py-2">
                            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Install</p>
                            <p className="font-mono text-[11px] leading-relaxed">{selectedPreset.installCommand}</p>
                          </div>
                        )}
                        {selectedPreset?.authHint && (
                          <div className="space-y-1 rounded-md border bg-background/80 px-2.5 py-2">
                            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Auth</p>
                            <p className="text-[11px] leading-relaxed text-muted-foreground">{selectedPreset.authHint}</p>
                          </div>
                        )}
                        {selectedPreset?.cwdHint && (
                          <div className="space-y-1 rounded-md border bg-background/80 px-2.5 py-2">
                            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Working Directory</p>
                            <p className="text-[11px] leading-relaxed text-muted-foreground">{selectedPreset.cwdHint}</p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2">
                      <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 px-2.5 text-xs" disabled={isVerifyingCommand} onClick={handleVerifyExternalAgent}>
                        <RefreshCw className={`h-3.5 w-3.5 ${isVerifyingCommand ? "animate-spin" : ""}`} />Verify Setup
                      </Button>
                      <p className="text-[11px] text-muted-foreground">
                        {selectedPreset?.verifyArgs?.length
                          ? `Runs ${buildCommandPreview(editing.connectionCommand, `${editing.connectionArgs || ""} ${selectedPreset.verifyArgs.join(" ")}`)} to confirm the command is runnable.`
                          : "Checks the command path and working directory before you save."}
                      </p>
                    </div>

                    {commandVerification && (
                      <div className={`space-y-1 rounded-md border px-2.5 py-2 text-[11px] ${commandVerification.ok ? "border-emerald-500/40 bg-emerald-500/5" : "border-amber-500/40 bg-amber-500/5"}`}>
                        <p className="font-medium">{commandVerification.ok ? "Verification passed" : "Verification needs attention"}</p>
                        <p className="text-muted-foreground">{commandVerification.details || commandVerification.error}</p>
                        {commandVerification.resolvedCommand && (
                          <p className="font-mono text-[10px] text-muted-foreground">Resolved command: {commandVerification.resolvedCommand}</p>
                        )}
                        {externalCommandPreview && (
                          <p className="font-mono text-[10px] text-muted-foreground">Configured command: {externalCommandPreview}</p>
                        )}
                        {commandVerification.warnings?.map((warning, index) => (
                          <p key={`${warning}-${index}`} className="text-[10px] text-muted-foreground">{warning}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
              {editing.connectionType === "remote" && (
                <div className="space-y-2">
                  <Label htmlFor="baseUrl">Base URL</Label>
                  <Input id="baseUrl" value={editing.connectionBaseUrl ?? ""} onChange={e => setEditing({ ...editing, connectionBaseUrl: e.target.value })} placeholder="e.g., http://localhost:8000" />
                </div>
              )}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
                <div className="flex items-center space-x-2">
                  <Switch id="enabled" checked={editing.enabled} onCheckedChange={v => setEditing({ ...editing, enabled: v })} />
                  <Label htmlFor="enabled">Enabled</Label>
                </div>
                {editing.connectionType === 'acpx' && (
                  <div className="flex items-center space-x-2">
                    <Switch id="autoSpawn" checked={editing.autoSpawn ?? false} onCheckedChange={v => setEditing({ ...editing, autoSpawn: v })} />
                    <Label htmlFor="autoSpawn">Auto-spawn on startup</Label>
                  </div>
                )}
              </div>
            </TabsContent>


            {/* ── Model Tab (internal only) ── */}
            {isInternal && (
              <TabsContent value="model" className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Choose which LLM provider and model this agent uses. Leave unset to use global defaults.
                </p>
                <div className="space-y-2">
                  <Label>LLM Provider</Label>
                  <Select
                    value={selectedAgentModelProvider ?? "__global__"}
                    onValueChange={v => {
                      if (v === "__global__") {
                        setEditing({ ...editing, modelConfig: undefined })
                      } else {
                        updateModelConfig({ agentProviderId: v as "openai" | "groq" | "gemini" | "chatgpt-web" })
                      }
                    }}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__global__">Use global default</SelectItem>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="groq">Groq</SelectItem>
                      <SelectItem value="gemini">Gemini</SelectItem>
                      <SelectItem value="chatgpt-web">ChatGPT Web</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {selectedAgentModelProvider && (
                  <ModelSelector
                    providerId={selectedAgentModelProvider}
                    value={getAgentProfileAgentModelValue(editing.modelConfig, selectedAgentModelProvider)}
                    onValueChange={model => {
                      updateModelConfig(buildAgentProfileAgentModelUpdate(selectedAgentModelProvider, model))
                    }}
                    label="Agent Model"
                    placeholder="Select model for this agent"
                  />
                )}
              </TabsContent>
            )}

            {/* ── Capabilities Tab ── */}
            <TabsContent value="capabilities" className="space-y-4">
              {/* ── Skills Section ── */}
              <div className="rounded-lg border">
                <div className="flex items-center justify-between w-full px-4 py-3">
                  <button type="button" className="flex items-center gap-2 hover:bg-muted/50 transition-colors rounded-md px-1 py-0.5 -mx-1" onClick={() => toggleSection("skills")}>
                    {isSectionCollapsed("skills") ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    <Sparkles className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold text-sm">Skills</span>
                  </button>
                  <div className="flex items-center gap-2">
                    {skills.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-[11px]" disabled={allSkillsEnabled} onClick={(e) => { e.stopPropagation(); enableAllSkills() }}>Enable All</Button>
                        <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-[11px]" disabled={allSkillsDisabled} onClick={(e) => { e.stopPropagation(); disableAllSkills() }}>Disable All</Button>
                      </div>
                    )}
                    <Badge variant="secondary" className="text-xs">{skills.filter(s => isSkillEnabled(s.id)).length} of {skills.length} enabled</Badge>
                  </div>
                </div>
                {!isSectionCollapsed("skills") && (
                  <div className="border-t px-2 py-2 space-y-0.5">
                    {skills.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-3 text-center">No skills available.</p>
                    ) : skills.map(skill => (
                      <div key={skill.id} className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted/30">
                        <Switch checked={isSkillEnabled(skill.id)} onCheckedChange={() => toggleSkill(skill.id)} />
                        <div className="min-w-0 flex-1">
                          <span className="text-sm truncate block">{skill.name}</span>
                          {skill.description && <span className="text-xs text-muted-foreground truncate block">{skill.description}</span>}
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" title="Edit skill" onClick={() => navigate("/settings/capabilities")}>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── MCP Servers Section ── */}
              <div className="rounded-lg border">
                <div className="flex items-center justify-between w-full px-4 py-3">
                  <button type="button" className="flex items-center gap-2 hover:bg-muted/50 transition-colors rounded-md px-1 py-0.5 -mx-1" onClick={() => toggleSection("mcp-servers")}>
                    {isSectionCollapsed("mcp-servers") ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    <Server className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold text-sm">MCP Servers</span>
                  </button>
                  <div className="flex items-center gap-2">
                    {serverNames.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-[11px]" disabled={allServersEnabled} onClick={(e) => { e.stopPropagation(); enableAllServers() }}>Enable All</Button>
                        <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-[11px]" disabled={allServersDisabled} onClick={(e) => { e.stopPropagation(); disableAllServers() }}>Disable All</Button>
                      </div>
                    )}
                    <Badge variant="secondary" className="text-xs">{serverNames.filter(n => isServerEnabled(n)).length} of {serverNames.length} enabled</Badge>
                  </div>
                </div>
                {!isSectionCollapsed("mcp-servers") && (
                  <div className="border-t px-2 py-2 space-y-1">
                    {serverNames.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-3 text-center">No MCP servers configured.</p>
                    ) : serverNames.map(name => {
                      const info = serverStatus[name]
                      const serverToolList = toolsByServer(name)
                      const isExpanded = expandedServers.has(name)
                      const enabled = isServerEnabled(name)
                      return (
                        <div key={name} className="rounded-md border bg-card">
                          <div className="flex items-center justify-between px-3 py-2">
                            <div className="flex items-center gap-3 min-w-0">
                              <Switch checked={enabled} onCheckedChange={() => toggleServer(name)} />
                              <div className="flex items-center gap-2 min-w-0">
                                <span className={`font-medium text-sm truncate ${!enabled ? "text-muted-foreground" : ""}`}>{name}</span>
                                {info?.connected
                                  ? <Badge variant="secondary" className="text-[10px] px-1.5">connected</Badge>
                                  : <Badge variant="outline" className="text-[10px] px-1.5">offline</Badge>
                                }
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" title="Edit server" onClick={() => navigate("/settings/capabilities")}>
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Button>
                              <button type="button" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded" onClick={() => toggleExpandServer(name)}>
                                <span>{serverToolList.length} tools</span>
                                {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                          </div>
                          {isExpanded && serverToolList.length > 0 && (
                            <div className="border-t mx-3 mb-2 pt-1 space-y-0.5">
                              {serverToolList.map(tool => {
                                const toolEnabled = enabled && !isToolDisabled(tool.name)
                                return (
                                  <div key={tool.name} className="flex items-center gap-3 px-2 py-1.5 rounded hover:bg-muted/30">
                                    <Switch checked={toolEnabled} disabled={!enabled} onCheckedChange={() => toggleTool(tool.name)} />
                                    <div className="min-w-0">
                                      <span className={`text-sm truncate block ${!toolEnabled ? "text-muted-foreground" : ""}`}>{tool.name.replace(`${name}:`, "")}</span>
                                      {tool.description && <span className="text-xs text-muted-foreground truncate block">{tool.description}</span>}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* ── DotAgents Runtime Tools Section ── */}
              <div className="rounded-lg border">
                <div className="flex items-center justify-between w-full px-4 py-3">
                  <button type="button" className="flex items-center gap-2 hover:bg-muted/50 transition-colors rounded-md px-1 py-0.5 -mx-1" onClick={() => toggleSection("runtime-tools")}>
                    {isSectionCollapsed("runtime-tools") ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    <Wrench className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold text-sm">DotAgents Runtime Tools</span>
                  </button>
                  <div className="flex items-center gap-2">
                    {runtimeTools.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-[11px]" disabled={allRuntimeEnabled} onClick={(e) => { e.stopPropagation(); enableAllRuntimeTools() }}>Enable All</Button>
                        <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-[11px]" disabled={allRuntimeDisabled} onClick={(e) => { e.stopPropagation(); disableAllRuntimeTools() }}>Disable All</Button>
                      </div>
                    )}
                    <Badge variant="secondary" className="text-xs">{runtimeTools.filter(t => isRuntimeToolEnabled(t.name)).length} of {runtimeTools.length} enabled</Badge>
                  </div>
                </div>
                {!isSectionCollapsed("runtime-tools") && (
                  <div className="border-t px-2 py-2 space-y-0.5">
                    {runtimeTools.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-3 text-center">No DotAgents runtime tools available.</p>
                    ) : runtimeTools.map(tool => {
                      const isEssential = tool.name === "mark_work_complete"
                      const enabled = isEssential || isRuntimeToolEnabled(tool.name)
                      return (
                        <div key={tool.name} className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted/30">
                          <Switch checked={enabled} disabled={isEssential} onCheckedChange={() => toggleRuntimeTool(tool.name)} />
                          <div className="min-w-0">
                            <span className={`text-sm truncate flex items-center gap-2 ${!enabled ? "text-muted-foreground" : ""}`}>
                              {tool.name}
                              {isEssential && <Badge variant="outline" className="text-[10px] px-1.5">essential</Badge>}
                            </span>
                            {tool.description && <span className="text-xs text-muted-foreground truncate block">{tool.description}</span>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ── Properties Tab ── */}
            <TabsContent value="properties" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Dynamic key-value properties that are exposed in the agent&apos;s system prompt as variables.
              </p>
              {editing.properties && Object.keys(editing.properties).length > 0 && (
                <div className="space-y-1">
                  {Object.entries(editing.properties).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-card">
                      <code className="text-sm font-mono bg-muted px-1.5 py-0.5 rounded">{key}</code>
                      <span className="text-sm flex-1 truncate">{String(val)}</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeProperty(key)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2 items-end">
                <div className="space-y-1 flex-1">
                  <Label className="text-xs">Key</Label>
                  <Input value={newPropKey} onChange={e => setNewPropKey(e.target.value)} placeholder="e.g., language" className="h-8 text-sm" />
                </div>
                <div className="space-y-1 flex-1">
                  <Label className="text-xs">Value</Label>
                  <Input value={newPropValue} onChange={e => setNewPropValue(e.target.value)} placeholder="e.g., TypeScript" className="h-8 text-sm"
                    onKeyDown={e => { if (e.key === "Enter") addProperty() }}
                  />
                </div>
                <Button size="sm" variant="outline" className="h-8 gap-1" onClick={addProperty} disabled={!newPropKey.trim()}>
                  <Plus className="h-3.5 w-3.5" />Add
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t mt-4">
            <Button variant="outline" className="gap-2" onClick={handleCancel}><X className="h-4 w-4" />Cancel</Button>
            <Button className="gap-2" onClick={handleSave}><Save className="h-4 w-4" />Save</Button>
          </div>
        </CardContent>
      </Card>
    )
  }
}

export { SettingsAgents as Component }
