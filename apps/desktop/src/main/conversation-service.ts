import fs from "fs"
import fsPromises from "fs/promises"
import path from "path"
import { conversationsFolder } from "./config"
import { logApp } from "./debug"
import {
  Conversation,
  ConversationBranchSource,
  ConversationCompactionMetadata,
  ConversationMessage,
  ConversationHistoryItem,
} from "../shared/types"
import { summarizeContent } from "./context-budget"
import { assertSafeConversationId, validateAndSanitizeConversationId } from "./conversation-id"
import { filterVisibleChatMessages, sanitizeMessageContentForDisplay } from "@dotagents/shared"
import { makeTextCompletionWithFetch } from "./llm-fetch"

// Threshold for compacting conversations on load
// When a conversation exceeds this many messages, older ones are summarized
const COMPACTION_MESSAGE_THRESHOLD = 20
// Number of recent messages to keep intact after compaction
const COMPACTION_KEEP_LAST = 10

// Debounce delay for writing the conversation index to disk (ms)
const INDEX_WRITE_DEBOUNCE_MS = 500
// On parse failures, try a bounded number of prefix candidates to recover a valid JSON object.
// Keep low to avoid blocking the Electron main process on large/corrupted files.
const CONVERSATION_REPAIR_MAX_PARSE_ATTEMPTS = 50
// Skip repair entirely for files larger than this (bytes). Large corrupted files would
// cause too many JSON.parse calls scanning for '}' characters (including inside strings).
const CONVERSATION_REPAIR_MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const MAX_SESSION_TITLE_CHARS = 80
const MAX_AGENT_SESSION_TITLE_WORDS = 10

export class ConversationService {
  private static instance: ConversationService | null = null

  // In-memory cache of the conversation index to avoid re-reading from disk
  private indexCache: ConversationHistoryItem[] | null = null
  // Debounce timer for writing the index to disk
  private indexWriteTimer: ReturnType<typeof setTimeout> | null = null
  // Promise that resolves when the current index write completes (for flush)
  private indexWritePromise: Promise<void> | null = null
  // Queue that serializes mutations per-conversation to prevent concurrent writes/corruption.
  private conversationMutationQueues = new Map<string, Promise<void>>()
  // Queue that serializes index cache mutations to prevent lost updates under concurrent saves.
  private indexMutationQueue: Promise<void> = Promise.resolve()
  // Flag to block new per-conversation mutations during deleteAllConversations.
  private deletingAll = false

  static getInstance(): ConversationService {
    if (!ConversationService.instance) {
      ConversationService.instance = new ConversationService()
    }
    return ConversationService.instance
  }

  private constructor() {
    this.ensureConversationsFolder()
  }

  private ensureConversationsFolder() {
    if (!fs.existsSync(conversationsFolder)) {
      fs.mkdirSync(conversationsFolder, { recursive: true })
    }
  }

  private getConversationPath(conversationId: string): string {
    const resolved = path.resolve(conversationsFolder, `${conversationId}.json`)
    const resolvedFolder = path.resolve(conversationsFolder)
    if (!resolved.startsWith(resolvedFolder + path.sep)) {
      throw new Error(`Invalid conversation ID: path traversal detected`)
    }
    return resolved
  }

  private getConversationIndexPath(): string {
    return path.join(conversationsFolder, "index.json")
  }

