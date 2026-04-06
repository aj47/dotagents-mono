import { describe, expect, it, vi } from 'vitest'

import {
  AGENT_PROFILE_QUERY_KEYS,
  invalidateAgentProfileQueries,
} from './invalidate-agent-profile-queries'

describe('invalidateAgentProfileQueries', () => {
  it('invalidates all agent-profile driven UI queries', () => {
    const invalidateQueries = vi.fn()

    invalidateAgentProfileQueries({ invalidateQueries })

    expect(invalidateQueries).toHaveBeenCalledTimes(AGENT_PROFILE_QUERY_KEYS.length)
    expect(invalidateQueries.mock.calls).toEqual(
      AGENT_PROFILE_QUERY_KEYS.map(queryKey => [{ queryKey }]),
    )
  })
})
