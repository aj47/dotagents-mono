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

function childProcessEnv(home: string | undefined): NodeJS.ProcessEnv {
  const env: Record<string, string> = {}
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined) env[key] = value
  }
  env.HOME = home ?? ""
  return env as NodeJS.ProcessEnv
}

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
    if (server) {
      const closingServer = server
      await new Promise<void>((resolve, reject) => {
        closingServer.close((error) => (error ? reject(error) : resolve()))
      })
    }
    server = undefined

    if (tmpHome) {
      await fs.rm(tmpHome, { recursive: true, force: true })
      tmpHome = undefined
    }
  })

  it("posts a chat message and renders streamed SSE output", async () => {
    const { stdout, stderr } = await execFileAsync(
      "bash",
      [scriptPath, "chat", "hello from test"],
      {
        env: childProcessEnv(tmpHome),
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

  it("fails when the daemon streams an error frame", async () => {
    await expect(
      execFileAsync("bash", [scriptPath, "chat", "trigger stream error"], {
        env: childProcessEnv(tmpHome),
        timeout: 10_000,
        maxBuffer: 1024 * 1024,
      }),
    ).rejects.toMatchObject({
      code: 1,
      stdout: expect.stringContaining("Error: mock stream failure"),
    })
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
        let body = ""
        req.setEncoding("utf8")
        req.on("data", (chunk) => {
          body += chunk
        })
        req.on("end", () => {
          res.writeHead(200, { "content-type": "text/event-stream" })
          if (body.includes("trigger stream error")) {
            res.write(
              `data:${JSON.stringify({
                type: "error",
                data: { message: "mock stream failure" },
              })}\n\n`,
            )
            res.end()
            return
          }

          res.write(
            `data:${JSON.stringify({
              type: "progress",
              data: {
                steps: [
                  { id: "step-1", type: "thinking", title: "Mock thinking" },
                ],
                streamingContent: { text: "hello from mock" },
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
