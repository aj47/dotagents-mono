export const HOME_STARTER_ID = "starter-command-center"

export type HomeExperienceStatus = "starter" | "draft" | "favorite" | "default"

export type HomeExperienceManifestItem = {
  id: string
  title: string
  description?: string
  tags?: string[]
  favorite?: boolean
  createdAt: number
  updatedAt: number
  generatedFrom?: string
  generationSessionId?: string
  generationConversationId?: string
}

export type HomeExperienceManifest = {
  version: 1
  activeHomeId?: string | null
  items: HomeExperienceManifestItem[]
}

export type HomeExperienceSummary = HomeExperienceManifestItem & {
  status: HomeExperienceStatus
  isDefault: boolean
  sourcePath?: string
}

export type HomeExperienceRecord = {
  summary: HomeExperienceSummary
  tsx: string
  css?: string
}

export type GeneratedHomeExperience = {
  title: string
  description?: string
  tags?: string[]
  tsx: string
  css?: string
}

export type HomeGenerationMode = "new" | "edit"

export type HomeGenerationContext = {
  prompt?: string
  sourceHome?: {
    id?: string
    title: string
    description?: string
    tags?: string[]
    tsx: string
    css?: string
  }
  metrics?: Array<{
    id: string
    label: string
    value: number | string
    detail?: string
  }>
  datasets?: Array<{
    id: string
    label: string
    points: Array<{
      label: string
      value: number
      color?: string
    }>
  }>
  activeSessions?: Array<{
    id: string
    title?: string
    status?: string
    conversationId?: string
  }>
  recentConversations?: Array<{
    id: string
    title: string
    updatedAt: number
    preview?: string
  }>
  agents?: Array<{
    id: string
    name: string
    description?: string
    enabled?: boolean
  }>
  files?: Array<{
    id: string
    name: string
    path?: string
    kind?: string
    status?: string
    updatedAt?: number
  }>
  media?: Array<{
    id: string
    title: string
    url?: string
    poster?: string
    kind?: "video" | "audio" | "image" | "other"
    updatedAt?: number
  }>
  projects?: Array<{
    id: string
    name: string
    status?: string
    description?: string
    updatedAt?: number
  }>
  workspace?: {
    globalAgentsDir?: string | null
    workspaceAgentsDir?: string | null
  }
}

export type HomeValidationResult = {
  ok: boolean
  errors: string[]
}

const MAX_HOME_TSX_CHARS = 120_000
const MAX_HOME_CSS_CHARS = 60_000

const FORBIDDEN_SOURCE_PATTERNS: Array<{ pattern: RegExp; message: string }> = [
  { pattern: /^\s*import\s/m, message: "Imports are not allowed in generated home TSX." },
  { pattern: /\bimport\s*\(/, message: "Dynamic import is not allowed in generated home TSX." },
  { pattern: /\brequire\s*\(/, message: "require() is not allowed in generated home TSX." },
  { pattern: /\bwindow\b/, message: "window access is not allowed in generated home TSX." },
  { pattern: /\bdocument\b/, message: "document access is not allowed in generated home TSX." },
  { pattern: /\belectron\b/i, message: "Electron APIs are not allowed in generated home TSX." },
  { pattern: /\bipcRenderer\b/, message: "IPC APIs are not allowed in generated home TSX." },
  { pattern: /\bprocess\b/, message: "process access is not allowed in generated home TSX." },
  { pattern: /\bglobalThis\b/, message: "globalThis access is not allowed in generated home TSX." },
  { pattern: /\beval\s*\(/, message: "eval() is not allowed in generated home TSX." },
  { pattern: /\bFunction\s*\(/, message: "Function() is not allowed in generated home TSX." },
  { pattern: /\bconstructor\s*\.\s*constructor\b/, message: "constructor.constructor is not allowed in generated home TSX." },
  { pattern: /\bfetch\s*\(/, message: "Network fetch is not allowed in generated home TSX." },
  { pattern: /\bXMLHttpRequest\b/, message: "XMLHttpRequest is not allowed in generated home TSX." },
  { pattern: /\bWebSocket\b/, message: "WebSocket is not allowed in generated home TSX." },
  { pattern: /\bWorker\b/, message: "Workers are not allowed in generated home TSX." },
  { pattern: /\blocalStorage\b/, message: "localStorage is not allowed in generated home TSX." },
  { pattern: /\bsessionStorage\b/, message: "sessionStorage is not allowed in generated home TSX." },
  { pattern: /\bindexedDB\b/, message: "indexedDB is not allowed in generated home TSX." },
  { pattern: /javascript\s*:/i, message: "javascript: URLs are not allowed in generated home TSX." },
]

const FORBIDDEN_CSS_PATTERNS: Array<{ pattern: RegExp; message: string }> = [
  { pattern: /@import\b/i, message: "@import is not allowed in generated home CSS." },
  { pattern: /url\s*\(/i, message: "url() is not allowed in generated home CSS." },
  { pattern: /expression\s*\(/i, message: "CSS expressions are not allowed in generated home CSS." },
  { pattern: /javascript\s*:/i, message: "javascript: URLs are not allowed in generated home CSS." },
]

export function normalizeHomeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return []
  return tags
    .map((tag) => String(tag ?? "").trim())
    .filter(Boolean)
    .slice(0, 8)
}

export function validateHomeExperienceSource(input: {
  title?: unknown
  tsx?: unknown
  css?: unknown
}): HomeValidationResult {
  const errors: string[] = []
  const title = typeof input.title === "string" ? input.title.trim() : ""
  const tsx = typeof input.tsx === "string" ? input.tsx : ""
  const css = typeof input.css === "string" ? input.css : ""

  if (!title) errors.push("Generated home title is required.")
  if (!tsx.trim()) errors.push("Generated home TSX is required.")
  if (tsx.length > MAX_HOME_TSX_CHARS) errors.push("Generated home TSX is too large.")
  if (css.length > MAX_HOME_CSS_CHARS) errors.push("Generated home CSS is too large.")
  if (!/\bexport\s+default\b/.test(tsx)) {
    errors.push("Generated home TSX must export a default React component.")
  }

  for (const rule of FORBIDDEN_SOURCE_PATTERNS) {
    if (rule.pattern.test(tsx)) errors.push(rule.message)
  }

  for (const rule of FORBIDDEN_CSS_PATTERNS) {
    if (rule.pattern.test(css)) errors.push(rule.message)
  }

  return { ok: errors.length === 0, errors }
}

export function buildStarterHomeSummary(): HomeExperienceSummary {
  const now = 0
  return {
    id: HOME_STARTER_ID,
    title: "Command Center",
    description: "Default DotAgents home for launching work, reviewing activity, and picking agents.",
    tags: ["starter", "agents"],
    favorite: true,
    createdAt: now,
    updatedAt: now,
    status: "starter",
    isDefault: true,
  }
}
