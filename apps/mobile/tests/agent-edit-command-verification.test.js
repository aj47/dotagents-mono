const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const screenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'AgentEditScreen.tsx'),
  'utf8'
);

const sharedClientSource = fs.readFileSync(
  path.join(__dirname, '..', '..', '..', 'packages', 'shared', 'src', 'settings-api-client.ts'),
  'utf8'
);

test('lets mobile verify external agent setup through the shared settings client', () => {
  assert.match(screenSource, /const \[isVerifyingCommand, setIsVerifyingCommand\]/);
  assert.match(screenSource, /const \[commandVerification, setCommandVerification\]/);
  assert.match(screenSource, /settingsClient\.verifyExternalAgentCommand\(\{/);
  assert.match(screenSource, /command: formData\.connectionCommand/);
  assert.match(screenSource, /args: normalizeAgentConnectionArgs\(formData\.connectionArgs\)/);
  assert.match(screenSource, /probeArgs: selectedPreset\?\.verifyArgs/);
});

test('keeps the mobile verify setup control compact and accessible', () => {
  assert.match(screenSource, /<Text style=\{styles\.verifyButtonText\}>Verify Setup<\/Text>/);
  assert.match(screenSource, /createButtonAccessibilityLabel\('Verify external agent setup'\)/);
  assert.match(screenSource, /disabled=\{!formData\.connectionCommand\.trim\(\) \|\| isVerifyingCommand \|\| isBuiltInAgent\}/);
  assert.match(screenSource, /Verification passed/);
  assert.match(screenSource, /Verification needs attention/);
  assert.match(screenSource, /minSize:\s*44/);
});

test('shared settings client exposes the agent profile command verification route', () => {
  assert.match(sharedClientSource, /verifyExternalAgentCommand\(data: VerifyExternalAgentCommandRequest\)/);
  assert.match(sharedClientSource, /API_PATHS\.agentProfileVerifyCommand/);
  assert.match(sharedClientSource, /Promise<VerifyExternalAgentCommandResponse>/);
});
