const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ttsSettingsSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'ui', 'TTSSettings.tsx'),
  'utf8'
);
const speechSettingsSource = fs.readFileSync(
  path.join(__dirname, '..', '..', '..', 'packages', 'shared', 'src', 'text-to-speech-settings.ts'),
  'utf8'
);

function extractBetween(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  assert.notEqual(start, -1, `Missing start marker: ${startMarker}`);

  const end = source.indexOf(endMarker, start);
  assert.notEqual(end, -1, `Missing end marker: ${endMarker}`);

  return source.slice(start, end);
}

test('keeps mobile TTS settings actions explicit while using shared icon chrome for modal close', () => {
  assert.doesNotMatch(ttsSettingsSource, /🔊 Test Voice/);
  assert.match(ttsSettingsSource, /activeOpacity=\{speechSelectorSurface\.testButton\.pressedOpacity\}/);
  assert.match(ttsSettingsSource, /accessibilityRole=\{speechSelectorSurface\.testButton\.accessibilityRole\}/);
  assert.match(ttsSettingsSource, /<Text style=\{styles\.testButtonText\}>\{speechSelectorCopy\.voice\.testVoiceLabel\}<\/Text>/);

  assert.doesNotMatch(ttsSettingsSource, />✕<\/Text>/);
  assert.match(ttsSettingsSource, /accessibilityLabel=\{speechSelectorCopy\.voice\.closeAccessibilityLabel\}/);
  assert.match(ttsSettingsSource, /getSpeechSelectorMobileCloseIconState/);
  assert.match(ttsSettingsSource, /const speechSelectorCloseIcon = getSpeechSelectorMobileCloseIconState\(\);/);
  assert.match(ttsSettingsSource, /activeOpacity=\{speechSelectorSurface\.closeButton\.pressedOpacity\}/);
  assert.match(ttsSettingsSource, /accessibilityRole=\{speechSelectorSurface\.closeButton\.accessibilityRole\}/);
  assert.match(ttsSettingsSource, /name=\{speechSelectorCloseIcon\.name\}/);
  assert.match(ttsSettingsSource, /size=\{speechSelectorCloseIcon\.size\}/);
  assert.match(ttsSettingsSource, /color=\{speechSelectorColors\.closeIcon\.color\}/);
  assert.doesNotMatch(ttsSettingsSource, /modalCloseText/);
  assert.doesNotMatch(ttsSettingsSource, /speechSelectorCopy\.common\.closeLabel/);
  assert.doesNotMatch(ttsSettingsSource, /speechSelectorSurface\.closeIcon\.(name|size|colorToken)/);
  assert.doesNotMatch(ttsSettingsSource, /accessibilityRole="button"/);
});

test('keeps the mobile TTS voice picker header flex-safe on narrow widths', () => {
  const modalHeaderStyles = extractBetween(speechSettingsSource, 'modalHeader: {', 'modalTitle: {');
  assert.match(modalHeaderStyles, /flexDirection:\s*surface\.header\.flexDirection/);
  assert.match(modalHeaderStyles, /justifyContent:\s*surface\.header\.justifyContent/);
  assert.match(modalHeaderStyles, /alignItems:\s*surface\.header\.alignItems/);
  assert.match(modalHeaderStyles, /gap:\s*spacing\[surface\.header\.gap\]/);

  const modalTitleStyles = extractBetween(speechSettingsSource, 'modalTitle: {', 'modalCloseButton: {');
  assert.match(modalTitleStyles, /flex:\s*surface\.title\.flex/);
  assert.match(modalTitleStyles, /flexShrink:\s*surface\.title\.flexShrink/);
  assert.match(modalTitleStyles, /paddingRight:\s*spacing\[surface\.title\.paddingRight\]/);
});

