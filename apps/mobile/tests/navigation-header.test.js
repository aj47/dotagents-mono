const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const appSource = fs.readFileSync(path.join(__dirname, '..', 'App.tsx'), 'utf8');

test('shows the branded header icon only on the root Settings screen', () => {
  assert.match(appSource, /screenOptions=\{\(\{ route, navigation \}\) => \(\{/);
  assert.match(appSource, /headerLeft:\s*route\.name === 'Settings'/);
  assert.match(appSource, /route\.name === 'Settings'[\s\S]*: \(\) => \(/);
});

test('uses a custom 44px back button for nested mobile screens', () => {
  assert.match(appSource, /screenOptions=\{\(\{ route, navigation \}\) => \(\{/);
  assert.match(appSource, /accessibilityLabel=\{createButtonAccessibilityLabel\('Go back'\)\}/);
  assert.match(appSource, /style=\{navigationStyles\.backButton\}/);
  assert.match(appSource, /createMinimumTouchTargetStyle\(\{ horizontalPadding: 12, horizontalMargin: 0 \}\)/);
  assert.match(appSource, /<Text style=\{navigationStyles\.backButtonText\}>←<\/Text>/);
});