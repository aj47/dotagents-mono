import assert from 'node:assert/strict'
import test from 'node:test'
import fs from 'node:fs'
import path from 'node:path'

const knowledgePath = path.resolve(process.cwd(), 'apps/desktop/src/renderer/src/pages/knowledge.tsx')
const knowledgeSource = fs.readFileSync(knowledgePath, 'utf8')

test('knowledge page resets selection when switching grouped and ungrouped views', () => {
  assert.match(
    knowledgeSource,
    /setSelectedIds\(new Set\(\)\)[\s\S]*\}, \[searchQuery, contextFilter, dateFilter, sortOption, viewMode\]\)/,
  )
})

test('knowledge page can promote notes from the flat ungrouped result list', () => {
  assert.match(
    knowledgeSource,
    /loadedNotesById\.get\(id\)[\s\S]*searchResults\.find\(\(entry\) => entry\.id === id\)[\s\S]*flatNotes\.find\(\(entry\) => entry\.id === id\)/,
  )
  assert.match(
    knowledgeSource,
    /queryClient\.invalidateQueries\(\{ queryKey: \["knowledgeNotesFlat"\] \}\)/,
  )
})