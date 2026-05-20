import fs from "fs"
import path from "path"
import { randomUUID } from "crypto"
import vm from "node:vm"
import { createRequire } from "node:module"
import {
  HOME_STARTER_ID,
  buildStarterHomeSummary,
  normalizeHomeTags,
  validateHomeExperienceSource,
  type GeneratedHomeExperience,
  type HomeExperienceManifest,
  type HomeExperienceManifestItem,
  type HomeExperienceRecord,
  type HomeExperienceSummary,
  type HomeGenerationContext,
  type HomeGenerationMode,
} from "../shared/home-experience"
import { globalAgentsFolder } from "./config"
import { getAgentsLayerPaths } from "./agents-files/modular-config"
import {
  safeReadJsonFileSync,
  safeWriteFileSync,
  safeWriteJsonFileSync,
} from "./agents-files/safe-file"

const HOME_LAYOUTS_DIR = "home"
const HOME_MANIFEST_FILE = "index.json"
const HOME_TSX_FILE = "home.tsx"
const HOME_CSS_FILE = "style.css"
const require = createRequire(import.meta.url)

type BabelStandalone = {
  transform: (
    source: string,
    options: Record<string, unknown>,
  ) => { code?: string | null }
}

let babelStandalone: BabelStandalone | null = null

type SaveHomeDraftInput = GeneratedHomeExperience & {
  favorite?: boolean
  generatedFrom?: string
  generationSessionId?: string
  generationConversationId?: string
}

type PromoteHomeExperienceInput = {
  id: string
  makeDefault?: boolean
  favorite?: boolean
}

function createEmptyManifest(): HomeExperienceManifest {
  return {
    version: 1,
    activeHomeId: HOME_STARTER_ID,
    items: [],
  }
}

function normalizeString(value: unknown, fallback: string = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback
}

function normalizeManifest(raw: unknown): HomeExperienceManifest {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return createEmptyManifest()
  const record = raw as Partial<HomeExperienceManifest>
  const items = Array.isArray(record.items)
    ? record.items
        .filter((item): item is HomeExperienceManifestItem => {
          if (!item || typeof item !== "object" || Array.isArray(item)) return false
          const candidate = item as Partial<HomeExperienceManifestItem>
          return typeof candidate.id === "string" && typeof candidate.title === "string"
        })
        .map((item) => ({
          id: item.id,
          title: normalizeString(item.title, "Untitled Home"),
          description: normalizeString(item.description),
          tags: normalizeHomeTags(item.tags),
          favorite: item.favorite === true,
          createdAt: typeof item.createdAt === "number" ? item.createdAt : Date.now(),
          updatedAt: typeof item.updatedAt === "number" ? item.updatedAt : Date.now(),
          generatedFrom: normalizeString(item.generatedFrom),
          generationSessionId: normalizeString(item.generationSessionId),
          generationConversationId: normalizeString(item.generationConversationId),
        }))
    : []

  const activeHomeId =
    typeof record.activeHomeId === "string" && record.activeHomeId.trim()
      ? record.activeHomeId.trim()
      : HOME_STARTER_ID

  return {
    version: 1,
    activeHomeId,
    items,
  }
}

function slugifyHomeId(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
  return slug || "home"
}

function isValidHomeId(id: string): boolean {
  return /^[a-z0-9][a-z0-9-]{0,80}$/.test(id)
}

function normalizeGeneratedHome(value: unknown): GeneratedHomeExperience {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Generated home response was not an object")
  }

  const record = value as Record<string, unknown>
  const generated = {
    title: normalizeString(record.title, "Generated Home"),
    description: normalizeString(record.description),
    tags: normalizeHomeTags(record.tags),
    tsx: typeof record.tsx === "string" ? record.tsx : "",
    css: typeof record.css === "string" ? record.css : "",
  }

  const validation = validateHomeExperienceSource(generated)
  if (!validation.ok) {
    throw new Error(validation.errors.join(" "))
  }
  validateHomeExperienceRuntime(generated)

  return generated
}

function getBabelStandalone(): BabelStandalone {
  if (!babelStandalone) {
    babelStandalone = require("@babel/standalone") as BabelStandalone
  }
  return babelStandalone
}

