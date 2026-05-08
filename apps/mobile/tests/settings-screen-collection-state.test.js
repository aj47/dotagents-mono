const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const settingsSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SettingsScreen.tsx'),
  'utf8'
);

test('uses shared collection state helpers for mobile settings selections', () => {
  assert.match(settingsSource, /getVisibleSelectedValues\(selectedSkillIds, displayedSkillIds\)/);
  assert.match(settingsSource, /getVisibleSelectedValues\(selectedKnowledgeNoteIds, displayedKnowledgeNoteIds\)/);
  assert.match(settingsSource, /setSelectedKnowledgeNoteIds\(prev => toggleSetValue\(prev, noteId\)\)/);
  assert.match(settingsSource, /setSelectedSkillIds\(prev => toggleSetValue\(prev, skillId\)\)/);
  assert.match(settingsSource, /setSelectedKnowledgeNoteIds\(prev => removeSetValue\(prev, noteId\)\)/);
  assert.match(settingsSource, /setSelectedKnowledgeNoteIds\(prev => removeSetValues\(prev, ids\)\)/);
  assert.match(settingsSource, /setSelectedSkillIds\(prev => removeSetValue\(prev, skill\.id\)\)/);
  assert.match(settingsSource, /setSelectedSkillIds\(prev => removeSetValues\(prev, visibleSelectedSkillIds\)\)/);
  assert.doesNotMatch(settingsSource, /\[\.\.\.selectedSkillIds\]\.filter\(\(id\) => displayedSkillIds\.has\(id\)\)/);
  assert.doesNotMatch(settingsSource, /\[\.\.\.selectedKnowledgeNoteIds\]\.filter\(\(id\) => displayedKnowledgeNoteIds\.has\(id\)\)/);
  assert.doesNotMatch(settingsSource, /const next = new Set\(prev\);[\s\S]*next\.delete\(skill\.id\)/);
});
