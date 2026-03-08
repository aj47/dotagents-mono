import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const bundleServiceSource = fs.readFileSync(new URL('./bundle-service.ts', import.meta.url), 'utf8');

test('bundle service preserves redacted MCP config placeholders for export, preview, and import', () => {
  assert.match(bundleServiceSource, /export interface BundleMCPServer \{[\s\S]*config\?: Record<string, unknown>[\s\S]*redactedSecretFields\?: string\[\]/);
  assert.match(bundleServiceSource, /const REDACTED_SECRET_PLACEHOLDER = "<CONFIGURE_YOUR_KEY>"/);
  assert.match(bundleServiceSource, /function getRedactedSecretFieldNames\(config: Record<string, unknown>\): string\[]/);
  assert.match(bundleServiceSource, /const redactedSecretFields = getRedactedSecretFieldNames\(stripped\)/);
  assert.match(bundleServiceSource, /config: stripped,/);
  assert.match(bundleServiceSource, /redactedSecretFields,/);
  assert.match(bundleServiceSource, /function normalizeBundleMcpServer\(server: BundleMCPServer\): BundleMCPServer/);
  assert.match(bundleServiceSource, /const mcpServers = bundle\.mcpServers\.map\(normalizeBundleMcpServer\)/);
  assert.match(bundleServiceSource, /function buildImportedMcpServerConfig\(bundleServer: BundleMCPServer\): Record<string, unknown>/);
  assert.match(bundleServiceSource, /const serverConfig = buildImportedMcpServerConfig\(bundleServer\)/);
});