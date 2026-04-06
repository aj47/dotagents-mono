import type { ChildProcess } from 'child_process'

export const MIN_SUPPORTED_ACPX_VERSION = '0.4.1'

export interface AcpxVerifyResult {
  success: boolean
  version?: string
  error?: string
}

export interface AcpxSessionMetadata {
  sessionId?: string
  sessionName: string
  agentName: string
  cwd?: string
  closed?: boolean
  agentInfo?: {
    name?: string
    title?: string
    version?: string
  }
  sessionInfo?: {
    currentModeId?: string
    configOptions?: any[]
    models?: {
      currentModelId?: string
      availableModels?: Array<{ modelId?: string; name?: string; description?: string }>
    }
    modes?: {
      currentModeId?: string
      availableModes?: Array<{ id?: string; name?: string; description?: string }>
    }
  }
  raw?: unknown
}

export interface AcpxPromptResult {
  success: boolean
  response?: string
  stopReason?: string
  error?: string
  sessionId?: string
}

export interface AcpxRunResult {
  success: boolean
  result?: string
  error?: string
  stopReason?: string
  sessionId?: string
}

export interface AcpxJsonRpcMessage {
  jsonrpc?: string
  id?: string | number | null
  method?: string
  params?: Record<string, unknown>
  result?: Record<string, unknown>
  error?: {
    code?: number
    message?: string
    data?: unknown
  }
}

export interface AcpxActivePrompt {
  key: string
  agentName: string
  sessionName: string
  child: ChildProcess
}
