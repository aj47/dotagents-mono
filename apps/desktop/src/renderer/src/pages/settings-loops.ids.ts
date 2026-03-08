const LOOP_ID_MAX_LENGTH = 64

export function slugifyLoopId(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, LOOP_ID_MAX_LENGTH) || crypto.randomUUID()
}

function appendLoopIdSuffix(baseId: string, suffix: string): string {
  const trimmedBase = baseId.slice(0, Math.max(1, LOOP_ID_MAX_LENGTH - suffix.length))
  return `${trimmedBase}${suffix}`
}

export function buildUniqueLoopId(name: string, existingIds: Iterable<string>): string {
  const baseId = slugifyLoopId(name)
  const normalizedExistingIds = new Set(Array.from(existingIds, (id) => id.toLowerCase()))

  if (!normalizedExistingIds.has(baseId.toLowerCase())) {
    return baseId
  }

  let suffixNumber = 2
  let candidateId = appendLoopIdSuffix(baseId, `-${suffixNumber}`)

  while (normalizedExistingIds.has(candidateId.toLowerCase())) {
    suffixNumber += 1
    candidateId = appendLoopIdSuffix(baseId, `-${suffixNumber}`)
  }

  return candidateId
}