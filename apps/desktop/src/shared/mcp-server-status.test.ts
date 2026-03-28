import { describe, expect, it } from "vitest"
import {
  countConnectedMcpServers,
  listMcpServerStatusSummaries,
  resolveMcpServerRuntimeState,
} from "./mcp-server-status"

describe("mcp server status helpers", () => {
  it("classifies disabled and stopped servers ahead of transport state", () => {
    expect(
      resolveMcpServerRuntimeState({
        connected: true,
        toolCount: 2,
        configDisabled: true,
      }),
    ).toBe("disabled")

    expect(
      resolveMcpServerRuntimeState({
        connected: true,
        toolCount: 2,
        runtimeEnabled: false,
      }),
    ).toBe("stopped")
  })

  it("classifies connected, error, and disconnected servers", () => {
    expect(
      resolveMcpServerRuntimeState({
        connected: true,
        toolCount: 4,
      }),
    ).toBe("connected")

    expect(
      resolveMcpServerRuntimeState({
        connected: false,
        toolCount: 1,
        error: "boom",
      }),
    ).toBe("error")

    expect(
      resolveMcpServerRuntimeState({
        connected: false,
        toolCount: 0,
      }),
    ).toBe("disconnected")
  })

  it("counts only actively connected servers", () => {
    expect(
      countConnectedMcpServers({
        alpha: { connected: true, toolCount: 1 },
        beta: { connected: true, toolCount: 1, runtimeEnabled: false },
        gamma: { connected: false, toolCount: 1, error: "offline" },
      }),
    ).toBe(1)
  })

  it("builds normalized summaries for remote and renderer consumers", () => {
    expect(
      listMcpServerStatusSummaries({
        alpha: { connected: true, toolCount: 3 },
        beta: {
          connected: false,
          toolCount: 0,
          runtimeEnabled: false,
          error: "stopped",
        },
      }),
    ).toEqual([
      {
        name: "alpha",
        connected: true,
        toolCount: 3,
        runtimeEnabled: true,
        configDisabled: false,
        enabled: true,
        state: "connected",
      },
      {
        name: "beta",
        connected: false,
        toolCount: 0,
        error: "stopped",
        runtimeEnabled: false,
        configDisabled: false,
        enabled: false,
        state: "stopped",
      },
    ])
  })
})
