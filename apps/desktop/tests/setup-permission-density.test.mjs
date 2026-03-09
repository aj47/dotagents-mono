import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const setupSource = fs.readFileSync(
  path.join(process.cwd(), 'apps/desktop/src/renderer/src/pages/setup.tsx'),
  'utf8',
)

test('desktop setup page avoids the old negative top offset and keeps a tighter responsive shell', () => {
  assert.doesNotMatch(setupSource, /-mt-20/)
  assert.match(setupSource, /app-drag-region flex h-dvh items-center justify-center overflow-y-auto px-4 py-6 sm:p-10/)
  assert.match(setupSource, /max-w-3xl flex-col gap-6 sm:gap-8/)
})

test('permission blocks stack by default and only split into label\/action columns on wider windows', () => {
  assert.doesNotMatch(setupSource, /grid-cols-2 gap-5 p-3/)
  assert.match(setupSource, /grid gap-3 p-4 sm:p-5 md:grid-cols-\[minmax\(0,1fr\)_auto\] md:items-center md:gap-6/)
  assert.match(setupSource, /<Button type="button" onClick=\{actionHandler\} className="w-full md:w-auto">/)
})