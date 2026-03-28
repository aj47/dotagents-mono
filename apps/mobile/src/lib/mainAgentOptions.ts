import { getAcpCapableAgentProfiles, getAgentProfileDisplayName } from '@dotagents/shared';
import type { AgentProfile, Profile, Settings } from './settingsApi';

export interface MainAgentOption {
  name: string;
  displayName: string;
}

export function getAcpMainAgentOptions(
  settings?: Settings | null,
  agentProfiles: AgentProfile[] = []
): MainAgentOption[] {
  const seen = new Set<string>();
  const options: MainAgentOption[] = [];

  for (const profile of getAcpCapableAgentProfiles(agentProfiles)) {
    const key = profile.name.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    options.push({ name: profile.name, displayName: getAgentProfileDisplayName(profile) });
  }

  for (const agent of settings?.acpAgents || []) {
    const key = agent.name.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    options.push({ name: agent.name, displayName: agent.displayName || agent.name });
  }

  return options;
}

export function toMainAgentProfile(option: MainAgentOption): Profile {
  return {
    id: `main-agent:${option.name}`,
    name: option.displayName,
    guidelines: 'ACP main agent',
  };
}
