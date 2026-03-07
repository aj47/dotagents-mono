import { tipcClient } from "@renderer/lib/tipc-client"

/**
 * Clipboard writes via the renderer API can fail on some Wayland setups.
 * Fallback to Electron main-process clipboard to keep copy actions working.
 */
export async function copyTextToClipboard(text: string): Promise<void> {
  let rendererError: unknown = null

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return
    }
  } catch (error) {
    rendererError = error
  }

  try {
    await tipcClient.writeClipboard({ text })
  } catch (error) {
    throw error ?? rendererError ?? new Error("Failed to copy text to clipboard")
  }
}

