import { spawn } from "node:child_process"
import { promises as fs } from "node:fs"
import path from "node:path"
import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js"

const CODEX = process.env.CODEX_BIN || `${process.env.HOME}/.codex/packages/standalone/current/codex`
const CODEX_HOME = process.env.CODEX_HOME || `${process.env.HOME}/.codex`
const SESSIONS_DIR = process.env.CODEX_SESSIONS_DIR || path.join(CODEX_HOME, "sessions")

type Json = Record<string, unknown>
type Session = { threadId: string; path: string; metadata: Json; updatedAt: string; cwd?: string; title?: string; status: string }

function payloadOf(record: Json): Json {
  return record.payload && typeof record.payload === "object" ? record.payload as Json : {}
}

async function sessionFiles(): Promise<string[]> {
  const files: string[] = []
  async function walk(dir: string) {
    let entries: Array<{ name: string; isDirectory(): boolean; isFile(): boolean }>
    try {
      entries = await fs.readdir(dir, { withFileTypes: true, encoding: "utf8" }) as unknown as Array<{ name: string; isDirectory(): boolean; isFile(): boolean }>
    } catch { return }
    await Promise.all(entries.map(entry => {
      const file = path.join(dir, entry.name)
      if (entry.isDirectory()) return walk(file)
      if (entry.isFile() && entry.name.endsWith(".jsonl")) { files.push(file) }
      return undefined
    }))
  }
  await walk(SESSIONS_DIR)
  return files
}

async function readRecords(file: string): Promise<Json[]> {
  const text = await fs.readFile(file, "utf8")
  const records: Json[] = []
  for (const line of text.split("\n")) {
    if (!line.trim()) continue
    try { records.push(JSON.parse(line) as Json) } catch { /* tolerate a partially-written final line */ }
  }
  return records
}

function sessionFrom(file: string, records: Json[]): Session | undefined {
  const meta = records.find(record => record.type === "session_meta")
  if (!meta) return undefined
  const payload = payloadOf(meta)
  const threadId = String(payload.session_id || payload.id || "")
  if (!threadId) return undefined
  const last = records[records.length - 1]
  const lastPayload = payloadOf(last)
  const lastType = String(lastPayload.type || last.type || "")
  const status = lastType === "task_complete" || lastType === "turn_completed" ? "completed" : "recorded"
  return {
    threadId, path: file, metadata: payload,
    updatedAt: String(last.timestamp || meta.timestamp || payload.timestamp || ""),
    cwd: typeof payload.cwd === "string" ? payload.cwd : undefined,
    title: typeof payload.title === "string" ? payload.title : undefined,
    status,
  }
}

async function findSessions(cwd?: string): Promise<Session[]> {
  const result: Session[] = []
  for (const file of await sessionFiles()) {
    try {
      const session = sessionFrom(file, await readRecords(file))
      if (session && (!cwd || session.cwd === cwd)) result.push(session)
    } catch { /* ignore files being rotated or removed */ }
  }
  return result.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
}

async function findSession(threadId: string): Promise<{ session: Session; records: Json[] }> {
  for (const file of await sessionFiles()) {
    if (!file.includes(`${threadId}.jsonl`)) continue
    const records = await readRecords(file)
    const session = sessionFrom(file, records)
    if (session?.threadId === threadId) return { session, records }
  }
  throw new Error(`Codex session not found: ${threadId}`)
}

function runCodex(args: string[], cwd?: string): Promise<Json[]> {
  return new Promise((resolve, reject) => {
    const child = spawn(CODEX, args, { cwd, stdio: ["ignore", "pipe", "pipe"] })
    let stdout = "", stderr = ""
    child.stdout.on("data", chunk => { stdout += chunk.toString() })
    child.stderr.on("data", chunk => { stderr += chunk.toString() })
    const timer = setTimeout(() => { child.kill("SIGTERM"); reject(new Error("Codex CLI timed out after 120 seconds")) }, 120_000)
    child.on("error", error => { clearTimeout(timer); reject(error) })
    child.on("close", code => {
      clearTimeout(timer)
      const events: Json[] = stdout.split("\n").filter(Boolean).flatMap(line => {
        try { return [JSON.parse(line) as Json] } catch { return [] }
      })
      if (code !== 0) reject(new Error(stderr.trim() || `Codex CLI exited with code ${code}`))
      else resolve(events)
    })
  })
}

