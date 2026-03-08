const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const settingsSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SettingsScreen.tsx'),
  'utf8'
);

test('tracks section-specific load errors for remote settings collections', () => {
  assert.match(settingsSource, /function formatRemoteCollectionError\(collectionName: string, error: unknown\): string/);
  assert.match(settingsSource, /const \[skillsError, setSkillsError\] = useState<string \| null>\(null\);/);
  assert.match(settingsSource, /const \[memoriesError, setMemoriesError\] = useState<string \| null>\(null\);/);
  assert.match(settingsSource, /const \[agentProfilesError, setAgentProfilesError\] = useState<string \| null>\(null\);/);
  assert.match(settingsSource, /const \[loopsError, setLoopsError\] = useState<string \| null>\(null\);/);
  assert.match(settingsSource, /setSkillsError\(formatRemoteCollectionError\('skills', error\)\);/);
  assert.match(settingsSource, /setMemoriesError\(formatRemoteCollectionError\('memories', error\)\);/);
  assert.match(settingsSource, /setAgentProfilesError\(formatRemoteCollectionError\('agents', error\)\);/);
  assert.match(settingsSource, /setLoopsError\(formatRemoteCollectionError\('agent loops', error\)\);/);
});

test('renders explicit loading, error, and retry states for remote collection sections', () => {
  assert.match(settingsSource, /const renderRemoteCollectionState = \(\{[\s\S]*?if \(isLoading && itemCount === 0\)[\s\S]*?<Text style=\{styles\.loadingText\}>\{loadingText\}<\/Text>/);
  assert.match(settingsSource, /if \(error\)[\s\S]*?style=\{styles\.inlineWarningContainer\}[\s\S]*?createButtonAccessibilityLabel\(retryActionLabel\)[\s\S]*?accessibilityHint=\{retryHint\}[\s\S]*?<Text style=\{styles\.inlineRetryText\}>Retry<\/Text>/);
  assert.match(settingsSource, /if \(itemCount === 0\)[\s\S]*?<Text style=\{styles\.helperText\}>\{emptyText\}<\/Text>/);
  assert.match(settingsSource, /inlineRetryButton:\s*\{[\s\S]*?\.\.\.compactActionTouchTarget/);
});

test('wires retryable copy into skills, memories, agents, and loop settings sections', () => {
  assert.match(settingsSource, /loadingText: 'Loading skills\.\.\.'[\s\S]*?retryActionLabel: 'Retry loading skills'[\s\S]*?onRetry: fetchSkills/);
  assert.match(settingsSource, /loadingText: 'Loading memories\.\.\.'[\s\S]*?retryActionLabel: 'Retry loading memories'[\s\S]*?onRetry: fetchMemories/);
  assert.match(settingsSource, /loadingText: 'Loading agents\.\.\.'[\s\S]*?retryActionLabel: 'Retry loading agents'[\s\S]*?onRetry: fetchAgentProfiles/);
  assert.match(settingsSource, /loadingText: 'Loading agent loops\.\.\.'[\s\S]*?retryActionLabel: 'Retry loading agent loops'[\s\S]*?onRetry: fetchLoops/);
});