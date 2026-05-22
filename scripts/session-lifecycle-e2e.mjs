#!/usr/bin/env node
import fs from 'node:fs'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import { spawn, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const args = process.argv.slice(2)
const getArg = (name, fallback) => {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : fallback
}
const hasFlag = (name) => args.includes(name)
const parseBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') return fallback
  const normalized = String(value).trim().toLowerCase()
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false
  return fallback
}

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outputPath = path.resolve(repoRoot, getArg('--output', 'tmp/session-lifecycle-e2e.json'))
const scenario = getArg('--scenario', process.env.SESSION_E2E_SCENARIO || 'original-e2e')
const ORIGINAL_E2E_USE_CASE_COUNT = 10
const defaultSessionCount = scenario === 'original-e2e' ? ORIGINAL_E2E_USE_CASE_COUNT : 12
const explicitSessionCount = getArg('--sessions', '')
const sessionCount = Math.max(1, Number(explicitSessionCount || defaultSessionCount) || defaultSessionCount)
const messageRepeat = Math.max(1, Number(getArg('--message-repeat', '8')) || 8)
const timeoutMs = Math.max(10000, Number(getArg('--timeout-ms', '90000')) || 90000)
const sessionsCompleted = parseBoolean(getArg('--completed', process.env.SESSION_E2E_COMPLETED), false)
const defaultCloseCount = sessionsCompleted ? sessionCount : Math.max(1, Math.floor(sessionCount / 2))
const closeCount = Math.max(0, Math.min(sessionCount, Number(getArg('--close-count', String(defaultCloseCount))) || defaultCloseCount))
const switchCount = Math.max(0, Number(getArg('--switch-count', String(sessionCount * 2))) || sessionCount * 2)
const maxCloseP95Ms = Number(getArg('--max-close-p95-ms', '350'))
const maxInputLatencyMs = Number(getArg('--max-input-latency-ms', '200'))
const maxRafDelayMs = Number(getArg('--max-raf-delay-ms', '300'))
const keepAppData = hasFlag('--keep-app-data')
const startedAt = Date.now()
let runCompleted = false

process.on('SIGTERM', () => {
  process.exit(runCompleted ? 0 : 143)
})

function percentile(values, p) {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1))
  return sorted[index]
}

function summarize(values) {
  if (values.length === 0) {
    return { count: 0, min: 0, max: 0, mean: 0, p50: 0, p95: 0 }
  }
  const total = values.reduce((sum, value) => sum + value, 0)
  return {
    count: values.length,
    min: Math.min(...values),
    max: Math.max(...values),
    mean: total / values.length,
    p50: percentile(values, 50),
    p95: percentile(values, 95),
  }
}

function makeToolResultText(label, body) {
  return JSON.stringify({ success: true, stdout: `${label}:\n${body}`, stderr: '' }, null, 2)
}

function buildLongHistory(caseId, repeat) {
  return Array.from({ length: Math.max(8, repeat * 4) }, (_, index) => ({
    role: index % 2 === 0 ? 'user' : 'assistant',
    content: `${caseId} long-context turn ${index + 1}: ${'context evidence '.repeat(Math.max(8, repeat * 2))}`,
  }))
}

