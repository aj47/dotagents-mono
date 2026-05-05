const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const screenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'ChatScreen.tsx'),
  'utf8'
);

test('keeps agent selection in the navigation header for the mobile chat screen', () => {
  assert.match(screenSource, /headerTitle:\s*\(\) => \(/);
  assert.match(screenSource, /accessibilityLabel=\{`Current agent: \$\{currentAgentLabel\}\. Tap to change\.`\}/);
  assert.match(screenSource, /\{currentAgentLabel\} ▼/);
});

test('shows a conversation-state chip in the mobile chat header while preserving the compact header actions row', () => {
  assert.match(screenSource, /const headerConversationLabel = headerConversationState\s*\?\s*getAgentConversationStateLabel\(headerConversationState\)/);
  assert.match(screenSource, /\{headerConversationLabel && headerConversationChipStyle && \(/);
  assert.match(screenSource, /headerConversationState === 'running' && \(/);
  assert.match(screenSource, /styles\.headerConversationChip/);
  assert.match(screenSource, /styles\.headerConversationChipText/);
});

test('removes the redundant Chat title from the mobile conversation header', () => {
  assert.doesNotMatch(screenSource, />Chat<\/Text>/);
});

test('keeps pinning available from the individual chat view header', () => {
  assert.match(screenSource, /isCurrentSessionPinned \? 'Unpin current chat' : 'Pin current chat'/);
  assert.match(screenSource, /styles\.headerPinButton/);
  assert.match(screenSource, /\{isCurrentSessionPinned \? 'Pinned' : 'Pin'\}/);
});

test('does not render a duplicate composer agent chip above the mobile chat input row', () => {
  assert.doesNotMatch(screenSource, /styles\.agentSelectorRow/);
  assert.doesNotMatch(screenSource, /🤖 Agent/);
  assert.doesNotMatch(screenSource, /agentSelectorChip(Label|Value)?:/);
});

test('keeps the live voice overlay compact by grouping status and transcript into one card', () => {
  assert.match(screenSource, /\{listening && \([\s\S]*?<View style=\{styles\.overlayCard\}>[\s\S]*?<Text style=\{styles\.overlayText\}>/);
  assert.match(screenSource, /overlayCard:\s*\{[\s\S]*?maxWidth:\s*'88%',[\s\S]*?paddingHorizontal:\s*12,[\s\S]*?paddingVertical:\s*8,/);
});

test('caps live transcript height so the recording overlay is less likely to cover the chat surface', () => {
  assert.match(screenSource, /<Text style=\{styles\.overlayTranscript\} numberOfLines=\{3\}>/);
  assert.match(screenSource, /overlayTranscript:\s*\{[\s\S]*?marginTop:\s*4,[\s\S]*?lineHeight:\s*16,[\s\S]*?opacity:\s*0\.92,/);
});

test('derives visible assistant content from respond_to_user output and suppresses raw tool payloads', () => {
  assert.match(screenSource, /getVisibleMessageContent,/);
  assert.match(screenSource, /getRespondToUserContentFromMessage,/);
  assert.match(screenSource, /looksLikeToolPayloadContent,/);
  assert.match(screenSource, /const visibleMessageContent = getVisibleMessageContent\(m\);/);
  assert.doesNotMatch(screenSource, /const getVisibleMessageContent = \(message: ChatMessage\): string =>/);
  assert.doesNotMatch(screenSource, /const TOOL_PAYLOAD_PREFIX_REGEX =/);
  assert.doesNotMatch(screenSource, /extractRespondToUserContentFromArgs\(call\.arguments\)/);
  assert.doesNotMatch(screenSource, /const looksLikeToolPayloadContent = \(content\?: string\): boolean =>/);
  assert.doesNotMatch(screenSource, /lastMessage\.content = \(lastMessage\.content \|\| ''\) \+\s*\(lastMessage\.content \? '\\n' : ''\) \+ historyMsg\.content/);
  assert.doesNotMatch(screenSource, /lastMessage\.content = \(lastMessage\.content \|\| ''\) \+\s*\(lastMessage\.content \? '\\n' : ''\) \+ msg\.content/);
});

test('bases assistant collapse decisions on visible content instead of raw tool payload metadata', () => {
  assert.match(screenSource, /const visibleMessageContent = getVisibleMessageContent\(m\);/);
  assert.match(screenSource, /const shouldCollapse = m\.role === 'assistant'\s+\? shouldCollapseMessage\(visibleMessageContent\)\s+: shouldCollapseMessage\(m\.content, m\.toolCalls, m\.toolResults\);/);
  assert.match(screenSource, /const effectiveShouldCollapse = hasRespondToUserContent \? false : shouldCollapse;/);
  assert.doesNotMatch(screenSource, /const shouldCollapse = shouldCollapseMessage\(m\.content, m\.toolCalls, m\.toolResults\);/);
  assert.match(screenSource, /const shouldShowCollapsedTextPreview =\s+visibleMessageContent\.length > 0 &&\s+!isExpanded &&\s+effectiveShouldCollapse;/);
});

test('uses shared media sanitization for collapsed mobile message previews', () => {
  assert.match(screenSource, /sanitizeMessageMediaContentForPreview/);
  assert.match(screenSource, /const getCollapsedMessagePreview = \(content: string\) =>\s+sanitizeMessageMediaContentForPreview\(/);
  assert.doesNotMatch(screenSource, /assets:\\\/\\\/conversation-video\\\/\[\^\)\]\+/);
});

test('derives tool execution card status from displayed non-meta tool entries', () => {
  assert.match(screenSource, /const displayToolEntries = \(m\.toolExecutions\?\.length/);
  assert.match(screenSource, /const renderedToolEntries =/);
  assert.match(screenSource, /const allSuccess =\s+hasToolResults && renderedToolEntries\.every\(entry => entry\.result\?\.success === true\);/);
  assert.match(screenSource, /const hasErrors = renderedToolEntries\.some\(entry => entry\.result\?\.success === false\);/);
  assert.match(screenSource, /const isPending =\s+renderedToolEntries\.some\(entry => !entry\.result\);/);
  assert.match(screenSource, /\{renderedToolEntries\.map\(\(\{ toolCall, label, origIdx, result: tcResult \}, tcIdx\) => \{/);
  assert.match(screenSource, /\{renderedToolEntries\.map\(\(\{ toolCall, label, origIdx, result \}, idx\) => \{/);
  assert.doesNotMatch(screenSource, /const allSuccess = hasToolResults && m\.toolResults!\.every\(r => r\.success\);/);
  assert.doesNotMatch(screenSource, /const hasErrors = hasToolResults && m\.toolResults!\.some\(r => !r\.success\);/);
});

test('keeps Codex thinking blocks display-only on mobile', () => {
  assert.match(screenSource, /getRenderableMessageContent,/);
  assert.doesNotMatch(screenSource, /const getRenderableMessageContent = \(message: ChatMessage\): string =>/);
  assert.match(screenSource, /displayContent: historyMsg\.displayContent/);
  assert.match(screenSource, /preserveDisplayContentFromProgress\(finalTurnMessages, progressMsgs\)/);
});

test('labels result-only tool entries without showing raw tool_call text', () => {
  assert.match(screenSource, /label: 'Tool result'/);
  assert.match(screenSource, /const toolPreview = label \?\? getIndividualToolCallPreview\(toolCall\);/);
  assert.match(screenSource, /\{label \?\? toolCall\.name\}/);
});

test('uses tool activities wording consistently for grouped tool activity labels', () => {
  assert.match(screenSource, /accessibilityLabel=\{`\$\{group\.count\} tool activities, collapsed\. Tap to expand\.`\}/);
  assert.match(screenSource, /▶ \{group\.count\} tool \{group\.count === 1 \? 'activity' : 'activities'\}/);
  assert.match(screenSource, /accessibilityLabel=\{`Collapse \$\{group!\.count\} tool activities`\}/);
  assert.match(screenSource, /▼ \{group!\.count\} tool \{group!\.count === 1 \? 'activity' : 'activities'\}/);
  assert.match(screenSource, /▲ Collapse \{group!\.count\} tool \{group!\.count === 1 \? 'activity' : 'activities'\}/);
  assert.doesNotMatch(screenSource, /▶ \{group\.count\} tool \{group\.count === 1 \? 'call' : 'calls'\}/);
});

test('keeps the TTS control inline with assistant message text instead of on a detached row', () => {
  assert.match(screenSource, /assistantMessageRow:\s*\{[\s\S]*?flexDirection:\s*'row',[\s\S]*?alignItems:\s*'flex-start'/);
  assert.match(screenSource, /<View style=\{m\.role === 'assistant' \? styles\.assistantMessageRow : undefined\}>[\s\S]*?speakMessage\(i, visibleMessageContent\)/);
});

test('suppresses duplicate auto TTS starts for the same mobile response text', () => {
  assert.match(screenSource, /const AUTO_TTS_DUPLICATE_SUPPRESSION_MS = 5_000;/);
  assert.match(screenSource, /const normalizeAutoTtsTextKey = \(value: string\) => value\.replace\(\/\\s\+\/g, ' '\)\.trim\(\)\.toLowerCase\(\);/);
  assert.match(screenSource, /const recentAutoSpeechByTextRef = useRef<Map<string, number>>\(new Map\(\)\);/);
  assert.match(screenSource, /now - lastSpokenAt < AUTO_TTS_DUPLICATE_SUPPRESSION_MS/);
});

test('routes every desktop TTS provider through the paired remote TTS endpoint', () => {
  assert.match(screenSource, /type RemoteDesktopTtsProvider = 'native' \| NonNullable<Settings\['ttsProviderId'\]>/);
  assert.match(screenSource, /setRemoteTtsProvider\(settings\.ttsProviderId \|\| 'native'\)/);
  assert.match(screenSource, /getRemoteDesktopTtsVoice\(settings\)/);
  assert.match(screenSource, /getRemoteDesktopTtsModel\(settings\)/);
  assert.match(screenSource, /effectiveTtsProvider !== 'native' && config\.baseUrl && config\.apiKey/);
  assert.match(screenSource, /providerId: effectiveTtsProvider/);
  assert.match(screenSource, /model: effectiveRemoteTtsModel/);
  assert.doesNotMatch(screenSource, /effectiveTtsProvider === 'edge'/);
});

test('replaces the empty mobile chat home state with quick-start launchers', () => {
  assert.match(screenSource, /!sessionStore\.isLoadingMessages && messages\.length === 0 && \(/);
  assert.match(screenSource, /<View style=\{styles\.chatHomeCard\}>/);
  assert.match(screenSource, /promptQuickStarts\.map\(\(item\) => \(/);
  assert.match(screenSource, /chatHomeShortcutGrid/);
  assert.match(screenSource, /handleQuickStartPress\(item\)/);
  assert.match(screenSource, /No prompts, skills, or tasks available from your connected desktop app\./);
  assert.doesNotMatch(screenSource, /chatHomeScanButtonText/);
});

test('loads saved prompts from the settings API for the mobile quick-start launcher', () => {
  assert.match(screenSource, /settingsClient\.getSettings\(\)/);
  assert.match(screenSource, /settings\.predefinedPrompts \|\| \[\]/);
  assert.match(screenSource, /isSlashCommandPrompt/);
});

test('lets mobile edit and delete desktop saved prompts from quick-start cards', () => {
  assert.match(screenSource, /prompt\?: PredefinedPromptSummary;/);
  assert.match(screenSource, /const \[editingPrompt, setEditingPrompt\] = useState<PredefinedPromptSummary \| null>\(null\);/);
  assert.match(screenSource, /openEditPromptModal\(item\.prompt!\)/);
  assert.match(screenSource, /handleDeletePrompt\(item\.prompt!\)/);
  assert.match(screenSource, /settingsClient\.updateSettings\(\{ predefinedPrompts: updatedPrompts \}\)/);
  assert.match(screenSource, /prompt\.id === editingPrompt\.id/);
  assert.match(screenSource, /predefinedPrompts\.filter\(\(candidate\) => candidate\.id !== prompt\.id\)/);
  assert.match(screenSource, /editingPrompt \? 'Edit Prompt' : 'Add New Prompt'/);
  assert.match(screenSource, /editingPrompt \? 'Save Changes' : 'Add Prompt'/);
  assert.match(screenSource, /styles\.chatHomeShortcutActions/);
});

test('loads predefined prompts, skills, and tasks directly into mobile quick-start launchers', () => {
  assert.match(screenSource, /settingsClient\.getSkills\(\)/);
  assert.match(screenSource, /settingsClient\.getLoops\(\)/);
  assert.match(screenSource, /const promptQuickStarts = useMemo<QuickStartShortcut\[\]>/);
  assert.match(screenSource, /const skillItems = availableSkills\.map\(\(skill\) => \(\{/);
  assert.match(screenSource, /const taskItems = availableTasks\.map\(\(task\) => \(\{/);
  assert.match(screenSource, /handleRunPromptTask\(item\.task\)/);
  assert.doesNotMatch(screenSource, /filteredPromptLibraryPrompts/);
  assert.doesNotMatch(screenSource, /promptLibraryVisible/);
});