  private generateConversationId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Public method to generate a conversation ID.
   * Used by remote-server when creating new conversations without a provided ID.
   */
  generateConversationIdPublic(): string {
    return this.generateConversationId()
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateConversationTitle(firstMessage: string): string {
    const cleanedMessage = sanitizeMessageContentForDisplay(firstMessage).trim()
    const source = cleanedMessage || firstMessage.trim()
    // Generate a title from the first message (first 50 characters)
    const title = source.slice(0, 50)
    return title.length < source.length ? `${title}...` : title
  }

  private normalizeConversationTitle(title: string, maxWords?: number): string {
    const cleaned = sanitizeMessageContentForDisplay(title)
      .replace(/\s+/g, " ")
      .replace(/^["'“”‘’\s]+|["'“”‘’\s]+$/g, "")
      .trim()

    if (!cleaned) {
      return ""
    }

    const wordLimited = maxWords
      ? cleaned.split(" ").filter(Boolean).slice(0, maxWords).join(" ")
      : cleaned

    const normalized = wordLimited.slice(0, MAX_SESSION_TITLE_CHARS).trim()
    return normalized
  }

  private getAutoTitleSeed(conversation: Conversation): {
    fallbackTitle: string
    firstUserMessage: string
    firstAssistantMessage: string
  } | null {
    const messages = this.getStoredRawMessages(conversation)
    const firstUserMessage = messages.find((message) => message.role === "user" && message.content?.trim())?.content?.trim()
    const firstAssistantMessage = messages.find((message) => message.role === "assistant" && message.content?.trim())?.content?.trim()

    if (!firstUserMessage || !firstAssistantMessage) {
      return null
    }

    const fallbackTitle = this.generateConversationTitle(firstUserMessage)
    const currentTitle = this.normalizeConversationTitle(conversation.title)
    if (currentTitle !== this.normalizeConversationTitle(fallbackTitle)) {
      return null
    }

    return {
      fallbackTitle,
      firstUserMessage,
      firstAssistantMessage,
    }
  }

  private async generateAgentSessionTitle(
    firstUserMessage: string,
    firstAssistantMessage: string,
    sessionId?: string,
  ): Promise<string | null> {
    const prompt = [
      "Generate a short session title for this conversation.",
      `Requirements: maximum ${MAX_AGENT_SESSION_TITLE_WORDS} words, no quotes, no markdown, plain text only.`,
      "Prefer a specific topic label over a generic sentence fragment.",
      "",
      `User: ${firstUserMessage.slice(0, 400)}`,
      `Assistant: ${firstAssistantMessage.slice(0, 600)}`,
      "",
      "Return only the title.",
    ].join("\n")

    try {
      const completion = await makeTextCompletionWithFetch(prompt, undefined, sessionId)
      return this.normalizeConversationTitle(completion, MAX_AGENT_SESSION_TITLE_WORDS) || null
    } catch (error) {
      logApp("[ConversationService] Failed to auto-generate session title:", error)
      return null
    }
  }

  /**
   * Load the conversation index into memory if not already cached.
   */
  private async ensureIndexLoaded(): Promise<ConversationHistoryItem[]> {
    if (this.indexCache !== null) {
      return this.indexCache
    }

    let loadedIndex: ConversationHistoryItem[] = []
    try {
      const indexPath = this.getConversationIndexPath()
      const data = await fsPromises.readFile(indexPath, "utf8")
      const parsed = JSON.parse(data)
      loadedIndex = Array.isArray(parsed) ? parsed : []
    } catch {
      // File doesn't exist or is corrupted — start fresh
      loadedIndex = []
    }

    this.indexCache = loadedIndex

    const conversationFileCount = await this.getConversationFileCount()
    if (conversationFileCount > loadedIndex.length) {
      return this.rebuildConversationIndexFromDisk("conversation files outnumber indexed entries")
    }

    return this.indexCache!
  }

  private async getConversationFileCount(): Promise<number> {
    try {
      const entries = await fsPromises.readdir(conversationsFolder)
      return entries.filter((entry) => entry.endsWith(".json") && entry !== "index.json").length
    } catch {
      return 0
    }
  }

  private buildConversationHistoryItem(conversation: Conversation): ConversationHistoryItem {
    const storedMessages = this.getStoredRawMessages(conversation)
    const visibleMessages = filterVisibleChatMessages(storedMessages)
    const lastMessage = visibleMessages[visibleMessages.length - 1] || storedMessages[storedMessages.length - 1]

    return {
      id: conversation.id,
      title: conversation.title,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      messageCount: this.getRepresentedMessageCount(conversation),
      lastMessage: lastMessage?.content || "",
      preview: this.generatePreview(visibleMessages),
    }
  }

  private async parseConversationData(
    conversationId: string,
    conversationData: string,
    conversationPath?: string,
    persistRepairs: boolean = true,
  ): Promise<Conversation | null> {
    try {
      const conversation = JSON.parse(conversationData) as unknown
      if (!this.isValidConversationShape(conversation)) {
        logApp(`[ConversationService] Invalid conversation shape for ${conversationId}`)
        return null
      }

      const normalizedConversation = conversation as Conversation
      if (persistRepairs && conversationPath) {
        await this.persistStorageMetadataIfNeeded(conversationId, conversationPath, normalizedConversation)
      }
      return normalizedConversation
    } catch (error) {
      const repairedConversation = this.tryRepairConversationFromCorruptedData(conversationData)
      if (!repairedConversation) {
        logApp(`[ConversationService] Failed to parse conversation ${conversationId}; unable to repair.`, error)
        return null
      }

      if (persistRepairs && conversationPath) {
        try {
          await this.writeConversationFileAtomic(conversationPath, JSON.stringify(repairedConversation, null, 2))
          logApp(`[ConversationService] Repaired corrupted conversation file: ${conversationId}`)
        } catch (repairSaveError) {
          logApp(
            `[ConversationService] Recovered conversation ${conversationId} in-memory, but failed to persist repaired file.`,
            repairSaveError,
          )
        }

        await this.persistStorageMetadataIfNeeded(conversationId, conversationPath, repairedConversation)
      }

      return repairedConversation
    }
  }

  private async rebuildConversationIndexFromDisk(reason: string): Promise<ConversationHistoryItem[]> {
    try {
      this.ensureConversationsFolder()
      const entries = await fsPromises.readdir(conversationsFolder)
      const conversationFiles = entries
        .filter((entry) => entry.endsWith(".json") && entry !== "index.json")
        .sort()

      const rebuiltIndex: ConversationHistoryItem[] = []
      for (const entry of conversationFiles) {
        const conversationId = entry.replace(/\.json$/u, "")
        const conversationPath = this.getConversationPath(conversationId)

        let conversationData: string
        try {
          conversationData = await fsPromises.readFile(conversationPath, "utf8")
        } catch {
          continue
        }

        const conversation = await this.parseConversationData(
          conversationId,
          conversationData,
          conversationPath,
          false,
        )
        if (!conversation) {
          continue
        }

        rebuiltIndex.push(this.buildConversationHistoryItem(conversation))
      }

      rebuiltIndex.sort((a, b) => b.updatedAt - a.updatedAt)
      this.indexCache = rebuiltIndex
      await this.writeIndexToDisk()
      logApp(`[ConversationService] Rebuilt conversation index from disk (${reason})`, {
        rebuiltCount: rebuiltIndex.length,
      })
      return rebuiltIndex
    } catch (error) {
      logApp("[ConversationService] Error rebuilding conversation index from disk:", error)
      return this.indexCache ?? []
    }
  }

  /**
   * Serialize index-cache mutations so async saves cannot clobber each other.
   */
  private enqueueIndexMutation<T>(mutation: () => Promise<T>): Promise<T> {
    const run = this.indexMutationQueue.then(mutation)
    this.indexMutationQueue = run.then(() => undefined, () => undefined)
    return run
  }

  /**
   * Update the in-memory index and schedule a debounced write to disk.
   * The in-memory cache is updated immediately so subsequent reads are consistent.
   * The disk write is debounced so rapid successive calls (e.g. during agent sessions)
   * collapse into a single I/O operation.
   */
  private async updateConversationIndex(conversation: Conversation): Promise<void> {
    await this.enqueueIndexMutation(async () => {
      try {
        let index = await this.ensureIndexLoaded()

        // Remove existing entry if it exists
        index = index.filter((item) => item.id !== conversation.id)

        // Create new index entry
        const indexItem = this.buildConversationHistoryItem(conversation)

        // Add to beginning of array (most recent first)
        index.unshift(indexItem)

        // Update in-memory cache immediately
        this.indexCache = index

        // Schedule debounced disk write
        this.scheduleDiskWrite()
      } catch (error) {
        logApp("[ConversationService] Error updating conversation index:", error)
      }
    })
  }

  /**
   * Schedule (or reschedule) a debounced write of the in-memory index to disk.
   */
  private scheduleDiskWrite(): void {
    if (this.indexWriteTimer) {
      clearTimeout(this.indexWriteTimer)
    }
    this.indexWriteTimer = setTimeout(() => {
      this.indexWriteTimer = null
      this.indexWritePromise = this.writeIndexToDisk()
      this.indexWritePromise.finally(() => {
        this.indexWritePromise = null
      })
    }, INDEX_WRITE_DEBOUNCE_MS)
  }

  /**
   * Write the in-memory index cache to disk asynchronously.
   */
  private async writeIndexToDisk(): Promise<void> {
    if (!this.indexCache) return
    try {
      const indexPath = this.getConversationIndexPath()
      await fsPromises.writeFile(indexPath, JSON.stringify(this.indexCache, null, 2))
    } catch (error) {
      logApp("[ConversationService] Error writing index to disk:", error)
    }
  }

  /**
   * Serialize mutations for a single conversation to avoid concurrent read-modify-write races.
   */
  private enqueueConversationMutation<T>(
    conversationId: string,
    mutation: () => Promise<T>,
  ): Promise<T | null> {
    if (this.deletingAll) {
      // Return null instead of rejecting so callers (loadConversation, addMessageToConversation)
      // that expect null-on-failure don't surface unhandled errors to the UI during delete-all.
      return Promise.resolve(null)
    }
    const previous = this.conversationMutationQueues.get(conversationId) ?? Promise.resolve()
    const run = previous.then(mutation)
    const settled = run.then(() => undefined, () => undefined)

    this.conversationMutationQueues.set(conversationId, settled)
    settled.finally(() => {
      if (this.conversationMutationQueues.get(conversationId) === settled) {
        this.conversationMutationQueues.delete(conversationId)
      }
    })

    return run
  }

  /**
   * Await the latest queued mutation for a conversation, if any.
   */
  private async waitForConversationMutation(conversationId: string): Promise<void> {
    const pending = this.conversationMutationQueues.get(conversationId)
    if (pending) {
      await pending
    }
  }

  /**
   * Await all in-flight conversation mutations (used before destructive global deletes).
   */
  private async waitForAllConversationMutations(): Promise<void> {
    const pending = [...this.conversationMutationQueues.values()]
    if (pending.length === 0) return
    await Promise.allSettled(pending)
  }

  /**
   * Persist a conversation file atomically to avoid partially-written/corrupted JSON files.
   */
  private async writeConversationFileAtomic(conversationPath: string, payload: string): Promise<void> {
    const tempPath = `${conversationPath}.${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`
    try {
      await fsPromises.writeFile(tempPath, payload)
      await fsPromises.rename(tempPath, conversationPath)
    } catch (error) {
      try {
        await fsPromises.unlink(tempPath)
      } catch {
        // Best-effort cleanup
      }
      throw error
    }
  }

  /**
   * Validate minimal shape before accepting parsed JSON as a conversation.
   */
  private isValidConversationShape(value: unknown): value is Conversation {
    if (!value || typeof value !== "object") return false
    const maybe = value as Partial<Conversation>
    return (
      typeof maybe.id === "string" &&
      typeof maybe.title === "string" &&
      typeof maybe.createdAt === "number" &&
      typeof maybe.updatedAt === "number" &&
      Array.isArray(maybe.messages)
    )
  }

  /**
   * Attempt to recover a valid conversation JSON by trimming trailing garbage and reparsing.
   * This is only used when the file failed normal JSON.parse().
   */
  private tryRepairConversationFromCorruptedData(raw: string): Conversation | null {
    if (raw.length > CONVERSATION_REPAIR_MAX_FILE_SIZE) {
      logApp(`[ConversationService] Skipping repair: file too large (${raw.length} bytes)`)
      return null
    }

    const trimmed = raw.trim()
    if (!trimmed.startsWith("{")) {
      return null
    }

    let attempts = 0
    for (let i = trimmed.length - 1; i >= 0; i--) {
      if (trimmed[i] !== "}") {
        continue
      }
      attempts++
      if (attempts > CONVERSATION_REPAIR_MAX_PARSE_ATTEMPTS) {
        break
      }

      const candidate = trimmed.slice(0, i + 1)
      try {
        const parsed = JSON.parse(candidate) as unknown
        if (this.isValidConversationShape(parsed)) {
          return parsed
        }
      } catch {
        // Keep scanning earlier object boundaries.
      }
    }

    return null
  }

  private async loadConversationFromDisk(conversationId: string): Promise<Conversation | null> {
    const conversationPath = this.getConversationPath(conversationId)

    let conversationData: string
    try {
      conversationData = await fsPromises.readFile(conversationPath, "utf8")
    } catch (error) {
      // File doesn't exist or is unreadable.
      return null
    }

    return this.parseConversationData(conversationId, conversationData, conversationPath, true)
  }

  private async persistStorageMetadataIfNeeded(
    conversationId: string,
    conversationPath: string,
    conversation: Conversation,
  ): Promise<void> {
    const storageMetadataChanged = this.syncConversationStorageMetadata(conversation)
    if (!storageMetadataChanged) {
      return
    }

    try {
      await this.writeConversationFileAtomic(
        conversationPath,
        JSON.stringify(conversation, null, 2),
      )
      await this.updateConversationIndex(conversation)
      logApp(`[ConversationService] Normalized conversation storage metadata for ${conversationId}`)
    } catch (persistError) {
      logApp(
        `[ConversationService] Failed to persist storage metadata normalization for ${conversationId}`,
        persistError,
      )
    }
  }

  private async saveConversationUnlocked(
    conversation: Conversation,
    preserveTimestamp: boolean = false,
  ): Promise<void> {
    this.ensureConversationsFolder()
    // Validate the conversation ID before building the path (defense-in-depth).
    // getConversationPath checks for path traversal via resolved-path comparison;
    // this adds character-level rejection so untrusted IDs are caught early.
    this.assertSafeConversationId(conversation.id)
    const conversationPath = this.getConversationPath(conversation.id)

    // Update the updatedAt timestamp unless preserving client-supplied value
    if (!preserveTimestamp) {
      conversation.updatedAt = Date.now()
    }

    this.syncConversationStorageMetadata(conversation)

    await this.writeConversationFileAtomic(
      conversationPath,
      JSON.stringify(conversation, null, 2),
    )

    // Update the index (in-memory immediately, disk write debounced)
    await this.updateConversationIndex(conversation)
  }

  /**
   * Flush any pending debounced index write to disk immediately.
   * Called before operations that need a consistent on-disk state (e.g. delete).
   */
  private async flushIndexWrite(): Promise<void> {
    if (this.indexWriteTimer) {
      clearTimeout(this.indexWriteTimer)
      this.indexWriteTimer = null
    }
    // If a write is already in-flight, wait for it
    if (this.indexWritePromise) {
      await this.indexWritePromise
    }
    // Persist the latest cache snapshot after waiting so stale writes
    // cannot overwrite destructive operations (delete/reset).
    await this.writeIndexToDisk()
  }

  private generatePreview(messages: ConversationMessage[]): string {
    const sanitizePreviewText = (value: string) =>
      value
        .replace(/!\[[^\]]*\]\((?:data:image\/[^)]+|[^)]+)\)/gi, "[Image]")
        .replace(/\s+/g, " ")
        .trim()

    // Generate a preview from the first few messages
    const previewMessages = messages.slice(0, 3)
    const preview = previewMessages
      .map((msg) => `${msg.role}: ${sanitizePreviewText(msg.content || "").slice(0, 100)}`)
      .join(" | ")
    return preview.length > 200 ? `${preview.slice(0, 200)}...` : preview
  }

