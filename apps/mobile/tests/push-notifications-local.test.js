const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const appSource = fs.readFileSync(path.join(__dirname, '..', 'App.tsx'), 'utf8');
const pushSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'lib', 'pushNotifications.ts'),
  'utf8'
);

test('registers push tokens with the stable mobile device ID', () => {
  assert.match(pushSource, /import \{ getDeviceIdentity \} from '\.\/deviceIdentity';/);
  assert.match(pushSource, /const identity = await getDeviceIdentity\(\);/);
  assert.match(pushSource, /deviceId: identity\.deviceId,/);
});

test('notification taps sync from desktop before giving up on a conversation link', () => {
  assert.match(appSource, /const syncSessionsForNotificationTap = useCallback\(async \(\) => \{/);
  assert.match(appSource, /await sessionStore\.syncWithServer\(client\);/);
  assert.match(appSource, /result\.errors\.includes\('Sync already in progress'\)/);
  assert.match(appSource, /targetSessionId = findTargetSessionId\(\);/);
  assert.match(appSource, /navigationRef\.navigate\('Chat' as never\);/);
});

test('existing push registrations refresh when the paired desktop connection changes', () => {
  assert.match(appSource, /Keep the desktop-side token registration fresh/);
  assert.match(appSource, /pushNotifications\.isRegistered/);
  assert.match(appSource, /pushNotifications\.register\(cfg\.config\.baseUrl, cfg\.config\.apiKey\)/);
});
