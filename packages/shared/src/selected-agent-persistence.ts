export const SELECTED_AGENT_STORAGE_KEY = "dotagents-selected-agent"
export const SELECTED_AGENT_CHANGED_EVENT = "dotagents-selected-agent-changed"

export type SelectedAgentStorageLike = {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

function getDefaultSelectedAgentStorage(): SelectedAgentStorageLike | undefined {
  return (globalThis as { localStorage?: SelectedAgentStorageLike }).localStorage
}

export function loadSelectedAgentId(
  storage: SelectedAgentStorageLike | undefined = getDefaultSelectedAgentStorage(),
): string | null {
  if (!storage) return null

  try {
    return storage.getItem(SELECTED_AGENT_STORAGE_KEY)
  } catch {
    return null
  }
}

export function saveSelectedAgentId(
  agentId: string | null,
  storage: SelectedAgentStorageLike | undefined = getDefaultSelectedAgentStorage(),
): void {
  if (!storage) return

  try {
    if (agentId) {
      storage.setItem(SELECTED_AGENT_STORAGE_KEY, agentId)
    } else {
      storage.removeItem(SELECTED_AGENT_STORAGE_KEY)
    }
  } catch {}
}
