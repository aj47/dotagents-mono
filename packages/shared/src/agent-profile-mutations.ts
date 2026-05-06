export type AgentProfileCreateInputLike = {
  name?: string
  displayName: string
}

export type CreatedAgentProfileLike<TInput extends AgentProfileCreateInputLike> = TInput & {
  id: string
  name: string
  createdAt: number
  updatedAt: number
}

export type AgentProfileUpdateTargetLike = {
  isBuiltIn?: boolean
}

export type AgentProfileProtectedUpdateFields = {
  id?: unknown
  createdAt?: unknown
  isBuiltIn?: unknown
}

export type AgentProfileDisplayNameUpdate = {
  displayName?: string
  name?: string
}

export type AgentProfileProperties = Record<string, string>

export const DEFAULT_AGENT_PROFILE_ENABLED = true
export const DEFAULT_AGENT_PROFILE_AUTO_SPAWN = false
export const MAX_AGENT_PROFILE_AVATAR_FILE_SIZE_BYTES = 2 * 1024 * 1024

export function createAgentProfileRecord<TInput extends AgentProfileCreateInputLike>(
  profile: TInput,
  id: string,
  now: number = Date.now(),
): CreatedAgentProfileLike<TInput> {
  return {
    ...profile,
    name: profile.name || profile.displayName,
    id,
    createdAt: now,
    updatedAt: now,
  }
}

export function buildAgentProfileUpdatePatch<
  TProfile extends AgentProfileUpdateTargetLike,
  TUpdates extends AgentProfileProtectedUpdateFields & AgentProfileDisplayNameUpdate & Record<string, unknown>,
>(
  profile: TProfile,
  updates: TUpdates,
  now: number = Date.now(),
): Omit<TUpdates, keyof AgentProfileProtectedUpdateFields> & { updatedAt: number } {
  const { id: _id, createdAt: _createdAt, isBuiltIn: _isBuiltIn, ...allowedUpdates } = updates
  const patch = allowedUpdates as AgentProfileDisplayNameUpdate & Record<string, unknown>

  if (patch.displayName && !profile.isBuiltIn) {
    patch.name = patch.displayName
  }

  return {
    ...patch,
    updatedAt: now,
  } as Omit<TUpdates, keyof AgentProfileProtectedUpdateFields> & { updatedAt: number }
}

export function canDeleteAgentProfile(profile: AgentProfileUpdateTargetLike | undefined | null): boolean {
  return Boolean(profile && !profile.isBuiltIn)
}

export function getDeletableAgentProfileIndex<TProfile extends AgentProfileUpdateTargetLike & { id: string }>(
  profiles: TProfile[],
  id: string,
): number {
  const index = profiles.findIndex((profile) => profile.id === id)
  if (index === -1) return -1
  return canDeleteAgentProfile(profiles[index]) ? index : -1
}

export function canSetCurrentAgentProfile<TProfile extends { id: string }>(
  profiles: TProfile[],
  id: string,
): boolean {
  return profiles.some((profile) => profile.id === id)
}

export function normalizeAgentProfileProperties(
  value: Record<string, unknown> | null | undefined,
): AgentProfileProperties {
  if (!value) return {}

  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
  )
}

export function formatAgentProfilePropertiesForRequest(
  properties: Record<string, string> | null | undefined,
): AgentProfileProperties | undefined {
  if (!properties) return undefined

  const entries = Object.entries(properties)
    .map(([key, value]) => [key.trim(), value] as const)
    .filter(([key]) => key.length > 0)

  return entries.length > 0 ? Object.fromEntries(entries) : undefined
}

export function getApproxAgentProfileAvatarBase64Bytes(base64: string): number {
  const normalized = base64.replace(/\s+/g, "")
  const padding = normalized.endsWith("==") ? 2 : normalized.endsWith("=") ? 1 : 0
  return Math.max(0, Math.floor((normalized.length * 3) / 4) - padding)
}

export function getAgentProfileAvatarFileSizeError(
  fileSizeBytes: number,
  maxFileSizeBytes: number = MAX_AGENT_PROFILE_AVATAR_FILE_SIZE_BYTES,
): string | undefined {
  return fileSizeBytes > maxFileSizeBytes ? "Choose a photo under 2 MB." : undefined
}

export function buildAgentProfileAvatarDataUrl(
  base64: string,
  mimeType: string | undefined,
): string {
  return `data:${mimeType || "image/jpeg"};base64,${base64}`
}
