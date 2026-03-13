import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const discordSource = readFileSync(new URL("./discord-service.ts", import.meta.url), "utf8")
const whatsappSource = readFileSync(
  new URL("../../../../packages/mcp-whatsapp/src/index.ts", import.meta.url),
  "utf8",
)

describe("channel-native operator commands", () => {
  it("intercepts Discord /ops commands before normal agent routing and uses the local operator API", () => {
    expect(discordSource).toContain("/^\\/ops(?:\\s|$)/i")
    expect(discordSource).toContain("await this.maybeHandleOperatorCommand(message, prompt)")
    expect(discordSource).toContain("getDiscordOperatorAccessRejectionReason")
    expect(discordSource).toContain("discordOperatorAllowUserIds")
    expect(discordSource).toContain("Operator access denied for this Discord user/channel")
    expect(discordSource).toContain("new URL(\"/v1/operator/\", `http://127.0.0.1:${port}`)")
    expect(discordSource).toContain("Authorization: `Bearer ${apiKey}`")
    expect(discordSource).toContain('path: "updater/check"')
    expect(discordSource).toContain('path: "updater/download-latest"')
    expect(discordSource).toContain('path: "updater/reveal-download"')
    expect(discordSource).toContain('path: "updater/open-download"')
    expect(discordSource).toContain('path: "updater/open-releases"')
    expect(discordSource).toContain('path: "actions/restart-remote-server"')
    expect(discordSource).toContain('path: "actions/restart-app"')
    // System, sessions, and conversations commands
    expect(discordSource).toContain('key: "system"')
    expect(discordSource).toContain('key: "sessions"')
    expect(discordSource).toContain('key: "conversations"')
    expect(discordSource).toContain('key: "run-agent"')
    expect(discordSource).toContain("formatOperatorDuration")
    // Body support for POST commands
    expect(discordSource).toContain("command.body")
    expect(discordSource).toContain("Content-Type")

    expect(
      discordSource.indexOf("await this.maybeHandleOperatorCommand(message, prompt)"),
    ).toBeLessThan(
      discordSource.indexOf("const profileId = getDiscordResolvedDefaultProfileId(cfg).profileId"),
    )
  })

  it("intercepts WhatsApp /ops commands before queueing and derives the operator API from callbackUrl", () => {
    expect(whatsappSource).toContain("/^\\/ops(?:\\s|$)/i")
    expect(whatsappSource).toContain("await maybeHandleWhatsAppOperatorCommand(message)")
    expect(whatsappSource).toContain("WHATSAPP_OPERATOR_ALLOW_FROM")
    expect(whatsappSource).toContain("Operator access denied for this WhatsApp sender/chat")
    expect(whatsappSource).toContain('new URL("/v1/operator/", config.callbackUrl)')
    expect(whatsappSource).toContain("Authorization: `Bearer ${config.callbackApiKey}`")
    expect(whatsappSource).toContain('path: "updater/check"')
    expect(whatsappSource).toContain('path: "updater/download-latest"')
    expect(whatsappSource).toContain('path: "updater/reveal-download"')
    expect(whatsappSource).toContain('path: "updater/open-download"')
    expect(whatsappSource).toContain('path: "updater/open-releases"')
    expect(whatsappSource).toContain("OPERATOR_DETAIL_REDACTION_PATTERN = /(api.?key|token|secret|qr)/i")
    expect(whatsappSource).toContain("WhatsApp needs authentication in the desktop app")
    // System, sessions, and conversations commands
    expect(whatsappSource).toContain('key: "system"')
    expect(whatsappSource).toContain('key: "sessions"')
    expect(whatsappSource).toContain('key: "conversations"')
    expect(whatsappSource).toContain('key: "run-agent"')
    expect(whatsappSource).toContain("formatOperatorDuration")
    expect(whatsappSource).toContain("command.body")

    expect(
      whatsappSource.indexOf("await maybeHandleWhatsAppOperatorCommand(message)"),
    ).toBeLessThan(whatsappSource.indexOf("queueMessage(message)"))
  })
})