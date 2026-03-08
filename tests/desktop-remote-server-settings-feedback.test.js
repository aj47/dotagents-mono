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

test('remote server editable fields keep local drafts and save from the latest config snapshot', () => {
  assert.match(settingsSource, /const REMOTE_SERVER_INPUT_SAVE_DEBOUNCE_MS = 400/);
  assert.match(settingsSource, /const configRef = useRef<Config \| undefined>\(configQuery\.data as Config \| undefined\)/);
  assert.match(settingsSource, /const \[remoteServerTextDrafts, setRemoteServerTextDrafts\] = useState/);
  assert.match(settingsSource, /const \[remoteServerPortDraft, setRemoteServerPortDraft\] = useState/);
  assert.match(settingsSource, /saveConfigMutation\.mutate\(\{ config: \{ \.{3}currentConfig, \.{3}partial \} \}\)/);
  assert.match(settingsSource, /Port, CORS, and named tunnel fields save automatically after a short pause\. Your draft stays visible if saving fails\./);
  assert.match(settingsSource, /scheduleRemoteServerPortSave\(nextDraft\)/);
  assert.match(settingsSource, /scheduleRemoteServerTextSave\("remoteServerCorsOrigins", nextDraft\)/);
  assert.match(settingsSource, /scheduleRemoteServerTextSave\("cloudflareTunnelId", nextDraft\)/);
  assert.match(settingsSource, /scheduleRemoteServerTextSave\("cloudflareTunnelHostname", nextDraft\)/);
  assert.match(settingsSource, /scheduleRemoteServerTextSave\("cloudflareTunnelCredentialsPath", nextDraft\)/);
  assert.match(settingsSource, /startNamedTunnelMutation\.mutate\(\{[\s\S]*tunnelId: trimmedTunnelIdDraft,[\s\S]*hostname: trimmedTunnelHostnameDraft,[\s\S]*credentialsPath: trimmedTunnelCredentialsPathDraft \|\| undefined,/);
});

test('renderer can trigger a direct remote server restart through TIPC', () => {
  assert.match(tipcSource, /restartRemoteServer: t\.procedure\.action\(async \(\) => \{/);
  assert.match(tipcSource, /return restartRemoteServer\(\)/);
});