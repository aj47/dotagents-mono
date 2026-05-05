#!/usr/bin/env bun
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import {
  BoxRenderable,
  InputRenderable,
  InputRenderableEvents,
  ScrollBoxRenderable,
  TextAttributes,
  TextRenderable,
  createCliRenderer,
} from "@opentui/core"

type Config = { remoteServerPort?: number; remoteServerApiKey?: string }
type StreamHandlers = {
  step?: (title: string, description?: string) => void
  text?: (text: string) => void
  done?: (content: string, conversationId?: string) => void
}
type ServerSettings = {
  url: string
  apiKey: string
  configPath: string
  apiKeySource: string
}

const SECRET_REF_PREFIX = "dotagents-secret://"
const SECRETS_LOCAL_JSON = "secrets.local.json"

const COLORS = {
  bg: "#0b0f14",
  panel: "#101820",
  border: "#263445",
  dim: "#7d8590",
  accent: "#7dd3fc",
  user: "#a7f3d0",
  agent: "#f8fafc",
  error: "#f87171",
}

function configFilePath() {
  const home = os.homedir()
  const linux = path.join(home, ".config", "app.dotagents", "config.json")
  const mac = path.join(
    home,
    "Library",
    "Application Support",
    "app.dotagents",
    "config.json",
  )
  return fs.existsSync(linux) ? linux : fs.existsSync(mac) ? mac : linux
}

function readConfig(): Config {
  try {
    return JSON.parse(fs.readFileSync(configFilePath(), "utf8"))
  } catch {
    return {}
  }
}

function secretReferenceCandidates(secretId: string): string[] {
  const candidates = new Set([secretId])
  let current = secretId
  for (let i = 0; i < 3; i++) {
    try {
      const decoded = decodeURIComponent(current)
      if (decoded === current) break
      candidates.add(decoded)
      current = decoded
    } catch {
      break
    }
  }
  return [...candidates]
}

function resolveSecretReference(value: string): string | undefined {
  if (!value.startsWith(SECRET_REF_PREFIX)) return value
  const secretId = value.slice(SECRET_REF_PREFIX.length)
  if (!secretId) return undefined

  try {
    const parsed = JSON.parse(
      fs.readFileSync(
        path.join(os.homedir(), ".agents", SECRETS_LOCAL_JSON),
        "utf8",
      ),
    ) as { secrets?: Record<string, unknown> }
    for (const candidate of secretReferenceCandidates(secretId)) {
      const secret = parsed.secrets?.[candidate]
      if (typeof secret === "string" && secret.length > 0) return secret
    }
  } catch {
    // Missing local secret storage means we cannot resolve the reference.
  }
  return undefined
}

function serverSettings(): ServerSettings {
  const configPath = configFilePath()
  const cfg = readConfig()
  const url =
    process.env.DOTAGENTS_SERVER_URL ||
    `http://127.0.0.1:${cfg.remoteServerPort || 3210}`
  const resolvedConfigKey = cfg.remoteServerApiKey
    ? resolveSecretReference(cfg.remoteServerApiKey)?.trim()
    : ""
  const apiKey = process.env.DOTAGENTS_API_KEY || resolvedConfigKey || ""
  const apiKeySource = process.env.DOTAGENTS_API_KEY
    ? "DOTAGENTS_API_KEY"
    : cfg.remoteServerApiKey?.startsWith(SECRET_REF_PREFIX)
      ? resolvedConfigKey
        ? `${configPath} → ~/.agents/${SECRETS_LOCAL_JSON}`
        : `${configPath} → unresolved secret reference`
      : cfg.remoteServerApiKey
        ? configPath
        : "missing"
  return { url: url.replace(/\/$/, ""), apiKey, configPath, apiKeySource }
}

function parseArgs() {
  const args = process.argv.slice(2)
  const onceIndex = args.findIndex((arg) => arg === "--once")
  return {
    help: args.includes("--help") || args.includes("-h"),
    once: onceIndex >= 0 ? args.slice(onceIndex + 1).join(" ") : "",
  }
}

async function streamChat(
  message: string,
  conversationId: string | undefined,
  handlers: StreamHandlers,
) {
  const { url, apiKey, apiKeySource } = serverSettings()
  const res = await fetch(`${url}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({
      messages: [{ role: "user", content: message }],
      stream: true,
      conversation_id: conversationId,
    }),
  })
  if (!res.ok || !res.body) {
    const authHint =
      res.status === 401
        ? ` Check API key source: ${apiKeySource}. You can override with DOTAGENTS_API_KEY.`
        : ""
    throw new Error(`Server returned HTTP ${res.status}.${authHint}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  const seenSteps = new Set<string>()
  const handleEvent = (raw: string) => {
    const data = raw
      .split(/\r?\n/)
      .filter((line) => line.startsWith("data: "))
      .map((line) => line.slice(6))
      .join("\n")
    if (!data) return
    const event = JSON.parse(data)
    if (event.type === "progress") {
      const payload = event.data || {}
      for (const step of payload.steps || []) {
        if (!step?.id || seenSteps.has(step.id)) continue
        seenSteps.add(step.id)
        if (step.title !== "Agent response")
          handlers.step?.(step.title || step.type || "step", step.description)
      }
      if (typeof payload.streamingContent?.text === "string")
        handlers.text?.(payload.streamingContent.text)
    } else if (event.type === "done") {
      handlers.done?.(event.data?.content || "", event.data?.conversation_id)
    } else if (event.type === "error") {
      throw new Error(event.data?.message || "stream error")
    }
  }

  while (true) {
    const { done, value } = await reader.read()
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done })
    let idx = buffer.indexOf("\n\n")
    while (idx >= 0) {
      handleEvent(buffer.slice(0, idx).trim())
      buffer = buffer.slice(idx + 2)
      idx = buffer.indexOf("\n\n")
    }
    if (done) break
  }
  if (buffer.trim()) handleEvent(buffer.trim())
}

