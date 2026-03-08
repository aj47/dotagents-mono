const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const settingsSource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'renderer', 'src', 'pages', 'settings-remote-server.tsx'),
  'utf8'
);

const tipcSource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'main', 'tipc.ts'),
  'utf8'
);

test('remote server settings expose inline recovery when startup fails', () => {
  assert.match(settingsSource, /const restartRemoteServerMutation = useMutation\(/);
  assert.match(settingsSource, /mutationFn: \(\) => tipcClient\.restartRemoteServer\(\)/);
  assert.match(settingsSource, /const remoteServerLastError = enabled && !isRemoteServerRunning \? remoteServerStatus\?\.lastError\?\.trim\(\) : undefined/);
  assert.match(settingsSource, /Couldn&apos;t start the remote server:/);
  assert.match(settingsSource, /Retry start/);
  assert.match(settingsSource, /Start now/);
  assert.match(settingsSource, /The remote server should start automatically after enabling it or changing server settings\./);
});

test('remote server share URL only appears when the server is actually running', () => {
  assert.match(settingsSource, /const baseUrl = isRemoteServerRunning \? liveConnectableUrl \?\? fallbackBaseUrl : undefined/);
});

test('renderer can trigger a direct remote server restart through TIPC', () => {
  assert.match(tipcSource, /restartRemoteServer: t\.procedure\.action\(async \(\) => \{/);
  assert.match(tipcSource, /return restartRemoteServer\(\)/);
});