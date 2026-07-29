import { spawn, type ChildProcessWithoutNullStreams } from "child_process"
import fs from "fs"
import net from "net"
import os from "os"
import path from "path"
import {
  LONG_AGENT_LOOP_SANDBOX_DELAY_MS,
  longAgentLoopSandboxPackets,
  type LongAgentLoopSandboxPacketId,
} from "../src/main/agent-loop-long-sandbox-fixture"

type CdpTarget = {
  id: string
  type: string
  title: string
  url: string
  webSocketDebuggerUrl?: string
}

type AgentSession = {
  id: string
  conversationId?: string
  conversationTitle?: string
  status: "active" | "completed" | "error" | "stopped"
  startTime: number
  endTime?: number
  lastActivity?: string
}

type SessionSnapshot = {
  activeSessions: AgentSession[]
  recentCompletedSessions: AgentSession[]
  recentSessions?: AgentSession[]
}

type Scenario = {
  packetId: LongAgentLoopSandboxPacketId
  marker: string
  serverName: string
  prompt: string
}

class FatalWaitError extends Error {}

const cwd = process.cwd()
const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm"
const runId = new Date().toISOString().replace(/[:.]/g, "-")
const outputRoot = path.join(cwd, "tmp", "e2e-agent-loop")
const runDir = path.join(outputRoot, runId)
const electronLogPath = path.join(runDir, "electron.log")
const sandboxLogPath = path.join(runDir, "sandbox-tools.jsonl")
const runnerMetricsPath = path.join(runDir, "runner-metrics.jsonl")
const summaryPath = path.join(runDir, "summary.json")

function nowIso(): string {
  return new Date().toISOString()
}

async function timedStage<T>(name: string, fn: () => Promise<T> | T): Promise<T> {
  const startedAt = performance.now()
  appendJsonl(runnerMetricsPath, {
    event: "stage_start",
    stage: name,
    at: Date.now(),
    atIso: nowIso(),
  })
  try {
    const result = await fn()
    appendJsonl(runnerMetricsPath, {
      event: "stage_end",
      stage: name,
      status: "pass",
      at: Date.now(),
      atIso: nowIso(),
      durationMs: Math.round(performance.now() - startedAt),
    })
    return result
  } catch (error) {
    appendJsonl(runnerMetricsPath, {
      event: "stage_end",
      stage: name,
      status: "fail",
      at: Date.now(),
      atIso: nowIso(),
      durationMs: Math.round(performance.now() - startedAt),
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
}

function assertOptIn(): void {
  if (process.env.LONG_AGENT_LOOP_E2E !== "1") {
    throw new Error(
      "LONG_AGENT_LOOP_E2E=1 is required. This test launches real Electron and uses real ChatGPT Web/Codex auth.",
    )
  }
}

function resolveCodexHome(): string {
  return process.env.CODEX_HOME?.trim() || path.join(os.homedir(), ".codex")
}

function assertCodexAuth(): string {
  const codexHome = resolveCodexHome()
  const authPath = path.join(codexHome, "auth.json")
  const parsed = JSON.parse(fs.readFileSync(authPath, "utf8")) as {
    auth_mode?: string
    tokens?: { access_token?: unknown }
  }
  if ((parsed.auth_mode && parsed.auth_mode !== "chatgpt") || typeof parsed.tokens?.access_token !== "string") {
    throw new Error(`Codex ChatGPT auth was not found in ${authPath}`)
  }
  return codexHome
}

function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.once("error", reject)
    server.listen(0, "127.0.0.1", () => {
      const address = server.address()
      if (!address || typeof address === "string") {
        server.close(() => reject(new Error("Failed to allocate a TCP port")))
        return
      }
      const port = address.port
      server.close(() => resolve(port))
    })
  })
}

function writeJson(filePath: string, value: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2))
}

