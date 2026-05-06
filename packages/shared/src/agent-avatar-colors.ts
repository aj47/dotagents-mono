export const AGENT_AVATAR_PALETTE = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
  "#f43f5e",
  "#a855f7",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#e11d48",
  "#7c3aed",
  "#0891b2",
  "#059669",
  "#d97706",
] as const

const AGENT_AVATAR_COLOR_OFFSETS = [0, 7, 13] as const

export function getAgentAvatarColors(seed: string): string[] {
  let hash = 5381
  for (let index = 0; index < seed.length; index += 1) {
    hash = ((hash * 33) ^ seed.charCodeAt(index)) >>> 0
  }

  return AGENT_AVATAR_COLOR_OFFSETS.map(
    (offset) => AGENT_AVATAR_PALETTE[(hash + offset) % AGENT_AVATAR_PALETTE.length],
  )
}
