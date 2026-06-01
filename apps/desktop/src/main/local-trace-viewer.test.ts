import { describe, it, expect } from "vitest"
import {
  parseTraceEvents,
  reconstructTrace,
  renderTraceTree,
  renderTracesHtml,
  makePalette,
  formatDuration,
  previewValue,
} from "./local-trace-viewer"
import type { LocalTraceEvent } from "./local-trace-logger"

const ev = (e: Partial<LocalTraceEvent> & Pick<LocalTraceEvent, "type" | "timestamp">): LocalTraceEvent =>
  e as LocalTraceEvent

const toBody = (events: LocalTraceEvent[]) => events.map((e) => JSON.stringify(e)).join("\n")

describe("parseTraceEvents", () => {
  it("parses valid lines and counts malformed ones", () => {
    const body = [
      JSON.stringify(ev({ type: "trace.start", timestamp: "2026-01-01T00:00:00.000Z" })),
      "",
      "{ not json",
      JSON.stringify({ noType: true }),
      JSON.stringify(ev({ type: "trace.end", timestamp: "2026-01-01T00:00:01.000Z" })),
    ].join("\n")

    const { events, malformedLines } = parseTraceEvents(body)
    expect(events).toHaveLength(2)
    expect(malformedLines).toBe(2)
  })
})

describe("reconstructTrace", () => {
  it("reconstructs a clean trace with a generation and a span, ordered by start time", () => {
    const events: LocalTraceEvent[] = [
      ev({
        type: "trace.start",
        timestamp: "2026-01-01T00:00:00.000Z",
        traceId: "trace-1",
        name: "Agent Session",
        input: "hi",
        metadata: { sessionId: "conv-1", runId: 1 },
      }),
      ev({
        type: "generation.start",
        timestamp: "2026-01-01T00:00:00.100Z",
        traceId: "trace-1",
        generationId: "gen-1",
        name: "LLM Call",
        model: "test-model",
        input: { messages: [] },
      }),
      ev({
        type: "generation.end",
        timestamp: "2026-01-01T00:00:00.600Z",
        generationId: "gen-1",
        output: "answer",
        usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
      }),
      ev({
        type: "span.start",
        timestamp: "2026-01-01T00:00:00.700Z",
        traceId: "trace-1",
        spanId: "span-1",
        name: "Tool: search",
        input: { q: "x" },
      }),
      ev({
        type: "span.end",
        timestamp: "2026-01-01T00:00:00.900Z",
        spanId: "span-1",
        output: { ok: true },
        level: "DEFAULT",
      }),
      ev({
        type: "trace.end",
        timestamp: "2026-01-01T00:00:01.000Z",
        traceId: "trace-1",
        output: "done",
      }),
    ]

    const trace = reconstructTrace(events, "fallback")
    expect(trace.traceId).toBe("trace-1")
    expect(trace.sessionId).toBe("conv-1")
    expect(trace.durationMs).toBe(1000)
    expect(trace.totalTokens).toBe(15)
    expect(trace.promptTokens).toBe(10)
    expect(trace.completionTokens).toBe(5)
    expect(trace.level).toBe("DEFAULT")
    expect(trace.unclosed).toBe(false)
    expect(trace.synthetic).toBe(false)
    expect(trace.warnings).toHaveLength(0)

    expect(trace.children.map((c) => c.id)).toEqual(["gen-1", "span-1"])
    const gen = trace.children[0]
    expect(gen.kind).toBe("generation")
    expect(gen.durationMs).toBe(500)
    expect(gen.output).toBe("answer")
  })

  it("flags an unclosed span (start with no end) as a WARNING with a warning message", () => {
    const events: LocalTraceEvent[] = [
      ev({ type: "trace.start", timestamp: "2026-01-01T00:00:00.000Z", traceId: "t", name: "T" }),
      ev({ type: "span.start", timestamp: "2026-01-01T00:00:00.100Z", traceId: "t", spanId: "s1", name: "Tool" }),
      ev({ type: "trace.end", timestamp: "2026-01-01T00:00:01.000Z", traceId: "t" }),
    ]
    const trace = reconstructTrace(events, "fallback")
    const span = trace.children[0]
    expect(span.unclosed).toBe(true)
    expect(span.level).toBe("WARNING")
    expect(trace.level).toBe("WARNING")
    expect(trace.warnings.some((w) => w.includes("unclosed"))).toBe(true)
  })

  it("propagates ERROR level from a force-closed (aborted) generation", () => {
    const events: LocalTraceEvent[] = [
      ev({ type: "trace.start", timestamp: "2026-01-01T00:00:00.000Z", traceId: "t", name: "T" }),
      ev({ type: "generation.start", timestamp: "2026-01-01T00:00:00.100Z", traceId: "t", generationId: "g1", model: "m" }),
      ev({ type: "generation.end", timestamp: "2026-01-01T00:00:00.200Z", generationId: "g1", level: "ERROR", statusMessage: "Agent run aborted" }),
      ev({ type: "trace.end", timestamp: "2026-01-01T00:00:00.300Z", traceId: "t" }),
    ]
    const trace = reconstructTrace(events, "fallback")
    expect(trace.level).toBe("ERROR")
    expect(trace.children[0].statusMessage).toBe("Agent run aborted")
  })

  it("handles a synthetic trace (orphan generation, no trace.start) like an unlinked.jsonl file", () => {
    const events: LocalTraceEvent[] = [
      ev({ type: "generation.start", timestamp: "2026-01-01T00:00:00.000Z", generationId: "g-orphan", model: "m", input: {} }),
      ev({ type: "generation.end", timestamp: "2026-01-01T00:00:00.300Z", generationId: "g-orphan", output: "x" }),
    ]
    const trace = reconstructTrace(events, "unlinked")
    expect(trace.synthetic).toBe(true)
    expect(trace.traceId).toBe("unlinked")
    expect(trace.children).toHaveLength(1)
    expect(trace.warnings.some((w) => w.includes("no trace.start"))).toBe(true)
  })

  it("marks a trace with no trace.end as unclosed (crash/abort before flush)", () => {
    const events: LocalTraceEvent[] = [
      ev({ type: "trace.start", timestamp: "2026-01-01T00:00:00.000Z", traceId: "t", name: "T" }),
      ev({ type: "generation.start", timestamp: "2026-01-01T00:00:00.100Z", traceId: "t", generationId: "g1", model: "m" }),
    ]
    const trace = reconstructTrace(events, "fallback")
    expect(trace.unclosed).toBe(true)
    expect(trace.children[0].unclosed).toBe(true)
    expect(trace.warnings.some((w) => w.includes("trace.end"))).toBe(true)
  })
})

