import { promises as fs } from "fs"
import path from "path"

import { dataFolder } from "./config"

export interface RuntimeFilesystemPaths {
  runtimeDir: string
  agentRegistryPath: string
  toolManifestPath: string
  toolSchemaDir: string
  sessionDir?: string
}

function sanitizeRuntimePathSegment(value: string): string {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    || "session"
}

export function getRuntimeFilesystemPaths(sessionId?: string): RuntimeFilesystemPaths {
  const runtimeDir = path.join(dataFolder, "runtime")
  const toolSchemaDir = path.join(runtimeDir, "tools", "schemas")
  const sanitizedSessionId = sessionId ? sanitizeRuntimePathSegment(sessionId) : undefined

  return {
    runtimeDir,
    agentRegistryPath: path.join(runtimeDir, "agents.json"),
    toolManifestPath: path.join(runtimeDir, "tools", "index.json"),
    toolSchemaDir,
    ...(sanitizedSessionId
      ? { sessionDir: path.join(runtimeDir, "sessions", sanitizedSessionId) }
      : {}),
  }
}

export function getRuntimeFilesystemEnv(sessionId?: string): Record<string, string> {
  const paths = getRuntimeFilesystemPaths(sessionId)
  return {
    DOTAGENTS_RUNTIME_DIR: paths.runtimeDir,
    DOTAGENTS_AGENT_REGISTRY: paths.agentRegistryPath,
    DOTAGENTS_TOOL_MANIFEST: paths.toolManifestPath,
    DOTAGENTS_TOOL_SCHEMA_DIR: paths.toolSchemaDir,
    ...(paths.sessionDir ? { DOTAGENTS_SESSION_DIR: paths.sessionDir } : {}),
  }
}

export async function ensureRuntimeFilesystemDirectories(sessionId?: string): Promise<RuntimeFilesystemPaths> {
  const paths = getRuntimeFilesystemPaths(sessionId)
  await fs.mkdir(paths.toolSchemaDir, { recursive: true })
  if (paths.sessionDir) {
    await fs.mkdir(paths.sessionDir, { recursive: true })
  }
  return paths
}
