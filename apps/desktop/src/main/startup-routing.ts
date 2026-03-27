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

export function buildHubBundleInstallUrl(filePath: string): string {
  return `/settings/agents?installBundle=${encodeURIComponent(filePath)}`
}

function shouldShowOnboarding(config: OnboardingConfig): boolean {
  const hasCustomPresets = !!config.modelPresets?.length
  const hasSelectedPreset = config.currentModelPresetId !== undefined
  return !config.onboardingCompleted && !hasCustomPresets && !hasSelectedPreset
}

export function resolveStartupMainWindowDecision(
  config: OnboardingConfig,
  pendingHubBundleHandoffPath?: string | null,
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
      url: buildHubBundleInstallUrl(pendingHubBundleHandoffPath),
      consumedPendingHubBundle: true,
      reason: "hub-install",
    }
  }

  return {
    consumedPendingHubBundle: false,
    reason: "default",
  }
}
