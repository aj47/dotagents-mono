const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const screenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'KnowledgeNoteEditScreen.tsx'),
  'utf8'
);
const sharedFormSource = fs.readFileSync(
  path.join(__dirname, '..', '..', '..', 'packages', 'shared', 'src', 'knowledge-note-form.ts'),
  'utf8'
);

test('explains note context using knowledge-note terminology', () => {
  assert.match(screenSource, /APP_SHELL_KNOWLEDGE_NOTE_EDITOR_PRESENTATION\.context\.helper/);
  assert.match(sharedFormSource, /Keep this note available for search and explicit retrieval\./);
  assert.match(screenSource, /APP_SHELL_KNOWLEDGE_NOTE_EDITOR_PRESENTATION\.fields\.summary\.helper/);
});

test('uses shared knowledge note edit form defaults and formatting', () => {
  assert.match(screenSource, /DEFAULT_KNOWLEDGE_NOTE_EDIT_FORM_DATA/);
  assert.match(screenSource, /formatKnowledgeNoteEditFormData\(note, \{ referencesInputFormat: 'comma' \}\)/);
  assert.match(screenSource, /KNOWLEDGE_NOTE_EDIT_CONTEXT_OPTIONS/);
  assert.match(screenSource, /KnowledgeNoteEditFormData/);
  assert.match(screenSource, /APP_SHELL_KNOWLEDGE_NOTE_EDITOR_PRESENTATION\.loadingLabel/);
  assert.match(screenSource, /APP_SHELL_KNOWLEDGE_NOTE_EDITOR_PRESENTATION\.fields\.title\.requiredLabel/);
  assert.doesNotMatch(screenSource, /const defaultFormData/);
  assert.doesNotMatch(screenSource, /const CONTEXT_OPTIONS/);
  assert.doesNotMatch(screenSource, />Loading note\.\.\.</);
  assert.doesNotMatch(screenSource, />Note title \*<\/Text>/);
});

test('exposes knowledge-note context choices as selected-state buttons', () => {
  assert.match(screenSource, /accessibilityRole="button"[\s\S]*?createButtonAccessibilityLabel\(`Set note context to \$\{option\.label\}`\)/);
  assert.match(screenSource, /accessibilityState=\{\{ selected: isSelected, disabled: isSaving \}\}/);
  assert.match(screenSource, /\{isSelected && <Text style=\{styles\.noteContextOptionCheckmark\}>✓<\/Text>\}/);
});

test('keeps knowledge-note context options full-width and touch-friendly for narrow screens', () => {
  assert.match(screenSource, /noteContextOptions:\s*\{[\s\S]*?width:\s*'100%' as const,[\s\S]*?gap:\s*spacing\.xs/);
  assert.match(screenSource, /noteContextOption:\s*\{[\s\S]*?createMinimumTouchTargetStyle\(\{[\s\S]*?minSize:\s*44,[\s\S]*?horizontalMargin:\s*0[\s\S]*?width:\s*'100%' as const,[\s\S]*?justifyContent:\s*'space-between',/);
  assert.match(screenSource, /noteContextOptionInfo:\s*\{[\s\S]*?flex:\s*1,[\s\S]*?minWidth:\s*0\s*\}/);
  assert.match(screenSource, /APP_SHELL_KNOWLEDGE_NOTE_EDITOR_PRESENTATION\.fields\.references\.label/);
});
