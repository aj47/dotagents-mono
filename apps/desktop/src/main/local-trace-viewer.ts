/**
 * Local Trace Viewer
 *
 * Pure, dependency-free reconstruction and rendering of the JSONL trace files
 * produced by `local-trace-logger.ts`. Turns the flat append-only event stream
 * (`trace.start`, `generation.end`, `span.start`, ...) back into a Langfuse-style
 * trace tree so users can inspect local traces without running Langfuse Cloud or
 * any server.
 *
 * This module is intentionally free of `fs`/Electron imports so it can be unit
 * tested in isolation; file discovery and IO live in
 * `scripts/view-local-traces.ts`.
 *
 * Robustness note: local trace files can legitimately contain dangling events —
 * an agent run that is aborted or crashes may leave a `generation.start` /
 * `span.start` with no matching `*.end`, and an `unlinked.jsonl` file may hold
 * orphan generations with no `trace.start` at all. The reconstruction below
 * tolerates all of these and surfaces them as warnings instead of throwing, so
 * the viewer reads cleanly regardless of how the run terminated.
 */

import type { LocalTraceEvent, LocalTraceEventType } from "./local-trace-logger"

export interface ReconstructedChildBase {
  id: string
  name?: string
  startTime?: string
  endTime?: string
  durationMs?: number
  input?: unknown
  output?: unknown
  metadata?: Record<string, unknown>
  level?: LocalTraceEvent["level"]
  statusMessage?: string
  /** start event seen but no matching end event. */
  unclosed: boolean
  /** end event seen but no matching start event. */
  orphanEnd: boolean
}

export interface ReconstructedGeneration extends ReconstructedChildBase {
  kind: "generation"
  model?: string
  modelParameters?: Record<string, unknown>
  usage?: LocalTraceEvent["usage"]
}

export interface ReconstructedSpan extends ReconstructedChildBase {
  kind: "span"
}

export type ReconstructedChild = ReconstructedGeneration | ReconstructedSpan

export interface ReconstructedTrace {
  traceId: string
  name?: string
  sessionId?: string
  startTime?: string
  endTime?: string
  durationMs?: number
  input?: unknown
  output?: unknown
  metadata?: Record<string, unknown>
  children: ReconstructedChild[]
  /** Worst level across the trace + its children (ERROR > WARNING > DEFAULT > DEBUG). */
  level: NonNullable<LocalTraceEvent["level"]>
  promptTokens: number
  completionTokens: number
  totalTokens: number
  /** trace.start seen but no trace.end (e.g. crash / abort without flush). */
  unclosed: boolean
  /** No trace.start at all (e.g. unlinked orphan generations). */
  synthetic: boolean
  warnings: string[]
  /** Number of raw event lines that failed to parse for this trace. */
  malformedLines: number
}

const LEVEL_RANK: Record<string, number> = {
  DEBUG: 0,
  DEFAULT: 1,
  WARNING: 2,
  ERROR: 3,
}

function worseLevel(
  a: NonNullable<LocalTraceEvent["level"]>,
  b: LocalTraceEvent["level"] | undefined,
): NonNullable<LocalTraceEvent["level"]> {
  if (!b) return a
  return (LEVEL_RANK[b] ?? 1) > (LEVEL_RANK[a] ?? 1) ? b : a
}

/**
 * Parse a JSONL trace file body into events. Malformed lines are counted but
 * never throw, so a single bad write doesn't make a whole file unreadable.
 */
export function parseTraceEvents(body: string): {
  events: LocalTraceEvent[]
  malformedLines: number
} {
  const events: LocalTraceEvent[] = []
  let malformedLines = 0
  for (const rawLine of body.split("\n")) {
    const line = rawLine.trim()
    if (!line) continue
    try {
      const parsed = JSON.parse(line) as LocalTraceEvent
      if (parsed && typeof parsed === "object" && typeof parsed.type === "string") {
        events.push(parsed)
      } else {
        malformedLines += 1
      }
    } catch {
      malformedLines += 1
    }
  }
  return { events, malformedLines }
}

