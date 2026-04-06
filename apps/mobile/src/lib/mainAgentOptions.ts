import type { AgentProfile, Profile, Settings } from './settingsApi';

export interface MainAgentOption {
  name: string;
  displayName: string;
}

export function getAcpxMainAgentOptions(
  settings?: Settings | null,
  agentProfiles: AgentProfile[] = []
): MainAgentOption[] {
  const seen = new Set<string>();
  const options: MainAgentOption[] = [];

  for (const profile of agentProfiles) {
    if (!profile.enabled) continue;
    if (profile.connectionType !== 'acpx') continue;
    const key = profile.name.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    options.push({ name: profile.name, displayName: profile.displayName || profile.name });
  }

  for (const agent of settings?.acpxAgents || []) {
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
    guidelines: 'acpx main agent',
  };
}