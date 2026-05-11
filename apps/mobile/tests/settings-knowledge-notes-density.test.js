const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const settingsSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SettingsScreen.tsx'),
  'utf8'
);

function sectionMarker(id) {
  return `<CollapsibleSection id="${id}" title={getAppShellMobileSettingsSectionTitle('${id}')}>`;
}

function extractBetween(startMarker, endMarker) {
  const start = settingsSource.indexOf(startMarker);
  assert.notEqual(start, -1, `Missing start marker: ${startMarker}`);

  const end = settingsSource.indexOf(endMarker, start);
  assert.notEqual(end, -1, `Missing end marker: ${endMarker}`);

  return settingsSource.slice(start, end);
}

test('keeps the mobile knowledge notes subsection free of decorative delete emoji chrome', () => {
  const knowledgeNoteRowRenderer = extractBetween(
    'const renderKnowledgeNoteRow = (note: KnowledgeNote) => {',
    '  };\n\n  if (!ready)'
  );
  const knowledgeNotesSection = extractBetween(
    sectionMarker('knowledgeNotes'),
    '{/* 4m. Agents */}'
  );

  assert.doesNotMatch(knowledgeNoteRowRenderer, /🗑️/);
  assert.match(knowledgeNoteRowRenderer, /getAppShellKnowledgeNoteActionLabel\('delete'\)/);
  assert.match(knowledgeNoteRowRenderer, /getAppShellKnowledgeNoteDeleteAccessibilityLabel\(note\.title\)/);
  assert.match(knowledgeNotesSection, /knowledgeNoteSections\.map/);
  assert.match(knowledgeNotesSection, /Canonical note fields are title, context, summary, body, tags, and references\./);
});
