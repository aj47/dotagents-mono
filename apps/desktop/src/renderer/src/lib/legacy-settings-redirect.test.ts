import { describe, expect, it } from "vitest"

import { getLegacySettingsRedirectPath } from "./legacy-settings-redirect"

describe("getLegacySettingsRedirectPath", () => {
  it("preserves query params and hashes from legacy settings links", () => {
    expect(
      getLegacySettingsRedirectPath(
        "/settings/agents",
        "http://localhost/settings/agent-personas?tab=custom#install-bundle",
      ),
    ).toBe("/settings/agents?tab=custom#install-bundle")
  })

  it("keeps bare redirects clean when there is no extra route context", () => {
    expect(
      getLegacySettingsRedirectPath(
        "/settings/capabilities",
        "http://localhost/settings/mcp-tools",
      ),
    ).toBe("/settings/capabilities")
  })

  it("preserves hashes even when there is no query string", () => {
    expect(
      getLegacySettingsRedirectPath(
        "/settings/repeat-tasks",
        "http://localhost/settings/loops#scheduled",
      ),
    ).toBe("/settings/repeat-tasks#scheduled")
  })

  it("can preserve context when moving knowledge under settings", () => {
    expect(
      getLegacySettingsRedirectPath(
        "/settings/knowledge",
        "http://localhost/knowledge?context=auto#notes",
      ),
    ).toBe("/settings/knowledge?context=auto#notes")
  })

  it("places preserved query params before target hashes", () => {
    expect(
      getLegacySettingsRedirectPath(
        "/settings/models#provider-setup",
        "http://localhost/settings/providers?provider=groq",
      ),
    ).toBe("/settings/models?provider=groq#provider-setup")
  })

  it("lets source hashes override target hashes", () => {
    expect(
      getLegacySettingsRedirectPath(
        "/settings/models#provider-setup",
        "http://localhost/settings/providers#groq",
      ),
    ).toBe("/settings/models#groq")
  })
})
