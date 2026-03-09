const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const appSource = fs.readFileSync(path.join(__dirname, '..', 'App.tsx'), 'utf8');

test('shows the branded header icon only on the root Settings screen', () => {
  assert.match(appSource, /screenOptions=\{\(\{ route, navigation \}\) => \(\{/);
  assert.match(appSource, /headerLeft:\s*route\.name === 'Settings'/);
  assert.match(appSource, /route\.name === 'Settings'[\s\S]*?<Image/);
});

test('gives nested screens a 44px custom back button hit target', () => {
  assert.match(appSource, /screenOptions=\{\(\{ route, navigation \}\) => \(\{/);
  assert.match(appSource, /route\.name === 'Settings'[\s\S]*?: \(\{ tintColor \}\) => navigation\.canGoBack\(\)/);
  assert.match(appSource, /accessibilityLabel=\{createButtonAccessibilityLabel\('Go back'\)\}/);
  assert.match(appSource, /headerBackButton:\s*\{[\s\S]*?createMinimumTouchTargetStyle\(\{ minSize: 44, horizontalPadding: 10, verticalPadding: 10 \}\)/);
  assert.match(appSource, /<Text[\s\S]*?styles\.headerBackButtonText[\s\S]*?>[\s\S]*?‹[\s\S]*?<\/Text>/);
});