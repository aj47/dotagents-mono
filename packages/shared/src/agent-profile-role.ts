export const PREFERRED_AGENT_PROFILE_ROLES = [
  'chat-agent',
  'delegation-target',
  'external-agent',
] as const;

export type PreferredAgentProfileRole = typeof PREFERRED_AGENT_PROFILE_ROLES[number];

export const LEGACY_AGENT_PROFILE_ROLES = [
  'user-profile',
] as const;

export type LegacyAgentProfileRole = typeof LEGACY_AGENT_PROFILE_ROLES[number];

export const AGENT_PROFILE_ROLES = [
  ...PREFERRED_AGENT_PROFILE_ROLES,
  ...LEGACY_AGENT_PROFILE_ROLES,
] as const;

export type AgentProfileRole = typeof AGENT_PROFILE_ROLES[number];

export function isAgentProfileRole(role: unknown): role is AgentProfileRole {
  return typeof role === 'string' && AGENT_PROFILE_ROLES.includes(role as AgentProfileRole);
}

export function normalizeAgentProfileRole(
  role: AgentProfileRole | string | undefined,
): PreferredAgentProfileRole | undefined {
  if (!role) return undefined;
  if (role === 'user-profile') return 'chat-agent';
  return PREFERRED_AGENT_PROFILE_ROLES.includes(role as PreferredAgentProfileRole)
    ? (role as PreferredAgentProfileRole)
    : undefined;
}
