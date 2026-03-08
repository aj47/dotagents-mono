const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const providersSource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'renderer', 'src', 'pages', 'settings-providers.tsx'),
  'utf8'
);

const kittenSource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'main', 'kitten-tts.ts'),
  'utf8'
);

const supertonicSource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'main', 'supertonic-tts.ts'),
  'utf8'
);

const tipcSource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'main', 'tipc.ts'),
  'utf8'
);

test('desktop local TTS settings explain runtime readiness and disable unusable voice tests', () => {
  assert.match(providersSource, /type LocalTtsModelStatus = \{/);
  assert.match(providersSource, /<LocalTtsRuntimeWarning providerName="Kitten" status=\{status\} \/>/);
  assert.match(providersSource, /<LocalTtsRuntimeWarning providerName="Supertonic" status=\{status\} \/>/);
  assert.match(providersSource, /The model files are on this device, but the \$\{providerName\} speech runtime could not load, so local speech output would still fail until that is fixed\./);
  assert.match(providersSource, /Downloading the model alone will not make \$\{providerName\} usable until the local speech runtime can load on this device\./);
  assert.match(providersSource, /Fix the local runtime issue shown above before testing Kitten audio\./);
  assert.match(providersSource, /Fix the local runtime issue shown above before testing Supertonic audio\./);
  const disabledVoiceTests = [
    ...(providersSource.match(/disabled=\{runtimeUnavailable\}/g) || []),
    ...(providersSource.match(/disabled=\{runtimeUnavailable \|\| isTestingVoice\}/g) || []),
  ];
  assert.ok(disabledVoiceTests.length >= 2);
});

test('desktop local TTS settings keep download and test failures recoverable inline', () => {
  assert.match(providersSource, /function getActionErrorMessage\(error: unknown, fallbackMessage: string\)/);
  assert.match(providersSource, /function LocalTtsActionError\(/);
  assert.match(providersSource, /async function playBase64WavAudio\(audioBase64: string\)/);
  assert.match(providersSource, /Retry download/);
  assert.match(providersSource, /Retry test/);
  assert.match(providersSource, /The model is still unavailable, so you can retry here after fixing the issue\./);
  assert.match(providersSource, /Your selected voice settings are unchanged, so you can retry here after fixing the issue\./);
  assert.match(providersSource, /Testing\.\.\./);
  assert.ok((providersSource.match(/disabled=\{runtimeUnavailable \|\| isTestingVoice\}/g) || []).length >= 2);
  assert.ok((providersSource.match(/await playBase64WavAudio\(result\.audio\)/g) || []).length >= 2);
});

test('main-process local TTS status now reports runtime availability to settings', () => {
  assert.match(kittenSource, /runtimeAvailable\?: boolean/);
  assert.match(kittenSource, /runtimeError\?: string/);
  assert.match(kittenSource, /async function isSherpaAvailable\(\): Promise<boolean>/);
  assert.match(kittenSource, /export async function getKittenModelStatus\(\): Promise<KittenModelStatus>/);
  assert.match(kittenSource, /const runtimeAvailable = await isSherpaAvailable\(\)/);
  assert.match(kittenSource, /runtimeError: runtimeAvailable[\s\S]*sherpaLoadError \|\| "Failed to load the local Kitten speech runtime\."/);

  assert.match(supertonicSource, /runtimeAvailable\?: boolean/);
  assert.match(supertonicSource, /runtimeError\?: string/);
  assert.match(supertonicSource, /async function isOrtAvailable\(\): Promise<boolean>/);
  assert.match(supertonicSource, /export async function getSupertonicModelStatus\(\): Promise<SupertonicModelStatus>/);
  assert.match(supertonicSource, /const runtimeAvailable = await isOrtAvailable\(\)/);
  assert.match(supertonicSource, /runtimeError: runtimeAvailable[\s\S]*ortLoadError \|\| "Failed to load the local Supertonic speech runtime\."/);

  assert.match(tipcSource, /return await getKittenModelStatus\(\)/);
  assert.match(tipcSource, /return await getSupertonicModelStatus\(\)/);
});