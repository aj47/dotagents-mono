import fs from "fs"
import path from "path"

type CdpTarget = {
  id: string
  type: string
  title: string
  url: string
  webSocketDebuggerUrl?: string
}

type Options = {
  port: number
  outputDir: string
  label: string
  scenario: string
  targetUrlFragment?: string
  sessionCount: number
  messagesPerSession: number
  messageChars: number
  stepsPerSession: number
  toolCallsEvery: number
  switches: number
  warmupSwitches: number
  framesToWait: number
  maxFrameWaitMs: number
  trace: boolean
}

type CdpMetricMap = Record<string, number>

type SwitchEvent = {
  index: number
  warmup: boolean
  sessionId: string
  durationMs: number
  longTaskTotalMs: number
  longTaskCount: number
  domNodes: number
  jsHeapUsedSize?: number
  cdpMetrics: CdpMetricMap
}

type RuntimeEvaluateResult<T> = {
  result?: { value?: T; description?: string }
  exceptionDetails?: { text?: string; exception?: { description?: string } }
}

const HARNESS_KEY = "dotagents.sessionSwitchPerfHarness"
const TRACE_CATEGORIES = [
  "devtools.timeline",
  "v8",
  "blink.user_timing",
  "disabled-by-default-devtools.timeline",
].join(",")

function parseOptions(argv: string[]): Options {
  const args = argv[0] === "--" ? argv.slice(1) : argv
  const get = (name: string, fallback?: string) => {
    const index = args.indexOf(name)
    return index >= 0 ? args[index + 1] : fallback
  }
  const has = (name: string) => args.includes(name)
  const scenario = get("--scenario", "large")!
  const scenarioDefaults = scenario === "single-1000"
    ? { sessionCount: 1, messagesPerSession: 1000, messageChars: 800, stepsPerSession: 120 }
    : scenario === "single-500"
      ? { sessionCount: 1, messagesPerSession: 500, messageChars: 800, stepsPerSession: 80 }
      : scenario === "huge"
    ? { sessionCount: 8, messagesPerSession: 250, messageChars: 1000, stepsPerSession: 120 }
    : scenario === "medium"
      ? { sessionCount: 4, messagesPerSession: 80, messageChars: 500, stepsPerSession: 40 }
      : { sessionCount: 5, messagesPerSession: 150, messageChars: 800, stepsPerSession: 80 }

  return {
    port: Number(get("--port", "9333")),
    outputDir: get("--output-dir", "tmp/perf/session-switch")!,
    label: get("--label", "session-switch")!,
    scenario,
    targetUrlFragment: get("--target-url-fragment"),
    sessionCount: Number(get("--session-count", String(scenarioDefaults.sessionCount))),
    messagesPerSession: Number(get("--messages-per-session", String(scenarioDefaults.messagesPerSession))),
    messageChars: Number(get("--message-chars", String(scenarioDefaults.messageChars))),
    stepsPerSession: Number(get("--steps-per-session", String(scenarioDefaults.stepsPerSession))),
    toolCallsEvery: Number(get("--tool-calls-every", "8")),
    switches: Number(get("--switches", "30")),
    warmupSwitches: Number(get("--warmup-switches", "5")),
    framesToWait: Number(get("--frames-to-wait", "2")),
    maxFrameWaitMs: Number(get("--max-frame-wait-ms", "250")),
    trace: has("--trace"),
  }
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
  return response.json() as Promise<T>
}

function pickTarget(targets: CdpTarget[], fragment?: string): CdpTarget {
  const pages = targets.filter((target) => target.type === "page" && target.webSocketDebuggerUrl)
  const exact = fragment
    ? pages.find((target) => target.url.includes(fragment))
    : pages.find((target) => {
        try {
          return new URL(target.url).pathname === "/"
        } catch {
          return target.url === "/"
        }
      })
  const fallback = pages.find((target) => !target.url.includes("/panel")) ?? pages[0]
  if (!exact && !fallback) throw new Error("No renderer page targets found on the CDP endpoint")
  return exact ?? fallback
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)
  return sorted[index]
}

function metricValue(metrics: CdpMetricMap, name: string): number {
  return Number(metrics[name] ?? 0)
}

