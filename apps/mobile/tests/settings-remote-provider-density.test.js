const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const settingsSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SettingsScreen.tsx'),
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
    '<CollapsibleSection id="profileModel" title="Profile & Model">'
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
  assert.match(profileModelSection, />Prompt</);
});

test('uses local defaults for main-agent and WhatsApp desktop settings', () => {
  const agentSettingsSection = extractBetween(
    '<CollapsibleSection id="agentSettings" title="Agent Settings">',
    '<CollapsibleSection id="toolExecution" title="Tool Execution">'
  );
  const whatsappSection = extractBetween(
    '<CollapsibleSection id="whatsapp" title="WhatsApp">',
    '<CollapsibleSection id="langfuse" title="Langfuse">'
  );

  assert.match(settingsSource, /const DEFAULT_MAIN_AGENT_MODE = 'api'/);
  assert.match(settingsSource, /const MAIN_AGENT_MODE_OPTIONS/);
  assert.match(agentSettingsSection, /\(remoteSettings\.mainAgentMode \?\? DEFAULT_MAIN_AGENT_MODE\) === option\.value/);
  assert.match(agentSettingsSection, /\(remoteSettings\.mainAgentMode \?\? DEFAULT_MAIN_AGENT_MODE\) === 'acpx'/);
  assert.match(settingsSource, /const DEFAULT_WHATSAPP_ENABLED = false/);
  assert.match(settingsSource, /const DEFAULT_WHATSAPP_AUTO_REPLY = false/);
  assert.match(settingsSource, /const DEFAULT_WHATSAPP_LOG_MESSAGES = false/);
  assert.match(whatsappSection, /remoteSettings\.whatsappEnabled \?\? DEFAULT_WHATSAPP_ENABLED/);
  assert.match(whatsappSection, /remoteSettings\.whatsappAutoReply \?\? DEFAULT_WHATSAPP_AUTO_REPLY/);
  assert.match(whatsappSection, /remoteSettings\.whatsappLogMessages \?\? DEFAULT_WHATSAPP_LOG_MESSAGES/);
});

test('lets mobile configure desktop local trace logging', () => {
  const langfuseSection = extractBetween(
    '<CollapsibleSection id="langfuse" title="Langfuse">',
    '<CollapsibleSection id="skills" title="Skills">'
  );

  assert.match(settingsSource, /const DEFAULT_LOCAL_TRACE_LOGGING_ENABLED = false/);
  assert.match(settingsSource, /LOCAL_TRACE_LOGGING_LABEL/);
  assert.match(settingsSource, /LOCAL_TRACE_LOG_PATH_PLACEHOLDER/);
  assert.match(settingsSource, /localTraceLogPath: settingsRes\.localTraceLogPath \|\| ''/);
  assert.match(settingsSource, /updates\.localTraceLogPath = inputDrafts\.localTraceLogPath \?\? ''/);
  assert.match(langfuseSection, /remoteSettings\.localTraceLoggingEnabled \?\? DEFAULT_LOCAL_TRACE_LOGGING_ENABLED/);
  assert.match(langfuseSection, /handleRemoteSettingToggle\('localTraceLoggingEnabled', v\)/);
  assert.match(langfuseSection, /handleRemoteSettingUpdate\('localTraceLogPath', v\)/);
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
