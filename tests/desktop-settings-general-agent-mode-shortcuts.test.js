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

test('general settings explains ACP main-agent setup gaps and offers recovery actions', () => {
  assert.match(settingsSource, /const hasSelectableMainAcpAgents = selectableMainAcpAgents\.length > 0/);
  assert.match(settingsSource, /disabled=\{!hasSelectableMainAcpAgents\}/);
  assert.match(settingsSource, /placeholder=\{hasSelectableMainAcpAgents \? "Select an agent\.\.\." : "No ACP agents available"\}/);
  assert.match(settingsSource, /No ACP agent is ready to use yet/);
  assert.match(settingsSource, /ACP mode needs at least one enabled ACP or stdio agent\./);
  assert.match(settingsSource, /Choose which enabled ACP agent should handle chat submissions before using ACP mode\./);
  assert.match(settingsSource, /Selected ACP agent unavailable/);
  assert.match(settingsSource, /Open Agents Settings/);
  assert.match(settingsSource, /Use API Mode/);
  assert.match(settingsSource, /navigate\("\/settings\/agents"\)/);
});

test('general settings clarifies active modular config layer and related skills\/memories folders', () => {
  assert.match(settingsSource, /function getWorkspaceAgentsSourceLabel\(source: "env" \| "upward" \| null \| undefined\): string \| null/);
  assert.match(settingsSource, /via DOTAGENTS_WORKSPACE_DIR/);
  assert.match(settingsSource, /found upward from the current workspace/);
  assert.match(settingsSource, /label="Active prompt layer"/);
  assert.match(settingsSource, /Main-agent system prompt and guidelines are read from this layer\./);
  assert.match(settingsSource, /Reveal actions below target this layer\./);
  assert.match(settingsSource, /label="Skills folders"/);
  assert.match(settingsSource, /label="Memories folders"/);
  assert.match(settingsSource, /Reveal active prompt files/);
  assert.match(settingsSource, /Reveal Active System Prompt/);
  assert.match(settingsSource, /Reveal Active Guidelines/);
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