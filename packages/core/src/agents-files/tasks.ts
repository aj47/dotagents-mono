import fs from "fs"
import path from "path"
import type { LoopConfig } from "../types"
import type { AgentsLayerPaths } from "./modular-config"
import { AGENTS_TASKS_DIR } from "./modular-config"
import { readTextFileIfExistsSync, safeWriteFileSync } from "./safe-file"
import {
  parseTaskMarkdown as parseSharedTaskMarkdown,
  stringifyTaskMarkdown as stringifySharedTaskMarkdown,
} from "@dotagents/shared/repeat-task-markdown"

export const TASK_CANONICAL_FILENAME = "task.md"

export type TaskOrigin = {
  filePath: string
}

export type LoadedTasksLayer = {
  tasks: LoopConfig[]
  originById: Map<string, TaskOrigin>
}

// ============================================================================
// Helpers
// ============================================================================

function sanitizeFileComponent(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_")
}

// ============================================================================
// Path helpers
// ============================================================================

export function getTasksDir(layer: AgentsLayerPaths): string {
  return path.join(layer.agentsDir, AGENTS_TASKS_DIR)
}

export function getTasksBackupDir(layer: AgentsLayerPaths): string {
  return path.join(layer.backupsDir, AGENTS_TASKS_DIR)
}

export function taskIdToDirPath(layer: AgentsLayerPaths, id: string): string {
  return path.join(getTasksDir(layer), sanitizeFileComponent(id))
}

export function taskIdToFilePath(layer: AgentsLayerPaths, id: string): string {
  return path.join(taskIdToDirPath(layer, id), TASK_CANONICAL_FILENAME)
}

// ============================================================================
// Stringify task.md
// ============================================================================

export function stringifyTaskMarkdown(task: LoopConfig): string {
  return stringifySharedTaskMarkdown(task)
}

// ============================================================================
// Parse task.md
// ============================================================================

export function parseTaskMarkdown(
  markdown: string,
  options: { fallbackId?: string; filePath?: string } = {},
): LoopConfig | null {
  return parseSharedTaskMarkdown(markdown, options) as LoopConfig | null
}

// ============================================================================
// Load all tasks from a layer
// ============================================================================

export function loadTasksLayer(layer: AgentsLayerPaths): LoadedTasksLayer {
  const tasks: LoopConfig[] = []
  const originById = new Map<string, TaskOrigin>()

  const tasksDir = getTasksDir(layer)

  try {
    if (!fs.existsSync(tasksDir) || !fs.statSync(tasksDir).isDirectory()) {
      return { tasks, originById }
    }

    const entries = fs.readdirSync(tasksDir, { withFileTypes: true })

    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      if (entry.name.startsWith(".")) continue

      const taskDir = path.join(tasksDir, entry.name)
      const taskMdPath = path.join(taskDir, TASK_CANONICAL_FILENAME)

      const raw = readTextFileIfExistsSync(taskMdPath, "utf8")
      if (raw === null) continue

      const task = parseTaskMarkdown(raw, {
        fallbackId: entry.name,
        filePath: taskMdPath,
      })
      if (!task) continue

      tasks.push(task)
      originById.set(task.id, { filePath: taskMdPath })
    }
  } catch {
    // best-effort
  }

  return { tasks, originById }
}

// ============================================================================
// Write a single task to task.md
// ============================================================================

export function writeTaskFile(
  layer: AgentsLayerPaths,
  task: LoopConfig,
  options: { maxBackups?: number } = {},
): void {
  const maxBackups = options.maxBackups ?? 10
  const backupDir = getTasksBackupDir(layer)

  const taskDir = taskIdToDirPath(layer, task.id)
  fs.mkdirSync(taskDir, { recursive: true })

  const mdContent = stringifyTaskMarkdown(task)
  const mdPath = path.join(taskDir, TASK_CANONICAL_FILENAME)
  safeWriteFileSync(mdPath, mdContent, { backupDir, maxBackups })
}

// ============================================================================
// Write all tasks for a layer
// ============================================================================

export function writeAllTaskFiles(
  layer: AgentsLayerPaths,
  tasks: LoopConfig[],
  options: { maxBackups?: number; onlyIfMissing?: boolean } = {},
): void {
  const tasksDir = getTasksDir(layer)
  fs.mkdirSync(tasksDir, { recursive: true })

  for (const task of tasks) {
    if (options.onlyIfMissing) {
      const mdPath = taskIdToFilePath(layer, task.id)
      if (fs.existsSync(mdPath)) continue
    }
    writeTaskFile(layer, task, options)
  }
}

// ============================================================================
// Delete a task's directory
// ============================================================================

export function deleteTaskFiles(layer: AgentsLayerPaths, taskId: string): void {
  const taskDir = taskIdToDirPath(layer, taskId)
  try {
    if (fs.existsSync(taskDir)) {
      fs.rmSync(taskDir, { recursive: true, force: true })
    }
  } catch {
    // best-effort
  }
}
