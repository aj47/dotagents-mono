#!/usr/bin/env node
import fs from 'node:fs'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import { spawn, spawnSync } from 'node:child_process'

const args = process.argv.slice(2)
const getArg = (name, fallback) => {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : fallback
}

const repoRoot = path.resolve(new URL('..', import.meta.url).pathname)
const outputPath = path.resolve(repoRoot, getArg('--output', 'tmp/ui-responsiveness-smoke.json'))
const timeoutMs = Number(getArg('--timeout-ms', '45000'))
const maxInputLatencyMs = Number(getArg('--max-input-latency-ms', '200'))
const maxRafDelayMs = Number(getArg('--max-raf-delay-ms', '250'))
const startedAt = Date.now()
let completed = false

process.on('SIGTERM', () => {
  process.exit(completed ? 0 : 143)
})

function findFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      const port = typeof address === 'object' && address ? address.port : 0
      server.close(() => resolve(port))
    })
    server.on('error', reject)
  })
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchJson(url) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${url} returned ${response.status}`)
  return response.json()
}

class CdpSession {
  constructor(wsUrl) {
    this.wsUrl = wsUrl
    this.ws = null
    this.nextId = 1
    this.pending = new Map()
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl)
    await new Promise((resolve, reject) => {
      this.ws.addEventListener('open', resolve, { once: true })
      this.ws.addEventListener('error', () => reject(new Error(`Failed to connect to ${this.wsUrl}`)), { once: true })
    })
    this.ws.addEventListener('message', async (event) => {
      const raw = typeof event.data === 'string' ? event.data : await new Response(event.data).text()
      const payload = JSON.parse(raw)
      if (!payload.id) return
      const callbacks = this.pending.get(payload.id)
      if (!callbacks) return
      this.pending.delete(payload.id)
      if (payload.error) callbacks.reject(new Error(payload.error.message || JSON.stringify(payload.error)))
      else callbacks.resolve(payload.result)
    })
  }

  send(method, params = undefined) {
    const id = this.nextId++
    this.ws.send(JSON.stringify({ id, method, params }))
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      setTimeout(() => {
        if (!this.pending.has(id)) return
        this.pending.delete(id)
        reject(new Error(`CDP ${method} timed out`))
      }, 10000).unref?.()
    })
  }

  close() {
    try { this.ws?.close() } catch {}
  }
}

async function waitForPageTarget(port, deadline) {
  const baseUrl = `http://127.0.0.1:${port}`
  let lastError = null
  while (Date.now() < deadline) {
    try {
      const targets = await fetchJson(`${baseUrl}/json/list`)
      const pages = targets.filter((target) => target.type === 'page' && target.webSocketDebuggerUrl)
      const mainPage = pages.find((target) => {
        try { return new URL(target.url).pathname === '/' } catch { return false }
      }) ?? pages.find((target) => !target.url.includes('/panel')) ?? pages[0]
      if (mainPage) return { baseUrl, target: mainPage }
    } catch (error) {
      lastError = error
    }
    await sleep(500)
  }
  throw new Error(`Timed out waiting for Electron CDP page${lastError ? `: ${lastError.message}` : ''}`)
}

async function waitForRendererReady(session, deadline) {
  while (Date.now() < deadline) {
    const result = await session.send('Runtime.evaluate', {
      expression: `(() => ({
        readyState: document.readyState,
        rootChildren: document.getElementById('root')?.children.length ?? 0,
        bodyTextLength: document.body?.innerText?.length ?? 0,
        title: document.title,
        href: location.href,
      }))()`,
      returnByValue: true,
    })
    const value = result.result?.value ?? {}
    if ((value.readyState === 'interactive' || value.readyState === 'complete') && value.rootChildren > 0 && value.bodyTextLength > 0) {
      return value
    }
    await sleep(500)
  }
  throw new Error('Timed out waiting for renderer root to mount')
}

