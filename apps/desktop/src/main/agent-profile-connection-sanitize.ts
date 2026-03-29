export const VALID_AGENT_PROFILE_CONNECTION_TYPES = ['internal', 'acp', 'stdio', 'remote'] as const;

export type AgentProfileConnectionTypeValue = typeof VALID_AGENT_PROFILE_CONNECTION_TYPES[number];

export interface AgentProfileConnectionDraft {
  type: AgentProfileConnectionTypeValue;
  command?: string;
  args?: string[];
  baseUrl?: string;
  cwd?: string;
}

export interface AgentProfileConnectionInput {
  connectionType?: AgentProfileConnectionTypeValue;
  connectionCommand?: string;
  connectionArgs?: string;
  connectionBaseUrl?: string;
  connectionCwd?: string;
}

function isLocalConnectionType(connectionType: AgentProfileConnectionTypeValue | undefined): connectionType is 'acp' | 'stdio' {
  return connectionType === 'acp' || connectionType === 'stdio'
}

function resolveInputOrExisting<T>(inputValue: T | undefined, existingValue: T | undefined, normalize: (value: T) => T | undefined): T | undefined {
  if (inputValue !== undefined) {
    return normalize(inputValue)
  }
  if (existingValue === undefined) {
    return undefined
  }
  return normalize(existingValue)
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
  const existingLocalConnection = existingConnection && isLocalConnectionType(existingConnection.type)
    ? existingConnection
    : undefined;

  if (connectionType === 'remote') {
    const baseUrl = resolveInputOrExisting(
      input.connectionBaseUrl,
      existingConnection?.type === 'remote' ? existingConnection.baseUrl : undefined,
      normalizeText
    );

    return {
      type: 'remote',
      ...(baseUrl ? { baseUrl } : {}),
    };
  }

  if (connectionType === 'acp' || connectionType === 'stdio') {
    const command = resolveInputOrExisting(
      input.connectionCommand,
      existingLocalConnection?.command,
      normalizeText
    )
    const args = resolveInputOrExisting(
      input.connectionArgs,
      existingLocalConnection?.args,
      normalizeArgs
    )
    const cwd = resolveInputOrExisting(
      input.connectionCwd,
      existingLocalConnection?.cwd,
      normalizeText
    )

    return {
      type: connectionType,
      ...(command ? { command } : {}),
      ...(args ? { args } : {}),
      ...(cwd ? { cwd } : {}),
    };
  }

  return { type: 'internal' };
}
