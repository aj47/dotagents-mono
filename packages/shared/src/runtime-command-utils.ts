import type { IgnoredExecuteCommandSkillIdWarning } from "./skills-api"

export type PackageManagerName = "pnpm" | "npm" | "yarn" | "bun"

export type PreferredPackageManagerInfo = {
  name: PackageManagerName
  lockfile: string
  packageManagerLockfile?: string
}

export type PreferredPackageManagerDetection = {
  name: PackageManagerName
  lockfile: string
  directory: string
}

export type RuntimeCommandPathOps = {
  resolve: (targetPath: string) => string
  join: (...paths: string[]) => string
  dirname: (targetPath: string) => string
}

export type PackageManagerMismatch = {
  detectedPackageManager: PackageManagerName
  packageManagerLockfile: string
  offendingToken: string
  error: string
  retrySuggestion: string
}

export type ContextGatheringCommandBlock = {
  blockedCommandCategory: "dependency-mutation" | "package-manager-validation"
  latestUserRequestExcerpt: string
  error: string
  guidance: string
  retrySuggestion: string
}

export type ExecuteCommandPathExists = (targetPath: string) => boolean | Promise<boolean>

export type ExecuteCommandWorkspacePathNormalization = {
  command: string
  normalizedPaths?: Array<{ from: string; to: string }>
}

export type RuntimeCommandOutputTruncation = {
  output: string
  outputTruncated: boolean
}

export type ExecuteCommandArgs =
  | {
      success: false
      error: string
    }
  | {
      success: true
      command: string
      skillId?: string
      timeout: number
    }

export type RuntimeCommandPayloadContext = {
  command: string
  originalCommand?: string
  cwd: string
  skillName?: string
  ignoredInvalidSkillIdWarning?: IgnoredExecuteCommandSkillIdWarning
  normalizedPaths?: Array<{ from: string; to: string }>
}

export type RuntimeCommandPolicyBlockPayload = RuntimeCommandPayloadContext & {
  success: false
} & (PackageManagerMismatch | ContextGatheringCommandBlock)

export type RuntimeCommandSuccessPayload = RuntimeCommandPayloadContext & {
  success: true
  stdout: string
  stderr: string
  outputTruncated?: true
  hint?: string
}

export type RuntimeCommandFailurePayload = RuntimeCommandPayloadContext & {
  success: false
  error: string
  exitCode?: number | string
  stdout: string
  stderr: string
}

const PACKAGE_MANAGER_TOKEN_FAMILY: Record<string, PackageManagerName> = {
  npm: "npm",
  npx: "npm",
  pnpm: "pnpm",
  pnpx: "pnpm",
  yarn: "yarn",
  bun: "bun",
  bunx: "bun",
}

const PACKAGE_MANAGER_LOCKFILES: Array<{ name: PackageManagerName; lockfiles: string[] }> = [
  { name: "pnpm", lockfiles: ["pnpm-lock.yaml"] },
  { name: "npm", lockfiles: ["package-lock.json"] },
  { name: "yarn", lockfiles: ["yarn.lock"] },
  { name: "bun", lockfiles: ["bun.lock", "bun.lockb"] },
]

