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
  assert.match(screenSource, /const getVisibleMessageContent = \(message: ChatMessage\): string =>/);
  assert.match(screenSource, /extractRespondToUserContentFromArgs\(call\.arguments\)/);
  assert.match(screenSource, /looksLikeToolPayloadContent\(message\.content\)/);
  assert.match(screenSource, /const TOOL_PAYLOAD_PREFIX_REGEX = \/\^\(\?:using tool:\|tool result:\)\/i;/);
  assert.doesNotMatch(screenSource, /const TOOL_PAYLOAD_PREFIX_REGEX = .*input:\|output:/);
  assert.doesNotMatch(screenSource, /const looksLikeToolPayloadContent = \(content\?: string\): boolean => \{[\s\S]*?JSON\.parse\(trimmedContent\)/);
  assert.doesNotMatch(screenSource, /lastMessage\.content = \(lastMessage\.content \|\| ''\) \+\s*\(lastMessage\.content \? '\\n' : ''\) \+ historyMsg\.content/);
  assert.doesNotMatch(screenSource, /lastMessage\.content = \(lastMessage\.content \|\| ''\) \+\s*\(lastMessage\.content \? '\\n' : ''\) \+ msg\.content/);
});

test('bases assistant collapse decisions on visible content instead of raw tool payload metadata', () => {
  assert.match(screenSource, /const visibleMessageContent = getVisibleMessageContent\(m\);\s+const shouldCollapse = m\.role === 'assistant'\s+\? shouldCollapseMessage\(visibleMessageContent\)\s+: shouldCollapseMessage\(m\.content, m\.toolCalls, m\.toolResults\);/);
  assert.doesNotMatch(screenSource, /const shouldCollapse = shouldCollapseMessage\(m\.content, m\.toolCalls, m\.toolResults\);/);
  assert.match(screenSource, /const shouldShowCollapsedTextPreview =\s+visibleMessageContent\.length > 0 &&\s+!isExpanded &&\s+shouldCollapse;/);
});

test('keeps the TTS control inline with assistant message text instead of on a detached row', () => {
  assert.match(screenSource, /assistantMessageRow:\s*\{[\s\S]*?flexDirection:\s*'row',[\s\S]*?alignItems:\s*'flex-start'/);
  assert.match(screenSource, /<View style=\{m\.role === 'assistant' \? styles\.assistantMessageRow : undefined\}>[\s\S]*?speakMessage\(i, visibleMessageContent\)/);
});
