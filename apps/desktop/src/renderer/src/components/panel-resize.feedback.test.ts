import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const resizeHandleSource = readFileSync(new URL("./resize-handle.tsx", import.meta.url), "utf8")
const resizeWrapperSource = readFileSync(new URL("./panel-resize-wrapper.tsx", import.meta.url), "utf8")

describe("desktop floating panel resize feedback", () => {
  it("shows visible feedback when resize start cannot read the current panel size", () => {
    expect(resizeHandleSource).toContain('import { toast } from "sonner"')
    expect(resizeHandleSource).toContain('console.error("Invalid window size response:", windowSize)')
    expect(resizeHandleSource).toContain('toast.error("Failed to start resizing the floating panel. Please try again.")')
    expect(resizeHandleSource).toContain('console.error("Failed to get panel size:", error)')
    expect(resizeHandleSource).toContain(
      '`Failed to start resizing the floating panel. ${getActionErrorMessage(error, "Please try again.")}`',
    )
  })

  it("shows visible feedback when the resized panel size cannot be persisted", () => {
    expect(resizeWrapperSource).toContain('import { toast } from "sonner"')
    expect(resizeWrapperSource).toContain('console.error("Failed to save panel size:", error, fallbackError)')
    expect(resizeWrapperSource).toContain(
      '`Failed to save the floating panel size. ${getActionErrorMessage(fallbackError, "The resize may not persist.")}`',
    )
  })
})