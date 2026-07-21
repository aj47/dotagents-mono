import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process"
import { createInterface } from "node:readline"
import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js"

const CODEX = process.env.CODEX_BIN || `${process.env.HOME}/.codex/packages/standalone/current/codex`
const SOCKET = process.env.CODEX_APP_SERVER_SOCKET || `${process.env.HOME}/.codex/app-server-control/app-server-control.sock`

type Json = Record<string, unknown>
class CodexClient {
  private child: ChildProcessWithoutNullStreams | undefined
  private nextId = 1
  private pending = new Map<number, (value: Json) => void>()
  private buffer = ""
  private initialized = false

  private ensure() {
    if (this.child && !this.child.killed) return
    this.child = spawn(CODEX, ["app-server", "proxy", "--sock", SOCKET], { stdio: ["pipe", "pipe", "pipe"] })
    this.child.stdout.on("data", chunk => {
      this.buffer += chunk.toString()
      let newline
      while ((newline = this.buffer.indexOf("\n")) >= 0) {
        const line = this.buffer.slice(0, newline).trim(); this.buffer = this.buffer.slice(newline + 1)
        if (!line) continue
        try {
          const msg = JSON.parse(line) as Json
          const id = typeof msg.id === "number" ? msg.id : undefined
          if (id !== undefined && this.pending.has(id)) { this.pending.get(id)!(msg); this.pending.delete(id) }
        } catch { /* ignore non-JSON diagnostics */ }
      }
    })
    this.child.on("exit", () => { this.child = undefined; this.initialized = false })
  }
  private async request(method: string, params: Json = {}): Promise<Json> {
    this.ensure()
    const id = this.nextId++
    const result = new Promise<Json>((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`Codex app-server timeout for ${method}`)) }, 10000)
      this.pending.set(id, msg => { clearTimeout(timer); if (msg.error) reject(new Error(JSON.stringify(msg.error))); else resolve((msg.result || {}) as Json) })
    })
    this.child!.stdin.write(JSON.stringify({ jsonrpc:"2.0", id, method, params }) + "\n")
    return result
  }
  async call(method: string, params: Json = {}) {
    if (!this.initialized) {
      await this.request("initialize", { clientInfo:{ name:"dotagents-codex-session-bridge", version:"1.0.0" }, capabilities:{ experimentalApi:true } })
      this.child!.stdin.write(JSON.stringify({ jsonrpc:"2.0", method:"initialized", params:{} }) + "\n")
      this.initialized = true
    }
    return this.request(method, params)
  }
}

const codex = new CodexClient()
const server = new Server({ name:"codex-session-bridge", version:"1.0.0" }, { capabilities:{ tools:{} } })
server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools:[
  { name:"list_codex_sessions", description:"List recent non-archived Codex app sessions, including cwd, title, status, and source.", inputSchema:{ type:"object", properties:{ limit:{type:"number", description:"Maximum sessions (default 100)"}, cwd:{type:"string"} } } },
  { name:"read_codex_session", description:"Read one Codex session's metadata and optionally its turns.", inputSchema:{ type:"object", required:["threadId"], properties:{ threadId:{type:"string"}, includeTurns:{type:"boolean"} } } },
  { name:"send_codex_message", description:"Resume an existing Codex session and send it a new user message. This starts work in that session.", inputSchema:{ type:"object", required:["threadId","message"], properties:{ threadId:{type:"string"}, message:{type:"string"} } } }
]}))
server.setRequestHandler(CallToolRequestSchema, async req => {
  try {
    const args = (req.params.arguments || {}) as Record<string, unknown>
    if (req.params.name === "list_codex_sessions") {
      const params: Json = { limit: typeof args.limit === "number" ? args.limit : 100, archived:false, useStateDbOnly:true }
      if (typeof args.cwd === "string" && args.cwd) params.cwd = args.cwd
      const result = await codex.call("thread/list", params)
      return { content:[{ type:"text", text:JSON.stringify(result, null, 2) }] }
    }
    if (req.params.name === "read_codex_session") {
      const result = await codex.call("thread/read", { threadId:String(args.threadId), includeTurns:Boolean(args.includeTurns) })
      return { content:[{ type:"text", text:JSON.stringify(result, null, 2) }] }
    }
    if (req.params.name === "send_codex_message") {
      const threadId = String(args.threadId || "")
      const message = String(args.message || "")
      if (!threadId) throw new Error("threadId is required")
      if (!message.trim()) throw new Error("message must not be empty")
      await codex.call("thread/resume", { threadId })
      const result = await codex.call("turn/start", {
        threadId,
        input: [{ type:"text", text:message }]
      })
      return { content:[{ type:"text", text:JSON.stringify(result, null, 2) }] }
    }
    throw new Error(`Unknown tool: ${req.params.name}`)
  } catch (error) { return { isError:true, content:[{ type:"text", text:error instanceof Error ? error.message : String(error) }] } }
})
await server.connect(new StdioServerTransport())
