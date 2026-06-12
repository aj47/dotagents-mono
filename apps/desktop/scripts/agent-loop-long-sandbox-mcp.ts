import fs from "fs"
import path from "path"
import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js"
import {
  createLongAgentLoopSandboxToolState,
  executeLongAgentLoopSandboxTool,
  getLongAgentLoopSandboxPacket,
  getLongAgentLoopSandboxToolDefinitions,
  LONG_AGENT_LOOP_SANDBOX_DELAY_MS,
  type LongAgentLoopSandboxPacketId,
} from "../src/main/agent-loop-long-sandbox-fixture"

function parseArg(name: string, fallback?: string): string | undefined {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : fallback
}

function appendJsonl(filePath: string | undefined, payload: Record<string, unknown>): void {
  if (!filePath) return
  const resolved = path.resolve(filePath)
  fs.mkdirSync(path.dirname(resolved), { recursive: true })
  fs.appendFileSync(resolved, `${JSON.stringify(payload)}\n`)
}

const packetId = parseArg("--packet", process.env.LONG_AGENT_LOOP_SANDBOX_PACKET) as LongAgentLoopSandboxPacketId | undefined
if (!packetId) {
  console.error("[long-agent-loop-sandbox] Missing --packet <packetId>")
  process.exit(1)
}

const packet = getLongAgentLoopSandboxPacket(packetId)
const rawDelayMs = parseArg("--delay-ms", process.env.LONG_AGENT_LOOP_SANDBOX_DELAY_MS)
const parsedDelayMs = rawDelayMs === undefined ? Number.NaN : Number(rawDelayMs)
const delayMs = Number.isFinite(parsedDelayMs) ? parsedDelayMs : LONG_AGENT_LOOP_SANDBOX_DELAY_MS
const logPath = parseArg("--log", process.env.LONG_AGENT_LOOP_SANDBOX_LOG)
const state = createLongAgentLoopSandboxToolState()

const server = new Server(
  {
    name: `dotagents-long-agent-loop-sandbox-${packet.id}`,
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
)

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: getLongAgentLoopSandboxToolDefinitions(),
}))

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const startedAt = Date.now()
  const toolName = request.params.name
  const args = request.params.arguments && typeof request.params.arguments === "object"
    ? request.params.arguments as Record<string, unknown>
    : {}

  appendJsonl(logPath, {
    event: "tool_start",
    packetId: packet.id,
    toolName,
    args,
    startedAt,
  })

  const result = await executeLongAgentLoopSandboxTool(packet.id, toolName, args, {
    delayMs,
    state,
  })

  appendJsonl(logPath, {
    event: "tool_end",
    packetId: packet.id,
    toolName,
    isError: Boolean(result.isError),
    startedAt,
    endedAt: Date.now(),
    durationMs: Date.now() - startedAt,
    calledTools: Array.from(state.calledTools),
  })

  return result
})

async function main(): Promise<void> {
  appendJsonl(logPath, {
    event: "server_start",
    packetId: packet.id,
    delayMs,
    startedAt: Date.now(),
    receipt: packet.receipt,
  })
  console.error(`[long-agent-loop-sandbox] ${packet.id} started with ${delayMs}ms tool delay`)
  await server.connect(new StdioServerTransport())
}

main().catch((error) => {
  appendJsonl(logPath, {
    event: "server_error",
    packetId: packet.id,
    error: error instanceof Error ? error.message : String(error),
    at: Date.now(),
  })
  console.error("[long-agent-loop-sandbox] Failed:", error)
  process.exit(1)
})
