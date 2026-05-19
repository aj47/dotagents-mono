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
const apiTypesSource = fs.readFileSync(
  path.join(__dirname, '..', '..', '..', 'packages', 'shared', 'src', 'api-types.ts'),
  'utf8',
);
const remoteServerSource = fs.readFileSync(
  path.join(__dirname, '..', '..', '..', 'apps', 'desktop', 'src', 'main', 'remote-server.ts'),
  'utf8',
);

test('mobile settings restores model preset editor locally', () => {
  assert.match(settingsSource, /showPresetEditor/);
  assert.match(settingsSource, /ModelPresetDraft/);
  assert.match(settingsSource, /buildModelPresetDraftFromSummary/);
  assert.match(settingsSource, /buildModelPresetPayloadFromDraft/);
  assert.match(settingsSource, /New Preset/);
  assert.match(settingsSource, /Create New Preset/);
  assert.match(settingsSource, /Configure Preset/);
  assert.match(settingsSource, /Agent Model/);
  assert.match(settingsSource, /Transcript Model/);
  assert.match(settingsSource, /settingsClient\.createModelPreset/);
  assert.match(settingsSource, /settingsClient\.updateModelPreset/);
  assert.match(settingsSource, /settingsClient\.deleteModelPreset/);
});

test('mobile client and desktop server expose narrow model preset routes', () => {
  assert.match(apiTypesSource, /export interface ModelPresetSummary/);
  assert.match(apiTypesSource, /export interface ModelPresetCreateRequest/);
  assert.match(apiTypesSource, /export interface ModelPresetMutationResponse/);
  assert.match(mobileClientSource, /async getModelPresets\(\)/);
  assert.match(mobileClientSource, /async createModelPreset/);
  assert.match(mobileClientSource, /async updateModelPreset/);
  assert.match(mobileClientSource, /async deleteModelPreset/);
  assert.match(remoteServerSource, /"\/v1\/operator\/model-presets"/);
  assert.match(remoteServerSource, /"\/v1\/operator\/model-presets\/:presetId"/);
  assert.match(remoteServerSource, /getModelPresetActivationUpdates/);
  assert.match(remoteServerSource, /formatModelPresetSummary/);
  assert.doesNotMatch(remoteServerSource, /registerDesktopRemoteServerRoutes/);
});
