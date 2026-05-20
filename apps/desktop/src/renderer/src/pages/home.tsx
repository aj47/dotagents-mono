import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate, useOutletContext } from "react-router-dom"
import {
  Clock,
  FileText,
  FolderKanban,
  Home,
  LayoutDashboard,
  Loader2,
  Mic,
  Pencil,
  Plus,
  Save,
  Sparkles,
  Star,
  Trash2,
  Users,
} from "lucide-react"
import { toast } from "sonner"
import { AgentSelector } from "@renderer/components/agent-selector"
import { PredefinedPromptsMenu } from "@renderer/components/predefined-prompts-menu"
import { Badge } from "@renderer/components/ui/badge"
import { Button } from "@renderer/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@renderer/components/ui/dialog"
import { Textarea } from "@renderer/components/ui/textarea"
import { rendererHandlers, tipcClient } from "@renderer/lib/tipc-client"
import { useSavedConversationsQuery } from "@renderer/lib/queries"
import { cn } from "@renderer/lib/utils"
import { useAgentStore } from "@renderer/stores"
import {
  GeneratedHomeRenderer,
  type GeneratedHomeActions,
} from "@renderer/lib/generated-home-runtime"
import {
  HOME_STARTER_ID,
  type GeneratedHomeExperience,
  type HomeExperienceRecord,
  type HomeExperienceSummary,
  type HomeGenerationMode,
} from "@shared/home-experience"
import type { AgentProfile, AgentProgressUpdate, ConversationHistoryItem } from "@shared/types"
import type { SessionActionDialogMode } from "@renderer/components/session-action-dialog"

interface LayoutContext {
  onOpenSavedConversationsDialog: () => void
  selectedAgentId: string | null
  setSelectedAgentId: (id: string | null) => void
  onStartTextSession: () => void | Promise<void>
  onStartVoiceSession: () => void | Promise<void>
  onStartPromptSession: (content: string) => void | Promise<void>
  openSessionActionDialog: (dialog: {
    mode: SessionActionDialogMode
    initialText?: string
    conversationId?: string
  }) => void
}

interface HomeSession {
  id: string
  conversationId?: string
  conversationTitle?: string
  status: "active" | "completed" | "error" | "stopped"
  startTime?: number
  endTime?: number
}

interface SessionListResponse {
  activeSessions: HomeSession[]
  recentCompletedSessions?: HomeSession[]
  recentSessions?: HomeSession[]
}

type HomeViewData = {
  metrics: Array<{
    id: string
    label: string
    value: number | string
    detail?: string
  }>
  datasets: Array<{
    id: string
    label: string
    points: Array<{
      label: string
      value: number
      color?: string
    }>
  }>
  activeSessions: Array<{
    id: string
    title: string
    status: string
    conversationId?: string
    updatedAt: number
  }>
  recentConversations: Array<{
    id: string
    title: string
    updatedAt: number
    preview?: string
  }>
  agents: Array<{
    id: string
    name: string
    description?: string
    enabled?: boolean
  }>
  files: Array<{
    id: string
    name: string
    path?: string
    kind?: string
    status?: string
    updatedAt?: number
  }>
  media: Array<{
    id: string
    title: string
    url?: string
    poster?: string
    kind?: "video" | "audio" | "image" | "other"
    updatedAt?: number
  }>
  projects: Array<{
    id: string
    name: string
    status?: string
    description?: string
    updatedAt?: number
  }>
  selectedAgentId: string | null
  workspace: {
    globalAgentsDir?: string | null
    workspaceAgentsDir?: string | null
  }
}

type HomeGenerationResult = {
  conversationId: string
  sessionId: string
  status: "started" | "already-running"
}

type HomeGenerationRequest = {
  prompt: string
  mode: HomeGenerationMode
}

type HomeGenerationJob = {
  conversationId: string
  sessionId: string
  prompt: string
  mode?: HomeGenerationMode
  sourceHomeId?: string
  startedAt: number
}

const HOME_LIST_QUERY_KEY = ["home-experiences"] as const
const HOME_GENERATION_JOBS_STORAGE_KEY = "dotagents.homeGenerationJobs"
const HOME_GENERATION_JOB_MAX_AGE_MS = 10 * 60 * 1000