function appendJsonl(filePath: string, payload: Record<string, unknown>): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.appendFileSync(filePath, `${JSON.stringify(payload)}\n`)
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs)
  })
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer)
  }) as Promise<T>
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function waitForProcessExit(child: ChildProcessWithoutNullStreams, timeoutMs: number): Promise<boolean> {
  if (child.exitCode !== null || child.signalCode !== null) return Promise.resolve(true)
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      child.off("exit", onExit)
      resolve(false)
    }, timeoutMs)
    const onExit = () => {
      clearTimeout(timer)
      resolve(true)
    }
    child.once("exit", onExit)
  })
}

async function terminateProcessGroup(child: ChildProcessWithoutNullStreams, label: string): Promise<void> {
  if (child.exitCode !== null || child.signalCode !== null) return
  const pid = child.pid
  if (!pid) return
  const targetPid = process.platform === "win32" ? pid : -pid
  for (const signal of ["SIGTERM", "SIGKILL"] as const) {
    try {
      process.kill(targetPid, signal)
      appendJsonl(runnerMetricsPath, {
        event: "process_kill",
        label,
        pid,
        targetPid,
        signal,
        at: Date.now(),
      })
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ESRCH") {
        appendJsonl(runnerMetricsPath, {
          event: "process_kill_error",
          label,
          pid,
          targetPid,
          signal,
          error: error instanceof Error ? error.message : String(error),
          at: Date.now(),
        })
      }
    }
    if (await waitForProcessExit(child, signal === "SIGTERM" ? 3_000 : 1_000)) return
  }
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
  }
  return response.json() as Promise<T>
}

class CdpClient {
  private websocket: WebSocket | undefined
  private nextId = 1
  private pending = new Map<number, { resolve: (value: any) => void; reject: (error: Error) => void }>()

  constructor(private readonly webSocketUrl: string) {}

  async connect(): Promise<void> {
    const websocket = new WebSocket(this.webSocketUrl)
    this.websocket = websocket
    await new Promise<void>((resolve, reject) => {
      websocket.addEventListener("open", () => resolve(), { once: true })
      websocket.addEventListener("error", () => reject(new Error("Failed to connect to renderer CDP websocket")), { once: true })
    })
    websocket.addEventListener("message", async (event) => {
      const raw = typeof event.data === "string" ? event.data : await new Response(event.data).text()
      const payload = JSON.parse(raw)
      if (!payload.id) return
      const request = this.pending.get(payload.id)
      if (!request) return
      this.pending.delete(payload.id)
      if (payload.error) request.reject(new Error(payload.error.message || "Unknown CDP error"))
      else request.resolve(payload.result)
    })
    await this.send("Runtime.enable")
    await this.send("Performance.enable")
  }

  close(): void {
    this.websocket?.close()
  }

  send<T>(method: string, params?: Record<string, unknown>): Promise<T> {
    if (!this.websocket) throw new Error("CDP websocket is not connected")
    const id = this.nextId++
    this.websocket.send(JSON.stringify({ id, method, params }))
    return new Promise<T>((resolve, reject) => this.pending.set(id, { resolve, reject }))
  }

  async evaluate<T>(expression: string, timeoutMs = 5_000): Promise<T> {
    const result = await withTimeout(
      this.send<{
        result?: { value?: T }
        exceptionDetails?: { text?: string; exception?: { description?: string } }
      }>("Runtime.evaluate", {
        expression,
        awaitPromise: true,
        returnByValue: true,
        userGesture: true,
      }),
      timeoutMs,
      "Runtime.evaluate",
    )
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text || "CDP evaluation failed")
    }
    return result.result?.value as T
  }
}

function pickRendererTarget(targets: CdpTarget[]): CdpTarget {
  const pages = targets.filter((target) => target.type === "page" && target.webSocketDebuggerUrl)
  const main = pages.find((target) => !target.url.includes("/panel")) ?? pages[0]
  if (!main) throw new Error("No renderer page target found on the CDP endpoint")
  return main
}

