const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const microphoneSelectorSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'ui', 'MicrophoneSelector.tsx'),
  'utf8'
);
const useAudioDevicesSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'lib', 'voice', 'useAudioDevices.ts'),
  'utf8'
);
const speechSettingsSource = fs.readFileSync(
  path.join(__dirname, '..', '..', '..', 'packages', 'shared', 'src', 'text-to-speech-settings.ts'),
  'utf8'
);

test('uses the shared speech selector presentation for the mobile microphone picker', () => {
  assert.match(microphoneSelectorSource, /getSpeechSelectorCopyState/);
  assert.match(microphoneSelectorSource, /createSpeechSelectorMobileStyleSheetSlots/);
  assert.match(microphoneSelectorSource, /getSpeechSelectorMobileCloseIconState/);
  assert.match(microphoneSelectorSource, /getSpeechSelectorMobileSurfaceColors/);
  assert.match(microphoneSelectorSource, /getSpeechSelectorMobileSurfaceState/);
  assert.match(microphoneSelectorSource, /const speechSelectorCopy = getSpeechSelectorCopyState\(\)/);
  assert.match(microphoneSelectorSource, /const speechSelectorSurface = getSpeechSelectorMobileSurfaceState\(\)/);
  assert.match(microphoneSelectorSource, /const speechSelectorCloseIcon = getSpeechSelectorMobileCloseIconState\(\)/);
  assert.match(microphoneSelectorSource, /const speechSelectorColors = useMemo\(\s*\(\) => getSpeechSelectorMobileSurfaceColors\(theme\.colors\),/);
  assert.match(microphoneSelectorSource, /StyleSheet\.create\(createSpeechSelectorMobileStyleSheetSlots\(\{\s+colors: speechSelectorColors,\s+spacing,\s+radius,\s+\}\)\)/);
  assert.match(microphoneSelectorSource, /<Text style=\{styles\.label\}>\{speechSelectorCopy\.microphone\.label\}<\/Text>/);
  assert.match(microphoneSelectorSource, /activeOpacity=\{speechSelectorSurface\.trigger\.pressedOpacity\}/);
  assert.match(microphoneSelectorSource, /accessibilityRole=\{speechSelectorSurface\.trigger\.accessibilityRole\}/);
  assert.match(microphoneSelectorSource, /accessibilityLabel=\{speechSelectorCopy\.microphone\.selectAccessibilityLabel\}/);
  assert.match(microphoneSelectorSource, /<Text style=\{styles\.modalTitle\}>\{speechSelectorCopy\.microphone\.pickerTitle\}<\/Text>/);
  assert.match(microphoneSelectorSource, /accessibilityLabel=\{speechSelectorCopy\.microphone\.closeAccessibilityLabel\}/);
  assert.match(microphoneSelectorSource, /activeOpacity=\{speechSelectorSurface\.closeButton\.pressedOpacity\}/);
  assert.match(microphoneSelectorSource, /accessibilityRole=\{speechSelectorSurface\.closeButton\.accessibilityRole\}/);
  assert.match(microphoneSelectorSource, /activeOpacity=\{speechSelectorSurface\.item\.pressedOpacity\}/);
  assert.match(microphoneSelectorSource, /accessibilityRole=\{speechSelectorSurface\.item\.accessibilityRole\}/);
  assert.match(microphoneSelectorSource, /accessibilityState=\{\{ selected: !selectedDeviceId \}\}/);
  assert.match(microphoneSelectorSource, /accessibilityState=\{\{ selected: selectedDeviceId === device\.deviceId \}\}/);
  assert.match(microphoneSelectorSource, /name=\{speechSelectorCloseIcon\.name\}/);
  assert.match(microphoneSelectorSource, /size=\{speechSelectorCloseIcon\.size\}/);
  assert.match(microphoneSelectorSource, /color=\{speechSelectorColors\.closeIcon\.color\}/);
  assert.match(speechSettingsSource, /export function createSpeechSelectorMobileStyleSheetSlots/);
  assert.match(speechSettingsSource, /container:\s*\{[\s\S]*?marginTop:\s*spacing\[surface\.container\.marginTop\]/);
  assert.match(speechSettingsSource, /flexDirection:\s*surface\.row\.flexDirection/);
  assert.match(speechSettingsSource, /gap:\s*spacing\[surface\.row\.gap\]/);
  assert.match(speechSettingsSource, /fontSize:\s*surface\.label\.fontSize/);
  assert.match(speechSettingsSource, /color:\s*colors\.label\.color/);
  assert.match(speechSettingsSource, /fontSize:\s*surface\.nativeHint\.fontSize/);
  assert.match(speechSettingsSource, /color:\s*colors\.nativeHint\.color/);
  assert.match(speechSettingsSource, /fontSize:\s*surface\.helperText\.fontSize/);
  assert.match(speechSettingsSource, /marginTop:\s*spacing\[surface\.helperText\.marginTop\]/);
  assert.match(microphoneSelectorSource, /numberOfLines=\{speechSelectorSurface\.trigger\.textNumberOfLines\}/);
  assert.match(microphoneSelectorSource, /numberOfLines=\{speechSelectorSurface\.itemText\.numberOfLines\}/);
  assert.match(speechSettingsSource, /const triggerTextStyles = \{[\s\S]*?flex:\s*surface\.triggerText\.flex,[\s\S]*?flexShrink:\s*surface\.triggerText\.flexShrink,/);
  assert.match(speechSettingsSource, /selectorText: triggerTextStyles/);
  assert.match(microphoneSelectorSource, /name=\{speechSelectorSurface\.disclosureIcon\.name\}/);
  assert.match(microphoneSelectorSource, /color=\{speechSelectorColors\.disclosureIcon\.color\}/);
  assert.match(speechSettingsSource, /backgroundColor:\s*colors\.modalOverlay\.backgroundColor/);
  assert.match(speechSettingsSource, /modalOverlay:\s*\{[\s\S]*?flex:\s*surface\.modalOverlay\.flex,[\s\S]*?justifyContent:\s*surface\.modalOverlay\.justifyContent,/);
  assert.match(speechSettingsSource, /modalCloseButton:\s*\{[\s\S]*?width:\s*surface\.closeButton\.width,[\s\S]*?height:\s*surface\.closeButton\.height,[\s\S]*?alignItems:\s*surface\.closeButton\.alignItems,[\s\S]*?justifyContent:\s*surface\.closeButton\.justifyContent/);
  assert.match(speechSettingsSource, /backgroundColor:\s*colors\.selectedItem\.backgroundColor/);
  assert.match(microphoneSelectorSource, /name=\{speechSelectorSurface\.selectedIcon\.name\}/);
  assert.match(speechSettingsSource, /color:\s*colors\.errorText\.color/);
  assert.doesNotMatch(microphoneSelectorSource, /SPEECH_SELECTOR_PRESENTATION/);
  assert.doesNotMatch(microphoneSelectorSource, /theme\.colors\[[^\]]+\]/);
  assert.doesNotMatch(microphoneSelectorSource, /theme\.colors\.[A-Za-z]/);
  assert.doesNotMatch(microphoneSelectorSource, /hexToRgba\(/);
  assert.doesNotMatch(microphoneSelectorSource, /<Text style=\{styles\.chevron\}>▼<\/Text>/);
  assert.doesNotMatch(microphoneSelectorSource, /<Text style=\{styles\.checkmark\}>✓<\/Text>/);
  assert.doesNotMatch(microphoneSelectorSource, /modalCloseText/);
  assert.doesNotMatch(microphoneSelectorSource, /speechSelectorCopy\.common\.closeLabel/);
  assert.doesNotMatch(microphoneSelectorSource, /speechSelectorSurface\.closeIcon\.(name|size|colorToken)/);
  assert.doesNotMatch(microphoneSelectorSource, /accessibilityRole="button"/);
  assert.doesNotMatch(microphoneSelectorSource, /color:\s*'#ef4444'/);
  assert.doesNotMatch(microphoneSelectorSource, /backgroundColor:\s*'rgba\(0, 0, 0, 0\.5\)'/);
  assert.doesNotMatch(microphoneSelectorSource, /justifyContent:\s*'flex-end'/);
  assert.doesNotMatch(microphoneSelectorSource, /theme\.colors\.primary \+ '20'/);
  assert.doesNotMatch(microphoneSelectorSource, /container:\s*\{[\s\S]*?marginTop:\s*spacing\[speechSelectorSurface\.container\.marginTop\]/);
  assert.doesNotMatch(microphoneSelectorSource, /selectorText:\s*\{[\s\S]*?flex:\s*speechSelectorSurface\.triggerText\.flex/);
  assert.doesNotMatch(microphoneSelectorSource, /fontSize:\s*16,/);
  assert.doesNotMatch(microphoneSelectorSource, /fontSize:\s*14,/);
  assert.doesNotMatch(microphoneSelectorSource, /theme\.colors\.foreground/);
  assert.doesNotMatch(microphoneSelectorSource, /theme\.colors\.mutedForeground/);
  assert.doesNotMatch(microphoneSelectorSource, /marginTop:\s*spacing\.sm/);
  assert.doesNotMatch(microphoneSelectorSource, /numberOfLines=\{1\}/);
});

test('uses shared speech selector copy for mobile microphone enumeration errors', () => {
  assert.match(useAudioDevicesSource, /formatSpeechSelectorMicrophoneEnumerationError/);
  assert.match(useAudioDevicesSource, /getSpeechSelectorCopyState/);
  assert.match(useAudioDevicesSource, /speechSelectorCopy\.microphone\.enumerationUnsupportedMessage/);
  assert.match(useAudioDevicesSource, /setError\(formatSpeechSelectorMicrophoneEnumerationError\(err\)\)/);
  assert.doesNotMatch(useAudioDevicesSource, /setError\('Audio device enumeration not supported'\)/);
  assert.doesNotMatch(useAudioDevicesSource, /'Failed to enumerate audio devices'/);
});
