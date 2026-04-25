import fs from "fs"
import path from "path"

type Summary = {
  runId?: string
  options?: { scenario?: string; label?: string; switches?: number; messagesPerSession?: number }
  eventCount?: number
  switchLatencyP50Ms: number
  switchLatencyP95Ms: number
  maxSwitchLatencyMs: number
  avgSwitchLatencyMs?: number
  longTaskCount?: number
  longTaskTotalMs?: number
  domNodes?: number
  jsHeapUsedSizeDeltaMb?: number | null
  cdpMetricDeltas?: Record<string, number>
  artifacts?: { summaryPath?: string; resultsTsvPath?: string }
}

type Options = {
  baselinePath: string
  candidatePath: string
  outputPath?: string
  ledgerPath?: string
  minP95ImprovementPercent: number
  maxP95RegressionPercent: number
  maxHeapRegressionMb: number
  maxDomRegressionPercent: number
  failOnDiscard: boolean
}

type Decision = "keep" | "discard" | "inconclusive"

function parseOptions(argv: string[]): Options {
  const args = argv[0] === "--" ? argv.slice(1) : argv
  const get = (name: string, fallback?: string) => {
    const index = args.indexOf(name)
    return index >= 0 ? args[index + 1] : fallback
  }
  const baselinePath = get("--baseline")
  const candidatePath = get("--candidate")
  if (!baselinePath || !candidatePath) {
    throw new Error("Usage: pnpm perf:session-switch:compare -- --baseline baseline.results.json --candidate candidate.results.json")
  }
  return {
    baselinePath,
    candidatePath,
    outputPath: get("--output"),
    ledgerPath: get("--ledger"),
    minP95ImprovementPercent: Number(get("--min-p95-improvement-percent", "10")),
    maxP95RegressionPercent: Number(get("--max-p95-regression-percent", "5")),
    maxHeapRegressionMb: Number(get("--max-heap-regression-mb", "50")),
    maxDomRegressionPercent: Number(get("--max-dom-regression-percent", "10")),
    failOnDiscard: args.includes("--fail-on-discard"),
  }
}

function readSummary(filePath: string): Summary {
  return JSON.parse(fs.readFileSync(resolveInputPath(filePath), "utf8")) as Summary
}

function resolveInputPath(filePath: string): string {
  if (path.isAbsolute(filePath)) return filePath
  const packageRelative = path.resolve(process.cwd(), filePath)
  if (fs.existsSync(packageRelative)) return packageRelative
  const repoRelative = path.resolve(process.cwd(), "../..", filePath)
  if (fs.existsSync(repoRelative)) return repoRelative
  return packageRelative
}

function pctDelta(baseline: number, candidate: number): number {
  if (!Number.isFinite(baseline) || baseline === 0) return 0
  return ((candidate - baseline) / baseline) * 100
}

function numberDelta(baseline?: number | null, candidate?: number | null): number | null {
  if (baseline === null || candidate === null || baseline === undefined || candidate === undefined) return null
  return candidate - baseline
}

function appendTsv(filePath: string, row: Record<string, string | number>): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  const headers = Object.keys(row)
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, `${headers.join("\t")}\n`)
  fs.appendFileSync(filePath, `${headers.map((header) => row[header]).join("\t")}\n`)
}

function decide(options: Options, deltas: Record<string, number | null>): { decision: Decision; reasons: string[] } {
  const reasons: string[] = []
  const p95Delta = deltas.p95Percent ?? 0
  const heapDelta = deltas.heapDeltaMb
  const domDeltaPercent = deltas.domPercent ?? 0

  if (p95Delta > options.maxP95RegressionPercent) {
    reasons.push(`p95 regressed by ${p95Delta.toFixed(1)}%`)
    return { decision: "discard", reasons }
  }
  if (heapDelta !== null && heapDelta > options.maxHeapRegressionMb) {
    reasons.push(`heap delta regressed by ${heapDelta.toFixed(1)} MB`)
    return { decision: "discard", reasons }
  }
  if (domDeltaPercent > options.maxDomRegressionPercent) {
    reasons.push(`DOM node count regressed by ${domDeltaPercent.toFixed(1)}%`)
    return { decision: "discard", reasons }
  }
  if (p95Delta <= -options.minP95ImprovementPercent) {
    reasons.push(`p95 improved by ${Math.abs(p95Delta).toFixed(1)}%`)
    return { decision: "keep", reasons }
  }
  reasons.push(`p95 delta ${p95Delta.toFixed(1)}% is within threshold`)
  return { decision: "inconclusive", reasons }
}