function diffMs(start?: string, end?: string): number | undefined {
  if (!start || !end) return undefined
  const startMs = Date.parse(start)
  const endMs = Date.parse(end)
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) return undefined
  return Math.max(0, endMs - startMs)
}

interface ChildAccumulator {
  kind: "span" | "generation"
  id: string
  start?: LocalTraceEvent
  end?: LocalTraceEvent
  firstSeen: string
}

/**
 * Reconstruct a single trace from its events. Events are assumed to belong to
 * one trace (one JSONL file); a fallback id is used when no `trace.start`
 * carries a traceId.
 */
export function reconstructTrace(
  events: LocalTraceEvent[],
  fallbackTraceId: string,
  malformedLines = 0,
): ReconstructedTrace {
  let traceStart: LocalTraceEvent | undefined
  let traceEnd: LocalTraceEvent | undefined
  const spans = new Map<string, ChildAccumulator>()
  const generations = new Map<string, ChildAccumulator>()

  const upsert = (
    map: Map<string, ChildAccumulator>,
    kind: "span" | "generation",
    id: string,
    role: "start" | "end",
    event: LocalTraceEvent,
  ) => {
    const existing = map.get(id) ?? { kind, id, firstSeen: event.timestamp }
    existing[role] = event
    map.set(id, existing)
  }

  for (const event of events) {
    switch (event.type as LocalTraceEventType) {
      case "trace.start":
        traceStart = event
        break
      case "trace.end":
        traceEnd = event
        break
      case "span.start":
        if (event.spanId) upsert(spans, "span", event.spanId, "start", event)
        break
      case "span.end":
        if (event.spanId) upsert(spans, "span", event.spanId, "end", event)
        break
      case "generation.start":
        if (event.generationId)
          upsert(generations, "generation", event.generationId, "start", event)
        break
      case "generation.end":
        if (event.generationId)
          upsert(generations, "generation", event.generationId, "end", event)
        break
    }
  }

  const warnings: string[] = []
  const children: ReconstructedChild[] = []
  let promptTokens = 0
  let completionTokens = 0
  let totalTokens = 0
  let level: NonNullable<LocalTraceEvent["level"]> = "DEFAULT"

  const buildBase = (acc: ChildAccumulator): ReconstructedChildBase => {
    const start = acc.start
    const end = acc.end
    const unclosed = !!start && !end
    const orphanEnd = !start && !!end
    const startTime = start?.timestamp ?? acc.firstSeen
    const endTime = end?.timestamp
    if (unclosed) warnings.push(`${acc.kind} ${acc.id} has no end event (unclosed)`)
    if (orphanEnd) warnings.push(`${acc.kind} ${acc.id} has an end with no start`)
    const childLevel = end?.level ?? (unclosed ? "WARNING" : undefined)
    level = worseLevel(level, childLevel)
    return {
      id: acc.id,
      name: start?.name ?? end?.name,
      startTime,
      endTime,
      durationMs: diffMs(startTime, endTime),
      input: start?.input,
      output: end?.output,
      metadata: { ...(start?.metadata ?? {}), ...(end?.metadata ?? {}) },
      level: childLevel,
      statusMessage: end?.statusMessage ?? (unclosed ? "unclosed" : undefined),
      unclosed,
      orphanEnd,
    }
  }

  for (const acc of generations.values()) {
    const base = buildBase(acc)
    const usage = acc.end?.usage
    if (usage) {
      promptTokens += usage.promptTokens ?? 0
      completionTokens += usage.completionTokens ?? 0
      totalTokens +=
        usage.totalTokens ?? (usage.promptTokens ?? 0) + (usage.completionTokens ?? 0)
    }
    children.push({
      ...base,
      kind: "generation",
      model: acc.start?.model ?? acc.end?.model,
      modelParameters: acc.start?.modelParameters,
      usage,
    })
  }

  for (const acc of spans.values()) {
    children.push({ ...buildBase(acc), kind: "span" })
  }

  children.sort((a, b) => (a.startTime ?? "").localeCompare(b.startTime ?? ""))

  level = worseLevel(level, traceEnd?.level)

  const synthetic = !traceStart
  const unclosed = !!traceStart && !traceEnd
  if (synthetic)
    warnings.unshift(
      "no trace.start event (orphan/unlinked events shown as a synthetic trace)",
    )
  if (unclosed) warnings.push("trace has no trace.end (run aborted or crashed before flush)")

  const startTime = traceStart?.timestamp ?? children[0]?.startTime
  const endTime =
    traceEnd?.timestamp ??
    children.reduce<string | undefined>(
      (latest, child) =>
        child.endTime && (!latest || child.endTime > latest) ? child.endTime : latest,
      undefined,
    )

  const traceMetadata = traceStart?.metadata ?? {}
  const sessionId =
    (traceMetadata.sessionId as string | undefined) ??
    (traceEnd?.metadata?.sessionId as string | undefined)

  return {
    traceId: traceStart?.traceId ?? traceEnd?.traceId ?? fallbackTraceId,
    name: traceStart?.name ?? "Trace",
    sessionId,
    startTime,
    endTime,
    durationMs: diffMs(startTime, endTime),
    input: traceStart?.input,
    output: traceEnd?.output,
    metadata: { ...traceMetadata, ...(traceEnd?.metadata ?? {}) },
    children,
    level,
    promptTokens,
    completionTokens,
    totalTokens,
    unclosed,
    synthetic,
    warnings,
    malformedLines,
  }
}

