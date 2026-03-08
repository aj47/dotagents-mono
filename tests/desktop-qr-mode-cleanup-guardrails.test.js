const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const source = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'main', 'index.ts'),
  'utf8'
)

const qrStart = source.indexOf('if (isQRMode) {')
const qrEnd = source.indexOf('// Handle --headless mode')

assert.ok(qrStart >= 0, 'expected QR mode block in index.ts')
assert.ok(qrEnd > qrStart, 'expected headless block after QR mode block')

const qrSection = source.slice(qrStart, qrEnd)

test('qr mode graceful shutdown uses the shared cleanup task list including Cloudflare tunnel shutdown', () => {
  assert.match(source, /\{ label: "Cloudflare tunnel shutdown", run: \(\) => stopCloudflareTunnel\(\) \}/)
  assert.match(qrSection, /await runShutdownCleanup\(\{\s*tasks: getShutdownCleanupTasks\(\),\s*timeoutMs: CLEANUP_TIMEOUT_MS,\s*timeoutMessage: "QR mode cleanup timeout",/)
})

test('qr mode traps terminal shutdown signals and exits through graceful cleanup', () => {
  assert.match(qrSection, /const gracefulQrShutdown = async \(exitCode: number\) => \{/) 
  assert.match(qrSection, /if \(isQrShuttingDown\) return/)
  assert.match(qrSection, /process\.on\("SIGINT", \(\) => \{\s*void gracefulQrShutdown\(0\)\s*\}\)/)
  assert.match(qrSection, /process\.on\("SIGTERM", \(\) => \{\s*void gracefulQrShutdown\(0\)\s*\}\)/)
  assert.match(qrSection, /process\.exit\(exitCode\)/)
})

test('qr mode startup failures route through graceful cleanup instead of immediate exit', () => {
  assert.match(
    qrSection,
    /if \(!serverResult\.running\) \{\s*console\.error\("\[QR Mode\] Failed to start remote server:", serverResult\.error \|\| "Unknown error"\)\s*await gracefulQrShutdown\(1\)\s*return\s*\}/
  )
  assert.match(
    qrSection,
    /console\.error\("\[QR Mode\] Failed to start remote server:", err instanceof Error \? err\.message : String\(err\)\)\s*await gracefulQrShutdown\(1\)\s*return/
  )
})