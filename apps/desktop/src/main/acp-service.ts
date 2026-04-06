import { acpxService } from './acpx/acpx-service'

export type ACPGetOrCreateSessionStage = 'launching' | 'initializing' | 'creating_session'

export type ACPToolCallStatus = 'pending' | 'running' | 'completed' | 'failed'

export interface ACPContentBlock {
  type: 'text' | 'tool_use' | 'tool_result' | 'image' | 'audio' | 'resource' | 'resource_link' | 'diff' | 'terminal' | 'location'
  text?: string
  name?: string
  title?: string
  description?: string
  uri?: string
  mimeType?: string
  path?: string
  line?: number
  column?: number
  terminalId?: string
  input?: unknown
  result?: unknown
  resource?: {
    uri?: string
    text?: string
  }
}

export interface ACPToolCallUpdate {
  toolCallId: string
  title: string
  status?: ACPToolCallStatus
  rawInput?: unknown
  rawOutput?: unknown
  content?: ACPContentBlock[]
}

export interface ACPRunRequest {
  agentName: string
  input: string | { messages?: Array<{ content: string }> }
  context?: string
  workingDirectory?: string
  forceNewSession?: boolean
}

export type ACPService = typeof acpxService

/**
 * Compatibility shim retained while ACP-era filenames/import paths remain in the codebase.
 * The runtime implementation now lives entirely in the acpx CLI adapter.
 */
export const acpService: ACPService = acpxService
