interface QueryClientLike {
  invalidateQueries: (input: { queryKey: readonly string[] }) => unknown
}

const AGENT_PROFILE_QUERY_KEYS = [
  ['agentProfilesSidebar'],
  ['agentProfilesSelector'],
  ['agentProfilesPanel'],
  ['externalAgents'],
] as const

export function invalidateAgentProfileQueries(queryClient: QueryClientLike): void {
  for (const queryKey of AGENT_PROFILE_QUERY_KEYS) {
    queryClient.invalidateQueries({ queryKey })
  }
}

export { AGENT_PROFILE_QUERY_KEYS }
