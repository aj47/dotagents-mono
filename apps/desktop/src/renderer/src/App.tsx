import { RouterProvider } from "react-router-dom"
import { router } from "./router"
import { lazy, Suspense, useEffect, useState } from "react"
import { Toaster } from "sonner"
import { ThemeProvider } from "./contexts/theme-context"
import { useStoreSync } from "./hooks/use-store-sync"
import { useAudioInputDeviceFallback } from "./hooks/use-audio-input-device-fallback"

const McpElicitationDialog = lazy(() => import("./components/mcp-elicitation-dialog"))
const McpSamplingDialog = lazy(() => import("./components/mcp-sampling-dialog"))

function StoreInitializer({ children }: { children: React.ReactNode }) {
  useStoreSync()
  useAudioInputDeviceFallback()

  return <>{children}</>
}

function App(): JSX.Element {
  const [shouldMountMcpDialogs, setShouldMountMcpDialogs] = useState(false)

  useEffect(() => {
    const win = window as Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout?: number }) => number
      cancelIdleCallback?: (id: number) => void
    }

    if (win.requestIdleCallback) {
      const idleId = win.requestIdleCallback(() => setShouldMountMcpDialogs(true), { timeout: 1500 })
      return () => win.cancelIdleCallback?.(idleId)
    }

    const timer = window.setTimeout(() => setShouldMountMcpDialogs(true), 500)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <ThemeProvider>
      <StoreInitializer>
        <RouterProvider router={router}></RouterProvider>

        {/* MCP Protocol 2025-11-25 dialogs for elicitation and sampling */}
        {shouldMountMcpDialogs && (
          <Suspense>
            <McpElicitationDialog />
            <McpSamplingDialog />
          </Suspense>
        )}

        <Toaster />
      </StoreInitializer>
    </ThemeProvider>
  )
}

export default App
