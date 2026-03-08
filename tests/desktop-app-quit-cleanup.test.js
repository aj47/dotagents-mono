const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const source = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'main', 'index.ts'),
  'utf8'
)

const beforeQuitStart = source.indexOf('app.on("before-quit"')
const beforeQuitEnd = source.indexOf('app.on("window-all-closed"')

assert.ok(beforeQuitStart >= 0, 'expected before-quit handler in index.ts')
assert.ok(beforeQuitEnd > beforeQuitStart, 'expected window-all-closed handler after before-quit')

const beforeQuitSection = source.slice(beforeQuitStart, beforeQuitEnd)

test('desktop before-quit cleanup stops active agent runtime work before service shutdown', () => {
  assert.match(source, /async function stopAgentRuntimeForShutdown\(\): Promise<void> \{/)
  assert.match(source, /toolApprovalManager\.cancelAllApprovals\(\)/)
  assert.match(source, /agentSessionStateManager\.stopAllSessions\(\)/)
  assert.match(source, /llmRequestAbortManager\.abortAll\(\)/)
  assert.match(source, /await agentProcessManager\.killAllProcesses\(\)/)
  assert.match(beforeQuitSection, /\{ label: "agent runtime shutdown", run: \(\) => stopAgentRuntimeForShutdown\(\) \},/)
})

test('desktop before-quit cleanup waits for agent runtime, ACP, MCP, and remote server shutdown together', () => {
  assert.doesNotMatch(beforeQuitSection, /acpService\.shutdown\(\)\.catch\(/)
  assert.match(beforeQuitSection, /const cleanupTasks = \[\s*\{ label: "agent runtime shutdown", run: \(\) => stopAgentRuntimeForShutdown\(\) \},\s*\{ label: "ACP service shutdown", run: \(\) => acpService\.shutdown\(\) \},\s*\{ label: "MCP service cleanup", run: \(\) => mcpService\.cleanup\(\) \},\s*\{ label: "remote server shutdown", run: \(\) => stopRemoteServer\(\) \},\s*\] as const/)
  assert.match(beforeQuitSection, /const cleanupPromise = Promise\.all\(\s*cleanupTasks\.map\(async \(\{ label, run \}\) => \{/)
  assert.match(beforeQuitSection, /await Promise\.race\(\[\s*cleanupPromise,\s*new Promise<void>\(\(_, reject\) => \{/)
  assert.match(beforeQuitSection, /new Error\("App cleanup timeout"\)/)
})

test('desktop before-quit cleanup keeps per-service failures best-effort and still proceeds to quit', () => {
  assert.match(beforeQuitSection, /if \(isCleaningUp\) \{\s*return\s*\}/)
  assert.match(beforeQuitSection, /console\.error\(`\[App\] Error during \$\{label\}:`, error\)/)
  assert.match(beforeQuitSection, /app\.quit\(\)/)
})