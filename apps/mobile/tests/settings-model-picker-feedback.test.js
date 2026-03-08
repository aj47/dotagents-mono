const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const settingsSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SettingsScreen.tsx'),
  'utf8'
);

test('mobile settings model picker tracks discovery provenance and current-model context', () => {
  assert.match(settingsSource, /const \[modelDiscoveryMeta, setModelDiscoveryMeta\] = useState<ModelDiscoveryMeta \| null>\(null\)/);
  assert.match(settingsSource, /const fetchModels = useCallback\(async \([\s\S]*currentModel: string = ''/);
  assert.match(settingsSource, /setModelDiscoveryMeta\(\{[\s\S]*source: response\.source,[\s\S]*fallbackReason: response\.fallbackReason/);
  assert.match(settingsSource, /fetchModels\([\s\S]*getCurrentModelValueForProvider\([\s\S]*remoteSettings,[\s\S]*remoteSettings\.mcpToolsProviderId/);
  assert.match(settingsSource, /if \(response\.models\.length === 0\) \{[\s\S]*setUseCustomModel\(true\)/);
});

test('mobile settings model picker explains fallback suggestions and custom entry', () => {
  assert.match(settingsSource, /The list is currently showing fallback suggestions\./);
  assert.match(settingsSource, /Update the provider credentials or switch to Custom for an exact model ID\./);
  assert.match(settingsSource, /Showing fallback suggestions instead; use Refresh after fixing credentials, or switch to Custom\./);
  assert.match(settingsSource, /No .* models were returned\. Switch to Custom if your provider supports manual model IDs\./);
  assert.match(settingsSource, /verified .* model\$\{availableModels\.length !== 1 \? 's' : ''\} available\./);
  assert.match(settingsSource, /accessibilityLabel=\{useCustomModel \? 'Switch to model list' : 'Use custom model name'\}/);
  assert.match(settingsSource, /accessibilityLabel=\{isLoadingModels \? 'Refreshing available models' : 'Refresh available models'\}/);
  assert.match(settingsSource, /\{isLoadingModels \? '⏳ Refreshing' : '🔄 Refresh'\}/);
  assert.match(settingsSource, /Select \{currentChatProviderName\} Model/);
  assert.match(settingsSource, /Showing fallback suggestions because \$\{currentChatProviderName\} models could not be verified\./);
});