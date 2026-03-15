import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as os from 'node:os';
import * as path from 'node:path';
import { FilePathResolver } from './file-path-resolver';

describe('FilePathResolver', () => {
  let resolver: FilePathResolver;
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.DOTAGENTS_DATA_DIR;
    resolver = new FilePathResolver();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('getUserDataPath returns ~/.dotagents by default', () => {
    const result = resolver.getUserDataPath();
    expect(result).toBe(path.join(os.homedir(), '.dotagents'));
  });

  it('getUserDataPath respects DOTAGENTS_DATA_DIR env var', () => {
    process.env.DOTAGENTS_DATA_DIR = '/tmp/custom-dotagents';
    const customResolver = new FilePathResolver();
    expect(customResolver.getUserDataPath()).toBe('/tmp/custom-dotagents');
  });

  it('getConfigPath returns same as userData', () => {
    expect(resolver.getConfigPath()).toBe(resolver.getUserDataPath());
  });

  it('getAppDataPath returns platform-appropriate path', () => {
    const result = resolver.getAppDataPath();
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('getTempPath returns os temp directory', () => {
    expect(resolver.getTempPath()).toBe(os.tmpdir());
  });

  it('getHomePath returns os home directory', () => {
    expect(resolver.getHomePath()).toBe(os.homedir());
  });

  it('getDesktopPath returns home/Desktop', () => {
    expect(resolver.getDesktopPath()).toBe(path.join(os.homedir(), 'Desktop'));
  });

  it('getDownloadsPath returns home/Downloads', () => {
    expect(resolver.getDownloadsPath()).toBe(
      path.join(os.homedir(), 'Downloads')
    );
  });

  it('getLogsPath returns a path inside the data dir', () => {
    expect(resolver.getLogsPath()).toBe(
      path.join(resolver.getUserDataPath(), 'logs')
    );
  });

  it('getAppPath returns cwd', () => {
    expect(resolver.getAppPath()).toBe(process.cwd());
  });

  it('isPackaged returns false', () => {
    expect(resolver.isPackaged()).toBe(false);
  });

  it('getResourcesPath returns null', () => {
    expect(resolver.getResourcesPath()).toBeNull();
  });
});
