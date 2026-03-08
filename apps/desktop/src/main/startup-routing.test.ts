import { describe, expect, it } from "vitest"
import {
  buildHubBundleInstallUrl,
  resolveStartupMainWindowDecision,
  shouldShowOnboarding,
} from "./startup-routing"

describe("startup routing", () => {
  it("preserves Hub bundle source provenance in install routes", () => {
    expect(
      buildHubBundleInstallUrl(
        "/tmp/featured-agent.dotagents",
        "https://hub.dotagentsprotocol.com/bundles/featured-agent.dotagents",
      ),
    ).toBe(
      `/settings/agents?installBundle=${encodeURIComponent("/tmp/featured-agent.dotagents")}&installBundleSource=${encodeURIComponent("https://hub.dotagentsprotocol.com/bundles/featured-agent.dotagents")}`,
    )
  })

  it("shows onboarding for fresh installs without model configuration", () => {
    expect(shouldShowOnboarding({})).toBe(true)
  })

  it("skips onboarding for users who already completed it", () => {
    expect(shouldShowOnboarding({ onboardingCompleted: true })).toBe(false)
  })

  it("skips onboarding for pre-onboarding installs with saved model presets", () => {
    expect(shouldShowOnboarding({
      modelPresets: [{
        id: "preset-1",
        name: "Starter",
        baseUrl: "https://api.example.com",
        apiKey: "test-key",
      }],
    })).toBe(false)
  })

  it("skips onboarding for pre-onboarding installs with a selected preset", () => {
    expect(shouldShowOnboarding({ currentModelPresetId: "preset-1" })).toBe(false)
  })

  it("keeps onboarding higher priority than queued Hub installs", () => {
    expect(
      resolveStartupMainWindowDecision({}, "/tmp/featured-agent.dotagents"),
    ).toEqual({
      url: "/onboarding",
      consumedPendingHubBundle: false,
      reason: "onboarding",
    })
  })

  it("opens queued Hub installs after onboarding is no longer needed", () => {
    expect(
      resolveStartupMainWindowDecision(
        { onboardingCompleted: true },
        "/tmp/featured-agent.dotagents",
        "https://hub.dotagentsprotocol.com/bundles/featured-agent.dotagents",
      ),
    ).toEqual({
      url: buildHubBundleInstallUrl(
        "/tmp/featured-agent.dotagents",
        "https://hub.dotagentsprotocol.com/bundles/featured-agent.dotagents",
      ),
      consumedPendingHubBundle: true,
      reason: "hub-install",
    })
  })
})