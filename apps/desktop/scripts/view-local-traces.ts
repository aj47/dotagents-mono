/**
 * view-local-traces.ts
 *
 * Server-less viewer for the local JSONL trace files written by
 * `local-trace-logger.ts`. Renders a Langfuse-style trace tree to the terminal,
 * or generates a self-contained HTML report — no Docker, no Langfuse server.
 *
 * Usage:
 *   npx tsx scripts/view-local-traces.ts                      # auto-discover traces dir, print tree
 *   npx tsx scripts/view-local-traces.ts <file.jsonl|dir>     # explicit file or directory
 *   npx tsx scripts/view-local-traces.ts --html report.html   # write an offline HTML report
 *   npx tsx scripts/view-local-traces.ts --json               # emit reconstructed traces as JSON
 *   npx tsx scripts/view-local-traces.ts --limit 5            # only the N most recent traces
 *   npx tsx scripts/view-local-traces.ts --no-color
 *
 * The traces directory is resolved the same way the logger resolves it:
 *   1. config.json `localTraceLogPath` (if set), else
 *   2. <appData>/<APP_ID|app.dotagents>/traces
 */

import fs from "fs"
import os from "os"
import path from "path"
import {
  parseTraceEvents,
  reconstructTrace,
  renderTraceTree,
  renderTracesHtml,
  makePalette,
  type ReconstructedTrace,
} from "../src/main/local-trace-viewer"

interface CliOptions {
  target?: string
  html?: string
  json: boolean
  color: boolean
  limit?: number
  help: boolean
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = { json: false, color: true, help: false }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    switch (arg) {
      case "-h":
      case "--help":
        options.help = true
        break
      case "--json":
        options.json = true
        break
      case "--no-color":
        options.color = false
        break
      case "--html":
        options.html = argv[++i] ?? "local-traces.html"
        break
      case "--limit":
        options.limit = Number.parseInt(argv[++i] ?? "", 10) || undefined
        break
      default:
        if (!arg.startsWith("-") && !options.target) options.target = arg
    }
  }
  return options
}

function appDataRoot(): string {
  const home = os.homedir()
  if (process.platform === "darwin") return path.join(home, "Library", "Application Support")
  if (process.platform === "win32")
    return process.env.APPDATA ?? path.join(home, "AppData", "Roaming")
  return process.env.XDG_CONFIG_HOME ?? path.join(home, ".config")
}

/** Resolve the default traces directory, honouring config.json's localTraceLogPath. */
function defaultTracesDir(): string {
  const appId = process.env.APP_ID?.trim() || "app.dotagents"
  const dataFolder = path.join(appDataRoot(), appId)
  try {
    const config = JSON.parse(fs.readFileSync(path.join(dataFolder, "config.json"), "utf8"))
    const configured = typeof config.localTraceLogPath === "string" ? config.localTraceLogPath.trim() : ""
    if (configured) {
      return path.extname(configured).toLowerCase() === ".jsonl"
        ? path.dirname(configured)
        : configured
    }
  } catch {
    // no/invalid config — fall through to default
  }
  return path.join(dataFolder, "traces")
}

/** Collect the .jsonl files to read from a file or directory target. */
function collectTraceFiles(target: string): string[] {
  const stats = fs.statSync(target)
  if (stats.isFile()) return [target]
  return fs
    .readdirSync(target)
    .filter((name) => name.toLowerCase().endsWith(".jsonl"))
    .map((name) => path.join(target, name))
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)
}

function loadTraces(files: string[]): ReconstructedTrace[] {
  const traces: ReconstructedTrace[] = []
  for (const file of files) {
    const body = fs.readFileSync(file, "utf8")
    const { events, malformedLines } = parseTraceEvents(body)
    if (events.length === 0 && malformedLines === 0) continue
    const fallbackId = path.basename(file, ".jsonl")
    traces.push(reconstructTrace(events, fallbackId, malformedLines))
  }
  return traces
}

const HELP = `view-local-traces — inspect local agent traces as a Langfuse-style tree

Usage:
  npx tsx scripts/view-local-traces.ts [file.jsonl | dir] [options]

Options:
  --html <path>   Write a self-contained, offline HTML report
  --json          Print reconstructed traces as JSON
  --limit <n>     Only show the N most recently modified traces
  --no-color      Disable ANSI colors
  -h, --help      Show this help

With no target, the traces directory is auto-discovered from your DotAgents
config (config.localTraceLogPath, else <appData>/app.dotagents/traces).
Enable capture in the app via the "local trace logging" setting.`

function main(): void {
  const options = parseArgs(process.argv.slice(2))
  if (options.help) {
    console.log(HELP)
    return
  }

  const target = options.target ?? defaultTracesDir()
  if (!fs.existsSync(target)) {
    console.error(`No traces found at: ${target}`)
    console.error(`Enable "local trace logging" in DotAgents, run an agent, then retry. (--help for options)`)
    process.exitCode = 1
    return
  }

  const files = collectTraceFiles(target)
  let traces = loadTraces(files)
  traces.sort((a, b) => (b.startTime ?? "").localeCompare(a.startTime ?? ""))
  if (options.limit) traces = traces.slice(0, options.limit)

  if (traces.length === 0) {
    console.error(`No trace events found in: ${target}`)
    process.exitCode = 1
    return
  }

  if (options.json) {
    console.log(JSON.stringify(traces, null, 2))
    return
  }

  if (options.html) {
    const htmlPath = path.resolve(options.html)
    fs.writeFileSync(htmlPath, renderTracesHtml(traces), "utf8")
    console.log(`Wrote HTML report for ${traces.length} trace(s) → ${htmlPath}`)
    return
  }

  const palette = makePalette(options.color && process.stdout.isTTY === true && !process.env.NO_COLOR)
  console.log(palette.dim(`${traces.length} trace(s) from ${target}\n`))
  for (const trace of traces) {
    console.log(renderTraceTree(trace, palette))
    console.log("")
  }
}

main()
