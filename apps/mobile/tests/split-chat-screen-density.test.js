const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const screenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SplitChatScreen.tsx'),
  'utf8'
);
const sharedSplitPaneSource = fs.readFileSync(
  path.join(__dirname, '..', '..', '..', 'packages', 'shared', 'src', 'split-pane-selection.ts'),
  'utf8'
);

test('uses shared split-pane presentation for mobile split chat text clamps', () => {
  assert.match(sharedSplitPaneSource, /SPLIT_PANE_PRESENTATION/);
  assert.match(sharedSplitPaneSource, /export function createSplitPaneMobileStyleSlots/);
  assert.match(screenSource, /getSplitPaneCopyState,/);
  assert.match(screenSource, /getSplitPaneMobileSurfaceState,/);
  assert.match(screenSource, /createSplitPaneMobileStyleSlots,/);
  assert.match(screenSource, /const splitPaneSurface = getSplitPaneMobileSurfaceState\(\);/);
  assert.match(screenSource, /StyleSheet\.create\(createSplitPaneMobileStyleSlots\(\{[\s\S]*?colors: splitPaneColors,[\s\S]*?spacing,[\s\S]*?radius,[\s\S]*?typography: theme\.typography,[\s\S]*?\}\)\);/);
  assert.match(screenSource, /numberOfLines=\{splitPaneSurface\.paneTitle\.numberOfLines\}/);
  assert.match(screenSource, /numberOfLines=\{splitPaneSurface\.sessionOption\.title\.numberOfLines\}/);
  assert.match(screenSource, /numberOfLines=\{splitPaneSurface\.sessionOption\.preview\.numberOfLines\}/);
  assert.doesNotMatch(screenSource, /SPLIT_PANE_PRESENTATION\.mobile/);
  assert.doesNotMatch(screenSource, /style=\{styles\.paneTitle\} numberOfLines=\{1\}/);
  assert.doesNotMatch(screenSource, /style=\{styles\.sessionOptionTitle\} numberOfLines=\{1\}/);
  assert.doesNotMatch(screenSource, /style=\{styles\.sessionOptionPreview\} numberOfLines=\{2\}/);
});