/* ------------------------------------------------------------------ */
/* Formatting helpers                                                  */
/* ------------------------------------------------------------------ */

export function formatDuration(ms?: number): string {
  if (ms === undefined) return "—"
  if (ms < 1000) return `${ms}ms`
  if (ms < 60_000) return `${(ms / 1000).toFixed(2)}s`
  const minutes = Math.floor(ms / 60_000)
  const seconds = Math.round((ms % 60_000) / 1000)
  return `${minutes}m${seconds}s`
}

export function formatTokens(trace: Pick<ReconstructedTrace, "promptTokens" | "completionTokens" | "totalTokens">): string {
  if (!trace.totalTokens && !trace.promptTokens && !trace.completionTokens) return "—"
  return `${trace.totalTokens} tok (${trace.promptTokens}→${trace.completionTokens})`
}

export function previewValue(value: unknown, maxChars = 160): string {
  if (value === undefined) return ""
  let text: string
  if (typeof value === "string") {
    text = value
  } else {
    try {
      text = JSON.stringify(value)
    } catch {
      text = String(value)
    }
  }
  text = text.replace(/\s+/g, " ").trim()
  if (text.length <= maxChars) return text
  return `${text.slice(0, maxChars)}… (+${text.length - maxChars} chars)`
}

/* ------------------------------------------------------------------ */
/* Terminal rendering                                                  */
/* ------------------------------------------------------------------ */

type Paint = (text: string) => string
const identity: Paint = (t) => t

export interface TerminalPalette {
  bold: Paint
  dim: Paint
  cyan: Paint
  green: Paint
  yellow: Paint
  red: Paint
  magenta: Paint
}

const ANSI = (code: number): Paint => (text) => `[${code}m${text}[0m`

export function makePalette(enabled: boolean): TerminalPalette {
  if (!enabled) {
    return {
      bold: identity,
      dim: identity,
      cyan: identity,
      green: identity,
      yellow: identity,
      red: identity,
      magenta: identity,
    }
  }
  return {
    bold: ANSI(1),
    dim: ANSI(2),
    cyan: ANSI(36),
    green: ANSI(32),
    yellow: ANSI(33),
    red: ANSI(31),
    magenta: ANSI(35),
  }
}

