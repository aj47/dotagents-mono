import fs from "fs"
import os from "os"
import path from "path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const validTsx = `
export default function Home({ data, actions, ui, icons }) {
  return <main><ui.Button onClick={() => actions.startTextSession()}>Start</ui.Button></main>
}
`

describe("homeExperienceService", () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "dotagents-home-test-"))

    vi.resetModules()
    vi.doMock("./config", () => ({
      globalAgentsFolder: tmpDir,
    }))
  })

  afterEach(() => {
    vi.resetModules()
    vi.restoreAllMocks()
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it("saves generated home drafts under the global .agents layouts home folder", async () => {
    const { homeExperienceService } = await import("./home-experience-service")

    const saved = homeExperienceService.saveHomeDraft({
      title: "Ops Home",
      description: "A test home",
      tags: ["ops"],
      tsx: validTsx,
      css: ".home { color: inherit; }",
      favorite: true,
      generationSessionId: "session-generated",
      generationConversationId: "conv-generated",
    })

    expect(saved.summary.id).toMatch(/^ops-home-/)
    expect(saved.summary.status).toBe("favorite")
    expect(saved.summary.generationSessionId).toBe("session-generated")
    expect(saved.summary.generationConversationId).toBe("conv-generated")
    expect(fs.existsSync(path.join(tmpDir, "layouts", "home", saved.summary.id, "home.tsx"))).toBe(true)

    const list = homeExperienceService.listHomeExperiences()
    expect(list.activeHomeId).toBe("starter-command-center")
    expect(list.homes.map((home) => home.title)).toContain("Ops Home")
  })

  it("promotes a saved home as the default and can fall back to starter", async () => {
    const { homeExperienceService } = await import("./home-experience-service")

    const saved = homeExperienceService.saveHomeDraft({
      title: "Default Home",
      tsx: validTsx,
    })

    const promoted = homeExperienceService.promoteHomeExperience({
      id: saved.summary.id,
      makeDefault: true,
    })

    expect(promoted.isDefault).toBe(true)
    expect(homeExperienceService.listHomeExperiences().activeHomeId).toBe(saved.summary.id)

    const starter = homeExperienceService.promoteHomeExperience({
      id: "starter-command-center",
      makeDefault: true,
    })

    expect(starter.isDefault).toBe(true)
    expect(homeExperienceService.listHomeExperiences().activeHomeId).toBe("starter-command-center")
  })

  it("builds the exact-format prompt and validates agent output without saving it", async () => {
    const { homeExperienceService } = await import("./home-experience-service")

    const prompt = homeExperienceService.buildGenerationPrompt({
      prompt: "Make a compact command center",
      context: { agents: [{ id: "agent-1", name: "Builder" }] },
    })
    const generated = homeExperienceService.parseGeneratedHomeResponse(JSON.stringify({
      title: "Generated",
      description: "Generated from prompt",
      tags: ["generated"],
      tsx: validTsx,
      css: "",
    }))

    expect(prompt).toContain("Return JSON only with this exact shape")
    expect(prompt).toContain("No imports, no require")
    expect(prompt).toContain('"agents"')
    expect(generated.title).toBe("Generated")
    expect(generated.tsx).toContain("export default")
    expect(homeExperienceService.listHomeExperiences().homes).toHaveLength(1)
  })

  it("keeps new generation separate from editing the current generated home", async () => {
    const { homeExperienceService } = await import("./home-experience-service")

    const newPrompt = homeExperienceService.buildGenerationPrompt({
      prompt: "Make a video review home",
      mode: "new",
      context: {
        sourceHome: {
          id: "existing-home",
          title: "Existing",
          tsx: "export default function Home() { return <div>Existing</div> }",
        },
        media: [{ id: "clip-1", title: "Clip", kind: "video" }],
      },
    })
    const editPrompt = homeExperienceService.buildGenerationPrompt({
      prompt: "Add a review lane",
      mode: "edit",
      context: {
        sourceHome: {
          id: "existing-home",
          title: "Existing",
          tsx: "export default function Home() { return <div>Existing</div> }",
        },
      },
    })

    expect(newPrompt).toContain("Mode: create a new generated home")
    expect(newPrompt).not.toContain("Current generated home source to edit")
    expect(newPrompt).not.toContain("Existing</div>")
    expect(editPrompt).toContain("Mode: edit the current generated home")
    expect(editPrompt).toContain("Current generated home source to edit")
    expect(editPrompt).toContain("Existing</div>")
  })

  it("rejects generated homes that try to import code", async () => {
    const { homeExperienceService } = await import("./home-experience-service")

    expect(() => homeExperienceService.saveHomeDraft({
      title: "Bad Home",
      tsx: 'import fs from "fs"\nexport default function Home() { return <div /> }',
    })).toThrow(/Imports are not allowed/)
  })

  it("rejects generated homes that throw during the first render", async () => {
    const { homeExperienceService } = await import("./home-experience-service")

    expect(() => homeExperienceService.saveHomeDraft({
      title: "Broken Home",
      tsx: "export default function Home() { return <div>{itemTitle}</div> }",
    })).toThrow(/Generated home failed runtime validation: ReferenceError: itemTitle is not defined/)
  })

  it("falls back to the starter home when a saved generated home violates source rules", async () => {
    const { homeExperienceService } = await import("./home-experience-service")

    const saved = homeExperienceService.saveHomeDraft({
      title: "Saved Home",
      tsx: validTsx,
    })
    homeExperienceService.promoteHomeExperience({
      id: saved.summary.id,
      makeDefault: true,
    })
    fs.writeFileSync(
      path.join(tmpDir, "layouts", "home", saved.summary.id, "home.tsx"),
      'import fs from "fs"\nexport default function Home() { return <div /> }',
    )

    expect(homeExperienceService.getHomeExperience(saved.summary.id)).toBeNull()
  })
})
