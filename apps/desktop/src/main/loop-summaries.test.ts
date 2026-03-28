import { describe, expect, it } from "vitest"
import { summarizeLoop, summarizeLoops } from "./loop-summaries"

describe("loop summaries", () => {
  it("prefers runtime status timestamps while preserving loop config fields", () => {
    const summary = summarizeLoop(
      {
        id: "loop-1",
        name: "Daily summary",
        prompt: "Summarize activity",
        intervalMinutes: 60,
        enabled: true,
        profileId: "profile-1",
        lastRunAt: 100,
        runOnStartup: true,
      },
      {
        profileName: "Writer",
        status: {
          isRunning: true,
          lastRunAt: 200,
          nextRunAt: 300,
        },
      },
    )

    expect(summary).toEqual({
      id: "loop-1",
      name: "Daily summary",
      prompt: "Summarize activity",
      intervalMinutes: 60,
      enabled: true,
      profileId: "profile-1",
      profileName: "Writer",
      lastRunAt: 200,
      runOnStartup: true,
      isRunning: true,
      nextRunAt: 300,
    })
  })

  it("builds consistent summaries for desktop and remote callers", () => {
    const summaries = summarizeLoops(
      [
        {
          id: "loop-1",
          name: "Daily summary",
          prompt: "Summarize activity",
          intervalMinutes: 60,
          enabled: true,
          profileId: "profile-1",
          lastRunAt: 100,
        },
        {
          id: "loop-2",
          name: "Inbox sweep",
          prompt: "Review inbox",
          intervalMinutes: 15,
          enabled: false,
        },
      ],
      {
        statuses: [
          { id: "loop-1", isRunning: true, lastRunAt: 250, nextRunAt: 400 },
        ],
        getProfileName: (profileId) =>
          profileId === "profile-1" ? "Writer" : undefined,
      },
    )

    expect(summaries).toEqual([
      {
        id: "loop-1",
        name: "Daily summary",
        prompt: "Summarize activity",
        intervalMinutes: 60,
        enabled: true,
        profileId: "profile-1",
        profileName: "Writer",
        lastRunAt: 250,
        isRunning: true,
        nextRunAt: 400,
      },
      {
        id: "loop-2",
        name: "Inbox sweep",
        prompt: "Review inbox",
        intervalMinutes: 15,
        enabled: false,
        profileName: undefined,
        lastRunAt: undefined,
        isRunning: false,
        nextRunAt: undefined,
      },
    ])
  })
})
