# Local trace logging & viewer

DotAgents can record agent runs as **Langfuse-shaped traces** (traces →
generations + tool spans) entirely on your machine — no Langfuse Cloud, no
self-hosted server, no Docker required.

There are two independent pieces:

1. **The logger** (`local-trace-logger.ts`) — opt-in, writes one JSONL file per
   agent run.
2. **The viewer** (`scripts/view-local-traces.ts`) — reads those files and
   renders them as a Langfuse-style trace tree in your terminal, or as a
   self-contained offline HTML report.

## 1. Capture traces locally

Enable **local trace logging** in the app (this sets
`config.localTraceLoggingEnabled = true`). It is independent of Langfuse Cloud:
it works whether or not the `langfuse` package is installed and whether or not
`langfuseEnabled` is set.

Each agent **run** produces one file:

```
<appData>/app.dotagents/traces/<langfuseTraceId>.jsonl
```

- `langfuseTraceId` is a fresh per-run UUID, so two turns in the same
  conversation produce two distinct files that share the same Langfuse
  `sessionId` (the conversation id). This is the data model Langfuse expects.
- Set `config.localTraceLogPath` to write somewhere else. If it points at a
  `.jsonl` file the parent directory is used as the trace directory.

Each line is one event: `trace.start` / `trace.end`, `generation.start` /
`generation.end`, `span.start` / `span.end`.

## 2. View traces

From `apps/desktop`:

```bash
# Auto-discover the traces directory and print a tree
pnpm traces:view

# A specific file or directory
pnpm traces:view ~/path/to/traces
pnpm traces:view ~/path/to/traces/<traceId>.jsonl

# Generate a self-contained, offline HTML report (open in any browser)
pnpm traces:view --html local-traces.html

# Machine-readable reconstructed traces
pnpm traces:view --json

# Only the N most recent traces; disable color
pnpm traces:view --limit 10 --no-color
```

With no target, the directory is auto-discovered the same way the logger
resolves it: `config.localTraceLogPath` if set, otherwise
`<appData>/<APP_ID|app.dotagents>/traces`.

### What the viewer shows

- Trace name, id, Langfuse `sessionId`, duration, and aggregated token usage.
- Each tool span (`TOOL`) and LLM generation (`GEN`) in time order, with model,
  duration, tokens, input/output previews, and level.
- Worst-level rollup (`ERROR` > `WARNING` > `DEFAULT` > `DEBUG`).

### Robust to aborted / crashed runs

Local files can legitimately contain dangling events — an aborted run may leave
a `generation.start` / `span.start` with no matching end, and orphan
generations (no `trace.start`) land in `unlinked.jsonl`. The viewer tolerates
all of these: unclosed spans/generations are surfaced as `⚠ unclosed`
warnings rather than dropped, malformed lines are counted and skipped, and a
file with no `trace.start` is rendered as a synthetic trace. So a trace reads
cleanly regardless of how the run terminated.
