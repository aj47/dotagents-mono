import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const dialogSource = fs.readFileSync(
  path.join(process.cwd(), 'apps/desktop/src/renderer/src/components/ui/dialog.tsx'),
  'utf8',
)

test('desktop shared dialog shell uses tighter viewport chrome on constrained windows', () => {
  assert.match(
    dialogSource,
    /w-\[calc\(100%-24px\)\] max-w-\[calc\(100%-24px\)\] max-h-\[calc\(100%-24px\)\][\s\S]*?gap-3[\s\S]*?p-4[\s\S]*?sm:max-h-\[calc\(100%-32px\)\] sm:max-w-\[calc\(100%-32px\)\][\s\S]*?sm:gap-4 sm:p-5/,
  )
})

test('desktop shared dialog header reserves space for a larger close affordance', () => {
  assert.match(dialogSource, /className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md[\s\S]*?sm:right-4 sm:top-4"/)
  assert.match(dialogSource, /"flex flex-col space-y-1 pr-10 text-center sm:text-left"/)
})