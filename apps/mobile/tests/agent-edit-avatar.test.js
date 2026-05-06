const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const editScreenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'AgentEditScreen.tsx'),
  'utf8'
);

const settingsScreenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SettingsScreen.tsx'),
  'utf8'
);

const apiTypesSource = fs.readFileSync(
  path.join(__dirname, '..', '..', '..', 'packages', 'shared', 'src', 'api-types.ts'),
  'utf8'
);

const profileApiSource = fs.readFileSync(
  path.join(__dirname, '..', '..', '..', 'packages', 'shared', 'src', 'profile-api.ts'),
  'utf8'
);

test('mobile agent editor can pick and persist avatar data URLs', () => {
  assert.match(editScreenSource, /import \* as ImagePicker from 'expo-image-picker'/);
  assert.match(editScreenSource, /Image \} from 'react-native'/);
  assert.match(editScreenSource, /avatarDataUrl: string \| null/);
  assert.match(editScreenSource, /avatarDataUrl: profile\.avatarDataUrl \?\? null/);
  assert.match(editScreenSource, /avatarDataUrl: formData\.avatarDataUrl \?\? null/);
  assert.match(editScreenSource, /ImagePicker\.launchImageLibraryAsync\(\{/);
  assert.match(editScreenSource, /mediaTypes: ImagePicker\.MediaTypeOptions\.Images/);
  assert.match(editScreenSource, /allowsEditing: true/);
  assert.match(editScreenSource, /aspect: \[1, 1\]/);
  assert.match(editScreenSource, /base64: true/);
  assert.match(editScreenSource, /`data:\$\{mimeType\};base64,\$\{asset\.base64\}`/);
});

test('mobile agent avatar controls are compact and accessible', () => {
  assert.match(editScreenSource, /<Image\s+source=\{\{ uri: formData\.avatarDataUrl \}\}/);
  assert.match(editScreenSource, /createButtonAccessibilityLabel\('Choose agent photo'\)/);
  assert.match(editScreenSource, /createButtonAccessibilityLabel\('Remove agent photo'\)/);
  assert.match(editScreenSource, /MAX_AGENT_AVATAR_FILE_SIZE_BYTES = 2 \* 1024 \* 1024/);
  assert.match(editScreenSource, /disabled=\{!formData\.avatarDataUrl \|\| isBuiltInAgent\}/);
});

test('mobile agent list renders shared avatar summaries', () => {
  assert.match(settingsScreenSource, /Image \} from 'react-native'/);
  assert.match(settingsScreenSource, /profile\.avatarDataUrl/);
  assert.match(settingsScreenSource, /source=\{\{ uri: profile\.avatarDataUrl \}\}/);
  assert.match(settingsScreenSource, /agentListAvatar/);
});

test('shared agent profile route contract accepts avatar updates', () => {
  assert.match(apiTypesSource, /avatarDataUrl\?: string \| null/);
  assert.match(profileApiSource, /parseOptionalNullableString\(requestBody\.avatarDataUrl, "avatarDataUrl"\)/);
  assert.match(profileApiSource, /request\.avatarDataUrl = avatarDataUrl\.request/);
  assert.match(profileApiSource, /profile\.avatarDataUrl !== undefined \? \{ avatarDataUrl: profile\.avatarDataUrl \} : \{\}/);
});
