import fs from "fs"
import os from "os"
import path from "path"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { Config } from "@shared/types"

let currentAppDataPath = "/tmp/dotagents-test"

const safeStorageMock = {
  isEncryptionAvailable: vi.fn(() => true),
  encryptString: vi.fn((value: string) => Buffer.from(`enc:${value}`, "utf8")),
  decryptString: vi.fn((value: Buffer) => {
    const decoded = value.toString("utf8")
    return decoded.startsWith("enc:") ? decoded.slice(4) : decoded
  }),
}

vi.mock("electron", () => ({
  app: {
    getPath: vi.fn(() => currentAppDataPath),
    getAppPath: vi.fn(() => "/tmp/app"),
  },
  safeStorage: safeStorageMock,
}))

const originalHome = process.env.HOME
const originalUserProfile = process.env.USERPROFILE
const originalAppId = process.env.APP_ID
const originalWorkspaceDir = process.env.DOTAGENTS_WORKSPACE_DIR
const originalAppDataOverride = process.env.DOTAGENTS_APP_DATA_PATH

function createTempEnvironment() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "dotagents-config-"))
  const home = path.join(root, "home")
  const appData = path.join(root, "appdata")
  const cwd = path.join(root, "cwd")

  fs.mkdirSync(home, { recursive: true })
  fs.mkdirSync(appData, { recursive: true })
  fs.mkdirSync(cwd, { recursive: true })

  currentAppDataPath = appData
  process.env.HOME = home
  process.env.USERPROFILE = home
  process.env.DOTAGENTS_WORKSPACE_DIR = cwd
  Reflect.deleteProperty(process.env, "APP_ID")
  Reflect.deleteProperty(process.env, "DOTAGENTS_APP_DATA_PATH")

  return { root, home, appData, cwd }
}

afterEach(() => {
  vi.resetModules()

  if (originalHome === undefined) {
    Reflect.deleteProperty(process.env, "HOME")
  } else {
    process.env.HOME = originalHome
  }

  if (originalUserProfile === undefined) {
    Reflect.deleteProperty(process.env, "USERPROFILE")
  } else {
    process.env.USERPROFILE = originalUserProfile
  }

  if (originalAppId === undefined) {
    Reflect.deleteProperty(process.env, "APP_ID")
  } else {
    process.env.APP_ID = originalAppId
  }

  if (originalWorkspaceDir === undefined) {
    Reflect.deleteProperty(process.env, "DOTAGENTS_WORKSPACE_DIR")
  } else {
    process.env.DOTAGENTS_WORKSPACE_DIR = originalWorkspaceDir
  }

  if (originalAppDataOverride === undefined) {
    Reflect.deleteProperty(process.env, "DOTAGENTS_APP_DATA_PATH")
  } else {
    process.env.DOTAGENTS_APP_DATA_PATH = originalAppDataOverride
  }
})

