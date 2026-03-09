import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const agentProgressSource = fs.readFileSync(
  path.join(process.cwd(), 'apps/desktop/src/renderer/src/components/agent-progress.tsx'),
  'utf8',
)

test('desktop agent-progress tile keeps agent identity in the header without repeating it in the footer', () => {
  assert.match(
    agentProgressSource,
    /\{\/\* Agent name indicator in header \*\/\}[\s\S]*<Bot className="h-2\.5 w-2\.5 shrink-0" \/>[\s\S]*<span className="truncate">\{profileName\}<\/span>/,
    'expected the tile header to keep the compact agent identity row near the session title',
  )
  assert.doesNotMatch(
    agentProgressSource,
    /title=\{`Profile: \$\{profileName\}`\}/,
    'expected the tile footer to stop repeating the same profile label already shown in the header',
  )
})

test('desktop agent-progress tile footer still prioritizes live status metadata after the density cleanup', () => {
  assert.match(
    agentProgressSource,
    /className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1"/,
    'expected the tile footer metadata row to remain wrap-safe after removing duplicate profile chrome',
  )
  assert.match(
    agentProgressSource,
    /<ACPSessionBadge info=\{acpSessionInfo\} className="min-w-0 max-w-full" \/>/,
    'expected ACP session metadata to remain available in the tile footer',
  )
})