const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const settingsSource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'renderer', 'src', 'pages', 'settings-general.tsx'),
  'utf8'
);

const onboardingSource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'renderer', 'src', 'pages', 'onboarding.tsx'),
  'utf8'
);

const sessionsSource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'renderer', 'src', 'pages', 'sessions.tsx'),
  'utf8'
);

const panelSource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'renderer', 'src', 'pages', 'panel.tsx'),
  'utf8'
);

const keyUtilsSource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'shared', 'key-utils.ts'),
  'utf8'
);

test('general settings exposes custom agent mode hold/toggle choices and incomplete-setup guidance', () => {
  assert.match(settingsSource, /const customMcpToolsShortcutMode =\s*configQuery\.data\?\.customMcpToolsShortcutMode \|\| "hold"/);
  assert.match(settingsSource, /Hold \(Press and hold to start agent mode\)/);
  assert.match(settingsSource, /Toggle \(Press once to start, again to send\)/);
  assert.match(settingsSource, /keyboard Agent Mode won't start\. Changes save immediately\./);
  assert.match(settingsSource, /Agent Mode won't start from the keyboard until one is saved\./);
});

test('shared MCP shortcut display reflects custom mode and unset custom shortcuts', () => {
  assert.match(keyUtilsSource, /customMode: "hold" \| "toggle" = "hold"/);
  assert.match(keyUtilsSource, /return customMode === "toggle"\s*\? `Press \$\{formattedShortcut\}`\s*:\s*`Hold \$\{formattedShortcut\}`/);
  assert.match(keyUtilsSource, /return "Set custom shortcut"/);
});

test('onboarding and sessions use the custom agent mode display semantics', () => {
  assert.match(onboardingSource, /const customMcpToolsShortcutMode = config\?\.customMcpToolsShortcutMode \|\| "hold"/);
  assert.match(onboardingSource, /customMcpToolsShortcutMode: value/);
  assert.match(onboardingSource, /<strong>\{agentModeShortcutDisplay\}<\/strong> to speak to your agent from anywhere/);
  assert.match(sessionsSource, /getMcpToolsShortcutDisplay\([\s\S]*configQuery\.data\?\.customMcpToolsShortcutMode/);
});

test('panel release hint respects custom agent mode hold shortcuts', () => {
  assert.match(panelSource, /const mode = config\.customMcpToolsShortcutMode \|\| "hold"/);
  assert.match(panelSource, /if \(mode === "hold"\) \{\s*return "Release keys"/);
});