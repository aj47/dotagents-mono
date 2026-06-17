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
    expect(appLayoutSource).toContain("<AppBottomBar")
    expect(appLayoutSource).toContain("onOpenShortcutReference")
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
    expect(bottomBarSource).toContain('aria-label="Change Codex service tier"')
  })

  it("gives provider and model readable room while keeping Codex controls compact", () => {
    expect(bottomBarSource).toContain("COMPACT_BAR_SELECT_CLASS")
    expect(bottomBarSource).toContain("min-w-[8.75rem] max-w-[13rem] flex-[1_1_10rem]")
    expect(bottomBarSource).toContain("min-w-[7rem] max-w-[17rem] flex-[1.4_1_12rem]")
    expect(bottomBarSource).toContain('className={cn(BAR_SELECT_CLASS, "w-full")}')
    expect(bottomBarSource).toContain('className={cn(COMPACT_BAR_SELECT_CLASS, "w-full")}')
    expect(bottomBarSource).toContain("w-[5.2rem]")
    expect(bottomBarSource).toContain("w-[4.8rem]")
    expect(bottomBarSource).toContain("w-[5.6rem]")
    expect(bottomBarSource).toContain('label: "Med", title: "Medium"')
    expect(bottomBarSource).toContain('label: "Std", title: "Standard"')
    expect(bottomBarSource).toContain("ml-auto flex shrink-0")
    expect(bottomBarSource).not.toContain("flex min-w-0 flex-1 items-center justify-center")
    expect(bottomBarSource).not.toContain("max-w-[125px]")
  })

  it("updates the same config fields as settings model controls", () => {
    expect(bottomBarSource).toContain("agentProviderId")
    expect(bottomBarSource).toContain("buildAgentModelConfigUpdates")
    expect(bottomBarSource).toContain("DEFAULT_MODEL_PRESET_ID")
    expect(bottomBarSource).toContain("useAvailableModelsQuery")
    expect(bottomBarSource).toContain("openaiReasoningEffort")
    expect(bottomBarSource).toContain("codexTextVerbosity")
    expect(bottomBarSource).toContain("codexServiceTier")
  })
})