function appendResultsTsv(filePath: string, row: Record<string, string | number>): void {
  const headers = Object.keys(row)
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, `${headers.join("\t")}\n`)
  fs.appendFileSync(filePath, `${headers.map((header) => row[header]).join("\t")}\n`)
}

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2))
  const outputDir = path.resolve(process.cwd(), options.outputDir)
  fs.mkdirSync(outputDir, { recursive: true })

  const runId = new Date().toISOString().replace(/[:.]/g, "-")
  const baseName = `${options.label}-${options.scenario}-${runId}`
  const eventsPath = path.join(outputDir, `${baseName}.events.jsonl`)
  const summaryPath = path.join(outputDir, `${baseName}.results.json`)
  const tracePath = path.join(outputDir, `${baseName}.trace.json`)
  const resultsTsvPath = path.join(outputDir, "results.tsv")

  const targets = await fetchJson<CdpTarget[]>(`http://127.0.0.1:${options.port}/json/list`)
  const target = pickTarget(targets, options.targetUrlFragment)
  const websocket = new WebSocket(target.webSocketDebuggerUrl!)
  const pending = new Map<number, { resolve: (value: any) => void; reject: (error: Error) => void }>()
  const traceEvents: unknown[] = []
  let nextId = 1
  let traceComplete: (() => void) | null = null

  await new Promise<void>((resolve, reject) => {
    websocket.addEventListener("open", () => resolve(), { once: true })
    websocket.addEventListener("error", () => reject(new Error("Failed to connect to renderer CDP websocket")), { once: true })
  })

  const send = <T>(method: string, params?: Record<string, unknown>) => {
    const id = nextId++
    websocket.send(JSON.stringify({ id, method, params }))
    return new Promise<T>((resolve, reject) => pending.set(id, { resolve, reject }))
  }

  websocket.addEventListener("message", async (event) => {
    const raw = typeof event.data === "string" ? event.data : await new Response(event.data).text()
    const payload = JSON.parse(raw)
    if (payload.id) {
      const request = pending.get(payload.id)
      if (!request) return
      pending.delete(payload.id)
      if (payload.error) request.reject(new Error(payload.error.message || "Unknown CDP error"))
      else request.resolve(payload.result)
      return
    }
    if (payload.method === "Tracing.dataCollected") traceEvents.push(...(payload.params?.value ?? []))
    if (payload.method === "Tracing.tracingComplete") traceComplete?.()
  })

  const evaluate = async <T>(expression: string): Promise<T> => {
    const response = await send<RuntimeEvaluateResult<T>>("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    })
    if (response.exceptionDetails) {
      throw new Error(response.exceptionDetails.exception?.description || response.exceptionDetails.text || "Runtime.evaluate failed")
    }
    return response.result?.value as T
  }

  const getMetrics = async (): Promise<CdpMetricMap> => {
    const result = await send<{ metrics: Array<{ name: string; value: number }> }>("Performance.getMetrics")
    return Object.fromEntries(result.metrics.map((metric) => [metric.name, metric.value]))
  }

  const waitForHarness = async (): Promise<void> => {
    await evaluate<void>(`localStorage.setItem(${JSON.stringify(HARNESS_KEY)}, "true")`)
    const alreadyReady = await evaluate<boolean>(`typeof window.__DOTAGENTS_SESSION_SWITCH_PERF__ !== "undefined"`)
    if (alreadyReady) return

    await send("Page.reload", { ignoreCache: true })
    await new Promise((resolve) => setTimeout(resolve, 1000))

    for (let attempt = 0; attempt < 40; attempt++) {
      const ready = await evaluate<boolean>(`typeof window.__DOTAGENTS_SESSION_SWITCH_PERF__ !== "undefined"`).catch(() => false)
      if (ready) return
      await new Promise((resolve) => setTimeout(resolve, 250))
    }
    throw new Error("Timed out waiting for session-switch perf harness. Start the app in dev mode with CDP enabled.")
  }

  try {
    await send("Runtime.enable")
    await send("Performance.enable")
    await send("Page.enable")
    await waitForHarness()

    if (options.trace) {
      await send("Tracing.start", { categories: TRACE_CATEGORIES, transferMode: "ReportEvents" })
    }

    const seedSnapshot = await evaluate<{ sessionIds: string[] }>(`
      window.__DOTAGENTS_SESSION_SWITCH_PERF__.seed(${JSON.stringify({
        sessionCount: options.sessionCount,
        messagesPerSession: options.messagesPerSession,
        messageChars: options.messageChars,
        stepsPerSession: options.stepsPerSession,
        toolCallsEvery: options.toolCallsEvery,
        titlePrefix: `Perf ${options.scenario}`,
      })})
    `)
    const sessionIds = seedSnapshot.sessionIds
    if (sessionIds.length === 0) throw new Error("Harness seeded zero sessions")

    const totalSwitches = options.warmupSwitches + options.switches
    const eventsStream = fs.createWriteStream(eventsPath, { flags: "a" })
    const baselineMetrics = await getMetrics()
    const events: SwitchEvent[] = []

    for (let index = 0; index < totalSwitches; index++) {
      const sessionId = sessionIds[index % sessionIds.length]
      const sample = await evaluate<{
        sessionId: string
        durationMs: number
        longTaskTotalMs: number
        longTaskCount: number
        domNodes: number
        jsHeapUsedSize?: number
      }>(`
        window.__DOTAGENTS_SESSION_SWITCH_PERF__.switchTo(${JSON.stringify(sessionId)}, ${JSON.stringify({ framesToWait: options.framesToWait, maxFrameWaitMs: options.maxFrameWaitMs })})
      `)
      const eventRecord: SwitchEvent = {
        index,
        warmup: index < options.warmupSwitches,
        sessionId: sample.sessionId,
        durationMs: sample.durationMs,
        longTaskTotalMs: sample.longTaskTotalMs,
        longTaskCount: sample.longTaskCount,
        domNodes: sample.domNodes,
        jsHeapUsedSize: sample.jsHeapUsedSize,
        cdpMetrics: await getMetrics(),
      }
      events.push(eventRecord)
      eventsStream.write(`${JSON.stringify(eventRecord)}\n`)
      console.log(`[session-switch-perf] ${index + 1}/${totalSwitches} ${eventRecord.warmup ? "warmup" : "sample"} ${eventRecord.durationMs.toFixed(1)}ms`)
    }

    await new Promise<void>((resolve) => eventsStream.end(() => resolve()))
    const finalMetrics = await getMetrics()
    const measured = events.filter((event) => !event.warmup)
    const durations = measured.map((event) => event.durationMs)
    const firstHeap = measured.find((event) => event.jsHeapUsedSize !== undefined)?.jsHeapUsedSize
    const lastHeap = [...measured].reverse().find((event) => event.jsHeapUsedSize !== undefined)?.jsHeapUsedSize
    const summary = {
      runId,
      options,
      target: { id: target.id, title: target.title, url: target.url },
      eventCount: measured.length,
      switchLatencyP50Ms: percentile(durations, 50),
      switchLatencyP95Ms: percentile(durations, 95),
      maxSwitchLatencyMs: durations.length ? Math.max(...durations) : 0,
      avgSwitchLatencyMs: durations.reduce((sum, value) => sum + value, 0) / Math.max(1, durations.length),
      longTaskCount: measured.reduce((sum, event) => sum + event.longTaskCount, 0),
      longTaskTotalMs: measured.reduce((sum, event) => sum + event.longTaskTotalMs, 0),
      domNodes: measured[measured.length - 1]?.domNodes ?? 0,
      jsHeapUsedSizeDeltaMb: firstHeap !== undefined && lastHeap !== undefined
        ? (lastHeap - firstHeap) / 1024 / 1024
        : null,
      cdpMetricDeltas: {
        TaskDuration: metricValue(finalMetrics, "TaskDuration") - metricValue(baselineMetrics, "TaskDuration"),
        ScriptDuration: metricValue(finalMetrics, "ScriptDuration") - metricValue(baselineMetrics, "ScriptDuration"),
        LayoutDuration: metricValue(finalMetrics, "LayoutDuration") - metricValue(baselineMetrics, "LayoutDuration"),
        RecalcStyleDuration: metricValue(finalMetrics, "RecalcStyleDuration") - metricValue(baselineMetrics, "RecalcStyleDuration"),
      },
      artifacts: { eventsPath, summaryPath, tracePath: options.trace ? tracePath : null, resultsTsvPath },
    }

    if (options.trace) {
      const complete = new Promise<void>((resolve) => { traceComplete = resolve })
      await send("Tracing.end")
      await complete
      fs.writeFileSync(tracePath, JSON.stringify({ traceEvents }, null, 2))
    }

    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2))
    appendResultsTsv(resultsTsvPath, {
      timestamp: new Date().toISOString(),
      label: options.label,
      scenario: options.scenario,
      session_count: options.sessionCount,
      messages_per_session: options.messagesPerSession,
      switches: options.switches,
      p50_ms: summary.switchLatencyP50Ms.toFixed(2),
      p95_ms: summary.switchLatencyP95Ms.toFixed(2),
      max_ms: summary.maxSwitchLatencyMs.toFixed(2),
      long_tasks: summary.longTaskCount,
      heap_delta_mb: summary.jsHeapUsedSizeDeltaMb === null ? "n/a" : summary.jsHeapUsedSizeDeltaMb.toFixed(2),
      dom_nodes: summary.domNodes,
      status: "baseline",
      notes: "session-switch-cdp-run",
    })

    console.log(`[session-switch-perf] Summary saved to ${summaryPath}`)
    console.log(`[session-switch-perf] p50=${summary.switchLatencyP50Ms.toFixed(1)}ms p95=${summary.switchLatencyP95Ms.toFixed(1)}ms max=${summary.maxSwitchLatencyMs.toFixed(1)}ms`)
  } finally {
    if (websocket.readyState === WebSocket.OPEN) {
      await new Promise<void>((resolve) => {
        websocket.addEventListener("close", () => resolve(), { once: true })
        websocket.close()
        setTimeout(resolve, 250)
      })
    } else {
      websocket.close()
    }
  }
}

main().catch((error) => {
  console.error("[session-switch-perf] Failed:", error)
  process.exit(1)
})