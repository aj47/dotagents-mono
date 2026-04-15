/**
 * `.agents` folder watcher.
 *
 * Watches the user-editable files in `~/.agents/` (and the optional workspace
 * overlay) and syncs external edits back into the in-memory stores. Without
 * this, a user editing `system-prompt.md`, `agents.md`, `layouts/ui.json`, or
 * `agents/<id>/agent.md` directly on disk would have their changes silently
 * overwritten the next time any unrelated code path called `configStore.save()`
 * or `agentProfileService.saveProfiles()`, because those writers serialize
 * from in-memory values that haven't seen the external edit.
 *
 * Watcher scope is intentionally narrow — it only triggers reloads for the
 * files that are round-tripped through the save paths guarded by
 * `skipIfUnchanged` in `safe-file.ts`. Other `.agents/` subtrees (skills,
 * tasks, memories) already have their own watchers.
 */

import fs from "fs"
import path from "path"
import { configStore, globalAgentsFolder, resolveWorkspaceAgentsFolder } from "./config"
import { agentProfileService } from "./agent-profile-service"
import { logApp } from "./debug"

const DEBOUNCE_MS = 250

let watchers: fs.FSWatcher[] = []
let debounceTimer: NodeJS.Timeout | null = null
let pendingReloads = {
  config: false,
  prompts: false,
  profiles: false,
}

function getCanonicalAgentsDirs(): string[] {
  const dirs = [globalAgentsFolder]
  const workspace = resolveWorkspaceAgentsFolder()
  if (workspace && workspace !== globalAgentsFolder) {
    dirs.push(workspace)
  }
  return dirs
}

function classifyChange(filename: string | null): void {
  if (!filename) {
    // Unknown change — be safe and reload everything watched.
    pendingReloads.config = true
    pendingReloads.prompts = true
    pendingReloads.profiles = true
    return
  }

  const normalized = filename.replace(/\\/g, "/")

  if (
    normalized === "dotagents-settings.json" ||
    normalized === "mcp.json" ||
    normalized === "models.json" ||
    normalized === "layouts/ui.json" ||
    normalized.startsWith("layouts/")
  ) {
    pendingReloads.config = true
    return
  }

  if (normalized === "system-prompt.md" || normalized === "agents.md") {
    pendingReloads.prompts = true
    return
  }

  if (normalized.startsWith("agents/") && normalized.endsWith(".md")) {
    pendingReloads.profiles = true
    return
  }

  if (normalized.startsWith("agents/") && normalized.endsWith("config.json")) {
    pendingReloads.profiles = true
    return
  }
}

function flushPendingReloads(): void {
  const snapshot = { ...pendingReloads }
  pendingReloads = { config: false, prompts: false, profiles: false }

  if (snapshot.config) {
    try {
      configStore.reload()
    } catch (error) {
      logApp("[AgentsFolderWatcher] Failed to reload config:", error)
    }
  }

  if (snapshot.profiles) {
    // A full profiles reload also re-runs `syncPromptsFromLayer`, so this
    // covers the prompts case too.
    try {
      agentProfileService.reload()
    } catch (error) {
      logApp("[AgentsFolderWatcher] Failed to reload agent profiles:", error)
    }
  } else if (snapshot.prompts) {
    try {
      agentProfileService.reloadPromptsFromLayer()
    } catch (error) {
      logApp("[AgentsFolderWatcher] Failed to reload prompts:", error)
    }
  }
}

/**
 * Resolve a raw watcher filename (which `fs.watch` reports relative to the
 * directory the watcher was attached to) into a path relative to `.agents`
 * root so `classifyChange` can match it. Returns `null` when the filename
 * falls outside `agentsRoot` (should not happen in practice).
 */
function resolveRelativeToAgentsRoot(
  agentsRoot: string,
  watchDir: string,
  filename: string,
): string | null {
  const absolute = path.resolve(watchDir, filename)
  const rel = path.relative(agentsRoot, absolute)
  if (!rel || rel.startsWith("..") || path.isAbsolute(rel)) return null
  return rel.replace(/\\/g, "/")
}

function handleWatcherEvent(
  agentsRoot: string,
  watchDir: string,
  eventType: string,
  filename: string | null,
): void {
  const relative = filename
    ? resolveRelativeToAgentsRoot(agentsRoot, watchDir, filename)
    : null
  classifyChange(relative)

  if (!pendingReloads.config && !pendingReloads.prompts && !pendingReloads.profiles) {
    return
  }

  logApp(
    `[AgentsFolderWatcher] Change detected: ${eventType} ${relative ?? filename ?? "(unknown)"}`,
  )

  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    debounceTimer = null
    flushPendingReloads()
  }, DEBOUNCE_MS)
}

function setupWatcher(
  agentsRoot: string,
  watchDir: string,
  recursive: boolean,
): fs.FSWatcher | null {
  try {
    const watcher = fs.watch(
      watchDir,
      recursive ? { recursive: true } : undefined,
      (eventType, filename) => {
        handleWatcherEvent(agentsRoot, watchDir, eventType, filename)
      },
    )
    watcher.on("error", (error) => {
      logApp(`[AgentsFolderWatcher] Watcher error for ${watchDir}:`, error)
    })
    return watcher
  } catch (error) {
    logApp(`[AgentsFolderWatcher] Failed to watch ${watchDir}:`, error)
    return null
  }
}

export function startAgentsFolderWatcher(): void {
  if (watchers.length > 0) {
    logApp("[AgentsFolderWatcher] Already running")
    return
  }

  for (const dir of getCanonicalAgentsDirs()) {
    try {
      fs.mkdirSync(dir, { recursive: true })
    } catch {
      // best-effort
    }

    if (process.platform === "linux") {
      // `fs.watch` recursive mode is unreliable on Linux; add targeted watchers
      // for the top-level dir, the `layouts/` dir, and each `agents/<id>/` dir.
      // Each watcher still resolves filenames relative to `dir` (the `.agents`
      // root) so `classifyChange` can match them regardless of which subdir
      // the event was reported against.
      const rootWatcher = setupWatcher(dir, dir, false)
      if (rootWatcher) watchers.push(rootWatcher)

      const layoutsDir = path.join(dir, "layouts")
      if (fs.existsSync(layoutsDir)) {
        const w = setupWatcher(dir, layoutsDir, false)
        if (w) watchers.push(w)
      }

      const agentsSubdir = path.join(dir, "agents")
      if (fs.existsSync(agentsSubdir)) {
        const w = setupWatcher(dir, agentsSubdir, false)
        if (w) watchers.push(w)
        try {
          for (const entry of fs.readdirSync(agentsSubdir, { withFileTypes: true })) {
            if (!entry.isDirectory()) continue
            const sub = setupWatcher(dir, path.join(agentsSubdir, entry.name), false)
            if (sub) watchers.push(sub)
          }
        } catch {
          // best-effort
        }
      }
    } else {
      const watcher = setupWatcher(dir, dir, true)
      if (watcher) watchers.push(watcher)
    }

    logApp(`[AgentsFolderWatcher] Started watching: ${dir}`)
  }
}

export function stopAgentsFolderWatcher(): void {
  for (const watcher of watchers) {
    try {
      watcher.close()
    } catch {
      // ignore
    }
  }
  if (watchers.length > 0) {
    logApp(`[AgentsFolderWatcher] Stopped ${watchers.length} watcher(s)`)
    watchers = []
  }
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
  // Reset any classified-but-not-yet-flushed reload flags so a later
  // restart doesn't fire a stale reload on its first event.
  pendingReloads = { config: false, prompts: false, profiles: false }
}