const PACKAGE_MANAGER_COMMAND_REGEX = /(^|&&|\|\||;)\s*(npm|npx|pnpm|pnpx|yarn|bun|bunx)(?=\s|$)/g
const CONTEXT_GATHERING_REQUEST_REGEX = /\b(gather (?:as much )?context|what(?:'s| is) next|next steps?|what should (?:the )?user work on next|immediate next steps?)\b/i
const USER_REQUEST_ALLOWS_VALIDATION_REGEX = /\b(test|tests|testing|verify|verification|validate|validation|build|compile|lint|typecheck|smoke test|run the app|run the tests|fix|change|edit|implement|update|refactor|install|dependency|dependencies)\b/i
const HIGH_IMPACT_PACKAGE_MANAGER_COMMAND_REGEX = /(^|&&|\|\||;)\s*(npm|npx|pnpm|pnpx|yarn|bun|bunx)\b/i
const VALIDATION_OR_DEPENDENCY_COMMAND_REGEX = /\b(test|tests|vitest|jest|playwright(?:\s+test)?|cypress|lint|eslint|typecheck|tsc\b|build|compile|install|add|remove|uninstall|update|upgrade)\b/i
const POSIX_WORKSPACE_PATH_REGEX = /(?:\/Users|\/home)\/[^/\s'"`;|&()]+(?:\/[A-Za-z0-9._-]+)+/g
const POSIX_HOME_PREFIX_REGEX = /^(\/Users\/[^/]+|\/home\/[^/]+)/
const SHELL_ESCAPING_ISSUE_REGEX = /unexpected (EOF|end of file)|unterminated (string|quote)|syntax error near/i
const DEFAULT_RUNTIME_COMMAND_MAX_OUTPUT_CHARS = 10000

function getUserHomePrefix(targetPath: string): string | null {
  const match = targetPath.match(POSIX_HOME_PREFIX_REGEX)
  return match ? match[0] : null
}

function getWorkspaceRelativePath(targetPath: string): string | null {
  const homePrefix = getUserHomePrefix(targetPath)
  return homePrefix ? targetPath.slice(homePrefix.length) : null
}

function sharesWorkspaceRelativePath(candidatePath: string, workingDirectory: string): boolean {
  const candidateRelativePath = getWorkspaceRelativePath(candidatePath)
  const workingDirectoryRelativePath = getWorkspaceRelativePath(workingDirectory)

  if (!candidateRelativePath || !workingDirectoryRelativePath) {
    return false
  }

  return candidateRelativePath === workingDirectoryRelativePath
    || candidateRelativePath.startsWith(`${workingDirectoryRelativePath}/`)
    || workingDirectoryRelativePath.startsWith(`${candidateRelativePath}/`)
}

export function parseExecuteCommandArgs(
  args: Record<string, unknown>,
  defaultTimeout = 30000,
): ExecuteCommandArgs {
  if (!args.command || typeof args.command !== "string") {
    return {
      success: false,
      error: "command parameter is required and must be a string",
    }
  }

  const rawTimeout = args.timeout
  const timeout = (typeof rawTimeout === "number" && Number.isFinite(rawTimeout) && rawTimeout >= 0)
    ? rawTimeout
    : defaultTimeout
  const skillId = typeof args.skillId === "string" ? args.skillId.trim() : undefined

  return {
    success: true,
    command: args.command,
    ...(skillId ? { skillId } : {}),
    timeout,
  }
}

function buildRuntimeCommandPayloadContext(input: RuntimeCommandPayloadContext): RuntimeCommandPayloadContext {
  return {
    command: input.command,
    ...(input.originalCommand && input.originalCommand !== input.command ? { originalCommand: input.originalCommand } : {}),
    cwd: input.cwd,
    ...(input.skillName ? { skillName: input.skillName } : {}),
    ...(input.ignoredInvalidSkillIdWarning ?? {}),
    ...(input.normalizedPaths ? { normalizedPaths: input.normalizedPaths } : {}),
  }
}

export function buildRuntimeCommandPolicyBlockPayload(
  context: RuntimeCommandPayloadContext,
  block: PackageManagerMismatch | ContextGatheringCommandBlock,
): RuntimeCommandPolicyBlockPayload {
  return {
    success: false,
    ...buildRuntimeCommandPayloadContext(context),
    ...block,
  }
}

export function buildRuntimeCommandSuccessPayload(input: RuntimeCommandPayloadContext & {
  stdout: string
  stderr?: string
  outputTruncated?: boolean
}): RuntimeCommandSuccessPayload {
  return {
    success: true,
    ...buildRuntimeCommandPayloadContext(input),
    stdout: input.stdout,
    stderr: input.stderr || "",
    ...(input.outputTruncated ? {
      outputTruncated: true,
      hint: "Output was truncated. Use head -n/tail -n/sed -n 'X,Yp' to read specific sections.",
    } : {}),
  }
}

export function buildRuntimeCommandFailurePayload(input: RuntimeCommandPayloadContext & {
  errorMessage: string
  exitCode?: number | string
  stdout: string
  stderr?: string
}): RuntimeCommandFailurePayload {
  const stderr = input.stderr || ""
  return {
    success: false,
    ...buildRuntimeCommandPayloadContext(input),
    error: input.errorMessage + getShellEscapingIssueHint(stderr, input.errorMessage),
    exitCode: input.exitCode,
    stdout: input.stdout,
    stderr,
  }
}

export function getPackageManagerRetrySuggestion(packageManager: PackageManagerName): string {
  switch (packageManager) {
    case "pnpm":
      return "Retry with pnpm for installs/scripts and pnpm exec for one-off CLIs. Do not use npm or npx in this workspace."
    case "npm":
      return "Retry with npm for installs/scripts and npx for one-off CLIs in this workspace."
    case "yarn":
      return "Retry with yarn for installs/scripts and yarn dlx for one-off CLIs in this workspace."
    case "bun":
      return "Retry with bun for installs/scripts and bunx for one-off CLIs in this workspace."
  }
}

export async function detectPreferredPackageManager(
  startDir: string,
  pathOps: RuntimeCommandPathOps,
  pathExists: ExecuteCommandPathExists,
): Promise<PreferredPackageManagerDetection | null> {
  let currentDir = pathOps.resolve(startDir)

  while (true) {
    for (const candidate of PACKAGE_MANAGER_LOCKFILES) {
      for (const lockfile of candidate.lockfiles) {
        const lockfilePath = pathOps.join(currentDir, lockfile)
        if (await pathExists(lockfilePath)) {
          return {
            name: candidate.name,
            lockfile,
            directory: currentDir,
          }
        }
      }
    }

    const parentDir = pathOps.dirname(currentDir)
    if (parentDir === currentDir) {
      return null
    }
    currentDir = parentDir
  }
}

export function detectPackageManagerMismatch(
  command: string,
  preferredPackageManager: PreferredPackageManagerInfo | null | undefined,
): PackageManagerMismatch | null {
  if (!preferredPackageManager) {
    return null
  }

  for (const match of command.matchAll(PACKAGE_MANAGER_COMMAND_REGEX)) {
    const token = match[2]
    const family = PACKAGE_MANAGER_TOKEN_FAMILY[token]
    if (family && family !== preferredPackageManager.name) {
      return {
        detectedPackageManager: preferredPackageManager.name,
        packageManagerLockfile: preferredPackageManager.packageManagerLockfile ?? preferredPackageManager.lockfile,
        offendingToken: token,
        error: `This workspace uses ${preferredPackageManager.name} (detected via ${preferredPackageManager.lockfile}), so '${token}' is the wrong package manager here.`,
        retrySuggestion: getPackageManagerRetrySuggestion(preferredPackageManager.name),
      }
    }
  }

  return null
}

export function detectContextGatheringCommandBlock(
  command: string,
  latestUserMessage: string | null | undefined,
): ContextGatheringCommandBlock | null {
  if (!latestUserMessage) {
    return null
  }

  if (!CONTEXT_GATHERING_REQUEST_REGEX.test(latestUserMessage)) {
    return null
  }

  if (USER_REQUEST_ALLOWS_VALIDATION_REGEX.test(latestUserMessage)) {
    return null
  }

  if (!HIGH_IMPACT_PACKAGE_MANAGER_COMMAND_REGEX.test(command) || !VALIDATION_OR_DEPENDENCY_COMMAND_REGEX.test(command)) {
    return null
  }

  const blockedCommandCategory = /\b(install|add|remove|uninstall|update|upgrade)\b/i.test(command)
    ? "dependency-mutation"
    : "package-manager-validation"

  return {
    blockedCommandCategory,
    latestUserRequestExcerpt: latestUserMessage.slice(0, 240),
    error: "The latest user request is a planning/context question, so package-manager test/build/install commands are blocked for this turn.",
    guidance: "For context-gathering or 'what's next' requests, prefer read-only inspection commands such as git status, ls, find, rg, sed, head, tail, or cat.",
    retrySuggestion: "Retry with read-only inspection commands. Only run package-manager test/build/install/lint/typecheck commands when the user explicitly asks for verification or after you have made code changes that need targeted validation.",
  }
}

export async function normalizeExecuteCommandWorkspacePaths(
  rawCommand: string,
  workingDirectory: string,
  pathExists: ExecuteCommandPathExists,
): Promise<ExecuteCommandWorkspacePathNormalization> {
  const currentHomePrefix = getUserHomePrefix(workingDirectory)
  if (!currentHomePrefix) {
    return { command: rawCommand }
  }

  const candidatePaths = Array.from(new Set(
    rawCommand.match(POSIX_WORKSPACE_PATH_REGEX) ?? [],
  ))

  if (candidatePaths.length === 0) {
    return { command: rawCommand }
  }

  let normalizedCommand = rawCommand
  const normalizedPaths: Array<{ from: string; to: string }> = []

  for (const candidatePath of candidatePaths) {
    if (!sharesWorkspaceRelativePath(candidatePath, workingDirectory)) {
      continue
    }

    if (await pathExists(candidatePath)) {
      continue
    }

    const candidateHomePrefix = getUserHomePrefix(candidatePath)
    if (!candidateHomePrefix || candidateHomePrefix === currentHomePrefix) {
      continue
    }

    const rewrittenPath = currentHomePrefix + candidatePath.slice(candidateHomePrefix.length)
    if (!(await pathExists(rewrittenPath))) {
      continue
    }

    normalizedCommand = normalizedCommand.split(candidatePath).join(rewrittenPath)
    normalizedPaths.push({ from: candidatePath, to: rewrittenPath })
  }

  return normalizedPaths.length > 0
    ? { command: normalizedCommand, normalizedPaths }
    : { command: rawCommand }
}

export function truncateRuntimeCommandOutput(
  output: string,
  options: { maxChars?: number; errorOutput?: boolean } = {},
): RuntimeCommandOutputTruncation {
  const maxChars = options.maxChars ?? DEFAULT_RUNTIME_COMMAND_MAX_OUTPUT_CHARS
  if (output.length <= maxChars) {
    return { output, outputTruncated: false }
  }

  const half = Math.floor(maxChars / 2)
  const totalLines = output.split("\n").length
  const totalBytes = output.length
  const head = output.substring(0, half)
  const tail = output.substring(output.length - half)
  const truncationNotice = options.errorOutput
    ? `\n\n... [OUTPUT TRUNCATED: ${totalBytes} bytes, ~${totalLines} lines. Use head/tail/sed to read specific ranges] ...\n\n`
    : `\n\n... [OUTPUT TRUNCATED: ${totalBytes} bytes, ~${totalLines} lines total. Showing first ${half} + last ${half} chars. Use head/tail/sed to read specific ranges, e.g.: sed -n '100,200p' file] ...\n\n`

  return {
    output: `${head}${truncationNotice}${tail}`,
    outputTruncated: true,
  }
}

export function hasShellEscapingIssue(stderr: string, errorMessage: string): boolean {
  return SHELL_ESCAPING_ISSUE_REGEX.test(stderr + errorMessage)
}

export function getShellEscapingIssueHint(stderr: string, errorMessage: string): string {
  return hasShellEscapingIssue(stderr, errorMessage)
    ? "\n\nHINT: This command likely failed due to shell escaping issues with special characters or long strings. Try writing the content to a file first (e.g., with write_file or echo > file), then reference the file in your command."
    : ""
}