function baseOriginalE2EUseCases(messageRepeat) {
  const payload = 'context detail '.repeat(Math.max(12, messageRepeat * 8))
  const hiddenToken = 'HX-7492-PRISM-RIVER'

  return [
    {
      id: 'case-a-approval-boundary',
      title: 'Approval boundary after context gathering',
      finalContent: 'Current state: I do not know the latest livestream/VOD URL yet. Next safest action is to inspect notes and recent conversations for the URL. I should not download, transcribe, or clip anything before approval.',
      steps: [
        { title: 'Reviewed prior request', description: 'Verified this is a status check with an approval boundary.', status: 'completed' },
      ],
      conversationHistory: [
        { role: 'user', content: 'Find the latest stream and prepare clips, but do not mutate anything until I approve.' },
        { role: 'assistant', content: 'I can inspect local notes/conversations first, then ask before download/transcription/clipping.' },
        { role: 'tool', content: makeToolResultText('LOCAL_NOTES_SCAN', 'No latest VOD URL found in the immediate notes window.') },
        { role: 'user', content: 'where are we?' },
      ],
    },
    {
      id: 'case-b-did-it-download',
      title: 'Did it download?',
      finalContent: 'No — it did not download. No media file was saved; the prior attempt was blocked by a YouTube sign-in / bot challenge.',
      steps: [
        { title: 'Checked download evidence', description: 'Confirmed no output media file exists.', status: 'completed' },
      ],
      conversationHistory: [
        { role: 'user', content: 'Did it download?' },
        { role: 'tool', content: makeToolResultText('YT_DLP_ATTEMPT', 'ERROR: Sign in to confirm you are not a bot. No output file produced.') },
      ],
    },
    {
      id: 'case-c-try-it-first-alias',
      title: 'Try it first / alias debugging',
      finalContent: 'I tested the format path first. 1440p is available, and I did not start a download.',
      steps: [
        { title: 'Ran read-only format probe', description: 'Checked 1440p availability without downloading.', status: 'completed' },
      ],
      conversationHistory: [
        { role: 'user', content: 'try it first and check 1440p before downloading' },
        { role: 'tool', content: makeToolResultText('FORMAT_PROBE', 'available formats include 308 webm 2560x1440. No download started.') },
      ],
    },
    {
      id: 'case-d-skill-registry-diagnosis',
      title: 'Skill registry diagnosis',
      finalContent: 'The skill exists on disk, but the running app session does not expose it in the active skills registry. The issue is registry refresh/loading, not that the file is missing.',
      steps: [
        { title: 'Compared disk and registry state', description: 'Found a skill file / active registry mismatch.', status: 'completed' },
      ],
      conversationHistory: [
        { role: 'user', content: 'i started a new session and it did not find the skill can you see' },
        { role: 'tool', content: makeToolResultText('SKILL_REGISTRY_SCAN', 'stream-topic-inventory/SKILL.md exists on disk; available-skills registry does not list stream-topic-inventory.') },
      ],
    },
    {
      id: 'case-e-full-long-context-continuation',
      title: 'Full long-context continuation',
      finalContent: `Current state: the skill file exists and parses, but the current session registry still does not expose it. Unknown: whether refresh is enough or a full app restart is required. ${payload}`,
      steps: [
        { title: 'Recovered compacted context', description: 'Used prior long conversation evidence instead of replaying a stale task.', status: 'completed' },
      ],
      conversationHistory: [
        ...buildLongHistory('case-e', messageRepeat),
        { role: 'tool', content: makeToolResultText('COMPACTED_CONTEXT_REF', `Registry mismatch evidence. STALE_LONG_CONTEXT_SHOULD_NOT_REPLAY appears only as a stale marker. ${payload}`) },
        { role: 'user', content: 'summarize current state from this new session' },
      ],
    },
    {
      id: 'case-f-harness-agent-not-model-correction',
      title: 'Harness framing correction',
      finalContent: 'The issue is the agent/agentic loop and harness behavior, not simply the model. The fix surface includes prompt engineering, context engineering, and harness engineering.',
      steps: [
        { title: 'Separated model vs harness behavior', description: 'Checked whether the failure was agent-loop framing.', status: 'completed' },
      ],
      conversationHistory: [
        { role: 'user', content: 'is this the model being bad or our harness/agent loop?' },
        { role: 'assistant', content: 'We should treat this as agent-loop behavior until proven otherwise.' },
      ],
    },
    {
      id: 'case-g-prior-conversations-before-unavailable',
      title: 'Prior conversations before unavailable',
      finalContent: 'You are right: I should check prior conversations, knowledge notes, and files before concluding the answer is unavailable.',
      steps: [
        { title: 'Audited lookup order', description: 'Knowledge notes → prior conversations → likely files.', status: 'completed' },
      ],
      conversationHistory: [
        { role: 'user', content: 'you said unavailable without checking previous conversations' },
        { role: 'tool', content: makeToolResultText('LOOKUP_ORDER_AUDIT', 'Need to inspect knowledge notes, prior conversations, and likely files before unavailable claims.') },
      ],
    },
    {
      id: 'case-h-initial-conversation-review-path',
      title: 'Initial conversation review path',
      finalContent: 'The initial review used the wrong conversations store. It should inspect the real app.dotagents app-data path and check 4h, 24h, and 7d windows before reporting zero conversations.',
      steps: [
        { title: 'Resolved real conversation store', description: 'Detected wrong fixture path vs real app-data path.', status: 'completed' },
      ],
      conversationHistory: [
        { role: 'user', content: 'debug why initial conversation review said zero' },
        { role: 'tool', content: makeToolResultText('CONVERSATION_STORE_AUDIT', 'Prior audit used /tmp fixture path. Real path is app.dotagents/conversations with index.json and conv_*.json windows.') },
      ],
    },
    {
      id: 'immigration-advisor-local-context',
      title: 'Immigration advisor local context gathering',
      finalContent: 'For the advisor meeting, ask about O-1 vs EB-1 and employer sponsorship, evidence/document checklist, recommendation letters, travel/work authorization/family implications, timeline, deadlines, fees, and risks.',
      steps: [
        { title: 'Searched knowledge notes', description: 'Found synthetic advisor-prep note.', status: 'completed' },
        { title: 'Searched recent conversations', description: 'Found route-comparison and document-question context.', status: 'completed' },
      ],
      conversationHistory: [
        { role: 'user', content: 'Need prep for a high-context legal/immigration advisor meeting today. What should be asked based on local context?' },
        { role: 'tool', content: makeToolResultText('SYNTHETIC_IMMIGRATION_KNOWLEDGE_CONTEXT', 'Cover O-1 vs EB-1, status-maintenance questions, filing timeline, evidence packet, recommendation letters, travel constraints, work authorization, family implications, costs, and risk questions.') },
        { role: 'tool', content: makeToolResultText('SYNTHETIC_LATEST_DOTAGENTS_CONVERSATIONS', 'Recent conversations mention route comparison, employer sponsorship, document checklist, evidence examples, fees, deadlines, family implications, and risk questions.') },
      ],
    },
    {
      id: 'live-hard-compaction-read-more-context',
      title: 'Hard compaction read_more_context recovery',
      finalContent: `Recovered token: ${hiddenToken}`,
      steps: [
        { title: 'Read compacted context ref', description: 'Recovered the hidden audit token from a buried tool result.', status: 'completed' },
      ],
      conversationHistory: [
        { role: 'user', content: 'Recover the exact HIDDEN_AUDIT_TOKEN value from historical_audit.' },
        { role: 'tool', content: makeToolResultText('historical_audit', `${'A'.repeat(Math.max(120, messageRepeat * 80))}\nHIDDEN_AUDIT_TOKEN=${hiddenToken}\n${'B'.repeat(Math.max(120, messageRepeat * 80))}`) },
        { role: 'assistant', content: `Recovered token: ${hiddenToken}` },
      ],
    },
  ]
}

