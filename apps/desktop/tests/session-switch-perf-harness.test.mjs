import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()
const read = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8')

test('desktop exposes a gated session-switch performance harness', () => {
  const appSource = read('apps/desktop/src/renderer/src/App.tsx')
  const harnessSource = read('apps/desktop/src/renderer/src/lib/session-switch-perf-harness.ts')

  assert.match(appSource, /initializeSessionSwitchPerfHarness/)
  assert.match(harnessSource, /dotagents\.sessionSwitchPerfHarness/)
  assert.match(harnessSource, /dotagents\.sessionSwitchPerfPreseed/)
  assert.match(harnessSource, /__DOTAGENTS_SESSION_SWITCH_PERF__/)
  assert.match(harnessSource, /updateSessionProgress\(update\)/)
  assert.match(harnessSource, /setFocusedSessionId\(sessionId\)/)
  assert.match(harnessSource, /messagesPerSession.*1000/s)
})

test('desktop package wires the CDP session-switch benchmark script', () => {
  const packageSource = read('apps/desktop/package.json')
  const scriptSource = read('apps/desktop/scripts/session-switch-perf-loop.ts')
  const compareSource = read('apps/desktop/scripts/session-switch-perf-compare.ts')

  assert.match(packageSource, /"perf:session-switch": "npx tsx scripts\/session-switch-perf-loop\.ts"/)
  assert.match(packageSource, /"perf:session-switch:compare": "npx tsx scripts\/session-switch-perf-compare\.ts"/)
  assert.match(scriptSource, /Performance\.getMetrics/)
  assert.match(scriptSource, /Tracing\.start/)
  assert.match(scriptSource, /single-1000/)
  assert.match(scriptSource, /single-500/)
  assert.match(scriptSource, /results\.tsv/)
  assert.match(compareSource, /min-p95-improvement-percent/)
  assert.match(compareSource, /decision: "keep"/)
  assert.match(compareSource, /decision: "discard"/)
  assert.match(compareSource, /comparisons\.tsv/)
})