function main(): void {
  const options = parseOptions(process.argv.slice(2))
  const baseline = readSummary(options.baselinePath)
  const candidate = readSummary(options.candidatePath)
  const deltas = {
    p50Ms: candidate.switchLatencyP50Ms - baseline.switchLatencyP50Ms,
    p50Percent: pctDelta(baseline.switchLatencyP50Ms, candidate.switchLatencyP50Ms),
    p95Ms: candidate.switchLatencyP95Ms - baseline.switchLatencyP95Ms,
    p95Percent: pctDelta(baseline.switchLatencyP95Ms, candidate.switchLatencyP95Ms),
    maxMs: candidate.maxSwitchLatencyMs - baseline.maxSwitchLatencyMs,
    maxPercent: pctDelta(baseline.maxSwitchLatencyMs, candidate.maxSwitchLatencyMs),
    longTaskCount: (candidate.longTaskCount ?? 0) - (baseline.longTaskCount ?? 0),
    longTaskTotalMs: (candidate.longTaskTotalMs ?? 0) - (baseline.longTaskTotalMs ?? 0),
    heapDeltaMb: numberDelta(baseline.jsHeapUsedSizeDeltaMb, candidate.jsHeapUsedSizeDeltaMb),
    domNodes: (candidate.domNodes ?? 0) - (baseline.domNodes ?? 0),
    domPercent: pctDelta(baseline.domNodes ?? 0, candidate.domNodes ?? 0),
  }
  const verdict = decide(options, deltas)
  const comparison = {
    comparedAt: new Date().toISOString(),
    baselinePath: resolveInputPath(options.baselinePath),
    candidatePath: resolveInputPath(options.candidatePath),
    thresholds: {
      minP95ImprovementPercent: options.minP95ImprovementPercent,
      maxP95RegressionPercent: options.maxP95RegressionPercent,
      maxHeapRegressionMb: options.maxHeapRegressionMb,
      maxDomRegressionPercent: options.maxDomRegressionPercent,
    },
    baseline,
    candidate,
    deltas,
    ...verdict,
  }
  const defaultOutput = path.join(path.dirname(comparison.candidatePath), `${candidate.runId ?? "candidate"}.comparison.json`)
  const outputPath = path.resolve(process.cwd(), options.outputPath ?? defaultOutput)
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, JSON.stringify(comparison, null, 2))
  const ledgerPath = path.resolve(process.cwd(), options.ledgerPath ?? path.join(path.dirname(outputPath), "comparisons.tsv"))
  appendTsv(ledgerPath, {
    timestamp: comparison.comparedAt,
    decision: verdict.decision,
    scenario: candidate.options?.scenario ?? "unknown",
    baseline: path.basename(options.baselinePath),
    candidate: path.basename(options.candidatePath),
    p95_delta_percent: deltas.p95Percent.toFixed(2),
    p95_delta_ms: deltas.p95Ms.toFixed(2),
    max_delta_percent: deltas.maxPercent.toFixed(2),
    heap_delta_mb: deltas.heapDeltaMb === null ? "n/a" : deltas.heapDeltaMb.toFixed(2),
    dom_delta_percent: deltas.domPercent.toFixed(2),
    reasons: verdict.reasons.join("; "),
  })
  console.log(`[session-switch-compare] decision=${verdict.decision}`)
  console.log(`[session-switch-compare] p95 delta=${deltas.p95Ms.toFixed(1)}ms (${deltas.p95Percent.toFixed(1)}%)`)
  console.log(`[session-switch-compare] max delta=${deltas.maxMs.toFixed(1)}ms (${deltas.maxPercent.toFixed(1)}%)`)
  console.log(`[session-switch-compare] ${verdict.reasons.join("; ")}`)
  console.log(`[session-switch-compare] Wrote ${outputPath}`)
  if (options.failOnDiscard && verdict.decision === "discard") process.exit(2)
}

try {
  main()
} catch (error) {
  console.error("[session-switch-compare] Failed:", error)
  process.exit(1)
}