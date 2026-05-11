import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { execFile, spawnSync } from "child_process"
import http from "http"
import fs from "fs/promises"
import os from "os"
import path from "path"
import { promisify } from "util"
import { fileURLToPath } from "url"

const execFileAsync = promisify(execFile)
const hasBun = spawnSync("bun", ["--version"], { stdio: "ignore" }).status === 0
const describeTuiSmoke = hasBun ? describe : describe.skip
const scriptPath = fileURLToPath(
  new URL("../../../../scripts/dotagents-tui.ts", import.meta.url),
)

type SeenRequest = {
  method?: string
  url?: string
  authorization?: string
  body: string
}

function childProcessEnv(home: string | undefined): NodeJS.ProcessEnv {
  const env: Record<string, string> = {}
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined) env[key] = value
  }
  env.HOME = home ?? ""
  return env as NodeJS.ProcessEnv
}

describeTuiSmoke("dotagents TUI one-shot server commands", () => {
  let server: http.Server | undefined
  let tmpHome: string | undefined
  let port = 0
  const seenRequests: SeenRequest[] = []

  beforeEach(async () => {
    seenRequests.length = 0
    tmpHome = await fs.mkdtemp(path.join(os.tmpdir(), "dotagents-tui-test-"))
    port = await startMockDaemon()

    const configDir = path.join(tmpHome, ".config", "app.dotagents")
    await fs.mkdir(configDir, { recursive: true })
    await fs.writeFile(
      path.join(configDir, "config.json"),
      JSON.stringify({
        remoteServerPort: port,
        remoteServerApiKey: "test-tui-key",
      }),
    )
  })

  afterEach(async () => {
    if (server) {
      const closingServer = server
      await new Promise<void>((resolve, reject) => {
        closingServer.close((error) => (error ? reject(error) : resolve()))
      })
    }
    server = undefined

    if (tmpHome) {
      await fs.rm(tmpHome, { recursive: true, force: true })
      tmpHome = undefined
    }
  })

  function runTuiCommand(command: string) {
    return execFileAsync(
      "bun",
      [scriptPath, "--once", command],
      {
        env: childProcessEnv(tmpHome),
        timeout: 10_000,
        maxBuffer: 1024 * 1024,
      },
    )
  }

  it("renders operator status from the shared remote server", async () => {
    const { stdout, stderr } = await runTuiCommand("/status")

    expect(stderr).toBe("")
    expect(stdout).toContain("Status")
    expect(stdout).toContain("Health: healthy")
    expect(stdout).toContain("Remote server: running")
    expect(stdout).toContain("Discord: enabled yes, connected yes")
    expect(seenRequests.map((request) => `${request.method} ${request.url}`)).toContain("GET /v1/operator/status")
    expect(seenRequests[0]?.authorization).toBe("Bearer test-tui-key")
  })

  it("routes additional operator commands through the shared server API", async () => {
    const cases: Array<[string, string]> = [
      ["/errors 2", "Errors (1)"],
      ["/logs 3 error", "Logs (1)"],
      ["/audit 1", "Audit (1)"],
      ["/session stop sess/1", "session-stop: ok: Stopped sess/1"],
      ["/remote-server", "Remote server"],
      ["/tunnel setup", "Tunnel setup"],
      ["/integrations", "Integrations"],
      ["/discord logs 2", "Discord logs (1)"],
      ["/discord clear-logs", "discord-clear-logs: ok: Cleared Discord logs"],
      ["/whatsapp logout", "whatsapp-logout: ok: Logged out WhatsApp"],
      ["/updater check", "updater-check: ok: Checked for updates"],
      ["/speech show parakeet", "Local speech model: parakeet"],
      ["/speech download parakeet", "local-speech-download: ok: Downloading parakeet"],
      ["/server restart", "restart-remote-server: ok: Restarting remote server"],
      ["/app restart", "restart-app: ok: Restarting app"],
      ["/mcp clear-logs filesystem", "mcp-clear-logs: ok: Cleared filesystem logs"],
    ]

    for (const [command, expectedOutput] of cases) {
      const { stdout, stderr } = await runTuiCommand(command)
      expect(stderr).toBe("")
      expect(stdout).toContain(expectedOutput)
    }

    const requests = seenRequests.map((request) => `${request.method} ${request.url}`)
    expect(requests).toEqual(expect.arrayContaining([
      "GET /v1/operator/errors?count=2",
      "GET /v1/operator/logs?count=3&level=error",
      "GET /v1/operator/audit?count=1",
      "POST /v1/operator/sessions/sess%2F1/stop",
      "GET /v1/operator/remote-server",
      "GET /v1/operator/tunnel/setup",
      "GET /v1/operator/integrations",
      "GET /v1/operator/discord/logs?count=2",
      "POST /v1/operator/discord/logs/clear",
      "POST /v1/operator/whatsapp/logout",
      "POST /v1/operator/updater/check",
      "GET /v1/operator/local-speech-models/parakeet",
      "POST /v1/operator/local-speech-models/parakeet/download",
      "POST /v1/operator/actions/restart-remote-server",
      "POST /v1/operator/actions/restart-app",
      "POST /v1/operator/mcp/filesystem/logs/clear",
    ]))
  })

  it("runs MCP actions through the operator API", async () => {
    const servers = await runTuiCommand("/mcp servers")

    expect(servers.stderr).toBe("")
    expect(servers.stdout).toContain("Saved MCP servers (1)")
    expect(servers.stdout).toContain("filesystem - connected, enabled, 2 tools")
    const serversRequest = seenRequests.find((entry) => entry.url === "/v1/mcp/servers")
    expect(serversRequest?.method).toBe("GET")

    const { stdout, stderr } = await runTuiCommand("/mcp restart filesystem")

    expect(stderr).toBe("")
    expect(stdout).toContain("mcp-restart: ok: Restarted filesystem")
    const request = seenRequests.find((entry) => entry.url === "/v1/operator/actions/mcp-restart")
    expect(request?.method).toBe("POST")
    expect(JSON.parse(request?.body || "{}")).toEqual({ server: "filesystem" })

    const serverToggle = await runTuiCommand("/mcp disable-server filesystem")

    expect(serverToggle.stderr).toBe("")
    expect(serverToggle.stdout).toContain("mcp-server-toggle: ok")
    const toggleRequest = seenRequests.find((entry) => entry.url === "/v1/mcp/servers/filesystem/toggle")
    expect(toggleRequest?.method).toBe("POST")
    expect(JSON.parse(toggleRequest?.body || "{}")).toEqual({ enabled: false })
  })

  it("runs filesystem resource mutations through the shared server API", async () => {
    const skillCreate = await runTuiCommand('/skill create {"name":"TUI Skill","instructions":"Use the server"}')

    expect(skillCreate.stderr).toBe("")
    expect(skillCreate.stdout).toContain("Skill created: tui-skill - TUI Skill")

    const settingsPatch = await runTuiCommand('/settings patch {"streamerModeEnabled":true}')

    expect(settingsPatch.stderr).toBe("")
    expect(settingsPatch.stdout).toContain("Settings updated: streamerModeEnabled")

    const noteDelete = await runTuiCommand("/note delete note-1")

    expect(noteDelete.stderr).toBe("")
    expect(noteDelete.stdout).toContain("Note deleted: note-1")

    const requests = seenRequests.map((request) => `${request.method} ${request.url}`)
    expect(requests).toContain("POST /v1/skills")
    expect(requests).toContain("PATCH /v1/settings")
    expect(requests).toContain("DELETE /v1/knowledge/notes/note-1")
    expect(JSON.parse(seenRequests.find((entry) => entry.url === "/v1/skills")?.body || "{}")).toEqual({
      name: "TUI Skill",
      instructions: "Use the server",
    })
    expect(JSON.parse(seenRequests.find((entry) => entry.url === "/v1/settings")?.body || "{}")).toEqual({
      streamerModeEnabled: true,
    })
  })

  it("routes remaining filesystem resource commands through the shared server API", async () => {
    const cases: Array<[string, string]> = [
      ['/preset create {"name":"TUI Endpoint","baseUrl":"https://example.com/v1"}', "Model endpoint created: preset-tui"],
      ['/preset update preset-tui {"name":"Updated Endpoint"}', "Model endpoint updated: preset-tui"],
      ["/preset delete preset-tui", "Model endpoint deleted: preset-tui"],
      ["/preset use preset-tui", "Settings updated: currentModelPresetId"],
      ['/skill update tui-skill {"description":"Updated"}', "Skill updated: tui-skill - TUI Skill"],
      ["/skill toggle tui-skill", "Skill tui-skill is now enabled"],
      ["/skill delete tui-skill", "Skill deleted: tui-skill"],
      ['/note create {"title":"TUI Note","body":"Body","context":"search-only"}', "Note created: note-tui - TUI Note"],
      ['/note update note-tui {"title":"Updated Note"}', "Note updated: note-tui - Updated Note"],
      ['/agent create {"id":"agent-tui","name":"TUI Agent"}', "Agent created: agent-tui - TUI Agent"],
      ['/agent update agent-tui {"description":"Updated"}', "Agent updated: agent-tui - TUI Agent"],
      ["/agent toggle agent-tui", "Agent agent-tui is now enabled."],
      ["/agent delete agent-tui", "Agent deleted: agent-tui"],
      ['/loop create {"id":"loop-tui","name":"TUI Loop","prompt":"Run","intervalMinutes":60}', "Loop loop-tui created: TUI Loop"],
      ['/loop update loop-tui {"name":"Updated Loop"}', "Loop loop-tui updated: Updated Loop"],
      ["/loop run loop-tui", "loop-run: ok: Ran loop-tui"],
      ["/loop toggle loop-tui", "loop-toggle: ok: Toggled loop-tui"],
      ["/loop delete loop-tui", "Loop deleted: loop-tui"],
    ]

    for (const [command, expectedOutput] of cases) {
      const { stdout, stderr } = await runTuiCommand(command)
      expect(stderr).toBe("")
      expect(stdout).toContain(expectedOutput)
    }

    const requests = seenRequests.map((request) => `${request.method} ${request.url}`)
    expect(requests).toEqual(expect.arrayContaining([
      "POST /v1/operator/model-presets",
      "PATCH /v1/operator/model-presets/preset-tui",
      "DELETE /v1/operator/model-presets/preset-tui",
      "PATCH /v1/settings",
      "PATCH /v1/skills/tui-skill",
      "POST /v1/skills/tui-skill/toggle-profile",
      "DELETE /v1/skills/tui-skill",
      "POST /v1/knowledge/notes",
      "PATCH /v1/knowledge/notes/note-tui",
      "POST /v1/agent-profiles",
      "PATCH /v1/agent-profiles/agent-tui",
      "POST /v1/agent-profiles/agent-tui/toggle",
      "DELETE /v1/agent-profiles/agent-tui",
      "POST /v1/loops",
      "PATCH /v1/loops/loop-tui",
      "POST /v1/loops/loop-tui/run",
      "POST /v1/loops/loop-tui/toggle",
      "DELETE /v1/loops/loop-tui",
    ]))
    expect(JSON.parse(seenRequests.find((entry) => entry.url === "/v1/operator/model-presets" && entry.method === "POST")?.body || "{}")).toEqual({
      name: "TUI Endpoint",
      baseUrl: "https://example.com/v1",
    })
    expect(JSON.parse(seenRequests.find((entry) => entry.url === "/v1/agent-profiles" && entry.method === "POST")?.body || "{}")).toEqual({
      id: "agent-tui",
      name: "TUI Agent",
    })
    expect(JSON.parse(seenRequests.find((entry) => entry.url === "/v1/loops" && entry.method === "POST")?.body || "{}")).toEqual({
      id: "loop-tui",
      name: "TUI Loop",
      prompt: "Run",
      intervalMinutes: 60,
    })
  })

  it("exports and imports profiles through the shared profile API", async () => {
    const profileExport = await runTuiCommand("/profile export main/profile")

    expect(profileExport.stderr).toBe("")
    expect(profileExport.stdout).toContain('"id":"main/profile"')

    const profileImport = await runTuiCommand('/profile import {"id":"imported-profile","name":"Imported"}')

    expect(profileImport.stderr).toBe("")
    expect(profileImport.stdout).toContain("Profile imported: imported-profile")
    expect(seenRequests.map((request) => `${request.method} ${request.url}`)).toContain("GET /v1/profiles/main%2Fprofile/export")
    expect(seenRequests.map((request) => `${request.method} ${request.url}`)).toContain("POST /v1/profiles/import")
    expect(JSON.parse(seenRequests.find((entry) => entry.url === "/v1/profiles/import")?.body || "{}")).toEqual({
      profileJson: '{"id":"imported-profile","name":"Imported"}',
    })
  })

  it("keeps one-shot chat streaming on the chat completions endpoint", async () => {
    const { stdout, stderr } = await runTuiCommand("hello from tui")

    expect(stderr).toBe("")
    expect(stdout).toContain("Mock thinking")
    expect(stdout).toContain("hello from mock TUI daemon")
    expect(seenRequests.map((request) => `${request.method} ${request.url}`)).toContain("POST /v1/chat/completions")
  })

  it("keeps one-shot chat streaming state current after reset chunks", async () => {
    const { stdout, stderr } = await runTuiCommand("reset stream")

    expect(stderr).toBe("")
    expect(stdout).toContain("hello from mock daemon again final")
    expect(stdout).not.toContain("\nhello again")
  })

  it("controls operator message queues through the shared server API", async () => {
    const queues = await runTuiCommand("/queues")

    expect(queues.stderr).toBe("")
    expect(queues.stdout).toContain("Message queues (1 conversations, 1 messages)")
    expect(queues.stdout).toContain("conv/1 - 1 message(s), paused")

    const pause = await runTuiCommand("/queue pause conv/1")

    expect(pause.stderr).toBe("")
    expect(pause.stdout).toContain("message-queue-pause: ok: Paused conv/1")

    const update = await runTuiCommand("/queue msg update conv/1 msg/1 edited from tui")

    expect(update.stderr).toBe("")
    expect(update.stdout).toContain("message-queue-message-update: ok: Updated msg/1")
    const requests = seenRequests.map((request) => `${request.method} ${request.url}`)
    expect(requests).toContain("GET /v1/operator/message-queues")
    expect(requests).toContain("POST /v1/operator/message-queues/conv%2F1/pause")
    expect(requests).toContain("PATCH /v1/operator/message-queues/conv%2F1/messages/msg%2F1")
    expect(JSON.parse(seenRequests.find((entry) => entry.url === "/v1/operator/message-queues/conv%2F1/messages/msg%2F1")?.body || "{}")).toEqual({
      text: "edited from tui",
    })
  })

  it("runs operator lifecycle actions through the shared server API", async () => {
    const tunnel = await runTuiCommand("/tunnel start")

    expect(tunnel.stderr).toBe("")
    expect(tunnel.stdout).toContain("tunnel-start: ok: Started quick tunnel")

    const runAgent = await runTuiCommand("/run-agent launch diagnostics")

    expect(runAgent.stderr).toBe("")
    expect(runAgent.stdout).toContain("run-agent: ok: conv-run")

    const rotateKey = await runTuiCommand("/key rotate")

    expect(rotateKey.stderr).toBe("")
    expect(rotateKey.stdout).toContain("rotate-api-key: ok: API key rotated")
    const requests = seenRequests.map((request) => `${request.method} ${request.url}`)
    expect(requests).toContain("POST /v1/operator/tunnel/start")
    expect(requests).toContain("POST /v1/operator/actions/run-agent")
    expect(requests).toContain("POST /v1/operator/access/rotate-api-key")
    expect(JSON.parse(seenRequests.find((entry) => entry.url === "/v1/operator/actions/run-agent")?.body || "{}")).toEqual({
      prompt: "launch diagnostics",
    })
  })

  async function startMockDaemon(): Promise<number> {
    server = http.createServer((req, res) => {
      let body = ""
      req.setEncoding("utf8")
      req.on("data", (chunk) => {
        body += chunk
      })
      req.on("end", () => {
        seenRequests.push({
          method: req.method,
          url: req.url,
          authorization: req.headers.authorization,
          body,
        })

        if (req.url === "/v1/operator/status" && req.method === "GET") {
          res.writeHead(200, { "content-type": "application/json" })
          res.end(JSON.stringify(mockOperatorStatus(port)))
          return
        }

        if (req.url === "/v1/operator/actions/mcp-restart" && req.method === "POST") {
          res.writeHead(200, { "content-type": "application/json" })
          res.end(JSON.stringify({
            success: true,
            action: "mcp-restart",
            message: "Restarted filesystem",
          }))
          return
        }

        if (req.url === "/v1/mcp/servers/filesystem/toggle" && req.method === "POST") {
          res.writeHead(200, { "content-type": "application/json" })
          res.end(JSON.stringify({
            success: true,
            server: "filesystem",
            enabled: false,
          }))
          return
        }

        if (req.url === "/v1/mcp/servers" && req.method === "GET") {
          res.writeHead(200, { "content-type": "application/json" })
          res.end(JSON.stringify({
            servers: [
              {
                name: "filesystem",
                connected: true,
                toolCount: 2,
                enabled: true,
                runtimeEnabled: true,
                configDisabled: false,
              },
            ],
          }))
          return
        }

        if (req.url === "/v1/operator/errors?count=2" && req.method === "GET") {
          res.writeHead(200, { "content-type": "application/json" })
          res.end(JSON.stringify({
            count: 1,
            errors: [
              {
                timestamp: Date.now(),
                level: "error",
                component: "mock",
                message: "Mock error",
              },
            ],
          }))
          return
        }

        if (req.url === "/v1/operator/logs?count=3&level=error" && req.method === "GET") {
          res.writeHead(200, { "content-type": "application/json" })
          res.end(JSON.stringify({
            count: 1,
            level: "error",
            logs: [
              {
                timestamp: Date.now(),
                level: "error",
                component: "mock",
                message: "Mock log",
              },
            ],
          }))
          return
        }

        if (req.url === "/v1/operator/audit?count=1" && req.method === "GET") {
          res.writeHead(200, { "content-type": "application/json" })
          res.end(JSON.stringify({
            count: 1,
            entries: [
              {
                timestamp: Date.now(),
                action: "mock-action",
                path: "/v1/mock",
                success: true,
                deviceId: "device-1",
              },
            ],
          }))
          return
        }

        if (req.url === "/v1/operator/sessions/sess%2F1/stop" && req.method === "POST") {
          res.writeHead(200, { "content-type": "application/json" })
          res.end(JSON.stringify({
            success: true,
            action: "session-stop",
            message: "Stopped sess/1",
          }))
          return
        }

        if (req.url === "/v1/operator/remote-server" && req.method === "GET") {
          res.writeHead(200, { "content-type": "application/json" })
          res.end(JSON.stringify({
            running: true,
            bind: "127.0.0.1",
            port,
            url: `http://127.0.0.1:${port}`,
            connectableUrl: `http://127.0.0.1:${port}`,
          }))
          return
        }

        if (req.url === "/v1/operator/tunnel/setup" && req.method === "GET") {
          res.writeHead(200, { "content-type": "application/json" })
          res.end(JSON.stringify({
            installed: true,
            loggedIn: true,
            mode: "quick",
            autoStart: false,
            namedTunnelConfigured: false,
            credentialsPathConfigured: false,
            tunnelCount: 1,
            tunnels: [{ id: "tunnel-1", name: "Mock tunnel" }],
          }))
          return
        }

        if (req.url === "/v1/operator/integrations" && req.method === "GET") {
          res.writeHead(200, { "content-type": "application/json" })
          res.end(JSON.stringify(mockOperatorStatus(port).integrations))
          return
        }

        if (req.url === "/v1/operator/discord/logs?count=2" && req.method === "GET") {
          res.writeHead(200, { "content-type": "application/json" })
          res.end(JSON.stringify({
            count: 1,
            logs: [
              {
                id: "discord-log-1",
                level: "info",
                message: "Discord mock log",
                timestamp: Date.now(),
              },
            ],
          }))
          return
        }

        if (req.url === "/v1/operator/discord/logs/clear" && req.method === "POST") {
          res.writeHead(200, { "content-type": "application/json" })
          res.end(JSON.stringify({
            success: true,
            action: "discord-clear-logs",
            message: "Cleared Discord logs",
          }))
          return
        }

        if (req.url === "/v1/operator/whatsapp/logout" && req.method === "POST") {
          res.writeHead(200, { "content-type": "application/json" })
          res.end(JSON.stringify({
            success: true,
            action: "whatsapp-logout",
            message: "Logged out WhatsApp",
          }))
          return
        }

        if (req.url === "/v1/operator/updater/check" && req.method === "POST") {
          res.writeHead(200, { "content-type": "application/json" })
          res.end(JSON.stringify({
            success: true,
            action: "updater-check",
            message: "Checked for updates",
          }))
          return
        }

        if (req.url === "/v1/operator/local-speech-models/parakeet" && req.method === "GET") {
          res.writeHead(200, { "content-type": "application/json" })
          res.end(JSON.stringify({
            downloaded: false,
            downloading: false,
            progress: 0,
          }))
          return
        }

        if (req.url === "/v1/operator/local-speech-models/parakeet/download" && req.method === "POST") {
          res.writeHead(200, { "content-type": "application/json" })
          res.end(JSON.stringify({
            success: true,
            action: "local-speech-download",
            message: "Downloading parakeet",
          }))
          return
        }

        if (req.url === "/v1/operator/actions/restart-remote-server" && req.method === "POST") {
          res.writeHead(200, { "content-type": "application/json" })
          res.end(JSON.stringify({
            success: true,
            action: "restart-remote-server",
            message: "Restarting remote server",
          }))
          return
        }

        if (req.url === "/v1/operator/actions/restart-app" && req.method === "POST") {
          res.writeHead(200, { "content-type": "application/json" })
          res.end(JSON.stringify({
            success: true,
            action: "restart-app",
            message: "Restarting app",
          }))
          return
        }

        if (req.url === "/v1/operator/mcp/filesystem/logs/clear" && req.method === "POST") {
          res.writeHead(200, { "content-type": "application/json" })
          res.end(JSON.stringify({
            success: true,
            action: "mcp-clear-logs",
            message: "Cleared filesystem logs",
          }))
          return
        }

        if (req.url === "/v1/operator/model-presets" && req.method === "POST") {
          res.writeHead(200, { "content-type": "application/json" })
          res.end(JSON.stringify({
            success: true,
            currentModelPresetId: "preset-tui",
            presets: [],
            preset: {
              id: "preset-tui",
              name: "TUI Endpoint",
              baseUrl: "https://example.com/v1",
            },
          }))
          return
        }

        if (req.url === "/v1/operator/model-presets/preset-tui" && req.method === "PATCH") {
          res.writeHead(200, { "content-type": "application/json" })
          res.end(JSON.stringify({
            success: true,
            currentModelPresetId: "preset-tui",
            presets: [],
            preset: {
              id: "preset-tui",
              name: "Updated Endpoint",
              baseUrl: "https://example.com/v1",
            },
          }))
          return
        }

        if (req.url === "/v1/operator/model-presets/preset-tui" && req.method === "DELETE") {
          res.writeHead(200, { "content-type": "application/json" })
          res.end(JSON.stringify({
            success: true,
            currentModelPresetId: "default",
            presets: [],
            deletedPresetId: "preset-tui",
          }))
          return
        }

        if (req.url === "/v1/skills" && req.method === "POST") {
          res.writeHead(200, { "content-type": "application/json" })
          res.end(JSON.stringify({
            success: true,
            skill: {
              id: "tui-skill",
              name: "TUI Skill",
              description: "",
              instructions: "Use the server",
              enabled: true,
              enabledForProfile: true,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
          }))
          return
        }

        if (req.url === "/v1/skills/tui-skill" && req.method === "PATCH") {
          res.writeHead(200, { "content-type": "application/json" })
          res.end(JSON.stringify({
            success: true,
            skill: {
              id: "tui-skill",
              name: "TUI Skill",
              description: "Updated",
              instructions: "Use the server",
              enabled: true,
              enabledForProfile: true,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
          }))
          return
        }

        if (req.url === "/v1/skills/tui-skill/toggle-profile" && req.method === "POST") {
          res.writeHead(200, { "content-type": "application/json" })
          res.end(JSON.stringify({
            success: true,
            skillId: "tui-skill",
            enabledForProfile: true,
          }))
          return
        }

        if (req.url === "/v1/skills/tui-skill" && req.method === "DELETE") {
          res.writeHead(200, { "content-type": "application/json" })
          res.end(JSON.stringify({
            success: true,
            id: "tui-skill",
          }))
          return
        }

        if (req.url === "/v1/settings" && req.method === "PATCH") {
          const parsedBody = body ? JSON.parse(body) : {}
          res.writeHead(200, { "content-type": "application/json" })
          res.end(JSON.stringify({
            success: true,
            updated: Object.keys(parsedBody),
          }))
          return
        }

        if (req.url === "/v1/knowledge/notes" && req.method === "POST") {
          res.writeHead(200, { "content-type": "application/json" })
          res.end(JSON.stringify({
            success: true,
            note: {
              id: "note-tui",
              title: "TUI Note",
              body: "Body",
              context: "search-only",
              tags: [],
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
          }))
          return
        }

        if (req.url === "/v1/knowledge/notes/note-tui" && req.method === "PATCH") {
          res.writeHead(200, { "content-type": "application/json" })
          res.end(JSON.stringify({
            success: true,
            note: {
              id: "note-tui",
              title: "Updated Note",
              body: "Body",
              context: "search-only",
              tags: [],
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
          }))
          return
        }

        if (req.url === "/v1/knowledge/notes/note-1" && req.method === "DELETE") {
          res.writeHead(200, { "content-type": "application/json" })
          res.end(JSON.stringify({
            success: true,
            id: "note-1",
          }))
          return
        }

        if (req.url === "/v1/profiles/main%2Fprofile/export" && req.method === "GET") {
          res.writeHead(200, { "content-type": "application/json" })
          res.end(JSON.stringify({
            profileJson: '{"id":"main/profile","name":"Main"}',
          }))
          return
        }

        if (req.url === "/v1/profiles/import" && req.method === "POST") {
          res.writeHead(200, { "content-type": "application/json" })
          res.end(JSON.stringify({
            success: true,
            profile: {
              id: "imported-profile",
              name: "Imported",
            },
          }))
          return
        }

        if (req.url === "/v1/agent-profiles" && req.method === "POST") {
          res.writeHead(200, { "content-type": "application/json" })
          res.end(JSON.stringify({
            profile: {
              id: "agent-tui",
              name: "TUI Agent",
              displayName: "TUI Agent",
              connectionType: "builtin",
              enabled: true,
            },
          }))
          return
        }

        if (req.url === "/v1/agent-profiles/agent-tui" && req.method === "PATCH") {
          res.writeHead(200, { "content-type": "application/json" })
          res.end(JSON.stringify({
            success: true,
            profile: {
              id: "agent-tui",
              name: "TUI Agent",
              displayName: "TUI Agent",
              connectionType: "builtin",
              enabled: true,
            },
          }))
          return
        }

        if (req.url === "/v1/agent-profiles/agent-tui/toggle" && req.method === "POST") {
          res.writeHead(200, { "content-type": "application/json" })
          res.end(JSON.stringify({
            success: true,
            id: "agent-tui",
            enabled: true,
          }))
          return
        }

        if (req.url === "/v1/agent-profiles/agent-tui" && req.method === "DELETE") {
          res.writeHead(200, { "content-type": "application/json" })
          res.end(JSON.stringify({
            success: true,
            id: "agent-tui",
          }))
          return
        }

        if (req.url === "/v1/loops" && req.method === "POST") {
          res.writeHead(200, { "content-type": "application/json" })
          res.end(JSON.stringify({
            success: true,
            loop: {
              id: "loop-tui",
              name: "TUI Loop",
              prompt: "Run",
              intervalMinutes: 60,
              enabled: true,
            },
          }))
          return
        }

        if (req.url === "/v1/loops/loop-tui" && req.method === "PATCH") {
          res.writeHead(200, { "content-type": "application/json" })
          res.end(JSON.stringify({
            success: true,
            loop: {
              id: "loop-tui",
              name: "Updated Loop",
              prompt: "Run",
              intervalMinutes: 60,
              enabled: true,
            },
          }))
          return
        }

        if (req.url === "/v1/loops/loop-tui/run" && req.method === "POST") {
          res.writeHead(200, { "content-type": "application/json" })
          res.end(JSON.stringify({
            success: true,
            action: "loop-run",
            message: "Ran loop-tui",
          }))
          return
        }

        if (req.url === "/v1/loops/loop-tui/toggle" && req.method === "POST") {
          res.writeHead(200, { "content-type": "application/json" })
          res.end(JSON.stringify({
            success: true,
            action: "loop-toggle",
            message: "Toggled loop-tui",
          }))
          return
        }

        if (req.url === "/v1/loops/loop-tui" && req.method === "DELETE") {
          res.writeHead(200, { "content-type": "application/json" })
          res.end(JSON.stringify({
            success: true,
            id: "loop-tui",
          }))
          return
        }

        if (req.url === "/v1/operator/message-queues" && req.method === "GET") {
          res.writeHead(200, { "content-type": "application/json" })
          res.end(JSON.stringify({
            count: 1,
            totalMessages: 1,
            queues: [
              {
                conversationId: "conv/1",
                isPaused: true,
                messageCount: 1,
                messages: [
                  {
                    id: "msg/1",
                    role: "user",
                    text: "original queued message",
                    status: "pending",
                    createdAt: Date.now(),
                  },
                ],
              },
            ],
          }))
          return
        }

        if (req.url === "/v1/operator/message-queues/conv%2F1/pause" && req.method === "POST") {
          res.writeHead(200, { "content-type": "application/json" })
          res.end(JSON.stringify({
            success: true,
            action: "message-queue-pause",
            message: "Paused conv/1",
          }))
          return
        }

        if (req.url === "/v1/operator/message-queues/conv%2F1/messages/msg%2F1" && req.method === "PATCH") {
          res.writeHead(200, { "content-type": "application/json" })
          res.end(JSON.stringify({
            success: true,
            action: "message-queue-message-update",
            message: "Updated msg/1",
          }))
          return
        }

        if (req.url === "/v1/operator/tunnel/start" && req.method === "POST") {
          res.writeHead(200, { "content-type": "application/json" })
          res.end(JSON.stringify({
            success: true,
            action: "tunnel-start",
            message: "Started quick tunnel",
          }))
          return
        }

        if (req.url === "/v1/operator/actions/run-agent" && req.method === "POST") {
          res.writeHead(200, { "content-type": "application/json" })
          res.end(JSON.stringify({
            success: true,
            action: "run-agent",
            conversationId: "conv-run",
            content: "diagnostics launched",
            messageCount: 2,
          }))
          return
        }

        if (req.url === "/v1/operator/access/rotate-api-key" && req.method === "POST") {
          res.writeHead(200, { "content-type": "application/json" })
          res.end(JSON.stringify({
            success: true,
            action: "rotate-api-key",
            message: "API key rotated",
            apiKey: "new-secret-key",
            restartScheduled: true,
          }))
          return
        }

        if (req.url === "/v1/chat/completions" && req.method === "POST") {
          res.writeHead(200, { "content-type": "text/event-stream" })
          if (body.includes("reset stream")) {
            res.write(
              `data:${JSON.stringify({
                type: "progress",
                data: {
                  streamingContent: { text: "hello from mock daemon" },
                },
              })}\n\n`,
            )
            res.write(
              `data:${JSON.stringify({
                type: "progress",
                data: {
                  streamingContent: { text: "hello" },
                },
              })}\n\n`,
            )
            res.write(
              `data:${JSON.stringify({
                type: "progress",
                data: {
                  streamingContent: { text: "hello again" },
                },
              })}\n\n`,
            )
            res.write(
              `data:${JSON.stringify({
                type: "done",
                data: {
                  content: "hello again final",
                  conversation_id: "conv-reset",
                },
              })}\n\n`,
            )
            res.end()
            return
          }
          res.write(
            `data:${JSON.stringify({
              type: "progress",
              data: {
                steps: [
                  { id: "step-1", type: "thinking", title: "Mock thinking" },
                ],
                streamingContent: { text: "hello from mock" },
              },
            })}\n\n`,
          )
          res.write(
            `data: ${JSON.stringify({
              type: "done",
              data: {
                content: "hello from mock TUI daemon",
                conversation_id: "conv-mock",
              },
            })}\n\n`,
          )
          res.end()
          return
        }

        res.writeHead(404, { "content-type": "application/json" })
        res.end(JSON.stringify({ error: "not found" }))
      })
    })

    await new Promise<void>((resolve) =>
      server!.listen(0, "127.0.0.1", resolve),
    )
    const address = server.address()
    if (!address || typeof address === "string") {
      throw new Error("Mock daemon did not bind to a TCP port")
    }

    return address.port
  }
})

function mockOperatorStatus(port: number) {
  return {
    timestamp: Date.now(),
    remoteServer: {
      running: true,
      bind: "127.0.0.1",
      port,
      url: `http://127.0.0.1:${port}`,
    },
    health: {
      checkedAt: Date.now(),
      overall: "healthy",
      checks: {
        remoteServer: { status: "pass", message: "listening" },
      },
    },
    tunnel: {
      running: false,
      starting: false,
      mode: "quick",
    },
    integrations: {
      discord: {
        enabled: true,
        available: true,
        connected: true,
        configured: true,
        botUser: "dotagents",
        requireMention: true,
        dmEnabled: true,
        logMessagesEnabled: false,
        logs: { total: 0 },
      },
      whatsapp: {
        enabled: false,
        available: true,
        connected: false,
        serverConfigured: false,
        serverConnected: false,
        autoReplyEnabled: false,
        logMessagesEnabled: false,
        allowedSenderCount: 0,
        logs: { total: 0 },
      },
      pushNotifications: {
        enabled: true,
        tokenCount: 1,
        platforms: ["ios"],
      },
    },
    updater: {
      enabled: false,
      mode: "disabled",
    },
    system: {
      platform: "darwin",
      arch: "arm64",
      nodeVersion: "v20.19.4",
      uptimeSeconds: 42,
      processUptimeSeconds: 42,
      memoryUsage: { heapUsedMB: 10, heapTotalMB: 20, rssMB: 30 },
      cpuCount: 8,
      totalMemoryMB: 1000,
      freeMemoryMB: 500,
      hostname: "test-host",
    },
    sessions: {
      activeSessions: 0,
      recentSessions: 2,
      activeSessionDetails: [],
    },
    recentErrors: {
      total: 0,
      errorsInLastFiveMinutes: 0,
    },
  }
}
