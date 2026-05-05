import {
  AGENTS_KNOWLEDGE_DIR,
  getAgentsKnowledgeDir,
  getAgentsKnowledgeBackupDir,
  knowledgeNoteSlugToDirPath,
  knowledgeNoteSlugToFilePath,
  buildKnowledgeNoteStorageLocation,
  stringifyKnowledgeNoteMarkdown,
  parseKnowledgeNoteMarkdown,
  loadAgentsKnowledgeNotesLayer,
  writeKnowledgeNoteFile,
} from "@dotagents/core"

export {
  AGENTS_KNOWLEDGE_DIR,
  getAgentsKnowledgeDir,
  getAgentsKnowledgeBackupDir,
  knowledgeNoteSlugToDirPath,
  knowledgeNoteSlugToFilePath,
  buildKnowledgeNoteStorageLocation,
  stringifyKnowledgeNoteMarkdown,
  parseKnowledgeNoteMarkdown,
  loadAgentsKnowledgeNotesLayer,
  writeKnowledgeNoteFile,
}
export type { AgentsKnowledgeNoteOrigin, LoadedAgentsKnowledgeNotesLayer } from "@dotagents/core"
