export const VALID_AGENT_PROFILE_CONNECTION_TYPES = ["internal", "acpx", "acp", "stdio", "remote"] as const

export type AgentProfileConnectionTypeValue = typeof VALID_AGENT_PROFILE_CONNECTION_TYPES[number]
export type AgentEditConnectionType = "internal" | "acpx" | "remote"

export function isAgentProfileConnectionTypeValue(value: unknown): value is AgentProfileConnectionTypeValue {
  return typeof value === "string" && VALID_AGENT_PROFILE_CONNECTION_TYPES.includes(value as AgentProfileConnectionTypeValue)
}

export interface AgentEditConnectionTypeOption {
  label: string
  selectLabel: string
  value: AgentEditConnectionType
  description: string
}

export const AGENT_EDIT_CONNECTION_TYPE_OPTIONS = [
  {
    label: "Internal",
    selectLabel: "Internal (built-in agent)",
    value: "internal",
    description: "Uses the built-in DotAgents runtime with this profile’s prompts and settings.",
  },
  {
    label: "acpx",
    selectLabel: "acpx (external agent)",
    value: "acpx",
    description: "Runs this external agent through the acpx CLI adapter.",
  },
  {
    label: "Remote",
    selectLabel: "Remote (HTTP endpoint)",
    value: "remote",
    description: "Connects to an external HTTP agent endpoint by URL.",
  },
] as const satisfies readonly AgentEditConnectionTypeOption[]

export interface AgentProfileConnectionDraft {
  type: AgentProfileConnectionTypeValue
  agent?: string
  command?: string
  args?: string[]
  baseUrl?: string
  cwd?: string
}

export interface AgentProfileConnectionInput {
  connectionType?: AgentProfileConnectionTypeValue
  connectionAgent?: string
  connectionCommand?: string
  connectionArgs?: string | string[]
  connectionBaseUrl?: string
  connectionCwd?: string
}

export interface AgentConnectionFormFields {
  connectionType: AgentEditConnectionType
  connectionAgent?: string
  connectionCommand: string
  connectionArgs: string
  connectionBaseUrl: string
  connectionCwd: string
}

export interface AgentConnectionEditableFields {
  connectionType: AgentEditConnectionType
  connectionCommand?: string
  connectionBaseUrl?: string
}

export interface AgentConnectionRequestFields {
  connectionType: AgentEditConnectionType
  connectionAgent?: string
  connectionCommand?: string
  connectionArgs?: string
  connectionBaseUrl?: string
  connectionCwd?: string
}

const LOCAL_AGENT_PROFILE_CONNECTION_TYPES = new Set<AgentProfileConnectionTypeValue>(["acpx", "acp", "stdio"])

function normalizeText(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

export function normalizeAgentConnectionArgs(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) {
    return value.map((part) => part.trim()).filter(Boolean)
  }

  const trimmed = normalizeText(value)
  return trimmed ? trimmed.split(/\s+/).filter(Boolean) : []
}

function normalizeArgs(value: string | string[] | undefined): string[] | undefined {
  const args = normalizeAgentConnectionArgs(value)
  return args.length > 0 ? args : undefined
}

export function buildAgentConnectionCommandPreview(
  command: string | undefined,
  args?: string | string[],
): string {
  return [normalizeText(command), ...normalizeAgentConnectionArgs(args)].filter(Boolean).join(" ")
}

export function getAgentConnectionFormValidationError(
  formData: AgentConnectionEditableFields,
): string | undefined {
  if (formData.connectionType === "acpx" && !normalizeText(formData.connectionCommand)) {
    return "Add a command for acpx agents before saving."
  }

  if (formData.connectionType === "remote" && !normalizeText(formData.connectionBaseUrl)) {
    return "Add a base URL before saving a remote agent."
  }

  return undefined
}

