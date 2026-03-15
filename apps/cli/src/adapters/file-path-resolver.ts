import * as path from 'node:path';
import * as os from 'node:os';
import * as fs from 'node:fs';
import type { PathResolver } from '@dotagents/core';

/**
 * CLI-specific PathResolver implementation.
 *
 * Uses standard Node.js paths instead of Electron's app.getPath().
 * Data is stored in `~/.dotagents/` or the path specified by $DOTAGENTS_DATA_DIR.
 */
export class FilePathResolver implements PathResolver {
  private readonly dataDir: string;

  constructor() {
    this.dataDir = process.env.DOTAGENTS_DATA_DIR
      ?? path.join(os.homedir(), '.dotagents');

    // Ensure the data directory exists
    fs.mkdirSync(this.dataDir, { recursive: true });
  }

  getUserDataPath(): string {
    return this.dataDir;
  }

  getConfigPath(): string {
    return this.dataDir;
  }

  getAppDataPath(): string {
    if (process.platform === 'darwin') {
      return path.join(os.homedir(), 'Library', 'Application Support');
    }
    return process.env.XDG_CONFIG_HOME ?? path.join(os.homedir(), '.config');
  }

  getTempPath(): string {
    return os.tmpdir();
  }

  getHomePath(): string {
    return os.homedir();
  }

  getDesktopPath(): string {
    return path.join(os.homedir(), 'Desktop');
  }

  getDownloadsPath(): string {
    return path.join(os.homedir(), 'Downloads');
  }

  getLogsPath(): string {
    const logsDir = path.join(this.dataDir, 'logs');
    fs.mkdirSync(logsDir, { recursive: true });
    return logsDir;
  }

  getAppPath(): string {
    return process.cwd();
  }

  isPackaged(): boolean {
    return false;
  }

  getResourcesPath(): string | null {
    return null;
  }
}
