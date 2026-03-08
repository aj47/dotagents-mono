const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const selectorSource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'renderer', 'src', 'components', 'model-selector.tsx'),
  'utf8'
);

const queriesSource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'renderer', 'src', 'lib', 'queries.ts'),
  'utf8'
);

const modelsServiceSource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'main', 'models-service.ts'),
  'utf8'
);

const remoteServerSource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'main', 'remote-server.ts'),
  'utf8'
);

test('models discovery exposes provider vs fallback provenance', () => {
  assert.match(modelsServiceSource, /export interface AvailableModelsResult/);
  assert.match(modelsServiceSource, /source: "provider"/);
  assert.match(modelsServiceSource, /source: "fallback"/);
  assert.match(modelsServiceSource, /const fallbackReason =[\s\S]*"missing_api_key"[\s\S]*"provider_error"/);
  assert.match(remoteServerSource, /source: modelsResult\.source/);
  assert.match(remoteServerSource, /fallbackReason: modelsResult\.fallbackReason/);
  assert.match(queriesSource, /useQuery<AvailableModelsQueryResult>\(/);
  assert.match(queriesSource, /const AVAILABLE_MODEL_DISCOVERY_CONFIG_KEYS =/);
  assert.match(queriesSource, /groqApiKey/);
  assert.match(queriesSource, /geminiBaseUrl/);
  assert.match(queriesSource, /getProvidersWithUpdatedModelDiscoveryConfig/);
  assert.match(queriesSource, /queryClient\.invalidateQueries\(\{[\s\S]*queryKey: \["available-models", providerId\]/);
});

test('model selector labels fallback suggestions and manual-entry guidance', () => {
  assert.match(selectorSource, /Fallback suggestions/);
  assert.match(selectorSource, /Select a fallback model/);
  assert.match(selectorSource, /API key is missing, so this list is showing fallback suggestions/);
  assert.match(selectorSource, /Showing fallback suggestions instead; refresh after fixing credentials, or switch to a custom model name\./);
  assert.match(selectorSource, /Enter the exact \$\{providerName\} model ID from your provider\. The discovered list is currently using fallback suggestions\./);
  assert.match(selectorSource, /verified \$\{providerName\} model\$\{allModels\.length !== 1 \? "s" : ""\} available/);
  assert.match(selectorSource, /Refreshing \$\{providerName\} model suggestions\. You can keep using the current list while the update finishes\./);
  assert.match(selectorSource, /Couldn't refresh \$\{providerName\} model suggestions, so you're still seeing the last loaded results\. If you just changed credentials, this list may be out of date until refresh succeeds\./);
  assert.match(selectorSource, /Showing the last loaded results until refresh succeeds\./);
  assert.match(selectorSource, /disabled=\{disabled \|\| isInitialLoading \|\| allModels\.length === 0\}/);
  assert.match(selectorSource, /aria-label=\{useCustomInput \? "Switch to model list" : "Use custom model name"\}/);
  assert.match(selectorSource, /aria-label="Refresh available models"/);
});