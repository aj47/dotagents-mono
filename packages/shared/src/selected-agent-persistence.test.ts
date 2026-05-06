import { describe, expect, it, vi } from "vitest"
import {
  SELECTED_AGENT_STORAGE_KEY,
  loadSelectedAgentId,
  saveSelectedAgentId,
} from "./selected-agent-persistence"

function createStorage(seed: Record<string, string> = {}) {
  const store = new Map(Object.entries(seed))
  return {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value)
    }),
    removeItem: vi.fn((key: string) => {
      store.delete(key)
    }),
  }
}

describe("selected agent persistence", () => {
  it("loads the selected agent id from storage", () => {
    const storage = createStorage({
      [SELECTED_AGENT_STORAGE_KEY]: "agent-1",
    })

    expect(loadSelectedAgentId(storage)).toBe("agent-1")
  })

  it("saves the selected agent id under the selected agent key", () => {
    const storage = createStorage()

    saveSelectedAgentId("agent-2", storage)

    expect(storage.setItem).toHaveBeenCalledWith(SELECTED_AGENT_STORAGE_KEY, "agent-2")
  })

  it("clears the selected agent id when saving null or an empty value", () => {
    const storage = createStorage({
      [SELECTED_AGENT_STORAGE_KEY]: "agent-1",
    })

    saveSelectedAgentId(null, storage)
    saveSelectedAgentId("", storage)

    expect(storage.removeItem).toHaveBeenCalledTimes(2)
    expect(storage.removeItem).toHaveBeenCalledWith(SELECTED_AGENT_STORAGE_KEY)
  })

  it("treats storage failures as non-fatal", () => {
    const storage = {
      getItem: vi.fn(() => {
        throw new Error("blocked")
      }),
      setItem: vi.fn(() => {
        throw new Error("blocked")
      }),
      removeItem: vi.fn(() => {
        throw new Error("blocked")
      }),
    }

    expect(loadSelectedAgentId(storage)).toBeNull()
    expect(() => saveSelectedAgentId("agent-2", storage)).not.toThrow()
    expect(() => saveSelectedAgentId(null, storage)).not.toThrow()
  })
})