describe("formatting", () => {
  it("formats durations across scales", () => {
    expect(formatDuration(undefined)).toBe("—")
    expect(formatDuration(340)).toBe("340ms")
    expect(formatDuration(1500)).toBe("1.50s")
    expect(formatDuration(125_000)).toBe("2m5s")
  })

  it("previews and truncates values without throwing on circular refs handled upstream", () => {
    expect(previewValue("hello world")).toBe("hello world")
    expect(previewValue({ a: 1 })).toBe('{"a":1}')
    const long = previewValue("x".repeat(300), 50)
    expect(long).toContain("…")
    expect(long).toContain("+250 chars")
  })
})

describe("rendering", () => {
  const sampleTrace = reconstructTrace(
    [
      ev({ type: "trace.start", timestamp: "2026-01-01T00:00:00.000Z", traceId: "t-render", name: "Agent Session", metadata: { sessionId: "conv-9" }, input: "hi" }),
      ev({ type: "generation.start", timestamp: "2026-01-01T00:00:00.100Z", traceId: "t-render", generationId: "g1", model: "gpt-test", input: "q" }),
      ev({ type: "generation.end", timestamp: "2026-01-01T00:00:00.500Z", generationId: "g1", output: "a", usage: { promptTokens: 3, completionTokens: 2 } }),
      ev({ type: "trace.end", timestamp: "2026-01-01T00:00:00.800Z", traceId: "t-render", output: "done" }),
    ],
    "fallback",
  )

  it("renders a plain (no-color) terminal tree containing key fields", () => {
    const out = renderTraceTree(sampleTrace, makePalette(false))
    expect(out).toContain("Agent Session")
    expect(out).toContain("t-render")
    expect(out).toContain("conv-9")
    expect(out).toContain("GEN")
    expect(out).toContain("gpt-test")
    // no-color palette must not emit ANSI escapes
    expect(out).not.toContain("[")
  })

  it("renders self-contained HTML with no external asset references", () => {
    const html = renderTracesHtml([sampleTrace])
    expect(html.startsWith("<!doctype html>")).toBe(true)
    expect(html).toContain("Agent Session")
    expect(html).toContain("t-render")
    expect(html).not.toMatch(/src=["']https?:/)
    expect(html).not.toMatch(/href=["']https?:/)
    // escapes user content
    expect(html).not.toContain("<script>alert")
  })

  it("escapes HTML-unsafe content in trace output", () => {
    const evil = reconstructTrace(
      [
        ev({ type: "trace.start", timestamp: "2026-01-01T00:00:00.000Z", traceId: "x", name: "<script>alert(1)</script>" }),
        ev({ type: "trace.end", timestamp: "2026-01-01T00:00:00.100Z", traceId: "x", output: "</pre><img src=x>" }),
      ],
      "fallback",
    )
    const html = renderTracesHtml([evil])
    expect(html).toContain("&lt;script&gt;")
    expect(html).not.toContain("<script>alert(1)</script>")
  })
})
