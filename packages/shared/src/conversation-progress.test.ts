import { describe, expect, it } from 'vitest'
import { getBranchMessageIndexMap } from './conversation-progress'

describe('getBranchMessageIndexMap', () => {
  it('maps non-compacted messages to their raw indexes', () => {
    expect(
      getBranchMessageIndexMap([
        { isSummary: false },
        { isSummary: false },
        { isSummary: false },
      ]),
    ).toEqual([0, 1, 2])
  })

  it('maps summary messages to the last raw message they represent', () => {
    expect(
      getBranchMessageIndexMap([
        { isSummary: true, summarizedMessageCount: 3 },
        { isSummary: false },
        { isSummary: true, summarizedMessageCount: 2 },
      ]),
    ).toEqual([2, 3, 5])
  })

  it('treats empty or missing summary counts as one represented message', () => {
    expect(
      getBranchMessageIndexMap([
        { isSummary: true, summarizedMessageCount: 0 },
        { isSummary: true },
        { isSummary: false },
      ]),
    ).toEqual([0, 1, 2])
  })
})
