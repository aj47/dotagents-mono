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
  assert.doesNotMatch(screenSource, /predefinedPrompts\s*\.slice/);
  assert.doesNotMatch(screenSource, /availableSkills\.slice/);
  assert.doesNotMatch(screenSource, /availableTasks\.slice/);
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
  assert.match(screenSource, /const openAddPromptModal = useCallback/);
  assert.match(screenSource, /openAddPromptModal\(\)/);
  assert.match(screenSource, /const handleSavePrompt = async \(\) =>/);
  assert.match(screenSource, /await settingsClient\.updateSettings\(\{ predefinedPrompts: updatedPrompts \}\)/);
  assert.match(screenSource, /Prompt saved to your desktop prompt library\./);
});

test('can edit and delete predefined prompt shortcuts from the mobile launcher', () => {
  assert.match(screenSource, /const \[editingPrompt, setEditingPrompt\] = useState<PredefinedPromptSummary \| null>\(null\)/);
  assert.match(screenSource, /const openEditPromptModal = useCallback\(\(prompt: PredefinedPromptSummary\) =>/);
  assert.match(screenSource, /setNewPromptName\(prompt\.name\)/);
  assert.match(screenSource, /setNewPromptContent\(prompt\.content\)/);
  assert.match(screenSource, /prompt,/);
  assert.match(screenSource, /item\.prompt \?/);
  assert.match(screenSource, /Edit Prompt/);
  assert.match(screenSource, /Save Prompt/);
  assert.match(screenSource, /Prompt updated in your desktop prompt library\./);
  assert.match(screenSource, /const handleDeletePrompt = useCallback\(\(prompt: PredefinedPromptSummary\) =>/);
  assert.match(screenSource, /Delete Prompt/);
  assert.match(screenSource, /Prompt removed from your desktop prompt library\./);
  assert.match(screenSource, /predefinedPrompts\.filter\(\(existingPrompt\) => existingPrompt\.id !== prompt\.id\)/);
  assert.match(screenSource, /accessibilityLabel=\{createButtonAccessibilityLabel\(`Edit prompt \$\{item\.title\}`\)\}/);
  assert.match(screenSource, /accessibilityLabel=\{createButtonAccessibilityLabel\(`Delete prompt \$\{item\.title\}`\)\}/);
});

test('removes the bottom composer prompt-library button', () => {
  assert.doesNotMatch(screenSource, /Open prompts, skills, and tasks/);
  assert.doesNotMatch(screenSource, /promptLibraryVisible/);
  assert.doesNotMatch(screenSource, /Prompts, Skills & Tasks/);
});