test('uses shared split-pane presentation for mobile active and overlay colors', () => {
  assert.match(sharedSplitPaneSource, /segmentButton:\s*\{/);
  assert.match(sharedSplitPaneSource, /modalOverlay:\s*\{/);
  assert.match(sharedSplitPaneSource, /getSplitPaneMobileSurfaceColors/);
  assert.match(sharedSplitPaneSource, /borderColor:\s*colors\.segmentButton\.activeBorderColor/);
  assert.match(sharedSplitPaneSource, /backgroundColor:\s*colors\.segmentButton\.activeBackgroundColor/);
  assert.match(sharedSplitPaneSource, /backgroundColor:\s*colors\.modalOverlay\.backgroundColor/);
  assert.match(sharedSplitPaneSource, /borderColor:\s*colors\.sessionOption\.activeBorderColor/);
  assert.match(sharedSplitPaneSource, /backgroundColor:\s*colors\.sessionOption\.activeBackgroundColor/);
  assert.match(screenSource, /getSplitPaneMobileSurfaceColors,/);
  assert.match(screenSource, /const splitPaneColors = useMemo\(\s*\(\) => getSplitPaneMobileSurfaceColors\(theme\.colors\),/);
  assert.doesNotMatch(screenSource, /const modalOverlaySurface = splitPaneSurface\.modalOverlay;/);
  assert.doesNotMatch(screenSource, /borderColor:\s*splitPaneColors\.segmentButton\.activeBorderColor/);
  assert.doesNotMatch(screenSource, /backgroundColor:\s*splitPaneColors\.segmentButton\.activeBackgroundColor/);
  assert.doesNotMatch(screenSource, /backgroundColor:\s*splitPaneColors\.modalOverlay\.backgroundColor/);
  assert.doesNotMatch(screenSource, /borderColor:\s*splitPaneColors\.sessionOption\.activeBorderColor/);
  assert.doesNotMatch(screenSource, /backgroundColor:\s*splitPaneColors\.sessionOption\.activeBackgroundColor/);
  assert.doesNotMatch(screenSource, /theme\.colors\[[^\]]+\]/);
  assert.doesNotMatch(screenSource, /theme\.colors\.[A-Za-z]/);
  assert.doesNotMatch(screenSource, /hexToRgba\(/);
  assert.doesNotMatch(screenSource, /theme\.colors\.primary \+ '18'/);
  assert.doesNotMatch(screenSource, /theme\.colors\.primary \+ '12'/);
  assert.doesNotMatch(screenSource, /'#00000066'/);
});

test('uses shared split-pane presentation for the mobile shell, toolbar, and empty pane actions', () => {
  assert.match(sharedSplitPaneSource, /screen:\s*\{/);
  assert.match(sharedSplitPaneSource, /controlBar:\s*\{/);
  assert.match(sharedSplitPaneSource, /paneToolbar:\s*\{/);
  assert.match(sharedSplitPaneSource, /toolbarButton:\s*\{/);
  assert.match(sharedSplitPaneSource, /emptyState:\s*\{/);
  assert.match(sharedSplitPaneSource, /const screenSurface = surface\.screen/);
  assert.match(sharedSplitPaneSource, /const controlBarSurface = surface\.controlBar/);
  assert.match(sharedSplitPaneSource, /const paneToolbarSurface = surface\.paneToolbar/);
  assert.match(sharedSplitPaneSource, /const toolbarButtonSurface = surface\.toolbarButton/);
  assert.match(sharedSplitPaneSource, /const emptyStateSurface = surface\.emptyState/);
  assert.match(sharedSplitPaneSource, /backgroundColor:\s*colors\.screen\.backgroundColor/);
  assert.match(sharedSplitPaneSource, /borderColor:\s*colors\.controlBar\.borderColor/);
  assert.match(sharedSplitPaneSource, /borderBottomColor:\s*colors\.paneToolbar\.borderBottomColor/);
  assert.match(sharedSplitPaneSource, /toolbarButton:\s*\{[\s\S]*?flexDirection:\s*toolbarButtonSurface\.flexDirection,[\s\S]*?alignItems:\s*toolbarButtonSurface\.alignItems,[\s\S]*?justifyContent:\s*toolbarButtonSurface\.justifyContent,[\s\S]*?gap:\s*toolbarButtonSurface\.gap/);
  assert.match(sharedSplitPaneSource, /toolbarButtonDisabled:\s*\{\s*opacity:\s*toolbarButtonSurface\.disabledOpacity\s*\}/);
  assert.match(sharedSplitPaneSource, /primaryButton:\s*\{[\s\S]*?flexDirection:\s*primaryButtonSurface\.flexDirection,[\s\S]*?alignItems:\s*primaryButtonSurface\.alignItems,[\s\S]*?justifyContent:\s*primaryButtonSurface\.justifyContent,[\s\S]*?gap:\s*spacing\[primaryButtonSurface\.gap\]/);
  assert.match(sharedSplitPaneSource, /primaryButtonText:\s*\{[\s\S]*?fontWeight:\s*primaryButtonSurface\.fontWeight/);
  assert.match(sharedSplitPaneSource, /secondaryButton:\s*\{[\s\S]*?flexDirection:\s*secondaryButtonSurface\.flexDirection,[\s\S]*?alignItems:\s*secondaryButtonSurface\.alignItems,[\s\S]*?justifyContent:\s*secondaryButtonSurface\.justifyContent,[\s\S]*?gap:\s*spacing\[secondaryButtonSurface\.gap\]/);
  assert.match(sharedSplitPaneSource, /secondaryButtonText:\s*\{[\s\S]*?fontWeight:\s*secondaryButtonSurface\.fontWeight/);
  assert.doesNotMatch(screenSource, /const screenSurface = splitPaneSurface\.screen;/);
  assert.doesNotMatch(screenSource, /const controlBarSurface = splitPaneSurface\.controlBar;/);
  assert.doesNotMatch(screenSource, /const paneToolbarSurface = splitPaneSurface\.paneToolbar;/);
  assert.doesNotMatch(screenSource, /const toolbarButtonSurface = splitPaneSurface\.toolbarButton;/);
  assert.doesNotMatch(screenSource, /const emptyStateSurface = splitPaneSurface\.emptyState;/);
  assert.doesNotMatch(screenSource, /screen:\s*\{\s*flex:\s*1,\s*backgroundColor:\s*theme\.colors\.background/);
  assert.doesNotMatch(screenSource, /controlBar:\s*\{[^}]*?backgroundColor:\s*theme\.colors\.card/);
  assert.doesNotMatch(screenSource, /paneToolbar:\s*\{[^}]*?justifyContent:\s*'space-between'/);
  assert.doesNotMatch(screenSource, /toolbarButtonDisabled:\s*\{\s*opacity:\s*0\.45\s*\}/);
});

test('uses shared split-pane mobile icons for toolbar and pane action buttons', () => {
  assert.match(screenSource, /import \{ Ionicons \} from '@expo\/vector-icons';/);
  assert.match(screenSource, /getSplitPaneEmptyStateActionMobileIconState,/);
  assert.match(screenSource, /getSplitPaneModalCreateMobileIconState,/);
  assert.match(screenSource, /getSplitPaneToolbarActionMobileIconState,/);
  assert.match(screenSource, /const splitPaneToolbarChooseIcon = getSplitPaneToolbarActionMobileIconState\('choose'\);/);
  assert.match(screenSource, /const splitPaneToolbarOpenIcon = getSplitPaneToolbarActionMobileIconState\('open'\);/);
  assert.match(screenSource, /const splitPaneEmptyChooseIcon = getSplitPaneEmptyStateActionMobileIconState\('choose'\);/);
  assert.match(screenSource, /const splitPaneEmptyNewChatIcon = getSplitPaneEmptyStateActionMobileIconState\('newChat'\);/);
  assert.match(screenSource, /const splitPaneModalCreateIcon = getSplitPaneModalCreateMobileIconState\(\);/);
  assert.match(screenSource, /name=\{splitPaneToolbarChooseIcon\.name\}/);
  assert.match(screenSource, /size=\{splitPaneToolbarChooseIcon\.size\}/);
  assert.match(screenSource, /color=\{splitPaneColors\.toolbarButton\.iconColor\}/);
  assert.match(screenSource, /name=\{splitPaneToolbarOpenIcon\.name\}/);
  assert.match(screenSource, /name=\{splitPaneEmptyChooseIcon\.name\}/);
  assert.match(screenSource, /color=\{splitPaneColors\.primaryButton\.iconColor\}/);
  assert.match(screenSource, /name=\{splitPaneEmptyNewChatIcon\.name\}/);
  assert.match(screenSource, /color=\{splitPaneColors\.secondaryButton\.iconColor\}/);
  assert.match(screenSource, /name=\{splitPaneModalCreateIcon\.name\}/);
  assert.match(screenSource, /color=\{splitPaneColors\.newChatOption\.iconColor\}/);
  assert.doesNotMatch(screenSource, /name="(list-outline|expand-outline|chatbubbles-outline|add-circle-outline)"/);
});

test('uses shared split-pane touch semantics for mobile controls', () => {
  assert.match(sharedSplitPaneSource, /accessibilityRole:\s*"button"/);
  assert.match(sharedSplitPaneSource, /pressedOpacity:\s*0\.78/);
  assert.match(screenSource, /accessibilityRole=\{splitPaneSurface\.toolbarButton\.accessibilityRole\}/);
  assert.match(screenSource, /activeOpacity=\{splitPaneSurface\.toolbarButton\.pressedOpacity\}/);
  assert.match(screenSource, /accessibilityRole=\{splitPaneSurface\.primaryButton\.accessibilityRole\}/);
  assert.match(screenSource, /activeOpacity=\{splitPaneSurface\.primaryButton\.pressedOpacity\}/);
  assert.match(screenSource, /accessibilityRole=\{splitPaneSurface\.secondaryButton\.accessibilityRole\}/);
  assert.match(screenSource, /activeOpacity=\{splitPaneSurface\.secondaryButton\.pressedOpacity\}/);
  assert.match(screenSource, /accessibilityRole=\{splitPaneSurface\.segmentButton\.accessibilityRole\}/);
  assert.match(screenSource, /accessibilityState=\{\{ selected: isSelected \}\}/);
  assert.match(screenSource, /pressed && \{ opacity: splitPaneSurface\.segmentButton\.pressedOpacity \}/);
  assert.match(screenSource, /accessibilityRole=\{splitPaneSurface\.sessionOption\.accessibilityRole\}/);
  assert.match(screenSource, /activeOpacity=\{splitPaneSurface\.sessionOption\.pressedOpacity\}/);
  assert.match(screenSource, /accessibilityRole=\{splitPaneSurface\.newChatOption\.accessibilityRole\}/);
  assert.match(screenSource, /activeOpacity=\{splitPaneSurface\.newChatOption\.pressedOpacity\}/);
  assert.match(screenSource, /accessibilityLabel=\{createButtonAccessibilityLabel\(splitPaneCopy\.emptyState\.chooseLabel\)\}/);
  assert.match(screenSource, /accessibilityLabel=\{createButtonAccessibilityLabel\(splitPaneCopy\.emptyState\.newChatLabel\)\}/);
  assert.match(screenSource, /accessibilityLabel=\{createButtonAccessibilityLabel\(splitPaneCopy\.modal\.createNewChatLabel\)\}/);
  assert.doesNotMatch(screenSource, /accessibilityRole="button"/);
  assert.doesNotMatch(screenSource, /activeOpacity=\{0\.78\}/);
});

test('uses shared split-pane presentation for the mobile picker modal and session rows', () => {
  assert.match(sharedSplitPaneSource, /modalCard:\s*\{/);
  assert.match(sharedSplitPaneSource, /modalTitle:\s*\{/);
  assert.match(sharedSplitPaneSource, /newChatOption:\s*\{/);
  assert.match(sharedSplitPaneSource, /const modalCardSurface = surface\.modalCard/);
  assert.match(sharedSplitPaneSource, /const sessionOptionSurface = surface\.sessionOption/);
  assert.match(sharedSplitPaneSource, /const newChatOptionSurface = surface\.newChatOption/);
  assert.match(sharedSplitPaneSource, /modalCard:\s*\{[\s\S]*?maxHeight:\s*modalCardSurface\.maxHeight/);
  assert.match(sharedSplitPaneSource, /modalTitle:\s*\{[\s\S]*?color:\s*colors\.modalTitle\.color/);
  assert.match(sharedSplitPaneSource, /sessionOption:\s*\{[\s\S]*?borderRadius:\s*radius\[sessionOptionSurface\.borderRadius\]/);
  assert.match(sharedSplitPaneSource, /sessionOptionTitle:\s*\{[\s\S]*?color:\s*colors\.sessionOptionTitle\.color/);
  assert.match(sharedSplitPaneSource, /sessionOptionPreview:\s*\{[\s\S]*?color:\s*colors\.sessionOptionPreview\.color/);
  assert.match(sharedSplitPaneSource, /newChatOptionText:\s*\{[\s\S]*?fontWeight:\s*newChatOptionTextSurface\.fontWeight/);
  assert.doesNotMatch(screenSource, /const modalCardSurface = splitPaneSurface\.modalCard;/);
  assert.doesNotMatch(screenSource, /const sessionOptionSurface = splitPaneSurface\.sessionOption;/);
  assert.doesNotMatch(screenSource, /const newChatOptionSurface = splitPaneSurface\.newChatOption;/);
  assert.doesNotMatch(screenSource, /modalCard:\s*\{\s*maxHeight:\s*'75%'/);
  assert.doesNotMatch(screenSource, /sessionOption:\s*\{\s*borderRadius:\s*radius\.lg/);
  assert.doesNotMatch(screenSource, /sessionOptionTitle:\s*\{[^}]*?fontWeight:\s*'600'/);
  assert.doesNotMatch(screenSource, /newChatOptionText:\s*\{[^}]*?fontWeight:\s*'700'/);
});

test('uses shared split-pane presentation for mobile split chat copy', () => {
  assert.match(sharedSplitPaneSource, /copy:\s*\{/);
  assert.match(sharedSplitPaneSource, /getSplitPaneCopyState\(\)/);
  assert.match(screenSource, /formatSplitPaneChooseAccessibilityLabel,/);
  assert.match(screenSource, /formatSplitPaneModalTitle,/);
  assert.match(screenSource, /formatSplitPaneOpenAccessibilityLabel,/);
  assert.match(screenSource, /const splitPaneCopy = getSplitPaneCopyState\(\);/);
  assert.match(screenSource, /\{splitPaneCopy\.paneLabel\[pane\]\}/);
  assert.match(screenSource, /\{session\?\.title \|\| splitPaneCopy\.noChatSelected\}/);
  assert.match(screenSource, /createButtonAccessibilityLabel\(formatSplitPaneChooseAccessibilityLabel\(pane\)\)/);
  assert.match(screenSource, /createButtonAccessibilityLabel\(formatSplitPaneOpenAccessibilityLabel\(pane\)\)/);
  assert.match(screenSource, /\{splitPaneCopy\.toolbar\.chooseLabel\}/);
  assert.match(screenSource, /\{splitPaneCopy\.toolbar\.openLabel\}/);
  assert.match(screenSource, /\{splitPaneCopy\.title\}/);
  assert.match(screenSource, /\{splitPaneCopy\.description\}/);
  assert.match(screenSource, /\{splitPaneCopy\.orientationLabel\[option\]\}/);
  assert.match(screenSource, /\{formatSplitPaneModalTitle\(pickerPane\)\}/);
  assert.match(screenSource, /item\.preview \|\| splitPaneCopy\.modal\.sessionPreviewFallback/);
  assert.match(screenSource, /\{splitPaneCopy\.modal\.createNewChatLabel\}/);
  assert.doesNotMatch(screenSource, />Split view<\/Text>/);
  assert.doesNotMatch(screenSource, /Run and compare two sessions at once\. Hands-free mode is paused while split view is open\./);
  assert.doesNotMatch(screenSource, /`Choose \$\{pane\} split chat`/);
  assert.doesNotMatch(screenSource, /`Open \$\{pane\} split chat full screen`/);
  assert.doesNotMatch(screenSource, /'No messages yet'/);
  assert.doesNotMatch(screenSource, /SPLIT_PANE_PRESENTATION\.copy/);
});
