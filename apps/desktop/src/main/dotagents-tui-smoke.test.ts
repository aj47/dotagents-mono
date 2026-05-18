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
  const mockAgentProfile = () => ({ id: "agent-tui", name: "TUI Agent", displayName: "TUI Agent", connectionType: "builtin", enabled: true })
  const mockLoop = (overrides: Record<string, unknown> = {}) => ({ id: "loop-tui", name: "TUI Loop", prompt: "Run", intervalMinutes: 60, enabled: true, ...overrides })
  const mockModelPreset = (overrides: Record<string, unknown> = {}) => ({ id: "preset-tui", name: "TUI Endpoint", baseUrl: "https://example.com/v1", ...overrides })
  const mockNote = (overrides: Record<string, unknown> = {}) => ({ id: "note-tui", title: "TUI Note", body: "Body", context: "search-only", tags: [], createdAt: Date.now(), updatedAt: Date.now(), ...overrides })
  const mockSkill = (overrides: Record<string, unknown> = {}) => ({ id: "tui-skill", name: "TUI Skill", description: "", instructions: "Use the server", enabled: true, enabledForProfile: true, createdAt: Date.now(), updatedAt: Date.now(), ...overrides })

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

  function runTuiCommand(command: string, extraEnv: Record<string, string> = {}) {
    return execFileAsync(
      "bun",
      [scriptPath, "--once", command],
      {
        env: { ...childProcessEnv(tmpHome), ...extraEnv },
        timeout: 10_000,
        maxBuffer: 1024 * 1024,
      },
    )
  }
  async function expectTuiOutput(command: string, expected: string, extraEnv: Record<string, string> = {}) {
    const { stdout, stderr } = await runTuiCommand(command, extraEnv)
    expect(stderr).toBe("")
    expect(stdout).toContain(expected)
    return stdout
  }

  it("keeps TUI routed through every shared API client capability", async () => {
    const [tuiSource, sharedClientSource] = await Promise.all([
      fs.readFile(scriptPath, "utf8"),
      fs.readFile(path.join(process.cwd(), "../../packages/shared/src/settings-api-client.ts"), "utf8"),
    ])
    const missing = [...sharedClientSource.matchAll(/^  async (\w+)\(/gm)]
      .map((match) => match[1])
      .filter((method) => method !== "buildRequestHeaders")
      .filter((method) => !tuiSource.includes(`client.${method}(`) && !tuiSource.includes(`settingsApiClient().${method}(`))

    expect(missing).toEqual([])
    expect(tuiSource).toContain("new ExtendedSettingsApiClient")
    expect(tuiSource).not.toContain("async function apiRequest")
    for (const snippet of [
      'command === "config"', 'command === "folders"', 'command === "system-prompt"', "preview-file", '"workspace-knowledge"',
      'command === "sandbox"', 'command === "debug-flags"', 'command === "clipboard"', "import-parent-folder", "export-file", "export-config-file",
      'command === "langfuse"', 'command === "permissions"', "formatRemoteServerQr", "openLoopTaskFileTarget", "openSkillFileTarget", "openKnowledgeNoteFileTarget",
      'command === "window"', 'command === "tts"',
    ]) expect(tuiSource).toContain(snippet)
  })

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

  it("runs local desktop-only config commands without hitting the remote server", async () => {
    const workspaceRoot = path.join(tmpHome!, "workspace")
    const clipboardPath = path.join(tmpHome!, "clipboard.txt")
    const openedPath = path.join(tmpHome!, "opened.txt")
    await fs.mkdir(workspaceRoot, { recursive: true })
    const env = { DOTAGENTS_WORKSPACE_DIR: workspaceRoot, DOTAGENTS_TUI_CLIPBOARD_FILE: clipboardPath, DOTAGENTS_TUI_OPEN_PATH_FILE: openedPath }
    const commands = ["/folders", "/folders open system-prompt", "/folders open global-skills", "/folders open workspace-skills", "/folders open global-knowledge", "/folders open workspace-knowledge", "/config", "/config path", '/config patch {"streamerModeEnabled":true}', "/system-prompt default", "/debug-flags", "/langfuse", "/permissions open-microphone-settings", "/clipboard write copied from tui", "/sandbox", "/sandbox save-baseline", "/sandbox save Experiment Slot", "/sandbox rename experiment-slot renamed-slot", "/sandbox list"]
    const results: Array<{ stdout: string; stderr: string }> = []
    for (const command of commands) results.push(await runTuiCommand(command, env))
    const stdout = results.map((result) => result.stdout).join("\n")
    const opened = await fs.readFile(openedPath, "utf8")

    expect(results.map((result) => result.stderr).join("")).toBe("")
    expect(stdout).toContain(path.join(tmpHome!, ".agents"))
    expect(stdout).toContain(path.join(workspaceRoot, ".agents"))
    expect(stdout).toContain(path.join(tmpHome!, ".config", "app.dotagents", "config.json"))
    expect(stdout).toContain('"streamerModeEnabled": true')
    expect(stdout).toContain("You are an autonomous AI assistant")
    expect(stdout).toContain('"llm": false')
    expect(stdout).toContain("Langfuse installed:")
    expect(await fs.readFile(clipboardPath, "utf8")).toBe("copied from tui")
    expect(opened).toContain(path.join(tmpHome!, ".agents", "skills"))
    expect(opened).toContain(path.join(workspaceRoot, ".agents", "skills"))
    expect(opened).toContain(path.join(tmpHome!, ".agents", "knowledge"))
    expect(opened).toContain(path.join(workspaceRoot, ".agents", "knowledge"))
    expect(opened).toContain("Privacy_Microphone")
    expect(stdout).toContain("sandbox-save-baseline: ok")
    expect(stdout).toContain("Slot: experiment-slot")
    expect(stdout).toContain("Slot: renamed-slot")
    expect(stdout).toContain("renamed-slot (slot")
    expect(seenRequests).toHaveLength(0)
  })

  it("opens generated local files through the terminal path opener", async () => {
    const cases: Array<[string, string, string, string]> = [
      ["/loop open loop-tui", "opened-loop.txt", path.join(tmpHome!, ".agents", "tasks", "loop-tui", "task.md"), "GET /v1/loops"],
      ["/skill open tui-skill", "opened-skill.txt", path.join(tmpHome!, ".agents", "skills", "tui-skill", "skill.md"), "GET /v1/skills/tui-skill"],
      ["/note open note-tui", "opened-note.txt", path.join(tmpHome!, ".agents", "knowledge", "note-tui", "note-tui.md"), "GET /v1/knowledge/notes/note-tui"],
    ]

    for (const [command, captureName, expectedPath, expectedRequest] of cases) {
      const openedPath = path.join(tmpHome!, captureName)
      await expectTuiOutput(command, "open-path: ok", { DOTAGENTS_TUI_OPEN_PATH_FILE: openedPath })
      expect(await fs.readFile(openedPath, "utf8")).toContain(expectedPath)
      expect(seenRequests.map((request) => `${request.method} ${request.url}`)).toContain(expectedRequest)
    }
  })

  it("routes additional operator commands through the shared server API", async () => {
    const cases: Array<[string, string]> = [
      ["/errors 2", "Errors (1)"],
      ["/logs 3 error", "Logs (1)"],
      ["/audit 1", "Audit (1)"],
      ["/session stop sess/1", "session-stop: ok: Stopped sess/1"],
      ["/remote-server", "Remote server"],
      ["/remote-server qr", "Mobile App Connection QR Code"],
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
      await expectTuiOutput(command, expectedOutput)
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
    const serversStdout = await expectTuiOutput("/mcp servers", "Saved MCP servers (1)")
    expect(serversStdout).toContain("filesystem - connected, enabled, 2 tools")
    const serversRequest = seenRequests.find((entry) => entry.url === "/v1/mcp/servers")
    expect(serversRequest?.method).toBe("GET")

    await expectTuiOutput("/mcp restart filesystem", "mcp-restart: ok: Restarted filesystem")
    const request = seenRequests.find((entry) => entry.url === "/v1/operator/actions/mcp-restart")
    expect(request?.method).toBe("POST")
    expect(JSON.parse(request?.body || "{}")).toEqual({ server: "filesystem" })

    await expectTuiOutput("/mcp disable-server filesystem", "mcp-server-toggle: ok")
    const toggleRequest = seenRequests.find((entry) => entry.url === "/v1/mcp/servers/filesystem/toggle")
    expect(toggleRequest?.method).toBe("POST")
    expect(JSON.parse(toggleRequest?.body || "{}")).toEqual({ enabled: false })

    const mcpExportPath = path.join(tmpHome!, "mcp", "servers.json")
    await expectTuiOutput(`/mcp export-config-file ${mcpExportPath}`, "mcp-export-config-file: ok")
    expect(await fs.readFile(mcpExportPath, "utf8")).toContain("filesystem")

    const mcpImportPath = path.join(tmpHome!, "mcp", "import.json")
    await fs.writeFile(mcpImportPath, '{"servers":{"filesystem":{"command":"node"}}}')
    await expectTuiOutput(`/mcp import-config-file ${mcpImportPath}`, '"success": true')
    expect(seenRequests.map((entry) => `${entry.method} ${entry.url}`)).toEqual(expect.arrayContaining([
      "GET /v1/mcp/config/export",
      "POST /v1/mcp/config/import",
    ]))
  })

  it("runs filesystem resource mutations through the shared server API", async () => {
    await expectTuiOutput('/skill create {"name":"TUI Skill","instructions":"Use the server"}', "Skill created: tui-skill - TUI Skill")
    await expectTuiOutput('/settings patch {"streamerModeEnabled":true}', "Settings updated: streamerModeEnabled")
    await expectTuiOutput("/note delete note-1", "Note deleted: note-1")

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
    const skillImportDir = path.join(tmpHome!, "skill-import")
    const skillParentDir = path.join(tmpHome!, "skill-parent")
    await fs.mkdir(path.join(skillParentDir, "child-skill"), { recursive: true })
    await fs.mkdir(skillImportDir, { recursive: true })
    const skillMarkdown = "---\nname: TUI Imported Skill\ndescription: Imported\n---\nUse the imported skill."
    await fs.writeFile(path.join(skillImportDir, "SKILL.md"), skillMarkdown)
    await fs.writeFile(path.join(skillParentDir, "child-skill", "SKILL.md"), skillMarkdown)
    const skillExportPath = path.join(tmpHome!, "skill-export", "tui-skill.md")

    const cases: Array<[string, string]> = [
      ['/preset create {"name":"TUI Endpoint","baseUrl":"https://example.com/v1"}', "Model endpoint created: preset-tui"],
      ['/preset update preset-tui {"name":"Updated Endpoint"}', "Model endpoint updated: preset-tui"],
      ["/preset delete preset-tui", "Model endpoint deleted: preset-tui"],
      ["/preset use preset-tui", "Settings updated: currentModelPresetId"],
      ['/skill update tui-skill {"description":"Updated"}', "Skill updated: tui-skill - TUI Skill"],
      ["/skill toggle tui-skill", "Skill tui-skill is now enabled"],
      ["/skill delete tui-skill", "Skill deleted: tui-skill"],
      [`/skill import-file ${path.join(skillImportDir, "SKILL.md")}`, "Skill imported: tui-skill - TUI Skill"],
      [`/skill import-folder ${skillImportDir}`, "Skill imported: tui-skill - TUI Skill"],
      [`/skill import-parent-folder ${skillParentDir}`, "tui-skill"],
      [`/skill export-file tui-skill ${skillExportPath}`, "skill-export-file: ok"],
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
      await expectTuiOutput(command, expectedOutput)
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
      "POST /v1/skills/import/markdown",
      "GET /v1/skills/tui-skill/export/markdown",
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
    expect(await fs.readFile(skillExportPath, "utf8")).toContain("TUI Skill")
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
    await expectTuiOutput("/profile export main/profile", '"id":"main/profile"')
    await expectTuiOutput('/profile import {"id":"imported-profile","name":"Imported"}', "Profile imported: imported-profile")
    expect(seenRequests.map((request) => `${request.method} ${request.url}`)).toContain("GET /v1/profiles/main%2Fprofile/export")
    expect(seenRequests.map((request) => `${request.method} ${request.url}`)).toContain("POST /v1/profiles/import")
    expect(JSON.parse(seenRequests.find((entry) => entry.url === "/v1/profiles/import")?.body || "{}")).toEqual({
      profileJson: '{"id":"imported-profile","name":"Imported"}',
    })
  })

  it("uses file paths for bundle import and export workflows", async () => {
    const bundlePath = path.join(tmpHome!, "bundle.json")
    const exportPath = path.join(tmpHome!, "exports", "bundle.json")
    await fs.writeFile(bundlePath, '{"manifest":{"name":"TUI Bundle"}}')

    await expectTuiOutput(`/bundle export-file ${exportPath}`, "bundle-export-file: ok")
    await expectTuiOutput(`/bundle preview-file ${bundlePath}`, "TUI Bundle")
    await expectTuiOutput(`/bundle import-file ${bundlePath}`, '"success": true')
    expect(await fs.readFile(exportPath, "utf8")).toContain("TUI Bundle")
    expect(seenRequests.map((request) => `${request.method} ${request.url}`)).toEqual(expect.arrayContaining([
      "POST /v1/bundles/export",
      "POST /v1/bundles/import/preview",
      "POST /v1/bundles/import",
    ]))
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
    const queues = await expectTuiOutput("/queues", "Message queues (1 conversations, 1 messages)")
    expect(queues).toContain("conv/1 - 1 message(s), paused")

    await expectTuiOutput("/queue pause conv/1", "message-queue-pause: ok: Paused conv/1")
    await expectTuiOutput("/queue msg update conv/1 msg/1 edited from tui", "message-queue-message-update: ok: Updated msg/1")
    const requests = seenRequests.map((request) => `${request.method} ${request.url}`)
    expect(requests).toContain("GET /v1/operator/message-queues")
    expect(requests).toContain("POST /v1/operator/message-queues/conv%2F1/pause")
    expect(requests).toContain("PATCH /v1/operator/message-queues/conv%2F1/messages/msg%2F1")
    expect(JSON.parse(seenRequests.find((entry) => entry.url === "/v1/operator/message-queues/conv%2F1/messages/msg%2F1")?.body || "{}")).toEqual({
      text: "edited from tui",
    })
  })

  it("runs operator lifecycle actions through the shared server API", async () => {
    await expectTuiOutput("/tunnel start", "tunnel-start: ok: Started quick tunnel")
    await expectTuiOutput("/run-agent launch diagnostics", "run-agent: ok: conv-run")
    await expectTuiOutput("/key rotate", "rotate-api-key: ok: API key rotated")
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

        const sendJson = (payload: unknown, statusCode = 200) => {
          res.writeHead(statusCode, { "content-type": "application/json" })
          res.end(JSON.stringify(payload))
        }

        const jsonRoutes: Record<string, () => unknown> = {
          "GET /v1/operator/status": () => mockOperatorStatus(port),
          "POST /v1/operator/actions/mcp-restart": () => ({
            success: true,
            action: "mcp-restart",
            message: "Restarted filesystem",
          }),
          "POST /v1/mcp/servers/filesystem/toggle": () => ({
            success: true,
            server: "filesystem",
            enabled: false,
          }),
          "GET /v1/mcp/servers": () => ({
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
          }),
          "GET /v1/mcp/config/export": () => ({
            servers: { filesystem: { command: "node" } },
          }),
          "POST /v1/mcp/config/import": () => ({
            success: true,
            imported: ["filesystem"],
          }),
          "GET /v1/operator/errors?count=2": () => ({
            count: 1,
            errors: [
              {
                timestamp: Date.now(),
                level: "error",
                component: "mock",
                message: "Mock error",
              },
            ],
          }),
          "GET /v1/operator/logs?count=3&level=error": () => ({
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
          }),
          "GET /v1/operator/audit?count=1": () => ({
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
          }),
          "POST /v1/operator/sessions/sess%2F1/stop": () => ({
            success: true,
            action: "session-stop",
            message: "Stopped sess/1",
          }),
          "GET /v1/operator/remote-server": () => ({
            running: true,
            bind: "127.0.0.1",
            port,
            url: `http://127.0.0.1:${port}`,
            connectableUrl: `http://127.0.0.1:${port}`,
          }),
          "GET /v1/operator/tunnel/setup": () => ({
            installed: true,
            loggedIn: true,
            mode: "quick",
            autoStart: false,
            namedTunnelConfigured: false,
            credentialsPathConfigured: false,
            tunnelCount: 1,
            tunnels: [{ id: "tunnel-1", name: "Mock tunnel" }],
          }),
          "GET /v1/operator/integrations": () => mockOperatorStatus(port).integrations,
          "POST /v1/bundles/export": () => ({
            success: true,
            bundle: { manifest: { name: "TUI Bundle" } },
            bundleJson: '{"manifest":{"name":"TUI Bundle"}}',
          }),
          "POST /v1/bundles/import/preview": () => ({
            success: true,
            bundle: { manifest: { name: "TUI Bundle" } },
            conflicts: {},
          }),
          "POST /v1/bundles/import": () => ({
            success: true,
            imported: { skills: 1 },
          }),
          "GET /v1/operator/discord/logs?count=2": () => ({
            count: 1,
            logs: [
              {
                id: "discord-log-1",
                level: "info",
                message: "Discord mock log",
                timestamp: Date.now(),
              },
            ],
          }),
          "POST /v1/operator/discord/logs/clear": () => ({
            success: true,
            action: "discord-clear-logs",
            message: "Cleared Discord logs",
          }),
          "POST /v1/operator/whatsapp/logout": () => ({
            success: true,
            action: "whatsapp-logout",
            message: "Logged out WhatsApp",
          }),
          "POST /v1/operator/updater/check": () => ({
            success: true,
            action: "updater-check",
            message: "Checked for updates",
          }),
          "GET /v1/operator/local-speech-models/parakeet": () => ({
            downloaded: false,
            downloading: false,
            progress: 0,
          }),
          "POST /v1/operator/local-speech-models/parakeet/download": () => ({
            success: true,
            action: "local-speech-download",
            message: "Downloading parakeet",
          }),
          "POST /v1/operator/actions/restart-remote-server": () => ({
            success: true,
            action: "restart-remote-server",
            message: "Restarting remote server",
          }),
          "POST /v1/operator/actions/restart-app": () => ({
            success: true,
            action: "restart-app",
            message: "Restarting app",
          }),
          "POST /v1/operator/mcp/filesystem/logs/clear": () => ({
            success: true,
            action: "mcp-clear-logs",
            message: "Cleared filesystem logs",
          }),
          "POST /v1/operator/model-presets": () => ({
            success: true,
            currentModelPresetId: "preset-tui",
            presets: [],
            preset: mockModelPreset(),
          }),
          "PATCH /v1/operator/model-presets/preset-tui": () => ({
            success: true,
            currentModelPresetId: "preset-tui",
            presets: [],
            preset: mockModelPreset({ name: "Updated Endpoint" }),
          }),
          "DELETE /v1/operator/model-presets/preset-tui": () => ({
            success: true,
            currentModelPresetId: "default",
            presets: [],
            deletedPresetId: "preset-tui",
          }),
          "GET /v1/skills/tui-skill": () => ({
            skill: mockSkill(),
          }),
          "POST /v1/skills": () => ({
            success: true,
            skill: mockSkill(),
          }),
          "PATCH /v1/skills/tui-skill": () => ({
            success: true,
            skill: mockSkill({ description: "Updated" }),
          }),
          "POST /v1/skills/tui-skill/toggle-profile": () => ({
            success: true,
            skillId: "tui-skill",
            enabledForProfile: true,
          }),
          "DELETE /v1/skills/tui-skill": () => ({
            success: true,
            id: "tui-skill",
          }),
          "POST /v1/skills/import/markdown": () => ({
            success: true,
            skill: mockSkill(),
          }),
          "GET /v1/skills/tui-skill/export/markdown": () => ({
            content: "---\nname: TUI Skill\n---\nUse the server.",
          }),
          "GET /v1/knowledge/notes/note-tui": () => ({
            note: mockNote(),
          }),
          "POST /v1/knowledge/notes": () => ({
            success: true,
            note: mockNote(),
          }),
          "PATCH /v1/knowledge/notes/note-tui": () => ({
            success: true,
            note: mockNote({ title: "Updated Note" }),
          }),
          "DELETE /v1/knowledge/notes/note-1": () => ({
            success: true,
            id: "note-1",
          }),
          "GET /v1/profiles/main%2Fprofile/export": () => ({
            profileJson: '{"id":"main/profile","name":"Main"}',
          }),
          "POST /v1/profiles/import": () => ({
            success: true,
            profile: {
              id: "imported-profile",
              name: "Imported",
            },
          }),
          "POST /v1/agent-profiles": () => ({
            profile: mockAgentProfile(),
          }),
          "PATCH /v1/agent-profiles/agent-tui": () => ({
            success: true,
            profile: mockAgentProfile(),
          }),
          "POST /v1/agent-profiles/agent-tui/toggle": () => ({
            success: true,
            id: "agent-tui",
            enabled: true,
          }),
          "DELETE /v1/agent-profiles/agent-tui": () => ({
            success: true,
            id: "agent-tui",
          }),
          "GET /v1/loops": () => ({
            loops: [mockLoop()],
          }),
          "POST /v1/loops": () => ({
            success: true,
            loop: mockLoop(),
          }),
          "PATCH /v1/loops/loop-tui": () => ({
            success: true,
            loop: mockLoop({ name: "Updated Loop" }),
          }),
          "POST /v1/loops/loop-tui/run": () => ({
            success: true,
            action: "loop-run",
            message: "Ran loop-tui",
          }),
          "POST /v1/loops/loop-tui/toggle": () => ({
            success: true,
            action: "loop-toggle",
            message: "Toggled loop-tui",
          }),
          "DELETE /v1/loops/loop-tui": () => ({
            success: true,
            id: "loop-tui",
          }),
          "GET /v1/operator/message-queues": () => ({
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
          }),
          "POST /v1/operator/message-queues/conv%2F1/pause": () => ({
            success: true,
            action: "message-queue-pause",
            message: "Paused conv/1",
          }),
          "PATCH /v1/operator/message-queues/conv%2F1/messages/msg%2F1": () => ({
            success: true,
            action: "message-queue-message-update",
            message: "Updated msg/1",
          }),
          "POST /v1/operator/tunnel/start": () => ({
            success: true,
            action: "tunnel-start",
            message: "Started quick tunnel",
          }),
          "POST /v1/operator/actions/run-agent": () => ({
            success: true,
            action: "run-agent",
            conversationId: "conv-run",
            content: "diagnostics launched",
            messageCount: 2,
          }),
          "POST /v1/operator/access/rotate-api-key": () => ({
            success: true,
            action: "rotate-api-key",
            message: "API key rotated",
            apiKey: "new-secret-key",
            restartScheduled: true,
          }),
          "PATCH /v1/settings": () => {
            const parsedBody = body ? JSON.parse(body) : {}
            return { success: true, updated: Object.keys(parsedBody) }
          },
        }
        const jsonRoute = jsonRoutes[`${req.method} ${req.url}`]
        if (jsonRoute) {
          sendJson(jsonRoute())
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
