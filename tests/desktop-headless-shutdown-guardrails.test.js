const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const source = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'main', 'index.ts'),
  'utf8'
)

const headlessStart = source.indexOf('if (isHeadlessMode) {')
const headlessEnd = source.indexOf('initializeDeepLinkHandling()')

assert.ok(headlessStart >= 0, 'expected headless startup block in index.ts')
assert.ok(headlessEnd > headlessStart, 'expected non-headless startup to follow headless block')

const headlessSection = source.slice(headlessStart, headlessEnd)

test('headless graceful shutdown stops active agent runtime work before service shutdown', () => {
  assert.match(source, /function getShutdownCleanupTasks\(\): readonly ShutdownCleanupTask\[\] \{/)
  assert.match(source, /\{ label: "agent runtime shutdown", run: \(\) => stopAgentRuntimeForShutdown\(\) \}/)
  assert.match(source, /\{ label: "ACP service shutdown", run: \(\) => acpService\.shutdown\(\) \}/)
  assert.match(source, /\{ label: "MCP service cleanup", run: \(\) => mcpService\.cleanup\(\) \}/)
  assert.match(source, /\{ label: "remote server shutdown", run: \(\) => stopRemoteServer\(\) \}/)
  assert.match(source, /\{ label: "Cloudflare tunnel shutdown", run: \(\) => stopCloudflareTunnel\(\) \}/)
})

test('headless graceful shutdown awaits agent runtime, ACP, MCP, and remote server cleanup together under one timeout', () => {
  assert.match(source, /import \{ runShutdownCleanup, type ShutdownCleanupTask \} from "\.\/shutdown-cleanup"/)
  assert.match(headlessSection, /await runShutdownCleanup\(\{\s*tasks: getShutdownCleanupTasks\(\),\s*timeoutMs: CLEANUP_TIMEOUT_MS,\s*timeoutMessage: "Headless cleanup timeout",/)
})

test('headless graceful shutdown keeps per-service failures best-effort and still exits', () => {
  assert.match(headlessSection, /if \(isHeadlessShuttingDown\) return/)
  assert.match(headlessSection, /onTaskError: \(label, error\) => \{\s*console\.error\(`\[Headless\] Error during \$\{label\}:`, error\)/)
  assert.match(headlessSection, /onTimeoutError: \(error\) => \{\s*logApp\("Error during headless cleanup:", error\)/)
  assert.match(headlessSection, /process\.exit\(exitCode\)/)
})