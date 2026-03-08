const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const tipcSource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'main', 'tipc.ts'),
  'utf8'
)

test('explicit loop restarts resume scheduling before restarting timers', () => {
  assert.match(
    tipcSource,
    /startLoop: t\.procedure\s*\.input<\{ loopId: string \}>\(\)\s*\.action\(async \(\{ input \}\) => \{\s*loopService\.resumeScheduling\(\)\s*return \{ success: loopService\.startLoop\(input\.loopId\) \}/
  )

  assert.match(
    tipcSource,
    /startAllLoops: t\.procedure\.action\(async \(\) => \{\s*loopService\.resumeScheduling\(\)\s*loopService\.startAllLoops\(\)\s*return \{ success: true \}/
  )
})