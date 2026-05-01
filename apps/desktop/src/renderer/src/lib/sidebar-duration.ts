export function formatSidebarDuration(
  timestamp: number,
  now: number = Date.now(),
): string | null {
  if (!timestamp || !Number.isFinite(timestamp)) return null
  const minutesAgo = Math.max(Math.floor((now - timestamp) / 60_000), 0)

  if (minutesAgo < 60) {
    return minutesAgo === 1 ? "1m" : `${minutesAgo}m`
  }

  const hours = Math.floor(minutesAgo / 60)
  if (hours < 24) {
    const remainderMinutes = minutesAgo % 60
    const hourLabel = `${hours}h`
    const minuteLabel = remainderMinutes > 0 ? ` ${remainderMinutes}m` : ""
    return `${hourLabel}${minuteLabel}`
  }

  const days = Math.floor(hours / 24)
  if (days < 7) {
    return `${days}d`
  }

  const weeks = Math.floor(days / 7)
  return `${weeks}w`
}
