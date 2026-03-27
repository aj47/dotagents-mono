import { beforeEach, describe, expect, it, vi } from "vitest"

const FEEDBACK_URL = "https://github.com/aj47/dotagents-mono/issues/new"

const { buildFromTemplate, openExternal } = vi.hoisted(() => ({
  buildFromTemplate: vi.fn((template) => template),
  openExternal: vi.fn(),
}))

vi.mock("electron", () => ({
  Menu: {
    buildFromTemplate,
  },
  shell: {
    openExternal,
  },
}))

import { createAppMenu } from "./menu"

describe("app menu", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.IS_MAC = false
  })

  it("opens Send Feedback in the current repository issue form", () => {
    const menu = createAppMenu() as unknown as Array<{
      label?: string
      role?: string
      submenu?: Array<{ label?: string; role?: string; click?: () => void }>
    }>
    const fileMenu = menu.find((item) => item.label === "File")
    const helpMenu = menu.find((item) => item.role === "help")
    const sendFeedbackItem = helpMenu?.submenu?.find((item) => item.label === "Send Feedback")

    expect(FEEDBACK_URL).toBe("https://github.com/aj47/dotagents-mono/issues/new")
    expect(menu[0]?.label).toBe("File")
    expect(fileMenu?.submenu?.[0]?.role).toBe("quit")
    expect(sendFeedbackItem).toBeDefined()

    sendFeedbackItem?.click?.()

    expect(buildFromTemplate).toHaveBeenCalledOnce()
    expect(openExternal).toHaveBeenCalledWith(FEEDBACK_URL)
  })
})
