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

test('mobile settings restores bundle import export without shared app shell UI', () => {
  assert.match(settingsSource, /const \[isExportingBundle, setIsExportingBundle\]/);
  assert.match(settingsSource, /const \[showBundleImportModal, setShowBundleImportModal\]/);
  assert.match(settingsSource, /settingsClient\.exportBundle\(\{ name: 'DotAgents Bundle' \}\)/);
  assert.match(settingsSource, /settingsClient\.previewBundleImport\(\{ bundleJson: bundleImportJsonText\.trim\(\) \}\)/);
  assert.match(settingsSource, /settingsClient\.importBundle\(\{/);
  assert.match(settingsSource, /BUNDLE_IMPORT_COMPONENT_OPTIONS/);
  assert.match(settingsSource, /BUNDLE_IMPORT_CONFLICT_STRATEGIES/);
  assert.doesNotMatch(settingsSource, /@dotagents\/shared\/app-shell/);
  assert.doesNotMatch(settingsSource, /@dotagents\/shared\/bundle-api/);
});

test('mobile settings restores repeat task Markdown import export locally', () => {
  assert.match(settingsSource, /const \[showLoopImportModal, setShowLoopImportModal\]/);
  assert.match(settingsSource, /const \[loopImportMarkdownText, setLoopImportMarkdownText\]/);
  assert.match(settingsSource, /settingsClient\.importLoopFromMarkdown\(loopImportMarkdownText\.trim\(\)\)/);
  assert.match(settingsSource, /settingsClient\.exportLoopToMarkdown\(loop\.id\)/);
  assert.match(settingsSource, /Import loop Markdown/);
  assert.match(settingsSource, /Export \$\{loop\.name\} loop as Markdown/);
});

test('mobile client and desktop remote server expose narrow bundle and loop routes', () => {
  assert.match(mobileClientSource, /async exportBundle\(/);
  assert.match(mobileClientSource, /async previewBundleImport\(/);
  assert.match(mobileClientSource, /async importBundle\(/);
  assert.match(mobileClientSource, /async importLoopFromMarkdown\(content: string\)/);
  assert.match(mobileClientSource, /async exportLoopToMarkdown\(id: string\)/);
  assert.match(remoteServerSource, /"\/v1\/bundles\/export"/);
  assert.match(remoteServerSource, /"\/v1\/bundles\/import\/preview"/);
  assert.match(remoteServerSource, /"\/v1\/bundles\/import"/);
  assert.match(remoteServerSource, /"\/v1\/loops\/import\/markdown"/);
  assert.match(remoteServerSource, /"\/v1\/loops\/:id\/export\/markdown"/);
  assert.match(remoteServerSource, /parseTaskMarkdown\(content/);
  assert.match(remoteServerSource, /stringifyTaskMarkdown\(loop\)/);
  assert.doesNotMatch(remoteServerSource, /registerMobileApiRoutes/);
});
