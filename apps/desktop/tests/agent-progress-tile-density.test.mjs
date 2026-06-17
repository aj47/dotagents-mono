import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const agentProgressSource = fs.readFileSync(
  path.join(process.cwd(), 'apps/desktop/src/renderer/src/components/agent-progress.tsx'),
  'utf8',
)

test('desktop agent-progress tile keeps session metadata in the header without repeating it in the footer', () => {
  assert.match(
    agentProgressSource,
    /className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 gap-y-0\.5"[\s\S]*title=\{primaryAgentLabel\}[\s\S]*\{sessionDurationLabel\}[\s\S]*\{sessionCostLabel\}/,
    'expected the tile header to keep agent, duration, and cost metadata near the session title',
  )
  assert.doesNotMatch(
    agentProgressSource,
    /Footer with session status metadata\./,
    'expected the tile footer metadata strip to be removed after moving metadata into the header',
  )
})

test('desktop agent-progress tile removes inner rounded shell against square app chrome', () => {
  assert.match(
    agentProgressSource,
    /"progress-panel flex flex-col w-full overflow-hidden"/,
    'expected the base progress panel shell to avoid an always-rounded inner surface',
  )
  assert.match(
    agentProgressSource,
    /"rounded-none transition-all duration-200 cursor-pointer"/,
    'expected tile sessions to render square inside the main app frame',
  )
})