function createProbeHomeData(): HomeGenerationContext & {
  activeSessions: NonNullable<HomeGenerationContext["activeSessions"]>
  recentConversations: NonNullable<HomeGenerationContext["recentConversations"]>
  agents: NonNullable<HomeGenerationContext["agents"]>
  workspace: NonNullable<HomeGenerationContext["workspace"]>
} {
  return {
    prompt: "Validate generated home",
    metrics: [
      { id: "sessions", label: "Sessions", value: 3, detail: "active" },
      { id: "clips", label: "Clips", value: 8, detail: "ready for review" },
    ],
    datasets: [{
      id: "throughput",
      label: "Throughput",
      points: [
        { label: "Mon", value: 4 },
        { label: "Tue", value: 7 },
        { label: "Wed", value: 5 },
      ],
    }],
    activeSessions: [{
      id: "session-1",
      title: "Active validation session",
      status: "active",
      conversationId: "conversation-1",
    }],
    recentConversations: [{
      id: "conversation-1",
      title: "Recent validation conversation",
      updatedAt: Date.now(),
      preview: "A recent agent run",
    }],
    agents: [{
      id: "agent-1",
      name: "Builder",
      description: "Validation agent",
      enabled: true,
    }],
    files: [{
      id: "file-1",
      name: "demo.mp4",
      path: "/tmp/demo.mp4",
      kind: "video",
      status: "review",
      updatedAt: Date.now(),
    }],
    media: [{
      id: "media-1",
      title: "Demo clip",
      url: "",
      kind: "video",
      updatedAt: Date.now(),
    }],
    projects: [{
      id: "project-1",
      name: "Launch edit",
      status: "in_progress",
      description: "Video and agent workflow",
      updatedAt: Date.now(),
    }],
    workspace: {
      globalAgentsDir: "~/.agents",
      workspaceAgentsDir: ".agents",
    },
  }
}

function validateHomeExperienceRuntime(generated: GeneratedHomeExperience): void {
  let transformed: string | undefined | null
  try {
    transformed = getBabelStandalone().transform(generated.tsx, {
      filename: "generated-home.tsx",
      sourceType: "module",
      presets: [
        ["typescript", { isTSX: true, allExtensions: true }],
        ["react", { runtime: "classic" }],
      ],
      plugins: ["transform-modules-commonjs"],
    }).code
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Generated home did not compile: ${message}`)
  }

  if (!transformed?.trim()) {
    throw new Error("Generated home did not compile to JavaScript.")
  }

  const exportsObject: Record<string, unknown> = {}
  const context = vm.createContext({
    exports: exportsObject,
    module: { exports: exportsObject },
  })
  const probeData = JSON.stringify(createProbeHomeData())
  const script = `
const __noop = () => null;
const __componentStub = () => null;
const __iconStub = () => null;
let __renderDepth = 0;
const React = {
  Fragment: "fragment",
  createElement(type, props, ...children) {
    if (typeof type === "function" && type !== __componentStub && type !== __iconStub) {
      if (__renderDepth > 20) throw new Error("Generated home nested render depth exceeded");
      __renderDepth += 1;
      try {
        return type(Object.assign({}, props, { children }));
      } finally {
        __renderDepth -= 1;
      }
    }
    return { type, props, children };
  },
  useCallback(value) { return value; },
  useEffect() {},
  useId() { return "generated-home-validation-id"; },
  useMemo(factory) { return factory(); },
  useRef(value) { return { current: value }; },
  useState(value) { return [typeof value === "function" ? value() : value, __noop]; },
};
${transformed}
const __GeneratedHome = exports.default || module.exports.default;
if (typeof __GeneratedHome !== "function") {
  throw new Error("Generated home default export was not a React component");
}
const data = ${probeData};
const actions = {
  startTextSession: __noop,
  startVoiceSession: __noop,
  runPrompt: __noop,
  continueConversation: __noop,
  openSavedConversations: __noop,
  navigate: __noop,
  selectAgent: __noop,
};
const ui = new Proxy({
  Button: __componentStub,
  Badge: __componentStub,
  Panel: __componentStub,
  Card: __componentStub,
  CardContent: __componentStub,
  CardDescription: __componentStub,
  CardHeader: __componentStub,
  CardTitle: __componentStub,
  Chart: __componentStub,
  FileList: __componentStub,
  Input: __componentStub,
  Metric: __componentStub,
  ProjectBoard: __componentStub,
  ScrollArea: __componentStub,
  Slider: __componentStub,
  Sparkline: __componentStub,
  Switch: __componentStub,
  Tabs: __componentStub,
  TabsContent: __componentStub,
  TabsList: __componentStub,
  TabsTrigger: __componentStub,
  Textarea: __componentStub,
  VideoPlayer: __componentStub,
}, { get(target, prop) { return prop in target ? target[prop] : __componentStub; } });
const icons = new Proxy({}, { get() { return __iconStub; } });
__GeneratedHome({ data, actions, ui, icons });
`

  try {
    vm.runInContext(script, context, { timeout: 250 })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Generated home failed runtime validation: ${message}`)
  }
}

