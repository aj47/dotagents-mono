const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const screenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'LoopEditScreen.tsx'),
  'utf8'
);

test('explains the default-agent fallback in LoopEdit profile selection', () => {
  assert.match(screenSource, /Choose a dedicated agent for this loop, or leave it on the default agent\./);
  assert.match(screenSource, /No dedicated agent/);
  assert.match(screenSource, /Uses the default active agent when this loop runs\./);
  assert.match(screenSource, /No saved agent profiles yet\. This loop will use the default agent until you create one\./);
});

test('exposes LoopEdit profile choices as selected-state buttons', () => {
  assert.match(screenSource, /accessibilityRole="button"[\s\S]*?createButtonAccessibilityLabel\('Use the default agent for this loop'\)/);
  assert.match(screenSource, /accessibilityState=\{\{ selected: !formData\.profileId, disabled: isSaveDisabled \}\}/);
  assert.match(screenSource, /createButtonAccessibilityLabel\(`Use \$\{profile\.displayName \|\| profile\.name\} for this loop`\)/);
  assert.match(screenSource, /accessibilityState=\{\{ selected: formData\.profileId === profile\.id, disabled: isSaveDisabled \}\}/);
});

test('keeps LoopEdit profile options full-width and touch-friendly for narrow screens', () => {
  assert.match(screenSource, /profileOptions:\s*\{[\s\S]*?width:\s*'100%' as const,[\s\S]*?gap:\s*spacing\.xs/);
  assert.match(screenSource, /profileOption:\s*\{[\s\S]*?createMinimumTouchTargetStyle\(\{[\s\S]*?minSize:\s*44,[\s\S]*?horizontalMargin:\s*0,[\s\S]*?\}\),[\s\S]*?width:\s*'100%' as const,[\s\S]*?justifyContent:\s*'space-between',/);
  assert.match(screenSource, /profileOptionInfo:\s*\{[\s\S]*?flex:\s*1,[\s\S]*?minWidth:\s*0\s*\}/);
});

test('exposes desktop repeat task execution options on mobile', () => {
  assert.match(screenSource, /runOnStartup:\s*loop\.runOnStartup \?\? false/);
  assert.match(screenSource, /speakOnTrigger:\s*loop\.speakOnTrigger \?\? false/);
  assert.match(screenSource, /continueInSession:\s*loop\.continueInSession \?\? false/);
  assert.match(screenSource, /lastSessionId:\s*loop\.lastSessionId \|\| ''/);
  assert.match(screenSource, /maxIterations:\s*loop\.maxIterations \? String\(loop\.maxIterations\) : ''/);
  assert.match(screenSource, /runOnStartup:\s*formData\.runOnStartup/);
  assert.match(screenSource, /speakOnTrigger:\s*formData\.speakOnTrigger/);
  assert.match(screenSource, /continueInSession:\s*formData\.continueInSession/);
  assert.match(screenSource, /lastSessionId:\s*formData\.continueInSession \? \(lastSessionId \|\| null\) : null/);
  assert.match(screenSource, /maxIterations:\s*parsedMaxIterations \?\? null/);
  assert.match(screenSource, /buildRepeatTaskScheduleFromDraft/);
  assert.match(screenSource, /runContinuously:\s*scheduleResult\.runContinuously/);
  assert.match(screenSource, /schedule:\s*scheduleResult\.schedule/);
  assert.match(screenSource, /Run on startup/);
  assert.match(screenSource, /Speak on trigger/);
  assert.match(screenSource, /Continue in same session/);
  assert.match(screenSource, /Max iterations \(optional\)/);
  assert.doesNotMatch(screenSource, /sanitizeScheduleTimes/);
});

test('uses desktop session candidates for the continue-in-session picker', () => {
  assert.match(screenSource, /settingsClient\.getAgentSessionCandidates\(20\)/);
  assert.match(screenSource, /buildAgentSessionCandidateOptions/);
  assert.match(screenSource, /Continue from session/);
  assert.match(screenSource, /Auto/);
  assert.match(screenSource, /Uses this task's most recent session when it can be revived\./);
  assert.match(screenSource, /onPress=\{\(\) => updateField\('lastSessionId', candidate\.id\)\}/);
  assert.match(screenSource, /createButtonAccessibilityLabel\(`Continue from \$\{formatAgentSessionCandidateTitle\(candidate\)\}`\)/);
  assert.doesNotMatch(screenSource, /function buildSessionCandidateOptions/);
  assert.doesNotMatch(screenSource, /function formatSessionCandidateTitle/);
  assert.doesNotMatch(screenSource, /Pinned session ID \(optional\)/);
});
