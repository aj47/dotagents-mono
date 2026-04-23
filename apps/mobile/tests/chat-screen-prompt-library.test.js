const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const screenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'ChatScreen.tsx'),
  'utf8'
);

test('shows configured prompts directly in the new-chat prompt launchers', () => {
  assert.match(screenSource, /const promptQuickStarts = useMemo/);
  assert.match(screenSource, /source: isSlashCommandPrompt\(prompt\) \? 'command' as const : 'saved-prompt' as const/);
  assert.match(screenSource, /promptQuickStarts\.map\(\(item\) =>/);
  assert.match(screenSource, /Insert prompt \$\{item\.title\}/);
  assert.match(screenSource, /No predefined prompts available from your connected desktop app\./);
  assert.doesNotMatch(screenSource, /title: 'Custom Commands'/);
  assert.doesNotMatch(screenSource, /title: 'Saved Prompts'/);
  assert.doesNotMatch(screenSource, /title: 'Prompt Library'/);
  assert.doesNotMatch(screenSource, /title: 'Starter Packs'/);
  assert.doesNotMatch(screenSource, /STARTER_PACK_SHORTCUTS/);
});

test('removes the bottom composer prompt-library button', () => {
  assert.doesNotMatch(screenSource, /Open prompts, skills, and tasks/);
  assert.doesNotMatch(screenSource, /promptLibraryVisible/);
  assert.doesNotMatch(screenSource, /Prompts, Skills & Tasks/);
});