test('uses the shared speech selector presentation for the mobile voice picker', () => {
  assert.match(ttsSettingsSource, /getSpeechSelectorCopyState/);
  assert.match(ttsSettingsSource, /createSpeechSelectorMobileStyleSheetSlots/);
  assert.match(ttsSettingsSource, /getSpeechSelectorMobileSurfaceColors/);
  assert.match(ttsSettingsSource, /getSpeechSelectorMobileSurfaceState/);
  assert.match(ttsSettingsSource, /const speechSelectorCopy = getSpeechSelectorCopyState\(\)/);
  assert.match(ttsSettingsSource, /const speechSelectorSurface = getSpeechSelectorMobileSurfaceState\(\)/);
  assert.match(ttsSettingsSource, /const speechSelectorColors = useMemo\(\s*\(\) => getSpeechSelectorMobileSurfaceColors\(theme\.colors\),/);
  assert.match(ttsSettingsSource, /StyleSheet\.create\(createSpeechSelectorMobileStyleSheetSlots\(\{\s+colors: speechSelectorColors,\s+spacing,\s+radius,\s+\}\)\)/);
  assert.match(ttsSettingsSource, /<Text style=\{styles\.label\}>\{speechSelectorCopy\.voice\.label\}<\/Text>/);
  assert.match(ttsSettingsSource, /activeOpacity=\{speechSelectorSurface\.trigger\.pressedOpacity\}/);
  assert.match(ttsSettingsSource, /accessibilityRole=\{speechSelectorSurface\.trigger\.accessibilityRole\}/);
  assert.match(ttsSettingsSource, /activeOpacity=\{speechSelectorSurface\.item\.pressedOpacity\}/);
  assert.match(ttsSettingsSource, /accessibilityRole=\{speechSelectorSurface\.item\.accessibilityRole\}/);
  assert.match(ttsSettingsSource, /accessibilityState=\{\{ selected: !selectedVoice \}\}/);
  assert.match(ttsSettingsSource, /accessibilityState=\{\{ selected: isSelected \}\}/);
  assert.match(speechSettingsSource, /export function createSpeechSelectorMobileStyleSheetSlots/);
  const sharedStyleSource = extractBetween(
    speechSettingsSource,
    'export function createSpeechSelectorMobileStyleSheetSlots',
    'export function formatSpeechSelectorMicrophoneEnumerationError',
  );
  assert.match(sharedStyleSource, /container:\s*\{[\s\S]*?marginTop:\s*spacing\[surface\.container\.marginTop\]/);
  assert.match(sharedStyleSource, /flexDirection:\s*surface\.row\.flexDirection/);
  assert.match(sharedStyleSource, /gap:\s*spacing\[surface\.row\.gap\]/);
  assert.match(sharedStyleSource, /fontSize:\s*surface\.label\.fontSize/);
  assert.match(sharedStyleSource, /color:\s*colors\.label\.color/);
  assert.match(ttsSettingsSource, /numberOfLines=\{speechSelectorSurface\.trigger\.textNumberOfLines\}/);
  assert.match(ttsSettingsSource, /numberOfLines=\{speechSelectorSurface\.itemText\.numberOfLines\}/);
  assert.match(ttsSettingsSource, /numberOfLines=\{speechSelectorSurface\.itemSubtext\.numberOfLines\}/);
  assert.match(sharedStyleSource, /const triggerTextStyles = \{[\s\S]*?flex:\s*surface\.triggerText\.flex,[\s\S]*?flexShrink:\s*surface\.triggerText\.flexShrink,/);
  assert.match(sharedStyleSource, /voiceSelectorText: triggerTextStyles/);
  assert.match(sharedStyleSource, /sliderRow:\s*\{[\s\S]*?paddingVertical:\s*spacing\[surface\.sliderRow\.paddingVertical\]/);
  assert.match(sharedStyleSource, /sliderHeader:\s*\{[\s\S]*?flexDirection:\s*surface\.sliderHeader\.flexDirection,[\s\S]*?justifyContent:\s*surface\.sliderHeader\.justifyContent,[\s\S]*?alignItems:\s*surface\.sliderHeader\.alignItems/);
  assert.match(sharedStyleSource, /sliderValue:\s*\{[\s\S]*?fontSize:\s*surface\.sliderValue\.fontSize,[\s\S]*?color:\s*colors\.sliderValue\.color/);
  assert.match(sharedStyleSource, /slider:\s*\{[\s\S]*?width:\s*surface\.slider\.width,[\s\S]*?height:\s*surface\.slider\.height/);
  assert.match(ttsSettingsSource, /minimumTrackTintColor=\{speechSelectorColors\.slider\.minimumTrackTintColor\}/);
  assert.match(ttsSettingsSource, /maximumTrackTintColor=\{speechSelectorColors\.slider\.maximumTrackTintColor\}/);
  assert.match(ttsSettingsSource, /thumbTintColor=\{speechSelectorColors\.slider\.thumbTintColor\}/);
  assert.match(sharedStyleSource, /testButton:\s*\{[\s\S]*?backgroundColor:\s*colors\.testButton\.backgroundColor,[\s\S]*?alignItems:\s*surface\.testButton\.alignItems/);
  assert.match(sharedStyleSource, /testButtonText:\s*\{[\s\S]*?fontSize:\s*surface\.testButtonText\.fontSize,[\s\S]*?color:\s*colors\.testButtonText\.color/);
  assert.match(ttsSettingsSource, /name=\{speechSelectorSurface\.disclosureIcon\.name\}/);
  assert.match(ttsSettingsSource, /color=\{speechSelectorColors\.disclosureIcon\.color\}/);
  assert.match(sharedStyleSource, /backgroundColor:\s*colors\.modalOverlay\.backgroundColor/);
  assert.match(sharedStyleSource, /modalOverlay:\s*\{[\s\S]*?flex:\s*surface\.modalOverlay\.flex,[\s\S]*?justifyContent:\s*surface\.modalOverlay\.justifyContent,/);
  assert.match(sharedStyleSource, /modalCloseButton:\s*\{[\s\S]*?width:\s*surface\.closeButton\.width,[\s\S]*?height:\s*surface\.closeButton\.height,[\s\S]*?alignItems:\s*surface\.closeButton\.alignItems,[\s\S]*?justifyContent:\s*surface\.closeButton\.justifyContent/);
  assert.match(sharedStyleSource, /backgroundColor:\s*colors\.selectedItem\.backgroundColor/);
  assert.match(ttsSettingsSource, /name=\{speechSelectorSurface\.selectedIcon\.name\}/);
  assert.match(sharedStyleSource, /voiceItemBody:\s*\{[\s\S]*?minWidth:\s*surface\.itemBody\.minWidth/);
  assert.doesNotMatch(ttsSettingsSource, /SPEECH_SELECTOR_PRESENTATION/);
  assert.doesNotMatch(ttsSettingsSource, /theme\.colors\[[^\]]+\]/);
  assert.doesNotMatch(ttsSettingsSource, /theme\.colors\.[A-Za-z]/);
  assert.doesNotMatch(ttsSettingsSource, /hexToRgba\(/);
  assert.doesNotMatch(ttsSettingsSource, /<Text style=\{styles\.chevron\}>▼<\/Text>/);
  assert.doesNotMatch(ttsSettingsSource, /<Text style=\{styles\.checkmark\}>✓<\/Text>/);
  assert.doesNotMatch(ttsSettingsSource, /backgroundColor:\s*'rgba\(0, 0, 0, 0\.5\)'/);
  assert.doesNotMatch(ttsSettingsSource, /justifyContent:\s*'flex-end'/);
  assert.doesNotMatch(ttsSettingsSource, /theme\.colors\.primary \+ '20'/);
  assert.doesNotMatch(ttsSettingsSource, /container:\s*\{[\s\S]*?marginTop:\s*spacing\[speechSelectorSurface\.container\.marginTop\]/);
  assert.doesNotMatch(ttsSettingsSource, /voiceSelectorText:\s*\{[\s\S]*?flex:\s*speechSelectorSurface\.triggerText\.flex/);

  const rowStyles = extractBetween(sharedStyleSource, 'row: {', 'label: {');
  assert.doesNotMatch(rowStyles, /flexDirection:\s*'row'/);
  assert.doesNotMatch(rowStyles, /gap:\s*spacing\.sm/);

  const labelStyles = extractBetween(sharedStyleSource, 'label: {', 'nativeHint: {');
  assert.doesNotMatch(labelStyles, /fontSize:\s*16/);
  assert.doesNotMatch(labelStyles, /theme\.colors\.foreground/);

  const sliderHeaderStyles = extractBetween(sharedStyleSource, 'sliderHeader: {', 'sliderValue: {');
  assert.doesNotMatch(sliderHeaderStyles, /flexDirection:\s*'row'/);
  assert.doesNotMatch(sliderHeaderStyles, /justifyContent:\s*'space-between'/);
  assert.doesNotMatch(sliderHeaderStyles, /alignItems:\s*'center'/);
  assert.doesNotMatch(ttsSettingsSource, /minimumTrackTintColor=\{theme\.colors\.primary\}/);
  assert.doesNotMatch(ttsSettingsSource, /maximumTrackTintColor=\{theme\.colors\.muted\}/);
  assert.doesNotMatch(ttsSettingsSource, /thumbTintColor=\{theme\.colors\.primary\}/);

  const testButtonStyles = extractBetween(sharedStyleSource, 'testButton: {', 'testButtonText: {');
  assert.doesNotMatch(testButtonStyles, /theme\.colors\.muted/);
  assert.doesNotMatch(testButtonStyles, /alignItems:\s*'center'/);
  assert.doesNotMatch(ttsSettingsSource, /marginTop:\s*spacing\.sm/);
  assert.doesNotMatch(ttsSettingsSource, /numberOfLines=\{1\}/);
});