  private hasSummaryMessages(messages: ConversationMessage[]): boolean {
    return messages.some((message) => message.isSummary)
  }

  private getSummaryRepresentationCount(messages: ConversationMessage[]): number {
    const summarizedMessageCount = messages
      .filter((message) => message.isSummary)
      .reduce((total, message) => total + (message.summarizedMessageCount ?? 0), 0)

    return summarizedMessageCount + messages.filter((message) => !message.isSummary).length
  }

  private getStoredRawMessages(conversation: Conversation): ConversationMessage[] {
    if (Array.isArray(conversation.rawMessages) && conversation.rawMessages.length > 0) {
      return conversation.rawMessages
    }

    return conversation.messages
  }

  private getRepresentedMessageCount(conversation: Conversation): number {
    if (this.hasSummaryMessages(conversation.messages)) {
      return this.getSummaryRepresentationCount(conversation.messages)
    }

    return this.getStoredRawMessages(conversation).length
  }

  private syncConversationStorageMetadata(conversation: Conversation): boolean {
    let changed = false

    if (Array.isArray(conversation.rawMessages) && conversation.rawMessages.length === 0) {
      delete conversation.rawMessages
      changed = true
    }

    const hasSummaryMessages = this.hasSummaryMessages(conversation.messages)
    const hasRawMessages = Array.isArray(conversation.rawMessages) && conversation.rawMessages.length > 0
    const isLegacyPartial = hasSummaryMessages && !hasRawMessages

    if (!hasSummaryMessages && !hasRawMessages) {
      if (conversation.compaction) {
        delete conversation.compaction
        changed = true
      }
      return changed
    }

    const nextCompaction: ConversationCompactionMetadata = {
      ...conversation.compaction,
      rawHistoryPreserved: !isLegacyPartial,
      storedRawMessageCount: hasRawMessages ? conversation.rawMessages?.length : undefined,
      representedMessageCount: this.getRepresentedMessageCount(conversation),
      partialReason: isLegacyPartial ? "legacy_summary_without_raw_messages" : undefined,
    }

    if (!hasSummaryMessages) {
      delete nextCompaction.compactedAt
    }

    const previousCompactionJson = conversation.compaction
      ? JSON.stringify(conversation.compaction)
      : null
    const nextCompactionJson = JSON.stringify(nextCompaction)

    if (previousCompactionJson !== nextCompactionJson) {
      conversation.compaction = nextCompaction
      changed = true
    }

    return changed
  }

