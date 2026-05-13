const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ttsSettingsSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'ui', 'TTSSettings.tsx'),
  'utf8'
);

function extractBetween(startMarker, endMarker) {
  const start = ttsSettingsSource.indexOf(startMarker);
  assert.notEqual(start, -1, `Missing start marker: ${startMarker}`);

  const end = ttsSettingsSource.indexOf(endMarker, start);
  assert.notEqual(end, -1, `Missing end marker: ${endMarker}`);

  return ttsSettingsSource.slice(start, end);
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
  const modalHeaderStyles = extractBetween('modalHeader: {', 'modalTitle: {');
  assert.match(modalHeaderStyles, /flexDirection:\s*speechSelectorSurface\.header\.flexDirection/);
  assert.match(modalHeaderStyles, /justifyContent:\s*speechSelectorSurface\.header\.justifyContent/);
  assert.match(modalHeaderStyles, /alignItems:\s*speechSelectorSurface\.header\.alignItems/);
  assert.match(modalHeaderStyles, /gap:\s*spacing\[speechSelectorSurface\.header\.gap\]/);

  const modalTitleStyles = extractBetween('modalTitle: {', 'modalCloseButton: {');
  assert.match(modalTitleStyles, /flex:\s*speechSelectorSurface\.title\.flex/);
  assert.match(modalTitleStyles, /flexShrink:\s*speechSelectorSurface\.title\.flexShrink/);
  assert.match(modalTitleStyles, /paddingRight:\s*spacing\[speechSelectorSurface\.title\.paddingRight\]/);
});

