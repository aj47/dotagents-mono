import { exec } from 'node:child_process';
import type {
  UserInteraction,
  FilePickerOptions,
  FileSaveOptions,
  ApprovalRequest,
} from '@dotagents/core';

/**
 * Terminal-based UserInteraction implementation.
 *
 * Provides basic terminal output for errors/warnings/info,
 * and stub implementations for file dialogs and approvals
 * that will be replaced with TUI-based prompts in future features.
 */
export class TerminalUserInteraction implements UserInteraction {
  showError(title: string, message: string): void {
    console.error(`\x1b[31m[ERROR] ${title}: ${message}\x1b[0m`);
  }

  showWarning(title: string, message: string): void {
    console.warn(`\x1b[33m[WARN] ${title}: ${message}\x1b[0m`);
  }

  showInfo(title: string, message: string): void {
    console.log(`\x1b[36m[INFO] ${title}: ${message}\x1b[0m`);
  }

  async pickFile(_options: FilePickerOptions): Promise<string[] | null> {
    // File picking in a TUI will be implemented in a future feature
    // For now, return null (cancelled)
    this.showWarning('File Picker', 'File picking is not yet supported in the CLI.');
    return null;
  }

  async saveFile(_options: FileSaveOptions): Promise<string | null> {
    // File saving in a TUI will be implemented in a future feature
    // For now, return null (cancelled)
    this.showWarning('File Save', 'File saving dialog is not yet supported in the CLI.');
    return null;
  }

  async requestApproval(request: ApprovalRequest): Promise<boolean> {
    // Tool approval will be implemented with TUI prompts in a future feature
    // For now, auto-approve
    console.log(
      `\x1b[33m[APPROVAL] Auto-approving tool: ${request.toolName}\x1b[0m`
    );
    return true;
  }

  async openExternal(url: string): Promise<void> {
    const command =
      process.platform === 'darwin'
        ? `open "${url}"`
        : process.platform === 'win32'
          ? `start "${url}"`
          : `xdg-open "${url}"`;

    return new Promise((resolve, reject) => {
      exec(command, (error) => {
        if (error) {
          this.showError('Open External', `Failed to open URL: ${url}`);
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  async confirm(_title: string, _message: string): Promise<boolean> {
    // Confirmation dialog will be implemented with TUI prompts in a future feature
    // For now, auto-confirm
    return true;
  }
}
