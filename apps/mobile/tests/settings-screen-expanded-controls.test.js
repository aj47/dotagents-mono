const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const settingsSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SettingsScreen.tsx'),
  'utf8'
);
const settingsApiSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'lib', 'settingsApi.ts'),
  'utf8'
);
const apiTypesSource = fs.readFileSync(
  path.join(__dirname, '..', '..', '..', 'packages', 'shared', 'src', 'api-types.ts'),
  'utf8'
);
const remoteServerSource = fs.readFileSync(
  path.join(__dirname, '..', '..', '..', 'apps', 'desktop', 'src', 'main', 'remote-server.ts'),
  'utf8'
);

test('keeps expanded desktop provider setup controls local to mobile settings', () => {
  assert.match(settingsSource, /const PROVIDER_CREDENTIAL_SECTIONS/);
  assert.match(settingsSource, /<CollapsibleSection id="providerSetup" title="Provider Setup">/);
  assert.match(settingsSource, /handleRemoteSecretDraftChange\(secret\.key, v\)/);
  assert.match(settingsSource, /commitRemoteSecretDraft\(secret\.key\)/);
  assert.match(settingsSource, /openaiApiKey/);
  assert.match(settingsSource, /groqApiKey/);
  assert.match(settingsSource, /geminiApiKey/);
  assert.match(settingsSource, /chatgptWebAccessToken/);
  assert.doesNotMatch(settingsSource, /CHAT_PROVIDER_CREDENTIAL_SECTIONS/);
  assert.doesNotMatch(settingsSource, /from '@dotagents\/shared\/providers'/);
});

test('restores Codex, speech, auto-paste, and Discord mobile settings without shared presentation imports', () => {
  assert.match(settingsSource, /OPENAI_REASONING_EFFORT_OPTIONS/);
  assert.match(settingsSource, /CODEX_TEXT_VERBOSITY_OPTIONS/);
  assert.match(settingsSource, /CODEX_SERVICE_TIER_OPTIONS/);
  assert.match(settingsSource, /openaiSttLanguage/);
  assert.match(settingsSource, /groqSttPrompt/);
  assert.match(settingsSource, /PARAKEET_NUM_THREAD_OPTIONS/);
  assert.match(settingsSource, /SUPERTONIC_TTS_LANGUAGES/);
  assert.match(settingsSource, /mcpAutoPasteEnabled/);
  assert.match(settingsSource, /mcpAutoPasteDelay/);
  assert.match(settingsSource, /localTraceLoggingEnabled/);
  assert.match(settingsSource, /localTraceLogPath/);
  assert.match(settingsSource, /DISCORD_LIST_SETTING_SECTIONS/);
  assert.match(settingsSource, /<CollapsibleSection id="discord" title="Discord">/);
  assert.doesNotMatch(settingsSource, /APP_SHELL_PROVIDER_SETUP_PRESENTATION/);
  assert.doesNotMatch(settingsSource, /APP_SHELL_MOBILE_SETTINGS_SECTION_TITLE/);
});

test('mobile settings API types and desktop remote server expose the restored settings surface', () => {
  assert.match(settingsApiSource, /OpenAiReasoningEffort/);
  assert.match(settingsApiSource, /CodexTextVerbosity/);
  assert.match(settingsApiSource, /CodexServiceTier/);
  assert.match(apiTypesSource, /openaiApiKey\?: string;/);
  assert.match(apiTypesSource, /openaiReasoningEffort\?: OpenAiReasoningEffort;/);
  assert.match(apiTypesSource, /codexTextVerbosity\?: CodexTextVerbosity;/);
  assert.match(apiTypesSource, /codexServiceTier\?: CodexServiceTier;/);
  assert.match(apiTypesSource, /parakeetNumThreads\?: number;/);
  assert.match(apiTypesSource, /supertonicSteps\?: number;/);
  assert.match(remoteServerSource, /openaiApiKey: cfg\.openaiApiKey \? REMOTE_SERVER_SECRET_MASK : ""/);
  assert.match(remoteServerSource, /updates\.openaiReasoningEffort/);
  assert.match(remoteServerSource, /updates\.codexServiceTier/);
  assert.match(remoteServerSource, /updates\.mcpAutoPasteDelay/);
  assert.match(remoteServerSource, /localTraceLoggingEnabled: cfg\.localTraceLoggingEnabled \?\? false/);
  assert.match(remoteServerSource, /updates\.localTraceLogPath/);
  assert.match(remoteServerSource, /updates\.discordBotToken/);
  assert.match(remoteServerSource, /updates\.supertonicSteps/);
});
