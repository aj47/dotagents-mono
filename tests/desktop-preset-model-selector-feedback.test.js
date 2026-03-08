const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const selectorSource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'renderer', 'src', 'components', 'preset-model-selector.tsx'),
  'utf8'
);

const queriesSource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'renderer', 'src', 'lib', 'queries.ts'),
  'utf8'
);

test('preset model selector uses shared preset queries and clearer status guidance', () => {
  assert.match(selectorSource, /usePresetAvailableModelsQuery\(\s*presetId,\s*baseUrl,\s*apiKey,\s*hasCredentials,\s*\)/);
  assert.match(selectorSource, /usePresetModelInfoQuery\(\s*models\.map\(\(model\) => model\.id\),\s*models\.length > 0,\s*\)/);
  assert.match(selectorSource, /const refreshError = !!errorMessage && models\.length > 0/);
  assert.match(selectorSource, /Couldn't refresh models\. Showing the last successful model list\./);
  assert.match(selectorSource, /Couldn't load models for this preset\. Check the base URL and API key, then retry\./);
  assert.match(selectorSource, /No models were returned for this preset\. Verify the endpoint supports model discovery, then refresh\./);
  assert.match(selectorSource, /return `\$\{models\.length\} model\$\{models\.length !== 1 \? "s" : ""\} available for this preset`/);
  assert.match(selectorSource, /aria-label="Refresh available models"/);
});

test('preset model queries fingerprint credentials and cache model fetches and enrichment', () => {
  assert.match(queriesSource, /function getQueryFingerprint\(\.\.\.parts: string\[\]\)/);
  assert.match(queriesSource, /queryKey:\s*\[\s*"preset-available-models",\s*presetId,\s*getQueryFingerprint\(baseUrl, apiKey\),\s*\]/);
  assert.match(queriesSource, /return tipcClient\.fetchModelsForPreset\(\{ baseUrl, apiKey \}\)/);
  assert.match(queriesSource, /staleTime:\s*5 \* 60 \* 1000/);
  assert.match(queriesSource, /export const usePresetModelInfoQuery = \(/);
  assert.match(queriesSource, /queryKey: \["preset-model-info", modelIds\]/);
  assert.match(queriesSource, /const info = await tipcClient\.getModelInfo\(\{ modelId \}\)/);
  assert.match(queriesSource, /staleTime:\s*30 \* 60 \* 1000/);
});