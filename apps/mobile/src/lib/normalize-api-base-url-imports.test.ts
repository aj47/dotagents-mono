import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const configSource = readFileSync(new URL('../store/config.ts', import.meta.url), 'utf8');
const openaiClientSource = readFileSync(new URL('./openaiClient.ts', import.meta.url), 'utf8');
const settingsApiSource = readFileSync(new URL('./settingsApi.ts', import.meta.url), 'utf8');
const sharedPackageJson = readFileSync(new URL('../../../../packages/shared/package.json', import.meta.url), 'utf8');

describe('mobile normalizeApiBaseUrl imports', () => {
  it('uses the dedicated shared connection-recovery export instead of the package barrel', () => {
    expect(sharedPackageJson).toContain('"./connection-recovery"');

    for (const source of [configSource, openaiClientSource, settingsApiSource]) {
      expect(source).toContain("from '@dotagents/shared/connection-recovery';");
      expect(source).not.toContain("normalizeApiBaseUrl } from '@dotagents/shared';");
    }
  });
});