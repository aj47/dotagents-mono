export type ConnectionType = 'internal' | 'acp' | 'stdio' | 'remote';

export interface AgentConnectionFormFields {
  connectionType: ConnectionType;
  connectionCommand: string;
  connectionArgs: string;
  connectionBaseUrl: string;
  connectionCwd: string;
}

export interface AgentConnectionRequestFields {
  connectionType: ConnectionType;
  connectionCommand?: string;
  connectionArgs?: string;
  connectionBaseUrl?: string;
  connectionCwd?: string;
}

function trimField(value: string): string {
  return value.trim();
}

export function applyConnectionTypeChange<T extends AgentConnectionFormFields>(formData: T, nextConnectionType: ConnectionType): T {
  if (formData.connectionType === nextConnectionType) {
    return formData;
  }

  return {
    ...formData,
    connectionType: nextConnectionType,
    connectionBaseUrl: '',
  };
}

export function buildAgentConnectionRequestFields(formData: AgentConnectionFormFields): AgentConnectionRequestFields {
  if (formData.connectionType === 'remote') {
    return {
      connectionType: 'remote',
      connectionBaseUrl: trimField(formData.connectionBaseUrl),
    };
  }

  if (formData.connectionType === 'acp' || formData.connectionType === 'stdio') {
    return {
      connectionType: formData.connectionType,
      connectionCommand: trimField(formData.connectionCommand),
      connectionArgs: trimField(formData.connectionArgs),
      connectionCwd: trimField(formData.connectionCwd),
    };
  }

  return { connectionType: 'internal' };
}