function levelPaint(palette: TerminalPalette, level?: LocalTraceEvent["level"]): Paint {
  switch (level) {
    case "ERROR":
      return palette.red
    case "WARNING":
      return palette.yellow
    case "DEBUG":
      return palette.dim
    default:
      return palette.green
  }
}

/**
 * Render one reconstructed trace as a colored terminal tree.
 */
export function renderTraceTree(
  trace: ReconstructedTrace,
  palette: TerminalPalette,
  options: { previewChars?: number } = {},
): string {
  const previewChars = options.previewChars ?? 160
  const lines: string[] = []

  const levelBadge = levelPaint(palette, trace.level)(`[${trace.level}]`)
  const header = [
    palette.bold(trace.name ?? "Trace"),
    levelBadge,
    palette.dim(formatDuration(trace.durationMs)),
    palette.dim(formatTokens(trace)),
  ].join("  ")
  lines.push(`● ${header}`)

  const meta: string[] = [palette.dim(`trace ${trace.traceId}`)]
  if (trace.sessionId) meta.push(palette.dim(`session ${trace.sessionId}`))
  if (trace.startTime) meta.push(palette.dim(trace.startTime))
  lines.push(`  ${meta.join(palette.dim(" · "))}`)

  if (trace.input !== undefined) {
    lines.push(`  ${palette.dim("input:")} ${previewValue(trace.input, previewChars)}`)
  }

  trace.children.forEach((child, index) => {
    const isLast = index === trace.children.length - 1
    const branch = isLast ? "└─" : "├─"
    const pipe = isLast ? "  " : "│ "
    const tag =
      child.kind === "generation" ? palette.magenta("GEN") : palette.cyan("TOOL")
    const flags: string[] = []
    if (child.unclosed) flags.push(palette.yellow("⚠ unclosed"))
    if (child.orphanEnd) flags.push(palette.yellow("⚠ orphan-end"))
    if (child.level && child.level !== "DEFAULT") {
      flags.push(levelPaint(palette, child.level)(child.level))
    }

    const genTokens =
      child.kind === "generation" && child.usage
        ? palette.dim(
            `${child.usage.totalTokens ?? (child.usage.promptTokens ?? 0) + (child.usage.completionTokens ?? 0)} tok`,
          )
        : ""
    const model = child.kind === "generation" && child.model ? palette.dim(child.model) : ""

    const headParts = [
      `${branch} ${tag}`,
      palette.bold(child.name ?? child.id),
      model,
      palette.dim(formatDuration(child.durationMs)),
      genTokens,
      ...flags,
    ].filter(Boolean)
    lines.push(`  ${headParts.join("  ")}`)

    if (child.input !== undefined) {
      lines.push(`  ${pipe}  ${palette.dim("in:")}  ${previewValue(child.input, previewChars)}`)
    }
    if (child.output !== undefined) {
      lines.push(`  ${pipe}  ${palette.dim("out:")} ${previewValue(child.output, previewChars)}`)
    }
    if (child.statusMessage) {
      lines.push(
        `  ${pipe}  ${levelPaint(palette, child.level)("status:")} ${previewValue(child.statusMessage, previewChars)}`,
      )
    }
  })

  if (trace.output !== undefined) {
    lines.push(`  ${palette.dim("output:")} ${previewValue(trace.output, previewChars)}`)
  }

  if (trace.warnings.length > 0) {
    for (const warning of trace.warnings) {
      lines.push(`  ${palette.yellow("⚠")} ${palette.dim(warning)}`)
    }
  }
  if (trace.malformedLines > 0) {
    lines.push(`  ${palette.yellow("⚠")} ${palette.dim(`${trace.malformedLines} malformed line(s) skipped`)}`)
  }

  return lines.join("\n")
}

