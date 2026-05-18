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

test('mobile video attachment card uses shared copy and accessibility labels', () => {
  assert.match(source, /getChatVideoAttachmentMobileRenderState/);
  assert.match(source, /const videoAttachmentRenderState = useMemo\(\s+\(\) => getChatVideoAttachmentMobileRenderState\(\{[\s\S]*?sourceUrl,[\s\S]*?label,[\s\S]*?colors: theme\.colors,[\s\S]*?isDark,[\s\S]*?loading,/);
  assert.match(source, /const videoAttachmentCopy = videoAttachmentRenderState\.copy;/);
  assert.match(source, /createChatVideoAttachmentMobilePropsParts,/);
  assert.match(source, /type ChatVideoAttachmentMobilePropsParts,/);
  assert.match(source, /type ChatVideoAttachmentMobilePropsStylesLike,/);
  assert.match(source, /type VideoAttachmentCardParts =\s+ChatVideoAttachmentMobilePropsParts<[\s\S]*?VideoAttachmentCardStyles,[\s\S]*?VideoAttachmentPressHandler/);
  assert.match(source, /const videoAttachmentParts: VideoAttachmentCardParts = createChatVideoAttachmentMobilePropsParts\(\{/);
  assert.match(conversationMediaAssetsSource, /export function createChatVideoAttachmentMobilePropsParts/);
  assert.match(source, /const videoAttachmentStyleSlots = useMemo\(\s+\(\) => createChatVideoAttachmentMobileStyleSlots\(\{/);
  assert.match(source, /const videoAttachmentParts: VideoAttachmentCardParts = createChatVideoAttachmentMobilePropsParts\(\{/);
  assert.match(conversationMediaAssetsSource, /text: `\$\{renderState\.copy\.glyphs\.link\} \$\{renderState\.displayLabel\}`/);
  assert.match(conversationMediaAssetsSource, /text: renderState\.title/);
  assert.match(conversationMediaAssetsSource, /text: renderState\.subtitle/);
  assert.match(conversationMediaAssetsSource, /text: renderState\.copy\.labels\.openExternally/);
  assert.match(source, /videoAttachmentCopy\.errors\.missingCredentials/);
  assert.match(source, /videoAttachmentCopy\.errors\.loadFallback/);
  assert.match(source, /formatVideoAttachmentRequestFailedMessage\(response\.status\)/);
  assert.match(source, /import \{ radius, spacing \} from '\.\/theme';/);
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
  assert.match(source, /createChatVideoAttachmentMobileStyleSlots,/);
  assert.match(source, /createChatVideoAttachmentMobilePropsParts,/);
  assert.match(source, /type VideoAttachmentCardStyles =\s+ChatVideoAttachmentMobilePropsStylesLike<\s+StyleProp<ViewStyle>,[\s\S]*?StyleProp<TextStyle>\s+>;/);
  assert.doesNotMatch(source, /type VideoAttachmentCardStyles = \{[\s\S]*?card: StyleProp<ViewStyle>;[\s\S]*?errorText: StyleProp<TextStyle>;[\s\S]*?\};/);
  assert.match(source, /createChatVideoAttachmentMobileStyleSlots\(\{\s+renderState: videoAttachmentRenderState,\s+spacing,\s+radius,\s+\}\)/);
  assert.match(source, /card:\s*\{\s+\.\.\.videoAttachmentStyleSlots\.card,\s+\}/);
  assert.match(source, /header:\s*\{\s+\.\.\.videoAttachmentStyleSlots\.header,\s+\}/);
  assert.match(source, /loadButton:\s*\{\s+\.\.\.videoAttachmentStyleSlots\.loadButton,\s+\}/);
  assert.match(source, /loadButtonPressed:\s*\{\s+\.\.\.videoAttachmentStyleSlots\.loadButtonPressed,\s+\}/);
  assert.match(source, /loadButtonDisabled:\s*\{\s+\.\.\.videoAttachmentStyleSlots\.loadButtonDisabled,\s+\}/);
  assert.match(source, /playIconWrapper:\s*\{\s+\.\.\.videoAttachmentStyleSlots\.playIconWrapper,\s+\}/);
  assert.match(source, /textWrapper:\s*\{\s+\.\.\.videoAttachmentStyleSlots\.textWrapper,\s+\}/);
  assert.match(source, /title:\s*\{\s+\.\.\.videoAttachmentStyleSlots\.title,\s+\}/);
  assert.match(source, /subtitle:\s*\{\s+\.\.\.videoAttachmentStyleSlots\.subtitle,\s+\}/);
  assert.match(source, /video:\s*\{\s+\.\.\.videoAttachmentStyleSlots\.video,\s+\}/);
  assert.match(source, /fallbackLink:\s*\{\s+\.\.\.videoAttachmentStyleSlots\.fallbackLink,\s+\}/);
  assert.match(source, /fallbackLinkPressed:\s*\{\s+\.\.\.videoAttachmentStyleSlots\.fallbackLinkPressed,\s+\}/);
  assert.match(source, /fallbackLinkText:\s*\{\s+\.\.\.videoAttachmentStyleSlots\.fallbackLinkText,\s+\}/);
  assert.match(source, /externalLink:\s*\{\s+\.\.\.videoAttachmentStyleSlots\.externalLink,\s+\}/);
  assert.match(source, /externalLinkPressed:\s*\{\s+\.\.\.videoAttachmentStyleSlots\.externalLinkPressed,\s+\}/);
  assert.match(source, /errorText:\s*\{\s+\.\.\.videoAttachmentStyleSlots\.errorText,\s+\}/);
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
