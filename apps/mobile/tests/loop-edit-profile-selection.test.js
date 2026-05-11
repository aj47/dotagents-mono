const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const screenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'LoopEditScreen.tsx'),
  'utf8'
);

test('explains the default-agent fallback in LoopEdit profile selection', () => {
  assert.match(screenSource, /APP_SHELL_LOOP_EDITOR_PRESENTATION\.fields\.agentProfile\.helper/);
  assert.match(screenSource, /APP_SHELL_LOOP_EDITOR_PRESENTATION\.agentProfile\.defaultLabel/);
  assert.match(screenSource, /APP_SHELL_LOOP_EDITOR_PRESENTATION\.agentProfile\.defaultHelper/);
  assert.match(screenSource, /APP_SHELL_LOOP_EDITOR_PRESENTATION\.agentProfile\.emptyLabel/);
});

test('exposes LoopEdit profile choices as selected-state buttons', () => {
  assert.match(screenSource, /accessibilityRole="button"[\s\S]*?createButtonAccessibilityLabel\(APP_SHELL_LOOP_EDITOR_PRESENTATION\.agentProfile\.defaultAccessibilityLabel\)/);
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
  assert.match(screenSource, /DEFAULT_REPEAT_TASK_EDIT_FORM_DATA/);
  assert.match(screenSource, /formatRepeatTaskEditFormData\(loopFromRoute\)/);
  assert.match(screenSource, /formatRepeatTaskEditFormData\(loop\)/);
  assert.match(screenSource, /RepeatTaskEditFormData/);
  assert.doesNotMatch(screenSource, /type LoopFormData/);
  assert.doesNotMatch(screenSource, /const defaultFormData/);
  assert.match(screenSource, /const savePayloadResult = buildRepeatTaskEditFormSavePayload\(formData,/);
  assert.match(screenSource, /runOnStartup:\s*payload\.runOnStartup/);
  assert.match(screenSource, /speakOnTrigger:\s*payload\.speakOnTrigger/);
  assert.match(screenSource, /continueInSession:\s*payload\.continueInSession/);
  assert.match(screenSource, /lastSessionId:\s*payload\.continueInSession \? \(payload\.lastSessionId \|\| null\) : null/);
  assert.match(screenSource, /maxIterations:\s*payload\.maxIterations \?\? null/);
  assert.match(screenSource, /runContinuously:\s*payload\.runContinuously/);
  assert.match(screenSource, /schedule:\s*payload\.schedule/);
  assert.match(screenSource, /APP_SHELL_LOOP_EDITOR_PRESENTATION\.switches\.runOnStartup\.label/);
  assert.match(screenSource, /APP_SHELL_LOOP_EDITOR_PRESENTATION\.switches\.speakOnTrigger\.label/);
  assert.match(screenSource, /APP_SHELL_LOOP_EDITOR_PRESENTATION\.switches\.continueInSession\.label/);
  assert.match(screenSource, /APP_SHELL_LOOP_EDITOR_PRESENTATION\.fields\.maxIterations\.label/);
  assert.doesNotMatch(screenSource, /sanitizeScheduleTimes/);
  assert.doesNotMatch(screenSource, /buildRepeatTaskScheduleFromDraft/);
});

test('uses desktop session candidates for the continue-in-session picker', () => {
  assert.match(screenSource, /settingsClient\.getAgentSessionCandidates\(20\)/);
  assert.match(screenSource, /buildAgentSessionCandidateOptions/);
  assert.match(screenSource, /APP_SHELL_LOOP_EDITOR_PRESENTATION\.fields\.continueFromSession\.label/);
  assert.match(screenSource, /APP_SHELL_LOOP_EDITOR_PRESENTATION\.sessionPicker\.autoLabel/);
  assert.match(screenSource, /APP_SHELL_LOOP_EDITOR_PRESENTATION\.sessionPicker\.autoHelper/);
  assert.match(screenSource, /onPress=\{\(\) => updateField\('lastSessionId', candidate\.id\)\}/);
  assert.match(screenSource, /createButtonAccessibilityLabel\(`Continue from \$\{formatAgentSessionCandidateTitle\(candidate\)\}`\)/);
  assert.doesNotMatch(screenSource, /function buildSessionCandidateOptions/);
  assert.doesNotMatch(screenSource, /function formatSessionCandidateTitle/);
  assert.doesNotMatch(screenSource, /Pinned session ID \(optional\)/);
});
