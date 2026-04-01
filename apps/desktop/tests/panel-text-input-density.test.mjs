import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const textInputPanelSource = fs.readFileSync(
  path.join(process.cwd(), 'apps/desktop/src/renderer/src/components/text-input-panel.tsx'),
  'utf8',
)

test('desktop panel text input avoids redundant agent-label chrome and keeps the header wrap-safe', () => {
  assert.doesNotMatch(
    textInputPanelSource,
    /modern-text-muted text-\[11px\] uppercase tracking-wide">Agent<\//,
    'expected the floating panel to rely on the selector itself instead of a duplicate Agent label',
  )
  assert.match(
    textInputPanelSource,
    /<div className="flex min-w-0 max-w-full flex-wrap items-center gap-1\.5">\s*\{showAgentSelector && \(\s*<AgentSelector/,
    'expected the agent selector row to stay wrap-safe on narrow panel widths',
  )
})

test('desktop panel text input keeps helper/actions compact and attachment previews smaller', () => {
  assert.match(
    textInputPanelSource,
    /modern-text-muted flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-\[11px\]/,
    'expected the helper/action row to wrap instead of forcing a rigid single line',
  )
  assert.match(
    textInputPanelSource,
    /Enter to send • Shift\+Enter new line • Esc close/,
    'expected the desktop panel helper copy to use the shorter text-first shortcut hint',
  )
  assert.match(
    textInputPanelSource,
    /className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-border"/,
    'expected attachment previews to stay compact inside the floating panel composer',
  )
  assert.match(
    textInputPanelSource,
    /className="top-full left-0 mt-1"/,
    'expected the slash-command dropdown to open below the textarea inside the text-input modal',
  )
})