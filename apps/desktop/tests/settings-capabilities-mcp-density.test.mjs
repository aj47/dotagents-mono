import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const mcpToolsPageSource = fs.readFileSync(
  path.join(process.cwd(), 'apps/desktop/src/renderer/src/pages/settings-mcp-tools.tsx'),
  'utf8',
)

const mcpConfigManagerSource = fs.readFileSync(
  path.join(process.cwd(), 'apps/desktop/src/renderer/src/components/mcp-config-manager.tsx'),
  'utf8',
)

test('desktop capabilities MCP tab removes redundant wrapper chrome above the manager', () => {
  assert.doesNotMatch(mcpToolsPageSource, /Configure MCP servers and tools available to the agent\./)
  assert.doesNotMatch(mcpToolsPageSource, /className="min-w-0 border-t pt-6"/)
  assert.match(mcpToolsPageSource, /className="modern-panel h-full min-w-0 overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-6"/)
  assert.match(mcpToolsPageSource, /<div className="min-w-0">[\s\S]*?<MCPConfigManager/)
})

test('desktop MCP config manager still provides its own heading after the wrapper cleanup', () => {
  assert.match(mcpConfigManagerSource, /<h3 className="text-lg font-medium">MCP Tools & Servers<\/h3>/)
})

test('desktop MCP server rows replace the icon-only action rail with one compact Actions menu', () => {
  assert.match(mcpConfigManagerSource, /aria-label=\{`Actions for \$\{name\} server`\}/)
  assert.match(mcpConfigManagerSource, /<span>Actions<\/span>/)
  assert.match(mcpConfigManagerSource, /<DropdownMenuItem onClick=\{\(\) => handleRestartServer\(name\)\}>[\s\S]*?Restart server/)
  assert.match(mcpConfigManagerSource, /<DropdownMenuItem onClick=\{\(\) => handleStopServer\(name\)\}>[\s\S]*?Stop server/)
  assert.match(mcpConfigManagerSource, /<DropdownMenuItem[\s\S]*?handleDeleteServer\(name\)[\s\S]*?Delete server/)
})

test('desktop MCP server rows no longer pin the old title-only icon actions', () => {
  assert.doesNotMatch(mcpConfigManagerSource, /title="Start server"/)
  assert.doesNotMatch(mcpConfigManagerSource, /title="Restart server"/)
  assert.doesNotMatch(mcpConfigManagerSource, /title="Stop server"/)
  assert.doesNotMatch(mcpConfigManagerSource, /title="Edit server"/)
  assert.doesNotMatch(mcpConfigManagerSource, /title="Start OAuth authentication"/)
  assert.doesNotMatch(mcpConfigManagerSource, /title="Revoke OAuth authentication"/)
  assert.doesNotMatch(mcpConfigManagerSource, /title="Delete server"/)
})