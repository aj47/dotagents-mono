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
  assert.match(screenSource, /import \{ Ionicons \} from '@expo\/vector-icons';/);
  assert.match(screenSource, /\{currentAgentLabel\}/);
  assert.match(screenSource, /name="chevron-down"/);
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

test('shows total and per-turn agent time without shared runtime chrome', () => {
  assert.match(screenSource, /const computeTurnDurations = \(/);
  assert.match(screenSource, /const formatTurnDuration = \(durationMs: number\): string =>/);
  assert.match(screenSource, /const TURN_DURATION_TICK_MS = 1000/);
  assert.match(screenSource, /const headerTotalTurnDuration = turnDurations\.totalMs > 0/);
  assert.match(screenSource, /styles\.headerDurationChip/);
  assert.match(screenSource, /turnDurations\.byUserTimestamp\.get\(m\.timestamp\)/);
  assert.match(screenSource, /`Agent time \$\{formatTurnDuration\(turnDuration\.durationMs\)\}\$\{turnDuration\.isLive \? ' live' : ''\}`/);
  assert.match(screenSource, /styles\.turnDurationBadge/);
  assert.doesNotMatch(screenSource, /@dotagents\/shared\/turn-duration/);
});

test('does not render a duplicate composer agent chip above the mobile chat input row', () => {
  assert.doesNotMatch(screenSource, /styles\.agentSelectorRow/);
  assert.doesNotMatch(screenSource, /🤖 Agent/);
  assert.doesNotMatch(screenSource, /agentSelectorChip(Label|Value)?:/);
});

test('does not render the old floating voice transcript overlay', () => {
  assert.doesNotMatch(screenSource, /styles\.overlay(Card|Text|Transcript)?/);
  assert.doesNotMatch(screenSource, /Release to send/);
});

test('derives visible assistant content from respond_to_user output and suppresses raw tool payloads', () => {
  assert.match(screenSource, /const getVisibleMessageContent = \(message: ChatMessage\): string =>/);
  assert.match(screenSource, /extractRespondToUserContentFromArgs\(call\.arguments\)/);
  assert.match(screenSource, /looksLikeToolPayloadContent\(renderContent\)/);
  assert.match(screenSource, /const TOOL_PAYLOAD_PREFIX_REGEX = \/\^\(\?:using tool:\|tool result:\)\/i;/);
  assert.match(screenSource, /\^tool_call\$/);
  assert.match(screenSource, /if \(stripped\.length > 0\) \{\s+return stripped;\s+\}\s+return stripped === rawContent \? rawContent : '';/);
  assert.doesNotMatch(screenSource, /const TOOL_PAYLOAD_PREFIX_REGEX = .*input:\|output:/);
  assert.doesNotMatch(screenSource, /const looksLikeToolPayloadContent = \(content\?: string\): boolean => \{[\s\S]*?JSON\.parse\(trimmedContent\)/);
  assert.doesNotMatch(screenSource, /lastMessage\.content = \(lastMessage\.content \|\| ''\) \+\s*\(lastMessage\.content \? '\\n' : ''\) \+ historyMsg\.content/);
  assert.doesNotMatch(screenSource, /lastMessage\.content = \(lastMessage\.content \|\| ''\) \+\s*\(lastMessage\.content \? '\\n' : ''\) \+ msg\.content/);
  assert.doesNotMatch(screenSource, /return stripped \|\| rawContent;/);
});

test('bases assistant collapse decisions on visible content instead of raw tool payload metadata', () => {
  assert.match(screenSource, /const visibleMessageContent = getVisibleMessageContent\(m\);/);
  assert.match(screenSource, /const shouldCollapse = m\.role === 'assistant'\s+\? shouldCollapseMessage\(visibleMessageContent\)\s+: shouldCollapseMessage\(m\.content, m\.toolCalls, m\.toolResults\);/);
  assert.match(screenSource, /const effectiveShouldCollapse = hasRespondToUserContent \? false : shouldCollapse;/);
  assert.doesNotMatch(screenSource, /const shouldCollapse = shouldCollapseMessage\(m\.content, m\.toolCalls, m\.toolResults\);/);
  assert.match(screenSource, /const shouldShowCollapsedTextPreview =\s+visibleMessageContent\.length > 0 &&\s+!isExpanded &&\s+effectiveShouldCollapse;/);
});

test('derives tool execution card status from displayed non-meta tool entries', () => {
  assert.match(screenSource, /const displayToolEntries = \(m\.toolExecutions\?\.length/);
  assert.match(screenSource, /const renderedToolEntries =/);
  assert.match(screenSource, /const allSuccess =\s+hasToolResults && renderedToolEntries\.every\(entry => entry\.result\?\.success === true\);/);
  assert.match(screenSource, /const hasErrors = renderedToolEntries\.some\(entry => entry\.result\?\.success === false\);/);
  assert.match(screenSource, /const isPending =\s+renderedToolEntries\.some\(entry => !entry\.result\);/);
  assert.match(screenSource, /\{renderedToolEntries\.map\(\(\{ toolCall, label, origIdx, result: tcResult \}, tcIdx\) => \{/);
  assert.match(screenSource, /\{renderedToolEntries\.map\(\(\{ toolCall, label, origIdx, result, executionStats \}, idx\) => \{/);
  assert.doesNotMatch(screenSource, /const allSuccess = hasToolResults && m\.toolResults!\.every\(r => r\.success\);/);
  assert.doesNotMatch(screenSource, /const hasErrors = hasToolResults && m\.toolResults!\.some\(r => !r\.success\);/);
});

test('shows streaming tool execution stats without shared runtime chrome', () => {
  assert.match(screenSource, /type ToolExecutionStats = \{/);
  assert.match(screenSource, /const getAgentProgressStepToolExecutionStats = \(/);
  assert.match(screenSource, /currentToolExecutionStats\.push\(getAgentProgressStepToolExecutionStats\(step\)\)/);
  assert.match(screenSource, /toolExecutionStats: currentToolExecutionStats\.some\(Boolean\) \? currentToolExecutionStats : undefined/);
  assert.match(screenSource, /executionStats: currentToolExecutionStats\[index\]/);
  assert.match(screenSource, /const formatToolExecutionStatsLabel = \(stats\?: ToolExecutionStats \| null\): string \| null =>/);
  assert.match(screenSource, /const executionStatsLabel = formatToolExecutionStatsLabel\(executionStats\);/);
  assert.match(screenSource, /accessibilityLabel=\{`Tool execution stats: \$\{executionStatsLabel\}`\}/);
  assert.match(screenSource, /styles\.toolExecutionStatsText/);
  assert.doesNotMatch(screenSource, /@dotagents\/shared\/tool-execution-display/);
  assert.doesNotMatch(screenSource, /@dotagents\/shared\/session-presentation/);
});

test('keeps chat message and tool payload copy affordances local to mobile', () => {
  assert.match(screenSource, /import \* as Clipboard from 'expo-clipboard'/);
  assert.match(screenSource, /const MESSAGE_COPY_FEEDBACK_RESET_MS = 2_000/);
  assert.match(screenSource, /const \[copiedMessageIndex, setCopiedMessageIndex\] = useState<number \| null>\(null\)/);
  assert.match(screenSource, /const handleCopyMessage = useCallback\(async \(messageIndex: number, content: string\) =>/);
  assert.match(screenSource, /await Clipboard\.setStringAsync\(copyContent\)/);
  assert.match(screenSource, /showCopiedMessageFeedback\(messageIndex\)/);
  assert.match(screenSource, /const handleCopyToolPayload = useCallback\(async \(content: string\) =>/);
  assert.match(screenSource, /getToolPayloadCopyAccessibilityLabel\('input', toolNameLabel\)/);
  assert.match(screenSource, /getToolPayloadCopyAccessibilityLabel\('output', toolNameLabel\)/);
  assert.match(screenSource, /getToolPayloadCopyAccessibilityLabel\('error', toolNameLabel\)/);
  assert.match(screenSource, /styles\.messageActionButtonActive/);
  assert.match(screenSource, /styles\.toolDetailCopyButton/);
  assert.doesNotMatch(screenSource, /useChatMessageRuntimeClipboardChromeActionsState/);
  assert.doesNotMatch(screenSource, /getToolExecutionDetailMobileCopyButtonRenderState/);
});

test('keeps Codex thinking blocks display-only on mobile', () => {
  assert.match(screenSource, /const getRenderableMessageContent = \(message: ChatMessage\): string =>\s+message\.displayContent \?\? message\.content \?\? '';/);
  assert.match(screenSource, /displayContent: historyMsg\.displayContent/);
  assert.match(screenSource, /preserveDisplayContentFromProgress\(finalTurnMessages, progressMsgs\)/);
});

test('labels result-only tool entries without showing raw tool_call text', () => {
  assert.match(screenSource, /label: 'Tool result'/);
  assert.match(screenSource, /const toolPreview = label \?\? getCompactToolExecutionPreview\(toolCall, tcResult \?\? null\);/);
  assert.match(screenSource, /const toolNameLabel = label \?\? toolCall\.name;/);
  assert.match(screenSource, /\{toolNameLabel\}/);
});

test('colors compact tool call labels by result status', () => {
  assert.match(screenSource, /tcSuccess && styles\.toolCallCompactNameSuccess/);
  assert.match(screenSource, /tcError && styles\.toolCallCompactNameError/);
  assert.match(screenSource, /toolCallCompactNameSuccess:\s*\{[\s\S]*?color:\s*theme\.colors\.success/);
  assert.match(screenSource, /toolCallCompactNameError:\s*\{[\s\S]*?color:\s*theme\.colors\.destructive/);
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
