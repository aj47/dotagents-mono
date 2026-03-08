const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const providersSource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'renderer', 'src', 'pages', 'settings-providers.tsx'),
  'utf8'
);

const parakeetSource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'main', 'parakeet-stt.ts'),
  'utf8'
);

const tipcSource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'main', 'tipc.ts'),
  'utf8'
);

test('desktop Parakeet settings explain runtime readiness and preview limitations inline', () => {
  assert.match(providersSource, /runtimeAvailable\?: boolean/);
  assert.match(providersSource, /Local runtime unavailable/);
  assert.match(providersSource, /Downloading the model alone will not make Parakeet usable until the local transcription runtime can load on this device\./);
  assert.match(providersSource, /No live preview during recording/);
  assert.match(providersSource, /Live preview is currently enabled in <a href="\/settings\/general" className="underline">Recording settings<\/a>, but Parakeet still waits until you stop recording before showing text\./);
  assert.match(providersSource, /Parakeet waits until you stop recording before showing text\./);
  assert.match(providersSource, /transcriptionPreviewEnabled=\{configQuery\.data\.transcriptionPreviewEnabled \?\? false\}/);
});

test('main-process Parakeet status now reports runtime availability to settings', () => {
  assert.match(parakeetSource, /runtimeAvailable\?: boolean/);
  assert.match(parakeetSource, /runtimeError\?: string/);
  assert.match(parakeetSource, /export async function getModelStatus\(\): Promise<ModelStatus>/);
  assert.match(parakeetSource, /const runtimeAvailable = await isSherpaAvailable\(\)/);
  assert.match(parakeetSource, /runtimeError: runtimeAvailable[\s\S]*getSherpaLoadError\(\) \|\| "Failed to load the local Parakeet transcription runtime\."/);
  assert.match(tipcSource, /return await parakeetStt\.getModelStatus\(\)/);
});

