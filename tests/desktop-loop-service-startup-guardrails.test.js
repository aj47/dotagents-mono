const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const loopServiceSource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'main', 'loop-service.ts'),
  'utf8'
)

test('runOnStartup scheduling keeps a cancellable pending-startup handle instead of fire-and-forget immediates', () => {
  assert.match(loopServiceSource, /private pendingStartupRuns: Map<string, ReturnType<typeof setImmediate>> = new Map\(\)/)
  assert.match(loopServiceSource, /this\.clearPendingStartupRun\(loopId\)\s*this\.clearScheduledTimer\(loopId\)/)
  assert.match(loopServiceSource, /const startupRun = setImmediate\(\(\) => \{\s*this\.pendingStartupRuns\.delete\(loopId\)\s*void this\.executeLoop\(loopId, \{ rescheduleAfterRun: true, origin: "startup" \}\)/)
  assert.match(loopServiceSource, /this\.pendingStartupRuns\.set\(loopId, startupRun\)/)
})

test('manual triggers stay explicit while automatic executions skip disabled or stopping loops', () => {
  assert.match(loopServiceSource, /await this\.executeLoop\(loopId, \{ rescheduleAfterRun: shouldReschedule, origin: "manual" \}\)/)
  assert.match(loopServiceSource, /if \(options\.origin !== "manual"\) \{\s*if \(this\.isStopping\) \{/)
  assert.match(loopServiceSource, /if \(!loop\.enabled\) \{\s*logApp\(`\[LoopService\] Skip \$\{options\.origin\} execution for "\$\{loop\.name\}" \(\$\{loopId\}\): disabled`\)/)
})

test('stopping loop scheduling also clears queued startup runs and treats them as active scheduled work', () => {
  assert.match(loopServiceSource, /pending startup runs: \$\{this\.pendingStartupRuns\.size\}/)
  assert.match(loopServiceSource, /for \(const loopId of new Set\(\[\.\.\.this\.activeTimers\.keys\(\), \.\.\.this\.pendingStartupRuns\.keys\(\)\]\)\) \{/)
  assert.match(loopServiceSource, /const hadScheduledWork = this\.activeTimers\.has\(loopId\) \|\| this\.pendingStartupRuns\.has\(loopId\)/)
  assert.match(loopServiceSource, /this\.clearPendingStartupRun\(loopId\)\s*this\.clearScheduledTimer\(loopId\)/)
})