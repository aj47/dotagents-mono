import type { OperatorAuditEntry, OperatorRuntimeStatus } from "./api-types"

export const OPERATOR_EMPTY_VALUE_LABEL = "—"

export function formatOperatorTimestamp(timestamp?: number): string {
  if (!timestamp) return OPERATOR_EMPTY_VALUE_LABEL
  return new Date(timestamp).toLocaleString()
}

export function formatOperatorDurationSeconds(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
}

export function formatOperatorYesNo(value?: boolean): string {
  if (value === undefined) return OPERATOR_EMPTY_VALUE_LABEL
  return value ? "Yes" : "No"
}

export function getOperatorTunnelStateLabel(status?: OperatorRuntimeStatus["tunnel"] | null): string {
  if (!status) return "Unknown"
  if (status.running) return "Running"
  if (status.starting) return "Starting"
  return "Stopped"
}

export function formatOperatorLogSummary(logs?: {
  total: number
  errorCount?: number
  warningCount?: number
  infoCount?: number
}): string {
  if (!logs) return OPERATOR_EMPTY_VALUE_LABEL
  const parts = [`${logs.total} total`]
  if (typeof logs.errorCount === "number") parts.push(`${logs.errorCount} error`)
  if (typeof logs.warningCount === "number") parts.push(`${logs.warningCount} warning`)
  if (typeof logs.infoCount === "number") parts.push(`${logs.infoCount} info`)
  return parts.join(" • ")
}

export function formatOperatorAuditSource(entry: OperatorAuditEntry): string | null {
  const parts = [entry.deviceId, entry.source?.ip, entry.source?.origin].filter(Boolean)
  return parts.length > 0 ? parts.join(" • ") : null
}

export function formatOperatorAuditDetails(details?: Record<string, unknown>): string | null {
  if (!details || Object.keys(details).length === 0) return null

  return Object.entries(details)
    .map(([key, value]) => {
      if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        return `${key}: ${value}`
      }

      try {
        return `${key}: ${JSON.stringify(value)}`
      } catch {
        return `${key}: [unserializable]`
      }
    })
    .join(" • ")
}
