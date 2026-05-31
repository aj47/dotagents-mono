const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const operationsSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'OperationsScreen.tsx'),
  'utf8',
);
const settingsClientSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'lib', 'settingsApi.ts'),
  'utf8',
);
const remoteServerSource = fs.readFileSync(
  path.join(__dirname, '..', '..', '..', 'apps', 'desktop', 'src', 'main', 'remote-server.ts'),
  'utf8',
);

test('mobile operations restores desktop session and window controls locally', () => {
  assert.match(operationsSource, /Hide active sessions/);
  assert.match(operationsSource, /settingsClient\.showOperatorAgentSession\(s\.id\)/);
  assert.match(operationsSource, /settingsClient\.snoozeOperatorAgentSession\(s\.id\)/);
  assert.match(operationsSource, /settingsClient\.unsnoozeOperatorAgentSession\(s\.id\)/);
  assert.match(operationsSource, /settingsClient\.clearInactiveOperatorAgentSessions\(\)/);
  assert.match(operationsSource, /settingsClient\.stopOperatorTtsPlayback\(\)/);
  assert.match(operationsSource, /settingsClient\.showOperatorMainWindow\('\/'\)/);
  assert.match(operationsSource, /settingsClient\.showOperatorPanelWindow\(\)/);
  assert.match(operationsSource, /settingsClient\.hideOperatorPanelWindow\(\)/);
  assert.match(operationsSource, /settingsClient\.resetOperatorPanelWindow\(\)/);
});

test('mobile operations restores desktop shell and panel settings locally', () => {
  assert.match(operationsSource, /Desktop app/);
  assert.match(operationsSource, /Launch at Login/);
  assert.match(operationsSource, /Hide Dock Icon/);
  assert.match(operationsSource, /Desktop Theme/);
  assert.match(operationsSource, /Floating panel/);
  assert.match(operationsSource, /Panel Position/);
  assert.match(operationsSource, /Draggable Panel/);
  assert.match(operationsSource, /Panel Auto-Show/);
  assert.match(operationsSource, /Hide Panel with Main/);
  assert.match(operationsSource, /Auto-Paste Response/);
  assert.match(operationsSource, /Auto-Paste Delay/);
  assert.match(operationsSource, /handleAutoPasteDelaySave/);
});

test('mobile operations restores diagnostics and error clearing', () => {
  assert.match(operationsSource, /getOperatorDiagnosticReport/);
  assert.match(operationsSource, /saveOperatorDiagnosticReport/);
  assert.match(operationsSource, /clearOperatorErrors/);
  assert.match(operationsSource, /Diagnostic report/);
  assert.match(operationsSource, /Clear errors/);
});

test('settings client and desktop server expose narrow local operator routes', () => {
  assert.match(settingsClientSource, /async stopOperatorTtsPlayback\(\)/);
  assert.match(settingsClientSource, /async showOperatorMainWindow/);
  assert.match(settingsClientSource, /async clearInactiveOperatorAgentSessions\(\)/);
  assert.match(settingsClientSource, /async stopOperatorAgentSession\(sessionId: string\)/);
  assert.match(settingsClientSource, /async snoozeOperatorAgentSessionsAndHidePanel/);
  assert.match(settingsClientSource, /async getOperatorDiagnosticReport\(\)/);
  assert.match(remoteServerSource, /"\/v1\/operator\/actions\/stop-tts"/);
  assert.match(remoteServerSource, /"\/v1\/operator\/windows\/main\/show"/);
  assert.match(remoteServerSource, /"\/v1\/operator\/sessions\/:sessionId\/show"/);
  assert.match(remoteServerSource, /"\/v1\/operator\/sessions\/:sessionId\/stop"/);
  assert.match(remoteServerSource, /"\/v1\/operator\/sessions\/clear-inactive"/);
  assert.match(remoteServerSource, /"\/v1\/operator\/diagnostics\/report"/);
  assert.doesNotMatch(remoteServerSource, /registerDesktopRemoteServerRoutes/);
});
