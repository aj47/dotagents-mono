import {
  getAgentsLayerPaths,
  loadAgentsKnowledgeNotesLayer,
  type KnowledgeNote,
} from "@dotagents/core"

function mergeLayeredKnowledgeNotes(
  globalNotes: KnowledgeNote[],
  workspaceNotes: KnowledgeNote[],
): KnowledgeNote[] {
  const byId = new Map<string, KnowledgeNote>()

  for (const note of globalNotes) {
    byId.set(note.id, note)
  }

  for (const note of workspaceNotes) {
    byId.set(note.id, note)
  }

  return Array.from(byId.values())
}

function selectWorkingKnowledgeNotes(
  notes: KnowledgeNote[],
  maxNotes: number,
): KnowledgeNote[] {
  const limit = Math.max(0, Math.floor(maxNotes))

  return [...notes]
    .filter((note) => note.context === "auto")
    .sort((a, b) => {
      const updatedAtDiff = b.updatedAt - a.updatedAt
      if (updatedAtDiff !== 0) return updatedAtDiff

      const summaryDiff = Number(Boolean(b.summary?.trim())) - Number(Boolean(a.summary?.trim()))
      if (summaryDiff !== 0) return summaryDiff

      return a.id.localeCompare(b.id)
    })
    .slice(0, limit)
}

export function loadWorkingKnowledgeNotesForPrompt(options: {
  globalAgentsDir: string
  workspaceAgentsDir?: string | null
  maxNotes: number
}): KnowledgeNote[] {
  const globalLayer = getAgentsLayerPaths(options.globalAgentsDir)
  const globalLoaded = loadAgentsKnowledgeNotesLayer(globalLayer)

  const workspaceLoaded = options.workspaceAgentsDir
    ? loadAgentsKnowledgeNotesLayer(getAgentsLayerPaths(options.workspaceAgentsDir))
    : null

  const mergedNotes = mergeLayeredKnowledgeNotes(
    globalLoaded.notes,
    workspaceLoaded?.notes ?? [],
  )

  return selectWorkingKnowledgeNotes(mergedNotes, options.maxNotes)
}