  private isConsecutiveDuplicate(
    last: ConversationMessage | undefined,
    role: ConversationMessage["role"],
    content: string,
  ): boolean {
    const incomingContent = (content || "").trim()
    const lastContent = (last?.content || "").trim()
    return !!last && last.role === role && lastContent === incomingContent
  }


  async saveConversation(conversation: Conversation, preserveTimestamp: boolean = false): Promise<void> {
    await this.enqueueConversationMutation(conversation.id, async () => {
      await this.saveConversationUnlocked(conversation, preserveTimestamp)
    })
  }

  async loadConversation(conversationId: string): Promise<Conversation | null> {
    // Enqueue as a mutation so that any repair save inside loadConversationFromDisk()
    // is serialized with other writes, preventing lost-update races.
    return this.enqueueConversationMutation(conversationId, async () => {
      return this.loadConversationFromDisk(conversationId)
    })
  }

  /**
   * Load a conversation and compact it if it exceeds the message threshold.
   * Use this when loading conversations for continued use (e.g., in agent mode).
   * The compaction is persisted to disk, so subsequent loads will be faster.
   *
   * @param conversationId - The ID of the conversation to load
   * @param sessionId - Optional session ID for cancellation support during summarization
   * @returns The conversation (possibly compacted), or null if not found
   */
  async loadConversationWithCompaction(conversationId: string, sessionId?: string): Promise<Conversation | null> {
    const conversation = await this.loadConversation(conversationId)
    if (!conversation) {
      return null
    }

    // Compact if needed (this will save to disk if compaction occurs)
    // Best-effort: if compaction fails, return the original conversation
    try {
      return await this.compactOnLoad(conversation, sessionId)
    } catch (error) {
      logApp(`Failed to compact conversation ${conversationId}, returning original: ${error}`)
      return conversation
    }
  }