function buildOriginalE2EUseCases(count, messageRepeat) {
  const base = baseOriginalE2EUseCases(messageRepeat)
  return Array.from({ length: count }, (_, index) => {
    const source = base[index % base.length]
    const cycle = Math.floor(index / base.length)
    return {
      ...source,
      id: cycle > 0 ? `${source.id}-repeat-${cycle + 1}` : source.id,
      title: cycle > 0 ? `${source.title} (${cycle + 1})` : source.title,
    }
  })
}

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
    if (!this.ws) throw new Error('CDP websocket is not connected')
    const id = this.nextId++
    this.ws.send(JSON.stringify({ id, method, params }))
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      setTimeout(() => {
        if (!this.pending.has(id)) return
        this.pending.delete(id)
        reject(new Error(`CDP ${method} timed out`))
      }, 15000).unref?.()
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
        try {
          const url = new URL(target.url)
          return url.pathname === '/' && !url.href.includes('/panel')
        } catch {
          return false
        }
      }) ?? pages.find((target) => !target.url.includes('/panel')) ?? pages[0]
      if (mainPage) return { baseUrl, target: mainPage }
    } catch (error) {
      lastError = error
    }
    await sleep(500)
  }
  throw new Error(`Timed out waiting for Electron CDP page${lastError ? `: ${lastError.message}` : ''}`)
}