async function waitForRendererTarget(port: number, appProcess: ChildProcessWithoutNullStreams): Promise<CdpTarget> {
  const startedAt = Date.now()
  let lastError: unknown
  while (Date.now() - startedAt < 90_000) {
    if (appProcess.exitCode !== null) {
      throw new Error(`Electron exited before CDP became available with code ${appProcess.exitCode}`)
    }
    try {
      const targets = await fetchJson<CdpTarget[]>(`http://127.0.0.1:${port}/json/list`)
      const target = pickRendererTarget(targets)
      if (target.webSocketDebuggerUrl) return target
    } catch (error) {
      lastError = error
    }
    await sleep(500)
  }
  throw new Error(`Timed out waiting for Electron CDP target: ${lastError instanceof Error ? lastError.message : String(lastError)}`)
}

async function waitFor<T>(
  label: string,
  timeoutMs: number,
  fn: () => Promise<T | undefined | false | null>,
  intervalMs = 1_000,
): Promise<T> {
  const startedAt = Date.now()
  let lastError: unknown
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const result = await fn()
      if (result) return result
    } catch (error) {
      if (error instanceof FatalWaitError) throw error
      lastError = error
    }
    await sleep(intervalMs)
  }
  throw new Error(`${label} timed out${lastError instanceof Error ? `: ${lastError.message}` : ""}`)
}

function jsString(value: string): string {
  return JSON.stringify(value)
}

async function clickByLabel(cdp: CdpClient, label: string): Promise<void> {
  const clicked = await cdp.evaluate<boolean>(`
    (() => {
      const label = ${jsString(label)}
      const elements = Array.from(document.querySelectorAll('button, [role="button"], a'))
      const element = elements.find((node) =>
        node.getAttribute('aria-label') === label ||
        node.getAttribute('title') === label ||
        (node.textContent || '').trim() === label
      )
      if (!element) return false
      element.scrollIntoView({ block: 'center', inline: 'center' })
      element.click()
      return true
    })()
  `)
  if (!clicked) throw new Error(`Could not find clickable element: ${label}`)
}

