import { describe, expect, it } from "vitest"
import {
  createShareableConfig,
  hasLocalOnlyConfigValues,
  mergeConfigWithLocalOnlyPreference,
} from "./config-secrets"

describe("config-secrets", () => {
  it("strips local-only values from shareable config output", () => {
    const shareable = createShareableConfig({
      openaiApiKey: "sk-local",
      langfuseSecretKey: "sk-langfuse",
      pushNotificationTokens: [{ token: "expo-token" }],
      modelPresets: [
        { id: "preset-a", name: "Preset A", baseUrl: "https://example.com/v1", apiKey: "preset-key" },
      ],
      mcpConfig: {
        mcpServers: {
          demo: {
            command: "demo-server",
            env: { API_KEY: "secret" },
            headers: { Authorization: "Bearer token" },
            oauth: { clientSecret: "shh" },
          },
        },
      },
      acpAgents: [
        {
          name: "remote-agent",
          displayName: "Remote Agent",
          connection: {
            type: "stdio",
            command: "remote-agent",
            env: { AUTH_TOKEN: "secret" },
          },
        },
      ],
    })

    expect(shareable.openaiApiKey).toBeUndefined()
    expect(shareable.langfuseSecretKey).toBeUndefined()
    expect(shareable.pushNotificationTokens).toBeUndefined()
    expect(shareable.modelPresets?.[0]?.apiKey).toBeUndefined()
    expect(shareable.mcpConfig?.mcpServers.demo.env).toBeUndefined()
    expect(shareable.mcpConfig?.mcpServers.demo.headers).toBeUndefined()
    expect(shareable.mcpConfig?.mcpServers.demo.oauth).toBeUndefined()
    expect(shareable.acpAgents?.[0]?.connection.env).toBeUndefined()
  })

  it("preserves local-only values from fallback config when shareable config omits them", () => {
    const merged = mergeConfigWithLocalOnlyPreference(
      {
        modelPresets: [
          { id: "preset-a", name: "Preset A", baseUrl: "https://example.com/v1", mcpToolsModel: "gpt-5.4" },
        ],
        mcpConfig: {
          mcpServers: {
            demo: {
              command: "demo-server-v2",
            },
          },
        },
        acpAgents: [
          {
            name: "remote-agent",
            displayName: "Remote Agent",
            connection: {
              type: "stdio",
              command: "remote-agent-v2",
            },
          },
        ],
      },
      {
        openaiApiKey: "sk-local",
        remoteServerApiKey: "remote-secret",
        modelPresets: [
          { id: "preset-a", name: "Preset A", baseUrl: "https://example.com/v1", apiKey: "preset-secret" },
        ],
        mcpConfig: {
          mcpServers: {
            demo: {
              command: "demo-server-v1",
              env: { API_KEY: "secret" },
            },
          },
        },
        acpAgents: [
          {
            name: "remote-agent",
            displayName: "Remote Agent",
            connection: {
              type: "stdio",
              command: "remote-agent-v1",
              env: { AUTH_TOKEN: "secret" },
            },
          },
        ],
      },
      { preferPrimaryLocalOnly: false },
    )

    expect(merged.openaiApiKey).toBe("sk-local")
    expect(merged.remoteServerApiKey).toBe("remote-secret")
    expect(merged.modelPresets?.[0]?.mcpToolsModel).toBe("gpt-5.4")
    expect(merged.modelPresets?.[0]?.apiKey).toBe("preset-secret")
    expect(merged.mcpConfig?.mcpServers.demo.command).toBe("demo-server-v2")
    expect(merged.mcpConfig?.mcpServers.demo.env).toEqual({ API_KEY: "secret" })
    expect(merged.acpAgents?.[0]?.connection.command).toBe("remote-agent-v2")
    expect(merged.acpAgents?.[0]?.connection.env).toEqual({ AUTH_TOKEN: "secret" })
  })

  it("detects when a config still contains local-only values", () => {
    expect(hasLocalOnlyConfigValues({
      modelPresets: [{ id: "preset-a", name: "Preset A", baseUrl: "https://example.com/v1", apiKey: "preset-secret" }],
    })).toBe(true)

    expect(hasLocalOnlyConfigValues({
      modelPresets: [{ id: "preset-a", name: "Preset A", baseUrl: "https://example.com/v1" }],
    })).toBe(false)
  })
})
