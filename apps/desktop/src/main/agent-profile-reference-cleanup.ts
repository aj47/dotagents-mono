import type { AgentsLayerPaths } from "./agents-files/modular-config"

export type ReferenceCleanupSummary = {
  updatedProfileIds: string[]
  removedReferenceCount: number
}

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b))
}

export function cleanupInvalidReferenceValuesInProfiles<TProfile extends { id: string }>(
  profiles: TProfile[],
  validValues: Iterable<string>,
  now: number,
  getValues: (profile: TProfile) => string[],
  setValues: (profile: TProfile, values: string[], now: number) => TProfile,
): { profiles: TProfile[] } & ReferenceCleanupSummary {
  const validValueSet = new Set(Array.from(validValues))
  const updatedProfileIds: string[] = []
  let removedReferenceCount = 0

  const nextProfiles = profiles.map((profile) => {
    const currentValues = getValues(profile)
    if (currentValues.length === 0) return profile

    const nextValues = currentValues.filter((value) => validValueSet.has(value))
    if (nextValues.length === currentValues.length) return profile

    removedReferenceCount += currentValues.length - nextValues.length
    updatedProfileIds.push(profile.id)

    return setValues(profile, nextValues, now)
  })

  return {
    profiles: nextProfiles,
    updatedProfileIds: uniqueSorted(updatedProfileIds),
    removedReferenceCount,
  }
}

type LoadedProfiles<TProfile extends { id: string }> = {
  profiles: TProfile[]
}

export function cleanupInvalidReferenceValuesInLayers<TProfile extends { id: string }>(
  layers: AgentsLayerPaths[],
  validValues: Iterable<string>,
  now: number,
  loadLayer: (layer: AgentsLayerPaths) => LoadedProfiles<TProfile>,
  writeProfile: (layer: AgentsLayerPaths, profile: TProfile) => void,
  cleanupProfiles: (
    profiles: TProfile[],
    validValues: Iterable<string>,
    now: number,
  ) => { profiles: TProfile[] } & ReferenceCleanupSummary,
): ReferenceCleanupSummary {
  const combinedUpdatedProfileIds: string[] = []
  let removedReferenceCount = 0

  for (const layer of layers) {
    const loaded = loadLayer(layer)
    const result = cleanupProfiles(loaded.profiles, validValues, now)

    if (result.updatedProfileIds.length === 0) continue

    const updatedProfilesById = new Map(result.profiles.map((profile) => [profile.id, profile]))
    for (const profileId of result.updatedProfileIds) {
      const profile = updatedProfilesById.get(profileId)
      if (!profile) continue
      writeProfile(layer, profile)
    }

    combinedUpdatedProfileIds.push(...result.updatedProfileIds)
    removedReferenceCount += result.removedReferenceCount
  }

  return {
    updatedProfileIds: uniqueSorted(combinedUpdatedProfileIds),
    removedReferenceCount,
  }
}