  async getConversationHistory(): Promise<ConversationHistoryItem[]> {
    try {
      const index = await this.ensureIndexLoaded()

      // Sort by updatedAt descending (most recent first)
      const sorted = [...index].sort((a, b) => b.updatedAt - a.updatedAt)
      return sorted
    } catch (error) {
      logApp("[ConversationService] Error loading conversation history:", error)
      return []
    }
  }

  async deleteConversation(conversationId: string): Promise<void> {
    await this.enqueueConversationMutation(conversationId, async () => {
      const conversationPath = this.getConversationPath(conversationId)

      // Delete conversation file
      try {
        await fsPromises.unlink(conversationPath)
      } catch {
        // File may not exist — ignore
      }

      await this.enqueueIndexMutation(async () => {
        // Update in-memory index cache
        let index = await this.ensureIndexLoaded()
        index = index.filter((item) => item.id !== conversationId)
        this.indexCache = index

        // Flush to disk immediately for deletes (important for consistency)
        await this.flushIndexWrite()
      })
    })
  }

  async createConversation(
    firstMessage: string,
    role: "user" | "assistant" = "user",
  ): Promise<Conversation> {
    const conversationId = this.generateConversationId()
    return this.createConversationWithId(conversationId, firstMessage, role)
  }

  /**
   * Validate that a conversation ID is safe for use as a filename.
   * Throws on dangerous characters but does NOT sanitize (no silent mutations).
   * Used as a guard in write paths where the ID is already established.
   */
  private assertSafeConversationId(conversationId: string): void {
    assertSafeConversationId(conversationId)
  }

