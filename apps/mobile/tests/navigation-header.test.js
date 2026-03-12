const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const appSource = fs.readFileSync(path.join(__dirname, '..', 'App.tsx'), 'utf8');

test('shows the branded header icon only on the root Settings screen', () => {
  assert.match(appSource, /screenOptions=\{\(\{ route \}\) => \(\{/);
  assert.match(appSource, /headerLeft:\s*route\.name === 'Settings'/);
  assert.match(appSource, /route\.name === 'Settings'[\s\S]*: undefined/);
});

test('starts the mobile app on Sessions and opens Settings as a modal', () => {
  assert.match(appSource, /initialRouteName="Sessions"/);
  assert.match(appSource, /name="Settings"[\s\S]*?options=\{\{ title: 'DotAgents', presentation: 'modal' \}\}/);
});