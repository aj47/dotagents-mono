const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const modelsSource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'renderer', 'src', 'pages', 'settings-models.tsx'),
  'utf8'
);

const combinedPageSource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'renderer', 'src', 'pages', 'settings-providers-and-models.tsx'),
  'utf8'
);

const providersSource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'renderer', 'src', 'pages', 'settings-providers.tsx'),
  'utf8'
);

test('models route leads with a model configuration guide and quick jumps', () => {
  assert.match(modelsSource, /Model configuration guide/);
  assert.match(modelsSource, /OpenAI presets/);
  assert.match(modelsSource, /Groq models/);
  assert.match(modelsSource, /Gemini models/);
  assert.match(modelsSource, /Dual-model summary/);
  assert.match(modelsSource, /scrollIntoView\(\{ behavior: "smooth", block: "start" \}\)/);
});

test('combined providers and models page only shows the guide on the models route', () => {
  assert.match(combinedPageSource, /const isModelsRoute = location\.pathname === "\/settings\/models"/);
  assert.match(combinedPageSource, /\{isModelsRoute && <ModelsSettings \/>\}/);
  assert.match(combinedPageSource, /<SettingsProvidersContent \/>/);
});

test('provider settings expose section anchors for model quick jumps', () => {
  assert.match(providersSource, /export function SettingsProvidersContent\(/);
  assert.match(providersSource, /id="provider-selection"/);
  assert.match(providersSource, /id="openai-provider-section"/);
  assert.match(providersSource, /id="groq-provider-section"/);
  assert.match(providersSource, /id="gemini-provider-section"/);
  assert.match(providersSource, /id="dual-model-section"/);
});