import { dialog, shell, BrowserWindow } from "electron"
import type {
  UserInteraction,
  FilePickerOptions,
  FileSaveOptions,
  ApprovalRequest,
} from "@dotagents/core"

/**
 * Electron-specific UserInteraction implementation.
 * Uses Electron's dialog and shell modules for user-facing prompts.
 */
export class ElectronUserInteraction implements UserInteraction {
  showError(title: string, message: string): void {
    dialog.showErrorBox(title, message)
  }

  showWarning(title: string, message: string): void {
    const win = BrowserWindow.getFocusedWindow()
    dialog.showMessageBox(win ?? ({} as any), {
      type: "warning",
      title,
      message,
      buttons: ["OK"],
    }).catch(() => {})
  }

  showInfo(title: string, message: string): void {
    const win = BrowserWindow.getFocusedWindow()
    dialog.showMessageBox(win ?? ({} as any), {
      type: "info",
      title,
      message,
      buttons: ["OK"],
    }).catch(() => {})
  }

  async pickFile(options: FilePickerOptions): Promise<string[] | null> {
    const win = BrowserWindow.getFocusedWindow()
    const properties: Electron.OpenDialogOptions["properties"] = ["openFile"]
    if (options.multiple) {
      properties.push("multiSelections")
    }

    const result = await dialog.showOpenDialog(win ?? ({} as any), {
      title: options.title,
      defaultPath: options.defaultPath,
      filters: options.filters,
      properties,
    })

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }
    return result.filePaths
  }

  async saveFile(options: FileSaveOptions): Promise<string | null> {
    const win = BrowserWindow.getFocusedWindow()
    const result = await dialog.showSaveDialog(win ?? ({} as any), {
      title: options.title,
      defaultPath: options.defaultName
        ? options.defaultPath
          ? `${options.defaultPath}/${options.defaultName}`
          : options.defaultName
        : options.defaultPath,
      filters: options.filters,
    })

    if (result.canceled || !result.filePath) {
      return null
    }
    return result.filePath
  }

  async requestApproval(_request: ApprovalRequest): Promise<boolean> {
    // Tool approval in Electron desktop is handled through the renderer UI
    // (tipc flow), not through a dialog. This is a no-op fallback;
    // the actual approval flow goes through the panel window.
    return true
  }

  async openExternal(url: string): Promise<void> {
    await shell.openExternal(url)
  }

  async confirm(title: string, message: string): Promise<boolean> {
    const win = BrowserWindow.getFocusedWindow()
    const result = await dialog.showMessageBox(win ?? ({} as any), {
      type: "question",
      title,
      message,
      buttons: ["Yes", "No"],
      defaultId: 0,
      cancelId: 1,
    })
    return result.response === 0
  }
}
