const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const source = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8')

test('hub section exposes inspectable featured bundle cards', () => {
    assert.match(source, /Featured bundles you can inspect right now\./)
    assert.ok((source.match(/data-bundle-card/g) || []).length >= 3)
    assert.match(source, /Inspect ↗/)
    assert.match(source, /dev-powerpack\.dotagents/)
    assert.match(source, /research-analyst\.dotagents/)
    assert.match(source, /techfrenaj-daily-driver\.dotagents/)
})

test('bundle inspector modal includes required sections and warnings', () => {
    assert.match(source, /id="inspect-modal"/)
    assert.match(source, /role="dialog"/)
    assert.match(source, /Contains MCP commands/)
    assert.match(source, /Contains memories/)
    assert.match(source, /Large prompt content/)
    assert.match(source, /Agent Profiles \(\$\{bundle\.agentProfiles\.length\}\)/)
    assert.match(source, /MCP Servers \(\$\{bundle\.mcpServers\.length\}\)/)
    assert.match(source, /Skills \(\$\{bundle\.skills\.length\}\)/)
    assert.match(source, /Repeat Tasks \(\$\{bundle\.repeatTasks\.length\}\)/)
    assert.match(source, /Memories \(\$\{bundle\.memories\.length\}\)/)
})

test('MCP preview discloses transport-aware connection details and setup requirements', () => {
    assert.match(source, /function formatTransportLabel\(transport\)/)
    assert.match(source, /function getMcpConnectionPreview\(server\)/)
    assert.match(source, /function getMcpConfigurationRequirements\(server\)/)
    assert.match(source, /streamable HTTP/)
    assert.match(source, /Remote MCP server via bundled HTTP transport/)
    assert.match(source, /Requires configuration:/)
    assert.match(source, /<CONFIGURE_YOUR_KEY>/)
})

test('modal logic fetches bundle JSON and supports expected dismissal paths', () => {
    assert.match(source, /const response = await fetch\(bundleUrl\)/)
    assert.match(source, /response\.json\(\)/)
    assert.match(source, /event\.target === modal/)
    assert.match(source, /event\.key === 'Escape'/)
    assert.match(source, /modalInstallBtn\.href = `dotagents:\/\/install\?bundle=\$\{encodeURIComponent\(bundleUrl\)\}`/)
})

test('markdown content is formatted before rendering', () => {
    assert.match(source, /function stripFrontmatter\(value\)/)
    assert.match(source, /function renderMarkdown\(value\)/)
    assert.match(source, /bundle-markdown-heading/)
    assert.match(source, /bundle-code-block/)
    assert.match(source, /renderInlineMarkdown\(headingMatch\[2\]\.trim\(\)\)/)
    assert.match(source, /renderMarkdown\(`## System Prompt\\n\$\{profile\.systemPrompt\}`\)/)
})