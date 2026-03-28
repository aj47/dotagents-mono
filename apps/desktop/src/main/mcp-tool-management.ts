import type { DetailedToolInfo } from "../shared/types"

interface McpToolSelectionCandidate {
  name: string
}

interface McpToolSourceSelectionCandidate {
  sourceName: string
  sourceLabel: string
}

export interface ManagedMcpToolDetails extends DetailedToolInfo {}

export interface ManagedMcpToolSourceSummary {
  sourceName: string
  sourceLabel: string
  sourceKind: ManagedMcpToolDetails["sourceKind"]
  toolCount: number
  enabledToolCount: number
  serverEnabled: boolean
}

export interface ResolvedManagedMcpToolSelection<
  T extends McpToolSelectionCandidate,
> {
  selectedTool?: T
  ambiguousTools?: T[]
}

export interface ResolvedManagedMcpToolSourceSelection<
  T extends McpToolSourceSelectionCandidate,
> {
  selectedSource?: T
  ambiguousSources?: T[]
}

export interface ManagedMcpToolActionResult {
  success: boolean
  error?: string
  tool?: ManagedMcpToolDetails
}

export interface ManagedMcpToolSourceActionResult {
  success: boolean
  error?: string
  source?: ManagedMcpToolSourceSummary
  updatedCount: number
  failedTools?: string[]
  tools?: ManagedMcpToolDetails[]
}

export interface McpToolManagementStore {
  getDetailedToolList(): DetailedToolInfo[]
  setToolEnabled(toolName: string, enabled: boolean): boolean
}

function normalizeManagedMcpToolQuery(value: string): string {
  return value.trim().toLowerCase()
}

function normalizeManagedMcpToolSourceQuery(value: string): string {
  return value.trim().toLowerCase()
}

function sortManagedMcpTools(
  left: ManagedMcpToolDetails,
  right: ManagedMcpToolDetails,
): number {
  return (
    left.sourceLabel.localeCompare(right.sourceLabel) ||
    left.name.localeCompare(right.name)
  )
}

export function getManagedMcpTools(
  store: Pick<McpToolManagementStore, "getDetailedToolList">,
): ManagedMcpToolDetails[] {
  return store.getDetailedToolList().slice().sort(sortManagedMcpTools)
}

export function getManagedMcpTool(
  toolName: string,
  store: Pick<McpToolManagementStore, "getDetailedToolList">,
): ManagedMcpToolDetails | undefined {
  return getManagedMcpTools(store).find((tool) => tool.name === toolName)
}

export function resolveManagedMcpToolSelection<
  T extends McpToolSelectionCandidate,
>(tools: readonly T[], query: string): ResolvedManagedMcpToolSelection<T> {
  const normalizedQuery = normalizeManagedMcpToolQuery(query)
  if (!normalizedQuery) {
    return {}
  }

  const exactMatch = tools.find(
    (tool) => normalizeManagedMcpToolQuery(tool.name) === normalizedQuery,
  )
  if (exactMatch) {
    return { selectedTool: exactMatch }
  }

  const prefixMatches = tools.filter((tool) =>
    normalizeManagedMcpToolQuery(tool.name).startsWith(normalizedQuery),
  )

  if (prefixMatches.length === 1) {
    return { selectedTool: prefixMatches[0] }
  }

  if (prefixMatches.length > 1) {
    return { ambiguousTools: prefixMatches }
  }

  return {}
}

export function getManagedMcpToolSources(
  store: Pick<McpToolManagementStore, "getDetailedToolList">,
): ManagedMcpToolSourceSummary[] {
  const sourceMap = new Map<string, ManagedMcpToolSourceSummary>()

  for (const tool of getManagedMcpTools(store)) {
    const existing = sourceMap.get(tool.sourceName)
    if (existing) {
      existing.toolCount += 1
      if (tool.enabled) {
        existing.enabledToolCount += 1
      }
      existing.serverEnabled = existing.serverEnabled && tool.serverEnabled
      continue
    }

    sourceMap.set(tool.sourceName, {
      sourceName: tool.sourceName,
      sourceLabel: tool.sourceLabel,
      sourceKind: tool.sourceKind,
      toolCount: 1,
      enabledToolCount: tool.enabled ? 1 : 0,
      serverEnabled: tool.serverEnabled,
    })
  }

  return Array.from(sourceMap.values()).sort(
    (left, right) =>
      left.sourceLabel.localeCompare(right.sourceLabel) ||
      left.sourceName.localeCompare(right.sourceName),
  )
}

