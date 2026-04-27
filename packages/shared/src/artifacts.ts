/**
 * Artifact types for agent-authored interactive HTML/CSS/JS mini-apps.
 *
 * Artifacts render in sandboxed iframes on the /artifacts page. Versions are
 * append-only; the current version is identified by `currentVersion`.
 *
 * Validation lives in the main process (apps/desktop/src/main/artifacts-service.ts).
 * This module intentionally has no runtime dependencies.
 */

export type ArtifactKind = "html"

export interface ArtifactFiles {
  "index.html"?: string
  "style.css"?: string
  "script.js"?: string
}

export interface ArtifactVersion {
  version: number
  files: ArtifactFiles
  note?: string
  createdAt: number
}

export interface ArtifactMeta {
  id: string
  title: string
  kind: ArtifactKind
  currentVersion: number
  createdAt: number
  updatedAt: number
  createdBy?: {
    source: "agent" | "user"
    sessionId?: string
    agentId?: string
  }
}

export interface Artifact extends ArtifactMeta {
  versions: ArtifactVersion[]
}

export interface ArtifactListItem extends ArtifactMeta {
  preview?: string
}

/**
 * Host <-> iframe bridge messages.
 * Keep narrow; add new types explicitly rather than allowing free-form payloads.
 */
export type ArtifactBridgeMessage =
  | { type: "ready" }
  | { type: "resize"; height: number }
  | { type: "form-submit"; payload: Record<string, unknown> }
  | { type: "error"; message: string }

export const ARTIFACT_FILE_BYTE_LIMIT = 512 * 1024
export const ARTIFACT_TOTAL_BYTE_LIMIT = 2 * 1024 * 1024
export const ARTIFACT_MAX_VERSIONS = 50

export function isArtifactBridgeMessage(
  value: unknown,
): value is ArtifactBridgeMessage {
  if (!value || typeof value !== "object") return false
  const type = (value as { type?: unknown }).type
  return (
    type === "ready" ||
    type === "resize" ||
    type === "form-submit" ||
    type === "error"
  )
}