test('uses the shared speech selector presentation for the mobile voice picker', () => {
  assert.match(ttsSettingsSource, /getSpeechSelectorCopyState/);
  assert.match(ttsSettingsSource, /getSpeechSelectorMobileSurfaceColors/);
  assert.match(ttsSettingsSource, /getSpeechSelectorMobileSurfaceState/);
  assert.match(ttsSettingsSource, /const speechSelectorCopy = getSpeechSelectorCopyState\(\)/);
  assert.match(ttsSettingsSource, /const speechSelectorSurface = getSpeechSelectorMobileSurfaceState\(\)/);
  assert.match(ttsSettingsSource, /const speechSelectorColors = useMemo\(\s*\(\) => getSpeechSelectorMobileSurfaceColors\(theme\.colors\),/);
  assert.match(ttsSettingsSource, /<Text style=\{styles\.label\}>\{speechSelectorCopy\.voice\.label\}<\/Text>/);
  assert.match(ttsSettingsSource, /activeOpacity=\{speechSelectorSurface\.trigger\.pressedOpacity\}/);
  assert.match(ttsSettingsSource, /accessibilityRole=\{speechSelectorSurface\.trigger\.accessibilityRole\}/);
  assert.match(ttsSettingsSource, /activeOpacity=\{speechSelectorSurface\.item\.pressedOpacity\}/);
  assert.match(ttsSettingsSource, /accessibilityRole=\{speechSelectorSurface\.item\.accessibilityRole\}/);
  assert.match(ttsSettingsSource, /accessibilityState=\{\{ selected: !selectedVoice \}\}/);
  assert.match(ttsSettingsSource, /accessibilityState=\{\{ selected: isSelected \}\}/);
  assert.match(ttsSettingsSource, /container:\s*\{[\s\S]*?marginTop:\s*spacing\[speechSelectorSurface\.container\.marginTop\]/);
  assert.match(ttsSettingsSource, /flexDirection:\s*speechSelectorSurface\.row\.flexDirection/);
  assert.match(ttsSettingsSource, /gap:\s*spacing\[speechSelectorSurface\.row\.gap\]/);
  assert.match(ttsSettingsSource, /fontSize:\s*speechSelectorSurface\.label\.fontSize/);
  assert.match(ttsSettingsSource, /color:\s*speechSelectorColors\.label\.color/);
  assert.match(ttsSettingsSource, /numberOfLines=\{speechSelectorSurface\.trigger\.textNumberOfLines\}/);
  assert.match(ttsSettingsSource, /numberOfLines=\{speechSelectorSurface\.itemText\.numberOfLines\}/);
  assert.match(ttsSettingsSource, /numberOfLines=\{speechSelectorSurface\.itemSubtext\.numberOfLines\}/);
  assert.match(ttsSettingsSource, /voiceSelectorText:\s*\{[\s\S]*?flex:\s*speechSelectorSurface\.triggerText\.flex,[\s\S]*?flexShrink:\s*speechSelectorSurface\.triggerText\.flexShrink,/);
  assert.match(ttsSettingsSource, /sliderRow:\s*\{[\s\S]*?paddingVertical:\s*spacing\[speechSelectorSurface\.sliderRow\.paddingVertical\]/);
  assert.match(ttsSettingsSource, /sliderHeader:\s*\{[\s\S]*?flexDirection:\s*speechSelectorSurface\.sliderHeader\.flexDirection,[\s\S]*?justifyContent:\s*speechSelectorSurface\.sliderHeader\.justifyContent,[\s\S]*?alignItems:\s*speechSelectorSurface\.sliderHeader\.alignItems/);
  assert.match(ttsSettingsSource, /sliderValue:\s*\{[\s\S]*?fontSize:\s*speechSelectorSurface\.sliderValue\.fontSize,[\s\S]*?color:\s*speechSelectorColors\.sliderValue\.color/);
  assert.match(ttsSettingsSource, /slider:\s*\{[\s\S]*?width:\s*speechSelectorSurface\.slider\.width,[\s\S]*?height:\s*speechSelectorSurface\.slider\.height/);
  assert.match(ttsSettingsSource, /minimumTrackTintColor=\{speechSelectorColors\.slider\.minimumTrackTintColor\}/);
  assert.match(ttsSettingsSource, /maximumTrackTintColor=\{speechSelectorColors\.slider\.maximumTrackTintColor\}/);
  assert.match(ttsSettingsSource, /thumbTintColor=\{speechSelectorColors\.slider\.thumbTintColor\}/);
  assert.match(ttsSettingsSource, /testButton:\s*\{[\s\S]*?backgroundColor:\s*speechSelectorColors\.testButton\.backgroundColor,[\s\S]*?alignItems:\s*speechSelectorSurface\.testButton\.alignItems/);
  assert.match(ttsSettingsSource, /testButtonText:\s*\{[\s\S]*?fontSize:\s*speechSelectorSurface\.testButtonText\.fontSize,[\s\S]*?color:\s*speechSelectorColors\.testButtonText\.color/);
  assert.match(ttsSettingsSource, /name=\{speechSelectorSurface\.disclosureIcon\.name\}/);
  assert.match(ttsSettingsSource, /color=\{speechSelectorColors\.disclosureIcon\.color\}/);
  assert.match(ttsSettingsSource, /backgroundColor:\s*speechSelectorColors\.modalOverlay\.backgroundColor/);
  assert.match(ttsSettingsSource, /modalOverlay:\s*\{[\s\S]*?flex:\s*speechSelectorSurface\.modalOverlay\.flex,[\s\S]*?justifyContent:\s*speechSelectorSurface\.modalOverlay\.justifyContent,/);
  assert.match(ttsSettingsSource, /modalCloseButton:\s*\{[\s\S]*?width:\s*speechSelectorSurface\.closeButton\.width,[\s\S]*?height:\s*speechSelectorSurface\.closeButton\.height,[\s\S]*?alignItems:\s*speechSelectorSurface\.closeButton\.alignItems,[\s\S]*?justifyContent:\s*speechSelectorSurface\.closeButton\.justifyContent/);
  assert.match(ttsSettingsSource, /backgroundColor:\s*speechSelectorColors\.selectedItem\.backgroundColor/);
  assert.match(ttsSettingsSource, /name=\{speechSelectorSurface\.selectedIcon\.name\}/);
  assert.match(ttsSettingsSource, /voiceItemBody:\s*\{[\s\S]*?minWidth:\s*speechSelectorSurface\.itemBody\.minWidth/);
  assert.doesNotMatch(ttsSettingsSource, /SPEECH_SELECTOR_PRESENTATION/);
  assert.doesNotMatch(ttsSettingsSource, /theme\.colors\[[^\]]+\]/);
  assert.doesNotMatch(ttsSettingsSource, /theme\.colors\.[A-Za-z]/);
  assert.doesNotMatch(ttsSettingsSource, /hexToRgba\(/);
  assert.doesNotMatch(ttsSettingsSource, /<Text style=\{styles\.chevron\}>▼<\/Text>/);
  assert.doesNotMatch(ttsSettingsSource, /<Text style=\{styles\.checkmark\}>✓<\/Text>/);
  assert.doesNotMatch(ttsSettingsSource, /backgroundColor:\s*'rgba\(0, 0, 0, 0\.5\)'/);
  assert.doesNotMatch(ttsSettingsSource, /justifyContent:\s*'flex-end'/);
  assert.doesNotMatch(ttsSettingsSource, /theme\.colors\.primary \+ '20'/);

  const rowStyles = extractBetween('row: {', 'label: {');
  assert.doesNotMatch(rowStyles, /flexDirection:\s*'row'/);
  assert.doesNotMatch(rowStyles, /gap:\s*spacing\.sm/);

  const labelStyles = extractBetween('label: {', 'voiceSelector: {');
  assert.doesNotMatch(labelStyles, /fontSize:\s*16/);
  assert.doesNotMatch(labelStyles, /theme\.colors\.foreground/);

  const sliderHeaderStyles = extractBetween('sliderHeader: {', 'sliderValue: {');
  assert.doesNotMatch(sliderHeaderStyles, /flexDirection:\s*'row'/);
  assert.doesNotMatch(sliderHeaderStyles, /justifyContent:\s*'space-between'/);
  assert.doesNotMatch(sliderHeaderStyles, /alignItems:\s*'center'/);
  assert.doesNotMatch(ttsSettingsSource, /minimumTrackTintColor=\{theme\.colors\.primary\}/);
  assert.doesNotMatch(ttsSettingsSource, /maximumTrackTintColor=\{theme\.colors\.muted\}/);
  assert.doesNotMatch(ttsSettingsSource, /thumbTintColor=\{theme\.colors\.primary\}/);

  const testButtonStyles = extractBetween('testButton: {', 'testButtonText: {');
  assert.doesNotMatch(testButtonStyles, /theme\.colors\.muted/);
  assert.doesNotMatch(testButtonStyles, /alignItems:\s*'center'/);
  assert.doesNotMatch(ttsSettingsSource, /marginTop:\s*spacing\.sm/);
  assert.doesNotMatch(ttsSettingsSource, /numberOfLines=\{1\}/);
});