function loadHomeGenerationJobs(): HomeGenerationJob[] {
  try {
    const raw = window.localStorage.getItem(HOME_GENERATION_JOBS_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    const oldestAllowedStartedAt = Date.now() - HOME_GENERATION_JOB_MAX_AGE_MS
    return Array.isArray(parsed)
      ? parsed.filter((job): job is HomeGenerationJob =>
          typeof job?.conversationId === "string" &&
          typeof job?.sessionId === "string" &&
          typeof job?.prompt === "string" &&
          typeof job?.startedAt === "number" &&
          job.startedAt >= oldestAllowedStartedAt
        )
      : []
  } catch {
    return []
  }
}

function getProgressTimestamp(progress: AgentProgressUpdate | undefined): number {
  if (!progress) return 0
  const stepTs = progress.steps?.length
    ? progress.steps[progress.steps.length - 1]?.timestamp ?? 0
    : 0
  const historyTs = progress.conversationHistory?.length
    ? progress.conversationHistory[progress.conversationHistory.length - 1]?.timestamp ?? 0
    : 0
  const eventTs = progress.responseEvents?.length
    ? progress.responseEvents[progress.responseEvents.length - 1]?.timestamp ?? 0
    : 0
  return Math.max(stepTs, historyTs, eventTs)
}

function formatRelativeTime(timestamp: number): string {
  if (!timestamp) return "now"
  const diffMs = Math.max(0, Date.now() - timestamp)
  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) return "now"
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}

function HomePanel({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <section
      className={cn(
        "min-w-0 overflow-hidden rounded-lg border border-border/70 bg-card/80 shadow-sm",
        className,
      )}
    >
      {children}
    </section>
  )
}

