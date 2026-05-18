const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const sheetSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'ui', 'AgentSelectorSheet.tsx'),
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
const selectorOptionsSource = fs.readFileSync(
  path.join(__dirname, '..', '..', '..', 'packages', 'shared', 'src', 'agent-selector-options.ts'),
  'utf8'
);
const selectorOptionsTestSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'ui', 'agentSelectorOptions.test.ts'),
  'utf8'
);

test('keeps the mobile agent selector close affordance in a compact header instead of a footer band', () => {
  assert.match(sheetSource, /<View \{\.\.\.agentSelectorSheetParts\.header\.props\}>/);
  assert.match(sheetSource, /useChatRuntimeAgentSelectorSheetMobileStyleSlots/);
  assert.match(chatRuntimeMobileStylesSource, /getAgentSelectorMobileRenderState/);
  assert.match(sheetSource, /createAgentSelectorSheetMobilePropsParts,/);
  assert.match(sheetSource, /type AgentSelectorSheetMobilePropsParts,/);
  assert.match(sheetSource, /type AgentSelectorSheetParts =\s+AgentSelectorSheetMobilePropsParts<[\s\S]*?AgentSelectorSheetStyles,[\s\S]*?AgentSelectorSheetCloseHandler,[\s\S]*?AgentSelectorSheetRetryHandler/);
  assert.match(sheetSource, /const agentSelectorSheetParts = useMemo<AgentSelectorSheetParts>\(\s+\(\) => createAgentSelectorSheetMobilePropsParts\(\{[\s\S]*?visible,[\s\S]*?renderState: agentSelectorRenderState,[\s\S]*?styles,[\s\S]*?sheetBottomPadding: agentSelectorSheetBottomPadding,[\s\S]*?safeAreaBottom: insets\.bottom,[\s\S]*?isLoading,[\s\S]*?error,[\s\S]*?hasProfiles: profiles\.length > 0,[\s\S]*?onClose,[\s\S]*?onRetry: fetchProfiles,/);
  assert.doesNotMatch(sheetSource, /const agentSelectorSheetParts: AgentSelectorSheetParts = createAgentSelectorSheetMobilePropsParts/);
  assert.match(sheetSource, /<Modal\s+\{\.\.\.agentSelectorSheetParts\.modal\.props\}/);
  assert.match(sheetSource, /<Pressable \{\.\.\.agentSelectorSheetParts\.backdrop\.props\}>/);
  assert.match(sheetSource, /<View \{\.\.\.agentSelectorSheetParts\.backdropSpacer\.props\} \/>/);
  assert.match(sheetSource, /<TouchableOpacity \{\.\.\.agentSelectorSheetParts\.closeButton\.props\}>/);
  assert.match(sheetSource, /<Ionicons\s+\{\.\.\.agentSelectorSheetParts\.closeButton\.icon\.props\}/);
  assert.match(chatRuntimeMobileStylesSource, /const agentSelectorStyleSheetSlots = useMemo\(\s+\(\) => createChatRuntimeAgentSelectorSheetStyleSheetSlots\(\{/);
  assert.match(chatRuntimeMobileStylesSource, /StyleSheet\.create\(\{\s*\.\.\.agentSelectorStyleSheetSlots\s*\}\)/);
  assert.doesNotMatch(sheetSource, /const agentSelectorStyleSheetSlots = React\.useMemo/);
  assert.doesNotMatch(sheetSource, /StyleSheet\.create/);
  assert.match(sheetSource, /<View \{\.\.\.agentSelectorSheetParts\.sheet\.props\}>/);
  assert.doesNotMatch(sheetSource, /<View style=\{\{ flex: 1 \}\} \/>/);
  assert.doesNotMatch(sheetSource, /headerCloseButtonText/);
  assert.doesNotMatch(sheetSource, /agentSelectorCopy\.closeLabel/);
  assert.doesNotMatch(sheetSource, /<Text style=\{styles\.closeButtonText\}>Cancel<\/Text>/);
  assert.doesNotMatch(sheetSource, /const agentSelectorCloseButton = agentSelectorRenderState\.closeButton;/);
  assert.doesNotMatch(sheetSource, /accessibilityLabel=\{agentSelectorCloseButton\.accessibilityLabel\}/);
  assert.doesNotMatch(sheetSource, /activeOpacity=\{agentSelectorCloseButton\.activeOpacity\}/);
  assert.doesNotMatch(sheetSource, /accessibilityRole=\{agentSelectorCloseButton\.accessibilityRole\}/);
  assert.doesNotMatch(sheetSource, /name=\{agentSelectorCloseButton\.icon\.name\}/);
  assert.doesNotMatch(sheetSource, /style=\{\[styles\.sheet, \{ paddingBottom: insets\.bottom \+ agentSelectorStyleSlots\.sheet\.paddingBottom \}\]\}/);
  assert.doesNotMatch(sheetSource, /backdropSpacer:\s*\{[\s\S]*?flex:\s*agentSelectorSurface\.backdropSpacer\.flex/);
  assert.doesNotMatch(sheetSource, /headerCloseButton:\s*\{[\s\S]*?width:\s*agentSelectorSurface\.headerCloseButton\.width/);
});

test('keeps the mobile agent selector title shrink-safe beside the header close action', () => {
  assert.match(chatRuntimeMobileStylesSource, /createAgentSelectorMobileStyleSheetSlots\(\{\s+renderState,[\s\S]*?spacing,[\s\S]*?radius,/);
  assert.doesNotMatch(sheetSource, /createAgentSelectorMobileStyleSheetSlots\(\{/);
  assert.match(selectorOptionsSource, /export type AgentSelectorMobileStyleSheetSlots =/);
  assert.match(selectorOptionsSource, /export function createAgentSelectorMobileStyleSheetSlots/);
  assert.doesNotMatch(sheetSource, /header:\s*\{\s+\.\.\.agentSelectorStyleSlots\.header,/);
  assert.doesNotMatch(sheetSource, /title:\s*\{\s+\.\.\.agentSelectorStyleSlots\.title,/);
  assert.match(sheetSource, /<Text \{\.\.\.agentSelectorSheetParts\.title\.props\}>/);
  assert.match(sheetSource, /\{agentSelectorSheetParts\.title\.text\}/);
  assert.doesNotMatch(sheetSource, /<Text style=\{styles\.title\} numberOfLines=\{1\}>/);
  assert.doesNotMatch(sheetSource, /numberOfLines=\{agentSelectorSurface\.title\.numberOfLines\}/);
  assert.doesNotMatch(sheetSource, /header:\s*\{\s*flexDirection:\s*'row',\s*alignItems:\s*'center',/);
  assert.doesNotMatch(sheetSource, /title:\s*\{\s*flex:\s*1,\s*minWidth:\s*0,/);
  assert.doesNotMatch(sheetSource, /flexDirection:\s*agentSelectorSurface\.header\.flexDirection/);
  assert.doesNotMatch(sheetSource, /flex:\s*agentSelectorSurface\.title\.flex/);
});

test('uses shared selector presentation tokens and desktop-like avatar rows', () => {
  assert.match(sheetSource, /from '@dotagents\/shared\/session-presentation';/);
  assert.doesNotMatch(sheetSource, /from '@dotagents\/shared\/agent-selector-options';/);
  assert.match(selectorOptionsTestSource, /from '@dotagents\/shared\/session-presentation';/);
  assert.doesNotMatch(selectorOptionsTestSource, /from '@dotagents\/shared\/agent-selector-options';/);
  assert.match(sessionPresentationSource, /export \{[\s\S]*?buildSelectorProfiles,[\s\S]*?createAgentSelectorProfileItemMobilePropsParts,[\s\S]*?createAgentSelectorSheetMobilePropsParts,[\s\S]*?createAgentSelectorMobileStyleSheetSlots,[\s\S]*?createAgentSelectorMobileStyleSlots,[\s\S]*?getAgentSelectorMobileProfileItemRenderState,[\s\S]*?getAgentSelectorMobileRenderState,[\s\S]*?type AgentSelectorMobileRenderState,[\s\S]*?type AgentSelectorMobileStyleSheetSlots,[\s\S]*?type AgentSelectorMobileStyleSheetSlotsInput,[\s\S]*?type AgentSelectorProfileItemMobilePropsParts,[\s\S]*?type AgentSelectorProfileItemMobilePropsPartsInput,[\s\S]*?type AgentSelectorSheetMobilePropsParts,[\s\S]*?type AgentSelectorSheetMobilePropsPartsInput,[\s\S]*?type SelectableAgentProfile,[\s\S]*?\} from "\.\/agent-selector-options"/);
  assert.match(chatRuntimeMobileStylesSource, /type AgentSelectorMobileRenderState as SharedAgentSelectorMobileRenderState,/);
  assert.match(chatRuntimeMobileStylesSource, /export type ChatRuntimeAgentSelectorSheetMobileRenderState =\s+SharedAgentSelectorMobileRenderState;/);
  assert.doesNotMatch(chatRuntimeMobileStylesSource, /ReturnType<typeof getAgentSelectorMobileRenderState>/);
  assert.match(sheetSource, /type ChatRuntimeAgentSelectorSheetMobileRenderState,/);
  assert.match(sheetSource, /renderState: ChatRuntimeAgentSelectorSheetMobileRenderState;/);
  assert.doesNotMatch(sheetSource, /ReturnType<typeof useChatRuntimeAgentSelectorSheetMobileStyleSlots>/);
  assert.match(chatRuntimeMobileStylesSource, /getAgentSelectorMobileRenderState/);
  assert.doesNotMatch(sheetSource, /getAgentSelectorMobileRenderState/);
  assert.match(sheetSource, /getAgentSelectorMobileProfileItemRenderState/);
  assert.match(sheetSource, /createAgentSelectorProfileItemMobilePropsParts,/);
  assert.match(sheetSource, /createAgentSelectorSheetMobilePropsParts,/);
  assert.doesNotMatch(sheetSource, /type AgentSelectorProfileItemMobilePropsStylesLike,/);
  assert.doesNotMatch(sheetSource, /type AgentSelectorSheetMobilePropsStylesLike,/);
  assert.match(sheetSource, /const \{\s+agentSelectorRenderState,[\s\S]*?agentSelectorStyles: styles,[\s\S]*?agentSelectorSheetBottomPadding,[\s\S]*?\} = useChatRuntimeAgentSelectorSheetMobileStyleSlots\(\{[\s\S]*?selectorMode,[\s\S]*?\}\);/);
  assert.match(chatRuntimeMobileStylesSource, /const agentSelectorRenderState = useMemo\([\s\S]*?getAgentSelectorMobileRenderState\(\{[\s\S]*?selectorMode,[\s\S]*?colors: theme\.colors,/);
  assert.match(sheetSource, /const agentSelectorCopy = agentSelectorRenderState\.copy;/);
  assert.match(chatRuntimeMobileStylesSource, /createAgentSelectorMobileStyleSheetSlots,/);
  assert.doesNotMatch(sheetSource, /createAgentSelectorMobileStyleSheetSlots,/);
  assert.match(chatRuntimeMobileStylesSource, /const agentSelectorStyleSheetSlots = useMemo\(\s+\(\) => createChatRuntimeAgentSelectorSheetStyleSheetSlots\(\{\s+renderState: agentSelectorRenderState,/);
  assert.match(selectorOptionsSource, /export interface AgentSelectorProfileItemMobilePropsStylesLike<\s+TProfileItemStyle = unknown,/);
  assert.match(selectorOptionsSource, /export interface AgentSelectorSheetMobilePropsStylesLike<\s+TBackdropStyle = unknown,/);
  assert.match(sheetSource, /type AgentSelectorMobileStyleSheetSlots,/);
  assert.match(sheetSource, /type AgentSelectorSheetStyles = AgentSelectorMobileStyleSheetSlots;/);
  assert.doesNotMatch(sheetSource, /type AgentSelectorSheetStyles = \{[\s\S]*?backdrop: StyleProp<ViewStyle>;[\s\S]*?title: StyleProp<TextStyle>;[\s\S]*?profileAvatarImage: StyleProp<ImageStyle>;[\s\S]*?emptyText: StyleProp<TextStyle>;[\s\S]*?\};/);
  assert.match(chatRuntimeMobileStylesSource, /const agentSelectorStyles = useMemo\(\s+\(\) => StyleSheet\.create\(\{\s*\.\.\.agentSelectorStyleSheetSlots\s*\}\),/);
  assert.doesNotMatch(sheetSource, /const styles = React\.useMemo/);
  assert.doesNotMatch(sheetSource, /sheet:\s*\{\s+\.\.\.agentSelectorStyleSlots\.sheet,/);
  assert.doesNotMatch(sheetSource, /profileItem:\s*\{\s+\.\.\.agentSelectorStyleSlots\.profileItem,/);
  assert.doesNotMatch(sheetSource, /profileAvatar:\s*\{\s+\.\.\.agentSelectorStyleSlots\.profileAvatar,/);
  assert.doesNotMatch(sheetSource, /emptyText:\s*\{\s+\.\.\.agentSelectorStyleSlots\.emptyText,/);
  assert.match(sheetSource, /const profileItemRenderState = useMemo\(\s+\(\) => getAgentSelectorMobileProfileItemRenderState\(\{[\s\S]*?profile: item,[\s\S]*?currentProfileId,[\s\S]*?isSwitching,[\s\S]*?\}\),\s+\[currentProfileId, isSwitching, item\],\s+\);/);
  assert.match(sheetSource, /type AgentSelectorProfileItemMobilePropsParts,/);
  assert.match(sheetSource, /type AgentSelectorProfileItemParts =\s+AgentSelectorProfileItemMobilePropsParts<[\s\S]*?AgentSelectorSheetStyles,[\s\S]*?AgentSelectorAvatarImageSource,[\s\S]*?AgentSelectorProfilePressHandler/);
  assert.match(sheetSource, /const avatarImageSource = useMemo\(\s+\(\) => \(item\.avatarDataUrl \? \{ uri: item\.avatarDataUrl \} : null\),\s+\[item\.avatarDataUrl\],\s+\);/);
  assert.match(sheetSource, /const handlePress = useCallback\(\(\) => \{\s+void onSelectProfile\(item\);\s+\}, \[item, onSelectProfile\]\);/);
  assert.match(sheetSource, /const profileItemParts = useMemo<AgentSelectorProfileItemParts>\(\s+\(\) => createAgentSelectorProfileItemMobilePropsParts\(\{[\s\S]*?profile: item,[\s\S]*?renderState,[\s\S]*?profileRenderState: profileItemRenderState,[\s\S]*?styles,[\s\S]*?avatarImageSource,[\s\S]*?onPress: handlePress,/);
  assert.doesNotMatch(sheetSource, /const profileItemParts: AgentSelectorProfileItemParts = createAgentSelectorProfileItemMobilePropsParts/);
  assert.match(sheetSource, /<TouchableOpacity\s+\{\.\.\.profileItemParts\.touchable\.props\}/);
  assert.match(sheetSource, /<View \{\.\.\.avatar\.props\}>/);
  assert.match(sheetSource, /<Image\s+\{\.\.\.avatar\.image\.props\}/);
  assert.match(sheetSource, /<Ionicons\s+\{\.\.\.avatar\.fallbackIcon\.props\}/);
  assert.match(sheetSource, /<View \{\.\.\.profileInfo\.props\}>/);
  assert.match(sheetSource, /<Text \{\.\.\.profileInfo\.name\.props\}>/);
  assert.match(sheetSource, /\{profileInfo\.name\.text\}/);
  assert.match(sheetSource, /profileDescription\.shouldRender \? \(/);
  assert.match(sheetSource, /<Text \{\.\.\.profileDescription\.props\}>/);
  assert.match(sheetSource, /\{profileDescription\.text\}/);
  assert.match(sheetSource, /checkIcon\.shouldRender \? \(/);
  assert.match(sheetSource, /<Ionicons\s+\{\.\.\.checkIcon\.props\}/);
  assert.match(sheetSource, /agentSelectorSheetParts\.loading\.shouldRender \? \(/);
  assert.match(sheetSource, /<ActivityIndicator \{\.\.\.agentSelectorSheetParts\.loading\.indicator\.props\}/);
  assert.match(sheetSource, /agentSelectorSheetParts\.error\.shouldRender \? \(/);
  assert.match(sheetSource, /<TouchableOpacity \{\.\.\.agentSelectorSheetParts\.error\.retryButton\.props\}>/);
  assert.match(sheetSource, /agentSelectorSheetParts\.empty\.shouldRender \? \(/);
  assert.match(sheetSource, /\{agentSelectorSheetParts\.empty\.text\}/);
  assert.match(sheetSource, /agentSelectorSheetParts\.list\.shouldRender \? \(/);
  assert.match(sheetSource, /\{\.\.\.agentSelectorSheetParts\.list\.props\}/);
  assert.doesNotMatch(sheetSource, /const agentSelectorSurface = agentSelectorRenderState\.surface;/);
  assert.doesNotMatch(sheetSource, /const agentSelectorColors = agentSelectorRenderState\.colors;/);
  assert.doesNotMatch(sheetSource, /\{agentSelectorRenderState\.title\}/);
  assert.doesNotMatch(sheetSource, /\{agentSelectorRenderState\.emptyLabel\}/);
  assert.doesNotMatch(sheetSource, /color=\{agentSelectorColors\.activityIndicator\.color\}/);
  assert.doesNotMatch(sheetSource, /style=\{styles\.list\}/);
  assert.doesNotMatch(sheetSource, /showsVerticalScrollIndicator=\{false\}/);
  assert.doesNotMatch(sheetSource, /activeOpacity=\{profileItemRenderState\.activeOpacity\}/);
  assert.doesNotMatch(sheetSource, /accessibilityRole=\{profileItemRenderState\.accessibilityRole\}/);
  assert.doesNotMatch(sheetSource, /accessibilityLabel=\{profileItemRenderState\.accessibilityLabel\}/);
  assert.doesNotMatch(sheetSource, /accessibilityState=\{profileItemRenderState\.accessibilityState\}/);
  assert.doesNotMatch(sheetSource, /profileItemRenderState\.fallbackAvatar\.backgroundColor/);
  assert.doesNotMatch(sheetSource, /<Image[\s\S]*?source=\{\{ uri: item\.avatarDataUrl \}\}/);
  assert.doesNotMatch(sheetSource, /name=\{agentSelectorSurface\.avatar\.fallbackIconName\}/);
  assert.doesNotMatch(sheetSource, /name=\{agentSelectorSurface\.checkIcon\.name\}/);
  assert.doesNotMatch(sheetSource, /color=\{agentSelectorColors\.avatar\.fallbackIconColor\}/);
  assert.doesNotMatch(sheetSource, /color=\{agentSelectorColors\.checkIcon\.color\}/);
  assert.doesNotMatch(sheetSource, /profileItemRenderState\.shouldRenderProfileSummary/);
  assert.doesNotMatch(sheetSource, /\{profileItemRenderState\.profileSummary\}/);
  assert.doesNotMatch(sheetSource, /numberOfLines=\{agentSelectorSurface\.profileName\.numberOfLines\}/);
  assert.doesNotMatch(sheetSource, /numberOfLines=\{agentSelectorSurface\.profileDescription\.numberOfLines\}/);
  assert.doesNotMatch(sheetSource, /AGENT_SELECTOR_PRESENTATION/);
  assert.doesNotMatch(sheetSource, /alignSelf:\s*'center'/);
  assert.doesNotMatch(sheetSource, /profileItem:\s*\{\s*flexDirection:\s*'row',\s*alignItems:\s*'center',\s*justifyContent:\s*'space-between',/);
  assert.doesNotMatch(sheetSource, /profileAvatar:\s*\{[\s\S]*?overflow:\s*'hidden'/);
  assert.doesNotMatch(sheetSource, /profileAvatarImage:\s*\{\s*width:\s*'100%',\s*height:\s*'100%',/);
  assert.doesNotMatch(sheetSource, /profileInfo:\s*\{\s*flex:\s*1,\s*minWidth:\s*0,/);
  assert.doesNotMatch(sheetSource, /styles\.profileDescription\} numberOfLines=\{?1\}?/);
  assert.doesNotMatch(sheetSource, /textAlign:\s*'center'/);
  assert.doesNotMatch(sheetSource, /theme\.colors\.primary \+ '20'/);
  assert.doesNotMatch(sheetSource, /hexToRgba\(/);
  assert.doesNotMatch(sheetSource, /theme\.colors\[[^\]]+\]/);
  assert.doesNotMatch(sheetSource, /createStyles\(/);
  assert.doesNotMatch(sheetSource, /function createStyles/);
  assert.doesNotMatch(sheetSource, /spacing\[agentSelectorSurface\./);
  assert.doesNotMatch(sheetSource, /radius\[agentSelectorSurface\./);
  assert.doesNotMatch(sheetSource, /backgroundColor:\s*agentSelectorColors\.backdrop\.backgroundColor/);
  assert.doesNotMatch(sheetSource, /backgroundColor:\s*agentSelectorColors\.profileItem\.selectedBackgroundColor/);
  assert.doesNotMatch(sheetSource, /alignSelf:\s*agentSelectorSurface\.handle\.alignSelf/);
  assert.doesNotMatch(sheetSource, /flexDirection:\s*agentSelectorSurface\.profileItem\.flexDirection/);
  assert.doesNotMatch(sheetSource, /alignItems:\s*agentSelectorSurface\.avatar\.alignItems/);
  assert.doesNotMatch(sheetSource, /width:\s*agentSelectorSurface\.avatarImage\.width/);
  assert.doesNotMatch(sheetSource, /flex:\s*agentSelectorSurface\.profileInfo\.flex/);
  assert.doesNotMatch(sheetSource, /alignItems:\s*agentSelectorSurface\.loadingContainer\.alignItems/);
  assert.doesNotMatch(sheetSource, /alignItems:\s*agentSelectorSurface\.errorContainer\.alignItems/);
  assert.doesNotMatch(sheetSource, /textAlign:\s*agentSelectorSurface\.emptyText\.textAlign/);
  assert.doesNotMatch(sheetSource, /backgroundColor:\s*'rgba\(0, 0, 0, 0\.4\)'/);
  assert.doesNotMatch(sheetSource, /accessibilityRole="button"/);
  assert.doesNotMatch(sheetSource, /accessibilityLabel=\{`Select \$\{item\.name\} agent`\}/);
  assert.doesNotMatch(sheetSource, /formatAgentSelectorSelectAccessibilityLabel\(item\.name\)/);
  assert.doesNotMatch(sheetSource, /getAgentAvatarColors\(item\.id\)\[0\]/);
  assert.doesNotMatch(sheetSource, /getAgentSelectorMobileFallbackAvatarBackgroundColor\(fallbackAvatarColor\)/);
  assert.doesNotMatch(sheetSource, /getAgentSelectorSheetCopyState/);
  assert.doesNotMatch(sheetSource, /getAgentSelectorMobileSurfaceColors/);
  assert.doesNotMatch(sheetSource, /getAgentSelectorMobileSurfaceState/);
  assert.doesNotMatch(sheetSource, /getAgentSelectorMobileCloseIconState/);
  assert.doesNotMatch(sheetSource, /getAgentSelectorSheetTitle\(selectorMode\)/);
  assert.doesNotMatch(sheetSource, /getAgentSelectorSheetEmptyLabel\(selectorMode\)/);
  assert.doesNotMatch(sheetSource, /agentSelectorSurface\.headerCloseIcon\.(name|size|colorToken)/);
});
