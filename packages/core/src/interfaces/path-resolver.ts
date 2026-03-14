/**
 * PathResolver — abstracts platform-specific path resolution.
 *
 * Desktop (Electron): uses `app.getPath('appData')`, `app.getPath('userData')`.
 * CLI: uses `~/.dotagents/` or `$DOTAGENTS_DATA_DIR`.
 */
export interface PathResolver {
  /**
   * Returns the base path for user-specific application data.
   * Electron equivalent: `app.getPath('userData')`
   * Typically: `~/.config/<app-name>` or `~/Library/Application Support/<app-name>`
   */
  getUserDataPath(): string;

  /**
   * Returns the path to the application configuration directory.
   * Typically: `getUserDataPath()` or a subdirectory of it.
   */
  getConfigPath(): string;

  /**
   * Returns the base path for application data shared across users.
   * Electron equivalent: `app.getPath('appData')`
   * Typically: `~/Library/Application Support` (macOS) or `~/.config` (Linux)
   */
  getAppDataPath(): string;

  /**
   * Returns the path to a temporary directory for the application.
   * Electron equivalent: `app.getPath('temp')`
   */
  getTempPath(): string;

  /**
   * Returns the path to the user's home directory.
   * Electron equivalent: `app.getPath('home')`
   */
  getHomePath(): string;

  /**
   * Returns the path to the user's desktop directory.
   * Electron equivalent: `app.getPath('desktop')`
   */
  getDesktopPath(): string;

  /**
   * Returns the path to the user's downloads directory.
   * Electron equivalent: `app.getPath('downloads')`
   */
  getDownloadsPath(): string;

  /**
   * Returns the path to the application's log directory.
   * Electron equivalent: `app.getPath('logs')`
   */
  getLogsPath(): string;

  /**
   * Returns the path to the application root directory.
   * Electron equivalent: `app.getAppPath()`
   * CLI: the module's directory or process.cwd().
   */
  getAppPath?(): string;
}
