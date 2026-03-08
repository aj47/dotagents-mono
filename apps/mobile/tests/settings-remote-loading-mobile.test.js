const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const settingsSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SettingsScreen.tsx'),
  'utf8'
);

test('gates desktop settings fetches on an established mobile connection and ignores stale reconnect results', () => {
  assert.match(settingsSource, /const canFetchRemoteSettings = Boolean\(settingsClient\)\s*&& isTunnelConnectionInitialized\s*&& connectionInfo\.state === 'connected';/);
  assert.match(settingsSource, /const canFetchDotAgentsData = canFetchRemoteSettings && isDotAgentsServer;/);
  assert.match(settingsSource, /const remoteSettingsRequestIdRef = useRef\(0\);/);
  assert.match(settingsSource, /const latestCanFetchRemoteSettingsRef = useRef\(canFetchRemoteSettings\);/);
  assert.match(settingsSource, /if \(!latestCanFetchRemoteSettingsRef\.current\) \{\s*return;\s*\}/);
  assert.match(settingsSource, /const requestId = \+\+remoteSettingsRequestIdRef\.current;/);
  assert.match(settingsSource, /if \(requestId !== remoteSettingsRequestIdRef\.current \|\| !latestCanFetchRemoteSettingsRef\.current\) \{\s*return;\s*\}/);
});

test('clears transient remote settings warnings while reconnecting and skips dotagents refetches until connected', () => {
  assert.match(settingsSource, /useEffect\(\(\) => \{\s*if \(canFetchRemoteSettings\) \{\s*return;\s*\}[\s\S]*?setIsLoadingRemote\(false\);\s*setRemoteError\(null\);\s*\}, \[canFetchRemoteSettings\]\);/);
  assert.match(settingsSource, /if \(canFetchRemoteSettings\) \{\s*fetches\.push\(fetchRemoteSettings\(\)\);\s*\}/);
  assert.match(settingsSource, /if \(canFetchDotAgentsData\) \{\s*fetches\.push\(fetchSkills\(\), fetchMemories\(\), fetchAgentProfiles\(\), fetchLoops\(\)\);\s*\}/);
});