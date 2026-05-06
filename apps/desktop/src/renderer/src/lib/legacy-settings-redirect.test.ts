import { describe, expect, it } from "vitest"

import { getLegacySettingsRedirectPath } from "@dotagents/shared/legacy-settings-redirect"

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
})
