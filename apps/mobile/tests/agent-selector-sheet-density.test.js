const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const sheetSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'ui', 'AgentSelectorSheet.tsx'),
  'utf8'
);

test('keeps the mobile agent selector close affordance in a compact header instead of a footer band', () => {
  assert.match(sheetSource, /<View style=\{styles\.header\}>/);
  assert.match(sheetSource, /getAgentSelectorMobileCloseIconState/);
  assert.match(sheetSource, /const agentSelectorCloseIcon = getAgentSelectorMobileCloseIconState\(\);/);
  assert.match(sheetSource, /accessibilityLabel=\{agentSelectorCopy\.closeAccessibilityLabel\}/);
  assert.match(sheetSource, /activeOpacity=\{agentSelectorSurface\.headerCloseButton\.pressedOpacity\}/);
  assert.match(sheetSource, /accessibilityRole=\{agentSelectorSurface\.headerCloseButton\.accessibilityRole\}/);
  assert.match(sheetSource, /name=\{agentSelectorCloseIcon\.name\}/);
  assert.match(sheetSource, /size=\{agentSelectorCloseIcon\.size\}/);
  assert.match(sheetSource, /color=\{agentSelectorColors\.headerCloseIcon\.color\}/);
  assert.match(sheetSource, /<View style=\{styles\.backdropSpacer\} \/>/);
  assert.match(sheetSource, /backdropSpacer:\s*\{[\s\S]*?flex:\s*agentSelectorSurface\.backdropSpacer\.flex/);
  assert.match(sheetSource, /headerCloseButton:\s*\{[\s\S]*?width:\s*agentSelectorSurface\.headerCloseButton\.width,[\s\S]*?height:\s*agentSelectorSurface\.headerCloseButton\.height,[\s\S]*?alignItems:\s*agentSelectorSurface\.headerCloseButton\.alignItems,[\s\S]*?justifyContent:\s*agentSelectorSurface\.headerCloseButton\.justifyContent/);
  assert.doesNotMatch(sheetSource, /<View style=\{\{ flex: 1 \}\} \/>/);
  assert.doesNotMatch(sheetSource, /headerCloseButtonText/);
  assert.doesNotMatch(sheetSource, /agentSelectorCopy\.closeLabel/);
  assert.doesNotMatch(sheetSource, /<Text style=\{styles\.closeButtonText\}>Cancel<\/Text>/);
  assert.doesNotMatch(sheetSource, /closeButton:\s*\{/);
});

test('keeps the mobile agent selector title shrink-safe beside the header close action', () => {
  assert.match(sheetSource, /header:\s*\{[\s\S]*?flexDirection:\s*agentSelectorSurface\.header\.flexDirection,[\s\S]*?alignItems:\s*agentSelectorSurface\.header\.alignItems,[\s\S]*?marginBottom:\s*spacing\[agentSelectorSurface\.header\.marginBottom\],/);
  assert.match(sheetSource, /title:\s*\{[\s\S]*?flex:\s*agentSelectorSurface\.title\.flex,[\s\S]*?minWidth:\s*agentSelectorSurface\.title\.minWidth,[\s\S]*?lineHeight:\s*agentSelectorSurface\.title\.lineHeight,/);
  assert.match(sheetSource, /<Text style=\{styles\.title\} numberOfLines=\{agentSelectorSurface\.title\.numberOfLines\}>/);
  assert.doesNotMatch(sheetSource, /<Text style=\{styles\.title\} numberOfLines=\{1\}>/);
  assert.doesNotMatch(sheetSource, /header:\s*\{\s*flexDirection:\s*'row',\s*alignItems:\s*'center',/);
  assert.doesNotMatch(sheetSource, /title:\s*\{\s*flex:\s*1,\s*minWidth:\s*0,/);
});

test('uses shared selector presentation tokens and desktop-like avatar rows', () => {
  assert.match(sheetSource, /getAgentSelectorSheetCopyState/);
  assert.match(sheetSource, /getAgentSelectorMobileSurfaceColors/);
  assert.match(sheetSource, /getAgentSelectorMobileFallbackAvatarBackgroundColor/);
  assert.match(sheetSource, /getAgentSelectorMobileSurfaceState/);
  assert.match(sheetSource, /const agentSelectorCopy = getAgentSelectorSheetCopyState\(\)/);
  assert.match(sheetSource, /const agentSelectorSurface = getAgentSelectorMobileSurfaceState\(\)/);
  assert.match(sheetSource, /const agentSelectorColors = React\.useMemo\([\s\S]*?getAgentSelectorMobileSurfaceColors\(theme\.colors\)/);
  assert.match(sheetSource, /getAgentSelectorSheetTitle\(selectorMode\)/);
  assert.match(sheetSource, /getAgentSelectorSheetEmptyLabel\(selectorMode\)/);
  assert.match(sheetSource, /formatAgentSelectorSelectAccessibilityLabel\(item\.name\)/);
  assert.match(sheetSource, /activeOpacity=\{agentSelectorSurface\.profileItem\.pressedOpacity\}/);
  assert.match(sheetSource, /accessibilityRole=\{agentSelectorSurface\.profileItem\.accessibilityRole\}/);
  assert.match(sheetSource, /accessibilityState=\{\{ selected: isSelected, disabled: isSwitching \}\}/);
  assert.match(sheetSource, /getAgentAvatarColors\(item\.id\)\[0\]/);
  assert.match(sheetSource, /getAgentSelectorMobileFallbackAvatarBackgroundColor\(fallbackAvatarColor\)/);
  assert.match(sheetSource, /<Image[\s\S]*?source=\{\{ uri: item\.avatarDataUrl \}\}/);
  assert.match(sheetSource, /<Ionicons[\s\S]*?name=\{agentSelectorSurface\.avatar\.fallbackIconName\}/);
  assert.match(sheetSource, /name=\{agentSelectorSurface\.checkIcon\.name\}/);
  assert.match(sheetSource, /backgroundColor:\s*agentSelectorColors\.backdrop\.backgroundColor/);
  assert.match(sheetSource, /backgroundColor:\s*agentSelectorColors\.profileItem\.selectedBackgroundColor/);
  assert.match(sheetSource, /color=\{agentSelectorColors\.avatar\.fallbackIconColor\}/);
  assert.match(sheetSource, /color=\{agentSelectorColors\.checkIcon\.color\}/);
  assert.match(sheetSource, /color=\{agentSelectorColors\.activityIndicator\.color\}/);
  assert.match(sheetSource, /alignSelf:\s*agentSelectorSurface\.handle\.alignSelf/);
  assert.match(sheetSource, /profileItem:\s*\{[\s\S]*?flexDirection:\s*agentSelectorSurface\.profileItem\.flexDirection,[\s\S]*?alignItems:\s*agentSelectorSurface\.profileItem\.alignItems,[\s\S]*?justifyContent:\s*agentSelectorSurface\.profileItem\.justifyContent,/);
  assert.match(sheetSource, /profileAvatar:\s*\{[\s\S]*?alignItems:\s*agentSelectorSurface\.avatar\.alignItems,[\s\S]*?justifyContent:\s*agentSelectorSurface\.avatar\.justifyContent,[\s\S]*?overflow:\s*agentSelectorSurface\.avatar\.overflow,[\s\S]*?flexShrink:\s*agentSelectorSurface\.avatar\.flexShrink,/);
  assert.match(sheetSource, /profileAvatarImage:\s*\{[\s\S]*?width:\s*agentSelectorSurface\.avatarImage\.width,[\s\S]*?height:\s*agentSelectorSurface\.avatarImage\.height,/);
  assert.match(sheetSource, /profileInfo:\s*\{[\s\S]*?flex:\s*agentSelectorSurface\.profileInfo\.flex,[\s\S]*?minWidth:\s*agentSelectorSurface\.profileInfo\.minWidth,/);
  assert.match(sheetSource, /numberOfLines=\{agentSelectorSurface\.profileName\.numberOfLines\}/);
  assert.match(sheetSource, /numberOfLines=\{agentSelectorSurface\.profileDescription\.numberOfLines\}/);
  assert.match(sheetSource, /loadingContainer:\s*\{[\s\S]*?alignItems:\s*agentSelectorSurface\.loadingContainer\.alignItems,/);
  assert.match(sheetSource, /errorContainer:\s*\{[\s\S]*?alignItems:\s*agentSelectorSurface\.errorContainer\.alignItems,/);
  assert.match(sheetSource, /emptyText:\s*\{[\s\S]*?textAlign:\s*agentSelectorSurface\.emptyText\.textAlign,/);
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
  assert.doesNotMatch(sheetSource, /backgroundColor:\s*'rgba\(0, 0, 0, 0\.4\)'/);
  assert.doesNotMatch(sheetSource, /accessibilityRole="button"/);
  assert.doesNotMatch(sheetSource, /accessibilityLabel=\{`Select \$\{item\.name\} agent`\}/);
  assert.doesNotMatch(sheetSource, /agentSelectorSurface\.headerCloseIcon\.(name|size|colorToken)/);
});