export function normalizeAgentConnectionFormFieldsForEdit(
  connection: Partial<AgentProfileConnectionDraft> | null | undefined,
  fallbackConnectionType?: string | null,
): AgentConnectionFormFields {
  return {
    connectionType: normalizeAgentEditConnectionType(connection?.type ?? fallbackConnectionType),
    ...(connection?.agent ? { connectionAgent: connection.agent } : {}),
    connectionCommand: connection?.command ?? "",
    connectionArgs: normalizeAgentConnectionArgs(connection?.args).join(" "),
    connectionBaseUrl: connection?.baseUrl ?? "",
    connectionCwd: connection?.cwd ?? "",
  }
}

function isLocalConnectionType(value: string | undefined): value is "acpx" | "acp" | "stdio" {
  return value === "acpx" || value === "acp" || value === "stdio"
}

export function normalizeAgentEditConnectionType(
  value: string | null | undefined,
): AgentEditConnectionType {
  if (value === "remote" || value === "internal" || value === "acpx") return value
  if (isLocalConnectionType(value ?? undefined)) return "acpx"
  return "internal"
}

export function sanitizeAgentProfileConnection(
  input: AgentProfileConnectionInput,
  existingConnection?: AgentProfileConnectionDraft,
): AgentProfileConnectionDraft {
  const connectionType = input.connectionType ?? existingConnection?.type ?? "internal"
  const existingLocalConnection = existingConnection && LOCAL_AGENT_PROFILE_CONNECTION_TYPES.has(existingConnection.type)
    ? existingConnection
    : undefined

  if (connectionType === "remote") {
    const baseUrl = input.connectionBaseUrl !== undefined
      ? normalizeText(input.connectionBaseUrl)
      : existingConnection?.type === "remote"
        ? normalizeText(existingConnection.baseUrl)
        : undefined

    return {
      type: "remote",
      ...(baseUrl ? { baseUrl } : {}),
    }
  }

  if (isLocalConnectionType(connectionType)) {
    const agent = input.connectionAgent !== undefined
      ? normalizeText(input.connectionAgent)
      : normalizeText(existingLocalConnection?.agent)
    const command = input.connectionCommand !== undefined
      ? normalizeText(input.connectionCommand)
      : normalizeText(existingLocalConnection?.command)
    const args = input.connectionArgs !== undefined
      ? normalizeArgs(input.connectionArgs)
      : normalizeArgs(existingLocalConnection?.args)
    const cwd = input.connectionCwd !== undefined
      ? normalizeText(input.connectionCwd)
      : normalizeText(existingLocalConnection?.cwd)

    return {
      type: "acpx",
      ...(agent ? { agent } : {}),
      ...(command ? { command } : {}),
      ...(args ? { args } : {}),
      ...(cwd ? { cwd } : {}),
    }
  }

  return { type: "internal" }
}

export function applyConnectionTypeChange<T extends AgentConnectionEditableFields>(
  formData: T,
  nextConnectionType: AgentEditConnectionType,
): T {
  if (formData.connectionType === nextConnectionType) {
    return formData
  }

  return {
    ...formData,
    connectionType: nextConnectionType,
    connectionBaseUrl: "",
  }
}

export function buildAgentConnectionRequestFields(
  formData: AgentConnectionFormFields,
): AgentConnectionRequestFields {
  if (formData.connectionType === "remote") {
    return {
      connectionType: "remote",
      connectionBaseUrl: normalizeText(formData.connectionBaseUrl) ?? "",
    }
  }

  if (formData.connectionType === "acpx") {
    const connectionAgent = normalizeText(formData.connectionAgent)
    return {
      connectionType: formData.connectionType,
      ...(connectionAgent ? { connectionAgent } : {}),
      connectionCommand: normalizeText(formData.connectionCommand) ?? "",
      connectionArgs: normalizeText(formData.connectionArgs) ?? "",
      connectionCwd: normalizeText(formData.connectionCwd) ?? "",
    }
  }

  return { connectionType: "internal" }
}
