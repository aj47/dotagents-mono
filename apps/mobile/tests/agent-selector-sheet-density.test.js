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
  assert.match(sheetSource, /<View style=\{styles\.header\}>/);
  assert.match(sheetSource, /getAgentSelectorMobileRenderState/);
  assert.match(sheetSource, /const agentSelectorCloseButton = agentSelectorRenderState\.closeButton;/);
  assert.match(sheetSource, /accessibilityLabel=\{agentSelectorCloseButton\.accessibilityLabel\}/);
  assert.match(sheetSource, /activeOpacity=\{agentSelectorCloseButton\.activeOpacity\}/);
  assert.match(sheetSource, /accessibilityRole=\{agentSelectorCloseButton\.accessibilityRole\}/);
  assert.match(sheetSource, /name=\{agentSelectorCloseButton\.icon\.name\}/);
  assert.match(sheetSource, /size=\{agentSelectorCloseButton\.icon\.size\}/);
  assert.match(sheetSource, /color=\{agentSelectorCloseButton\.icon\.color\}/);
  assert.match(sheetSource, /<View style=\{styles\.backdropSpacer\} \/>/);
  assert.match(sheetSource, /const agentSelectorStyleSlots = React\.useMemo\(\s+\(\) => createAgentSelectorMobileStyleSlots\(\{/);
  assert.match(sheetSource, /backdropSpacer:\s*\{\s+\.\.\.agentSelectorStyleSlots\.backdropSpacer,/);
  assert.match(sheetSource, /style=\{\[styles\.sheet, \{ paddingBottom: insets\.bottom \+ agentSelectorStyleSlots\.sheet\.paddingBottom \}\]\}/);
  assert.doesNotMatch(sheetSource, /<View style=\{\{ flex: 1 \}\} \/>/);
  assert.doesNotMatch(sheetSource, /headerCloseButtonText/);
  assert.doesNotMatch(sheetSource, /agentSelectorCopy\.closeLabel/);
  assert.doesNotMatch(sheetSource, /<Text style=\{styles\.closeButtonText\}>Cancel<\/Text>/);
  assert.doesNotMatch(sheetSource, /closeButton:\s*\{/);
  assert.doesNotMatch(sheetSource, /backdropSpacer:\s*\{[\s\S]*?flex:\s*agentSelectorSurface\.backdropSpacer\.flex/);
  assert.doesNotMatch(sheetSource, /headerCloseButton:\s*\{[\s\S]*?width:\s*agentSelectorSurface\.headerCloseButton\.width/);
});

test('keeps the mobile agent selector title shrink-safe beside the header close action', () => {
  assert.match(sheetSource, /createAgentSelectorMobileStyleSlots\(\{\s+renderState: agentSelectorRenderState,\s+spacing,\s+radius,\s+\}\)/);
  assert.match(sheetSource, /header:\s*\{\s+\.\.\.agentSelectorStyleSlots\.header,/);
  assert.match(sheetSource, /title:\s*\{\s+\.\.\.agentSelectorStyleSlots\.title,/);
  assert.match(sheetSource, /<Text style=\{styles\.title\} numberOfLines=\{agentSelectorSurface\.title\.numberOfLines\}>/);
  assert.doesNotMatch(sheetSource, /<Text style=\{styles\.title\} numberOfLines=\{1\}>/);
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
  assert.match(sessionPresentationSource, /export \{[\s\S]*?buildSelectorProfiles,[\s\S]*?createAgentSelectorMobileStyleSlots,[\s\S]*?getAgentSelectorMobileProfileItemRenderState,[\s\S]*?getAgentSelectorMobileRenderState,[\s\S]*?type SelectableAgentProfile,[\s\S]*?\} from "\.\/agent-selector-options"/);
  assert.match(sheetSource, /getAgentSelectorMobileRenderState/);
  assert.match(sheetSource, /getAgentSelectorMobileProfileItemRenderState/);
  assert.match(sheetSource, /const agentSelectorRenderState = React\.useMemo\([\s\S]*?getAgentSelectorMobileRenderState\(\{[\s\S]*?selectorMode,[\s\S]*?colors: theme\.colors,/);
  assert.match(sheetSource, /const agentSelectorCopy = agentSelectorRenderState\.copy;/);
  assert.match(sheetSource, /const agentSelectorSurface = agentSelectorRenderState\.surface;/);
  assert.match(sheetSource, /const agentSelectorColors = agentSelectorRenderState\.colors;/);
  assert.match(sheetSource, /createAgentSelectorMobileStyleSlots,/);
  assert.match(sheetSource, /const agentSelectorStyleSlots = React\.useMemo\(\s+\(\) => createAgentSelectorMobileStyleSlots\(\{\s+renderState: agentSelectorRenderState,\s+spacing,\s+radius,\s+\}\),/);
  assert.match(sheetSource, /const styles = React\.useMemo\(\s+\(\) => StyleSheet\.create\(\{/);
  assert.match(sheetSource, /sheet:\s*\{\s+\.\.\.agentSelectorStyleSlots\.sheet,/);
  assert.match(sheetSource, /profileItem:\s*\{\s+\.\.\.agentSelectorStyleSlots\.profileItem,/);
  assert.match(sheetSource, /profileAvatar:\s*\{\s+\.\.\.agentSelectorStyleSlots\.profileAvatar,/);
  assert.match(sheetSource, /emptyText:\s*\{\s+\.\.\.agentSelectorStyleSlots\.emptyText,/);
  assert.match(sheetSource, /const profileItemRenderState = getAgentSelectorMobileProfileItemRenderState\(\{[\s\S]*?profile: item,[\s\S]*?currentProfileId: currentProfile\?\.id,[\s\S]*?isSwitching,/);
  assert.match(sheetSource, /\{agentSelectorRenderState\.title\}/);
  assert.match(sheetSource, /\{agentSelectorRenderState\.emptyLabel\}/);
  assert.match(sheetSource, /activeOpacity=\{profileItemRenderState\.activeOpacity\}/);
  assert.match(sheetSource, /accessibilityRole=\{profileItemRenderState\.accessibilityRole\}/);
  assert.match(sheetSource, /accessibilityLabel=\{profileItemRenderState\.accessibilityLabel\}/);
  assert.match(sheetSource, /accessibilityState=\{profileItemRenderState\.accessibilityState\}/);
  assert.match(sheetSource, /profileItemRenderState\.fallbackAvatar\.backgroundColor/);
  assert.match(sheetSource, /<Image[\s\S]*?source=\{\{ uri: item\.avatarDataUrl \}\}/);
  assert.match(sheetSource, /<Ionicons[\s\S]*?name=\{agentSelectorSurface\.avatar\.fallbackIconName\}/);
  assert.match(sheetSource, /name=\{agentSelectorSurface\.checkIcon\.name\}/);
  assert.match(sheetSource, /color=\{agentSelectorColors\.avatar\.fallbackIconColor\}/);
  assert.match(sheetSource, /color=\{agentSelectorColors\.checkIcon\.color\}/);
  assert.match(sheetSource, /color=\{agentSelectorColors\.activityIndicator\.color\}/);
  assert.match(sheetSource, /profileItemRenderState\.shouldRenderProfileSummary/);
  assert.match(sheetSource, /\{profileItemRenderState\.profileSummary\}/);
  assert.match(sheetSource, /numberOfLines=\{agentSelectorSurface\.profileName\.numberOfLines\}/);
  assert.match(sheetSource, /numberOfLines=\{agentSelectorSurface\.profileDescription\.numberOfLines\}/);
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
