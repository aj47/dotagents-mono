import { createClient, createEventHandlers } from "@egoist/tipc/renderer"
import type { RendererHandlers } from "@shared/renderer-handlers"
import type { DesktopTipcClient, LooseTipcRouter } from "@shared/tipc-client-types"

const rawClient = createClient<LooseTipcRouter>({
  // pass ipcRenderer.invoke function to the client
  // you can expose it from preload.js in BrowserWindow
  ipcInvoke: window.electron.ipcRenderer.invoke,
})

// Relax types so zero-input procedures can be called without args and results are usable in JSX
export const tipcClient = rawClient as DesktopTipcClient

export const rendererHandlers = createEventHandlers<RendererHandlers>({
  on: window.electron.ipcRenderer.on,

  send: window.electron.ipcRenderer.send,
})