describe("desktop config persistence", () => {
  it("defaults APP_ID to the packaged desktop namespace when unset", async () => {
    createTempEnvironment()

    const configModule = await import("./config")

    expect(configModule.appId).toBe("app.dotagents")
    expect(configModule.dataFolder).toContain("app.dotagents")
    expect(configModule.recordingsFolder).toContain("recordings")
    expect(configModule.conversationsFolder).toContain("conversations")
    expect(configModule.configPath).toContain("config.json")
  })

  it("stores secret-bearing settings outside plaintext config files", async () => {
    const { appData } = createTempEnvironment()
    const { configStore, dataFolder, globalAgentsFolder } = await import("./config")

    const config = {
      onboardingCompleted: true,
      groqApiKey: "gsk_live_secret",
      langfusePublicKey: "pk-lf-public",
      langfuseSecretKey: "sk-lf-secret",
      remoteServerApiKey: "remote-secret",
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
              Authorization: "Bearer header-secret",
              "X-Trace-Id": "trace-1",
            },
            oauth: {
              clientId: "client-id",
              clientSecret: "client-secret",
              tokens: {
                access_token: "access-token",
                refresh_token: "refresh-token",
                token_type: "Bearer",
              },
            },
          },
        },
      },
    } as unknown as Config

    configStore.save(config)

    const modelsJsonPath = path.join(globalAgentsFolder, "models.json")
    const mcpJsonPath = path.join(globalAgentsFolder, "mcp.json")
    const legacyConfigPath = path.join(appData, "app.dotagents", "config.json")
    const secretStoragePath = path.join(dataFolder, "config-secrets.json")

    const modelsJson = JSON.parse(fs.readFileSync(modelsJsonPath, "utf8"))
    const mcpJson = JSON.parse(fs.readFileSync(mcpJsonPath, "utf8"))
    const legacyConfigJson = JSON.parse(fs.readFileSync(legacyConfigPath, "utf8"))
    const encryptedSecrets = fs.readFileSync(secretStoragePath, "utf8")

    expect(modelsJson.groqApiKey).toBeUndefined()
    expect(modelsJson.remoteServerApiKey).toBeUndefined()
    expect(modelsJson.modelPresets[0].apiKey).toBeUndefined()
    expect(mcpJson.mcpConfig.mcpServers.demo.env.OPENAI_API_KEY).toBeUndefined()
    expect(mcpJson.mcpConfig.mcpServers.demo.env.DEBUG).toBe("1")
    expect(mcpJson.mcpConfig.mcpServers.demo.headers.Authorization).toBeUndefined()
    expect(mcpJson.mcpConfig.mcpServers.demo.headers["X-Trace-Id"]).toBe("trace-1")
    expect(mcpJson.mcpConfig.mcpServers.demo.oauth.clientId).toBe("client-id")
    expect(mcpJson.mcpConfig.mcpServers.demo.oauth.clientSecret).toBeUndefined()
    expect(mcpJson.mcpConfig.mcpServers.demo.oauth.tokens).toBeUndefined()
    expect(legacyConfigJson.groqApiKey).toBeUndefined()
    expect(legacyConfigJson.langfuseSecretKey).toBeUndefined()
    expect(legacyConfigJson.langfusePublicKey).toBe("pk-lf-public")
    expect(encryptedSecrets).not.toContain("gsk_live_secret")
    expect(encryptedSecrets).not.toContain("remote-secret")
    expect(encryptedSecrets).not.toContain("client-secret")

    const loadedConfig = configStore.get()
    expect(loadedConfig.groqApiKey).toBe("gsk_live_secret")
    expect(loadedConfig.langfuseSecretKey).toBe("sk-lf-secret")
    expect(loadedConfig.remoteServerApiKey).toBe("remote-secret")
    expect(loadedConfig.modelPresets?.[0]?.apiKey).toBe("sk-openai-secret")
    expect(loadedConfig.mcpConfig?.mcpServers.demo.env?.OPENAI_API_KEY).toBe("env-secret")
    expect(loadedConfig.mcpConfig?.mcpServers.demo.oauth?.clientSecret).toBe("client-secret")
    expect(loadedConfig.mcpConfig?.mcpServers.demo.oauth?.tokens?.access_token).toBe("access-token")
  })

  it("migrates existing plaintext secrets out of config files and JSON backups", async () => {
    const { appData } = createTempEnvironment()
    const { globalAgentsFolder } = await import("./config")

    const agentsDir = globalAgentsFolder
    const agentsBackupsDir = path.join(agentsDir, ".backups")
    const legacyDataDir = path.join(appData, "app.dotagents")
    const legacyBackupsDir = path.join(legacyDataDir, ".backups")

    fs.mkdirSync(agentsBackupsDir, { recursive: true })
    fs.mkdirSync(legacyBackupsDir, { recursive: true })

    fs.writeFileSync(
      path.join(agentsDir, "models.json"),
      JSON.stringify(
        {
          groqApiKey: "gsk_plaintext_secret",
          modelPresets: [
            {
              id: "builtin-openai",
              name: "OpenAI",
              baseUrl: "https://api.openai.com/v1",
              apiKey: "sk-openai-plaintext",
            },
          ],
        },
        null,
        2,
      ),
    )
    fs.writeFileSync(
      path.join(agentsBackupsDir, "models.json.test.bak"),
      JSON.stringify({ groqApiKey: "gsk_backup_secret" }, null, 2),
    )
    fs.writeFileSync(
      path.join(legacyDataDir, "config.json"),
      JSON.stringify({
        langfuseSecretKey: "sk-lf-plaintext",
        langfusePublicKey: "pk-lf-public",
      }),
    )
    fs.writeFileSync(
      path.join(legacyBackupsDir, "config.json.test.bak"),
      JSON.stringify({ remoteServerApiKey: "remote-backup-secret" }, null, 2),
    )

    const { configStore, dataFolder } = await import("./config")
    const loadedConfig = configStore.get()

    const modelsJson = JSON.parse(fs.readFileSync(path.join(agentsDir, "models.json"), "utf8"))
    const modelsBackupJson = JSON.parse(fs.readFileSync(path.join(agentsBackupsDir, "models.json.test.bak"), "utf8"))
    const legacyConfigJson = JSON.parse(fs.readFileSync(path.join(legacyDataDir, "config.json"), "utf8"))
    const legacyBackupJson = JSON.parse(fs.readFileSync(path.join(legacyBackupsDir, "config.json.test.bak"), "utf8"))
    const encryptedSecrets = fs.readFileSync(path.join(dataFolder, "config-secrets.json"), "utf8")

    expect(modelsJson.groqApiKey).toBeUndefined()
    expect(modelsJson.modelPresets[0].apiKey).toBeUndefined()
    expect(modelsBackupJson.groqApiKey).toBeUndefined()
    expect(legacyConfigJson.langfuseSecretKey).toBeUndefined()
    expect(legacyConfigJson.langfusePublicKey).toBe("pk-lf-public")
    expect(legacyBackupJson.remoteServerApiKey).toBeUndefined()
    expect(encryptedSecrets).not.toContain("gsk_plaintext_secret")
    expect(encryptedSecrets).not.toContain("sk-lf-plaintext")

    expect(loadedConfig.groqApiKey).toBe("gsk_plaintext_secret")
    expect(loadedConfig.modelPresets?.[0]?.apiKey).toBe("sk-openai-plaintext")
    expect(loadedConfig.langfuseSecretKey).toBe("sk-lf-plaintext")
  })

  it("syncs active preset legacy fields before saving and after reload", async () => {
    createTempEnvironment()
    const { configStore } = await import("./config")

    configStore.save({
      onboardingCompleted: true,
      currentModelPresetId: "builtin-openai",
      modelPresets: [
        {
          id: "builtin-openai",
          apiKey: "sk-openai-secret",
          baseUrl: "https://api.example.com/v1",
          mcpToolsModel: "gpt-4.1-mini",
          transcriptProcessingModel: "gpt-4o-mini",
        },
      ],
    } as unknown as Config)

    expect(configStore.get().openaiApiKey).toBe("sk-openai-secret")
    expect(configStore.get().openaiBaseUrl).toBe("https://api.example.com/v1")
    expect(configStore.get().mcpToolsOpenaiModel).toBe("gpt-4.1-mini")
    expect(configStore.get().transcriptPostProcessingOpenaiModel).toBe("gpt-4o-mini")

    vi.resetModules()
    const reloadedConfigModule = await import("./config")
    const reloadedConfig = reloadedConfigModule.configStore.get()

    expect(reloadedConfig.openaiApiKey).toBe("sk-openai-secret")
    expect(reloadedConfig.openaiBaseUrl).toBe("https://api.example.com/v1")
    expect(reloadedConfig.mcpToolsOpenaiModel).toBe("gpt-4.1-mini")
    expect(reloadedConfig.transcriptPostProcessingOpenaiModel).toBe("gpt-4o-mini")
  })
})
