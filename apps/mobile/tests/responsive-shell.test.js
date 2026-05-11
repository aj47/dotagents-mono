const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const appSource = fs.readFileSync(path.join(__dirname, '..', 'App.tsx'), 'utf8');
const settingsSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'screens', 'SettingsScreen.tsx'), 'utf8');
const appShellEditorLayoutSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'ui', 'AppShellEditorLayout.tsx'),
  'utf8'
);
const appShellSettingsLayoutSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'ui', 'AppShellSettingsLayout.tsx'),
  'utf8'
);
const editorScreenSources = [
  'AgentEditScreen.tsx',
  'KnowledgeNoteEditScreen.tsx',
  'LoopEditScreen.tsx',
  'SkillEditScreen.tsx',
].map((fileName) =>
  fs.readFileSync(path.join(__dirname, '..', 'src', 'screens', fileName), 'utf8')
);

test('mobile app uses the shared app-shell contract for responsive layout', () => {
  assert.match(appSource, /@dotagents\/shared\/app-shell/);
  assert.match(appSource, /APP_SHELL_DIMENSIONS/);
  assert.match(appSource, /APP_SHELL_MOBILE_ROUTE_TITLES/);
  assert.match(appSource, /resolveAppShellLayout\(width\)/);
  assert.match(appSource, /APP_SHELL_PRIMARY_NAV_ITEMS\.map/);
  assert.match(appSource, /getMobilePrimaryNavItemId\(currentRouteName\)/);
  assert.match(appSource, /navigate\(item\.mobileRouteName, item\.mobileRouteParams\)/);
});

test('compact mobile windows share the primary nav structure with compact desktop windows', () => {
  assert.match(appSource, /const compactShellPrimaryNav = !isDesktopShell \?/);
  assert.match(appSource, /accessibilityLabel="Primary navigation"/);
  assert.match(appSource, /APP_SHELL_PRIMARY_NAV_ITEMS\.map\(\(item\) =>/);
  assert.match(appSource, /style=\{navigationStyles\.compactShellPrimaryNav\}/);
  assert.match(appSource, /minHeight: APP_SHELL_DIMENSIONS\.compactPrimaryNavHeight/);
  assert.match(appSource, /navigatePrimaryShellItem\(item\)/);
});

test('wide mobile windows render a desktop-style shell rail and hide stack headers', () => {
  assert.match(appSource, /const isDesktopShell = appShellLayout === 'desktop'/);
  assert.match(appSource, /desktopShellRail/);
  assert.match(appSource, /width: APP_SHELL_DIMENSIONS\.desktopRailWidth/);
  assert.match(appSource, /shouldHideMobileStackHeaderForDesktopShell\(route\.name\)/);
  assert.match(appSource, /onStateChange=\{refreshCurrentRouteName\}/);
});

test('settings honors shared shell section routing for wide nav items', () => {
  assert.match(settingsSource, /SettingsScreen\(\{ navigation, route \}: any\)/);
  assert.match(settingsSource, /isAppShellMobileSettingsSectionId/);
  assert.match(settingsSource, /route\?\.params\?\.initialSection/);
  assert.match(settingsSource, /useWindowDimensions/);
  assert.match(settingsSource, /resolveAppShellLayout\(width\) === 'desktop'/);
  assert.match(settingsSource, /getDesktopSettingsNavItems\(\{/);
  assert.match(settingsSource, /getAppShellMobileSettingsSectionIdsForDesktopNavItem\(activeDesktopSettingsNavItemId\)/);
  assert.match(settingsSource, /getAppShellDesktopSettingsNavItemIdForMobileSection\(routeInitialSettingsSection\)/);
  assert.match(settingsSource, /activeDesktopSettingsNavItemId/);
  assert.match(settingsSource, /!activeDesktopSettingsSectionIds\.has\(id as AppShellMobileSettingsSectionId\)/);
  assert.match(settingsSource, /isGeneralSettingsSectionActive/);
  assert.match(settingsSource, /AppShellSettingsLayout/);
  assert.match(settingsSource, /navItems=\{desktopSettingsNavItems\}/);
  assert.match(settingsSource, /activeNavItemId=\{activeDesktopSettingsNavItemId\}/);
  assert.match(appShellSettingsLayoutSource, /APP_SHELL_DIMENSIONS\.desktopSettingsNavWidth/);
  assert.match(appShellSettingsLayoutSource, /APP_SHELL_DIMENSIONS\.desktopContentMaxWidth/);
  assert.match(appShellSettingsLayoutSource, /KeyboardAvoidingView/);
  assert.match(appShellSettingsLayoutSource, /refreshControl=\{refreshControl\}/);
  assert.doesNotMatch(settingsSource, /initialSection !== 'agents'/);
  assert.doesNotMatch(settingsSource, /initialSection !== 'knowledgeNotes'/);
});

test('mobile editor screens use the shared wide app-shell editor layout', () => {
  assert.match(appShellEditorLayoutSource, /useWindowDimensions/);
  assert.match(appShellEditorLayoutSource, /resolveAppShellLayout\(width\) === 'desktop'/);
  assert.match(appShellEditorLayoutSource, /APP_SHELL_DIMENSIONS\.desktopContentMaxWidth/);
  assert.match(appShellEditorLayoutSource, /KeyboardAvoidingView/);
  assert.match(appShellEditorLayoutSource, /keyboardShouldPersistTaps=\{keyboardShouldPersistTaps\}/);

  for (const source of editorScreenSources) {
    assert.match(source, /AppShellEditorLayout/);
    assert.match(source, /title=\{getAppShellEditorTitle\(/);
    assert.match(source, /getAppShellEditorTitle\(/);
    assert.doesNotMatch(source, /desktopEditorContainer/);
    assert.doesNotMatch(source, /isDesktopEditorLayout/);
  }
});

test('session list pulls shared conversation presentation copy', () => {
  const sessionListSource = fs.readFileSync(
    path.join(__dirname, '..', 'src', 'screens', 'SessionListScreen.tsx'),
    'utf8'
  );

  assert.match(sessionListSource, /@dotagents\/shared\/conversation-list-presentation/);
  assert.match(sessionListSource, /normalizeConversationListPreviewText/);
  assert.match(sessionListSource, /getConversationListItemAccessibilityLabel/);
  assert.match(sessionListSource, /getConversationArchiveFilterLabel/);
  assert.match(sessionListSource, /getConversationListEmptyState/);
});