function extractJsonObject(raw: string): unknown {
  const trimmed = raw.trim()
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)
  const candidate = fenced?.[1]?.trim() || trimmed

  try {
    return JSON.parse(candidate)
  } catch {
    const firstBrace = candidate.indexOf("{")
    const lastBrace = candidate.lastIndexOf("}")
    if (firstBrace < 0 || lastBrace <= firstBrace) throw new Error("Generated home response was not valid JSON")
    return JSON.parse(candidate.slice(firstBrace, lastBrace + 1))
  }
}

function buildHomeGenerationPrompt(input: {
  prompt: string
  mode?: HomeGenerationMode
  context?: HomeGenerationContext
}): string {
  const mode: HomeGenerationMode = input.mode ?? (input.context?.sourceHome ? "edit" : "new")
  const { sourceHome, ...dataContext } = input.context ?? {}
  const contextJson = JSON.stringify(dataContext, null, 2).slice(0, 12_000)
  const sourceHomeJson = mode === "edit" && sourceHome
    ? JSON.stringify(sourceHome, null, 2).slice(0, 60_000)
    : ""
  const modeInstructions = mode === "edit"
    ? [
        "Mode: edit the current generated home.",
        "Use the provided source home as the starting point. Preserve useful structure unless the user asks for a larger redesign.",
        "Return a complete replacement TSX/CSS payload, not a patch.",
      ]
    : [
        "Mode: create a new generated home.",
        "No current home TSX/CSS is supplied for new generation. Do not continue, imitate, or constrain yourself to the currently selected home unless the user explicitly asks for that.",
      ]

  return [
    "You are running as a normal DotAgents agent session whose only job is to generate a home page experience.",
    "Create a DotAgents home page experience as a single React component. Do not assume the home must be conversation-focused.",
    "The home page can be any purpose-built interface: data visualization, charts, project orchestration, multi-agent operations, file browsing, video playback/review/editing surfaces, dashboards, or a custom workflow for the user's request.",
    ...modeInstructions,
    "Before your final answer, use the available agent tools for at least one relevant read-only inspection or discovery step when any suitable tool is available.",
    "Do not skip directly to the final answer unless no suitable read-only/discovery tool exists.",
    "Tool calls are for discovery only; your final assistant message must still be parseable JSON only.",
    "Your final assistant message must be JSON only so the app can parse it directly.",
    "",
    "Return JSON only with this exact shape:",
    "{",
    '  "title": "short name",',
    '  "description": "one sentence",',
    '  "tags": ["agent", "dashboard"],',
    '  "tsx": "export default function Home({ data, actions, ui, icons }) { return <div /> }",',
    '  "css": "optional CSS"',
    "}",
    "",
    "Generated TSX rules:",
    "- No imports, no require, no window/document/process/globalThis/Electron/IPC access.",
    "- Export a default React component.",
    "- Use only props: data, actions, ui, icons.",
    "- You may use JSX, React hooks through React.useMemo/useState/etc., Tailwind classes, SVG, video/audio elements, and plain HTML elements.",
    "- Define any local components, helper functions, mockable view state, SVG charts, media controls, boards, timelines, inspectors, and layout primitives you need inside the TSX.",
    "- The ui and icons props are optional accelerators, not boundaries. If a primitive is missing, create or extend it locally in the generated component.",
    "- Do not narrow the design to recent conversations unless that is actually the user's desired use case.",
    "- If the relevant data is sparse or empty, design useful empty states and workflow controls for the requested domain instead of pivoting back to conversations.",
    "- Prefer compact operational UI over marketing copy.",
    "- Do not include explanatory text outside the JSON.",
    "",
    "Available actions:",
    "- actions.startTextSession(initialText?)",
    "- actions.startVoiceSession()",
    "- actions.runPrompt(prompt)",
    "- actions.continueConversation(conversationId)",
    "- actions.openSavedConversations()",
    "- actions.navigate(path)",
    "- actions.selectAgent(agentIdOrNull)",
    "",
    "Available data shape may include:",
    "- data.metrics, data.datasets, data.projects, data.files, data.media",
    "- data.activeSessions, data.recentConversations, data.agents, data.workspace",
    "",
    "Available ui helpers include, but are not limited to:",
    "- ui.Button, ui.Badge, ui.Panel, ui.Card, ui.Metric, ui.Chart, ui.Sparkline, ui.VideoPlayer, ui.FileList, ui.ProjectBoard, ui.Input, ui.Textarea, ui.Slider, ui.Switch, ui.Tabs, ui.ScrollArea",
    "",
    "Available icons:",
    "- icons exposes the Lucide icon namespace. Use common icons by name when helpful, but fall back to text or local shapes if an icon is unavailable.",
    "",
    `User request: ${input.prompt}`,
    "",
    "Available app/workspace data snapshot:",
    contextJson,
    ...(sourceHomeJson
      ? [
          "",
          "Current generated home source to edit:",
          sourceHomeJson,
        ]
      : []),
  ].join("\n")
}

