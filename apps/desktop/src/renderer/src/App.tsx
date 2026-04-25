import { RouterProvider } from "react-router-dom"
import { router } from "./router"
import { lazy, Suspense, useEffect } from "react"
import { Toaster } from "sonner"
import { ThemeProvider } from "./contexts/theme-context"
import { useStoreSync } from "./hooks/use-store-sync"
import { useAudioInputDeviceFallback } from "./hooks/use-audio-input-device-fallback"
import { initializeSessionSwitchPerfHarness } from "./lib/session-switch-perf-harness"

const McpElicitationDialog = lazy(() => import("./components/mcp-elicitation-dialog"))
const McpSamplingDialog = lazy(() => import("./components/mcp-sampling-dialog"))

function StoreInitializer({ children }: { children: React.ReactNode }) {
  useStoreSync()
  useAudioInputDeviceFallback()
  useEffect(() => {
    if (!import.meta.env.DEV && import.meta.env.MODE !== "test") return undefined
    return initializeSessionSwitchPerfHarness()
  }, [])
  return <>{children}</>
}

function App(): JSX.Element {
  return (
    <ThemeProvider>
      <StoreInitializer>
        <RouterProvider router={router}></RouterProvider>

        {/* MCP Protocol 2025-11-25 dialogs for elicitation and sampling */}
        <Suspense>
          <McpElicitationDialog />
          <McpSamplingDialog />
        </Suspense>

        <Toaster />
      </StoreInitializer>
    </ThemeProvider>
  )
}

export default App