const server = new Server({ name: "codex-session-bridge", version: "1.0.0" }, { capabilities: { tools: {} } })
server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: [
  { name: "list_codex_sessions", description: "List recent non-archived Codex CLI sessions from the local session store.", inputSchema: { type: "object", properties: { limit: { type: "number" }, cwd: { type: "string" } } } },
  { name: "read_codex_session", description: "Read one Codex CLI session's metadata and optionally its turns.", inputSchema: { type: "object", required: ["threadId"], properties: { threadId: { type: "string" }, includeTurns: { type: "boolean" } } } },
  { name: "send_codex_message", description: "Resume an existing Codex CLI session and send it a new user message.", inputSchema: { type: "object", required: ["threadId", "message"], properties: { threadId: { type: "string" }, message: { type: "string" } } } },
  { name: "spawn_codex_session", description: "Start a new Codex CLI session with a prompt in a specified working directory.", inputSchema: { type: "object", required: ["prompt"], properties: { prompt: { type: "string" }, cwd: { type: "string" } } } },
] }))

server.setRequestHandler(CallToolRequestSchema, async request => {
  try {
    const args = (request.params.arguments || {}) as Record<string, unknown>
    if (request.params.name === "list_codex_sessions") {
      const sessions = await findSessions(typeof args.cwd === "string" ? args.cwd : undefined)
      const limit = typeof args.limit === "number" ? Math.max(0, Math.floor(args.limit)) : 100
      return { content: [{ type: "text", text: JSON.stringify({ sessions: sessions.slice(0, limit).map(({ path: _path, metadata: _metadata, ...publicSession }) => ({ ...publicSession, source: "codex-cli" })) }, null, 2) }] }
    }
    if (request.params.name === "read_codex_session") {
      const threadId = String(args.threadId || "")
      if (!threadId) throw new Error("threadId is required")
      const { session, records } = await findSession(threadId)
      const result: Json = { ...session, source: "codex-cli" }
      delete result.path
      if (args.includeTurns) result.turns = records
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] }
    }
    if (request.params.name === "spawn_codex_session") {
      const prompt = String(args.prompt || "")
      if (!prompt.trim()) throw new Error("prompt must not be empty")
      const cwd = typeof args.cwd === "string" && args.cwd.trim() ? args.cwd : process.cwd()
      const cliArgs = ["-a", "never", "exec", "--json", "--skip-git-repo-check", prompt]
      const events = await runCodex(cliArgs, cwd)
      const completion = [...events].reverse().find(event => {
        const payload = payloadOf(event)
        return payload.type === "task_complete" || event.type === "task_complete"
      })
      return { content: [{ type: "text", text: JSON.stringify({ cwd, events, completed: Boolean(completion) }, null, 2) }] }
    }
    if (request.params.name === "send_codex_message") {
      const threadId = String(args.threadId || "")
      const message = String(args.message || "")
      if (!threadId) throw new Error("threadId is required")
      if (!message.trim()) throw new Error("message must not be empty")
      const { session } = await findSession(threadId)
      const cliArgs = ["-a", "never", "exec", "resume", "--json", "--skip-git-repo-check", threadId, message]
      const events = await runCodex(cliArgs, session.cwd)
      return { content: [{ type: "text", text: JSON.stringify({ threadId, events }, null, 2) }] }
    }
    throw new Error(`Unknown tool: ${request.params.name}`)
  } catch (error) {
    return { isError: true, content: [{ type: "text", text: error instanceof Error ? error.message : String(error) }] }
  }
})
await server.connect(new StdioServerTransport())
