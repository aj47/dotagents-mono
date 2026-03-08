import type { Config } from "../shared/types"

type OnboardingConfig = Pick<
  Config,
  "onboardingCompleted" | "modelPresets" | "currentModelPresetId"
>

export type StartupMainWindowDecision = {
  url?: string
  consumedPendingHubBundle: boolean
  reason: "default" | "hub-install" | "onboarding"
}

export function buildHubBundleInstallUrl(
  filePath: string,
  sourceBundleUrl?: string | null,
): string {
  const params = new URLSearchParams({ installBundle: filePath })
  if (sourceBundleUrl) {
    params.set("installBundleSource", sourceBundleUrl)
  }
  return `/settings/agents?${params.toString()}`
}

export function shouldShowOnboarding(config: OnboardingConfig): boolean {
  const hasCustomPresets = !!config.modelPresets?.length
  const hasSelectedPreset = config.currentModelPresetId !== undefined
  return !config.onboardingCompleted && !hasCustomPresets && !hasSelectedPreset
}

export function resolveStartupMainWindowDecision(
  config: OnboardingConfig,
  pendingHubBundleHandoffPath?: string | null,
  pendingHubBundleSourceUrl?: string | null,
): StartupMainWindowDecision {
  if (shouldShowOnboarding(config)) {
    return {
      url: "/onboarding",
      consumedPendingHubBundle: false,
      reason: "onboarding",
    }
  }

  if (pendingHubBundleHandoffPath) {
    return {
      url: buildHubBundleInstallUrl(pendingHubBundleHandoffPath, pendingHubBundleSourceUrl),
      consumedPendingHubBundle: true,
      reason: "hub-install",
    }
  }

  return {
    consumedPendingHubBundle: false,
    reason: "default",
  }
}