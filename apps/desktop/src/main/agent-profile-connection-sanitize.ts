export const VALID_AGENT_PROFILE_CONNECTION_TYPES = ['internal', 'acpx', 'acp', 'stdio', 'remote'] as const;

export type AgentProfileConnectionTypeValue = typeof VALID_AGENT_PROFILE_CONNECTION_TYPES[number];

export interface AgentProfileConnectionDraft {
  type: AgentProfileConnectionTypeValue;
  agent?: string;
  command?: string;
  args?: string[];
  baseUrl?: string;
  cwd?: string;
}

export interface AgentProfileConnectionInput {
  connectionType?: AgentProfileConnectionTypeValue;
  connectionAgent?: string;
  connectionCommand?: string;
  connectionArgs?: string;
  connectionBaseUrl?: string;
  connectionCwd?: string;
}

function normalizeText(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeArgs(value: string | string[] | undefined): string[] | undefined {
  if (Array.isArray(value)) {
    const trimmed = value.map(part => part.trim()).filter(Boolean);
    return trimmed.length > 0 ? trimmed : undefined;
  }

  const trimmed = normalizeText(value);
  return trimmed ? trimmed.split(/\s+/).filter(Boolean) : undefined;
}

export function sanitizeAgentProfileConnection(
  input: AgentProfileConnectionInput,
  existingConnection?: AgentProfileConnectionDraft,
): AgentProfileConnectionDraft {
  const connectionType = input.connectionType ?? existingConnection?.type ?? 'internal';
  const existingLocalConnection = existingConnection?.type === 'acpx'
    ? existingConnection
    : undefined;

  if (connectionType === 'remote') {
    const baseUrl = input.connectionBaseUrl !== undefined
      ? normalizeText(input.connectionBaseUrl)
      : existingConnection?.type === 'remote'
        ? normalizeText(existingConnection.baseUrl)
        : undefined;

    return {
      type: 'remote',
      ...(baseUrl ? { baseUrl } : {}),
    };
  }

  if (connectionType === 'acpx' || connectionType === 'acp' || connectionType === 'stdio') {
    const agent = input.connectionAgent !== undefined
      ? normalizeText(input.connectionAgent)
      : normalizeText(existingLocalConnection?.agent);
    const command = input.connectionCommand !== undefined
      ? normalizeText(input.connectionCommand)
      : normalizeText(existingLocalConnection?.command);
    const args = input.connectionArgs !== undefined
      ? normalizeArgs(input.connectionArgs)
      : normalizeArgs(existingLocalConnection?.args);
    const cwd = input.connectionCwd !== undefined
      ? normalizeText(input.connectionCwd)
      : normalizeText(existingLocalConnection?.cwd);

    return {
      type: 'acpx',
      ...(agent ? { agent } : {}),
      ...(command ? { command } : {}),
      ...(args ? { args } : {}),
      ...(cwd ? { cwd } : {}),
    };
  }

  return { type: 'internal' };
}