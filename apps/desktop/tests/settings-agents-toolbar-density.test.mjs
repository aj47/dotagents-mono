import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const settingsAgentsSource = fs.readFileSync(
  path.join(process.cwd(), 'apps/desktop/src/renderer/src/pages/settings-agents.tsx'),
  'utf8',
)

const toolbarBlock = settingsAgentsSource.match(/\{!editing && \(([\s\S]*?)\n\s*\)\}/)?.[1] ?? ''
const toolbarButtonBlocks = []
let currentToolbarButtonLines = []

for (const line of toolbarBlock.split('\n')) {
  const trimmedLine = line.trim()
  if (!currentToolbarButtonLines.length) {
    if (trimmedLine.startsWith('<Button ')) {
      if (trimmedLine.includes('</Button>')) {
        toolbarButtonBlocks.push(trimmedLine)
      } else {
        currentToolbarButtonLines = [trimmedLine]
      }
    }
    continue
  }

  currentToolbarButtonLines.push(trimmedLine)
  if (trimmedLine.includes('</Button>')) {
    toolbarButtonBlocks.push(currentToolbarButtonLines.join('\n'))
    currentToolbarButtonLines = []
  }
}

const expectedToolbarLabels = ['Import Bundle', 'Export Bundle', 'Export for Hub', 'Rescan Files', 'Add Agent']

test('desktop settings agents keep the list toolbar in a compact wrap-safe top row', () => {
  assert.ok(toolbarBlock, 'expected to find the desktop settings agents list toolbar block')
  assert.match(toolbarBlock, /<div className="mb-3 flex flex-wrap items-center justify-end gap-1\.5">/)
  assert.match(toolbarBlock, /className="h-8 gap-1\.5 whitespace-nowrap px-2\.5"/)
})

test('desktop settings agents keep all list-toolbar actions available in compact small buttons', () => {
  assert.ok(toolbarBlock, 'expected to find the desktop settings agents list toolbar block')
  assert.equal(toolbarButtonBlocks.length, expectedToolbarLabels.length, 'expected the toolbar to keep exactly five top-row actions')
  const toolbarLabels = toolbarButtonBlocks.map(block => block.replace(/^[\s\S]*\/>/, '').replace('</Button>', '').trim())
  assert.deepEqual(toolbarLabels, expectedToolbarLabels)
  for (const [index, block] of toolbarButtonBlocks.entries()) {
    const label = toolbarLabels[index]
    assert.match(block, /^<Button[\s\S]*size="sm"/, `expected ${label} to stay a small button`)
    assert.match(block, /className="h-8 gap-1\.5 whitespace-nowrap px-2\.5"/, `expected ${label} to keep the compact toolbar sizing classes`)
  }
})