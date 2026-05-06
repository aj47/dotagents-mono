import { describe, expect, it } from 'vitest'

import { parseTaskMarkdown, stringifyTaskMarkdown } from './repeat-task-markdown'
import type { RepeatTaskApiRecord } from './repeat-task-utils'

describe('repeat-task-markdown', () => {
  it('roundtrips continuous task frontmatter', () => {
    const task: RepeatTaskApiRecord = {
      id: 'continuous-task',
      name: 'Continuous task',
      prompt: 'Keep processing the queue.',
      intervalMinutes: 15,
      enabled: true,
      runContinuously: true,
      maxIterations: 3,
    }

    const markdown = stringifyTaskMarkdown(task)
    expect(markdown).toContain('runContinuously: true')
    expect(markdown).toContain('maxIterations: 3')

    const parsed = parseTaskMarkdown(markdown)
    expect(parsed?.runContinuously).toBe(true)
    expect(parsed?.maxIterations).toBe(3)
  })

  it('omits falsey optional flags', () => {
    const task: RepeatTaskApiRecord = {
      id: 'interval-task',
      name: 'Interval task',
      prompt: 'Run occasionally.',
      intervalMinutes: 15,
      enabled: true,
    }

    const markdown = stringifyTaskMarkdown(task)
    expect(markdown).not.toContain('runContinuously')
    expect(parseTaskMarkdown(markdown)?.runContinuously).toBeUndefined()
  })

  it('parses fallback ids and schedule frontmatter', () => {
    const markdown = `---
kind: task
name: Weekly review
intervalMinutes: 60
enabled: false
schedule: {"type":"weekly","times":["17:00"],"daysOfWeek":[5,1,1]}
---

Review the week.
`

    expect(parseTaskMarkdown(markdown, { fallbackId: 'weekly-review' })).toEqual({
      id: 'weekly-review',
      name: 'Weekly review',
      prompt: 'Review the week.',
      intervalMinutes: 60,
      enabled: false,
      profileId: undefined,
      runOnStartup: undefined,
      speakOnTrigger: undefined,
      continueInSession: undefined,
      lastSessionId: undefined,
      runContinuously: undefined,
      maxIterations: undefined,
      lastRunAt: undefined,
      schedule: { type: 'weekly', times: ['17:00'], daysOfWeek: [1, 5] },
    })
  })
})
