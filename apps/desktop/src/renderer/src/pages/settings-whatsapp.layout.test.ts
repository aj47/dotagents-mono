import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const settingsWhatsAppSource = readFileSync(
  new URL("./settings-whatsapp.tsx", import.meta.url),
  "utf8",
)

describe("settings whatsapp page layout", () => {
  it("stacks WhatsApp settings helper and status copy beneath their controls", () => {
    expect(settingsWhatsAppSource).toContain(
      'className="px-3 [&>div:first-child]:sm:max-w-[30%] [&>div:last-child]:sm:max-w-[70%]"',
    )
    expect(settingsWhatsAppSource).toContain(
      'className="flex w-full min-w-0 flex-col items-start gap-1.5 text-left sm:max-w-[360px]"',
    )
    const toggleStackMatches = settingsWhatsAppSource.match(
      /className="flex w-full min-w-0 flex-col items-start gap-1 sm:max-w-\[360px\]"/g,
    )
    const toggleRowMatches = settingsWhatsAppSource.match(
      /className="flex w-full items-center justify-start sm:justify-end"/g,
    )

    expect(toggleStackMatches).toHaveLength(2)
    expect(toggleRowMatches).toHaveLength(2)
    expect(settingsWhatsAppSource).toContain(
      'className="text-xs text-muted-foreground break-words [overflow-wrap:anywhere]"',
    )
    expect(settingsWhatsAppSource).toContain(
      'className="text-xs text-amber-600 dark:text-amber-400 break-words [overflow-wrap:anywhere]"',
    )
    expect(settingsWhatsAppSource).toContain(
      'className="text-xs text-green-600 dark:text-green-400 break-words [overflow-wrap:anywhere]"',
    )
  })

  it("keeps the connection QR and action area responsive in a narrow settings column", () => {
    expect(settingsWhatsAppSource).toContain(
      'const WHATSAPP_CONNECTION_ACTIONS_CLASS_NAME = "flex flex-col gap-2 sm:flex-row sm:flex-wrap"',
    )
    expect(settingsWhatsAppSource).toContain(
      'const WHATSAPP_CONNECTION_ACTION_BUTTON_CLASS_NAME = "w-full justify-center sm:w-auto"',
    )
    expect(settingsWhatsAppSource).toContain(
      'const WHATSAPP_QR_FRAME_CLASS_NAME = "w-full max-w-[288px] rounded-lg bg-white p-4 shadow-md"',
    )
    expect(settingsWhatsAppSource).toContain(
      'const WHATSAPP_QR_PLACEHOLDER_CLASS_NAME = "flex aspect-square w-full max-w-[288px] flex-col items-center justify-center rounded-lg bg-muted/50 p-4 shadow-md"',
    )
    expect(settingsWhatsAppSource).toContain('className={WHATSAPP_QR_PLACEHOLDER_CLASS_NAME}')
    expect(settingsWhatsAppSource).toContain('className={WHATSAPP_QR_FRAME_CLASS_NAME}')
    expect(settingsWhatsAppSource).toContain('className={WHATSAPP_CONNECTION_ACTIONS_CLASS_NAME}')
    const actionButtonMatches = settingsWhatsAppSource.match(
      /className=\{WHATSAPP_CONNECTION_ACTION_BUTTON_CLASS_NAME(?: \+ \" text-red-600\")?\}/g,
    )

    expect(actionButtonMatches).toHaveLength(4)
    expect(settingsWhatsAppSource).toContain('className="h-auto w-full max-w-full"')
  })

  it("renders connection status and fetch errors as wrap-safe status banners", () => {
    expect(settingsWhatsAppSource).toContain(
      'const WHATSAPP_STATUS_BANNER_BASE_CLASS_NAME = "mb-4 flex items-start gap-2 rounded-md border p-3"',
    )
    expect(settingsWhatsAppSource).toContain(
      'const WHATSAPP_STATUS_TEXT_CLASS_NAME = "min-w-0 flex-1 text-sm leading-snug break-words [overflow-wrap:anywhere]"',
    )
    expect(settingsWhatsAppSource).toContain(
      'const WHATSAPP_STATUS_ERROR_CLASS_NAME = "mb-4 rounded-md border border-red-500/20 bg-red-500/10 p-3 text-sm leading-snug text-red-600 break-words [overflow-wrap:anywhere] dark:text-red-400"',
    )
    const statusBannerMatches = settingsWhatsAppSource.match(
      /className=\{`\$\{WHATSAPP_STATUS_BANNER_BASE_CLASS_NAME\} [^`]+`\}\n\s+role="status"/g,
    )
    const statusTextMatches = settingsWhatsAppSource.match(
      /className=\{`\$\{WHATSAPP_STATUS_TEXT_CLASS_NAME\} [^`]+`\}/g,
    )

    expect(statusBannerMatches).toHaveLength(3)
    expect(statusTextMatches).toHaveLength(3)
    expect(settingsWhatsAppSource).toContain('className={WHATSAPP_STATUS_ERROR_CLASS_NAME}')
    expect(settingsWhatsAppSource).toContain('role="alert"')
    expect(settingsWhatsAppSource).not.toContain('className="flex items-center gap-2 mb-4"')
  })
})
