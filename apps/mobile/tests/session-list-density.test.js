const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const screenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SessionListScreen.tsx'),
  'utf8'
);

test('avoids redundant desktop emoji chrome in stub session rows', () => {
  assert.doesNotMatch(screenSource, /💻/);
  assert.match(screenSource, /\{isStub \? ' · from desktop' : ''\}/);
});

test('keeps the session title row shrinkable for narrow mobile widths', () => {
  assert.match(screenSource, /sessionTitleRow:\s*\{[\s\S]*?flex:\s*1,[\s\S]*?minWidth:\s*0,[\s\S]*?marginRight:\s*8,/);
  assert.match(screenSource, /sessionTitle:\s*\{[\s\S]*?flex:\s*1,[\s\S]*?minWidth:\s*0,/);
});

test('lets the chats header agent sheet deep-link directly to connection settings when switching is blocked', () => {
  assert.match(screenSource, /<AgentSelectorSheet[\s\S]*?visible=\{agentSelectorVisible\}[\s\S]*?onOpenConnectionSettings=\{\(\) => navigation\.navigate\('ConnectionSettings'\)\}/);
});