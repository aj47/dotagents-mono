import { describe, expect, it } from "vitest"
import { getSelectableMainAcpAgents } from "./settings-general-main-agent-options"

describe("getSelectableMainAcpAgents", () => {
  it("includes enabled ACP and stdio profile agents before legacy ACP config entries", () => {
    const options = getSelectableMainAcpAgents(
      [
        {
          name: "augustus",
          displayName: "augustus",
          enabled: true,
          connection: { type: "acp", command: "auggie", args: ["--acp"] },
        } as any,
        {
          name: "helper-stdio",
          displayName: "Helper STDIO",
          enabled: true,
          connection: { type: "stdio", command: "helper" },
        } as any,
      ],
      [
        {
          name: "legacy-agent",
          displayName: "Legacy Agent",
          enabled: true,
          connection: { type: "stdio", command: "legacy" },
        },
      ] as any
    )

    expect(options).toEqual([
      { name: "augustus", displayName: "augustus" },
      { name: "helper-stdio", displayName: "Helper STDIO" },
      { name: "legacy-agent", displayName: "Legacy Agent" },
    ])
  })

  it("filters out disabled, remote, and duplicate legacy entries", () => {
    const options = getSelectableMainAcpAgents(
      [
        {
          name: "augustus",
          displayName: "augustus",
          enabled: true,
          connection: { type: "acp", command: "auggie", args: ["--acp"] },
        } as any,
        {
          name: "remote-agent",
          displayName: "Remote Agent",
          enabled: true,
          connection: { type: "remote", baseUrl: "https://example.com" },
        } as any,
        {
          name: "disabled-profile",
          displayName: "Disabled Profile",
          enabled: false,
          connection: { type: "stdio", command: "disabled" },
        } as any,
      ],
      [
        {
          name: "AUGUSTUS",
          displayName: "Legacy Augustus",
          enabled: true,
          connection: { type: "stdio", command: "legacy-auggie" },
        },
        {
          name: "disabled-legacy",
          displayName: "Disabled Legacy",
          enabled: false,
          connection: { type: "stdio", command: "disabled-legacy" },
        },
        {
          name: "remote-legacy",
          displayName: "Remote Legacy",
          enabled: true,
          connection: { type: "remote", baseUrl: "https://example.com" },
        },
      ] as any
    )

    expect(options).toEqual([
      { name: "augustus", displayName: "augustus" },
    ])
  })
})