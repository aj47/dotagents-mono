import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const tipcSource = readFileSync(new URL("./tipc.ts", import.meta.url), "utf8")
const configSource = readFileSync(new URL("./config.ts", import.meta.url), "utf8")
const pastSessionsDialogSource = readFileSync(
  new URL("../renderer/src/components/past-sessions-dialog.tsx", import.meta.url),
  "utf8",
)

describe("conversation history folder affordances", () => {
  it("stores desktop conversation history under the dedicated conversations app-data folder", () => {
    expect(configSource).toContain('export const conversationsFolder = path.join(dataFolder, "conversations")')
  })

  it("exposes a TIPC action to open the on-disk conversation history folder", () => {
    expect(tipcSource).toContain("openConversationHistoryFolder: t.procedure.action(async () => {")
    expect(tipcSource).toContain("fs.mkdirSync(conversationsFolder, { recursive: true })")
    expect(tipcSource).toContain("const error = await shell.openPath(conversationsFolder)")
  })

  it("surfaces the history-folder action from the past sessions dialog", () => {
    expect(pastSessionsDialogSource).toContain("tipcClient.openConversationHistoryFolder()")
    expect(pastSessionsDialogSource).toContain("Open History Folder")
  })
})