async function evaluate(session, expression, awaitPromise = true) {
  const result = await session.send('Runtime.evaluate', {
    expression,
    awaitPromise,
    returnByValue: true,
  })
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text || 'Runtime.evaluate exception')
  }
  return result.result?.value
}

async function waitForExpression(session, expression, deadline, label) {
  let lastValue
  while (Date.now() < deadline) {
    lastValue = await evaluate(session, expression, true)
    if (lastValue) return lastValue
    await sleep(250)
  }
  throw new Error(`Timed out waiting for ${label}; last value=${JSON.stringify(lastValue)}`)
}

async function waitForRendererReady(session, deadline) {
  return waitForExpression(
    session,
    `(() => {
      const harness = window.__dotagentsSessionE2E;
      return {
        ready: !!harness?.ready,
        readyState: document.readyState,
        rootChildren: document.getElementById('root')?.children.length ?? 0,
        bodyTextLength: document.body?.innerText?.length ?? 0,
        href: location.href,
        title: document.title,
      };
    })()`,
    deadline,
    'renderer and session e2e harness',
  ).then(async () => {
    return waitForExpression(
      session,
      `(() => {
        const mounted = (document.readyState === 'interactive' || document.readyState === 'complete') &&
          (document.getElementById('root')?.children.length ?? 0) > 0 &&
          (document.body?.innerText?.length ?? 0) > 0 &&
          !!window.__dotagentsSessionE2E?.ready;
        return mounted ? window.__dotagentsSessionE2E.getState() : null;
      })()`,
      deadline,
      'mounted session UI',
    )
  })
}

async function startResponsivenessProbe(session) {
  await evaluate(session, `(() => {
    const existing = window.__dotagentsSessionE2EProbe;
    if (existing?.stop) existing.stop();
    const longTasks = [];
    const rafDeltas = [];
    let lastRaf = performance.now();
    let running = true;
    let observer = null;
    try {
      observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) longTasks.push({ duration: entry.duration, startTime: entry.startTime });
      });
      observer.observe({ entryTypes: ['longtask'] });
    } catch {}
    const tick = (now) => {
      if (!running) return;
      rafDeltas.push(now - lastRaf);
      lastRaf = now;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    window.__dotagentsSessionE2EProbe = {
      stop() { running = false; try { observer?.disconnect(); } catch {} },
      read() {
        const maxLongTaskMs = longTasks.reduce((max, entry) => Math.max(max, entry.duration || 0), 0);
        return {
          rafDeltas,
          longTasks,
          ui_raf_delay_ms: rafDeltas.length ? Math.max(...rafDeltas) : 0,
          ui_raf_delay_p95_ms: ${percentile.toString()}(rafDeltas, 95),
          ui_long_task_count: longTasks.length,
          ui_long_task_max_ms: maxLongTaskMs,
        };
      },
    };
    return true;
  })()`)
}

async function stopResponsivenessProbe(session) {
  return evaluate(session, `(() => {
    const probe = window.__dotagentsSessionE2EProbe;
    if (!probe) return { ui_raf_delay_ms: 0, ui_raf_delay_p95_ms: 0, ui_long_task_count: 0, ui_long_task_max_ms: 0 };
    const result = probe.read();
    probe.stop();
    return {
      ui_raf_delay_ms: result.ui_raf_delay_ms,
      ui_raf_delay_p95_ms: result.ui_raf_delay_p95_ms,
      ui_long_task_count: result.ui_long_task_count,
      ui_long_task_max_ms: result.ui_long_task_max_ms,
    };
  })()`)
}

