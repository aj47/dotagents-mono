const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const screenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'ChatScreen.tsx'),
  'utf8'
);
const chatMessageChromeSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'ui', 'ChatMessageChrome.tsx'),
  'utf8'
);

test('exposes the chat composer send control as an accessible button', () => {
  assert.doesNotMatch(screenSource, /<ChatComposerRuntimeDock/);
  assert.match(screenSource, /composer: \{[\s\S]*?submitAction: \{\s+renderState: composerSubmitRenderState,/);
  assert.match(chatMessageChromeSource, /<ChatComposerLabeledActionButton\s+\{\.\.\.submitAction\}\s+styles=\{styles\.submitAction\}/);
  assert.match(chatMessageChromeSource, /accessibilityRole=\{renderState\.accessibilityRole\}[\s\S]*?accessibilityLabel=\{renderState\.accessibilityLabel\}/);
  assert.match(chatMessageChromeSource, /accessibilityHint=\{renderState\.accessibilityHint \?\? undefined\}/);
  assert.match(chatMessageChromeSource, /accessibilityState=\{renderState\.accessibilityState\}/);
});

test('uses shared session presentation for mobile composer copy and disabled state', () => {
  assert.match(screenSource, /getFollowUpInputPresentation/);
  assert.match(screenSource, /getChatComposerMobileControlState/);
  assert.match(screenSource, /getChatComposerQueueMobileRenderState/);
  assert.match(screenSource, /getChatComposerSubmitMobileRenderState/);
  assert.match(screenSource, /getChatComposerTextToSpeechMobileRenderState/);
  assert.match(screenSource, /getChatComposerEditBeforeSendMobileRenderState/);
  assert.match(screenSource, /const mobileComposerControls = useMemo\(\s+\(\) => getChatComposerMobileControlState\(\),\s+\[\],\s+\);/);
  assert.match(screenSource, /const mobileComposerQueueRenderState = useMemo\(\s+\(\) => getChatComposerQueueMobileRenderState\(\{\s+isDisabled: !composerHasContent,\s+colors: theme\.colors,\s+\}\),\s+\[composerHasContent, theme\.colors\],\s+\);/);
  assert.doesNotMatch(screenSource, /getChatComposerMobileSurfaceState/);
  assert.match(screenSource, /const mobileComposerSurface = mobileComposerSurfaceRenderState\.surface;/);
  assert.match(screenSource, /getChatRuntimeMobileSafeAreaLayoutState/);
  assert.match(screenSource, /createChatComposerStyleSlots,/);
  assert.match(screenSource, /createChatComposerRuntimeDockStyleSlots,/);
  assert.match(screenSource, /createChatRuntimeMobileSafeAreaStyleSlots,/);
  assert.match(screenSource, /createChatRuntimeSafeAreaMergedStyleSlots,/);
  assert.match(screenSource, /const chatComposerStyles = useMemo\(\s+\(\) => createChatComposerStyleSlots\(styles\),\s+\[styles\],\s+\);/);
  assert.match(screenSource, /const mobileSafeAreaStyles = useMemo\(\s+\(\) => createChatRuntimeMobileSafeAreaStyleSlots\(mobileSafeAreaLayout\),\s+\[mobileSafeAreaLayout\],\s+\);/);
  assert.match(screenSource, /const chatSafeAreaStyles = useMemo\(\s+\(\) => createChatRuntimeSafeAreaMergedStyleSlots\(\{/);
  assert.match(screenSource, /const chatComposerRuntimeDockStyles = useMemo\(\s+\(\) => createChatComposerRuntimeDockStyleSlots\(\{/);
  assert.match(chatMessageChromeSource, /export function createChatComposerStyleSlots/);
  assert.match(chatMessageChromeSource, /export function createChatComposerRuntimeDockStyleSlots/);
  assert.match(chatMessageChromeSource, /export function createChatRuntimeMobileSafeAreaStyleSlots/);
  assert.match(chatMessageChromeSource, /export function createChatRuntimeSafeAreaMergedStyleSlots/);
  assert.match(screenSource, /const mobileComposerWebAccessibility = mobileComposerSurface\.webAccessibility;/);
  assert.doesNotMatch(screenSource, /CHAT_COMPOSER_PRESENTATION/);
  assert.doesNotMatch(screenSource, /CHAT_COMPOSER_SURFACE_PRESENTATION/);
  assert.doesNotMatch(screenSource, /mobileComposerCopy/);
  assert.match(screenSource, /const inputAreaSurface = composerSurface\.inputArea;/);
  assert.match(chatMessageChromeSource, /inputArea:\s*\{\s+paddingBottom: layout\.inputArea\.paddingBottom,\s+\}/);
  assert.doesNotMatch(screenSource, /inputArea:\s*\{\s*paddingBottom:\s*mobileSafeAreaLayout\.inputArea\.paddingBottom,\s*\}/);
  assert.match(screenSource, /composerStyles: chatComposerRuntimeDockStyles/);
  assert.doesNotMatch(screenSource, /chatComposerStyles\.inputDock\.area,\s*mobileSafeAreaStyles\.inputArea,/);
  assert.match(chatMessageChromeSource, /inputDock: \{[\s\S]*?area: \[\s+chatComposerStyles\.inputDock\.area,\s+safeAreaStyles\.inputArea,\s+\]/);
  assert.match(chatMessageChromeSource, /inputDock: safeAreaStyles\.inputDock,/);
  assert.match(chatMessageChromeSource, /inputDock: \{\s+area: styles\.inputArea,\s+row: styles\.inputRow,\s+micWrapper: styles\.micWrapper,\s+\}/);
  assert.match(chatMessageChromeSource, /<ChatComposerRuntimeDock\s+\{\.\.\.composer\}\s+styles=\{styles\.composer\}/);
  assert.match(chatMessageChromeSource, /export function ChatComposerRuntimeDock/);
  assert.match(chatMessageChromeSource, /export function ChatComposerInputDock/);
  assert.match(chatMessageChromeSource, /<View style=\{styles\.area\}>[\s\S]*?<View style=\{styles\.row\}>[\s\S]*?<View\s+ref=\{micWrapperRef\}[\s\S]*?style=\{styles\.micWrapper\}/);
  assert.doesNotMatch(screenSource, /mobileComposerSurface\.inputArea\.bottomInsetOffset \+ insets\.bottom/);
  assert.match(screenSource, /paddingHorizontal:\s*spacing\[inputAreaSurface\.micWrapperPaddingHorizontal\]/);
  assert.match(screenSource, /const sttPreviewSurface = composerSurface\.sttPreview;/);
  assert.match(screenSource, /spacing\[sttPreviewSurface\.paddingHorizontal\]/);
  assert.match(screenSource, /fontWeight:\s*sttPreviewSurface\.labelFontWeight/);
  assert.match(screenSource, /visuallyHiddenComposerHint:\s*\{[\s\S]*?position:\s*composerSurface\.visuallyHiddenComposerHint\.position,[\s\S]*?left:\s*composerSurface\.visuallyHiddenComposerHint\.left,[\s\S]*?width:\s*composerSurface\.visuallyHiddenComposerHint\.width,[\s\S]*?height:\s*composerSurface\.visuallyHiddenComposerHint\.height,/);
  assert.doesNotMatch(screenSource, /visuallyHiddenComposerHint:\s*\{\s*position:\s*'absolute',\s*left:\s*-10000,\s*width:\s*1,\s*height:\s*1,/);
  assert.match(screenSource, /conversationState: conversationState \?\? \(responding \? 'running' : 'complete'\)/);
  assert.match(screenSource, /composerPresentation\.placeholder \|\| composerPresentation\.submitTitle/);
  assert.match(screenSource, /composerPresentation\.isDisabled/);
  assert.match(screenSource, /getChatComposerSubmitMobileRenderState\(\{\s+presentation: composerPresentation,\s+isHandsFree: handsFree,\s+isDisabled: isComposerSubmitDisabled,\s+colors: theme\.colors,\s+\}\)/);
  assert.match(chatMessageChromeSource, /\{renderState\.label\}/);
  assert.doesNotMatch(screenSource, /composerSubmitAction/);
  assert.match(screenSource, /queueAction: \{[\s\S]*?renderState: mobileComposerQueueRenderState,/);
  assert.match(screenSource, /mobileComposerControls\.field\.accessibilityLabel/);
  assert.match(screenSource, /webAccessibility: mobileComposerWebAccessibility/);
  assert.match(chatMessageChromeSource, /inputDescriptionNativeId: webAccessibility\.inputDescriptionNativeId/);
  assert.match(chatMessageChromeSource, /voiceStatusLiveRegionNativeId: webAccessibility\.voiceStatusLiveRegionNativeId/);
  assert.match(chatMessageChromeSource, /voiceStatusLiveRegionPoliteness: webAccessibility\.voiceStatusLiveRegionPoliteness/);
  assert.match(chatMessageChromeSource, /aria-describedby=\{webAccessibility\.isWebPlatform \? webAccessibility\.inputDescriptionNativeId : undefined\}/);
  assert.match(chatMessageChromeSource, /nativeID=\{webAccessibility\.inputDescriptionNativeId\}/);
  assert.match(chatMessageChromeSource, /nativeID=\{webAccessibility\.voiceStatusLiveRegionNativeId\}/);
  assert.match(chatMessageChromeSource, /accessibilityLiveRegion=\{webAccessibility\.voiceStatusLiveRegionPoliteness\}/);
  assert.match(chatMessageChromeSource, /aria-live=\{voiceStatusAriaLive\}/);
  assert.doesNotMatch(screenSource, /CHAT_COMPOSER_HINT_NATIVE_ID/);
  assert.doesNotMatch(screenSource, /CHAT_VOICE_STATUS_LIVE_REGION_NATIVE_ID/);
});

test('exposes the handsfree queue control as an accessible button', () => {
  assert.match(screenSource, /queueAction: \{\s+shouldRender: handsFree && messageQueueEnabled,\s+renderState: mobileComposerQueueRenderState,/);
  assert.match(chatMessageChromeSource, /<ChatComposerLabeledActionButton\s+\{\.\.\.queueAction\}\s+styles=\{styles\.queueAction\}/);
  assert.match(chatMessageChromeSource, /accessibilityRole=\{renderState\.accessibilityRole\}[\s\S]*?accessibilityLabel=\{renderState\.accessibilityLabel\}/);
  assert.match(chatMessageChromeSource, /accessibilityHint=\{renderState\.accessibilityHint \?\? undefined\}/);
  assert.match(chatMessageChromeSource, /accessibilityState=\{renderState\.accessibilityState\}/);
  assert.match(chatMessageChromeSource, /disabled=\{renderState\.isDisabled\}/);
  assert.match(screenSource, /mobileComposerQueueRenderState\.debugMessage/);
});

test('uses shared mobile composer control accessibility state', () => {
  assert.match(screenSource, /label: mobileComposerControls\.sttPreview\.label/);
  assert.match(screenSource, /renderState: mobileComposerImageAttachmentRenderState/);
  assert.match(screenSource, /renderState: mobileComposerTextToSpeechRenderState/);
  assert.match(screenSource, /renderState: mobileComposerEditBeforeSendRenderState/);
  assert.match(chatMessageChromeSource, /accessibilityRole=\{renderState\.accessibilityRole\}[\s\S]*?accessibilityLabel=\{renderState\.accessibilityLabel\}/);
  assert.match(chatMessageChromeSource, /accessibilityHint=\{renderState\.accessibilityHint \?\? undefined\}/);
  assert.match(chatMessageChromeSource, /accessibilityState=\{renderState\.accessibilityState\}/);
  assert.match(chatMessageChromeSource, /aria-checked=\{renderState\.ariaChecked\}/);
  assert.match(screenSource, /accessibilityLabel: mobileComposerControls\.field\.accessibilityLabel/);
  assert.doesNotMatch(screenSource, /accessibilityState=\{\{ checked: (ttsEnabled|willCancel) \}\}/);
  assert.doesNotMatch(screenSource, /aria-checked=\{(ttsEnabled|willCancel)\}/);
});

test('keeps the chat composer send control at a mobile-friendly minimum touch target', () => {
  assert.doesNotMatch(screenSource, /getChatComposerMobileSurfaceState,/);
  assert.match(screenSource, /getChatComposerMobileSurfaceRenderState,/);
  assert.match(screenSource, /const mobileComposerSurface = mobileComposerSurfaceRenderState\.surface;/);
  assert.match(screenSource, /const composerStyleState = getChatComposerMobileSurfaceRenderState\(\{\s+colors: theme\.colors,\s+\}\);/);
  assert.match(screenSource, /const composerSurface = composerStyleState\.surface;/);
  assert.match(screenSource, /sendButton:\s*\{[\s\S]*?minHeight:\s*composerSurface\.submitButton\.minHeight,[\s\S]*?minWidth:\s*composerSurface\.submitButton\.minWidth,/);
  assert.match(screenSource, /sendButton:\s*\{[\s\S]*?alignItems:\s*composerSurface\.submitButton\.alignItems,[\s\S]*?justifyContent:\s*composerSurface\.submitButton\.justifyContent,/);
  assert.match(screenSource, /queueButton:\s*\{[\s\S]*?minHeight:\s*composerSurface\.submitButton\.minHeight,[\s\S]*?minWidth:\s*composerSurface\.submitButton\.minWidth,/);
  assert.match(screenSource, /\.\.\.chatComposerRuntimeDockChrome\.submitAction/);
  assert.match(screenSource, /\.\.\.chatComposerRuntimeDockChrome\.queueAction/);
  assert.match(chatMessageChromeSource, /activeOpacity: composerSurface\.submitButton\.pressedOpacity/);
  assert.match(chatMessageChromeSource, /activeOpacity: composerSurface\.queueButton\.pressedOpacity/);
  assert.match(screenSource, /sendButtonDisabled:\s*\{[\s\S]*?opacity:\s*composerSurface\.submitButton\.disabledOpacity/);
});

test('keeps the chat composer accessory controls at a mobile-friendly touch target size', () => {
  assert.match(screenSource, /ttsToggle:\s*\{[\s\S]*?width:\s*composerSurface\.accessoryButton\.size,[\s\S]*?height:\s*composerSurface\.accessoryButton\.size,[\s\S]*?borderRadius:\s*composerSurface\.accessoryButton\.borderRadius,/);
  assert.match(screenSource, /const mobileComposerSurfaceColors = composerStyleState\.colors\.surface;/);
  assert.match(screenSource, /borderColor:\s*mobileComposerSurfaceColors\.accessoryButton\.borderColor/);
  assert.match(screenSource, /backgroundColor:\s*mobileComposerSurfaceColors\.accessoryButton\.backgroundColor/);
  assert.match(screenSource, /alignItems:\s*composerSurface\.accessoryButton\.alignItems/);
  assert.match(screenSource, /justifyContent:\s*composerSurface\.accessoryButton\.justifyContent/);
  assert.match(screenSource, /ttsToggleOn:\s*\{[\s\S]*?backgroundColor:\s*mobileComposerSurfaceColors\.accessoryButton\.activeBackgroundColor,[\s\S]*?borderColor:\s*mobileComposerSurfaceColors\.accessoryButton\.activeBorderColor/);
  assert.match(screenSource, /\.\.\.chatComposerRuntimeDockChrome\.textEntry/);
  assert.match(chatMessageChromeSource, /placeholderTextColor: composerTextColors\.input\.placeholderColor/);
  assert.match(screenSource, /getChatComposerImageAttachmentMobileRenderState,/);
  assert.match(screenSource, /getChatComposerTextToSpeechMobileRenderState,/);
  assert.match(screenSource, /getChatComposerEditBeforeSendMobileRenderState,/);
  assert.match(screenSource, /getChatComposerMicMobileRenderState,/);
  assert.match(screenSource, /getChatComposerMicMobileWebPressStyleState,/);
  assert.match(screenSource, /const mobileComposerImageAttachmentRenderState = useMemo\(\s+\(\) => getChatComposerImageAttachmentMobileRenderState\(\{\s+hasImages: pendingImages\.length > 0,\s+colors: theme\.colors,\s+\}\),\s+\[pendingImages\.length, theme\.colors\],\s+\);/);
  assert.match(screenSource, /const mobileComposerTextToSpeechRenderState = useMemo\(/);
  assert.match(screenSource, /const mobileComposerEditBeforeSendRenderState = useMemo\(/);
  assert.match(screenSource, /const mobileComposerMicRenderState = useMemo\(/);
  assert.match(screenSource, /renderState: mobileComposerImageAttachmentRenderState/);
  assert.match(screenSource, /\.\.\.chatComposerRuntimeDockChrome\.imageAttachmentControl/);
  assert.match(chatMessageChromeSource, /activeOpacity: composerSurface\.accessoryButton\.pressedOpacity/);
  assert.match(screenSource, /renderState: mobileComposerTextToSpeechRenderState/);
  assert.match(screenSource, /renderState: mobileComposerEditBeforeSendRenderState/);
  assert.match(screenSource, /renderState: mobileComposerMicRenderState/);
  assert.match(chatMessageChromeSource, /name=\{renderState\.icon\.name\}/);
  assert.match(chatMessageChromeSource, /accessibilityLabel=\{renderState\.accessibilityLabel\}/);
  assert.match(chatMessageChromeSource, /accessibilityHint=\{renderState\.accessibilityHint \?\? undefined\}/);
  assert.match(screenSource, /\.\.\.chatComposerRuntimeDockChrome\.micButton/);
  assert.match(chatMessageChromeSource, /webPressedStyle: isWebPlatform \? micWebPressedStyle : undefined/);
  assert.doesNotMatch(screenSource, /CHAT_COMPOSER_PRESENTATION\.(imageAttachment|textToSpeech|editBeforeSend|mic)\.mobileIcon/);
  assert.doesNotMatch(screenSource, /composerImageAttachmentMobileIcon/);
  assert.doesNotMatch(screenSource, /composer(TextToSpeech|EditBeforeSend)MobileIcon/);
  assert.doesNotMatch(screenSource, /getChatComposerMicMobile(Action|Icon)State,/);
  assert.doesNotMatch(screenSource, /composerMicMobile(Action|Icon|IconColors)/);
  assert.doesNotMatch(screenSource, /WebkitTouchCallout: 'none'/);
  assert.doesNotMatch(screenSource, /theme\.colors\[composerSurface\.accessoryButton\.(borderColorToken|backgroundColorToken|activeBorderColorToken|activeBackgroundColorToken)\]/);
  assert.doesNotMatch(screenSource, /theme\.colors\[mobileComposerSurface\.input\.placeholderColorToken\]/);
  assert.doesNotMatch(screenSource, /ttsToggleText:/);
  assert.doesNotMatch(screenSource, /composerSurface\.accessoryButton\.glyphFontSize/);
});

test('uses shared pending image attachment presentation in the mobile composer', () => {
  assert.match(screenSource, /getChatImageAttachmentMobileRenderState/);
  assert.match(screenSource, /buildChatImageAttachmentMessage/);
  assert.match(screenSource, /const imageAttachmentRenderState = useMemo\(\s+\(\) => getChatImageAttachmentMobileRenderState\(\{\s+colors: theme\.colors,\s+\}\),\s+\[theme\.colors\],\s+\);/);
  assert.match(screenSource, /const imageAttachmentStyleState = getChatImageAttachmentMobileRenderState\(\{\s+colors: theme\.colors,\s+\}\);/);
  assert.match(screenSource, /const imageAttachmentSurface = imageAttachmentStyleState\.surface;/);
  assert.match(screenSource, /const imageAttachmentSurfaceColors = imageAttachmentStyleState\.colors;/);
  assert.match(screenSource, /renderState: imageAttachmentRenderState/);
  assert.match(chatMessageChromeSource, /accessibilityLabel=\{renderState\.removeButton\.accessibilityLabel\}/);
  assert.match(chatMessageChromeSource, /activeOpacity=\{renderState\.removeButton\.pressedOpacity\}/);
  assert.match(chatMessageChromeSource, /name=\{renderState\.removeIcon\.name\}/);
  assert.match(chatMessageChromeSource, /size=\{renderState\.removeIcon\.size\}/);
  assert.match(chatMessageChromeSource, /color=\{renderState\.removeIcon\.color\}/);
  assert.match(screenSource, /pendingImagesRow:\s*\{[\s\S]*?paddingHorizontal:\s*spacing\[imageAttachmentSurface\.row\.paddingHorizontal\],[\s\S]*?gap:\s*spacing\[imageAttachmentSurface\.row\.gap\]/);
  assert.match(screenSource, /pendingImageCard:\s*\{[\s\S]*?width:\s*imageAttachmentSurface\.preview\.size,[\s\S]*?height:\s*imageAttachmentSurface\.preview\.size/);
  assert.match(screenSource, /pendingImagePreview:\s*\{[\s\S]*?width:\s*imageAttachmentSurface\.previewImage\.width,[\s\S]*?height:\s*imageAttachmentSurface\.previewImage\.height,/);
  assert.match(screenSource, /pendingImageCard:\s*\{[\s\S]*?borderColor:\s*imageAttachmentSurfaceColors\.preview\.borderColor,[\s\S]*?backgroundColor:\s*imageAttachmentSurfaceColors\.preview\.backgroundColor/);
  assert.match(screenSource, /pendingImageRemoveButton:\s*\{[\s\S]*?backgroundColor:\s*imageAttachmentSurfaceColors\.removeButton\.backgroundColor/);
  assert.doesNotMatch(screenSource, /CHAT_IMAGE_ATTACHMENT_PRESENTATION/);
  assert.doesNotMatch(screenSource, /getChatImageAttachmentCopyState,/);
  assert.doesNotMatch(screenSource, /getChatImageAttachmentMobileSurfaceColors,/);
  assert.doesNotMatch(screenSource, /getChatImageAttachmentMobileSurfaceState,/);
  assert.doesNotMatch(screenSource, /getChatImageAttachmentMobileRemoveIconState,/);
  assert.doesNotMatch(screenSource, /mobileImageAttachment/);
  assert.doesNotMatch(screenSource, /pendingImageCard:\s*\{[\s\S]*?width:\s*64/);
  assert.doesNotMatch(screenSource, /pendingImagePreview:\s*\{\s*width:\s*'100%',\s*height:\s*'100%',/);
  assert.doesNotMatch(screenSource, /backgroundColor:\s*'rgba\(0,0,0,0\.7\)'/);
  assert.doesNotMatch(screenSource, /backgroundColor:\s*hexToRgba\(\s*imageAttachmentSurface\.removeButton\.backgroundColor,\s*imageAttachmentSurface\.removeButton\.backgroundAlpha,\s*\)/);
  assert.doesNotMatch(screenSource, /const buildMessageWithPendingImages =/);
  assert.doesNotMatch(screenSource, /buildConversationImageMarkdownMessage/);
});

test('exposes the edit-before-send toggle state to Expo Web accessibility APIs', () => {
  assert.match(screenSource, /renderState: mobileComposerEditBeforeSendRenderState/);
  assert.match(chatMessageChromeSource, /accessibilityRole=\{renderState\.accessibilityRole\}[\s\S]*?accessibilityState=\{renderState\.accessibilityState\}[\s\S]*?aria-checked=\{renderState\.ariaChecked\}/);
});

test('exposes composer queue and submit disabled state through shared actions', () => {
  assert.match(screenSource, /renderState: mobileComposerQueueRenderState/);
  assert.match(screenSource, /renderState: composerSubmitRenderState/);
  assert.match(chatMessageChromeSource, /accessibilityState=\{renderState\.accessibilityState\}/);
  assert.match(chatMessageChromeSource, /disabled=\{renderState\.isDisabled\}/);
  assert.doesNotMatch(screenSource, /mobileComposerQueueAction/);
  assert.doesNotMatch(screenSource, /accessibilityState=\{\{ disabled: (!composerHasContent|isComposerSubmitDisabled) \}\}/);
  assert.doesNotMatch(screenSource, /disabled=\{(!composerHasContent|isComposerSubmitDisabled)\}/);
});