/* ------------------------------------------------------------------ */
/* HTML rendering (self-contained, no external assets)                 */
/* ------------------------------------------------------------------ */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function jsonPreview(value: unknown): string {
  if (value === undefined) return ""
  try {
    return typeof value === "string" ? value : JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function renderChildHtml(child: ReconstructedChild): string {
  const tag = child.kind === "generation" ? "GEN" : "TOOL"
  const tagClass = child.kind === "generation" ? "tag-gen" : "tag-tool"
  const levelClass = `lvl-${(child.level ?? "DEFAULT").toLowerCase()}`
  const flags: string[] = []
  if (child.unclosed) flags.push('<span class="flag">⚠ unclosed</span>')
  if (child.orphanEnd) flags.push('<span class="flag">⚠ orphan-end</span>')

  const model =
    child.kind === "generation" && child.model
      ? `<span class="muted">${escapeHtml(child.model)}</span>`
      : ""
  const tokens =
    child.kind === "generation" && child.usage
      ? `<span class="muted">${child.usage.totalTokens ?? (child.usage.promptTokens ?? 0) + (child.usage.completionTokens ?? 0)} tok</span>`
      : ""

  const sections: string[] = []
  if (child.input !== undefined)
    sections.push(`<div class="io"><span class="io-label">input</span><pre>${escapeHtml(jsonPreview(child.input))}</pre></div>`)
  if (child.output !== undefined)
    sections.push(`<div class="io"><span class="io-label">output</span><pre>${escapeHtml(jsonPreview(child.output))}</pre></div>`)
  if (child.statusMessage)
    sections.push(`<div class="io ${levelClass}"><span class="io-label">status</span><pre>${escapeHtml(jsonPreview(child.statusMessage))}</pre></div>`)

  return `
    <details class="child ${levelClass}">
      <summary>
        <span class="tag ${tagClass}">${tag}</span>
        <span class="child-name">${escapeHtml(child.name ?? child.id)}</span>
        ${model}
        <span class="muted">${formatDuration(child.durationMs)}</span>
        ${tokens}
        ${flags.join(" ")}
      </summary>
      <div class="child-body">${sections.join("") || '<span class="muted">no input/output recorded</span>'}</div>
    </details>`
}

function renderTraceCardHtml(trace: ReconstructedTrace): string {
  const levelClass = `lvl-${trace.level.toLowerCase()}`
  const warnings =
    trace.warnings.length || trace.malformedLines
      ? `<ul class="warnings">${[
          ...trace.warnings.map((w) => `<li>⚠ ${escapeHtml(w)}</li>`),
          ...(trace.malformedLines
            ? [`<li>⚠ ${trace.malformedLines} malformed line(s) skipped</li>`]
            : []),
        ].join("")}</ul>`
      : ""

  const io: string[] = []
  if (trace.input !== undefined)
    io.push(`<div class="io"><span class="io-label">input</span><pre>${escapeHtml(jsonPreview(trace.input))}</pre></div>`)
  if (trace.output !== undefined)
    io.push(`<div class="io"><span class="io-label">output</span><pre>${escapeHtml(jsonPreview(trace.output))}</pre></div>`)

  return `
  <section class="trace ${levelClass}">
    <header class="trace-head">
      <span class="level-dot"></span>
      <h2>${escapeHtml(trace.name ?? "Trace")}</h2>
      <span class="badge">${trace.level}</span>
      <span class="muted">${formatDuration(trace.durationMs)}</span>
      <span class="muted">${escapeHtml(formatTokens(trace))}</span>
    </header>
    <div class="trace-meta">
      <code>${escapeHtml(trace.traceId)}</code>
      ${trace.sessionId ? `<span class="muted">session <code>${escapeHtml(trace.sessionId)}</code></span>` : ""}
      ${trace.startTime ? `<span class="muted">${escapeHtml(trace.startTime)}</span>` : ""}
      <span class="muted">${trace.children.length} step(s)</span>
    </div>
    ${warnings}
    <div class="children">${trace.children.map(renderChildHtml).join("")}</div>
    ${io.join("")}
  </section>`
}

/**
 * Render a full self-contained HTML report for a set of traces. No external
 * scripts/styles/CDNs — the file opens offline in any browser.
 */
export function renderTracesHtml(traces: ReconstructedTrace[], title = "DotAgents Local Traces"): string {
  const errorCount = traces.filter((t) => t.level === "ERROR").length
  const warnCount = traces.filter((t) => t.level === "WARNING").length
  const cards = traces.map(renderTraceCardHtml).join("\n")

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin: 0; font: 14px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace; background: #0d1117; color: #c9d1d9; }
  header.top { position: sticky; top: 0; padding: 16px 24px; background: #161b22; border-bottom: 1px solid #30363d; z-index: 2; }
  header.top h1 { margin: 0 0 4px; font-size: 18px; }
  .summary span { margin-right: 16px; }
  main { padding: 24px; max-width: 1100px; margin: 0 auto; }
  .muted { color: #8b949e; font-size: 12px; }
  code { background: #161b22; padding: 1px 5px; border-radius: 4px; color: #79c0ff; }
  .trace { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 16px; margin-bottom: 20px; }
  .trace-head { display: flex; align-items: center; gap: 10px; }
  .trace-head h2 { margin: 0; font-size: 15px; }
  .level-dot { width: 10px; height: 10px; border-radius: 50%; background: #3fb950; flex: none; }
  .lvl-error .level-dot { background: #f85149; } .lvl-warning .level-dot { background: #d29922; } .lvl-debug .level-dot { background: #8b949e; }
  .badge { font-size: 11px; padding: 1px 8px; border-radius: 10px; border: 1px solid #30363d; }
  .lvl-error .badge { color: #f85149; border-color: #f85149; } .lvl-warning .badge { color: #d29922; border-color: #d29922; }
  .trace-meta { display: flex; flex-wrap: wrap; gap: 12px; margin: 8px 0 12px; align-items: center; }
  .warnings { margin: 0 0 12px; padding: 8px 12px; list-style: none; background: #21262d; border-left: 3px solid #d29922; border-radius: 4px; color: #d29922; font-size: 12px; }
  .warnings li { margin: 2px 0; }
  .children { display: flex; flex-direction: column; gap: 6px; }
  details.child { border: 1px solid #30363d; border-radius: 6px; background: #0d1117; }
  details.child[open] { border-color: #58a6ff; }
  details.child.lvl-error { border-left: 3px solid #f85149; } details.child.lvl-warning { border-left: 3px solid #d29922; }
  summary { cursor: pointer; padding: 8px 12px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  summary::-webkit-details-marker { display: none; }
  .tag { font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 4px; }
  .tag-gen { background: #3a2d5c; color: #d2a8ff; } .tag-tool { background: #173a3a; color: #56d4dd; }
  .child-name { font-weight: 600; }
  .flag { font-size: 11px; color: #d29922; }
  .child-body { padding: 0 12px 12px; }
  .io { margin-top: 8px; }
  .io-label { display: inline-block; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: #8b949e; margin-bottom: 2px; }
  pre { margin: 2px 0 0; padding: 8px 10px; background: #010409; border: 1px solid #21262d; border-radius: 4px; overflow-x: auto; white-space: pre-wrap; word-break: break-word; max-height: 360px; }
  .io.lvl-error pre { border-color: #f85149; } .io.lvl-warning pre { border-color: #d29922; }
</style>
</head>
<body>
  <header class="top">
    <h1>${escapeHtml(title)}</h1>
    <div class="summary muted">
      <span>${traces.length} trace(s)</span>
      <span>${errorCount} error</span>
      <span>${warnCount} warning</span>
    </div>
  </header>
  <main>
    ${cards || '<p class="muted">No traces found.</p>'}
  </main>
</body>
</html>`
}
