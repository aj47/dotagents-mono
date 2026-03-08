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
});

test('model selector labels fallback suggestions and manual-entry guidance', () => {
  assert.match(selectorSource, /Fallback suggestions/);
  assert.match(selectorSource, /Select a fallback model/);
  assert.match(selectorSource, /API key is missing, so this list is showing fallback suggestions/);
  assert.match(selectorSource, /Showing fallback suggestions instead; refresh after fixing credentials, or switch to a custom model name\./);
  assert.match(selectorSource, /Enter the exact \$\{providerName\} model ID from your provider\. The discovered list is currently using fallback suggestions\./);
  assert.match(selectorSource, /verified \$\{providerName\} model\$\{allModels\.length !== 1 \? "s" : ""\} available/);
  assert.match(selectorSource, /aria-label=\{useCustomInput \? "Switch to model list" : "Use custom model name"\}/);
  assert.match(selectorSource, /aria-label="Refresh available models"/);
});