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
  assert.match(source, /function getShutdownCleanupTasks\(\): readonly ShutdownCleanupTask\[\] \{/)
  assert.match(source, /\{ label: "agent runtime shutdown", run: \(\) => stopAgentRuntimeForShutdown\(\) \}/)
  assert.match(source, /\{ label: "ACP service shutdown", run: \(\) => acpService\.shutdown\(\) \}/)
  assert.match(source, /\{ label: "MCP service cleanup", run: \(\) => mcpService\.cleanup\(\) \}/)
  assert.match(source, /\{ label: "remote server shutdown", run: \(\) => stopRemoteServer\(\) \}/)
  assert.match(source, /\{ label: "Cloudflare tunnel shutdown", run: \(\) => stopCloudflareTunnel\(\) \}/)
})

test('desktop before-quit cleanup waits for agent runtime, ACP, MCP, and remote server shutdown together', () => {
  assert.match(source, /import \{ runShutdownCleanup, type ShutdownCleanupTask \} from "\.\/shutdown-cleanup"/)
  assert.match(beforeQuitSection, /await runShutdownCleanup\(\{\s*tasks: getShutdownCleanupTasks\(\),\s*timeoutMs: CLEANUP_TIMEOUT_MS,\s*timeoutMessage: "App cleanup timeout",/)
})

test('desktop before-quit cleanup keeps per-service failures best-effort and still proceeds to quit', () => {
  assert.match(beforeQuitSection, /if \(isCleaningUp\) \{\s*return\s*\}/)
  assert.match(beforeQuitSection, /onTaskError: \(label, error\) => \{\s*console\.error\(`\[App\] Error during \$\{label\}:`, error\)/)
  assert.match(beforeQuitSection, /onTimeoutError: \(error\) => \{\s*logApp\("Error during app cleanup on quit:", error\)/)
  assert.match(beforeQuitSection, /app\.quit\(\)/)
})