import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const controlSource = fs.readFileSync(
  path.join(process.cwd(), "apps", "desktop", "src", "renderer", "src", "components", "ui", "control.tsx"),
  "utf8",
)

const settingsGeneralSource = fs.readFileSync(
  path.join(process.cwd(), "apps", "desktop", "src", "renderer", "src", "pages", "settings-general.tsx"),
  "utf8",
)

test("keeps shared settings rows split into label and control columns", () => {
  assert.match(
    controlSource,
    /<div className="min-w-0 sm:max-w-\[52%\]">[\s\S]*?<div className="flex w-full min-w-0 items-center justify-start sm:max-w-\[48%\] sm:justify-end">/,
  )
})

test("opens shared helper tooltips above the label instead of into the control column", () => {
  assert.match(
    controlSource,
    /<TooltipContent[\s\S]*?side="top"[\s\S]*?align="start"[\s\S]*?collisionPadding=\{20\}[\s\S]*?avoidCollisions=\{true\}[\s\S]*?sideOffset=\{6\}/,
  )
})

test("uses the shared tooltip label pattern in a concrete dense desktop settings row", () => {
  assert.match(
    settingsGeneralSource,
    /<Control label=\{<ControlLabel label="Main Agent Mode" tooltip="Choose how the main agent processes your requests\.[\s\S]*?" \/>\} className="px-3">[\s\S]*?<SelectTrigger className="w-full sm:w-\[200px\]">/,
  )
})