const test = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")

const screenSource = fs.readFileSync(
  path.join(__dirname, "..", "src", "screens", "SessionListScreen.tsx"),
  "utf8",
)
const sharedConversationListSource = fs.readFileSync(
  path.join(
    __dirname,
    "..",
    "..",
    "..",
    "packages",
    "shared",
    "src",
    "conversation-list-presentation.ts",
  ),
  "utf8",
)

test("avoids redundant desktop emoji chrome in stub session rows", () => {
  assert.doesNotMatch(screenSource, /💻/)
  assert.match(screenSource, /APP_CONVERSATION_LIST_COPY\.desktopSourceLabel/)
  assert.match(
    screenSource,
    /getConversationListMessageCountLabel\(\s*item\.messageCount/,
  )
})

test("keeps session rows to a compact two-line layout with inline metadata", () => {
  assert.match(
    screenSource,
    /<Text[\s\S]*?style=\{styles\.sessionTitle\}[\s\S]*?numberOfLines=\{[\s\S]*?conversationListSurface\.sessionRow\.title\.numberOfLines[\s\S]*?\}/,
  )
  assert.match(
    screenSource,
    /<Text[\s\S]*?style=\{styles\.sessionPreview\}[\s\S]*?numberOfLines=\{[\s\S]*?conversationListSurface\.sessionRow\.preview\.numberOfLines[\s\S]*?\}[\s\S]*?<Text style=\{styles\.sessionPreviewMeta\}>/,
  )
  assert.doesNotMatch(screenSource, /styles\.sessionMeta/)
  assert.doesNotMatch(
    screenSource,
    /<Text style=\{styles\.sessionTitle\} numberOfLines=\{1\}>/,
  )
  assert.doesNotMatch(
    screenSource,
    /<Text style=\{styles\.sessionPreview\} numberOfLines=\{1\}>/,
  )
})

test("does not append raw tool payload text into session previews when merging tool results", () => {
  assert.doesNotMatch(
    screenSource,
    /lastMessage\.content = \(lastMessage\.content \|\| ''\) \+\s*\(lastMessage\.content \? '\\n' : ''\) \+ historyMsg\.content/,
  )
})

test("keeps the session title row shrinkable for narrow mobile widths", () => {
  assert.match(sharedConversationListSource, /titleRow:\s*\{/)
  assert.match(sharedConversationListSource, /title:\s*\{[\s\S]*?flex:\s*1/)
  assert.match(
    screenSource,
    /const sessionRow = conversationListSurface\.sessionRow/,
  )
  assert.match(
    screenSource,
    /sessionTitleRow:\s*\{[\s\S]*?flex:\s*sessionRow\.titleRow\.flex,[\s\S]*?minWidth:\s*sessionRow\.titleRow\.minWidth,[\s\S]*?marginRight:\s*sessionRow\.titleRow\.marginRight,/,
  )
  assert.match(
    screenSource,
    /sessionTitle:\s*\{[\s\S]*?flex:\s*sessionRow\.title\.flex,[\s\S]*?minWidth:\s*sessionRow\.title\.minWidth,/,
  )
})

test("moves new chat into the navigation header and removes the old inline action row", () => {
  assert.match(sharedConversationListSource, /loadingLabel:\s*"Loading chats\.\.\."/)
  assert.match(sharedConversationListSource, /screen:\s*\{/)
  assert.match(sharedConversationListSource, /header:\s*\{/)
  assert.match(screenSource, /APP_CONVERSATION_LIST_COPY\.loadingLabel/)
  assert.match(screenSource, /style=\{styles\.headerNewChatButton\}/)
  assert.match(screenSource, /style=\{styles\.headerActionsRow\}/)
  assert.match(screenSource, /APP_SHELL_HEADER_ACTIONS\.newChat\.displayLabel/)
  assert.match(
    screenSource,
    /const screenChrome = conversationListSurface\.screen/,
  )
  assert.match(
    screenSource,
    /const conversationHeader = conversationListSurface\.header/,
  )
  assert.match(
    screenSource,
    /headerTitleText:\s*\{[\s\S]*?fontSize:\s*conversationHeader\.title\.fontSize,[\s\S]*?color:\s*conversationListColors\.header\.titleColor/,
  )
  assert.match(
    screenSource,
    /headerActionsRow:\s*\{[\s\S]*?flexDirection:\s*headerSurface\.actionsRow\.flexDirection,[\s\S]*?alignItems:\s*headerSurface\.actionsRow\.alignItems,[\s\S]*?gap:\s*headerSurface\.actionsRow\.gap/,
  )
  assert.match(
    screenSource,
    /headerNewChatButton:\s*\{[\s\S]*?backgroundColor:\s*conversationListColors\.header\.newChatButtonBackgroundColor,[\s\S]*?borderRadius:\s*radius\[conversationHeader\.newChatButton\.borderRadius\]/,
  )
  assert.match(
    screenSource,
    /headerNewChatButtonText:\s*\{[\s\S]*?color:\s*conversationListColors\.header\.newChatTextColor,[\s\S]*?fontSize:\s*conversationHeader\.newChatText\.fontSize/,
  )
  assert.doesNotMatch(screenSource, /styles\.clearButton/)
})

test("uses shared mobile icons for session list header actions", () => {
  assert.match(screenSource, /getAppShellHeaderActionMobileIconColors,/)
  assert.match(screenSource, /getAppShellHeaderActionMobileIconState,/)
  assert.match(
    screenSource,
    /const openSplitViewIcon =\s*getAppShellHeaderActionMobileIconState\("openSplitView"\)/,
  )
  assert.match(
    screenSource,
    /const openSettingsIcon = getAppShellHeaderActionMobileIconState\("openSettings"\)/,
  )
  assert.match(screenSource, /name=\{openSplitViewIcon\.name\}/)
  assert.match(screenSource, /size=\{openSplitViewIcon\.size\}/)
  assert.match(
    screenSource,
    /color=\{headerActionIconColors\.openSplitView\.color\}/,
  )
  assert.match(screenSource, /name=\{openSettingsIcon\.name\}/)
  assert.match(screenSource, /size=\{openSettingsIcon\.size\}/)
  assert.match(
    screenSource,
    /color=\{headerActionIconColors\.openSettings\.color\}/,
  )
  assert.match(
    screenSource,
    /openSplitView:\s*getAppShellHeaderActionMobileIconColors\([\s\S]*?theme\.colors,[\s\S]*?"openSplitView"/,
  )
  assert.match(
    screenSource,
    /openSettings:\s*getAppShellHeaderActionMobileIconColors\([\s\S]*?theme\.colors,[\s\S]*?"openSettings"/,
  )
  assert.doesNotMatch(
    screenSource,
    /APP_SHELL_HEADER_ACTIONS\.(openSplitView|openSettings)\.mobileIcon/,
  )
  assert.doesNotMatch(
    screenSource,
    /theme\.colors\[(openSplitViewIcon|openSettingsIcon)\.colorToken\]/,
  )
  assert.doesNotMatch(screenSource, />◫<\/Text>/)
  assert.doesNotMatch(screenSource, />⚙️<\/Text>/)
})

test("shares the session list header agent selector chip with the chat runtime header presentation", () => {
  assert.match(screenSource, /getChatRuntimeCopyState,/)
  assert.match(
    screenSource,
    /formatChatRuntimeAgentSelectorAccessibilityLabel,/,
  )
  assert.match(screenSource, /getChatRuntimeAgentSelectorMobileIconState,/)
  assert.match(screenSource, /getChatRuntimeAgentSelectorMobileColors,/)
  assert.match(screenSource, /getChatRuntimeHeaderMobileSurfaceState,/)
  assert.match(
    screenSource,
    /const chatRuntimeCopy = getChatRuntimeCopyState\(\)/,
  )
  assert.match(
    screenSource,
    /const mobileHeaderSurface = getChatRuntimeHeaderMobileSurfaceState\(\)/,
  )
  assert.match(
    screenSource,
    /const headerAgentSelectorIcon = getChatRuntimeAgentSelectorMobileIconState\(\)/,
  )
  assert.match(
    screenSource,
    /const currentAgentLabel =[\s\S]*?currentProfile\?\.name \|\| chatRuntimeCopy\.header\.defaultAgentLabel/,
  )
  assert.match(
    screenSource,
    /accessibilityLabel=\{formatChatRuntimeAgentSelectorAccessibilityLabel\([\s\S]*?currentAgentLabel,[\s\S]*?\)\}/,
  )
  assert.match(
    screenSource,
    /accessibilityHint=\{[\s\S]*?chatRuntimeCopy\.header\.agentSelectorAccessibilityHint[\s\S]*?\}/,
  )
  assert.match(screenSource, /style=\{styles\.headerTitleAgentSelectorButton\}/)
  assert.match(screenSource, /style=\{styles\.headerAgentSelectorChip\}/)
  assert.match(
    screenSource,
    /style=\{styles\.headerAgentSelectorText\}[\s\S]*?numberOfLines=\{[\s\S]*?mobileHeaderSurface\.agentSelectorText\.numberOfLines[\s\S]*?\}/,
  )
  assert.match(screenSource, /name=\{headerAgentSelectorIcon\.name\}/)
  assert.match(screenSource, /size=\{headerAgentSelectorIcon\.size\}/)
  assert.match(
    screenSource,
    /color=\{headerAgentSelectorColors\.icon\.color\}/,
  )
  assert.match(
    screenSource,
    /const headerAgentSelectorColors = useMemo\(\s*\(\) => getChatRuntimeAgentSelectorMobileColors\(theme\.colors\),/,
  )
  assert.match(
    screenSource,
    /const headerSurface = getChatRuntimeHeaderMobileSurfaceState\(\)/,
  )
  assert.match(
    screenSource,
    /headerTitleAgentSelectorButton:\s*\{[\s\S]*?minHeight:\s*headerSurface\.agentSelectorButton\.minHeight/,
  )
  assert.match(
    screenSource,
    /headerAgentSelectorChip:\s*\{[\s\S]*?backgroundColor:\s*headerAgentSelectorColors\.chip\.backgroundColor/,
  )
  assert.match(
    screenSource,
    /headerAgentSelectorChip:\s*\{[\s\S]*?maxWidth:\s*headerSurface\.agentSelectorChip\.maxWidth/,
  )
  assert.match(
    screenSource,
    /headerAgentSelectorChip:\s*\{[\s\S]*?marginTop:\s*conversationHeader\.agentSelectorChip\.marginTop/,
  )
  assert.match(
    screenSource,
    /headerAgentSelectorText:\s*\{[\s\S]*?fontSize:\s*headerSurface\.agentSelectorText\.fontSize,[\s\S]*?color:\s*headerAgentSelectorColors\.text\.color/,
  )
  assert.doesNotMatch(
    screenSource,
    /style=\{styles\.headerAgentSelectorText\} numberOfLines=\{1\}/,
  )
  assert.doesNotMatch(
    screenSource,
    /style=\{\{\s*flexDirection:\s*"row",\s*alignItems:\s*"center"\s*\}\}/,
  )
  assert.doesNotMatch(
    screenSource,
    /Current agent: \$\{currentProfile\?\.name \|\| 'Default'\}\. Tap to change\./,
  )
  assert.doesNotMatch(screenSource, /theme\.colors\.primary \+ '33'/)
  assert.doesNotMatch(screenSource, /theme\.colors\[headerAgentSelectorIcon\.colorToken\]/)
  assert.doesNotMatch(screenSource, /theme\.colors\[headerSurface\.agentSelector(Chip|Text)\./)
  assert.doesNotMatch(
    screenSource,
    /\{currentProfile\?\.name \|\| 'Default'\} ▼/,
  )
  assert.doesNotMatch(
    screenSource,
    /CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION\.mobile/,
  )
  assert.doesNotMatch(
    screenSource,
    /CHAT_RUNTIME_PRESENTATION\.header\.agentSelectorMobileIcon/,
  )
  assert.doesNotMatch(screenSource, /CHAT_RUNTIME_PRESENTATION\.header/)
})

test("keeps pin controls in chat rows and removes the helper copy under search", () => {
  assert.match(screenSource, /getConversationListPinActionPresentation/)
  assert.match(screenSource, /getConversationListArchiveActionPresentation/)
  assert.match(screenSource, /getConversationListDeleteActionPresentation/)
  assert.match(screenSource, /pinAction\.displayLabel/)
  assert.match(screenSource, /archiveAction\.displayLabel/)
  assert.match(screenSource, /styles\.sessionPinButton/)
  assert.doesNotMatch(screenSource, /styles\.searchHelperText/)
})

test("keeps archived chats reachable from the session list", () => {
  assert.match(screenSource, /sessionListMode/)
  assert.match(
    screenSource,
    /filterSessionsByArchiveMode\(results, sessionListMode\)/,
  )
  assert.match(
    screenSource,
    /getConversationArchiveFilterLabel\([\s\S]*?"archived",[\s\S]*?sessionArchiveCount/,
  )
  assert.match(screenSource, /archiveAction\.displayLabel/)
})

test("uses shared mobile presentation for search clear and archive filters", () => {
  assert.match(
    sharedConversationListSource,
    /CONVERSATION_LIST_MOBILE_PRESENTATION/,
  )
  assert.match(
    sharedConversationListSource,
    /getConversationListMobileSurfaceState\(\)/,
  )
  assert.match(
    sharedConversationListSource,
    /getConversationListMobileSurfaceColors/,
  )
  assert.match(
    sharedConversationListSource,
    /accessibilityLabel:\s*"Clear chat search"/,
  )
  assert.match(sharedConversationListSource, /backgroundAlpha:\s*0\.07/)
  assert.match(sharedConversationListSource, /listShell:\s*\{/)
  assert.match(
    sharedConversationListSource,
    /searchInput:\s*\{[\s\S]*?placeholderColorToken:\s*"mutedForeground"/,
  )
  assert.match(
    sharedConversationListSource,
    /searchSection:\s*\{[\s\S]*?paddingHorizontal:\s*"md"[\s\S]*?gap:\s*"xs"/,
  )
  assert.match(
    sharedConversationListSource,
    /emptyList:\s*\{[\s\S]*?justifyContent:\s*"center"[\s\S]*?alignItems:\s*"center"/,
  )
  assert.match(sharedConversationListSource, /emptyState:\s*\{/)

  assert.match(screenSource, /getConversationListMobileSurfaceState,/)
  assert.match(screenSource, /getConversationListMobileSurfaceColors,/)
  assert.match(
    screenSource,
    /const conversationListSurface = getConversationListMobileSurfaceState\(\)/,
  )
  assert.match(
    screenSource,
    /const conversationListColors = useMemo\(\s*\(\) => getConversationListMobileSurfaceColors\(theme\.colors\),/,
  )
  assert.match(
    screenSource,
    /const listShell = conversationListSurface\.listShell/,
  )
  assert.match(
    screenSource,
    /placeholderTextColor=\{[\s\S]*?conversationListColors\.listShell\.searchInputPlaceholderColor[\s\S]*?\}/,
  )
  assert.match(
    screenSource,
    /container:\s*\{[\s\S]*?backgroundColor:\s*conversationListColors\.screen\.containerBackgroundColor/,
  )
  assert.match(
    screenSource,
    /loadingText:\s*\{[\s\S]*?color:\s*conversationListColors\.screen\.loadingTextColor/,
  )
  assert.match(
    screenSource,
    /newButton:\s*\{[\s\S]*?backgroundColor:\s*conversationListColors\.screen\.primaryActionButtonBackgroundColor,[\s\S]*?borderRadius:\s*radius\[screenChrome\.primaryActionButton\.borderRadius\]/,
  )
  assert.match(
    screenSource,
    /conversationListSurface\.searchClear\.accessibilityLabel/,
  )
  assert.match(
    screenSource,
    /conversationListSurface\.searchClear\.accessibilityHint/,
  )
  assert.match(screenSource, /conversationListSurface\.searchClear\.label/)
  assert.match(
    screenSource,
    /const archiveFilter = conversationListSurface\.archiveFilter/,
  )
  assert.match(
    screenSource,
    /const emptyStateSurface = conversationListSurface\.emptyState/,
  )
  assert.match(
    screenSource,
    /horizontalPadding:\s*spacing\[archiveFilter\.button\.horizontalPadding\]/,
  )
  assert.match(
    screenSource,
    /borderColor:\s*conversationListColors\.archiveFilter\.selectedButtonBorderColor/,
  )
  assert.match(
    screenSource,
    /backgroundColor:\s*conversationListColors\.archiveFilter\.selectedButtonBackgroundColor/,
  )
  assert.match(
    screenSource,
    /searchSection:\s*\{[\s\S]*?paddingHorizontal:\s*spacing\[listShell\.searchSection\.paddingHorizontal\],[\s\S]*?gap:\s*spacing\[listShell\.searchSection\.gap\]/,
  )
  assert.match(
    screenSource,
    /searchInputRow:\s*\{[\s\S]*?flexDirection:\s*listShell\.searchInputRow\.flexDirection,[\s\S]*?gap:\s*spacing\[listShell\.searchInputRow\.gap\]/,
  )
  assert.match(
    screenSource,
    /emptyList:\s*\{[\s\S]*?flex:\s*listShell\.emptyList\.flex,[\s\S]*?justifyContent:\s*listShell\.emptyList\.justifyContent,[\s\S]*?alignItems:\s*listShell\.emptyList\.alignItems/,
  )

  const filterActiveBlock = screenSource.match(
    /sessionFilterButtonActive:\s*\{[\s\S]*?\n    \},/,
  )
  assert.ok(
    filterActiveBlock,
    "expected a sessionFilterButtonActive style block",
  )
  assert.doesNotMatch(filterActiveBlock[0], /theme\.colors\.primary \+ '12'/)
  assert.doesNotMatch(filterActiveBlock[0], /hexToRgba\(/)
  assert.doesNotMatch(screenSource, /CONVERSATION_LIST_MOBILE_PRESENTATION/)
  assert.doesNotMatch(screenSource, /theme\.colors\.[A-Za-z0-9_]+/)
})

test("uses shared mobile presentation for session list text clamps", () => {
  assert.match(sharedConversationListSource, /sessionRow:\s*\{/)
  assert.match(
    sharedConversationListSource,
    /item:\s*\{[\s\S]*?backgroundColorToken:\s*"card"/,
  )
  assert.match(
    sharedConversationListSource,
    /previewMeta:\s*\{[\s\S]*?fontWeight:\s*"500"/,
  )
  assert.match(sharedConversationListSource, /disconnectedState:\s*\{/)
  assert.match(
    sharedConversationListSource,
    /card:\s*\{[\s\S]*?maxWidth:\s*420[\s\S]*?backgroundColorToken:\s*"card"/,
  )
  assert.match(
    sharedConversationListSource,
    /secondaryButtonText:\s*\{[\s\S]*?colorToken:\s*"foreground"/,
  )
  assert.match(sharedConversationListSource, /rapidFire:\s*\{/)
  assert.match(
    sharedConversationListSource,
    /button:\s*\{[\s\S]*?heightScreenRatio:\s*0\.18[\s\S]*?borderWidth:\s*1\.5/,
  )
  assert.match(
    screenSource,
    /const sessionRow = conversationListSurface\.sessionRow/,
  )
  assert.match(
    screenSource,
    /const rapidFire = conversationListSurface\.rapidFire/,
  )
  assert.match(
    screenSource,
    /const disconnectedStateSurface = conversationListSurface\.disconnectedState/,
  )
  assert.match(
    screenSource,
    /numberOfLines=\{[\s\S]*?conversationListSurface\.sessionRow\.title\.numberOfLines[\s\S]*?\}/,
  )
  assert.match(
    screenSource,
    /numberOfLines=\{[\s\S]*?conversationListSurface\.sessionRow\.preview\.numberOfLines[\s\S]*?\}/,
  )
  assert.match(
    screenSource,
    /numberOfLines=\{[\s\S]*?conversationListSurface\.disconnectedState\.meta\.numberOfLines[\s\S]*?\}/,
  )
  assert.match(
    screenSource,
    /numberOfLines=\{[\s\S]*?conversationListSurface\.rapidFire\.transcript\.numberOfLines[\s\S]*?\}/,
  )
  assert.match(
    screenSource,
    /sessionItem:\s*\{[\s\S]*?backgroundColor:\s*conversationListColors\.sessionRow\.itemBackgroundColor,[\s\S]*?borderRadius:\s*radius\[sessionRow\.item\.borderRadius\],[\s\S]*?padding:\s*spacing\[sessionRow\.item\.padding\]/,
  )
  assert.match(
    screenSource,
    /sessionItemActive:\s*\{[\s\S]*?borderColor:\s*conversationListColors\.sessionRow\.activeItemBorderColor,[\s\S]*?borderWidth:\s*sessionRow\.activeItem\.borderWidth/,
  )
  assert.match(
    screenSource,
    /sessionPreviewMeta:\s*\{[\s\S]*?\.\.\.theme\.typography\[sessionRow\.previewMeta\.typographyToken\],[\s\S]*?fontWeight:\s*sessionRow\.previewMeta\.fontWeight/,
  )
  assert.match(
    screenSource,
    /disconnectedCard:\s*\{[\s\S]*?backgroundColor:\s*conversationListColors\.disconnectedState\.cardBackgroundColor,[\s\S]*?borderRadius:\s*radius\[disconnectedStateSurface\.card\.borderRadius\],[\s\S]*?padding:\s*spacing\[disconnectedStateSurface\.card\.padding\]/,
  )
  assert.match(
    screenSource,
    /disconnectedSecondaryButtonText:\s*\{[\s\S]*?color:\s*conversationListColors\.disconnectedState\.secondaryButtonTextColor,[\s\S]*?fontWeight:\s*disconnectedStateSurface\.secondaryButtonText\.fontWeight/,
  )
  assert.match(
    screenSource,
    /const rfButtonHeight = Math\.round\([\s\S]*?screenHeight \* rapidFire\.button\.heightScreenRatio,[\s\S]*?\)/,
  )
  assert.match(
    screenSource,
    /rfContainer:\s*\{[\s\S]*?borderTopWidth:\s*theme\[rapidFire\.container\.borderTopWidthToken\],[\s\S]*?backgroundColor:\s*conversationListColors\.rapidFire\.containerBackgroundColor/,
  )
  assert.match(
    screenSource,
    /rfButton:\s*\{[\s\S]*?width:\s*rapidFire\.button\.width,[\s\S]*?borderWidth:\s*rapidFire\.button\.borderWidth,[\s\S]*?justifyContent:\s*rapidFire\.button\.justifyContent/,
  )
  assert.match(
    screenSource,
    /rfButtonPressed:\s*\{[\s\S]*?opacity:\s*rapidFire\.pressedButton\.opacity/,
  )
  assert.doesNotMatch(
    screenSource,
    /<Text style=\{styles\.disconnectedMeta\} numberOfLines=\{2\}>/,
  )
  assert.doesNotMatch(
    screenSource,
    /<Text style=\{styles\.rfTranscript\} numberOfLines=\{2\}>/,
  )
})

test("uses shared mobile presentation for conversation row action chips", () => {
  assert.match(sharedConversationListSource, /rowAction:\s*\{/)
  assert.match(
    sharedConversationListSource,
    /activeButton:\s*\{[\s\S]*?backgroundAlpha:\s*0\.07/,
  )
  assert.match(
    screenSource,
    /const rowAction = conversationListSurface\.rowAction/,
  )
  assert.match(
    screenSource,
    /horizontalPadding:\s*spacing\[rowAction\.button\.horizontalPadding\]/,
  )
  assert.match(
    screenSource,
    /borderColor:\s*conversationListColors\.rowAction\.activeButtonBorderColor/,
  )
  assert.match(
    screenSource,
    /backgroundColor:\s*conversationListColors\.rowAction\.activeButtonBackgroundColor/,
  )

  const pinActiveBlock = screenSource.match(
    /sessionPinButtonActive:\s*\{[\s\S]*?\n    \},/,
  )
  assert.ok(pinActiveBlock, "expected a sessionPinButtonActive style block")
  assert.doesNotMatch(pinActiveBlock[0], /theme\.colors\.primary \+ '12'/)
  assert.doesNotMatch(pinActiveBlock[0], /hexToRgba\(/)
})

test("uses shared mobile presentation for the rename dialog surface", () => {
  assert.match(sharedConversationListSource, /renameDialog:\s*\{/)
  assert.match(
    sharedConversationListSource,
    /title:\s*"Rename conversation title"/,
  )
  assert.match(
    sharedConversationListSource,
    /overlay:\s*\{[\s\S]*?alpha:\s*0\.45/,
  )
  assert.match(
    screenSource,
    /const renameDialog = conversationListSurface\.renameDialog/,
  )
  assert.match(screenSource, /conversationListSurface\.renameDialog\.title/)
  assert.match(
    screenSource,
    /conversationListSurface\.renameDialog\.inputPlaceholder/,
  )
  assert.match(
    screenSource,
    /placeholderTextColor=\{[\s\S]*?conversationListColors\.renameDialog\.inputPlaceholderColor[\s\S]*?\}/,
  )
  assert.match(
    screenSource,
    /conversationListSurface\.renameDialog\.cancelAccessibilityLabel/,
  )
  assert.match(
    screenSource,
    /conversationListSurface\.renameDialog\.saveAccessibilityLabel/,
  )
  assert.match(
    screenSource,
    /backgroundColor:\s*conversationListColors\.renameDialog\.overlayBackgroundColor/,
  )
  assert.match(
    screenSource,
    /backgroundColor:\s*conversationListColors\.renameDialog\.contentBackgroundColor/,
  )
  assert.match(
    screenSource,
    /opacity:\s*renameDialog\.saveButton\.disabledOpacity/,
  )
  assert.doesNotMatch(
    screenSource,
    /backgroundColor:\s*'rgba\(0, 0, 0, 0\.45\)'/,
  )
})

test("uses shared conversation presentation for delete actions", () => {
  assert.match(
    sharedConversationListSource,
    /getConversationListDeleteActionPresentation/,
  )
  assert.match(
    sharedConversationListSource,
    /confirmationTitle:\s*"Delete conversation"/,
  )
  assert.match(
    screenSource,
    /const deleteAction = getConversationListDeleteActionPresentation/,
  )
  assert.match(
    screenSource,
    /Alert\.alert\([\s\S]*?deleteAction\.failureTitle,[\s\S]*?getErrorMessage\(error\)/,
  )
  assert.match(
    screenSource,
    /window\.confirm\(deleteAction\.webConfirmationMessage\)/,
  )
  assert.match(
    screenSource,
    /Alert\.alert\(\s*deleteAction\.confirmationTitle,[\s\S]*?deleteAction\.confirmationMessage/,
  )
  assert.match(
    screenSource,
    /\{[\s\S]*?text: deleteAction\.actionLabel,[\s\S]*?style: "destructive"/,
  )
  assert.doesNotMatch(screenSource, /'Delete Session'/)
  assert.doesNotMatch(screenSource, /'Delete Failed'/)
})