async function measureInputLatency(session) {
  return evaluate(session, `(() => new Promise((resolve) => {
    const input = document.createElement('textarea');
    input.setAttribute('aria-label', 'DotAgents session lifecycle e2e input');
    input.style.cssText = 'position:fixed;left:8px;bottom:8px;width:240px;height:36px;z-index:2147483647;opacity:0.01;';
    document.body.appendChild(input);
    const started = performance.now();
    input.addEventListener('input', () => {
      const ui_input_latency_ms = performance.now() - started;
      input.remove();
      resolve({ ui_input_latency_ms });
    }, { once: true });
    input.focus();
    input.value = 'responsive';
    input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: 'responsive' }));
    setTimeout(() => {
      input.remove();
      resolve({ ui_input_latency_ms: 9999, inputTimedOut: true });
    }, 5000);
  }))()`)
}

async function switchOneSessionFromSidebar(session, sessionId) {
  return evaluate(session, `(() => new Promise((resolve) => {
    const targetSessionId = ${JSON.stringify(sessionId)};
    const started = performance.now();
    const row = Array.from(document.querySelectorAll('[data-sidebar-session-id]'))
      .find((element) => element.getAttribute('data-sidebar-session-id') === targetSessionId);
    if (!row) {
      resolve({ switchMs: 9999, focusedSessionId: window.__dotagentsSessionE2E?.getState().focusedSessionId ?? null, error: 'session row not found' });
      return;
    }
    row.scrollIntoView({ block: 'nearest' });
    row.click();
    const deadline = performance.now() + 5000;
    const poll = () => {
      const focusedSessionId = window.__dotagentsSessionE2E?.getState().focusedSessionId ?? null;
      if (focusedSessionId === targetSessionId) {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve({ switchMs: performance.now() - started, focusedSessionId })));
        return;
      }
      if (performance.now() > deadline) {
        resolve({ switchMs: 9999, focusedSessionId, error: 'timed out waiting for switch' });
        return;
      }
      setTimeout(poll, 16);
    };
    poll();
  }))()`)
}

