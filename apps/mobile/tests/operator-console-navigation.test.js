const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const appSource = fs.readFileSync(path.join(__dirname, '..', 'App.tsx'), 'utf8');
const settingsSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SettingsScreen.tsx'),
  'utf8'
);
const operationsSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'OperationsScreen.tsx'),
  'utf8'
);

test('wires the operations screen into mobile navigation', () => {
  assert.match(appSource, /import OperationsScreen from '\.\/src\/screens\/OperationsScreen';/);
  assert.match(appSource, /name="Operations"[\s\S]*?component=\{OperationsScreen\}[\s\S]*?title: APP_SHELL_MOBILE_ROUTE_TITLES\.Operations/);
});

test('adds an operator console entry from the settings screen', () => {
  assert.match(settingsSource, /Operator Console/);
  assert.match(settingsSource, /safe restart actions for the connected desktop\./);
  assert.match(settingsSource, /navigation\.navigate\('Operations'\)/);
});

test('keeps the operator console focused on refresh plus safe operator actions', () => {
  assert.match(operationsSource, /OPERATOR_ACTIONS_PANEL_METADATA\.refreshButton\.buttonLabel/);
  assert.match(operationsSource, /OPERATOR_ACTIONS_PANEL_METADATA\.restartRemoteServerAction\.buttonLabel/);
  assert.match(operationsSource, /OPERATOR_ACTIONS_PANEL_METADATA\.restartAppAction\.buttonLabel/);
  assert.match(operationsSource, /OPERATOR_ACTIONS_PANEL_METADATA\.emergencyStopAction\.buttonLabel/);
});
