import type { AgentProfile, Profile, Settings } from '../lib/settingsApi';
import { getAcpxMainAgentOptions, toMainAgentProfile } from '../lib/mainAgentOptions';

export interface SelectableProfile extends Profile {
  description?: string;
  selectorMode: 'profile' | 'acpx';
  selectionValue: string;
}

export function toSelectableAgentProfile(profile: AgentProfile): SelectableProfile {
  const summary = profile.description || profile.guidelines || '';

  return {
    id: profile.id,
    name: profile.displayName || profile.name,
    guidelines: summary,
    description: summary,
    selectorMode: 'profile',
    selectionValue: profile.id,
  };
}

export function buildSelectorProfiles(
  settings?: Settings | null,
  agentProfiles: AgentProfile[] = []
): { selectorMode: 'profile' | 'acpx'; profiles: SelectableProfile[] } {
  const enabledAgentProfiles = agentProfiles.filter((profile) => profile.enabled !== false);

  if (settings?.mainAgentMode === 'acpx') {
    return {
      selectorMode: 'acpx',
      profiles: getAcpxMainAgentOptions(settings, enabledAgentProfiles).map((option) => ({
        ...toMainAgentProfile(option),
        selectorMode: 'acpx',
        selectionValue: option.name,
      })),
    };
  }

  return {
    selectorMode: 'profile',
    profiles: enabledAgentProfiles.map(toSelectableAgentProfile),
  };
}