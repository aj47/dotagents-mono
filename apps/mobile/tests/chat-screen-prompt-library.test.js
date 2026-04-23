const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const screenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'ChatScreen.tsx'),
  'utf8'
);

test('unifies saved and slash prompts into one new-chat prompt library section', () => {
  assert.match(screenSource, /const promptLibraryQuickStarts = useMemo/);
  assert.match(screenSource, /source: isSlashCommandPrompt\(prompt\) \? 'command' as const : 'saved-prompt' as const/);
  assert.match(screenSource, /id: 'prompt-library',[\s\S]*?title: 'Prompt Library',[\s\S]*?items: promptLibraryQuickStarts/);
  assert.doesNotMatch(screenSource, /title: 'Custom Commands'/);
  assert.doesNotMatch(screenSource, /title: 'Saved Prompts'/);
});

test('uses Prompt Library language in the searchable prompt sheet', () => {
  assert.match(screenSource, /Saved and predefined prompts from your connected desktop app/);
  assert.match(screenSource, /<Text style=\{styles\.promptLibrarySectionTitle\}>Prompt Library<\/Text>/);
  assert.match(screenSource, /predefinedPrompts\.length === 0 \? 'No prompts yet' : 'No matching prompts'/);
});