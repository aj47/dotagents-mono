const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const appSource = fs.readFileSync(path.join(__dirname, '..', 'App.tsx'), 'utf8');
const appShellSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'ui', 'appShell.ts'),
  'utf8',
);
const settingsSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SettingsScreen.tsx'),
  'utf8',
);
const settingsLayoutSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'ui', 'AppShellSettingsLayout.tsx'),
  'utf8',
);
const editorLayoutSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'ui', 'AppShellEditorLayout.tsx'),
  'utf8',
);

const editorScreenSources = [
  'AgentEditScreen.tsx',
  'KnowledgeNoteEditScreen.tsx',
  'LoopEditScreen.tsx',
  'SkillEditScreen.tsx',
].map((fileName) =>
  fs.readFileSync(path.join(__dirname, '..', 'src', 'screens', fileName), 'utf8')
);

test('mobile app restores responsive shell navigation locally', () => {
  assert.match(appSource, /from '\.\/src\/ui\/appShell'/);
  assert.match(appSource, /useWindowDimensions/);
  assert.match(appSource, /resolveAppShellLayout\(width\)/);
  assert.match(appSource, /APP_SHELL_PRIMARY_NAV_ITEMS\.map/);
  assert.match(appSource, /getMobilePrimaryNavItemId\(currentRouteName\)/);
  assert.match(appSource, /navigatePrimaryShellItem\(item\)/);
  assert.match(appSource, /onStateChange=\{refreshCurrentRouteName\}/);
  assert.match(appSource, /shouldHideMobileStackHeaderForDesktopShell\(route\.name\)/);
  assert.match(appSource, /desktopShellRail/);
  assert.match(appSource, /compactShellPrimaryNav/);
  assert.doesNotMatch(appSource, /@dotagents\/shared\/app-shell/);
});

test('mobile app-shell helpers keep the primary and settings nav contracts local', () => {
  assert.match(appShellSource, /desktopMinWidth: 768/);
  assert.match(appShellSource, /desktopRailWidth: 176/);
  assert.match(appShellSource, /compactPrimaryNavHeight: 49/);
  assert.match(appShellSource, /mobileRouteParams: \{ initialSection: 'agents' \}/);
  assert.match(appShellSource, /mobileRouteParams: \{ initialSection: 'knowledgeNotes' \}/);
  assert.match(appShellSource, /providers: \['providerSelection', 'providerSetup', 'speechToText', 'textToSpeech'\]/);
  assert.match(appShellSource, /capabilities: \['agentSettings', 'toolExecution', 'mcpServers', 'skills'\]/);
  assert.match(appShellSource, /getAppShellEditorTitle/);
});

test('settings uses the local wide settings sidebar without shared app-shell imports', () => {
  assert.match(settingsSource, /SettingsScreen\(\{ navigation, route \}: any\)/);
  assert.match(settingsSource, /route\?\.params\?\.initialSection/);
  assert.match(settingsSource, /isAppShellMobileSettingsSectionId/);
  assert.match(settingsSource, /resolveAppShellLayout\(width\) === 'desktop'/);
  assert.match(settingsSource, /getDesktopSettingsNavItems\(\{/);
  assert.match(settingsSource, /getAppShellMobileSettingsSectionIdsForDesktopNavItem\(activeDesktopSettingsNavItemId\)/);
  assert.match(settingsSource, /getAppShellDesktopSettingsNavItemIdForMobileSection\(routeInitialSettingsSection\)/);
  assert.match(settingsSource, /isGeneralSettingsSectionActive/);
  assert.match(settingsSource, /AppShellSettingsLayout/);
  assert.match(settingsSource, /navItems=\{desktopSettingsNavItems\}/);
  assert.match(settingsSource, /activeNavItemId=\{activeDesktopSettingsNavItemId\}/);
  assert.match(settingsSource, /desktopSettingsActivePanel/);
  assert.match(settingsLayoutSource, /APP_SHELL_DIMENSIONS\.desktopSettingsNavWidth/);
  assert.match(settingsLayoutSource, /APP_SHELL_DIMENSIONS\.desktopContentMaxWidth/);
  assert.match(settingsLayoutSource, /KeyboardAvoidingView/);
  assert.match(settingsLayoutSource, /refreshControl=\{refreshControl\}/);
  assert.doesNotMatch(settingsSource, /@dotagents\/shared\/app-shell/);
});

test('mobile editor screens share the local wide editor layout', () => {
  assert.match(editorLayoutSource, /useWindowDimensions/);
  assert.match(editorLayoutSource, /resolveAppShellLayout\(width\) === 'desktop'/);
  assert.match(editorLayoutSource, /APP_SHELL_DIMENSIONS\.desktopContentMaxWidth/);
  assert.match(editorLayoutSource, /KeyboardAvoidingView/);
  assert.match(editorLayoutSource, /keyboardShouldPersistTaps=\{keyboardShouldPersistTaps\}/);

  for (const source of editorScreenSources) {
    assert.match(source, /AppShellEditorLayout/);
    assert.match(source, /title=\{getAppShellEditorTitle\(/);
    assert.doesNotMatch(source, /KeyboardAvoidingView/);
    assert.doesNotMatch(source, /ScrollView/);
    assert.doesNotMatch(source, /useSafeAreaInsets/);
  }
});
