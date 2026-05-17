const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const chatScreenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'ChatScreen.tsx'),
  'utf8'
);
const chatRuntimeMobileStylesSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'ui', 'ChatRuntimeMobileStyles.ts'),
  'utf8'
);
const screenSource = `${chatScreenSource}\n${chatRuntimeMobileStylesSource}`;
const chatMessageChromeSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'ui', 'ChatMessageChrome.tsx'),
  'utf8'
);
const sessionPresentationSource = fs.readFileSync(
  path.join(__dirname, '..', '..', '..', 'packages', 'shared', 'src', 'session-presentation.ts'),
  'utf8'
);

function sourceBlock(source, pattern) {
  return source.match(pattern)?.[0] ?? '';
}

function composerIconButtonSource() {
  return sourceBlock(
    chatMessageChromeSource,
    /export function ChatComposerIconButton[\s\S]*?export function ChatComposerLabeledActionButton/
  );
}

function composerLabeledActionButtonSource() {
  return sourceBlock(
    chatMessageChromeSource,
    /export function ChatComposerLabeledActionButton[\s\S]*?export function ChatComposerMicButton/
  );
}

test('exposes the chat composer send control as an accessible button', () => {
  const actionButtonSource = composerLabeledActionButtonSource();

  assert.doesNotMatch(screenSource, /<ChatComposerRuntimeDock/);
  assert.match(chatMessageChromeSource, /composer: chatComposerRuntimeDock,/);
  assert.doesNotMatch(screenSource, /submitActionRenderState:/);
  assert.match(sessionPresentationSource, /submitAction: \{\s+renderState: controlRenderState\.submitAction,\s+onPress: onSubmitActionPress,\s+\.\.\.chrome\.submitAction,\s+\}/);
  assert.match(sessionPresentationSource, /export function createChatComposerRuntimeDockMobileProps/);
  assert.match(chatMessageChromeSource, /createChatComposerRuntimeDockMobileProps,/);
  assert.match(chatMessageChromeSource, /createChatComposerRuntimeDockMobilePropsParts,/);
  assert.doesNotMatch(chatMessageChromeSource, /export function createChatComposerRuntimeDockProps/);
  assert.match(chatMessageChromeSource, /<ChatComposerLabeledActionButton\s+\{\.\.\.composerDockParts\.submitAction\.props\}/);
  assert.match(actionButtonSource, /createChatComposerLabeledActionButtonMobilePropsParts\(\{/);
  assert.match(actionButtonSource, /<ChatComposerLabeledActionButtonTouchable\s+\{\.\.\.actionButtonParts\.touchable\.props\}/);
  assert.match(sessionPresentationSource, /accessibilityRole: renderState\.accessibilityRole/);
  assert.match(sessionPresentationSource, /accessibilityLabel: renderState\.accessibilityLabel/);
  assert.match(sessionPresentationSource, /accessibilityHint: renderState\.accessibilityHint/);
  assert.match(sessionPresentationSource, /accessibilityState: renderState\.accessibilityState/);
  assert.doesNotMatch(actionButtonSource, /accessibilityRole=\{renderState\.accessibilityRole\}/);
});

test('uses shared session presentation for mobile composer copy and disabled state', () => {
  assert.doesNotMatch(screenSource, /getFollowUpInputPresentation/);
  assert.doesNotMatch(chatMessageChromeSource, /getChatComposerRuntimeFollowUpPresentationState/);
  assert.match(sessionPresentationSource, /export function getChatComposerRuntimeFollowUpPresentationState/);
  assert.doesNotMatch(screenSource, /getChatComposerMobileControlState/);
  assert.doesNotMatch(chatMessageChromeSource, /getChatComposerMobileControlState/);
  assert.match(sessionPresentationSource, /controls: ChatComposerMobileControlState/);
  assert.match(sessionPresentationSource, /export function getChatComposerRuntimeControlMobileRenderState/);
  assert.match(sessionPresentationSource, /getChatComposerMobileActionAvailabilityRenderState\(\{\s+hasContent,\s+handsFree,\s+presentation,\s+\}\)/);
  assert.match(sessionPresentationSource, /const composerControlPresentation = getChatComposerRuntimeFollowUpPresentationState\(\{/);
  assert.match(sessionPresentationSource, /const controlRenderState = getChatComposerRuntimeControlMobileRenderState\(\{/);
  assert.match(sessionPresentationSource, /const mobileComposerControls = controlRenderState\.controls/);
  assert.match(screenSource, /composerControlHasContent: composerHasContent,\s+composerControlConversationState: conversationState,\s+composerControlIsResponding: responding,/);
  assert.match(chatMessageChromeSource, /pendingImagesColors: colors,\s+composerControlColors: colors,/);

  assert.doesNotMatch(chatRuntimeMobileStylesSource, /createChatComposerStyleSlots,/);
  assert.doesNotMatch(chatRuntimeMobileStylesSource, /createChatComposerRuntimeDockStyleSlots,/);
  assert.match(chatRuntimeMobileStylesSource, /createChatRuntimeMobileChromeStyleSlots,/);
  assert.match(chatRuntimeMobileStylesSource, /createChatRuntimeMobileChromeSlotsFromStyleSource,/);
  assert.match(sessionPresentationSource, /export function createChatComposerStyleSlots/);
  assert.match(sessionPresentationSource, /export function createChatComposerRuntimeDockStyleSlots/);
  assert.match(sessionPresentationSource, /const composerStyles = createChatComposerStyleSlotsFromStyleSource\(\{\s+styles,\s+\}\)/);
  assert.match(sessionPresentationSource, /const composerRuntimeDockStyles = createChatComposerRuntimeDockStyleSlots\(\{/);
  assert.doesNotMatch(chatMessageChromeSource, /export function createChatComposerRuntimeDockStyleSlots/);

  assert.match(sessionPresentationSource, /const webAccessibility = composerSurface\.webAccessibility/);
  assert.doesNotMatch(screenSource, /CHAT_COMPOSER_HINT_NATIVE_ID/);
  assert.doesNotMatch(screenSource, /CHAT_VOICE_STATUS_LIVE_REGION_NATIVE_ID/);
  assert.match(sessionPresentationSource, /inputDescriptionNativeId: webAccessibility\.inputDescriptionNativeId/);
  assert.match(sessionPresentationSource, /voiceStatusLiveRegionNativeId: webAccessibility\.voiceStatusLiveRegionNativeId/);
  assert.match(sessionPresentationSource, /"aria-describedby": webAccessibility\.isWebPlatform\s+\? webAccessibility\.inputDescriptionNativeId\s+: undefined/);
  assert.match(chatMessageChromeSource, /<ChatComposerTextEntryInput\s+\{\.\.\.textEntryParts\.input\.props\}/);
  assert.match(chatMessageChromeSource, /<ChatComposerTextEntryInputDescription\s+\{\.\.\.textEntryParts\.inputDescription\.props\}/);
  assert.match(chatMessageChromeSource, /<ChatComposerTextEntryVoiceStatusLiveRegion\s+\{\.\.\.textEntryParts\.voiceStatusLiveRegion\.props\}/);
});

test('exposes the handsfree queue control as an accessible button', () => {
  const actionButtonSource = composerLabeledActionButtonSource();

  assert.doesNotMatch(screenSource, /queueActionShouldRender:/);
  assert.doesNotMatch(screenSource, /queueActionRenderState:/);
  assert.match(sessionPresentationSource, /queueAction: \{\s+shouldRender: controlRenderState\.visibility\.queueAction\.shouldRender,\s+renderState: controlRenderState\.queueAction,\s+onPress: onQueueActionPress,\s+\.\.\.chrome\.queueAction,\s+\}/);
  assert.match(chatMessageChromeSource, /<ChatComposerLabeledActionButton\s+\{\.\.\.composerDockParts\.queueAction\.props\}/);
  assert.match(actionButtonSource, /<ChatComposerLabeledActionButtonTouchable\s+\{\.\.\.actionButtonParts\.touchable\.props\}/);
  assert.match(sessionPresentationSource, /disabled: renderState\.isDisabled/);
  assert.match(sessionPresentationSource, /accessibilityRole: renderState\.accessibilityRole/);
  assert.match(sessionPresentationSource, /accessibilityLabel: renderState\.accessibilityLabel/);
  assert.match(sessionPresentationSource, /accessibilityHint: renderState\.accessibilityHint/);
  assert.match(sessionPresentationSource, /accessibilityState: renderState\.accessibilityState/);
  assert.doesNotMatch(screenSource, /const composerQueueDebugMessage = getChatComposerRuntimeQueueDebugMessage\(\);/);
  assert.doesNotMatch(screenSource, /setDebugInfo\(getChatComposerRuntimeQueueDebugMessage\(\)\)/);
  assert.match(chatMessageChromeSource, /setDebugInfo\(getChatComposerQueueMobileActionState\(\)\.debugMessage\)/);
});

test('uses shared mobile composer control accessibility state', () => {
  const iconButtonSource = composerIconButtonSource();

  assert.match(sessionPresentationSource, /renderState: controlRenderState\.imageAttachment/);
  assert.match(sessionPresentationSource, /renderState: controlRenderState\.textToSpeech/);
  assert.match(sessionPresentationSource, /renderState: controlRenderState\.editBeforeSend/);
  assert.match(sessionPresentationSource, /accessibilityLabel: mobileComposerControls\.field\.accessibilityLabel/);
  assert.match(chatMessageChromeSource, /createChatComposerIconButtonMobilePropsParts,/);
  assert.match(sessionPresentationSource, /export function createChatComposerIconButtonMobilePropsParts/);
  assert.match(iconButtonSource, /const iconButtonParts = createChatComposerIconButtonMobilePropsParts\(\{/);
  assert.match(iconButtonSource, /<ChatComposerIconButtonTouchable\s+\{\.\.\.iconButtonParts\.touchable\.props\}/);
  assert.match(iconButtonSource, /const touchableContent = iconButtonParts\.touchable\.content;/);
  assert.match(iconButtonSource, /<ChatComposerIconButtonIcon\s+\{\.\.\.touchableContent\.icon\.props\}/);
  assert.match(sessionPresentationSource, /accessibilityRole: renderState\.accessibilityRole/);
  assert.match(sessionPresentationSource, /accessibilityLabel: renderState\.accessibilityLabel/);
  assert.match(sessionPresentationSource, /accessibilityHint: renderState\.accessibilityHint \?\? undefined/);
  assert.match(sessionPresentationSource, /accessibilityState: renderState\.accessibilityState/);
  assert.match(sessionPresentationSource, /"aria-checked": renderState\.ariaChecked/);
  assert.doesNotMatch(screenSource, /textEntryAccessibilityLabel:/);
  assert.doesNotMatch(screenSource, /accessibilityState=\{\{ checked: (ttsEnabled|willCancel) \}\}/);
  assert.doesNotMatch(screenSource, /aria-checked=\{(ttsEnabled|willCancel)\}/);
});

test('keeps the chat composer send and queue controls icon-first with mobile touch targets', () => {
  const actionButtonSource = composerLabeledActionButtonSource();

  assert.match(chatRuntimeMobileStylesSource, /sendButton:\s*\{\s+\.\.\.composerStyleSlots\.submitButton,\s+\}/);
  assert.match(chatRuntimeMobileStylesSource, /queueButton:\s*\{\s+\.\.\.composerStyleSlots\.queueButton,\s+\}/);
  assert.match(sessionPresentationSource, /submitButton:\s*\{[\s\S]*?minHeight:\s*44,[\s\S]*?minWidth:\s*44,[\s\S]*?paddingHorizontal:\s*"sm"/);
  assert.match(sessionPresentationSource, /queueButton:\s*\{[\s\S]*?labelShouldRender:\s*false/);
  assert.match(sessionPresentationSource, /submitButton:\s*\{[\s\S]*?labelShouldRender:\s*false/);
  assert.match(sessionPresentationSource, /labelShouldRender: CHAT_COMPOSER_SURFACE_PRESENTATION\.mobile\.queueButton\.labelShouldRender/);
  assert.match(sessionPresentationSource, /labelShouldRender: CHAT_COMPOSER_SURFACE_PRESENTATION\.mobile\.submitButton\.labelShouldRender/);
  assert.match(sessionPresentationSource, /shouldRender: renderState\.labelShouldRender \?\? true/);
  assert.match(actionButtonSource, /const touchableContent = actionButtonParts\.touchable\.content;/);
  assert.match(actionButtonSource, /touchableContent\.label\.shouldRender \? \(/);
  assert.match(actionButtonSource, /<ChatComposerLabeledActionButtonLabel\s+\{\.\.\.touchableContent\.label\.props\}/);
  assert.doesNotMatch(actionButtonSource, /\{renderState\.label\}/);
});

test('keeps the chat composer accessory controls at a mobile-friendly touch target size', () => {
  const iconButtonSource = composerIconButtonSource();

  assert.match(chatRuntimeMobileStylesSource, /ttsToggle:\s*\{\s+\.\.\.composerStyleSlots\.accessoryButton,\s+\}/);
  assert.match(chatRuntimeMobileStylesSource, /ttsToggleOn:\s*\{\s+\.\.\.composerStyleSlots\.accessoryButtonActive,\s+\}/);
  assert.match(sessionPresentationSource, /accessoryButton:\s*\{[\s\S]*?width:\s*surface\.accessoryButton\.size,[\s\S]*?height:\s*surface\.accessoryButton\.size,[\s\S]*?borderRadius:\s*surface\.accessoryButton\.borderRadius,/);
  assert.match(sessionPresentationSource, /borderColor:\s*colors\.accessoryButton\.borderColor/);
  assert.match(sessionPresentationSource, /backgroundColor:\s*colors\.accessoryButton\.backgroundColor/);
  assert.match(sessionPresentationSource, /accessoryButtonActive:\s*\{[\s\S]*?backgroundColor:\s*colors\.accessoryButton\.activeBackgroundColor,[\s\S]*?borderColor:\s*colors\.accessoryButton\.activeBorderColor/);
  assert.match(iconButtonSource, /<ChatComposerIconButtonIcon\s+\{\.\.\.touchableContent\.icon\.props\}/);
  assert.doesNotMatch(screenSource, /CHAT_COMPOSER_PRESENTATION\.(imageAttachment|textToSpeech|editBeforeSend|mic)\.mobileIcon/);
  assert.doesNotMatch(screenSource, /composerSurface\.accessoryButton\.glyphFontSize/);
});

test('uses shared pending image attachment presentation in the mobile composer', () => {
  assert.doesNotMatch(chatMessageChromeSource, /getChatImageAttachmentMobileRenderState/);
  assert.match(sessionPresentationSource, /getChatImageAttachmentMobileRenderState/);
  assert.doesNotMatch(screenSource, /buildChatComposerRuntimeMessageContent/);
  assert.match(chatMessageChromeSource, /getChatComposerRuntimeDraftMessageState/);
  assert.match(sessionPresentationSource, /export function getChatComposerRuntimeDraftMessageState/);
  assert.doesNotMatch(screenSource, /const imageAttachmentRenderState = useMemo/);
  assert.match(chatRuntimeMobileStylesSource, /pendingImagesRow:\s*\{\s+\.\.\.imageAttachmentStyleSlots\.row,\s+\}/);
  assert.match(chatRuntimeMobileStylesSource, /pendingImageCard:\s*\{\s+\.\.\.imageAttachmentStyleSlots\.card,\s+\}/);
  assert.match(chatRuntimeMobileStylesSource, /pendingImagePreview:\s*\{\s+\.\.\.imageAttachmentStyleSlots\.preview,\s+\}/);
  assert.match(chatRuntimeMobileStylesSource, /pendingImageRemoveButton:\s*\{\s+\.\.\.imageAttachmentStyleSlots\.removeButton,\s+\}/);
  assert.match(chatMessageChromeSource, /createChatComposerPendingImagesRailMobilePropsParts,/);
  assert.match(sessionPresentationSource, /export function createChatComposerPendingImagesRailMobilePropsParts/);
  assert.match(chatMessageChromeSource, /<ChatComposerPendingImageRemoveButton\s+\{\.\.\.item\.removeButton\.props\}/);
  assert.match(chatMessageChromeSource, /<ChatComposerPendingImageRemoveIcon\s+\{\.\.\.item\.removeIcon\.props\}/);
  assert.doesNotMatch(screenSource, /CHAT_IMAGE_ATTACHMENT_PRESENTATION/);
  assert.doesNotMatch(screenSource, /mobileImageAttachment/);
});

test('exposes the edit-before-send toggle state to Expo Web accessibility APIs', () => {
  const iconButtonSource = composerIconButtonSource();

  assert.doesNotMatch(screenSource, /editBeforeSendRenderState:/);
  assert.match(sessionPresentationSource, /editBeforeSendControl: \{\s+shouldRender: controlRenderState\.visibility\.editBeforeSendControl\.shouldRender,\s+renderState: controlRenderState\.editBeforeSend,\s+onPress: onEditBeforeSendPress,\s+\.\.\.chrome\.editBeforeSendControl,\s+\}/);
  assert.match(chatMessageChromeSource, /<ChatComposerIconButton\s+\{\.\.\.composerDockParts\.editBeforeSendControl\.props\}/);
  assert.match(iconButtonSource, /<ChatComposerIconButtonTouchable\s+\{\.\.\.iconButtonParts\.touchable\.props\}/);
  assert.match(sessionPresentationSource, /accessibilityState: renderState\.accessibilityState/);
  assert.match(sessionPresentationSource, /"aria-checked": renderState\.ariaChecked/);
  assert.doesNotMatch(screenSource, /aria-checked=\{willCancel\}/);
});

test('exposes composer queue and submit disabled state through shared actions', () => {
  const actionButtonSource = composerLabeledActionButtonSource();

  assert.doesNotMatch(screenSource, /queueActionRenderState:/);
  assert.doesNotMatch(screenSource, /submitActionRenderState:/);
  assert.match(sessionPresentationSource, /queueAction: getChatComposerQueueMobileRenderState\(\{\s+isDisabled: actionAvailability\.queueAction\.isDisabled,\s+colors,\s+\}\),/);
  assert.match(sessionPresentationSource, /submitAction: getChatComposerSubmitMobileRenderState\(\{\s+presentation,\s+isHandsFree: handsFree,\s+isDisabled: actionAvailability\.submitAction\.isDisabled,\s+colors,\s+\}\),/);
  assert.match(sessionPresentationSource, /disabled: renderState\.isDisabled/);
  assert.match(actionButtonSource, /<ChatComposerLabeledActionButtonTouchable\s+\{\.\.\.actionButtonParts\.touchable\.props\}/);
  assert.match(sessionPresentationSource, /disabled: renderState\.isDisabled/);
  assert.match(sessionPresentationSource, /style: \[styles\.button, renderState\.isDisabled && styles\.disabledButton\]/);
  assert.doesNotMatch(actionButtonSource, /disabled=\{renderState\.isDisabled\}/);
  assert.doesNotMatch(screenSource, /accessibilityState=\{\{ disabled: (!composerHasContent|isComposerSubmitDisabled) \}\}/);
  assert.doesNotMatch(screenSource, /disabled=\{(!composerHasContent|isComposerSubmitDisabled)\}/);
  assert.doesNotMatch(screenSource, /isDisabled: !composerHasContent/);
  assert.doesNotMatch(screenSource, /isDisabled: isComposerSubmitDisabled/);
});
