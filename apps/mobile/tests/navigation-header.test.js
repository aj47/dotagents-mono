const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const appSource = fs.readFileSync(path.join(__dirname, '..', 'App.tsx'), 'utf8');

test('keeps the settings modal dismissible even with custom header content', () => {
  assert.match(appSource, /screenOptions=\{\(\{ route \}\) => \(\{/);
  assert.doesNotMatch(appSource, /headerLeft:\s*route\.name === 'Settings'/);
  assert.match(appSource, /name="Settings"[\s\S]*?options=\{\(\{ navigation \}\) => \(\{/);
  assert.match(appSource, /accessibilityLabel="Close settings"/);
});

test('starts the mobile app on Sessions and opens Settings as a modal', () => {
  assert.match(appSource, /initialRouteName="Sessions"/);
  assert.match(appSource, /name="Settings"[\s\S]*?presentation: 'modal'/);
});