function StarterHome({
  data,
  actions,
  selectedAgentId,
  onSelectAgent,
}: {
  data: HomeViewData
  actions: GeneratedHomeActions
  selectedAgentId: string | null
  onSelectAgent: (id: string | null) => void
}) {
  const activeAgents = data.agents.filter((agent) => agent.enabled !== false)
  const activeSessions = data.activeSessions.slice(0, 5)
  const recentConversations = data.recentConversations.slice(0, 6)
  const suggestedPrompts = [
    "Review my active projects and tell me what needs attention.",
    "Create a focused plan for the next hour of work.",
    "Find useful clips or artifacts from my recent sessions.",
  ]

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-4 px-4 py-5 sm:px-5">
      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
        <HomePanel className="overflow-hidden">
          <div className="border-b border-border/70 px-4 py-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-foreground text-background">
                <LayoutDashboard className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-xl font-semibold leading-6">Command Center</h1>
                <p className="text-sm text-muted-foreground">
                  Launch work, continue context, and keep agent activity visible.
                </p>
              </div>
              <AgentSelector selectedAgentId={selectedAgentId} onSelectAgent={onSelectAgent} compact />
            </div>
          </div>
          <div className="grid gap-3 p-4 md:grid-cols-3">
            <Button
              type="button"
              className="h-auto justify-start gap-3 rounded-md px-3 py-3 text-left"
              onClick={() => void actions.startTextSession()}
            >
              <Plus className="h-4 w-4 shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm">Start with text</span>
                <span className="block truncate text-xs font-normal opacity-80">Draft a prompt for the selected agent</span>
              </span>
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="h-auto justify-start gap-3 rounded-md px-3 py-3 text-left"
              onClick={() => void actions.startVoiceSession()}
            >
              <Mic className="h-4 w-4 shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm">Start with voice</span>
                <span className="block truncate text-xs font-normal opacity-80">Speak a task into the agent loop</span>
              </span>
            </Button>
            <PredefinedPromptsMenu
              onSelectPrompt={(prompt) => void actions.runPrompt(prompt)}
              className="h-full min-h-[60px] justify-start rounded-md"
            />
          </div>
          <div className="grid gap-3 border-t border-border/70 p-4 lg:grid-cols-3">
            {suggestedPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => void actions.runPrompt(prompt)}
                className="min-w-0 rounded-md border border-border/70 bg-background/60 p-3 text-left text-sm leading-relaxed transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {prompt}
              </button>
            ))}
          </div>
        </HomePanel>

        <HomePanel className="p-4">
          <div className="mb-3 flex min-w-0 items-center justify-between gap-2">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold">Agents</h2>
              <p className="text-xs text-muted-foreground">{activeAgents.length} available</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => actions.navigate("/settings/agents?view=list")}
            >
              Manage
            </Button>
          </div>
          <div className="grid gap-2">
            {activeAgents.slice(0, 5).map((agent) => (
              <button
                key={agent.id}
                type="button"
                onClick={() => actions.selectAgent(agent.id)}
                className={cn(
                  "flex min-w-0 items-center justify-between gap-3 rounded-md border px-3 py-2 text-left transition-colors",
                  agent.id === data.selectedAgentId
                    ? "border-primary/40 bg-primary/10"
                    : "border-border/70 bg-background/60 hover:bg-accent/50",
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{agent.name}</span>
                  {agent.description && (
                    <span className="block truncate text-xs text-muted-foreground">{agent.description}</span>
                  )}
                </span>
                {agent.id === data.selectedAgentId ? <Badge variant="secondary" className="shrink-0">Selected</Badge> : null}
              </button>
            ))}
          </div>
        </HomePanel>
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <HomePanel>
          <div className="flex min-w-0 items-center justify-between gap-2 border-b border-border/70 px-3 py-3 sm:px-4">
            <div className="flex min-w-0 items-center gap-2">
              <FolderKanban className="h-4 w-4 text-emerald-500" />
              <h2 className="truncate text-sm font-semibold">Active Sessions</h2>
            </div>
            <Button type="button" variant="ghost" size="sm" className="shrink-0" onClick={() => actions.navigate("/sessions")}>
              Open
            </Button>
          </div>
          <div className="divide-y divide-border/60">
            {activeSessions.length > 0 ? activeSessions.map((session) => (
              <button
                key={session.id}
                type="button"
                onClick={() => actions.navigate("/sessions")}
                className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-accent/40 sm:px-4"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{session.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">{session.status}</span>
                </span>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {formatRelativeTime(session.updatedAt)}
                </span>
              </button>
            )) : (
              <div className="px-4 py-7 text-sm text-muted-foreground">No active sessions yet.</div>
            )}
          </div>
        </HomePanel>

        <HomePanel>
          <div className="flex min-w-0 items-center justify-between gap-2 border-b border-border/70 px-3 py-3 sm:px-4">
            <div className="flex min-w-0 items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              <h2 className="truncate text-sm font-semibold">Recent Conversations</h2>
            </div>
            <Button type="button" variant="ghost" size="sm" className="shrink-0" onClick={actions.openSavedConversations}>
              Browse
            </Button>
          </div>
          <div className="divide-y divide-border/60">
            {recentConversations.length > 0 ? recentConversations.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                onClick={() => void actions.continueConversation(conversation.id)}
                className="grid w-full min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-1 px-3 py-3 text-left transition-colors hover:bg-accent/40 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:px-4"
              >
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{conversation.title}</span>
                  {conversation.preview && (
                    <span className="block truncate text-xs text-muted-foreground">{conversation.preview}</span>
                  )}
                </span>
                <span className="col-start-2 shrink-0 text-xs tabular-nums text-muted-foreground sm:col-start-auto">
                  {formatRelativeTime(conversation.updatedAt)}
                </span>
              </button>
            )) : (
              <div className="px-4 py-7 text-sm text-muted-foreground">Completed conversations will appear here.</div>
            )}
          </div>
        </HomePanel>
      </div>
    </div>
  )
}

