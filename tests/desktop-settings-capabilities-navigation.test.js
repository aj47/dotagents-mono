const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const capabilitiesSource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'renderer', 'src', 'pages', 'settings-capabilities.tsx'),
  'utf8'
);

const routerSource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'renderer', 'src', 'router.tsx'),
  'utf8'
);

const redirectSource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'renderer', 'src', 'lib', 'legacy-settings-redirect.ts'),
  'utf8'
);

const agentsSource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'renderer', 'src', 'pages', 'settings-agents.tsx'),
  'utf8'
);

test('capabilities page derives the active tab from the URL search params', () => {
  assert.match(capabilitiesSource, /useSearchParams\(/);
  assert.match(capabilitiesSource, /const requestedTab = searchParams\.get\("tab"\)/);
  assert.match(capabilitiesSource, /const activeTab = isTabId\(requestedTab\) \? requestedTab : DEFAULT_TAB/);
  assert.match(capabilitiesSource, /nextSearchParams\.set\("tab", tabId\)/);
});

test('legacy settings redirects can add default query params without overwriting existing ones', () => {
  assert.match(redirectSource, /defaultSearchParams\?: Record<string, string>/);
  assert.match(redirectSource, /if \(!nextSearchParams\.has\(key\)\) \{/);
  assert.match(redirectSource, /nextSearchParams\.set\(key, value\)/);
});

test('legacy capability routes preserve the intended subtab', () => {
  assert.match(routerSource, /legacySettingsRedirect\("\/settings\/capabilities", \{ tab: "mcp-servers" \}\)/);
  assert.match(routerSource, /legacySettingsRedirect\("\/settings\/capabilities", \{ tab: "skills" \}\)/);
});

test('agent settings deep links open the matching capabilities tab', () => {
  assert.match(agentsSource, /navigate\("\/settings\/capabilities\?tab=skills"\)/);
  assert.match(agentsSource, /navigate\("\/settings\/capabilities\?tab=mcp-servers"\)/);
});