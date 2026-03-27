import { describe, expect, it } from "vitest"
import {
  buildHubBundleInstallUrl,
  resolveStartupMainWindowDecision,
} from "./startup-routing"

describe("startup routing", () => {
  it("shows onboarding for fresh installs without model configuration", () => {
    expect(resolveStartupMainWindowDecision({})).toEqual({
      url: "/onboarding",
      consumedPendingHubBundle: false,
      reason: "onboarding",
    })
  })

  it("skips onboarding for users who already completed it", () => {
    expect(resolveStartupMainWindowDecision({ onboardingCompleted: true })).toEqual({
      consumedPendingHubBundle: false,
      reason: "default",
    })
  })

  it("skips onboarding for pre-onboarding installs with saved model presets", () => {
    expect(resolveStartupMainWindowDecision({
      modelPresets: [{
        id: "preset-1",
        name: "Starter",
        baseUrl: "https://api.example.com",
        apiKey: "test-key",
      }],
    })).toEqual({
      consumedPendingHubBundle: false,
      reason: "default",
    })
  })

  it("skips onboarding for pre-onboarding installs with a selected preset", () => {
    expect(resolveStartupMainWindowDecision({ currentModelPresetId: "preset-1" })).toEqual({
      consumedPendingHubBundle: false,
      reason: "default",
    })
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
      ),
    ).toEqual({
      url: buildHubBundleInstallUrl("/tmp/featured-agent.dotagents"),
      consumedPendingHubBundle: true,
      reason: "hub-install",
    })
  })
})
