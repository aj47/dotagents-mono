const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const source = fs.readFileSync(
  path.join(
    __dirname,
    '..',
    'apps',
    'desktop',
    'src',
    'renderer',
    'src',
    'components',
    'active-agents-sidebar.tsx',
  ),
  'utf8',
)

test('active agents sidebar uses a stable untitled fallback for row labels', () => {
  assert.match(
    source,
    /const getSidebarSessionDisplayTitle = \(title\?: string\) =>\s*title\?\.trim\(\) \|\| "Untitled session"/,
  )
  assert.match(
    source,
    /const sessionDisplayTitle = getSidebarSessionDisplayTitle\(\s*session\.conversationTitle,\s*\)/,
  )
  assert.match(source, /\? `⚠ \$\{sessionDisplayTitle\}`/)
  assert.match(source, /: sessionDisplayTitle\}/)
})

test('active session rows are keyboard-activatable without hijacking nested action buttons', () => {
  assert.match(
    source,
    /const handleKeyboardRowActivate = \(\s*event: React\.KeyboardEvent<HTMLElement>,\s*onActivate: \(\) => void,\s*\) => \{/,
  )
  assert.match(source, /if \(event\.target !== event\.currentTarget\) return/)
  assert.match(source, /if \(event\.key === "Enter" \|\| event\.key === " "\)/)
  assert.match(source, /role="button"/)
  assert.match(source, /tabIndex=\{0\}/)
  assert.match(
    source,
    /aria-label=\{\s*hasPendingApproval\s*\? `Open session requiring approval: \$\{sessionDisplayTitle\}`\s*: `Open session \$\{sessionDisplayTitle\}`\s*\}/,
  )
})

test('sidebar action buttons stay discoverable for keyboard users and expose explicit labels', () => {
  assert.match(source, /group-focus-within:opacity-100/)
  assert.match(source, /group-focus-within:pointer-events-auto/)
  assert.match(source, /focus-visible:opacity-100/)
  assert.match(
    source,
    /aria-label=\{\s*isSnoozed\s*\? `Restore \$\{sessionDisplayTitle\}`\s*: `Minimize \$\{sessionDisplayTitle\} and keep it running in the background`\s*\}/,
  )
  assert.match(source, /aria-label=\{`Stop \$\{sessionDisplayTitle\}`\}/)
})

test('past sidebar sessions use real buttons with accessible open labels', () => {
  assert.match(source, /disabled=\{!session\.conversationId\}/)
  assert.match(source, /title=\{sessionDisplayTitle\}/)
  assert.match(source, /aria-label=\{`Open past session \$\{sessionDisplayTitle\}`\}/)
})

