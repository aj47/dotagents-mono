const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const sheetSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'ui', 'AgentSelectorSheet.tsx'),
  'utf8'
);
const sessionPresentationSource = fs.readFileSync(
  path.join(__dirname, '..', '..', '..', 'packages', 'shared', 'src', 'session-presentation.ts'),
  'utf8'
);
const selectorOptionsTestSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'ui', 'agentSelectorOptions.test.ts'),
  'utf8'
);

test('keeps the mobile agent selector close affordance in a compact header instead of a footer band', () => {
  assert.match(sheetSource, /<View \{\.\.\.agentSelectorSheetParts\.header\.props\}>/);
  assert.match(sheetSource, /getAgentSelectorMobileRenderState/);
  assert.match(sheetSource, /createAgentSelectorSheetMobilePropsParts,/);
  assert.match(sheetSource, /const agentSelectorSheetParts = createAgentSelectorSheetMobilePropsParts\(\{[\s\S]*?visible,[\s\S]*?renderState: agentSelectorRenderState,[\s\S]*?styles,[\s\S]*?sheetBottomPadding: agentSelectorStyleSlots\.sheet\.paddingBottom,[\s\S]*?safeAreaBottom: insets\.bottom,[\s\S]*?isLoading,[\s\S]*?error,[\s\S]*?hasProfiles: profiles\.length > 0,[\s\S]*?onClose,[\s\S]*?onRetry: fetchProfiles,/);
  assert.match(sheetSource, /<Modal\s+\{\.\.\.agentSelectorSheetParts\.modal\.props\}/);
  assert.match(sheetSource, /<Pressable \{\.\.\.agentSelectorSheetParts\.backdrop\.props\}>/);
  assert.match(sheetSource, /<View \{\.\.\.agentSelectorSheetParts\.backdropSpacer\.props\} \/>/);
  assert.match(sheetSource, /<TouchableOpacity \{\.\.\.agentSelectorSheetParts\.closeButton\.props\}>/);
  assert.match(sheetSource, /<Ionicons\s+\{\.\.\.agentSelectorSheetParts\.closeButton\.icon\.props\}/);
  assert.match(sheetSource, /const agentSelectorStyleSlots = React\.useMemo\(\s+\(\) => createAgentSelectorMobileStyleSlots\(\{/);
  assert.match(sheetSource, /backdropSpacer:\s*\{\s+\.\.\.agentSelectorStyleSlots\.backdropSpacer,/);
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
  assert.match(sheetSource, /createAgentSelectorMobileStyleSlots\(\{\s+renderState: agentSelectorRenderState,\s+spacing,\s+radius,\s+\}\)/);
  assert.match(sheetSource, /header:\s*\{\s+\.\.\.agentSelectorStyleSlots\.header,/);
  assert.match(sheetSource, /title:\s*\{\s+\.\.\.agentSelectorStyleSlots\.title,/);
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
  assert.match(sessionPresentationSource, /export \{[\s\S]*?buildSelectorProfiles,[\s\S]*?createAgentSelectorProfileItemMobilePropsParts,[\s\S]*?createAgentSelectorSheetMobilePropsParts,[\s\S]*?createAgentSelectorMobileStyleSlots,[\s\S]*?getAgentSelectorMobileProfileItemRenderState,[\s\S]*?getAgentSelectorMobileRenderState,[\s\S]*?type AgentSelectorProfileItemMobilePropsParts,[\s\S]*?type AgentSelectorProfileItemMobilePropsPartsInput,[\s\S]*?type AgentSelectorSheetMobilePropsParts,[\s\S]*?type AgentSelectorSheetMobilePropsPartsInput,[\s\S]*?type SelectableAgentProfile,[\s\S]*?\} from "\.\/agent-selector-options"/);
  assert.match(sheetSource, /getAgentSelectorMobileRenderState/);
  assert.match(sheetSource, /getAgentSelectorMobileProfileItemRenderState/);
  assert.match(sheetSource, /createAgentSelectorProfileItemMobilePropsParts,/);
  assert.match(sheetSource, /createAgentSelectorSheetMobilePropsParts,/);
  assert.match(sheetSource, /const agentSelectorRenderState = React\.useMemo\([\s\S]*?getAgentSelectorMobileRenderState\(\{[\s\S]*?selectorMode,[\s\S]*?colors: theme\.colors,/);
  assert.match(sheetSource, /const agentSelectorCopy = agentSelectorRenderState\.copy;/);
  assert.match(sheetSource, /createAgentSelectorMobileStyleSlots,/);
  assert.match(sheetSource, /const agentSelectorStyleSlots = React\.useMemo\(\s+\(\) => createAgentSelectorMobileStyleSlots\(\{\s+renderState: agentSelectorRenderState,\s+spacing,\s+radius,\s+\}\),/);
  assert.match(sheetSource, /const styles = React\.useMemo\(\s+\(\) => StyleSheet\.create\(\{/);
  assert.match(sheetSource, /sheet:\s*\{\s+\.\.\.agentSelectorStyleSlots\.sheet,/);
  assert.match(sheetSource, /profileItem:\s*\{\s+\.\.\.agentSelectorStyleSlots\.profileItem,/);
  assert.match(sheetSource, /profileAvatar:\s*\{\s+\.\.\.agentSelectorStyleSlots\.profileAvatar,/);
  assert.match(sheetSource, /emptyText:\s*\{\s+\.\.\.agentSelectorStyleSlots\.emptyText,/);
  assert.match(sheetSource, /const profileItemRenderState = getAgentSelectorMobileProfileItemRenderState\(\{[\s\S]*?profile: item,[\s\S]*?currentProfileId: currentProfile\?\.id,[\s\S]*?isSwitching,/);
  assert.match(sheetSource, /const profileItemParts = createAgentSelectorProfileItemMobilePropsParts\(\{[\s\S]*?profile: item,[\s\S]*?renderState: agentSelectorRenderState,[\s\S]*?profileRenderState: profileItemRenderState,[\s\S]*?styles,[\s\S]*?avatarImageSource: item\.avatarDataUrl \? \{ uri: item\.avatarDataUrl \} : null,[\s\S]*?onPress: \(\) => handleSelectProfile\(item\),/);
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