function matchesManagedMcpToolSourceSelection(
  source: McpToolSourceSelectionCandidate,
  normalizedQuery: string,
): boolean {
  const sourceName = normalizeManagedMcpToolSourceQuery(source.sourceName)
  const sourceLabel = normalizeManagedMcpToolSourceQuery(source.sourceLabel)
  return (
    sourceName.startsWith(normalizedQuery) ||
    sourceLabel.startsWith(normalizedQuery)
  )
}

function isExactManagedMcpToolSourceMatch(
  source: McpToolSourceSelectionCandidate,
  normalizedQuery: string,
): boolean {
  const sourceName = normalizeManagedMcpToolSourceQuery(source.sourceName)
  const sourceLabel = normalizeManagedMcpToolSourceQuery(source.sourceLabel)
  return sourceName === normalizedQuery || sourceLabel === normalizedQuery
}

export function resolveManagedMcpToolSourceSelection<
  T extends McpToolSourceSelectionCandidate,
>(
  sources: readonly T[],
  query: string,
): ResolvedManagedMcpToolSourceSelection<T> {
  const normalizedQuery = normalizeManagedMcpToolSourceQuery(query)
  if (!normalizedQuery) {
    return {}
  }

  const exactMatch = sources.find((source) =>
    isExactManagedMcpToolSourceMatch(source, normalizedQuery),
  )
  if (exactMatch) {
    return { selectedSource: exactMatch }
  }

  const prefixMatches = sources.filter((source) =>
    matchesManagedMcpToolSourceSelection(source, normalizedQuery),
  )

  if (prefixMatches.length === 1) {
    return { selectedSource: prefixMatches[0] }
  }

  if (prefixMatches.length > 1) {
    return { ambiguousSources: prefixMatches }
  }

  return {}
}

function buildManagedMcpToolNotFound(
  toolName: string,
): ManagedMcpToolActionResult {
  return {
    success: false,
    error: `MCP tool '${toolName}' not found`,
  }
}

export function setManagedMcpToolEnabled(
  toolName: string,
  enabled: boolean,
  store: Pick<McpToolManagementStore, "getDetailedToolList" | "setToolEnabled">,
): ManagedMcpToolActionResult {
  const existingTool = getManagedMcpTool(toolName, store)
  if (!existingTool) {
    return buildManagedMcpToolNotFound(toolName)
  }

  if (!store.setToolEnabled(toolName, enabled)) {
    return {
      success: false,
      error: `Failed to ${enabled ? "enable" : "disable"} MCP tool '${toolName}'`,
      tool: getManagedMcpTool(toolName, store) || existingTool,
    }
  }

  return {
    success: true,
    tool: getManagedMcpTool(toolName, store) || { ...existingTool, enabled },
  }
}

export function setManagedMcpToolSourceEnabled(
  sourceName: string,
  enabled: boolean,
  store: Pick<McpToolManagementStore, "getDetailedToolList" | "setToolEnabled">,
): ManagedMcpToolSourceActionResult {
  const source = getManagedMcpToolSources(store).find(
    (candidate) => candidate.sourceName === sourceName,
  )
  if (!source) {
    return {
      success: false,
      error: `MCP tool source '${sourceName}' not found`,
      updatedCount: 0,
    }
  }

  const tools = getManagedMcpTools(store).filter(
    (tool) => tool.sourceName === sourceName,
  )
  const failedTools: string[] = []

  for (const tool of tools) {
    if (!store.setToolEnabled(tool.name, enabled)) {
      failedTools.push(tool.name)
    }
  }

  const updatedTools = getManagedMcpTools(store).filter(
    (tool) => tool.sourceName === sourceName,
  )
  const updatedSource =
    getManagedMcpToolSources(store).find(
      (candidate) => candidate.sourceName === sourceName,
    ) || source

  return {
    success: failedTools.length === 0,
    error:
      failedTools.length > 0
        ? `Failed to ${enabled ? "enable" : "disable"} ${failedTools.length} MCP tool${failedTools.length === 1 ? "" : "s"} in '${updatedSource.sourceLabel}'`
        : undefined,
    source: updatedSource,
    updatedCount: tools.length - failedTools.length,
    failedTools: failedTools.length > 0 ? failedTools : undefined,
    tools: updatedTools,
  }
}
