import fs from "fs"
import os from "os"
import path from "path"
import { describe, expect, it, vi } from "vitest"
import type { Config } from "@shared/types"

const safeStorageMock = {
  isEncryptionAvailable: vi.fn(() => true),
  encryptString: vi.fn((value: string) => Buffer.from(`enc:${value}`, "utf8")),
  decryptString: vi.fn((value: Buffer) => {
    const decoded = value.toString("utf8")
    return decoded.startsWith("enc:") ? decoded.slice(4) : decoded
  }),
}

vi.mock("electron", () => ({
  safeStorage: safeStorageMock,
}))

describe("config secret helpers", () => {
  it("splits and merges nested secret-bearing config fields", async () => {
    const { mergeConfigSecrets, splitConfigSecrets } = await import("./config-secrets")

    const originalConfig = {
      groqApiKey: "gsk-secret",
      langfusePublicKey: "pk-lf-public",
      langfuseSecretKey: "sk-lf-secret",
      modelPresets: [
        {
          id: "builtin-openai",
          name: "OpenAI",
          baseUrl: "https://api.openai.com/v1",
          apiKey: "sk-openai-secret",
        },
      ],
      mcpConfig: {
        mcpServers: {
          demo: {
            command: "demo",
            env: {
              OPENAI_API_KEY: "env-secret",
              DEBUG: "1",
            },
            headers: {
              Authorization: "Bearer demo",
              "X-Trace-Id": "trace-1",
            },
            oauth: {
              clientId: "client-id",
              clientSecret: "client-secret",
              tokens: {
                access_token: "access-token",
                token_type: "Bearer",
              },
            },
          },
        },
      },
    } as unknown as Config

    const { sanitizedConfig, secrets } = splitConfigSecrets(originalConfig)
    const mergedConfig = mergeConfigSecrets(sanitizedConfig, secrets)

    expect(sanitizedConfig.groqApiKey).toBeUndefined()
    expect(sanitizedConfig.langfusePublicKey).toBe("pk-lf-public")
    expect(sanitizedConfig.langfuseSecretKey).toBeUndefined()
    expect(sanitizedConfig.modelPresets?.[0]?.apiKey).toBeUndefined()
    expect(sanitizedConfig.mcpConfig?.mcpServers.demo.env?.OPENAI_API_KEY).toBeUndefined()
    expect(sanitizedConfig.mcpConfig?.mcpServers.demo.env?.DEBUG).toBe("1")
    expect(sanitizedConfig.mcpConfig?.mcpServers.demo.headers?.Authorization).toBeUndefined()
    expect(sanitizedConfig.mcpConfig?.mcpServers.demo.headers?.["X-Trace-Id"]).toBe("trace-1")
    expect(sanitizedConfig.mcpConfig?.mcpServers.demo.oauth?.clientId).toBe("client-id")
    expect(sanitizedConfig.mcpConfig?.mcpServers.demo.oauth?.clientSecret).toBeUndefined()
    expect(sanitizedConfig.mcpConfig?.mcpServers.demo.oauth?.tokens).toBeUndefined()
    expect(mergedConfig).toEqual(originalConfig)
  })

  it("writes encrypted config secret files without plaintext values", async () => {
    const {
      ConfigSecretStorage,
      CONFIG_SECRETS_FILE_NAME,
    } = await import("./config-secrets")

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dotagents-config-secrets-"))
    const storage = new ConfigSecretStorage(tempDir)

    storage.save({
      groqApiKey: "gsk-secret",
      mcpConfig: {
        mcpServers: {
          demo: {
            headers: {
              Authorization: "Bearer demo",
            },
          },
        },
      },
    })

    const encryptedSecrets = fs.readFileSync(path.join(tempDir, CONFIG_SECRETS_FILE_NAME), "utf8")

    expect(encryptedSecrets).not.toContain("gsk-secret")
    expect(encryptedSecrets).not.toContain("Bearer demo")
    expect(storage.load()).toEqual({
      groqApiKey: "gsk-secret",
      mcpConfig: {
        mcpServers: {
          demo: {
            headers: {
              Authorization: "Bearer demo",
            },
          },
        },
      },
    })
  })
})
