const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'ui', 'VideoAttachmentCard.tsx'),
  'utf8',
);

test('mobile video attachment card uses shared copy and accessibility labels', () => {
  assert.match(source, /getChatVideoAttachmentMobileRenderState/);
  assert.match(source, /const videoAttachmentRenderState = useMemo\(\s+\(\) => getChatVideoAttachmentMobileRenderState\(\{[\s\S]*?sourceUrl,[\s\S]*?label,[\s\S]*?colors: theme\.colors,[\s\S]*?isDark,[\s\S]*?loading,/);
  assert.match(source, /const videoAttachmentCopy = videoAttachmentRenderState\.copy;/);
  assert.match(source, /const videoAttachmentSurface = videoAttachmentRenderState\.surface;/);
  assert.match(source, /const videoAttachmentSurfaceColors = videoAttachmentRenderState\.colors;/);
  assert.match(source, /const displayLabel = videoAttachmentRenderState\.displayLabel;/);
  assert.match(source, /videoAttachmentCopy\.glyphs\.link/);
  assert.match(source, /videoAttachmentRenderState\.title/);
  assert.match(source, /videoAttachmentRenderState\.subtitle/);
  assert.match(source, /videoAttachmentCopy\.labels\.openExternally/);
  assert.match(source, /videoAttachmentCopy\.errors\.missingCredentials/);
  assert.match(source, /videoAttachmentCopy\.errors\.loadFallback/);
  assert.match(source, /formatVideoAttachmentRequestFailedMessage\(response\.status\)/);
  assert.match(source, /import \{ radius, spacing \} from '\.\/theme';/);
  assert.match(source, /accessibilityLabel=\{videoAttachmentRenderState\.loadButton\.accessibilityLabel\}/);
  assert.match(source, /accessibilityLabel=\{videoAttachmentRenderState\.loadButton\.accessibilityLabel\}[\s\S]{0,220}onPress=\{loadVideo\}/);
  assert.match(source, /accessibilityLabel=\{videoAttachmentRenderState\.video\.accessibilityLabel\}[\s\S]{0,220}player=\{player\}/);
  assert.match(source, /accessibilityRole=\{videoAttachmentRenderState\.loadButton\.accessibilityRole\}/);
  assert.match(source, /accessibilityRole=\{videoAttachmentRenderState\.fallbackLink\.accessibilityRole\}/);
  assert.match(source, /accessibilityRole=\{videoAttachmentRenderState\.externalLink\.accessibilityRole\}/);
  assert.match(source, /accessibilityLabel=\{videoAttachmentRenderState\.fallbackLink\.accessibilityLabel\}/);
  assert.match(source, /accessibilityLabel=\{videoAttachmentRenderState\.externalLink\.accessibilityLabel\}/);
  assert.match(source, /accessibilityState=\{videoAttachmentRenderState\.loadButton\.accessibilityState\}/);
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
  assert.match(source, /const videoAttachmentSurface = videoAttachmentRenderState\.surface;/);
  assert.match(source, /const videoAttachmentSurfaceColors = videoAttachmentRenderState\.colors;/);
  assert.match(source, /borderColor:\s*videoAttachmentSurfaceColors\.card\.borderColor/);
  assert.match(source, /borderRadius:\s*radius\[videoAttachmentSurface\.card\.borderRadius\]/);
  assert.match(source, /backgroundColor:\s*videoAttachmentSurfaceColors\.card\.backgroundColor/);
  assert.match(source, /padding:\s*spacing\[videoAttachmentSurface\.header\.padding\]/);
  assert.match(source, /loadButton:\s*\{[\s\S]*?flexDirection:\s*videoAttachmentSurface\.loadButton\.flexDirection,[\s\S]*?padding:\s*spacing\[videoAttachmentSurface\.loadButton\.padding\]/);
  assert.match(source, /playIconWrapper:\s*\{[\s\S]*?width:\s*videoAttachmentSurface\.playIconWrapper\.size,[\s\S]*?alignItems:\s*videoAttachmentSurface\.playIconWrapper\.alignItems,[\s\S]*?justifyContent:\s*videoAttachmentSurface\.playIconWrapper\.justifyContent,[\s\S]*?backgroundColor:\s*videoAttachmentSurfaceColors\.playIconWrapper\.backgroundColor/);
  assert.match(source, /name=\{videoAttachmentSurface\.playIcon\.name\}/);
  assert.match(source, /color=\{videoAttachmentSurfaceColors\.playIcon\.color\}/);
  assert.match(source, /height:\s*videoAttachmentSurface\.video\.height/);
  assert.match(source, /<Text style=\{\[styles\.subtitle, styles\.externalLink\]\}>/);
  assert.match(source, /fallbackLinkPressed:\s*\{[\s\S]*?opacity:\s*videoAttachmentSurface\.fallbackLink\.pressedOpacity/);
  assert.match(source, /externalLinkPressed:\s*\{[\s\S]*?opacity:\s*videoAttachmentSurface\.externalLink\.pressedOpacity/);
  assert.match(source, /style=\{\(\{ pressed \}\) => \[styles\.fallbackLink, pressed && styles\.fallbackLinkPressed\]\}/);
  assert.match(source, /style=\{\(\{ pressed \}\) => pressed && styles\.externalLinkPressed\}/);
  assert.doesNotMatch(source, /\{\s*marginTop:\s*spacing\.xs\s*\}/);
  assert.doesNotMatch(source, /alignItems:\s*'center'/);
  assert.doesNotMatch(source, /justifyContent:\s*'center'/);
  assert.doesNotMatch(source, /height:\s*220/);
  assert.doesNotMatch(source, /backgroundAlphaHex/);
  assert.doesNotMatch(source, /theme\.colors\[videoAttachmentSurface\./);
  assert.doesNotMatch(source, /hexToRgba\(/);
  assert.doesNotMatch(source, /rgba\(255,255,255,0\.04\)|rgba\(0,0,0,0\.03\)/);
  assert.doesNotMatch(source, /CHAT_VIDEO_ATTACHMENT_SURFACE_PRESENTATION/);
  assert.doesNotMatch(source, /theme\.colors\.(background|foreground|card|border|muted|mutedForeground|primary|primaryForeground|destructive|success|warning|info)/);
});