async function fillMessageAndSend(cdp: CdpClient, text: string): Promise<void> {
  await waitFor("message input", 15_000, async () => {
    return cdp.evaluate<boolean>(`Boolean(document.querySelector('textarea[aria-label="Message input"]'))`)
  }, 250)

  await cdp.evaluate<boolean>(`
    (() => {
      const textarea = document.querySelector('textarea[aria-label="Message input"]')
      if (!textarea) return false
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set
      setter?.call(textarea, ${jsString(text)})
      textarea.dispatchEvent(new Event('input', { bubbles: true }))
      textarea.dispatchEvent(new Event('change', { bubbles: true }))
      return true
    })()
  `)

  await waitFor("enabled Send button", 10_000, async () => {
    return cdp.evaluate<boolean>(`
      (() => {
        const buttons = Array.from(document.querySelectorAll('button'))
        return buttons.some((button) => (button.textContent || '').trim() === 'Send' && !button.disabled)
      })()
    `)
  }, 250)

  const sent = await cdp.evaluate<boolean>(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'))
      const button = buttons.find((node) => (node.textContent || '').trim() === 'Send' && !node.disabled)
      if (!button) return false
      button.click()
      return true
    })()
  `)
  if (!sent) throw new Error("Could not click Send")
}

async function invokeIpc<T>(cdp: CdpClient, channel: string, input?: unknown, timeoutMs = 5_000): Promise<T> {
  const hasInput = arguments.length >= 3
  return cdp.evaluate<T>(`
    window.electron.ipcRenderer.invoke(${jsString(channel)}${hasInput ? `, ${JSON.stringify(input)}` : ""})
  `, timeoutMs)
}

function createScenarios(): Scenario[] {
  return (["aurora", "boreal", "cedar"] as const).map((packetId) => {
    const serverName = `sandbox_${packetId}`
    const marker = `Long E2E sandbox audit ${packetId.toUpperCase()}`
    return {
      packetId,
      marker,
      serverName,
      prompt: [
        `${marker}.`,
        `Audit the sandbox case packet using only tools from the ${serverName} MCP server.`,
        "Identify the only release candidate that satisfies all hidden fixture constraints.",
        "Do not answer from the prompt alone; the decisive evidence is only available from tools.",
        "Use at least these discovery tools before the final answer: list_cases, read_case_file, search_case_notes, read_run_log, summarize_findings.",
        "Then call write_final_audit for the candidate you selected.",
        "Final answer requirements: include the final audit receipt, selected release candidate ID, hidden constraint token, and cited case IDs.",
      ].join("\n"),
    }
  })
}

function prepareConfig(appDataDir: string, userDataDir: string, codexHome: string, scenarios: Scenario[]): void {
  const appId = "app.dotagents.long-agent-loop-e2e"
  const appConfigDir = path.join(appDataDir, appId)
  const serverScript = path.join(cwd, "scripts", "agent-loop-long-sandbox-mcp.ts")
  const model = process.env.LONG_AGENT_LOOP_MODEL || "gpt-5.4-mini"
  const parsedDelayMs = Number(process.env.LONG_AGENT_LOOP_SANDBOX_DELAY_MS)
  const delayMs = Number.isFinite(parsedDelayMs) ? parsedDelayMs : LONG_AGENT_LOOP_SANDBOX_DELAY_MS

  fs.mkdirSync(appConfigDir, { recursive: true })
  fs.mkdirSync(userDataDir, { recursive: true })

  writeJson(path.join(appConfigDir, "config.json"), {
    onboardingCompleted: true,
    floatingPanelAutoShow: false,
    hidePanelWhenMainFocused: false,
    ttsEnabled: false,
    ttsAutoPlay: false,
    langfuseEnabled: false,
    mcpRequireApprovalBeforeToolCall: false,
    mcpMessageQueueEnabled: true,
    mcpParallelToolExecution: false,
    mcpUnlimitedIterations: false,
    mcpMaxIterations: 10,
    mcpVerifyCompletionEnabled: true,
    mcpVerifyRetryCount: 1,
    mcpFinalSummaryEnabled: false,
    apiRetryCount: 1,
    apiRetryBaseDelay: 500,
    apiRetryMaxDelay: 2_000,
    agentProviderId: "chatgpt-web",
    mcpToolsProviderId: "chatgpt-web",
    agentChatgptWebModel: model,
    mcpToolsChatgptWebModel: model,
    openaiReasoningEffort: "low",
    codexTextVerbosity: "low",
    chatgptWebBaseUrl: "https://chatgpt.com",
    mcpConfig: {
      mcpServers: Object.fromEntries(scenarios.map((scenario) => [
        scenario.serverName,
        {
          transport: "stdio",
          command: pnpm,
          args: [
            "exec",
            "tsx",
            serverScript,
            "--packet",
            scenario.packetId,
            "--delay-ms",
            String(delayMs),
            "--log",
            sandboxLogPath,
          ],
          env: {
            CODEX_HOME: codexHome,
            LONG_AGENT_LOOP_SANDBOX_LOG: sandboxLogPath,
          },
          timeout: 30_000,
        },
      ])),
    },
  })

  writeJson(path.join(userDataDir, "agent-profiles.json"), {
    currentProfileId: "long-agent-loop-e2e-profile",
    profiles: [
      {
        id: "long-agent-loop-e2e-profile",
        name: "long-agent-loop-e2e",
        displayName: "Long Agent Loop E2E",
        description: "Opt-in long-running Electron E2E profile.",
        systemPrompt: [
          "You are running a deterministic DotAgents Electron E2E.",
          "Use the sandbox MCP tools requested by the user.",
          "Do not use shell or filesystem tools for the sandbox audit.",
          "Call the final audit tool before giving the final answer.",
        ].join("\n"),
        guidelines: "",
        connection: { type: "internal" },
        isStateful: false,
        role: "chat-agent",
        enabled: true,
        isBuiltIn: false,
        isUserProfile: true,
        isAgentTarget: false,
        isDefault: true,
        toolConfig: {
          allServersDisabledByDefault: false,
          disabledServers: [],
          disabledTools: [],
          enabledRuntimeTools: ["mark_work_complete"],
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ],
  })
}

function startElectron(env: NodeJS.ProcessEnv, remoteDebuggingPort: number, userDataDir: string): ChildProcessWithoutNullStreams {
  const child = spawn(
    pnpm,
    [
      "exec",
      "electron-vite",
      "dev",
      "--watch",
      "--",
      `--user-data-dir=${userDataDir}`,
    ],
    {
      cwd,
      env: {
        ...env,
        REMOTE_DEBUGGING_PORT: String(remoteDebuggingPort),
      },
      stdio: ["ignore", "pipe", "pipe"],
      detached: process.platform !== "win32",
    },
  )

  const logStream = fs.createWriteStream(electronLogPath, { flags: "a" })
  child.stdout.pipe(logStream)
  child.stderr.pipe(logStream)
  child.on("exit", (code, signal) => {
    appendJsonl(runnerMetricsPath, { event: "electron_exit", code, signal, at: Date.now() })
  })
  child.on("close", () => logStream.end())
  return child
}

function startPerfRecorder(remoteDebuggingPort: number): ChildProcessWithoutNullStreams {
  const outputDir = path.relative(cwd, runDir)
  const child = spawn(
    pnpm,
    [
      "exec",
      "tsx",
      "scripts/renderer-perf-recorder.ts",
      "--port",
      String(remoteDebuggingPort),
      "--duration-seconds",
      "300",
      "--metrics-interval-ms",
      "1000",
      "--output-dir",
      outputDir,
      "--label",
      "long-agent-loop-renderer",
    ],
    { cwd, env: process.env, stdio: ["ignore", "pipe", "pipe"], detached: process.platform !== "win32" },
  )
  const logStream = fs.createWriteStream(path.join(runDir, "renderer-perf-recorder.log"), { flags: "a" })
  child.stdout.pipe(logStream)
  child.stderr.pipe(logStream)
  child.on("close", () => logStream.end())
  return child
}

async function startScenario(cdp: CdpClient, scenario: Scenario): Promise<void> {
  await waitFor("Start text session button", 20_000, async () => {
    try {
      await clickByLabel(cdp, "Start text session")
      return true
    } catch {
      return false
    }
  }, 500)
  await fillMessageAndSend(cdp, scenario.prompt)
  await waitFor(`session ${scenario.packetId} to appear`, 30_000, async () => {
    const sessions = await invokeIpc<SessionSnapshot>(cdp, "getAgentSessions", undefined, 5_000)
    const allSessions = [...sessions.activeSessions, ...sessions.recentCompletedSessions]
    return allSessions.some((session) => session.conversationTitle?.includes(scenario.marker))
  }, 500)
}

async function clickSessionByMarker(cdp: CdpClient, marker: string): Promise<number> {
  const startedAt = performance.now()
  const result = await cdp.evaluate<{ clicked: boolean; text?: string }>(`
    (() => {
      const marker = ${jsString(marker)}
      const elements = Array.from(document.querySelectorAll('button, [role="button"], [class*="cursor-pointer"], a'))
      const element = elements.find((node) => (node.textContent || '').includes(marker))
      if (!element) return { clicked: false }
      element.scrollIntoView({ block: 'center', inline: 'nearest' })
      element.click()
      return { clicked: true, text: (element.textContent || '').slice(0, 240) }
    })()
  `, 2_000)
  if (!result.clicked) throw new Error(`Could not click session row for ${marker}`)
  return Math.round(performance.now() - startedAt)
}

async function captureHeartbeat(cdp: CdpClient, scenarios: Scenario[]): Promise<{
  domTextLength: number
  domTextHash: number
  activeCount: number
  completedCount: number
  sessionActivities: Record<string, string | undefined>
  jsHeapUsedSize?: number
}> {
  const [dom, sessions, performanceMetrics] = await Promise.all([
    cdp.evaluate<{ textLength: number; hash: number }>(`
      (() => {
        const text = document.body?.innerText || ''
        let hash = 0
        for (let i = 0; i < text.length; i += 1) hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0
        return { textLength: text.length, hash }
      })()
    `, 2_000),
    invokeIpc<SessionSnapshot>(cdp, "getAgentSessions", undefined, 2_000),
    cdp.send<{ metrics: Array<{ name: string; value: number }> }>("Performance.getMetrics"),
  ])
  const metrics = Object.fromEntries(performanceMetrics.metrics.map((metric) => [metric.name, metric.value]))
  const allSessions = [...sessions.activeSessions, ...sessions.recentCompletedSessions]
  return {
    domTextLength: dom.textLength,
    domTextHash: dom.hash,
    activeCount: sessions.activeSessions.length,
    completedCount: sessions.recentCompletedSessions.length,
    sessionActivities: Object.fromEntries(scenarios.map((scenario) => {
      const session = allSessions.find((candidate) => candidate.conversationTitle?.includes(scenario.marker))
      return [scenario.packetId, session?.lastActivity]
    })),
    jsHeapUsedSize: metrics.JSHeapUsedSize,
  }
}

function parseSandboxLog(): Array<Record<string, unknown>> {
  if (!fs.existsSync(sandboxLogPath)) return []
  return fs.readFileSync(sandboxLogPath, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as Record<string, unknown>)
}

function getToolSummary(packetId: LongAgentLoopSandboxPacketId) {
  const entries = parseSandboxLog().filter((entry) => entry.packetId === packetId && entry.event === "tool_end")
  const toolNames = entries.map((entry) => String(entry.toolName || ""))
  return {
    total: entries.length,
    distinct: Array.from(new Set(toolNames)).filter(Boolean),
    entries,
  }
}

async function waitForCompletion(cdp: CdpClient, scenarios: Scenario[]): Promise<Map<LongAgentLoopSandboxPacketId, AgentSession>> {
  const completedByPacket = new Map<LongAgentLoopSandboxPacketId, AgentSession>()
  let lastDomHash: number | undefined
  let lastActivitySnapshot = ""
  let lastChangeAt = Date.now()
  let lastSwitchAt = 0

  await waitFor("all long agent sessions to complete", 240_000, async () => {
    let heartbeat: Awaited<ReturnType<typeof captureHeartbeat>>
    try {
      heartbeat = await captureHeartbeat(cdp, scenarios)
    } catch (error) {
      throw new FatalWaitError(`Renderer heartbeat failed: ${error instanceof Error ? error.message : String(error)}`)
    }
    const activitySnapshot = JSON.stringify(heartbeat.sessionActivities)
    const changed = heartbeat.domTextHash !== lastDomHash || activitySnapshot !== lastActivitySnapshot
    if (changed) {
      lastChangeAt = Date.now()
      lastDomHash = heartbeat.domTextHash
      lastActivitySnapshot = activitySnapshot
    }

    if (heartbeat.activeCount > 0 && Date.now() - lastChangeAt > 45_000) {
      throw new FatalWaitError("Renderer heartbeat stopped changing while sessions were active")
    }

    if (Date.now() - lastSwitchAt > 8_000) {
      const activeScenario = scenarios.find((scenario) => !completedByPacket.has(scenario.packetId))
      if (activeScenario) {
        const switchDurationMs = await clickSessionByMarker(cdp, activeScenario.marker)
        appendJsonl(runnerMetricsPath, {
          event: "session_switch",
          packetId: activeScenario.packetId,
          switchDurationMs,
          at: Date.now(),
        })
        if (switchDurationMs > 2_000) {
          throw new FatalWaitError(`Session switch for ${activeScenario.packetId} took ${switchDurationMs}ms`)
        }
        lastSwitchAt = Date.now()
      }
    }

    const sessions = await invokeIpc<SessionSnapshot>(cdp, "getAgentSessions", undefined, 5_000)
    const allSessions = [...sessions.activeSessions, ...sessions.recentCompletedSessions]
    for (const scenario of scenarios) {
      const session = allSessions.find((candidate) => candidate.conversationTitle?.includes(scenario.marker))
      if (session && session.status !== "active") {
        completedByPacket.set(scenario.packetId, session)
      }
    }

    appendJsonl(runnerMetricsPath, {
      event: "heartbeat",
      at: Date.now(),
      ...heartbeat,
      completedPackets: Array.from(completedByPacket.keys()),
    })

    return completedByPacket.size === scenarios.length ? completedByPacket : undefined
  }, 2_000)

  return completedByPacket
}

async function verifyScenario(cdp: CdpClient, scenario: Scenario, session: AgentSession): Promise<Record<string, unknown>> {
  const packet = longAgentLoopSandboxPackets[scenario.packetId]
  const toolSummary = getToolSummary(scenario.packetId)
  const durationMs = (session.endTime ?? Date.now()) - session.startTime
  const conversation = session.conversationId
    ? await invokeIpc<{ messages?: Array<{ role?: string; content?: string }> }>(
      cdp,
      "loadConversation",
      { conversationId: session.conversationId, messageLimit: 200 },
      10_000,
    )
    : { messages: [] }
  const conversationText = (conversation.messages ?? []).map((message) => message.content ?? "").join("\n")
  const finalAssistant = [...(conversation.messages ?? [])].reverse().find((message) => message.role === "assistant")?.content ?? ""
  const bodyTextAfterSwitch = await (async () => {
    await clickSessionByMarker(cdp, scenario.marker)
    await sleep(500)
    return cdp.evaluate<string>("document.body?.innerText || ''", 2_000)
  })()
  const hasToolHistory = (conversation.messages ?? []).some((message) => message.role === "tool") ||
    bodyTextAfterSwitch.includes("write_final_audit") ||
    bodyTextAfterSwitch.includes("read_run_log")

  const checks = {
    packetId: scenario.packetId,
    sessionId: session.id,
    conversationId: session.conversationId,
    status: session.status,
    durationMs,
    toolCallsTotal: toolSummary.total,
    distinctTools: toolSummary.distinct,
    finalIncludesReceipt: finalAssistant.includes(packet.receipt) || conversationText.includes(packet.receipt),
    finalIncludesWinner: finalAssistant.includes(packet.winningCandidateId) || conversationText.includes(packet.winningCandidateId),
    finalIncludesHiddenToken: finalAssistant.includes(packet.hiddenToken) || conversationText.includes(packet.hiddenToken),
    historyIncludesPrompt: conversationText.includes(scenario.marker),
    hasToolHistory,
    renderedAfterSwitch: bodyTextAfterSwitch.includes(scenario.marker) &&
      bodyTextAfterSwitch.includes(packet.winningCandidateId),
  }

  const failures = [
    checks.status !== "completed" ? `session ended with status ${checks.status}` : undefined,
    checks.durationMs <= 60_000 ? `session duration was ${checks.durationMs}ms` : undefined,
    checks.toolCallsTotal < 5 ? `only ${checks.toolCallsTotal} tool calls were recorded` : undefined,
    checks.distinctTools.length < 5 ? `only ${checks.distinctTools.length} distinct tools were recorded` : undefined,
    !checks.finalIncludesReceipt ? `missing receipt ${packet.receipt}` : undefined,
    !checks.finalIncludesWinner ? `missing winner ${packet.winningCandidateId}` : undefined,
    !checks.finalIncludesHiddenToken ? `missing hidden token ${packet.hiddenToken}` : undefined,
    !checks.historyIncludesPrompt ? "conversation history does not include the user prompt" : undefined,
    !checks.hasToolHistory ? "conversation/renderer history does not include tool activity" : undefined,
    !checks.renderedAfterSwitch ? "renderer did not show the expected session history after switching" : undefined,
  ].filter(Boolean)

  if (failures.length > 0) {
    throw new Error(`${scenario.packetId} failed verification: ${failures.join("; ")}`)
  }

  return checks
}

async function main(): Promise<void> {
  const suiteStartedAt = performance.now()
  await timedStage("preflight", () => {
    assertOptIn()
    return assertCodexAuth()
  })
  const codexHome = assertCodexAuth()
  fs.mkdirSync(runDir, { recursive: true })

  const scenarios = createScenarios()
  const appDataDir = path.join(runDir, "app-data")
  const userDataDir = path.join(runDir, "user-data")
  const homeDir = path.join(runDir, "home")
  await timedStage("prepare-isolated-config", () => {
    fs.mkdirSync(path.join(homeDir, ".agents"), { recursive: true })
    prepareConfig(appDataDir, userDataDir, codexHome, scenarios)
  })

  const remoteDebuggingPort = await timedStage("allocate-cdp-port", () => getFreePort())
  const env = {
    ...process.env,
    APP_ID: "app.dotagents.long-agent-loop-e2e",
    CODEX_HOME: codexHome,
    DOTAGENTS_APP_DATA_DIR: appDataDir,
    DOTAGENTS_USER_DATA_DIR: userDataDir,
    HOME: homeDir,
    REMOTE_DEBUGGING_PORT: String(remoteDebuggingPort),
    ELECTRON_DISABLE_SECURITY_WARNINGS: "1",
  }

  writeJson(path.join(runDir, "run-meta.json"), {
    runId,
    remoteDebuggingPort,
    appDataDir,
    userDataDir,
    homeDir,
    codexHome,
    delayMs: Number.isFinite(Number(process.env.LONG_AGENT_LOOP_SANDBOX_DELAY_MS))
      ? Number(process.env.LONG_AGENT_LOOP_SANDBOX_DELAY_MS)
      : LONG_AGENT_LOOP_SANDBOX_DELAY_MS,
    scenarios: scenarios.map(({ packetId, marker, serverName }) => ({ packetId, marker, serverName })),
  })

  const electron = await timedStage("launch-electron", () => startElectron(env, remoteDebuggingPort, userDataDir))
  let perfRecorder: ChildProcessWithoutNullStreams | undefined
  let cdp: CdpClient | undefined

  try {
    const target = await timedStage("wait-for-renderer-cdp-target", () => waitForRendererTarget(remoteDebuggingPort, electron))
    cdp = new CdpClient(target.webSocketDebuggerUrl!)
    await timedStage("connect-renderer-cdp", () => cdp!.connect())
    perfRecorder = await timedStage("start-renderer-perf-recorder", () => startPerfRecorder(remoteDebuggingPort))

    await timedStage("wait-for-main-app-shell", () => waitFor("main app shell", 30_000, async () => {
      const body = await cdp!.evaluate<string>("document.body?.innerText || ''")
      return body.includes("DotAgents") || body.includes("Start text session")
    }, 500))

    for (const scenario of scenarios) {
      await timedStage(`start-session-${scenario.packetId}`, () => startScenario(cdp!, scenario))
    }

    await timedStage("wait-for-all-sessions-active", () => waitFor("all sessions active", 45_000, async () => {
      const sessions = await invokeIpc<SessionSnapshot>(cdp!, "getAgentSessions", undefined, 5_000)
      return scenarios.every((scenario) =>
        sessions.activeSessions.some((session) => session.conversationTitle?.includes(scenario.marker)),
      )
    }, 1_000))

    const completed = await timedStage("wait-for-all-sessions-complete", () => waitForCompletion(cdp!, scenarios))
    const verification = []
    for (const scenario of scenarios) {
      const session = completed.get(scenario.packetId)
      if (!session) throw new Error(`Missing completed session for ${scenario.packetId}`)
      verification.push(await timedStage(`verify-session-${scenario.packetId}`, () => verifyScenario(cdp!, scenario, session)))
    }

    writeJson(summaryPath, {
      status: "pass",
      runId,
      artifactsDir: runDir,
      totalDurationMs: Math.round(performance.now() - suiteStartedAt),
      verification,
    })
    console.log(`Long agent-loop Electron E2E passed. Artifacts: ${runDir}`)
  } finally {
    await timedStage("cleanup", async () => {
      cdp?.close()
      if (perfRecorder) await terminateProcessGroup(perfRecorder, "renderer-perf-recorder")
      await terminateProcessGroup(electron, "electron-vite")
    })
  }
}

main().then(() => {
  process.exit(0)
}).catch((error) => {
  writeJson(summaryPath, {
    status: "fail",
    runId,
    artifactsDir: runDir,
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  })
  console.error("[long-agent-loop-e2e] Failed:", error)
  console.error(`[long-agent-loop-e2e] Artifacts: ${runDir}`)
  process.exit(1)
})