async function measureResponsiveness(session) {
  const result = await session.send('Runtime.evaluate', {
    awaitPromise: true,
    returnByValue: true,
    expression: `(() => new Promise((resolve) => {
      const longTasks = [];
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) longTasks.push({ duration: entry.duration, startTime: entry.startTime });
        });
        observer.observe({ entryTypes: ['longtask'] });
        setTimeout(() => observer.disconnect(), 750);
      } catch {}

      const rafStart = performance.now();
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const rafDelayMs = performance.now() - rafStart;
          const input = document.createElement('textarea');
          input.setAttribute('aria-label', 'DotAgents UI responsiveness smoke input');
          input.style.cssText = 'position:fixed;left:8px;bottom:8px;width:240px;height:36px;z-index:2147483647;opacity:0.01;';
          document.body.appendChild(input);
          const inputStart = performance.now();
          input.addEventListener('input', () => {
            const inputLatencyMs = performance.now() - inputStart;
            const maxLongTaskMs = longTasks.reduce((max, entry) => Math.max(max, entry.duration || 0), 0);
            resolve({
              ui_input_latency_ms: inputLatencyMs,
              ui_raf_delay_ms: rafDelayMs,
              ui_long_task_count: longTasks.length,
              ui_long_task_max_ms: maxLongTaskMs,
              domNodes: document.getElementsByTagName('*').length,
              title: document.title,
              href: location.href,
              bodyTextLength: document.body?.innerText?.length ?? 0,
            });
            input.remove();
          }, { once: true });
          input.focus();
          input.value = 'responsive';
          input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: 'responsive' }));
        });
      });
      setTimeout(() => resolve({ ui_input_latency_ms: 9999, ui_raf_delay_ms: 9999, ui_long_task_count: longTasks.length, timedOut: true }), 5000);
    }))()`,
  })
  return result.result?.value ?? {}
}

function killProcessTree(_child, port) {
  const pids = spawnSync('bash', ['-lc', `lsof -ti tcp:${port} 2>/dev/null || true`], { encoding: 'utf8' })
    .stdout
    .split(/\s+/)
    .filter(Boolean)
  for (const pid of pids) {
    try { process.kill(Number(pid), 'SIGTERM') } catch {}
  }
  setTimeout(() => {
    for (const pid of pids) {
      try { process.kill(Number(pid), 'SIGKILL') } catch {}
    }
  }, 1000).unref?.()
}

async function main() {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  const port = await findFreePort()
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dotagents-ui-smoke-'))
  const userDataDir = path.join(tempDir, 'userData')
  fs.mkdirSync(userDataDir, { recursive: true })
  const logPath = path.join(tempDir, 'electron.log')
  const logStream = fs.createWriteStream(logPath)
  const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
  const child = spawn(pnpm, [
    '--filter', '@dotagents/desktop',
    'exec', 'electron-vite', 'dev', '--',
    '--disable-gpu',
    `--user-data-dir=${userDataDir}`,
  ], {
    cwd: repoRoot,
    detached: true,
    env: {
      ...process.env,
      DOTAGENTS_UI_SMOKE: '1',
      ELECTRON_DISABLE_SECURITY_WARNINGS: '1',
      REMOTE_DEBUGGING_PORT: String(port),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  child.stdout.pipe(logStream)
  child.stderr.pipe(logStream)

  let browserSession
  let pageSession
  try {
    const deadline = Date.now() + timeoutMs
    const { baseUrl, target } = await waitForPageTarget(port, deadline)
    const version = await fetchJson(`${baseUrl}/json/version`)
    browserSession = new CdpSession(version.webSocketDebuggerUrl)
    await browserSession.connect()
    pageSession = new CdpSession(target.webSocketDebuggerUrl)
    await pageSession.connect()
    await pageSession.send('Runtime.enable')
    const ready = await waitForRendererReady(pageSession, deadline)
    const measured = await measureResponsiveness(pageSession)
    const metrics = {
      skipped: false,
      ui_ready_ms: Date.now() - startedAt,
      ...measured,
      ready,
      cdpPort: port,
      logPath,
    }
    fs.writeFileSync(outputPath, JSON.stringify(metrics, null, 2))
    console.log(`[ui-smoke] ${JSON.stringify(metrics)}`)

    if ((metrics.ui_input_latency_ms ?? 9999) > maxInputLatencyMs) {
      throw new Error(`UI input latency ${metrics.ui_input_latency_ms}ms exceeded ${maxInputLatencyMs}ms`)
    }
    if ((metrics.ui_raf_delay_ms ?? 9999) > maxRafDelayMs) {
      throw new Error(`UI RAF delay ${metrics.ui_raf_delay_ms}ms exceeded ${maxRafDelayMs}ms`)
    }
    if (metrics.timedOut) {
      throw new Error('UI responsiveness measurement timed out')
    }
    completed = true
  } finally {
    try { await browserSession?.send('Browser.close') } catch {}
    pageSession?.close()
    browserSession?.close()
    killProcessTree(child, port)
    logStream.end()
  }
}

main().catch((error) => {
  const payload = {
    skipped: false,
    failed: true,
    error: error instanceof Error ? error.message : String(error),
    ui_ready_ms: Date.now() - startedAt,
    ui_input_latency_ms: 9999,
    ui_long_task_count: 9999,
  }
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2))
  console.error('[ui-smoke] Failed:', error)
  process.exit(1)
})