function HomeToolbar({
  activeTitle,
  isPreviewing,
  homes,
  pendingGenerationCount,
  readyGeneratedHome,
  isGenerationBlocked,
  canEditCurrent,
  onOpenGenerateNew,
  onOpenEditCurrent,
  onOpenLibrary,
  onOpenReadyHome,
  onSaveFavorite,
  onSetDefault,
  isSaving,
}: {
  activeTitle: string
  isPreviewing: boolean
  homes: HomeExperienceSummary[]
  pendingGenerationCount: number
  readyGeneratedHome?: HomeExperienceSummary | null
  isGenerationBlocked: boolean
  canEditCurrent: boolean
  onOpenGenerateNew: () => void
  onOpenEditCurrent: () => void
  onOpenLibrary: () => void
  onOpenReadyHome: (homeId: string) => void
  onSaveFavorite: () => void
  onSetDefault: () => void
  isSaving: boolean
}) {
  return (
    <div className="sticky top-0 z-30 border-b border-border bg-background/95 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex min-h-9 flex-wrap items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Home className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate text-sm font-medium">{activeTitle}</span>
          {isPreviewing ? <Badge variant="secondary">Preview</Badge> : null}
        </div>
        {isPreviewing ? (
          <>
            <Button type="button" variant="outline" size="sm" onClick={onSaveFavorite} disabled={isSaving}>
              <Save className="mr-1.5 h-3.5 w-3.5" />
              Save favorite
            </Button>
            <Button type="button" size="sm" onClick={onSetDefault} disabled={isSaving}>
              <Star className="mr-1.5 h-3.5 w-3.5" />
              Set default
            </Button>
          </>
        ) : null}
        {readyGeneratedHome ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onOpenReadyHome(readyGeneratedHome.id)}
          >
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            View generated home
          </Button>
        ) : pendingGenerationCount > 0 ? (
          <Button type="button" variant="outline" size="sm" disabled>
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            Generating home
          </Button>
        ) : null}
        <Button type="button" variant="outline" size="sm" onClick={onOpenLibrary}>
          <Star className="mr-1.5 h-3.5 w-3.5" />
          Homes ({Math.max(0, homes.length - 1)})
        </Button>
        {canEditCurrent ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenEditCurrent}
            disabled={isGenerationBlocked}
          >
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            Edit current
          </Button>
        ) : null}
        <Button type="button" size="sm" onClick={onOpenGenerateNew} disabled={isGenerationBlocked}>
          <Sparkles className="mr-1.5 h-3.5 w-3.5" />
          Generate new
        </Button>
      </div>
    </div>
  )
}

