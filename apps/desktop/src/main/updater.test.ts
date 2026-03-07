import { beforeEach, describe, expect, it, vi } from "vitest"

const { showMessageBox } = vi.hoisted(() => ({
  showMessageBox: vi.fn(),
}))

vi.mock("electron", () => ({
  dialog: {
    showMessageBox,
  },
}))

import { MANUAL_RELEASES_URL, checkForUpdatesMenuItem } from "./updater"

describe("disabled updater", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    showMessageBox.mockResolvedValue({ response: 0 })
  })

  it("sends manual update checks to the current GitHub releases page", async () => {
    await checkForUpdatesMenuItem({} as never)

    expect(MANUAL_RELEASES_URL).toBe("https://github.com/aj47/dotagents-mono/releases")
    expect(showMessageBox).toHaveBeenCalledWith({
      type: "info",
      title: "Check for Updates",
      message: "Updates are currently manual.",
      detail: `To check for updates, please visit:\n${MANUAL_RELEASES_URL}`,
      buttons: ["OK"],
      defaultId: 0,
      cancelId: 0,
      noLink: true,
    })
  })
})