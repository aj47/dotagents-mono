// Re-export from @dotagents/core — single source of truth
export {
  acpService,
  setACPServiceProgressEmitter,
} from '@dotagents/core'
export type {
  ACPContentBlock,
  ACPToolCallStatus,
  ACPToolCallUpdate,
} from '@dotagents/core'

// Re-export the ACPRunRequest type that was defined in this file.
// Note: this is different from the ACPRunRequest in acp/types.ts
// Inline type re-definition for backward compatibility since core doesn't export
// the acp-service's specific ACPRunRequest under that name.
export interface ACPRunRequest {
  agentName: string
  input: string | { messages: Array<{ role: string; content: string }> }
  context?: string
  workingDirectory?: string
  forceNewSession?: boolean
  mode?: "sync" | "async" | "stream"
}
