const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const editSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'AgentEditScreen.tsx'),
  'utf8'
);
const selectorOptionsSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'ui', 'agentSelectorOptions.ts'),
  'utf8'
);
const apiTypesSource = fs.readFileSync(
  path.join(__dirname, '..', '..', '..', 'packages', 'shared', 'src', 'api-types.ts'),
  'utf8'
);
const remoteServerSource = fs.readFileSync(
  path.join(__dirname, '..', '..', 'desktop', 'src', 'main', 'remote-server.ts'),
  'utf8'
);

test('mobile agent editor can pick and persist avatar data URLs locally', () => {
  assert.match(editSource, /import \* as ImagePicker from 'expo-image-picker'/);
  assert.match(editSource, /avatarDataUrl: string \| null/);
  assert.match(editSource, /ImagePicker\.launchImageLibraryAsync/);
  assert.match(editSource, /base64: true/);
  assert.match(editSource, /buildAgentAvatarDataUrl\(base64, asset\.mimeType\)/);
  assert.match(editSource, /avatarDataUrl: formData\.avatarDataUrl \?\? null/);
  assert.match(editSource, /<Image[\s\S]*?source=\{\{ uri: formData\.avatarDataUrl \}\}/);
});

test('mobile agent avatars flow through the existing remote agent profile API', () => {
  assert.match(apiTypesSource, /avatarDataUrl\?: string \| null/);
  assert.match(remoteServerSource, /avatarDataUrl: p\.avatarDataUrl/);
  assert.match(remoteServerSource, /avatarDataUrl: body\.avatarDataUrl \?\? undefined/);
  assert.match(remoteServerSource, /updates\.avatarDataUrl = body\.avatarDataUrl/);
  assert.match(selectorOptionsSource, /avatarDataUrl: profile\.avatarDataUrl \?\? null/);
});
