import { describe, expect, it } from "vitest"

import {
  buildRuntimeCommandFailurePayload,
  buildRuntimeCommandPolicyBlockPayload,
  buildRuntimeCommandSuccessPayload,
  detectContextGatheringCommandBlock,
  detectPreferredPackageManager,
  detectPackageManagerMismatch,
  getShellEscapingIssueHint,
  getPackageManagerRetrySuggestion,
  normalizeExecuteCommandWorkspacePaths,
  parseExecuteCommandArgs,
  truncateRuntimeCommandOutput,
} from "./runtime-command-utils"

describe("runtime command utils", () => {
  const posixPathOps = {
    resolve: (targetPath: string) => targetPath,
    join: (...paths: string[]) => paths.join("/").replace(/\/+/g, "/"),
    dirname: (targetPath: string) => {
      const normalized = targetPath.replace(/\/+$/, "") || "/"
      const slashIndex = normalized.lastIndexOf("/")
      return slashIndex <= 0 ? "/" : normalized.slice(0, slashIndex)
    },
  }

  it("parses execute_command arguments", () => {
    expect(parseExecuteCommandArgs({})).toEqual({
      success: false,
      error: "command parameter is required and must be a string",
    })
    expect(parseExecuteCommandArgs({ command: "" })).toEqual({
      success: false,
      error: "command parameter is required and must be a string",
    })
    expect(parseExecuteCommandArgs({
      command: "pnpm test",
      skillId: " skill-1 ",
      timeout: 5000,
    })).toEqual({
      success: true,
      command: "pnpm test",
      skillId: "skill-1",
      timeout: 5000,
    })
    expect(parseExecuteCommandArgs({
      command: "git status",
      skillId: " ",
      timeout: -1,
    }, 1234)).toEqual({
      success: true,
      command: "git status",
      timeout: 1234,
    })
  })

  it("returns package-manager retry suggestions", () => {
    expect(getPackageManagerRetrySuggestion("pnpm")).toContain("pnpm exec")
    expect(getPackageManagerRetrySuggestion("npm")).toContain("npx")
    expect(getPackageManagerRetrySuggestion("yarn")).toContain("yarn dlx")
    expect(getPackageManagerRetrySuggestion("bun")).toContain("bunx")
  })

  it("detects preferred package managers by walking parent directories", async () => {
    const existingPaths = new Set([
      "/repo/pnpm-lock.yaml",
      "/repo/packages/app/package-lock.json",
    ])

    await expect(detectPreferredPackageManager(
      "/repo/packages/app/src",
      posixPathOps,
      (targetPath) => existingPaths.has(targetPath),
    )).resolves.toEqual({
      name: "npm",
      lockfile: "package-lock.json",
      directory: "/repo/packages/app",
    })

    await expect(detectPreferredPackageManager(
      "/repo/packages/other",
      posixPathOps,
      (targetPath) => existingPaths.has(targetPath),
    )).resolves.toEqual({
      name: "pnpm",
      lockfile: "pnpm-lock.yaml",
      directory: "/repo",
    })
  })

  it("prefers pnpm over other lockfiles in the same directory", async () => {
    const existingPaths = new Set([
      "/repo/pnpm-lock.yaml",
      "/repo/package-lock.json",
    ])

    await expect(detectPreferredPackageManager(
      "/repo/app",
      posixPathOps,
      (targetPath) => existingPaths.has(targetPath),
    )).resolves.toEqual({
      name: "pnpm",
      lockfile: "pnpm-lock.yaml",
      directory: "/repo",
    })

    await expect(detectPreferredPackageManager(
      "/no-lockfiles/app",
      posixPathOps,
      (targetPath) => existingPaths.has(targetPath),
    )).resolves.toBeNull()
  })

  it("detects package-manager family mismatches", () => {
    expect(detectPackageManagerMismatch(
      "cd apps/desktop && npm test",
      {
        name: "pnpm",
        lockfile: "pnpm-lock.yaml",
        packageManagerLockfile: "/repo/pnpm-lock.yaml",
      },
    )).toEqual({
      detectedPackageManager: "pnpm",
      packageManagerLockfile: "/repo/pnpm-lock.yaml",
      offendingToken: "npm",
      error: "This workspace uses pnpm (detected via pnpm-lock.yaml), so 'npm' is the wrong package manager here.",
      retrySuggestion: "Retry with pnpm for installs/scripts and pnpm exec for one-off CLIs. Do not use npm or npx in this workspace.",
    })

    expect(detectPackageManagerMismatch(
      "pnpx vitest run",
      { name: "npm", lockfile: "package-lock.json" },
    )?.offendingToken).toBe("pnpx")
  })

  it("builds execute_command policy block payloads with shared base fields", () => {
    const mismatch = detectPackageManagerMismatch(
      "npm test",
      {
        name: "pnpm",
        lockfile: "pnpm-lock.yaml",
        packageManagerLockfile: "/repo/pnpm-lock.yaml",
      },
    )

    expect(mismatch).toBeTruthy()
    expect(buildRuntimeCommandPolicyBlockPayload({
      command: "pnpm test",
      originalCommand: "npm test",
      cwd: "/repo",
      skillName: "Build Skill",
      ignoredInvalidSkillIdWarning: {
        ignoredInvalidSkillId: "owner/repo",
        warning: "Ignored invalid execute_command.skillId: owner/repo. Ran the command in the default workspace instead.",
        guidance: "skillId must be an exact loaded skill id from Available Skills. Omit skillId for normal workspace or repository commands. Never use repo names, file paths, URLs, or GitHub slugs as skillId.",
        retrySuggestion: "Retry the same command without skillId unless you explicitly need to run inside a loaded skill directory.",
        availableSkillIds: ["build-skill"],
      },
      normalizedPaths: [{ from: "/Users/old/repo", to: "/Users/new/repo" }],
    }, mismatch!)).toEqual({
      success: false,
      command: "pnpm test",
      originalCommand: "npm test",
      cwd: "/repo",
      skillName: "Build Skill",
      ignoredInvalidSkillId: "owner/repo",
      warning: "Ignored invalid execute_command.skillId: owner/repo. Ran the command in the default workspace instead.",
      guidance: "skillId must be an exact loaded skill id from Available Skills. Omit skillId for normal workspace or repository commands. Never use repo names, file paths, URLs, or GitHub slugs as skillId.",
      retrySuggestion: "Retry with pnpm for installs/scripts and pnpm exec for one-off CLIs. Do not use npm or npx in this workspace.",
      availableSkillIds: ["build-skill"],
      normalizedPaths: [{ from: "/Users/old/repo", to: "/Users/new/repo" }],
      detectedPackageManager: "pnpm",
      packageManagerLockfile: "/repo/pnpm-lock.yaml",
      offendingToken: "npm",
      error: "This workspace uses pnpm (detected via pnpm-lock.yaml), so 'npm' is the wrong package manager here.",
    })
  })

  it("builds execute_command success and failure payloads", () => {
    expect(buildRuntimeCommandSuccessPayload({
      command: "pnpm test",
      originalCommand: "pnpm test",
      cwd: "/repo",
      stdout: "ok",
      stderr: "",
      outputTruncated: true,
    })).toEqual({
      success: true,
      command: "pnpm test",
      cwd: "/repo",
      stdout: "ok",
      stderr: "",
      outputTruncated: true,
      hint: "Output was truncated. Use head -n/tail -n/sed -n 'X,Yp' to read specific sections.",
    })

    expect(buildRuntimeCommandFailurePayload({
      command: "node -e '",
      cwd: "/repo",
      errorMessage: "unterminated string",
      exitCode: 2,
      stdout: "partial",
      stderr: "",
    })).toEqual({
      success: false,
      command: "node -e '",
      cwd: "/repo",
      error: expect.stringContaining("shell escaping"),
      exitCode: 2,
      stdout: "partial",
      stderr: "",
    })
  })

  it("allows commands in the preferred package-manager family", () => {
    expect(detectPackageManagerMismatch(
      "pnpm --filter @dotagents/desktop test && pnpm exec tsc",
      { name: "pnpm", lockfile: "pnpm-lock.yaml" },
    )).toBeNull()
    expect(detectPackageManagerMismatch(
      "git status --short",
      { name: "pnpm", lockfile: "pnpm-lock.yaml" },
    )).toBeNull()
    expect(detectPackageManagerMismatch("npm test", null)).toBeNull()
  })

  it("blocks package-manager validation for context-gathering requests", () => {
    expect(detectContextGatheringCommandBlock(
      "pnpm --filter @dotagents/desktop exec vitest run src/main/system-prompts.test.ts",
      "Gather as much context as possible to give a good answer to the question 'what is next?'",
    )).toEqual({
      blockedCommandCategory: "package-manager-validation",
      latestUserRequestExcerpt: "Gather as much context as possible to give a good answer to the question 'what is next?'",
      error: "The latest user request is a planning/context question, so package-manager test/build/install commands are blocked for this turn.",
      guidance: "For context-gathering or 'what's next' requests, prefer read-only inspection commands such as git status, ls, find, rg, sed, head, tail, or cat.",
      retrySuggestion: "Retry with read-only inspection commands. Only run package-manager test/build/install/lint/typecheck commands when the user explicitly asks for verification or after you have made code changes that need targeted validation.",
    })
  })

  it("blocks dependency mutations for context-gathering requests", () => {
    expect(detectContextGatheringCommandBlock(
      "npm install left-pad",
      "What should the user work on next?",
    )?.blockedCommandCategory).toBe("dependency-mutation")
  })

  it("allows validation commands when the user asked for validation", () => {
    expect(detectContextGatheringCommandBlock(
      "pnpm test",
      "What is next? Run the tests after checking.",
    )).toBeNull()
    expect(detectContextGatheringCommandBlock(
      "git status --short",
      "Gather as much context as possible",
    )).toBeNull()
    expect(detectContextGatheringCommandBlock(
      "pnpm test",
      "Please run the tests",
    )).toBeNull()
  })

  it("normalizes workspace paths copied from a different POSIX home", async () => {
    const existingPaths = new Set([
      "/Users/current/Development/dotagents/apps/desktop",
    ])

    const result = await normalizeExecuteCommandWorkspacePaths(
      "cd /Users/stale/Development/dotagents/apps/desktop && pnpm test /Users/stale/Development/dotagents/apps/desktop",
      "/Users/current/Development/dotagents",
      (targetPath) => existingPaths.has(targetPath),
    )

    expect(result).toEqual({
      command: "cd /Users/current/Development/dotagents/apps/desktop && pnpm test /Users/current/Development/dotagents/apps/desktop",
      normalizedPaths: [{
        from: "/Users/stale/Development/dotagents/apps/desktop",
        to: "/Users/current/Development/dotagents/apps/desktop",
      }],
    })
  })

  it("does not normalize existing or unrelated workspace paths", async () => {
    const existingPaths = new Set([
      "/Users/stale/Development/dotagents/apps/desktop",
      "/Users/current/Other/project",
    ])

    await expect(normalizeExecuteCommandWorkspacePaths(
      "cd /Users/stale/Development/dotagents/apps/desktop",
      "/Users/current/Development/dotagents",
      (targetPath) => existingPaths.has(targetPath),
    )).resolves.toEqual({
      command: "cd /Users/stale/Development/dotagents/apps/desktop",
    })

    await expect(normalizeExecuteCommandWorkspacePaths(
      "cd /Users/stale/Other/project",
      "/Users/current/Development/dotagents",
      (targetPath) => existingPaths.has(targetPath),
    )).resolves.toEqual({
      command: "cd /Users/stale/Other/project",
    })
  })

  it("truncates large runtime command output with command-readable guidance", () => {
    const output = `${"a".repeat(6000)}\n${"b".repeat(6000)}`

    expect(truncateRuntimeCommandOutput(output, { maxChars: 20 })).toEqual({
      output: `${"a".repeat(10)}\n\n... [OUTPUT TRUNCATED: 12001 bytes, ~2 lines total. Showing first 10 + last 10 chars. Use head/tail/sed to read specific ranges, e.g.: sed -n '100,200p' file] ...\n\n${"b".repeat(10)}`,
      outputTruncated: true,
    })

    expect(truncateRuntimeCommandOutput("short", { maxChars: 20 })).toEqual({
      output: "short",
      outputTruncated: false,
    })
  })

  it("uses shorter truncation text for failed command stdout", () => {
    const output = "x".repeat(40)

    expect(truncateRuntimeCommandOutput(output, { maxChars: 10, errorOutput: true })).toEqual({
      output: `${"x".repeat(5)}\n\n... [OUTPUT TRUNCATED: 40 bytes, ~1 lines. Use head/tail/sed to read specific ranges] ...\n\n${"x".repeat(5)}`,
      outputTruncated: true,
    })
  })

  it("detects shell escaping failures and returns retry guidance", () => {
    expect(getShellEscapingIssueHint("syntax error near unexpected token", "")).toContain("shell escaping")
    expect(getShellEscapingIssueHint("", "unterminated string")).toContain("write_file")
    expect(getShellEscapingIssueHint("permission denied", "exit status 1")).toBe("")
  })
})