class HomeExperienceService {
  getHomeRoot(): string {
    return path.join(globalAgentsFolder, "layouts", HOME_LAYOUTS_DIR)
  }

  private getManifestPath(): string {
    return path.join(this.getHomeRoot(), HOME_MANIFEST_FILE)
  }

  private getBackupsDir(): string {
    return getAgentsLayerPaths(globalAgentsFolder).backupsDir
  }

  private ensureHomeRoot(): void {
    fs.mkdirSync(this.getHomeRoot(), { recursive: true })
  }

  private getHomeDir(id: string): string {
    if (!isValidHomeId(id)) throw new Error("Invalid home experience id")
    return path.join(this.getHomeRoot(), id)
  }

  private readManifest(): HomeExperienceManifest {
    this.ensureHomeRoot()
    const manifest = safeReadJsonFileSync<HomeExperienceManifest>(this.getManifestPath(), {
      backupDir: this.getBackupsDir(),
      defaultValue: createEmptyManifest(),
    })
    return normalizeManifest(manifest)
  }

  private writeManifest(manifest: HomeExperienceManifest): void {
    this.ensureHomeRoot()
    safeWriteJsonFileSync(this.getManifestPath(), normalizeManifest(manifest), {
      backupDir: this.getBackupsDir(),
      maxBackups: 10,
      pretty: true,
      skipIfUnchanged: true,
    })
  }

  private toSummary(item: HomeExperienceManifestItem, activeHomeId?: string | null): HomeExperienceSummary {
    const isDefault = activeHomeId === item.id
    const status = isDefault ? "default" : item.favorite ? "favorite" : "draft"
    return {
      ...item,
      status,
      isDefault,
      sourcePath: path.join(this.getHomeDir(item.id), HOME_TSX_FILE),
    }
  }

  listHomeExperiences(): { activeHomeId: string; homes: HomeExperienceSummary[]; root: string } {
    const manifest = this.readManifest()
    const generatedHomes = manifest.items
      .map((item) => this.toSummary(item, manifest.activeHomeId))
      .sort((a, b) => {
        if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1
        if (a.favorite !== b.favorite) return a.favorite ? -1 : 1
        return b.updatedAt - a.updatedAt
      })

    const starter = {
      ...buildStarterHomeSummary(),
      isDefault: !manifest.activeHomeId || manifest.activeHomeId === HOME_STARTER_ID,
      status: (!manifest.activeHomeId || manifest.activeHomeId === HOME_STARTER_ID)
        ? "default"
        : "starter",
    } satisfies HomeExperienceSummary

    return {
      activeHomeId: manifest.activeHomeId || HOME_STARTER_ID,
      homes: [starter, ...generatedHomes],
      root: this.getHomeRoot(),
    }
  }

  getHomeExperience(id?: string | null): HomeExperienceRecord | null {
    const manifest = this.readManifest()
    const requestedId = id || manifest.activeHomeId || HOME_STARTER_ID
    if (requestedId === HOME_STARTER_ID) return null
    if (!isValidHomeId(requestedId)) return null

    const item = manifest.items.find((candidate) => candidate.id === requestedId)
    if (!item) return null

    const homeDir = this.getHomeDir(item.id)
    const tsxPath = path.join(homeDir, HOME_TSX_FILE)
    if (!fs.existsSync(tsxPath)) return null
    const tsx = fs.readFileSync(tsxPath, "utf8")
    const css = fs.existsSync(path.join(homeDir, HOME_CSS_FILE))
      ? fs.readFileSync(path.join(homeDir, HOME_CSS_FILE), "utf8")
      : ""
    const record = {
      summary: this.toSummary(item, manifest.activeHomeId),
      tsx,
      css,
    }

    try {
      const validation = validateHomeExperienceSource({
        title: record.summary.title,
        tsx: record.tsx,
        css: record.css,
      })
      if (!validation.ok) return null
    } catch {
      return null
    }

    return record
  }

