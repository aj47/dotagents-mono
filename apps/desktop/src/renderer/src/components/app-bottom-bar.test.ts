import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const bottomBarSource = readFileSync(
  new URL("./app-bottom-bar.tsx", import.meta.url),
  "utf8",
)
const appLayoutSource = readFileSync(
  new URL("./app-layout.tsx", import.meta.url),
  "utf8",
)

describe("app bottom bar", () => {
  it("renders as app chrome instead of sidebar content", () => {
    expect(appLayoutSource).toContain(
      'import { AppBottomBar } from "@renderer/components/app-bottom-bar"',
    )
    expect(appLayoutSource).toContain('className="flex h-dvh flex-col"')
    expect(appLayoutSource).toContain("<AppBottomBar />")
    expect(appLayoutSource).not.toContain("process.env.APP_VERSION")
    expect(bottomBarSource).toContain("process.env.APP_VERSION")
  })

  it("exposes repeat tasks and model controls from the footer", () => {
    expect(bottomBarSource).toContain('navigate("/settings/repeat-tasks")')
    expect(bottomBarSource).toContain('queryKey: ["loops"]')
    expect(bottomBarSource).toContain(
      "rendererHandlers.loopsFolderChanged.listen",
    )
    expect(bottomBarSource).toContain("CHAT_PROVIDERS")
    expect(bottomBarSource).toContain('aria-label="Change agent provider"')
    expect(bottomBarSource).toContain('aria-label="Change agent model"')
    expect(bottomBarSource).not.toContain(">Provider<")
    expect(bottomBarSource).not.toContain(">Model<")
    expect(bottomBarSource).toContain('aria-label="Change thinking level"')
    expect(bottomBarSource).toContain('aria-label="Change verbosity"')
  })

  it("updates the same config fields as settings model controls", () => {
    expect(bottomBarSource).toContain("agentProviderId")
    expect(bottomBarSource).toContain("buildAgentModelConfigUpdates")
    expect(bottomBarSource).toContain("DEFAULT_MODEL_PRESET_ID")
    expect(bottomBarSource).toContain("useAvailableModelsQuery")
    expect(bottomBarSource).toContain("openaiReasoningEffort")
    expect(bottomBarSource).toContain("codexTextVerbosity")
  })
})
