import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { execFile, spawnSync } from "child_process"
import http from "http"
import fs from "fs/promises"
import os from "os"
import path from "path"
import { promisify } from "util"
import { fileURLToPath } from "url"

const execFileAsync = promisify(execFile)
const hasBash =
  process.platform !== "win32" &&
  spawnSync("bash", ["--version"], { stdio: "ignore" }).status === 0
const describeCliSmoke = hasBash ? describe : describe.skip
const scriptPath = fileURLToPath(
  new URL("../../../../scripts/dotagents-cli.sh", import.meta.url),
)

describeCliSmoke("dotagents CLI one-shot chat", () => {
  let server: http.Server | undefined
  let tmpHome: string | undefined
  let port = 0

  beforeEach(async () => {
    tmpHome = await fs.mkdtemp(path.join(os.tmpdir(), "dotagents-cli-test-"))
    port = await startMockDaemon()

    const configDir = path.join(tmpHome, ".config", "app.dotagents")
    await fs.mkdir(configDir, { recursive: true })
    await fs.writeFile(
      path.join(configDir, "config.json"),
      JSON.stringify({
        remoteServerPort: port,
        remoteServerApiKey: "test-cli-key",
        openaiApiKey: "test-openai-key",
      }),
    )
  })

  afterEach(async () => {
    await new Promise<void>(
      (resolve) => server?.close(() => resolve()) ?? resolve(),
    )
    server = undefined

    if (tmpHome) {
      await fs.rm(tmpHome, { recursive: true, force: true })
      tmpHome = undefined
    }
  })

  it("posts a chat message and renders streamed SSE output", async () => {
    const env = Object.fromEntries(
      Object.entries(process.env).map(([key, value]) => [key, String(value)]),
    ) as Record<string, string>
    const childEnv = {
      ...env,
      HOME: tmpHome ?? "",
    }

    const { stdout, stderr } = await execFileAsync(
      "bash",
      [scriptPath, "chat", "hello from test"],
      {
        env: childEnv as any,
        timeout: 10_000,
        maxBuffer: 1024 * 1024,
      },
    )

    expect(stderr).toBe("")
    expect(stdout).toContain("DotAgents CLI")
    expect(stdout).toContain("Health:")
    expect(stdout).toContain("Mock thinking")
    expect(stdout).toContain("hello from mock daemon")
  })

  async function startMockDaemon(): Promise<number> {
    server = http.createServer((req, res) => {
      if (req.url === "/v1/operator/health") {
        res.writeHead(200, { "content-type": "application/json" })
        res.end(JSON.stringify({ overall: "healthy" }))
        return
      }

      if (req.url === "/v1/operator/status") {
        res.writeHead(200, { "content-type": "application/json" })
        res.end(
          JSON.stringify({
            health: { overall: "healthy", checks: {} },
            integrations: { discord: { connected: false } },
            mcp: { activeAgentProfile: "mock" },
          }),
        )
        return
      }

      if (req.url === "/v1/chat/completions" && req.method === "POST") {
        req.resume()
        req.on("end", () => {
          res.writeHead(200, { "content-type": "text/event-stream" })
          res.write(
            `data: ${JSON.stringify({
              type: "progress",
              data: {
                steps: [
                  { id: "step-1", type: "thinking", title: "Mock thinking" },
                ],
                streamingContent: { text: "hello from mock daemon" },
              },
            })}\n\n`,
          )
          res.write(
            `data: ${JSON.stringify({
              type: "done",
              data: {
                content: "hello from mock daemon",
                conversation_id: "conv-mock",
              },
            })}\n\n`,
          )
          res.end()
        })
        return
      }

      res.writeHead(404, { "content-type": "application/json" })
      res.end(JSON.stringify({ error: "not found" }))
    })

    await new Promise<void>((resolve) =>
      server!.listen(0, "127.0.0.1", resolve),
    )
    const address = server.address()
    if (!address || typeof address === "string") {
      throw new Error("Mock daemon did not bind to a TCP port")
    }

    return address.port
  }
})
