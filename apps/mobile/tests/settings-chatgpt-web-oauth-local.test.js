const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const settingsSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SettingsScreen.tsx'),
  'utf8',
);
const mobileClientSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'lib', 'settingsApi.ts'),
  'utf8',
);
const remoteServerSource = fs.readFileSync(
  path.join(__dirname, '..', '..', '..', 'apps', 'desktop', 'src', 'main', 'remote-server.ts'),
  'utf8',
);

test('mobile settings restores OpenAI Codex OAuth controls locally', () => {
  assert.match(settingsSource, /const \[chatGptWebAuthStatus, setChatGptWebAuthStatus\]/);
  assert.match(settingsSource, /refreshChatGptWebAuthStatus/);
  assert.match(settingsSource, /handleChatGptWebOAuthLogin/);
  assert.match(settingsSource, /handleChatGptWebOAuthLogout/);
  assert.match(settingsSource, /OpenAI Codex OAuth/);
  assert.match(settingsSource, /Callback URL:/);
  assert.match(settingsSource, /Connect OpenAI Codex OAuth/);
  assert.match(settingsSource, /Disconnect OpenAI Codex OAuth/);
  assert.doesNotMatch(settingsSource, /@dotagents\/shared\/app-shell/);
});

test('mobile client and desktop remote server expose narrow ChatGPT Web OAuth routes', () => {
  assert.match(mobileClientSource, /async getChatGptWebAuthStatus\(\)/);
  assert.match(mobileClientSource, /async loginChatGptWebOAuth\(\)/);
  assert.match(mobileClientSource, /async logoutChatGptWebOAuth\(\)/);
  assert.match(remoteServerSource, /"\/v1\/operator\/providers\/chatgpt-web\/auth"/);
  assert.match(remoteServerSource, /"\/v1\/operator\/providers\/chatgpt-web\/auth\/login"/);
  assert.match(remoteServerSource, /"\/v1\/operator\/providers\/chatgpt-web\/auth\/logout"/);
  assert.match(remoteServerSource, /loginChatGptWebOAuth/);
  assert.match(remoteServerSource, /logoutChatGptWebOAuth/);
});
