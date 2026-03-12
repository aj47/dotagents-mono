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
    expect(discordSource).toContain("new URL(\"/v1/operator/\", `http://127.0.0.1:${port}`)")
    expect(discordSource).toContain("Authorization: `Bearer ${apiKey}`")
    expect(discordSource).toContain('path: "actions/restart-remote-server"')
    expect(discordSource).toContain('path: "actions/restart-app"')

    expect(
      discordSource.indexOf("await this.maybeHandleOperatorCommand(message, prompt)"),
    ).toBeLessThan(
      discordSource.indexOf("const profileId = getDiscordResolvedDefaultProfileId(cfg).profileId"),
    )
  })

  it("intercepts WhatsApp /ops commands before queueing and derives the operator API from callbackUrl", () => {
    expect(whatsappSource).toContain("/^\\/ops(?:\\s|$)/i")
    expect(whatsappSource).toContain("await maybeHandleWhatsAppOperatorCommand(message)")
    expect(whatsappSource).toContain('new URL("/v1/operator/", config.callbackUrl)')
    expect(whatsappSource).toContain("Authorization: `Bearer ${config.callbackApiKey}`")
    expect(whatsappSource).toContain("OPERATOR_DETAIL_REDACTION_PATTERN = /(api.?key|token|secret|qr)/i")
    expect(whatsappSource).toContain("WhatsApp needs authentication in the desktop app")

    expect(
      whatsappSource.indexOf("await maybeHandleWhatsAppOperatorCommand(message)"),
    ).toBeLessThan(whatsappSource.indexOf("queueMessage(message)"))
  })
})