export function Component() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const layoutContext = (useOutletContext<LayoutContext>() ?? {}) as Partial<LayoutContext>
  const {
    onOpenSavedConversationsDialog = () => {},
    selectedAgentId = null,
    setSelectedAgentId = () => {},
    onStartTextSession = async () => {},
    onStartVoiceSession = async () => {},
    onStartPromptSession = async () => {},
  } = layoutContext
  const agentProgressById = useAgentStore((state) => state.agentProgressById)
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false)
  const [libraryDialogOpen, setLibraryDialogOpen] = useState(false)
  const [generationPrompt, setGenerationPrompt] = useState("")
  const [generationMode, setGenerationMode] = useState<HomeGenerationMode>("new")
  const [previewDraft, setPreviewDraft] = useState<GeneratedHomeExperience | null>(null)
  const [selectedHomeId, setSelectedHomeId] = useState<string | null>(null)
  const generationStartLockedRef = useRef(false)
  const [generationStartLocked, setGenerationStartLocked] = useState(false)
  const [homeGenerationJobs, setHomeGenerationJobs] = useState<HomeGenerationJob[]>(() => loadHomeGenerationJobs())

  useEffect(() => {
    window.localStorage.setItem(HOME_GENERATION_JOBS_STORAGE_KEY, JSON.stringify(homeGenerationJobs))
  }, [homeGenerationJobs])

  const homeListQuery = useQuery<{
    activeHomeId: string
    homes: HomeExperienceSummary[]
    root: string
  }>({
    queryKey: HOME_LIST_QUERY_KEY,
    queryFn: () => tipcClient.listHomeExperiences(),
    refetchInterval: homeGenerationJobs.length > 0 ? 2500 : false,
  })

  const activeHomeId = homeListQuery.data?.activeHomeId ?? HOME_STARTER_ID
  const displayHomeId = selectedHomeId ?? activeHomeId
  const generatedHomeQuery = useQuery<HomeExperienceRecord | null>({
    queryKey: ["home-experience", displayHomeId],
    queryFn: () => tipcClient.getHomeExperience({ id: displayHomeId }),
    enabled: displayHomeId !== HOME_STARTER_ID,
  })

  const sessionQuery = useQuery<SessionListResponse>({
    queryKey: ["agentSessions"],
    queryFn: () => tipcClient.getAgentSessions(),
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    const unlisten = rendererHandlers.agentSessionsUpdated.listen(() => {
      void sessionQuery.refetch()
    })
    return unlisten
  }, [sessionQuery])

  const savedConversationsQuery = useSavedConversationsQuery()
  const agentsQuery = useQuery<AgentProfile[]>({
    queryKey: ["agentProfilesSelector"],
    queryFn: () => tipcClient.getAgentProfiles(),
  })
  const agentsFoldersQuery = useQuery<any>({
    queryKey: ["agents-folders"],
    queryFn: () => tipcClient.getAgentsFolders(),
  })

  const homeData = useMemo<HomeViewData>(() => {
    const trackedSessions = sessionQuery.data?.activeSessions ?? []
    const mergedSessions = new Map<string, HomeSession>()
    for (const session of trackedSessions) {
      mergedSessions.set(session.id, session)
    }
    for (const [sessionId, progress] of agentProgressById.entries()) {
      const existing = mergedSessions.get(sessionId)
      mergedSessions.set(sessionId, {
        id: sessionId,
        conversationId: progress.conversationId ?? existing?.conversationId,
        conversationTitle: progress.conversationTitle ?? existing?.conversationTitle,
        status: progress.isComplete ? "completed" : existing?.status ?? "active",
        startTime: existing?.startTime,
        endTime: existing?.endTime,
      })
    }

    const activeSessions = Array.from(mergedSessions.values())
      .map((session) => {
        const progress = agentProgressById.get(session.id)
        return {
          id: session.id,
          title:
            progress?.conversationTitle?.trim() ||
            session.conversationTitle?.trim() ||
            "Untitled session",
          status: progress?.isComplete ? "completed" : session.status,
          conversationId: progress?.conversationId ?? session.conversationId,
          updatedAt:
            getProgressTimestamp(progress) ||
            session.endTime ||
            session.startTime ||
            Date.now(),
        }
      })
      .sort((a, b) => b.updatedAt - a.updatedAt)

    const recentConversations = ((savedConversationsQuery.data ?? []) as ConversationHistoryItem[])
      .slice(0, 12)
      .map((conversation) => ({
        id: conversation.id,
        title: conversation.title,
        updatedAt: conversation.updatedAt,
        preview: conversation.preview,
      }))

    const agents = (agentsQuery.data ?? []).map((agent) => ({
      id: agent.id,
      name: agent.displayName || agent.name,
      description: agent.description,
      enabled: agent.enabled,
    }))
    const metrics = [
      {
        id: "active-sessions",
        label: "Active sessions",
        value: activeSessions.filter((session) => session.status === "active").length,
        detail: "agent work in motion",
      },
      {
        id: "recent-conversations",
        label: "Recent conversations",
        value: recentConversations.length,
        detail: "available context",
      },
      {
        id: "agents",
        label: "Agents",
        value: agents.filter((agent) => agent.enabled !== false).length,
        detail: "enabled profiles",
      },
    ]
    const datasets = [{
      id: "session-activity",
      label: "Session activity",
      points: activeSessions.slice(0, 8).map((session, index) => ({
        label: session.title.slice(0, 14) || `Session ${index + 1}`,
        value: Math.max(1, Math.round((Date.now() - session.updatedAt) / 60_000)),
      })),
    }]
    const fileCandidates: Array<HomeViewData["files"][number] | null> = [
      agentsFoldersQuery.data?.workspace?.agentsDir ? {
        id: "workspace-agents",
        name: "Workspace .agents",
        path: agentsFoldersQuery.data.workspace.agentsDir,
        kind: "folder",
        status: "workspace",
      } : null,
      agentsFoldersQuery.data?.global?.agentsDir ? {
        id: "global-agents",
        name: "Global .agents",
        path: agentsFoldersQuery.data.global.agentsDir,
        kind: "folder",
        status: "global",
      } : null,
    ]
    const files = fileCandidates.filter(
      (file): file is HomeViewData["files"][number] => !!file,
    )
    const media: HomeViewData["media"] = []
    const projects = [
      {
        id: "agent-ops",
        name: "Agent Operations",
        status: activeSessions.length > 0 ? "active" : "idle",
        description: `${activeSessions.length} sessions and ${agents.length} agents`,
        updatedAt: activeSessions[0]?.updatedAt,
      },
      {
        id: "workspace",
        name: "Workspace",
        status: agentsFoldersQuery.data?.workspace?.agentsDir ? "configured" : "global-only",
        description: agentsFoldersQuery.data?.workspace?.agentsDir ?? agentsFoldersQuery.data?.global?.agentsDir ?? "No folder context",
      },
    ]

    return {
      metrics,
      datasets,
      activeSessions,
      recentConversations,
      agents,
      files,
      media,
      projects,
      selectedAgentId,
      workspace: {
        globalAgentsDir: agentsFoldersQuery.data?.global?.agentsDir ?? null,
        workspaceAgentsDir: agentsFoldersQuery.data?.workspace?.agentsDir ?? null,
      },
    }
  }, [
    agentProgressById,
    agentsFoldersQuery.data,
    agentsQuery.data,
    savedConversationsQuery.data,
    selectedAgentId,
    sessionQuery.data,
  ])

  const actions = useMemo<GeneratedHomeActions>(() => ({
    startTextSession: async (initialText?: string) => {
      if (initialText?.trim()) {
        await onStartPromptSession(initialText.trim())
        return
      }
      await onStartTextSession()
    },
    startVoiceSession: onStartVoiceSession,
    runPrompt: async (prompt: string) => {
      if (!prompt.trim()) return
      await onStartPromptSession(prompt)
    },
    continueConversation: async (conversationId: string) => {
      navigate(`/sessions/${conversationId}`)
    },
    openSavedConversations: onOpenSavedConversationsDialog,
    navigate: (path: string) => navigate(path),
    selectAgent: setSelectedAgentId,
  }), [
    navigate,
    onOpenSavedConversationsDialog,
    onStartPromptSession,
    onStartTextSession,
    onStartVoiceSession,
    setSelectedAgentId,
  ])

  const invalidateHomes = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: HOME_LIST_QUERY_KEY })
    await queryClient.invalidateQueries({ queryKey: ["home-experience"] })
  }, [queryClient])

  useEffect(() => {
    const unlisten = rendererHandlers.homeExperiencesUpdated.listen(() => {
      void invalidateHomes()
    })
    return unlisten
  }, [invalidateHomes])

  const activeGeneratedHome = generatedHomeQuery.data
  const homes = homeListQuery.data?.homes ?? []
  const readyGeneratedHome = useMemo(() => {
    const pendingSessionIds = new Set(homeGenerationJobs.map((job) => job.sessionId))
    return homes.find((home) =>
      !!home.generationSessionId &&
      pendingSessionIds.has(home.generationSessionId)
    ) ?? null
  }, [homeGenerationJobs, homes])
  const pendingGenerationCount = useMemo(() => {
    const savedGenerationSessionIds = new Set(
      homes
        .map((home) => home.generationSessionId)
        .filter((id): id is string => typeof id === "string" && id.length > 0),
    )
    return homeGenerationJobs.filter((job) => !savedGenerationSessionIds.has(job.sessionId)).length
  }, [homeGenerationJobs, homes])
  const hasActiveHomeGeneration = generationStartLocked || pendingGenerationCount > 0

  const generateMutation = useMutation({
    mutationFn: async (request: HomeGenerationRequest) => {
      if (pendingGenerationCount > 0) {
        throw new Error("Home generation is already running.")
      }

      const sourceHome = request.mode === "edit" && activeGeneratedHome
        ? {
            id: activeGeneratedHome.summary.id,
            title: activeGeneratedHome.summary.title,
            description: activeGeneratedHome.summary.description,
            tags: activeGeneratedHome.summary.tags,
            tsx: activeGeneratedHome.tsx,
            css: activeGeneratedHome.css,
          }
        : undefined

      if (request.mode === "edit" && !sourceHome) {
        throw new Error("Select a generated home before editing it.")
      }

      return tipcClient.generateHomeExperience({
        prompt: request.prompt,
        mode: request.mode,
        context: {
          prompt: request.prompt,
          ...(sourceHome ? { sourceHome } : {}),
          metrics: homeData.metrics,
          datasets: homeData.datasets,
          activeSessions: homeData.activeSessions.slice(0, 8),
          recentConversations: homeData.recentConversations.slice(0, 8),
          agents: homeData.agents.slice(0, 12),
          files: homeData.files.slice(0, 12),
          media: homeData.media.slice(0, 8),
          projects: homeData.projects.slice(0, 8),
          workspace: homeData.workspace,
        },
      }) as Promise<HomeGenerationResult>
    },
    onSuccess: (started, request) => {
      setHomeGenerationJobs((jobs) => [
        {
          conversationId: started.conversationId,
          sessionId: started.sessionId,
          prompt: request.prompt,
          mode: request.mode,
          sourceHomeId: request.mode === "edit" ? activeGeneratedHome?.summary.id : undefined,
          startedAt: Date.now(),
        },
        ...jobs.filter((job) => job.sessionId !== started.sessionId),
      ])
      setGenerateDialogOpen(false)
      if (started.status === "already-running") {
        toast.info("Home generation is already running.")
        return
      }
      toast.success(request.mode === "edit"
        ? "Home edit started. You can keep using the app."
        : "Home generation started. You can keep using the app.")
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to generate home")
    },
    onSettled: () => {
      generationStartLockedRef.current = false
      setGenerationStartLocked(false)
    },
  })

  const saveDraftMutation = useMutation({
    mutationFn: async (input: {
      draft: GeneratedHomeExperience
      makeDefault?: boolean
    }) => {
      const saved = await tipcClient.saveHomeDraft({
        ...input.draft,
        favorite: true,
        generatedFrom: generationPrompt,
      }) as HomeExperienceRecord
      if (input.makeDefault) {
        await tipcClient.promoteHomeExperience({
          id: saved.summary.id,
          makeDefault: true,
          favorite: true,
        })
      }
      return saved
    },
    onSuccess: async (_, variables) => {
      await invalidateHomes()
      setPreviewDraft(null)
      toast.success(variables.makeDefault ? "Home saved as default" : "Home saved to favorites")
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to save home")
    },
  })

  const promoteMutation = useMutation({
    mutationFn: (input: { id: string; makeDefault?: boolean; favorite?: boolean }) =>
      tipcClient.promoteHomeExperience(input),
    onSuccess: async () => {
      await invalidateHomes()
      toast.success("Home updated")
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update home")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tipcClient.deleteHomeExperience({ id }),
    onSuccess: async () => {
      await invalidateHomes()
      toast.success("Home deleted")
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to delete home")
    },
  })

  const activeTitle = previewDraft?.title || activeGeneratedHome?.summary.title || "Command Center"

  const openGeneratedHome = useCallback((homeId: string) => {
    const home = homes.find((candidate) => candidate.id === homeId)
    setSelectedHomeId(homeId)
    setPreviewDraft(null)
    if (home?.generationSessionId) {
      setHomeGenerationJobs((jobs) =>
        jobs.filter((job) => job.sessionId !== home.generationSessionId)
      )
    }
  }, [homes])

  const openNewGenerationDialog = useCallback(() => {
    if (hasActiveHomeGeneration) {
      toast.info("Home generation is already running.")
      return
    }
    setGenerationMode("new")
    setGenerationPrompt("")
    setGenerateDialogOpen(true)
  }, [hasActiveHomeGeneration])

  const openEditCurrentDialog = useCallback(() => {
    if (hasActiveHomeGeneration) {
      toast.info("Home generation is already running.")
      return
    }
    setGenerationMode("edit")
    setGenerationPrompt("")
    setGenerateDialogOpen(true)
  }, [hasActiveHomeGeneration])

  const submitHomeGeneration = useCallback(() => {
    const prompt = generationPrompt.trim()
    if (!prompt) return

    if (generationStartLockedRef.current || pendingGenerationCount > 0) {
      toast.info("Home generation is already running.")
      setGenerateDialogOpen(false)
      return
    }

    generationStartLockedRef.current = true
    setGenerationStartLocked(true)
    generateMutation.mutate({
      prompt,
      mode: generationMode,
    })
  }, [
    generateMutation,
    generationMode,
    generationPrompt,
    pendingGenerationCount,
  ])

  const starterFallback = (
    <StarterHome
      data={homeData}
      actions={actions}
      selectedAgentId={selectedAgentId}
      onSelectAgent={setSelectedAgentId}
    />
  )

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <HomeToolbar
        activeTitle={activeTitle}
        isPreviewing={!!previewDraft}
        homes={homes}
        pendingGenerationCount={pendingGenerationCount}
        readyGeneratedHome={readyGeneratedHome}
        isGenerationBlocked={hasActiveHomeGeneration}
        canEditCurrent={!!activeGeneratedHome}
        onOpenGenerateNew={openNewGenerationDialog}
        onOpenEditCurrent={openEditCurrentDialog}
        onOpenLibrary={() => setLibraryDialogOpen(true)}
        onOpenReadyHome={openGeneratedHome}
        onSaveFavorite={() => previewDraft && saveDraftMutation.mutate({ draft: previewDraft })}
        onSetDefault={() => previewDraft && saveDraftMutation.mutate({ draft: previewDraft, makeDefault: true })}
        isSaving={saveDraftMutation.isPending}
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        {previewDraft ? (
          <GeneratedHomeRenderer
            source={previewDraft}
            data={homeData}
            actions={actions}
            fallback={starterFallback}
          />
        ) : activeGeneratedHome ? (
          <GeneratedHomeRenderer
            source={{
              title: activeGeneratedHome.summary.title,
              description: activeGeneratedHome.summary.description,
              tags: activeGeneratedHome.summary.tags,
              tsx: activeGeneratedHome.tsx,
              css: activeGeneratedHome.css,
            }}
            data={homeData}
            actions={actions}
            fallback={starterFallback}
          />
        ) : (
          starterFallback
        )}
      </div>

      <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{generationMode === "edit" ? "Edit Current Home" : "Generate New Home"}</DialogTitle>
            <DialogDescription>
              {generationMode === "edit"
                ? "Describe the changes to make. DotAgents starts a normal agent session with the current generated home as source material."
                : "Describe the interface you want. DotAgents starts a normal agent session without using the current generated home as source material."}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={generationPrompt}
            onChange={(event) => setGenerationPrompt(event.target.value)}
            placeholder={generationMode === "edit"
              ? "Example: keep the project dashboard, but add a video review lane and make chart trends more prominent."
              : "Example: make a home for coordinating video edits, recent files, active agents, and project status."}
            className="min-h-[150px]"
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setGenerateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={submitHomeGeneration}
              disabled={hasActiveHomeGeneration || generateMutation.isPending || !generationPrompt.trim()}
            >
              {generationMode === "edit"
                ? <Pencil className="mr-1.5 h-3.5 w-3.5" />
                : <Sparkles className="mr-1.5 h-3.5 w-3.5" />}
              {hasActiveHomeGeneration || generateMutation.isPending
                ? "Agent generating..."
                : generationMode === "edit"
                  ? "Start edit session"
                  : "Start generation session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={libraryDialogOpen} onOpenChange={setLibraryDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Home Experiences</DialogTitle>
            <DialogDescription>
              Favorites and defaults are stored globally in ~/.agents/layouts/home.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            {homes.map((home) => (
              <div
                key={home.id}
                className="flex min-w-0 flex-wrap items-center gap-3 rounded-lg border border-border/70 bg-card/70 p-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="truncate text-sm font-semibold">{home.title}</div>
                    <Badge variant={home.isDefault ? "default" : "secondary"}>{home.status}</Badge>
                  </div>
                  {home.description ? (
                    <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{home.description}</div>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={home.isDefault || promoteMutation.isPending}
                    onClick={() => promoteMutation.mutate({ id: home.id, makeDefault: true, favorite: true })}
                  >
                    <Star className="mr-1.5 h-3.5 w-3.5" />
                    Default
                  </Button>
                  {home.id !== HOME_STARTER_ID ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={deleteMutation.isPending}
                      onClick={() => deleteMutation.mutate(home.id)}
                      title="Delete home"
                      aria-label={`Delete ${home.title}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
