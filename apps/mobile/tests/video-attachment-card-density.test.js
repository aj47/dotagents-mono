const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'ui', 'VideoAttachmentCard.tsx'),
  'utf8',
);
const conversationMediaAssetsSource = fs.readFileSync(
  path.join(__dirname, '..', '..', '..', 'packages', 'shared', 'src', 'conversation-media-assets.ts'),
  'utf8',
);
const sessionPresentationSource = fs.readFileSync(
  path.join(__dirname, '..', '..', '..', 'packages', 'shared', 'src', 'session-presentation.ts'),
  'utf8',
);
const chatRuntimeMobileStylesSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'ui', 'ChatRuntimeMobileStyles.ts'),
  'utf8',
);

test('mobile video attachment card uses shared copy and accessibility labels', () => {
  assert.match(source, /export interface VideoAttachmentCardProps/);
  assert.match(source, /useChatRuntimeVideoAttachmentMobileStyleSlots/);
  assert.match(chatRuntimeMobileStylesSource, /getChatVideoAttachmentMobileRenderState/);
  assert.match(sessionPresentationSource, /type ChatVideoAttachmentMobileRenderState,/);
  assert.match(chatRuntimeMobileStylesSource, /type ChatVideoAttachmentMobileRenderState as SharedChatVideoAttachmentMobileRenderState,/);
  assert.match(chatRuntimeMobileStylesSource, /export type ChatRuntimeVideoAttachmentMobileRenderState =\s+SharedChatVideoAttachmentMobileRenderState;/);
  assert.doesNotMatch(chatRuntimeMobileStylesSource, /ReturnType<typeof getChatVideoAttachmentMobileRenderState>/);
  assert.match(source, /const \{\s+videoAttachmentRenderState,[\s\S]*?videoAttachmentStyles: styles,[\s\S]*?\} = useChatRuntimeVideoAttachmentMobileStyleSlots\(\{[\s\S]*?sourceUrl,[\s\S]*?label,[\s\S]*?loading,[\s\S]*?\}\);/);
  assert.match(source, /const videoAttachmentCopy = videoAttachmentRenderState\.copy;/);
  assert.match(source, /createChatVideoAttachmentMobilePropsParts,/);
  assert.match(source, /type ChatVideoAttachmentMobilePropsParts,/);
  assert.match(source, /type ChatVideoAttachmentMobileStyleSheetSlots,/);
  assert.match(source, /type VideoAttachmentCardParts =\s+ChatVideoAttachmentMobilePropsParts<[\s\S]*?VideoAttachmentCardStyles,[\s\S]*?VideoAttachmentPressHandler/);
  assert.match(source, /const videoAttachmentParts = useMemo<VideoAttachmentCardParts>\(\s+\(\) => createChatVideoAttachmentMobilePropsParts\(\{/);
  assert.match(conversationMediaAssetsSource, /export function createChatVideoAttachmentMobilePropsParts/);
  assert.match(chatRuntimeMobileStylesSource, /createChatRuntimeVideoAttachmentStyleSheetSlots/);
  assert.match(chatRuntimeMobileStylesSource, /createChatVideoAttachmentMobileStyleSheetSlots/);
  assert.doesNotMatch(source, /const videoAttachmentParts: VideoAttachmentCardParts = createChatVideoAttachmentMobilePropsParts/);
  assert.match(conversationMediaAssetsSource, /text: `\$\{renderState\.copy\.glyphs\.link\} \$\{renderState\.displayLabel\}`/);
  assert.match(conversationMediaAssetsSource, /text: renderState\.title/);
  assert.match(conversationMediaAssetsSource, /text: renderState\.subtitle/);
  assert.match(conversationMediaAssetsSource, /text: renderState\.copy\.labels\.openExternally/);
  assert.match(source, /videoAttachmentCopy\.errors\.missingCredentials/);
  assert.match(source, /videoAttachmentCopy\.errors\.loadFallback/);
  assert.match(source, /formatVideoAttachmentRequestFailedMessage\(response\.status\)/);
  assert.doesNotMatch(source, /import \{ radius, spacing \} from '\.\/theme';/);
  assert.match(conversationMediaAssetsSource, /accessibilityLabel: renderState\.loadButton\.accessibilityLabel/);
  assert.match(conversationMediaAssetsSource, /onPress: onLoadVideo/);
  assert.match(source, /<VideoView\s+\{\.\.\.videoAttachmentParts\.video\.props\}[\s\S]{0,220}player=\{player\}/);
  assert.match(conversationMediaAssetsSource, /accessibilityRole: renderState\.loadButton\.accessibilityRole/);
  assert.match(conversationMediaAssetsSource, /accessibilityRole: renderState\.fallbackLink\.accessibilityRole/);
  assert.match(conversationMediaAssetsSource, /accessibilityRole: renderState\.externalLink\.accessibilityRole/);
  assert.match(conversationMediaAssetsSource, /accessibilityLabel: renderState\.fallbackLink\.accessibilityLabel/);
  assert.match(conversationMediaAssetsSource, /accessibilityLabel: renderState\.externalLink\.accessibilityLabel/);
  assert.match(conversationMediaAssetsSource, /accessibilityState: renderState\.loadButton\.accessibilityState/);
  assert.doesNotMatch(source, /getChatVideoAttachmentCopyState/);
  assert.doesNotMatch(source, /getChatVideoAttachmentMobileSurfaceColors/);
  assert.doesNotMatch(source, /getChatVideoAttachmentMobileSurfaceState/);
  assert.doesNotMatch(source, /getVideoAttachmentLoadAccessibilityLabel/);
  assert.doesNotMatch(source, /getVideoAttachmentOpenLinkAccessibilityLabel/);
  assert.doesNotMatch(source, /getVideoAttachmentPlayAccessibilityLabel/);
  assert.doesNotMatch(source, /accessibilityRole="(button|link)"/);
  assert.doesNotMatch(source, /accessibilityLabel=\{`Open video link:/);
  assert.doesNotMatch(source, /Loads only when you tap play/);
  assert.doesNotMatch(source, /Open externally/);
  assert.doesNotMatch(source, /Missing video asset credentials\./);
  assert.doesNotMatch(source, /Unable to load this video\./);
  assert.doesNotMatch(source, /Video request failed \(\$\{response\.status\}\)/);
  assert.doesNotMatch(source, /CHAT_VIDEO_ATTACHMENT_PRESENTATION/);
});

test('mobile video attachment card reads compact sizing from shared surface tokens', () => {
  assert.match(source, /useChatRuntimeVideoAttachmentMobileStyleSlots/);
  assert.doesNotMatch(source, /createChatVideoAttachmentMobileStyleSlots,/);
  assert.match(source, /createChatVideoAttachmentMobilePropsParts,/);
  assert.match(source, /type VideoAttachmentCardStyles = ChatVideoAttachmentMobileStyleSheetSlots;/);
  assert.doesNotMatch(source, /type VideoAttachmentCardStyles = \{[\s\S]*?card: StyleProp<ViewStyle>;[\s\S]*?errorText: StyleProp<TextStyle>;[\s\S]*?\};/);
  assert.match(chatRuntimeMobileStylesSource, /createChatVideoAttachmentMobileStyleSheetSlots\(\{[\s\S]*?renderState,[\s\S]*?spacing,[\s\S]*?radius,/);
  assert.doesNotMatch(source, /videoAttachmentStyleSlots\./);
  assert.match(source, /<Ionicons\s+\{\.\.\.videoAttachmentParts\.playIcon\.props\}/);
  assert.match(source, /<ActivityIndicator \{\.\.\.videoAttachmentParts\.loadingIndicator\.props\} \/>/);
  assert.match(source, /<Text \{\.\.\.videoAttachmentParts\.externalLink\.label\.props\}>/);
  assert.match(conversationMediaAssetsSource, /style: \(\{ pressed \}\) => \[\s+styles\.fallbackLink,\s+pressed && styles\.fallbackLinkPressed,\s+\]/);
  assert.match(conversationMediaAssetsSource, /style: \(\{ pressed \}\) => pressed && styles\.externalLinkPressed/);
  assert.doesNotMatch(source, /borderColor:\s*videoAttachmentSurfaceColors\.card\.borderColor/);
  assert.doesNotMatch(source, /borderRadius:\s*radius\[videoAttachmentSurface\.card\.borderRadius\]/);
  assert.doesNotMatch(source, /backgroundColor:\s*videoAttachmentSurfaceColors\.card\.backgroundColor/);
  assert.doesNotMatch(source, /padding:\s*spacing\[videoAttachmentSurface\.header\.padding\]/);
  assert.doesNotMatch(source, /padding:\s*spacing\[videoAttachmentSurface\.loadButton\.padding\]/);
  assert.doesNotMatch(source, /width:\s*videoAttachmentSurface\.playIconWrapper\.size/);
  assert.doesNotMatch(source, /height:\s*videoAttachmentSurface\.video\.height/);
  assert.doesNotMatch(source, /opacity:\s*videoAttachmentSurface\.(fallbackLink|externalLink|loadButton)\./);
  assert.doesNotMatch(source, /\{\s*marginTop:\s*spacing\.xs\s*\}/);
  assert.doesNotMatch(source, /alignItems:\s*'center'/);
  assert.doesNotMatch(source, /justifyContent:\s*'center'/);
  assert.doesNotMatch(source, /height:\s*220/);
  assert.doesNotMatch(source, /backgroundAlphaHex/);
  assert.doesNotMatch(source, /theme\.colors\[videoAttachmentSurface\./);
  assert.doesNotMatch(source, /hexToRgba\(/);
  assert.doesNotMatch(source, /videoAttachmentRenderState\.(title|subtitle|displayLabel)/);
  assert.doesNotMatch(source, /videoAttachmentRenderState\.(fallbackLink|loadButton|externalLink)\.(accessibilityRole|accessibilityLabel|accessibilityState)/);
  assert.doesNotMatch(source, /rgba\(255,255,255,0\.04\)|rgba\(0,0,0,0\.03\)/);
  assert.doesNotMatch(source, /CHAT_VIDEO_ATTACHMENT_SURFACE_PRESENTATION/);
  assert.doesNotMatch(source, /theme\.colors\.(background|foreground|card|border|muted|mutedForeground|primary|primaryForeground|destructive|success|warning|info)/);
});