  /**
   * Validate and sanitize a conversation ID to prevent path traversal attacks.
   * Rejects dangerous values and normalizes unsupported characters for storage.
   */
  private validateConversationId(conversationId: string): string {
    // Sanitize: only allow alphanumeric, underscore, hyphen, at sign, and dot.
    // This covers formats like: conv_123_abc, whatsapp_61406142826@s.whatsapp.net.
    const sanitized = validateAndSanitizeConversationId(conversationId)
    // Ensure the sanitized ID doesn't resolve outside conversations folder
    const resolvedPath = path.resolve(conversationsFolder, `${sanitized}.json`)
    if (!resolvedPath.startsWith(path.resolve(conversationsFolder))) {
      throw new Error(`Invalid conversation ID: path traversal detected`)
    }
    return sanitized
  }

  /**
   * Create a conversation with a specific ID.
   * Used for external integrations (like WhatsApp) that need to use their own identifiers.
   */
  async createConversationWithId(
    conversationId: string,
    firstMessage: string,
    role: "user" | "assistant" = "user",
  ): Promise<Conversation> {
    // Validate and sanitize the externally-provided conversation ID
    const validatedId = this.validateConversationId(conversationId)
    const messageId = this.generateMessageId()
    const now = Date.now()

    const message: ConversationMessage = {
      id: messageId,
      role,
      content: firstMessage,
      timestamp: now,
    }

    const conversation: Conversation = {
      id: validatedId,
      title: this.generateConversationTitle(firstMessage),
      createdAt: now,
      updatedAt: now,
      messages: [message],
    }

    await this.enqueueConversationMutation(validatedId, async () => {
      await this.saveConversationUnlocked(conversation)
    })
    return conversation
  }

  async addMessageToConversation(
    conversationId: string,
    content: string,
    role: "user" | "assistant" | "tool",
    toolCalls?: Array<{ name: string; arguments: any }>,
    toolResults?: Array<{ success: boolean; content: string; error?: string }>,
  ): Promise<Conversation | null> {
    return this.enqueueConversationMutation(conversationId, async () => {
      try {
        const conversation = await this.loadConversationFromDisk(conversationId)
        if (!conversation) {
          return null
        }

        const storedMessages = this.getStoredRawMessages(conversation)

        // Idempotency guard: avoid pushing consecutive duplicate messages
        const last = storedMessages[storedMessages.length - 1]
        if (this.isConsecutiveDuplicate(last, role, content)) {
          conversation.updatedAt = Date.now()
          await this.saveConversationUnlocked(conversation)
          return conversation
        }

        const messageId = this.generateMessageId()
        const message: ConversationMessage = {
          id: messageId,
          role,
          content,
          timestamp: Date.now(),
          toolCalls,
          toolResults,
        }

        conversation.messages.push(message)
        if (Array.isArray(conversation.rawMessages) && conversation.rawMessages.length > 0) {
          conversation.rawMessages.push(message)
        }
        await this.saveConversationUnlocked(conversation)

        return conversation
      } catch (error) {
        return null
      }
    })
  }

