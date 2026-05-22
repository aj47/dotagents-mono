const parentsWithInternalSubSessions = new Set<string>()

export function registerKnownInternalSubSessionParent(parentSessionId: string): void {
  parentsWithInternalSubSessions.add(parentSessionId)
}

export function hasKnownInternalSubSessionsForParent(parentSessionId: string): boolean {
  return parentsWithInternalSubSessions.has(parentSessionId)
}
