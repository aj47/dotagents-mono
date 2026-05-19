const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const screenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'LoopEditScreen.tsx'),
  'utf8'
);

const mobileClientSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'lib', 'settingsApi.ts'),
  'utf8'
);

const apiTypesSource = fs.readFileSync(
  path.join(__dirname, '..', '..', '..', 'packages', 'shared', 'src', 'api-types.ts'),
  'utf8'
);

const remoteServerSource = fs.readFileSync(
  path.join(__dirname, '..', '..', '..', 'apps', 'desktop', 'src', 'main', 'remote-server.ts'),
  'utf8'
);

test('mobile loop editor restores desktop repeat-task execution options without shared app-shell UI', () => {
  assert.match(screenSource, /runOnStartup: !!loop\.runOnStartup/);
  assert.match(screenSource, /speakOnTrigger: !!loop\.speakOnTrigger/);
  assert.match(screenSource, /continueInSession: !!loop\.continueInSession/);
  assert.match(screenSource, /lastSessionId: loop\.lastSessionId \|\| ''/);
  assert.match(screenSource, /maxIterations: loop\.maxIterations \? String\(loop\.maxIterations\) : ''/);
  assert.match(screenSource, /Run on startup/);
  assert.match(screenSource, /Speak on trigger/);
  assert.match(screenSource, /Continue in session/);
  assert.match(screenSource, /Max iterations/);
  assert.match(screenSource, /runOnStartup: formData\.runOnStartup/);
  assert.match(screenSource, /speakOnTrigger: formData\.speakOnTrigger/);
  assert.match(screenSource, /continueInSession: formData\.continueInSession/);
  assert.match(screenSource, /lastSessionId: formData\.continueInSession \? \(formData\.lastSessionId\.trim\(\) \|\| null\) : null/);
  assert.match(screenSource, /maxIterations,/);
  assert.doesNotMatch(screenSource, /@dotagents\/shared\/app-shell/);
  assert.doesNotMatch(screenSource, /@dotagents\/shared\/repeat-task-utils/);
});

test('continue-in-session picker uses a small local session-candidates API surface', () => {
  assert.match(screenSource, /settingsClient\.getAgentSessionCandidates\(20\)/);
  assert.match(screenSource, /buildSessionCandidateOptions\(sessionCandidates, formData\.lastSessionId\)/);
  assert.match(screenSource, /Continue from session/);
  assert.match(screenSource, /formatSessionCandidateTitle\(candidate\)/);
  assert.match(apiTypesSource, /export interface AgentSessionCandidate/);
  assert.match(apiTypesSource, /export interface AgentSessionCandidatesResponse/);
  assert.match(mobileClientSource, /async getAgentSessionCandidates\(limit\?: number\)/);
  assert.match(remoteServerSource, /fastify\.get\("\/v1\/agent-sessions\/candidates"/);
  assert.match(remoteServerSource, /agentSessionTracker\.getActiveSessions\(\)\.map\(formatAgentSessionCandidate\)/);
  assert.match(remoteServerSource, /agentSessionTracker\.getRecentSessions\(limit\)\.map\(formatAgentSessionCandidate\)/);
});

test('loop API persists the restored execution fields', () => {
  assert.match(apiTypesSource, /maxIterations\?: number;/);
  assert.match(mobileClientSource, /runOnStartup\?: boolean;/);
  assert.match(mobileClientSource, /speakOnTrigger\?: boolean;/);
  assert.match(mobileClientSource, /continueInSession\?: boolean;/);
  assert.match(mobileClientSource, /lastSessionId\?: string \| null;/);
  assert.match(mobileClientSource, /maxIterations\?: number \| null;/);
  assert.match(remoteServerSource, /runOnStartup: loop\.runOnStartup/);
  assert.match(remoteServerSource, /speakOnTrigger: loop\.speakOnTrigger/);
  assert.match(remoteServerSource, /continueInSession: loop\.continueInSession/);
  assert.match(remoteServerSource, /lastSessionId: loop\.lastSessionId/);
  assert.match(remoteServerSource, /maxIterations: loop\.maxIterations/);
  assert.match(remoteServerSource, /parseLoopMaxIterationsInput/);
});