  saveHomeDraft(input: SaveHomeDraftInput): HomeExperienceRecord {
    const validation = validateHomeExperienceSource(input)
    if (!validation.ok) {
      throw new Error(validation.errors.join(" "))
    }
    validateHomeExperienceRuntime({
      title: input.title,
      description: input.description,
      tags: input.tags,
      tsx: input.tsx,
      css: input.css,
    })

    const now = Date.now()
    const id = `${slugifyHomeId(input.title)}-${now.toString(36)}-${randomUUID().slice(0, 8)}`
    const item: HomeExperienceManifestItem = {
      id,
      title: input.title.trim(),
      description: normalizeString(input.description),
      tags: normalizeHomeTags(input.tags),
      favorite: input.favorite === true,
      createdAt: now,
      updatedAt: now,
      generatedFrom: normalizeString(input.generatedFrom),
      generationSessionId: normalizeString(input.generationSessionId),
      generationConversationId: normalizeString(input.generationConversationId),
    }

    const homeDir = this.getHomeDir(id)
    fs.mkdirSync(homeDir, { recursive: true })
    safeWriteFileSync(path.join(homeDir, HOME_TSX_FILE), input.tsx, {
      backupDir: this.getBackupsDir(),
      maxBackups: 10,
      encoding: "utf8",
      skipIfUnchanged: true,
    })
    safeWriteFileSync(path.join(homeDir, HOME_CSS_FILE), input.css || "", {
      backupDir: this.getBackupsDir(),
      maxBackups: 10,
      encoding: "utf8",
      skipIfUnchanged: true,
    })

    const manifest = this.readManifest()
    manifest.items = [item, ...manifest.items.filter((existing) => existing.id !== id)]
    this.writeManifest(manifest)

    return {
      summary: this.toSummary(item, manifest.activeHomeId),
      tsx: input.tsx,
      css: input.css || "",
    }
  }

  promoteHomeExperience(input: PromoteHomeExperienceInput): HomeExperienceSummary {
    if (input.id !== HOME_STARTER_ID && !isValidHomeId(input.id)) {
      throw new Error("Invalid home experience id")
    }

    const manifest = this.readManifest()
    if (input.id === HOME_STARTER_ID) {
      manifest.activeHomeId = HOME_STARTER_ID
      this.writeManifest(manifest)
      return {
        ...buildStarterHomeSummary(),
        status: "default",
        isDefault: true,
      }
    }

    const item = manifest.items.find((candidate) => candidate.id === input.id)
    if (!item) throw new Error("Home experience not found")

    item.favorite = input.favorite ?? true
    item.updatedAt = Date.now()
    if (input.makeDefault) {
      manifest.activeHomeId = item.id
      item.favorite = true
    }
    this.writeManifest(manifest)
    return this.toSummary(item, manifest.activeHomeId)
  }

  deleteHomeExperience(id: string): { success: true; activeHomeId: string } {
    if (!isValidHomeId(id)) throw new Error("Invalid home experience id")
    const manifest = this.readManifest()
    manifest.items = manifest.items.filter((item) => item.id !== id)
    if (manifest.activeHomeId === id) {
      manifest.activeHomeId = HOME_STARTER_ID
    }
    this.writeManifest(manifest)

    fs.rmSync(this.getHomeDir(id), { recursive: true, force: true })
    return { success: true, activeHomeId: manifest.activeHomeId || HOME_STARTER_ID }
  }

  buildGenerationPrompt(input: {
    prompt: string
    mode?: HomeGenerationMode
    context?: HomeGenerationContext
  }): string {
    const prompt = normalizeString(input.prompt)
    if (!prompt) throw new Error("Prompt is required")

    return buildHomeGenerationPrompt({ prompt, mode: input.mode, context: input.context })
  }

  parseGeneratedHomeResponse(raw: string): GeneratedHomeExperience {
    return normalizeGeneratedHome(extractJsonObject(raw))
  }
}

export const homeExperienceService = new HomeExperienceService()
