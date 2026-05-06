const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const settingsSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SettingsScreen.tsx'),
  'utf8'
);
const remoteSettingsDraftsSource = fs.readFileSync(
  path.join(__dirname, '..', '..', '..', 'packages', 'shared', 'src', 'remote-settings-input-drafts.ts'),
  'utf8'
);

function extractBetween(startMarker, endMarker) {
  const start = settingsSource.indexOf(startMarker);
  assert.notEqual(start, -1, `Missing start marker: ${startMarker}`);

  const end = endMarker ? settingsSource.indexOf(endMarker, start) : -1;
  assert.notEqual(end, -1, `Missing end marker: ${endMarker}`);

  return settingsSource.slice(start, end);
}

test('avoids decorative emoji chrome in the mobile remote provider selection subsection', () => {
  const providerSection = extractBetween(
    '<CollapsibleSection id="providerSelection" title="Provider Selection">',
    '<CollapsibleSection id="providerSetup" title="Provider Setup">'
  );

  assert.doesNotMatch(providerSection, /🎤|📝|🤖|🔊/);
  assert.doesNotMatch(providerSection, /Select which AI provider to use for each feature\./);
  assert.match(providerSection, />Voice Transcription \(STT\)</);
  assert.doesNotMatch(providerSection, />Transcript Post-Processing</);
  assert.doesNotMatch(providerSection, />Transcript Processing</);
  assert.match(providerSection, />Agent</);
  assert.doesNotMatch(providerSection, />Agent\/MCP Tools</);
  assert.match(providerSection, />Text-to-Speech \(TTS\)</);
});

