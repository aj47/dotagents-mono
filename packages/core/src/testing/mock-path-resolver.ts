import type { PathResolver } from '../interfaces/path-resolver';

/**
 * Mock PathResolver for testing.
 * Returns predictable paths based on a configurable base directory.
 */
export class MockPathResolver implements PathResolver {
  constructor(private basePath: string = '/mock/app') {}

  getUserDataPath(): string {
    return `${this.basePath}/userData`;
  }

  getConfigPath(): string {
    return `${this.basePath}/config`;
  }

  getAppDataPath(): string {
    return `${this.basePath}/appData`;
  }

  getTempPath(): string {
    return `${this.basePath}/temp`;
  }

  getHomePath(): string {
    return `${this.basePath}/home`;
  }

  getDesktopPath(): string {
    return `${this.basePath}/home/Desktop`;
  }

  getDownloadsPath(): string {
    return `${this.basePath}/home/Downloads`;
  }

  getLogsPath(): string {
    return `${this.basePath}/logs`;
  }

  isPackaged(): boolean {
    return false;
  }

  getResourcesPath(): string | null {
    return null;
  }
}

/**
 * Create a mock PathResolver with custom path overrides.
 */
export function createMockPathResolver(
  overrides: Partial<Record<keyof PathResolver, string>> = {}
): PathResolver {
  const base = new MockPathResolver();
  return {
    getUserDataPath: () => overrides.getUserDataPath ?? base.getUserDataPath(),
    getConfigPath: () => overrides.getConfigPath ?? base.getConfigPath(),
    getAppDataPath: () => overrides.getAppDataPath ?? base.getAppDataPath(),
    getTempPath: () => overrides.getTempPath ?? base.getTempPath(),
    getHomePath: () => overrides.getHomePath ?? base.getHomePath(),
    getDesktopPath: () => overrides.getDesktopPath ?? base.getDesktopPath(),
    getDownloadsPath: () => overrides.getDownloadsPath ?? base.getDownloadsPath(),
    getLogsPath: () => overrides.getLogsPath ?? base.getLogsPath(),
  };
}
