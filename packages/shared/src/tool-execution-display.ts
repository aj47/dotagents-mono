export function formatToolExecutionDuration(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`
  }
  if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`
  }
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.round((ms % 60000) / 1000)
  return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`
}

export function formatToolExecutionTokens(tokens: number): string {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(1)}M`
  }
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(tokens >= 10000 ? 0 : 1)}k`
  }
  return `${tokens}`
}

export function truncateToolExecutionSubagentId(id: string): string {
  if (id.length > 12 && id.includes("-")) {
    const shortId = id.split("-")[0].slice(0, 7)
    return `agent:${shortId}`
  }
  if (id.length <= 12) {
    return id
  }
  return `${id.slice(0, 10)}...`
}
