import { describe, expect, it } from "vitest"

import { getLegacySettingsRedirectPath } from "./legacy-settings-redirect"

describe("getLegacySettingsRedirectPath", () => {
  it("preserves query params and hashes from legacy settings links", () => {
    expect(
      getLegacySettingsRedirectPath(
        "/settings/agents",
        "http://localhost/settings/agent-personas?tab=custom#install-bundle"
      )
    ).toBe("/settings/agents?tab=custom#install-bundle")
  })

  it("keeps bare redirects clean when there is no extra route context", () => {
    expect(
      getLegacySettingsRedirectPath(
        "/settings/capabilities",
        "http://localhost/settings/mcp-tools"
      )
    ).toBe("/settings/capabilities")
  })

  it("preserves hashes even when there is no query string", () => {
    expect(
      getLegacySettingsRedirectPath(
        "/settings/repeat-tasks",
        "http://localhost/settings/loops#scheduled"
      )
    ).toBe("/settings/repeat-tasks#scheduled")
  })

  it("adds a default capabilities tab when redirecting a legacy sub-route", () => {
    expect(
      getLegacySettingsRedirectPath(
        "/settings/capabilities",
        "http://localhost/settings/mcp-tools",
        { tab: "mcp-servers" }
      )
    ).toBe("/settings/capabilities?tab=mcp-servers")
  })

  it("preserves an explicit tab query param instead of overwriting it", () => {
    expect(
      getLegacySettingsRedirectPath(
        "/settings/capabilities",
        "http://localhost/settings/mcp-tools?tab=skills#focus",
        { tab: "mcp-servers" }
      )
    ).toBe("/settings/capabilities?tab=skills#focus")
  })
})