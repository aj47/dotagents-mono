const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const chipSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'ui', 'HandsFreeStatusChip.tsx'),
  'utf8'
);
const chatRuntimeMobileStylesSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'ui', 'ChatRuntimeMobileStyles.ts'),
  'utf8'
);
const sessionPresentationSource = fs.readFileSync(
  path.join(__dirname, '..', '..', '..', 'packages', 'shared', 'src', 'session-presentation.ts'),
  'utf8'
);

test('uses shared hands-free status chip colors and surface tokens', () => {
  assert.match(chipSource, /export interface HandsFreeStatusChipProps/);
  assert.match(chipSource, /useChatRuntimeHandsFreeStatusChipMobileStyleSlots/);
  assert.match(chipSource, /createHandsFreeStatusChipMobilePropsParts/);
  assert.match(chipSource, /type HandsFreeStatusChipMobilePropsParts,/);
  assert.match(chipSource, /type HandsFreeStatusChipMobileStyleSheetSlots,/);
  assert.match(chipSource, /type HandsFreeStatusChipStyles = HandsFreeStatusChipMobileStyleSheetSlots;/);
  assert.doesNotMatch(chipSource, /type HandsFreeStatusChipStyles = \{[\s\S]*?container: StyleProp<ViewStyle>;[\s\S]*?label: StyleProp<TextStyle>;[\s\S]*?subtitle: StyleProp<TextStyle>;[\s\S]*?\};/);
  assert.match(chipSource, /type HandsFreeStatusChipParts =\s+HandsFreeStatusChipMobilePropsParts<HandsFreeStatusChipStyles>;/);
  assert.match(chipSource, /const \{\s+handsFreeStatusChipRenderState,[\s\S]*?handsFreeStatusChipStyles,[\s\S]*?\} = useChatRuntimeHandsFreeStatusChipMobileStyleSlots\(\{[\s\S]*?phase,[\s\S]*?label,[\s\S]*?subtitle,[\s\S]*?\}\);/);
  assert.match(chipSource, /const statusChipParts = useMemo<HandsFreeStatusChipParts>\(\s+\(\) => createHandsFreeStatusChipMobilePropsParts\(\{[\s\S]*?renderState: handsFreeStatusChipRenderState,[\s\S]*?styles: handsFreeStatusChipStyles,/);
  assert.match(chipSource, /<View\s+\{\.\.\.statusChipParts\.container\.props\}>/);
  assert.match(chipSource, /<Text\s+\{\.\.\.statusChipParts\.label\.props\}>\{statusChipParts\.label\.text\}<\/Text>/);
  assert.match(chipSource, /\{statusChipParts\.label\.text\}/);
  assert.match(chipSource, /\{statusChipParts\.subtitle \? \(/);
  assert.match(chipSource, /<Text\s+\{\.\.\.statusChipParts\.subtitle\.props\}>/);
  assert.match(chipSource, /\{statusChipParts\.subtitle\.text\}/);
  assert.doesNotMatch(chipSource, /style=\{statusChipParts\.(container|label|subtitle)\.style\}/);
  assert.doesNotMatch(chipSource, /numberOfLines=\{statusChipParts\.subtitle\.numberOfLines\}/);
  assert.doesNotMatch(chipSource, /numberOfLines=\{2\}/);
  assert.match(sessionPresentationSource, /export \{[\s\S]*?getHandsFreeStatusChipMobileRenderState,[\s\S]*?HandsFreeStatusChipMobileRenderState,[\s\S]*?\} from "\.\/hands-free-controller"/);
  assert.match(chatRuntimeMobileStylesSource, /type HandsFreeStatusChipMobileRenderState as SharedHandsFreeStatusChipMobileRenderState,/);
  assert.match(chatRuntimeMobileStylesSource, /export type ChatRuntimeHandsFreeStatusChipMobileRenderState =\s+SharedHandsFreeStatusChipMobileRenderState;/);
  assert.match(chatRuntimeMobileStylesSource, /getHandsFreeStatusChipMobileRenderState\(\{[\s\S]*?phase,[\s\S]*?label,[\s\S]*?subtitle,[\s\S]*?colors: theme\.colors,/);
  assert.match(chatRuntimeMobileStylesSource, /createHandsFreeStatusChipMobileStyleSheetSlots\(\{[\s\S]*?renderState,[\s\S]*?spacing,[\s\S]*?radius,/);
  assert.doesNotMatch(chatRuntimeMobileStylesSource, /ReturnType<typeof getHandsFreeStatusChipMobileRenderState>/);
  assert.doesNotMatch(chipSource, /getHandsFreeStatusChipMobileRenderState,/);
  assert.doesNotMatch(chipSource, /createHandsFreeStatusChipMobileStyleSheetSlots,/);
  assert.doesNotMatch(chipSource, /StyleSheet\.create/);
  assert.doesNotMatch(chipSource, /from '\.\/theme'/);
  assert.doesNotMatch(chipSource, /from '\.\/ThemeProvider'/);
  assert.doesNotMatch(chipSource, /alignSelf:\s*'flex-start'/);
  assert.doesNotMatch(chipSource, /getHandsFreeComposerMobileSurfaceState/);
  assert.doesNotMatch(chipSource, /getHandsFreeStatusChipMobileColors\(phase, theme\.colors\)/);
  assert.doesNotMatch(chipSource, /function createStyles/);
  assert.doesNotMatch(chipSource, /function createColorStyles/);
  assert.doesNotMatch(chipSource, /function getPhaseColors/);
  assert.doesNotMatch(chipSource, /case 'processing'/);
  assert.doesNotMatch(chipSource, /\{ color: colors\.textColor \}/);
  assert.doesNotMatch(chipSource, /style=\{\[[\s\S]{0,160}\{\s*backgroundColor: colors\.backgroundColor/);
  assert.doesNotMatch(chipSource, /#f59e0b/);
  assert.doesNotMatch(chipSource, /#8b5cf6/);
  assert.doesNotMatch(chipSource, /HANDS_FREE_COMPOSER_PRESENTATION\.surface\.mobile/);
});
