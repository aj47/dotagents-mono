const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const settingsSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SettingsScreen.tsx'),
  'utf8'
);

test('surfaces mobile model-list load failures instead of collapsing them into stale or empty states', () => {
  assert.match(settingsSource, /const \[modelsLoadError, setModelsLoadError\] = useState<string \| null>\(null\);/);
  assert.match(settingsSource, /setIsLoadingModels\(true\);[\s\S]*?setModelsLoadError\(null\);/);
  assert.match(settingsSource, /catch \(error: any\) \{[\s\S]*?setModelsLoadError\(getSectionLoadErrorMessage\('models', error\)\);/);
  assert.match(settingsSource, /!useCustomModel && modelsLoadError/);
  assert.match(settingsSource, /modelsLoadError && availableModels\.length === 0/);
  assert.match(settingsSource, /modelsLoadError && availableModels\.length > 0/);
});

test('clears stale model options before provider or preset changes fetch their replacement list', () => {
  assert.match(
    settingsSource,
    /await settingsClient\.updateSettings\(\{ mcpToolsProviderId: provider \}\);[\s\S]*?setAvailableModels\(\[\]\);[\s\S]*?setModelsLoadError\(null\);[\s\S]*?setRemoteSettings/
  );
  assert.match(
    settingsSource,
    /await settingsClient\.updateSettings\(\{ currentModelPresetId: presetId \}\);[\s\S]*?setRemoteSettings[\s\S]*?setAvailableModels\(\[\]\);[\s\S]*?setModelsLoadError\(null\);[\s\S]*?fetchModels\('openai'\);/
  );
});