  async renameConversationTitle(conversationId: string, title: string): Promise<Conversation | null> {
    const normalizedTitle = this.normalizeConversationTitle(title)
    if (!normalizedTitle) {
      return null
    }

    return this.enqueueConversationMutation(conversationId, async () => {
      const conversation = await this.loadConversationFromDisk(conversationId)
      if (!conversation) {
        return null
      }

      if (this.normalizeConversationTitle(conversation.title) === normalizedTitle) {
        return conversation
      }

      conversation.title = normalizedTitle
      await this.saveConversationUnlocked(conversation)
      return conversation
    })
  }

  /**
   * Branch a conversation from a specific message index.
   * Creates a new conversation containing messages up to (and including) the given index.
   * Stores branch provenance metadata on the new conversation.
   */
  async branchConversation(
    sourceConversationId: string,
    messageIndex: number,
  ): Promise<Conversation | null> {
    const sourceConversation = await this.loadConversation(sourceConversationId)
    if (!sourceConversation) {
      logApp(`[ConversationService] branchConversation: source conversation ${sourceConversationId} not found`)
      return null
    }

    const sourceMessages = this.getStoredRawMessages(sourceConversation)
    if (messageIndex < 0 || messageIndex >= sourceMessages.length) {
      logApp(`[ConversationService] branchConversation: invalid messageIndex ${messageIndex} (${sourceMessages.length} messages)`)
      return null
    }

    const branchedMessages = sourceMessages.slice(0, messageIndex + 1)
    const newConversationId = this.generateConversationId()
    const now = Date.now()

    // Re-generate message IDs for the cloned messages to avoid collisions
    const clonedMessages: ConversationMessage[] = branchedMessages.map((msg) => ({
      ...msg,
      id: this.generateMessageId(),
    }))

    const branchSource: ConversationBranchSource = {
      sourceConversationId,
      sourceMessageIndex: messageIndex,
      branchedAt: now,
    }

    const branchedConversation: Conversation = {
      id: newConversationId,
      title: `Branch: ${sourceConversation.title}`,
      createdAt: now,
      updatedAt: now,
      messages: clonedMessages,
      branchSource,
    }

    await this.enqueueConversationMutation(newConversationId, async () => {
      await this.saveConversationUnlocked(branchedConversation)
    })

    logApp(`[ConversationService] Branched conversation ${sourceConversationId} at message ${messageIndex} -> ${newConversationId}`)
    return branchedConversation
  }

  async maybeAutoGenerateConversationTitle(conversationId: string, sessionId?: string): Promise<Conversation | null> {
    const conversation = await this.loadConversation(conversationId)
    if (!conversation) {
      return null
    }

    const seed = this.getAutoTitleSeed(conversation)
    if (!seed) {
      return null
    }

    const generatedTitle = await this.generateAgentSessionTitle(
      seed.firstUserMessage,
      seed.firstAssistantMessage,
      sessionId,
    )

    if (!generatedTitle || generatedTitle === this.normalizeConversationTitle(seed.fallbackTitle)) {
      return null
    }

    return this.enqueueConversationMutation(conversationId, async () => {
      const latestConversation = await this.loadConversationFromDisk(conversationId)
      if (!latestConversation) {
        return null
      }

      const latestSeed = this.getAutoTitleSeed(latestConversation)
      if (!latestSeed || latestSeed.fallbackTitle !== seed.fallbackTitle) {
        return latestConversation
      }

      latestConversation.title = generatedTitle
      await this.saveConversationUnlocked(latestConversation)
      return latestConversation
    })
  }