test('lets mobile configure desktop provider credentials without echoing secrets', () => {
  const providerSetupSection = extractBetween(
    '<CollapsibleSection id="providerSetup" title="Provider Setup">',
    '<CollapsibleSection id="profileModel" title="Profile & Model">'
  );

  assert.match(settingsSource, /PROVIDER_CREDENTIAL_SECTIONS/);
  assert.match(settingsSource, /openaiApiKey/);
  assert.match(settingsSource, /groqApiKey/);
  assert.match(settingsSource, /geminiApiKey/);
  assert.match(providerSetupSection, /handleRemoteSecretDraftChange\(provider\.apiKey, v\)/);
  assert.match(providerSetupSection, /commitRemoteSecretDraft\(provider\.apiKey\)/);
  assert.match(providerSetupSection, /handleRemoteSettingUpdate\(provider\.baseUrl, v\)/);
  assert.match(providerSetupSection, /placeholder=\{hasConfiguredKey \? 'Configured' : provider\.apiKeyPlaceholder\}/);
  assert.doesNotMatch(providerSetupSection, /value=\{remoteSettings\[provider\.apiKey\]/);
});

test('keeps profile/model actions text-first and explicitly labeled', () => {
  const profileModelSection = extractBetween(
    '<CollapsibleSection id="profileModel" title="Profile & Model">',
    '<CollapsibleSection id="streamerMode" title="Streamer Mode">'
  );

  assert.doesNotMatch(profileModelSection, /📥 Import|📤 Export|📋 List|✏️ Custom|🔄|⏳/);
  assert.match(profileModelSection, /\{isImportingProfile \? 'Importing\.\.\.' : 'Import'\}/);
  assert.match(profileModelSection, /\{isExportingProfile \? 'Exporting\.\.\.' : 'Export'\}/);
  assert.match(profileModelSection, /\{useCustomModel \? 'List' : 'Custom'\}/);
  assert.match(profileModelSection, /\{isLoadingModels \? 'Refreshing…' : 'Refresh'\}/);
  assert.match(profileModelSection, /accessibilityLabel=\{useCustomModel \? 'Show model list' : 'Enter custom model name'\}/);
  assert.match(profileModelSection, /accessibilityLabel="Refresh available models"/);
  assert.match(profileModelSection, />Transcript Processing</);
  assert.match(profileModelSection, />Enabled</);
  assert.match(profileModelSection, />Provider</);
  assert.match(settingsSource, /getTranscriptPostProcessingModelSettingKey/);
  assert.match(settingsSource, /buildRemoteSettingsInputDrafts/);
  assert.match(remoteSettingsDraftsSource, /transcriptPostProcessingOpenaiModel: settings\.transcriptPostProcessingOpenaiModel \|\| ""/);
  assert.match(settingsSource, /updates\.transcriptPostProcessingGroqModel = inputDrafts\.transcriptPostProcessingGroqModel \?\? ''/);
  assert.match(profileModelSection, /const modelKey = getTranscriptPostProcessingModelSettingKey\(providerId\)/);
  assert.match(profileModelSection, /handleRemoteSettingUpdate\(modelKey, v\)/);
  assert.match(profileModelSection, />Prompt</);
});

test('lets mobile manage OpenAI-compatible desktop endpoints without echoing secrets', () => {
  const profileModelSection = extractBetween(
    '<CollapsibleSection id="profileModel" title="Profile & Model">',
    '<CollapsibleSection id="streamerMode" title="Streamer Mode">'
  );
  const presetEditorSection = extractBetween(
    '{/* Preset Editor Modal */}',
    '{/* TTS Model Picker Modal */}'
  );

  assert.match(settingsSource, /ModelPresetSummary/);
  assert.match(profileModelSection, /openPresetEditor\('edit', currentPreset\)/);
  assert.match(profileModelSection, /openPresetEditor\('create'\)/);
  assert.match(profileModelSection, />New Endpoint</);
  assert.match(profileModelSection, /'Key set'/);
  assert.match(settingsSource, /settingsClient\.createModelPreset\(payload\)/);
  assert.match(settingsSource, /settingsClient\.updateModelPreset\(presetDraft\.id, payload\)/);
  assert.match(settingsSource, /settingsClient\.deleteModelPreset\(presetDraft\.id!\)/);
  assert.match(settingsSource, /refreshRemoteSettingsSnapshot/);
  assert.match(presetEditorSection, /placeholder=\{presetDraft\.hasApiKey \? 'Configured' : 'sk-\.\.\.'\}/);
  assert.doesNotMatch(presetEditorSection, /value=\{remoteSettings.*apiKey/);
});

test('lets mobile configure local desktop TTS provider details', () => {
  const ttsSection = extractBetween(
    '<CollapsibleSection id="textToSpeech" title="Text-to-Speech">',
    '<CollapsibleSection id="agentSettings" title="Agent Settings">'
  );

  assert.doesNotMatch(ttsSection, /Configure voice in desktop settings/);
  assert.match(settingsSource, /getTtsVoicesForProvider/);
  assert.match(settingsSource, /DEFAULT_SUPERTONIC_TTS_LANGUAGE/);
  assert.match(settingsSource, /DEFAULT_SUPERTONIC_TTS_STEPS/);
  assert.match(settingsSource, /handleRemoteSettingUpdate\('supertonicLanguage', language\.value\)/);
  assert.match(settingsSource, /getTextToSpeechSpeedSetting as getRemoteTtsSpeedSetting/);
  assert.match(ttsSection, /remoteTtsSpeedSetting/);
  assert.match(ttsSection, /handleRemoteSettingUpdate\(remoteTtsSpeedSetting\.key, v\)/);
  assert.match(settingsSource, /handleRemoteSettingUpdate\('supertonicSteps', Math\.round\(v\)\)/);
  assert.match(settingsSource, /getTextToSpeechVoiceDefault as getRemoteTtsVoiceDefault/);
  assert.match(settingsSource, /handleRemoteSettingUpdate\(voiceKey, normalizeTtsVoiceUpdateValue\(voiceKey, defaultVoice\)\)/);
  assert.match(settingsSource, /normalizeTtsVoiceUpdateValue\(key, voice\.value\)/);
  assert.match(settingsSource, /getLocalSpeechModelStatuses/);
  assert.match(settingsSource, /downloadLocalSpeechModel\(providerId\)/);
  assert.match(ttsSection, /formatLocalModelProgress\(status\)/);
  assert.match(ttsSection, /handleLocalSpeechModelDownload\(localProviderId\)/);
  assert.match(ttsSection, /handleRemoteTtsTest/);
  assert.match(settingsSource, /speakRemoteTts\('Hello\. This is a test of the selected desktop text to speech voice\.'/);
});

test('lets mobile configure the local Parakeet STT model', () => {
  const speechToTextSection = extractBetween(
    '<CollapsibleSection id="speechToText" title="Speech-to-Text">',
    '<CollapsibleSection id="textToSpeech" title="Text-to-Speech">'
  );

  assert.match(speechToTextSection, /remoteSettings\.sttProviderId === 'parakeet'/);
  assert.match(speechToTextSection, />Parakeet Model</);
  assert.match(speechToTextSection, /localSpeechModelStatuses\.parakeet/);
  assert.match(settingsSource, /PARAKEET_NUM_THREAD_OPTIONS/);
  assert.match(settingsSource, /DEFAULT_PARAKEET_NUM_THREADS/);
  assert.match(speechToTextSection, /handleLocalSpeechModelDownload\('parakeet'\)/);
  assert.match(speechToTextSection, /handleRemoteSettingUpdate\('parakeetNumThreads', threadCount\)/);
  assert.match(settingsSource, /setLocalSpeechModelStatuses\(\(current\) => \(\{/);
});

test('lets mobile configure cloud desktop STT model details', () => {
  const profileModelSection = extractBetween(
    '<CollapsibleSection id="profileModel" title="Profile & Model">',
    '<CollapsibleSection id="bundles" title="Bundles">'
  );
  const speechToTextSection = extractBetween(
    '<CollapsibleSection id="speechToText" title="Speech-to-Text">',
    '<CollapsibleSection id="textToSpeech" title="Text-to-Speech">'
  );

  assert.match(settingsSource, /KNOWN_STT_MODEL_IDS/);
  assert.match(settingsSource, /getDefaultSttModel/);
  assert.match(settingsSource, /DEFAULT_TRANSCRIPT_POST_PROCESSING_ENABLED/);
  assert.match(profileModelSection, /remoteSettings\.transcriptPostProcessingEnabled \?\? DEFAULT_TRANSCRIPT_POST_PROCESSING_ENABLED/);
  assert.match(remoteSettingsDraftsSource, /openaiSttLanguage: settings\.openaiSttLanguage \|\| ""/);
  assert.match(settingsSource, /updates\.openaiSttLanguage = inputDrafts\.openaiSttLanguage \?\? ''/);
  assert.match(settingsSource, /updates\.groqSttLanguage = inputDrafts\.groqSttLanguage \?\? ''/);
  assert.match(speechToTextSection, /remoteSettings\.sttProviderId === 'openai' \|\| remoteSettings\.sttProviderId === 'groq'/);
  assert.match(speechToTextSection, /const languageKey = providerId === 'openai' \? 'openaiSttLanguage' : 'groqSttLanguage'/);
  assert.match(speechToTextSection, /handleRemoteSettingUpdate\(languageKey, v\)/);
  assert.match(speechToTextSection, /const modelKey = providerId === 'openai' \? 'openaiSttModel' : 'groqSttModel'/);
  assert.match(speechToTextSection, /handleRemoteSettingUpdate\(modelKey, modelId\)/);
  assert.match(speechToTextSection, />Groq Prompt</);
  assert.match(speechToTextSection, /handleRemoteSettingUpdate\('groqSttPrompt', v\)/);
});

test('uses shared main agent mode options in mobile desktop settings', () => {
  const agentSettingsSection = extractBetween(
    '<CollapsibleSection id="agentSettings" title="Agent Settings">',
    '<CollapsibleSection id="skills" title="Skills">'
  );

  assert.match(settingsSource, /MAIN_AGENT_MODE_OPTIONS/);
  assert.match(settingsSource, /DEFAULT_MAIN_AGENT_MODE/);
  assert.match(agentSettingsSection, /handleRemoteSettingUpdate\('mainAgentMode', mode as MainAgentMode\)/);
  assert.match(agentSettingsSection, /\(remoteSettings\.mainAgentMode \?\? DEFAULT_MAIN_AGENT_MODE\) === 'acpx'/);
});

test('uses shared MCP defaults in mobile desktop settings', () => {
  const agentSettingsSection = extractBetween(
    '<CollapsibleSection id="agentSettings" title="Agent Settings">',
    '<CollapsibleSection id="skills" title="Skills">'
  );
  const toolExecutionSection = extractBetween(
    '<CollapsibleSection id="toolExecution" title="Tool Execution">',
    '<CollapsibleSection id="mcpServers" title="MCP Servers">'
  );

  assert.match(settingsSource, /DEFAULT_MCP_MESSAGE_QUEUE_ENABLED/);
  assert.match(settingsSource, /DEFAULT_MCP_REQUIRE_APPROVAL_BEFORE_TOOL_CALL/);
  assert.match(settingsSource, /DEFAULT_MCP_VERIFY_COMPLETION_ENABLED/);
  assert.match(settingsSource, /DEFAULT_MCP_FINAL_SUMMARY_ENABLED/);
  assert.match(settingsSource, /DEFAULT_MCP_UNLIMITED_ITERATIONS/);
  assert.match(settingsSource, /DEFAULT_MCP_CONTEXT_REDUCTION_ENABLED/);
  assert.match(settingsSource, /DEFAULT_MCP_TOOL_RESPONSE_PROCESSING_ENABLED/);
  assert.match(settingsSource, /DEFAULT_MCP_PARALLEL_TOOL_EXECUTION/);
  assert.match(agentSettingsSection, /remoteSettings\.mcpMessageQueueEnabled \?\? DEFAULT_MCP_MESSAGE_QUEUE_ENABLED/);
  assert.match(agentSettingsSection, /remoteSettings\.mcpUnlimitedIterations \?\? DEFAULT_MCP_UNLIMITED_ITERATIONS/);
  assert.match(toolExecutionSection, /remoteSettings\.mcpContextReductionEnabled \?\? DEFAULT_MCP_CONTEXT_REDUCTION_ENABLED/);
  assert.match(toolExecutionSection, /remoteSettings\.mcpToolResponseProcessingEnabled \?\? DEFAULT_MCP_TOOL_RESPONSE_PROCESSING_ENABLED/);
  assert.match(toolExecutionSection, /remoteSettings\.mcpParallelToolExecution \?\? DEFAULT_MCP_PARALLEL_TOOL_EXECUTION/);
});

test('lets mobile configure desktop local trace logging', () => {
  const langfuseSection = extractBetween(
    '<CollapsibleSection id="langfuse" title="Langfuse">',
    '<CollapsibleSection id="skills" title="Skills">'
  );

  assert.match(remoteSettingsDraftsSource, /localTraceLogPath: settings\.localTraceLogPath \|\| ""/);
  assert.match(settingsSource, /updates\.localTraceLogPath = inputDrafts\.localTraceLogPath \?\? ''/);
  assert.match(settingsSource, /DEFAULT_LOCAL_TRACE_LOGGING_ENABLED/);
  assert.match(settingsSource, /DEFAULT_LANGFUSE_ENABLED/);
  assert.match(langfuseSection, /value=\{remoteSettings\.localTraceLoggingEnabled \?\? DEFAULT_LOCAL_TRACE_LOGGING_ENABLED\}/);
  assert.match(langfuseSection, /handleRemoteSettingToggle\('localTraceLoggingEnabled', v\)/);
  assert.match(langfuseSection, /remoteSettings\.localTraceLoggingEnabled \?\? DEFAULT_LOCAL_TRACE_LOGGING_ENABLED/);
  assert.match(langfuseSection, /handleRemoteSettingUpdate\('localTraceLogPath', v\)/);
  assert.match(langfuseSection, /value=\{remoteSettings\.langfuseEnabled \?\? DEFAULT_LANGFUSE_ENABLED\}/);
  assert.match(langfuseSection, /handleRemoteSettingToggle\('langfuseEnabled', v\)/);
  assert.match(langfuseSection, /remoteSettings\.langfuseEnabled \?\? DEFAULT_LANGFUSE_ENABLED/);
  assert.match(langfuseSection, />Langfuse tracing</);
});

test('uses shared WhatsApp defaults in mobile desktop settings', () => {
  const whatsappSection = extractBetween(
    '<CollapsibleSection id="whatsapp" title="WhatsApp">',
    '<CollapsibleSection id="discord" title="Discord">'
  );

  assert.match(settingsSource, /DEFAULT_WHATSAPP_ENABLED/);
  assert.match(settingsSource, /DEFAULT_WHATSAPP_AUTO_REPLY/);
  assert.match(settingsSource, /DEFAULT_WHATSAPP_LOG_MESSAGES/);
  assert.match(whatsappSection, /remoteSettings\.whatsappEnabled \?\? DEFAULT_WHATSAPP_ENABLED/);
  assert.match(whatsappSection, /handleRemoteSettingToggle\('whatsappEnabled', v\)/);
  assert.match(whatsappSection, /remoteSettings\.whatsappAutoReply \?\? DEFAULT_WHATSAPP_AUTO_REPLY/);
  assert.match(whatsappSection, /handleRemoteSettingToggle\('whatsappAutoReply', v\)/);
  assert.match(whatsappSection, /remoteSettings\.whatsappLogMessages \?\? DEFAULT_WHATSAPP_LOG_MESSAGES/);
  assert.match(whatsappSection, /handleRemoteSettingToggle\('whatsappLogMessages', v\)/);
});

test('lets mobile configure desktop Discord integration settings without echoing the token', () => {
  const discordSection = extractBetween(
    '<CollapsibleSection id="discord" title="Discord">',
    '<CollapsibleSection id="langfuse" title="Langfuse">'
  );

  assert.match(settingsSource, /DISCORD_LIST_SETTING_SECTIONS/);
  assert.match(remoteSettingsDraftsSource, /discordBotToken: getRemoteSettingsSecretInputDraft\(settings\.discordBotToken, secretMask\)/);
  assert.match(settingsSource, /updates\.discordBotToken = inputDrafts\.discordBotToken \?\? ''/);
  assert.match(settingsSource, /updates\[key\] = parseConfigListInput\(inputDrafts\[key\] \?\? '', \{ unique: true \}\)/);
  assert.match(discordSection, /handleRemoteSettingToggle\('discordEnabled', v\)/);
  assert.match(discordSection, /placeholder=\{remoteSettings\.discordBotToken === SECRET_MASK \? 'Configured' : 'Paste your Discord bot token'\}/);
  assert.doesNotMatch(discordSection, /value=\{remoteSettings\.discordBotToken/);
  assert.match(discordSection, /handleRemoteSettingUpdate\('discordDefaultProfileId', profile\.id\)/);
  assert.match(settingsSource, /DEFAULT_DISCORD_DM_ENABLED/);
  assert.match(settingsSource, /DEFAULT_DISCORD_REQUIRE_MENTION/);
  assert.match(settingsSource, /DEFAULT_DISCORD_LOG_MESSAGES/);
  assert.match(discordSection, /remoteSettings\.discordDmEnabled \?\? DEFAULT_DISCORD_DM_ENABLED/);
  assert.match(discordSection, /handleRemoteSettingToggle\('discordDmEnabled', v\)/);
  assert.match(discordSection, /remoteSettings\.discordRequireMention \?\? DEFAULT_DISCORD_REQUIRE_MENTION/);
  assert.match(discordSection, /handleRemoteSettingToggle\('discordRequireMention', v\)/);
  assert.match(discordSection, /handleRemoteListSettingUpdate\(section\.key, v\)/);
  assert.match(discordSection, /remoteSettings\.discordLogMessages \?\? DEFAULT_DISCORD_LOG_MESSAGES/);
  assert.match(discordSection, /handleRemoteSettingToggle\('discordLogMessages', v\)/);
});

test('keeps the mobile remote-settings error banner text-first and wrap-safe', () => {
  assert.doesNotMatch(settingsSource, /⚠️ \{remoteError\}/);
  assert.match(settingsSource, /<Text style=\{styles\.warningText\}>\{remoteError\}<\/Text>/);
  assert.match(settingsSource, /accessibilityLabel=\{createButtonAccessibilityLabel\('Retry loading desktop settings'\)\}/);

  const warningStyles = extractBetween(
    'warningContainer: {',
    'warningText: {'
  );
  assert.doesNotMatch(warningStyles, /flexDirection:\s*'row'/);
  assert.doesNotMatch(warningStyles, /justifyContent:\s*'space-between'/);
  assert.match(warningStyles, /alignItems:\s*'stretch'/);
  assert.match(warningStyles, /gap:\s*spacing\.md/);
  assert.match(warningStyles, /width:\s*'100%' as const/);
  assert.match(settingsSource, /alignSelf:\s*'stretch'/);
});
