const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'renderer', 'src', 'pages', 'settings-providers.tsx'),
  'utf8'
);

test('provider credential inputs explain autosave and retry states inline', () => {
  assert.match(source, /Changes save automatically after a short pause\./);
  assert.match(source, /Saving after you stop typing\.\.\./);
  assert.match(source, /Saving\.\.\./);
  assert.match(source, /Retry save/);
  assert.match(source, /draft is still here\./);
});

test('provider credential inputs preserve shared save errors and expose retry wiring', () => {
  assert.match(source, /import \{ getSettingsSaveErrorMessage \} from "@renderer\/lib\/config-save-error"/);
  assert.match(source, /saveConfigMutation\.mutate\([\s\S]*onSuccess:[\s\S]*onError:/);
  assert.match(source, /message: `\$\{getSettingsSaveErrorMessage\(error\)\} \$\{PROVIDER_TEXT_FIELD_LABELS\[key\]\} draft is still here\.`/);
  assert.match(source, /apiKeySaveFeedback=\{providerTextSaveFeedbacks\.groqApiKey\}/);
  assert.match(source, /baseUrlSaveFeedback=\{providerTextSaveFeedbacks\.geminiBaseUrl\}/);
  assert.match(source, /onApiKeyRetry=\{\(\) => retryProviderTextDraftSave\("groqApiKey"\)\}/);
  assert.match(source, /onBaseUrlRetry=\{\(\) => retryProviderTextDraftSave\("geminiBaseUrl"\)\}/);
});

