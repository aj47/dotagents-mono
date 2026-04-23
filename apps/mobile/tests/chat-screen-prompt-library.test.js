const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const screenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'ChatScreen.tsx'),
  'utf8'
);

test('shows desktop library items directly in the new-chat prompt launchers', () => {
  assert.match(screenSource, /const promptQuickStarts = useMemo/);
  assert.match(screenSource, /source: isSlashCommandPrompt\(prompt\) \? 'command' as const : 'saved-prompt' as const/);
  assert.match(screenSource, /settingsClient\.getSkills\(\)/);
  assert.match(screenSource, /settingsClient\.getLoops\(\)/);
  assert.match(screenSource, /source: 'skill' as const/);
  assert.match(screenSource, /source: 'task' as const/);
  assert.match(screenSource, /handleRunPromptTask/);
  assert.match(screenSource, /promptQuickStarts\.map\(\(item\) =>/);
  assert.match(screenSource, /No prompts, skills, or tasks available from your connected desktop app\./);
  assert.doesNotMatch(screenSource, /title: 'Custom Commands'/);
  assert.doesNotMatch(screenSource, /title: 'Saved Prompts'/);
  assert.doesNotMatch(screenSource, /title: 'Prompt Library'/);
  assert.doesNotMatch(screenSource, /title: 'Starter Packs'/);
  assert.doesNotMatch(screenSource, /STARTER_PACK_SHORTCUTS/);
});

test('can create a new predefined prompt from mobile and save it to desktop settings', () => {
  assert.match(screenSource, /id: 'action-add-prompt'/);
  assert.match(screenSource, /title: '\+ Add Prompt'/);
  assert.match(screenSource, /setAddPromptModalVisible\(true\)/);
  assert.match(screenSource, /const handleSaveNewPrompt = async \(\) =>/);
  assert.match(screenSource, /await settingsClient\.updateSettings\(\{ predefinedPrompts: updatedPrompts \}\)/);
  assert.match(screenSource, /Prompt saved to your desktop prompt library\./);
});

test('removes the bottom composer prompt-library button', () => {
  assert.doesNotMatch(screenSource, /Open prompts, skills, and tasks/);
  assert.doesNotMatch(screenSource, /promptLibraryVisible/);
  assert.doesNotMatch(screenSource, /Prompts, Skills & Tasks/);
});