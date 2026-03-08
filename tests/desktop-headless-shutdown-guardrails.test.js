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

test('headless graceful shutdown awaits ACP, MCP, and remote server cleanup together under one timeout', () => {
  assert.doesNotMatch(headlessSection, /await acpService\.shutdown\(\)\.catch\(/)
  assert.match(headlessSection, /const cleanupTasks = \[\s*\{ label: "ACP service shutdown", run: \(\) => acpService\.shutdown\(\) \},\s*\{ label: "MCP service cleanup", run: \(\) => mcpService\.cleanup\(\) \},\s*\{ label: "remote server shutdown", run: \(\) => stopRemoteServer\(\) \},\s*\] as const/)
  assert.match(headlessSection, /const cleanupPromise = Promise\.all\(\s*cleanupTasks\.map\(async \(\{ label, run \}\) => \{/)
  assert.match(headlessSection, /await Promise\.race\(\[\s*cleanupPromise,\s*new Promise<void>\(\(_, reject\) => \{/)
  assert.match(headlessSection, /new Error\("Headless cleanup timeout"\)/)
})

test('headless graceful shutdown keeps per-service failures best-effort and still exits', () => {
  assert.match(headlessSection, /if \(isHeadlessShuttingDown\) return/)
  assert.match(headlessSection, /console\.error\(`\[Headless\] Error during \$\{label\}:`, error\)/)
  assert.match(headlessSection, /process\.exit\(exitCode\)/)
})