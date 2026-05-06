import { beforeEach, describe, expect, it, vi } from "vitest"

const { getAgentProfiles, setCurrentAgentProfile, toastError } = vi.hoisted(() => ({
  getAgentProfiles: vi.fn(),
  setCurrentAgentProfile: vi.fn(),
  toastError: vi.fn(),
}))

vi.mock("./tipc-client", () => ({
  tipcClient: {
    getAgentProfiles,
    setCurrentAgentProfile,
  },
}))

vi.mock("sonner", () => ({
  toast: {
    error: toastError,
  },
}))

import { applySelectedAgentToNextSession } from "./apply-selected-agent"

describe("applySelectedAgentToNextSession", () => {
  beforeEach(() => {
    getAgentProfiles.mockReset()
    setCurrentAgentProfile.mockReset()
    toastError.mockReset()
  })

  it("applies the default enabled agent when none is selected", async () => {
    getAgentProfiles.mockResolvedValue([
      { id: "agent-1", name: "helper", displayName: "Helper", enabled: true },
      { id: "agent-2", name: "main-agent", displayName: "Main", enabled: true },
    ])
    setCurrentAgentProfile.mockResolvedValue({ success: true })

    const result = await applySelectedAgentToNextSession({
      selectedAgentId: null,
      setSelectedAgentId: vi.fn(),
    })

    expect(result).toBe(true)
    expect(setCurrentAgentProfile).toHaveBeenCalledWith({ id: "agent-2" })
    expect(toastError).not.toHaveBeenCalled()
  })

  it("treats agents without an explicit enabled flag as selectable", async () => {
    getAgentProfiles.mockResolvedValue([
      { id: "agent-1", name: "main-agent", displayName: "Main" },
    ])
    setCurrentAgentProfile.mockResolvedValue({ success: true })

    const result = await applySelectedAgentToNextSession({
      selectedAgentId: null,
      setSelectedAgentId: vi.fn(),
    })

    expect(result).toBe(true)
    expect(setCurrentAgentProfile).toHaveBeenCalledWith({ id: "agent-1" })
  })

  it("clears stale selections and blocks the session start instead of silently switching agents", async () => {
    getAgentProfiles.mockResolvedValue([
      { id: "agent-2", name: "main-agent", displayName: "Main", enabled: true },
    ])
    const setSelectedAgentId = vi.fn()

    const result = await applySelectedAgentToNextSession({
      selectedAgentId: "removed-agent",
      setSelectedAgentId,
    })

    expect(result).toBe(false)
    expect(setSelectedAgentId).toHaveBeenCalledWith(null)
    expect(setCurrentAgentProfile).not.toHaveBeenCalled()
    expect(toastError).toHaveBeenCalledWith("Selected agent is no longer available")
  })

  it("surfaces backend apply failures and supports preloaded agent profiles", async () => {
    const onError = vi.fn()
    setCurrentAgentProfile.mockResolvedValue({ success: false })

    const result = await applySelectedAgentToNextSession({
      selectedAgentId: "agent-1",
      setSelectedAgentId: vi.fn(),
      agentProfiles: [
        { id: "agent-1", name: "helper", displayName: "Helper", enabled: true },
      ],
      onError,
    })

    expect(result).toBe(false)
    expect(getAgentProfiles).not.toHaveBeenCalled()
    expect(setCurrentAgentProfile).toHaveBeenCalledWith({ id: "agent-1" })
    expect(onError).toHaveBeenCalledTimes(1)
    expect(toastError).toHaveBeenCalledWith("Failed to apply selected agent")
  })

  it("falls back to live agent profiles when a preloaded placeholder array is empty", async () => {
    getAgentProfiles.mockResolvedValue([
      { id: "agent-2", name: "main-agent", displayName: "Main", enabled: true },
    ])
    setCurrentAgentProfile.mockResolvedValue({ success: true })
    const setSelectedAgentId = vi.fn()

    const result = await applySelectedAgentToNextSession({
      selectedAgentId: "agent-2",
      setSelectedAgentId,
      agentProfiles: [],
    })

    expect(result).toBe(true)
    expect(getAgentProfiles).toHaveBeenCalledOnce()
    expect(setCurrentAgentProfile).toHaveBeenCalledWith({ id: "agent-2" })
    expect(setSelectedAgentId).not.toHaveBeenCalled()
    expect(toastError).not.toHaveBeenCalled()
  })
})