async function closeOneSessionFromSidebar(session, expectedRemaining) {
  return evaluate(session, `(() => new Promise((resolve) => {
    const started = performance.now();
    const button = document.querySelector('[aria-label="Stop this agent session"], [aria-label="Remove from sidebar"]');
    if (!button) {
      resolve({ closeMs: 9999, remaining: window.__dotagentsSessionE2E?.getState().sessionCount ?? -1, error: 'stop/remove button not found' });
      return;
    }
    button.click();
    const deadline = performance.now() + 5000;
    const poll = () => {
      const remaining = window.__dotagentsSessionE2E?.getState().sessionCount ?? -1;
      if (remaining <= ${expectedRemaining}) {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve({ closeMs: performance.now() - started, remaining })));
        return;
      }
      if (performance.now() > deadline) {
        resolve({ closeMs: 9999, remaining, error: 'timed out waiting for close' });
        return;
      }
      setTimeout(poll, 25);
    };
    poll();
  }))()`)
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

function writeConfig(appDataRoot) {
  const configDir = path.join(appDataRoot, process.env.APP_ID || 'app.dotagents')
  fs.mkdirSync(configDir, { recursive: true })
  fs.writeFileSync(path.join(configDir, 'config.json'), JSON.stringify({
    onboardingCompleted: true,
    autoSaveConversations: false,
    floatingPanelAutoShow: false,
    hidePanelWhenMainFocused: false,
    mcpMessageQueueEnabled: true,
    mcpRequireApprovalBeforeToolCall: false,
    remoteServerEnabled: false,
    discordEnabled: false,
    whatsappEnabled: false,
    ttsEnabled: false,
    ttsAutoPlay: false,
    mcpRuntimeDisabledServers: [],
    mcpDisabledTools: [],
  }, null, 2))
}

async function main() {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  const port = await findFreePort()
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dotagents-session-e2e-'))
  const userDataDir = path.join(tempDir, 'userData')
  const appDataRoot = path.join(tempDir, 'appData')
  fs.mkdirSync(userDataDir, { recursive: true })
  fs.mkdirSync(appDataRoot, { recursive: true })
  writeConfig(appDataRoot)

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
      APP_ID: 'app.dotagents',
      DOTAGENTS_APP_DATA_PATH: appDataRoot,
      DOTAGENTS_E2E_BYPASS_ACCESSIBILITY: '1',
      DOTAGENTS_SESSION_E2E_HARNESS: '1',
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

    const readyState = await waitForRendererReady(pageSession, deadline)
    const uiReadyMs = Date.now() - startedAt
    await startResponsivenessProbe(pageSession)

    const sessionCases = scenario === 'original-e2e'
      ? buildOriginalE2EUseCases(sessionCount, messageRepeat)
      : []
    const createOptions = {
      count: sessionCount,
      messageRepeat,
      completed: sessionsCompleted,
      clearExisting: true,
      scenario,
      ...(sessionCases.length > 0 ? { cases: sessionCases } : {}),
    }
    const createResult = await evaluate(pageSession, `window.__dotagentsSessionE2E.createSyntheticSessions(${JSON.stringify(createOptions)})`)
    const postCreateState = await waitForExpression(
      pageSession,
      `(() => window.__dotagentsSessionE2E?.getState().sessionCount === ${sessionCount} ? window.__dotagentsSessionE2E.getState() : null)()`,
      deadline,
      `${sessionCount} synthetic sessions`,
    )

    const switchSessionIds = createResult.sessionIds.length > 0
      ? createResult.sessionIds
      : postCreateState.sessionIds
    const switchResults = []
    const focusTarget = switchSessionIds[switchSessionIds.length - 1]
    const focusResult = focusTarget
      ? await switchOneSessionFromSidebar(pageSession, focusTarget)
      : { switchMs: 0, focusedSessionId: null }
    if (focusResult.error) switchResults.push(focusResult)

    for (let index = 0; index < switchCount && switchSessionIds.length > 0; index += 1) {
      const targetId = switchSessionIds[index % switchSessionIds.length]
      const result = await switchOneSessionFromSidebar(pageSession, targetId)
      switchResults.push(result)
      if (result.error) break
    }

    const inputResult = await measureInputLatency(pageSession)

    const closeResults = []
    for (let index = 0; index < closeCount; index += 1) {
      const expectedRemaining = sessionCount - index - 1
      const result = await closeOneSessionFromSidebar(pageSession, expectedRemaining)
      closeResults.push(result)
      if (result.error) break
    }

    const postCloseState = await evaluate(pageSession, 'window.__dotagentsSessionE2E.getState()')
    const postCloseSwitchCount = Math.min(postCloseState.sessionIds.length, Math.ceil(switchCount / 2))
    for (let index = 0; index < postCloseSwitchCount && postCloseState.sessionIds.length > 0; index += 1) {
      const targetId = postCloseState.sessionIds[index % postCloseState.sessionIds.length]
      const result = await switchOneSessionFromSidebar(pageSession, targetId)
      switchResults.push(result)
      if (result.error) break
    }

    const finalState = await evaluate(pageSession, 'window.__dotagentsSessionE2E.getState()')
    const probe = await stopResponsivenessProbe(pageSession)
    const closeLatencies = closeResults.map((result) => Number(result.closeMs) || 0)
    const closeSummary = summarize(closeLatencies)
    const switchLatencies = switchResults.map((result) => Number(result.switchMs) || 0)
    const switchSummary = summarize(switchLatencies)
    const totalMs = Date.now() - startedAt

    const metrics = {
      status: closeResults.every((result) => !result.error) && switchResults.every((result) => !result.error) && finalState.sessionCount === sessionCount - closeResults.length ? 'pass' : 'fail',
      scenario,
      session_count: sessionCount,
      use_case_count: sessionCases.length,
      use_case_ids: sessionCases.map((useCase) => useCase.id),
      running_session_count: sessionsCompleted ? 0 : sessionCount,
      target_close_count: closeCount,
      target_switch_count: switchCount,
      closed_count: closeResults.length,
      remaining_count: finalState.sessionCount,
      total_ms: totalMs,
      ui_ready_ms: uiReadyMs,
      session_create_ms: createResult.createMs,
      session_first_paint_ms: createResult.firstPaintMs,
      session_focus_ms: focusResult.switchMs,
      switch_latency_ms_total: switchLatencies.reduce((sum, value) => sum + value, 0),
      switch_latency_ms_min: switchSummary.min,
      switch_latency_ms_mean: switchSummary.mean,
      switch_latency_ms_p50: switchSummary.p50,
      switch_latency_ms_p95: switchSummary.p95,
      switch_latency_ms_max: switchSummary.max,
      close_latency_ms_total: closeLatencies.reduce((sum, value) => sum + value, 0),
      close_latency_ms_min: closeSummary.min,
      close_latency_ms_mean: closeSummary.mean,
      close_latency_ms_p50: closeSummary.p50,
      close_latency_ms_p95: closeSummary.p95,
      close_latency_ms_max: closeSummary.max,
      ui_input_latency_ms: inputResult.ui_input_latency_ms,
      ...probe,
      dom_nodes_after_create: postCreateState.domNodes,
      dom_nodes_final: finalState.domNodes,
      visible_remove_buttons_after_create: postCreateState.visibleRemoveButtons,
      readyState,
      switchResults,
      closeResults,
      logPath,
      appDataRoot,
      cdpPort: port,
    }

    fs.writeFileSync(outputPath, JSON.stringify(metrics, null, 2))
    console.log(`[session-e2e] ${JSON.stringify(metrics)}`)

    if (metrics.status !== 'pass') {
      throw new Error(`Session lifecycle e2e failed: ${JSON.stringify(switchResults.find((result) => result.error) || closeResults.find((result) => result.error) || finalState)}`)
    }
    if (metrics.close_latency_ms_p95 > maxCloseP95Ms) {
      throw new Error(`Close p95 ${metrics.close_latency_ms_p95}ms exceeded ${maxCloseP95Ms}ms`)
    }
    if ((metrics.ui_input_latency_ms ?? 9999) > maxInputLatencyMs) {
      throw new Error(`UI input latency ${metrics.ui_input_latency_ms}ms exceeded ${maxInputLatencyMs}ms`)
    }
    if ((metrics.ui_raf_delay_p95_ms ?? 9999) > maxRafDelayMs) {
      throw new Error(`UI RAF p95 delay ${metrics.ui_raf_delay_p95_ms}ms exceeded ${maxRafDelayMs}ms`)
    }

    runCompleted = true
  } finally {
    try { await browserSession?.send('Browser.close') } catch {}
    pageSession?.close()
    browserSession?.close()
    killProcessTree(child, port)
    logStream.end()
    if (!keepAppData && runCompleted) {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
  }
}

main().catch((error) => {
  const payload = {
    status: 'fail',
    failed: true,
    error: error instanceof Error ? error.message : String(error),
    scenario,
    total_ms: Date.now() - startedAt,
    ui_ready_ms: Date.now() - startedAt,
    session_count: sessionCount,
    use_case_count: scenario === 'original-e2e' ? sessionCount : 0,
    running_session_count: sessionsCompleted ? 0 : sessionCount,
    target_close_count: closeCount,
    target_switch_count: switchCount,
    closed_count: 0,
    remaining_count: sessionCount,
    switch_latency_ms_p95: 9999,
    close_latency_ms_p95: 9999,
    ui_input_latency_ms: 9999,
    ui_raf_delay_p95_ms: 9999,
    ui_long_task_count: 9999,
  }
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2))
  console.error('[session-e2e] Failed:', error)
  process.exit(1)
})