  /**
   * Compact a conversation by summarizing older messages.
   * Called when loading a conversation that exceeds the message threshold.
   * This is a lazy compaction strategy - we only compact when the conversation
   * is loaded, not during the agent loop.
   *
   * @param conversation - The conversation to compact
   * @param sessionId - Optional session ID for cancellation support during summarization
   * @returns The compacted conversation
   */
  private async compactOnLoad(conversation: Conversation, sessionId?: string): Promise<Conversation> {
    const fullMessageHistory = this.getStoredRawMessages(conversation)
    const messageCount = fullMessageHistory.length
    if (messageCount <= COMPACTION_MESSAGE_THRESHOLD) {
      return conversation
    }

    const activeNonSummaryCount = conversation.messages.filter((message) => !message.isSummary).length
    if (
      Array.isArray(conversation.rawMessages) &&
      conversation.rawMessages.length > 0 &&
      this.hasSummaryMessages(conversation.messages) &&
      this.getRepresentedMessageCount(conversation) === messageCount &&
      activeNonSummaryCount <= COMPACTION_KEEP_LAST
    ) {
      return conversation
    }

    // Calculate how many messages to summarize
    const messagesToSummarize = fullMessageHistory.slice(0, messageCount - COMPACTION_KEEP_LAST)
    const messagesToKeep = fullMessageHistory.slice(messageCount - COMPACTION_KEEP_LAST)

    if (messagesToSummarize.length === 0) {
      return conversation
    }

    logApp(`[conversationService] compactOnLoad: compacting ${messagesToSummarize.length} messages for ${conversation.id}`)

    // Build a summary of the older messages
    const summaryInput = messagesToSummarize
      .map((m) => {
        const sanitizedContent = sanitizeMessageContentForDisplay(m.content || "")
        let text = `${m.role}: ${sanitizedContent.substring(0, 500) || "(empty)"}`

        // Include tool calls if present
        if (m.toolCalls && m.toolCalls.length > 0) {
          const toolCallsStr = m.toolCalls
            .map((tc) => {
              const argsStr = JSON.stringify(tc.arguments).substring(0, 200)
              return `${tc.name}(${argsStr})`
            })
            .join(", ")
          text += `\nTool calls: ${toolCallsStr}`
        }

        // Include tool results if present
        if (m.toolResults && m.toolResults.length > 0) {
          const toolResultsStr = m.toolResults
            .map((tr) => {
              const status = tr.success ? "success" : "error"
              const content = (tr.error || tr.content || "").substring(0, 200)
              return `${status}: ${content}`
            })
            .join(", ")
          text += `\nTool results: ${toolResultsStr}`
        }

        return text
      })
      .join("\n\n")

    let summaryContent: string
    const summarizationPrompt = `Summarize this conversation history concisely, preserving key facts, decisions, and context:\n\n${summaryInput}`
    try {
      summaryContent = await summarizeContent(summarizationPrompt, sessionId)
      // summarizeContent() swallows errors internally and returns the input text on failure.
      // Detect this by checking if the result equals or contains the full prompt (failure case).
      // A successful summary should be significantly shorter than the prompt.
      if (summaryContent === summarizationPrompt || summaryContent.length >= summarizationPrompt.length * 0.9) {
        logApp(`[conversationService] compactOnLoad: summarization likely failed (output too similar to input), keeping original`)
        return conversation
      }
    } catch (error) {
      logApp(`[conversationService] compactOnLoad: summarization failed, keeping original:`, error)
      return conversation
    }

    // Create summary message
    const summaryMessage: ConversationMessage = {
      id: this.generateMessageId(),
      role: "assistant",
      content: summaryContent,
      timestamp: messagesToSummarize[0]?.timestamp || Date.now(),
      isSummary: true,
      summarizedMessageCount: messagesToSummarize.length,
    }

    // Create compacted conversation (don't mutate original)
    const compactedConversation: Conversation = {
      ...conversation,
      messages: [summaryMessage, ...messagesToKeep],
      rawMessages: [...fullMessageHistory],
      compaction: {
        ...conversation.compaction,
        rawHistoryPreserved: true,
        storedRawMessageCount: fullMessageHistory.length,
        representedMessageCount: fullMessageHistory.length,
        compactedAt: Date.now(),
      },
      updatedAt: Date.now(),
    }

    // Persist the compacted conversation
    // Note: saveConversation() already calls updateConversationIndex(), so no need to call it separately
    // If save fails, return the original conversation (best-effort)
    try {
      await this.saveConversation(compactedConversation)
    } catch (error) {
      logApp(`[conversationService] compactOnLoad: failed to persist, returning original:`, error)
      return conversation
    }

    logApp(`[conversationService] compactOnLoad: compacted ${messagesToSummarize.length} messages into summary, new count: ${compactedConversation.messages.length}`)
    return compactedConversation
  }

  /**
   * Get the most recently updated conversation's ID and title.
   * Used by "continue last conversation" keybinds.
   */
  async getMostRecentConversation(): Promise<{ id: string; title: string } | null> {
    const history = await this.getConversationHistory()
    if (history.length === 0) return null
    return { id: history[0].id, title: history[0].title }
  }

  async deleteAllConversations(): Promise<void> {
    // Block new per-conversation mutations from being enqueued during delete-all.
    this.deletingAll = true
    try {
      // Drain: wait for all in-flight mutations, then verify no new ones snuck in.
      // Because deletingAll is set synchronously above, no NEW mutations can be enqueued
      // via enqueueConversationMutation after this point. However, a mutation that was
      // already running might have spawned a follow-up promise before we set the flag.
      // Drain twice to handle that edge case.
      await this.waitForAllConversationMutations()
      await this.waitForAllConversationMutations()

      // Clear the mutation queue map so stale entries don't reference deleted files.
      this.conversationMutationQueues.clear()

      await this.enqueueIndexMutation(async () => {
        // Ensure pending/in-flight index writes are settled before deleting files.
        await this.flushIndexWrite()

        if (fs.existsSync(conversationsFolder)) {
          fs.rmSync(conversationsFolder, { recursive: true, force: true })
        }
        this.ensureConversationsFolder()

        // Clear the in-memory cache
        this.indexCache = []
      })
    } finally {
      this.deletingAll = false
    }
  }
}

export const conversationService = ConversationService.getInstance()