function usage() {
  console.log(
    `DotAgents OpenTUI client\n\nRun:   pnpm tui\nSmoke: pnpm tui -- --once "hello"\nEnv:   DOTAGENTS_SERVER_URL=http://127.0.0.1:3210 DOTAGENTS_API_KEY=...`,
  )
}

async function runOnce(message: string) {
  let last = ""
  await streamChat(message, undefined, {
    step: (title, desc) => console.log(`• ${title}${desc ? ` — ${desc}` : ""}`),
    text: (text) => {
      const delta = text.slice(last.length)
      last = text
      process.stdout.write(delta)
    },
    done: (content) => {
      if (!last && content) console.log(content)
      else console.log()
    },
  })
}

async function runTui() {
  if (!process.stdout.isTTY)
    throw new Error(
      "OpenTUI needs an interactive terminal. Use --once for non-interactive smoke checks.",
    )
  const { url } = serverSettings()
  const renderer = await createCliRenderer({
    exitOnCtrlC: true,
    targetFps: 30,
    backgroundColor: COLORS.bg,
    consoleMode: "disabled",
  })
  const root = new BoxRenderable(renderer, {
    id: "root",
    width: "100%",
    height: "100%",
    flexDirection: "column",
    padding: 1,
    gap: 1,
    backgroundColor: COLORS.bg,
  })
  const header = new TextRenderable(renderer, {
    content: `DotAgents TUI  ${url}  · enter send · /quit exit · ctrl+l clear`,
    fg: COLORS.accent,
    attributes: TextAttributes.BOLD,
  })
  const log = new ScrollBoxRenderable(renderer, {
    id: "log",
    width: "100%",
    flexGrow: 1,
    border: true,
    borderStyle: "rounded",
    borderColor: COLORS.border,
    padding: 1,
    stickyScroll: true,
    stickyStart: "bottom",
    backgroundColor: COLORS.panel,
  })
  const status = new TextRenderable(renderer, {
    content: "Ready",
    fg: COLORS.dim,
  })
  const input = new InputRenderable(renderer, {
    id: "input",
    width: "100%",
    placeholder: "Message the agent…",
    backgroundColor: COLORS.panel,
    focusedBackgroundColor: "#15202b",
    textColor: COLORS.agent,
    cursorColor: COLORS.accent,
  })
  root.add(header)
  root.add(log)
  root.add(status)
  root.add(input)
  renderer.root.add(root)

  let busy = false,
    conversationId: string | undefined
  const addLine = (content: string, fg = COLORS.agent) => {
    log.add(
      new TextRenderable(renderer, {
        content,
        width: "100%",
        fg,
        marginBottom: 1,
      }),
    )
    log.scrollTo(log.scrollHeight)
    renderer.requestRender()
  }
  addLine("Connected. Type a message to start.", COLORS.dim)

  input.on(InputRenderableEvents.ENTER, async (value: string) => {
    const message = value.trim()
    if (!message || busy) return
    input.value = ""
    if (message === "/quit" || message === "/exit") {
      renderer.destroy()
      process.exit(0)
    }
    if (message === "/clear") {
      for (const child of log.getChildren()) log.remove(child.id)
      return
    }
    busy = true
    addLine(`You: ${message}`, COLORS.user)
    const reply = new TextRenderable(renderer, {
      content: "Agent: ",
      width: "100%",
      fg: COLORS.agent,
      marginBottom: 1,
    })
    log.add(reply)
    let streamed = ""
    try {
      await streamChat(message, conversationId, {
        step: (title, desc) => {
          status.content = `${title}${desc ? ` — ${desc}` : ""}`
          renderer.requestRender()
        },
        text: (text) => {
          streamed = text
          reply.content = `Agent: ${streamed}`
          log.scrollTo(log.scrollHeight)
          renderer.requestRender()
        },
        done: (content, cid) => {
          conversationId = cid || conversationId
          if (!streamed && content) reply.content = `Agent: ${content}`
        },
      })
      status.content = conversationId ? `Ready · ${conversationId}` : "Ready"
    } catch (error) {
      reply.content = `Error: ${error instanceof Error ? error.message : String(error)}`
      reply.setForegroundColor?.(COLORS.error)
      status.content = "Error"
    } finally {
      busy = false
      renderer.requestRender()
    }
  })
  renderer.keyInput.on("keypress", (key) => {
    if (key.ctrl && key.name === "l")
      for (const child of log.getChildren()) log.remove(child.id)
  })
  input.focus()
  renderer.start()
}

const args = parseArgs()
if (args.help) usage()
else if (args.once) await runOnce(args.once)
else await runTui()
