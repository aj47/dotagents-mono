import fs from "fs"
import fsPromises from "fs/promises"
import path from "path"
import { createHash } from "crypto"
import { Writable } from "stream"
import { pipeline } from "stream/promises"
import { conversationsFolder } from "./config"
import { logApp } from "./debug"
import type {
  Conversation,
  ConversationMessage,
  ConversationHistoryItem,
  LoadedConversation,
} from "@dotagents/shared/conversation-domain"
import {
  appendServerConversationMessage,
  applyServerConversationMessageLimit,
  buildBranchedServerConversation,
  buildNewServerConversation,
  buildServerConversationCompactionCheckpointMetadata,
  buildServerConversationCompactionPrompt,
  buildServerConversationCompactionSummaryInput,
  buildServerConversationAutoTitleSeed,
  buildServerConversationHistoryItem,
  estimateServerConversationCompactionTokensFromText,
  getRepresentedServerConversationMessageCount,
  getStoredServerConversationMessages,
  getValidServerConversationCompactionTimestamp,
  hasPersistedServerConversationCompactionCheckpoint,
  isValidServerConversationRecordShape,
  normalizeServerConversationHistoryIndex,
  normalizeServerConversationSummarizedMessageCount,
  renameServerConversationTitle,
  repairServerConversationJsonData,
  syncServerConversationStorageMetadata,
} from "@dotagents/shared/conversation-sync"
import { summarizeContent } from "./context-budget"
import {
  assertSafeConversationId,
  generateConversationId,
  validateAndSanitizeConversationId,
} from "@dotagents/shared/conversation-id"
import {
  generateMessageId,
  normalizeConversationTitleText,
} from "@dotagents/shared/session"
import {
  extractDataImageMarkdownReferences,
  getConversationImageExtensionForMimeType,
  getConversationImageMimeTypeFromFileName,
  getConversationVideoExtensionForMimeType,
  getRenderableVideoMimeTypeFromFileName,
  parseDataImageUrl,
} from "@dotagents/shared/conversation-media-assets"
import { sanitizeMessageContentForDisplay } from "@dotagents/shared/message-display-utils"
import { makeTextCompletionWithFetch } from "./llm-fetch"
import {
  buildConversationImageAssetUrl,
  getConversationImageAssetDir,
  getConversationImageAssetPath,
} from "./conversation-image-assets"
import {
  buildConversationVideoAssetUrl,
  getConversationVideoAssetDir,
  getConversationVideoAssetPath,
} from "./conversation-video-assets"

// Threshold for compacting conversations on load
// When a conversation exceeds this many messages, older ones are summarized
const COMPACTION_MESSAGE_THRESHOLD = 20
// Number of recent messages to keep intact after compaction
const COMPACTION_KEEP_LAST = 10

// Debounce delay for writing the conversation index to disk (ms)
const INDEX_WRITE_DEBOUNCE_MS = 500
const MAX_SESSION_TITLE_CHARS = 80
const MAX_AGENT_SESSION_TITLE_WORDS = 10
const MAX_CONVERSATION_HISTORY_LAST_MESSAGE_CHARS = 500
const MAX_CONVERSATION_HISTORY_PREVIEW_CHARS = 200

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

  private async storeConversationImageBuffer(
    conversationId: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<string> {
    const extension = getConversationImageExtensionForMimeType(mimeType)
    if (!extension || buffer.length <= 0) {
      throw new Error(`Unsupported or empty conversation image: ${mimeType}`)
    }

    const hash = createHash("sha256").update(buffer).digest("hex")
    const fileName = `${hash}.${extension}`
    const assetPath = getConversationImageAssetPath(conversationId, fileName)

    await fsPromises.mkdir(getConversationImageAssetDir(conversationId), { recursive: true })
    try {
      await fsPromises.writeFile(assetPath, buffer, { flag: "wx" })
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") {
        throw error
      }
    }

    return buildConversationImageAssetUrl(conversationId, fileName)
  }

  async storeImagePathAsConversationAsset(conversationId: string, imagePath: string): Promise<string> {
    const mimeType = getConversationImageMimeTypeFromFileName(imagePath)
    if (!mimeType) {
      throw new Error(`Unsupported image extension for path: ${imagePath}`)
    }

    const buffer = await fsPromises.readFile(imagePath)
    return this.storeConversationImageBuffer(conversationId, buffer, mimeType)
  }

  async storeDataImageUrlAsConversationAsset(conversationId: string, dataUrl: string): Promise<string> {
    const parsedDataImage = parseDataImageUrl(dataUrl)
    if (!parsedDataImage) {
      throw new Error("Invalid data:image URL")
    }

    const buffer = Buffer.from(parsedDataImage.base64.replace(/\s+/g, ""), "base64")
    return this.storeConversationImageBuffer(conversationId, buffer, parsedDataImage.mimeType)
  }

  private async computeFileSha256(filePath: string): Promise<string> {
    const hash = createHash("sha256")
    await pipeline(
      fs.createReadStream(filePath),
      new Writable({
        write(chunk: Buffer, _encoding, callback) {
          hash.update(chunk)
          callback()
        },
      }),
    )
    return hash.digest("hex")
  }

  async storeVideoPathAsConversationAsset(conversationId: string, videoPath: string): Promise<string> {
    const mimeType = getRenderableVideoMimeTypeFromFileName(videoPath)
    if (!mimeType) {
      throw new Error(`Unsupported video extension for path: ${videoPath}`)
    }

    const extension = getConversationVideoExtensionForMimeType(mimeType)
    const sourceStat = await fsPromises.stat(videoPath)
    if (!sourceStat.isFile()) {
      throw new Error(`Video path is not a regular file: ${videoPath}`)
    }
    if (!extension || sourceStat.size <= 0) {
      throw new Error(`Unsupported or empty conversation video: ${mimeType}`)
    }

    const hash = await this.computeFileSha256(videoPath)
    const fileName = `${hash}.${extension}`
    const assetPath = getConversationVideoAssetPath(conversationId, fileName)

    await fsPromises.mkdir(getConversationVideoAssetDir(conversationId), { recursive: true })
    try {
      await pipeline(fs.createReadStream(videoPath), fs.createWriteStream(assetPath, { flags: "wx" }))
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") {
        try {
          await fsPromises.unlink(assetPath)
        } catch {
          // Best-effort cleanup for partially copied files.
        }
        throw error
      }
    }

    return buildConversationVideoAssetUrl(conversationId, fileName)
  }

  async materializeInlineDataImagesInContent(conversationId: string, content: string): Promise<string> {
    if (!/data:image\//i.test(content)) {
      return content
    }

    let nextContent = ""
    let lastIndex = 0
    const matches = extractDataImageMarkdownReferences(content)

    for (const match of matches) {
      const matchIndex = match.index
      nextContent += content.slice(lastIndex, matchIndex)
      try {
        const assetUrl = await this.storeDataImageUrlAsConversationAsset(conversationId, match.url)
        nextContent += `![${match.altText}](${assetUrl})`
      } catch (error) {
        logApp(`[ConversationService] Failed to materialize inline image for ${conversationId}`, error)
        nextContent += match.fullMatch
      }
      lastIndex = matchIndex + match.fullMatch.length
    }

    return nextContent + content.slice(lastIndex)
  }

  private async materializeConversationInlineImages(conversation: Conversation): Promise<boolean> {
    let changed = false
    const seenMessages = new Set<ConversationMessage>()
    const messageGroups = [conversation.messages, conversation.rawMessages].filter(Array.isArray) as ConversationMessage[][]

    for (const messages of messageGroups) {
      for (const message of messages) {
        if (seenMessages.has(message)) continue
        seenMessages.add(message)
        const nextContent = await this.materializeInlineDataImagesInContent(conversation.id, message.content)
        if (nextContent !== message.content) {
          message.content = nextContent
          changed = true
        }
        if (typeof message.displayContent === "string") {
          const nextDisplayContent = await this.materializeInlineDataImagesInContent(conversation.id, message.displayContent)
          if (nextDisplayContent !== message.displayContent) {
            message.displayContent = nextDisplayContent
            changed = true
          }
        }
      }
    }

    return changed
  }

  /**
   * Public method to generate a conversation ID.
   * Used by remote-server when creating new conversations without a provided ID.
   */
  generateConversationIdPublic(): string {
    return generateConversationId()
  }

  private getAutoTitleSeed(conversation: Conversation): {
    fallbackTitle: string
    firstUserMessage: string
    firstAssistantMessage: string
  } | null {
    return buildServerConversationAutoTitleSeed(conversation, { maxTitleChars: MAX_SESSION_TITLE_CHARS })
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
      return normalizeConversationTitleText(completion, {
        maxChars: MAX_SESSION_TITLE_CHARS,
        maxWords: MAX_AGENT_SESSION_TITLE_WORDS,
      }) || null
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
    let indexWasNormalized = false
    try {
      const indexPath = this.getConversationIndexPath()
      const data = await fsPromises.readFile(indexPath, "utf8")
      const parsed = JSON.parse(data)
      if (Array.isArray(parsed)) {
        const normalized = this.normalizeConversationHistoryIndex(parsed as ConversationHistoryItem[])
        loadedIndex = normalized.index
        indexWasNormalized = normalized.changed
      }
    } catch {
      // File doesn't exist or is corrupted — start fresh
      loadedIndex = []
    }

    this.indexCache = loadedIndex
    if (indexWasNormalized) {
      await this.writeIndexToDisk()
    }

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
    return buildServerConversationHistoryItem(conversation, {
      maxLastMessageChars: MAX_CONVERSATION_HISTORY_LAST_MESSAGE_CHARS,
      maxPreviewChars: MAX_CONVERSATION_HISTORY_PREVIEW_CHARS,
    }) as ConversationHistoryItem
  }

  private normalizeConversationHistoryIndex(index: ConversationHistoryItem[]): {
    index: ConversationHistoryItem[]
    changed: boolean
  } {
    return normalizeServerConversationHistoryIndex(index, {
      maxLastMessageChars: MAX_CONVERSATION_HISTORY_LAST_MESSAGE_CHARS,
      maxPreviewChars: MAX_CONVERSATION_HISTORY_PREVIEW_CHARS,
    })
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
    return isValidServerConversationRecordShape(value)
  }

  /**
   * Attempt to recover a valid conversation JSON by trimming trailing garbage and reparsing.
   * This is only used when the file failed normal JSON.parse().
   */
  private tryRepairConversationFromCorruptedData(raw: string): Conversation | null {
    const result = repairServerConversationJsonData<Conversation>(raw, {
      validateConversationShape: (value): value is Conversation => this.isValidConversationShape(value),
    })
    if (result.ok) {
      return result.conversation
    }
    if (result.reason === "too_large") {
      logApp(`[ConversationService] Skipping repair: file too large (${result.bytes} bytes)`)
      return null
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
    const imageStorageChanged = await this.materializeConversationInlineImages(conversation)
    const storageMetadataChanged = this.syncConversationStorageMetadata(conversation)
    if (!imageStorageChanged && !storageMetadataChanged) {
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

    await this.materializeConversationInlineImages(conversation)
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

  private hasSummaryMessages(messages: ConversationMessage[]): boolean {
    return messages.some((message) => message.isSummary)
  }

  private applyConversationMessageLimit(
    conversation: Conversation,
    messageLimit?: number,
  ): LoadedConversation {
    return applyServerConversationMessageLimit(conversation, messageLimit) as LoadedConversation
  }

  private getStoredRawMessages(conversation: Conversation): ConversationMessage[] {
    return getStoredServerConversationMessages(conversation) as ConversationMessage[]
  }

  private getRepresentedMessageCount(conversation: Conversation): number {
    return getRepresentedServerConversationMessageCount(conversation)
  }

  private syncConversationStorageMetadata(conversation: Conversation): boolean {
    return syncServerConversationStorageMetadata(conversation)
  }

  private estimateCompactionTokensFromText(text: string): number {
    return estimateServerConversationCompactionTokensFromText(text)
  }

  private getValidCompactionTimestamp(...candidates: Array<number | undefined>): number {
    return getValidServerConversationCompactionTimestamp(...candidates)
  }

  private normalizeSummarizedMessageCount(count: number | undefined, rawMessageCount: number): number {
    return normalizeServerConversationSummarizedMessageCount(count, rawMessageCount)
  }

  private async persistCompactionCheckpointIfMissing(
    conversation: Conversation,
    fullMessageHistory: ConversationMessage[],
  ): Promise<Conversation> {
    if (hasPersistedServerConversationCompactionCheckpoint(conversation.compaction)) {
      return conversation
    }

    const summaryMessage = conversation.messages.find((message) => message.isSummary)
    if (!summaryMessage) {
      return conversation
    }

    const summarizedMessageCount = this.normalizeSummarizedMessageCount(
      summaryMessage.summarizedMessageCount,
      fullMessageHistory.length,
    )
    if (summarizedMessageCount <= 0) {
      return conversation
    }

    const summarizedText = fullMessageHistory
      .slice(0, summarizedMessageCount)
      .map((message) => sanitizeMessageContentForDisplay(message.content || ""))
      .join("\n")
    const compactedConversation: Conversation = {
      ...conversation,
      compaction: buildServerConversationCompactionCheckpointMetadata({
        existing: conversation.compaction,
        fullMessageHistory,
        summaryMessage,
        summarizedMessageCount,
        tokensBefore: this.estimateCompactionTokensFromText(summarizedText),
        compactedAt: this.getValidCompactionTimestamp(
          conversation.compaction?.compactedAt,
          summaryMessage.timestamp,
          conversation.updatedAt,
        ),
      }),
      updatedAt: conversation.updatedAt,
    }

    try {
      await this.saveConversation(compactedConversation, true)
      return compactedConversation
    } catch (error) {
      logApp(`[conversationService] compactOnLoad: failed to persist checkpoint backfill, returning original:`, error)
      return conversation
    }
  }


  async saveConversation(conversation: Conversation, preserveTimestamp: boolean = false): Promise<void> {
    await this.enqueueConversationMutation(conversation.id, async () => {
      await this.saveConversationUnlocked(conversation, preserveTimestamp)
    })
  }

  async loadConversation(
    conversationId: string,
    options?: { messageLimit?: number },
  ): Promise<LoadedConversation | null> {
    // Enqueue as a mutation so that any repair save inside loadConversationFromDisk()
    // is serialized with other writes, preventing lost-update races.
    return this.enqueueConversationMutation(conversationId, async () => {
      const conversation = await this.loadConversationFromDisk(conversationId)
      return conversation
        ? this.applyConversationMessageLimit(conversation, options?.messageLimit)
        : null
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
    const conversationId = generateConversationId()
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
    const now = Date.now()
    const storedFirstMessage = await this.materializeInlineDataImagesInContent(validatedId, firstMessage)

    const conversation = buildNewServerConversation(
      validatedId,
      { messages: [{ role, content: storedFirstMessage }] },
      now,
      () => generateMessageId(),
    ) as Conversation

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
    options?: { displayContent?: string },
  ): Promise<Conversation | null> {
    return this.enqueueConversationMutation(conversationId, async () => {
      try {
        const conversation = await this.loadConversationFromDisk(conversationId)
        if (!conversation) {
          return null
        }

        const storedContent = await this.materializeInlineDataImagesInContent(conversationId, content)
        const storedDisplayContent = typeof options?.displayContent === "string" && options.displayContent.trim().length > 0
          ? await this.materializeInlineDataImagesInContent(conversationId, options.displayContent)
          : undefined

        appendServerConversationMessage(conversation, {
          id: generateMessageId(),
          role,
          content: storedContent,
          timestamp: Date.now(),
          toolCalls,
          toolResults,
          ...(storedDisplayContent ? { displayContent: storedDisplayContent } : {}),
        })
        await this.saveConversationUnlocked(conversation)

        return conversation
      } catch (error) {
        return null
      }
    })
  }

  async renameConversationTitle(conversationId: string, title: string): Promise<Conversation | null> {
    return this.enqueueConversationMutation(conversationId, async () => {
      const conversation = await this.loadConversationFromDisk(conversationId)
      if (!conversation) {
        return null
      }

      const renameResult = renameServerConversationTitle(conversation, title, { maxChars: MAX_SESSION_TITLE_CHARS })
      if (renameResult.ok === false) {
        return null
      }

      if (!renameResult.changed) {
        return conversation
      }

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

    const newConversationId = generateConversationId()
    const now = Date.now()
    const buildResult = buildBranchedServerConversation(sourceConversation, {
      sourceConversationId,
      conversationId: newConversationId,
      messageIndex,
      timestamp: now,
      messageIdFactory: () => generateMessageId(),
    })

    if (buildResult.ok === false) {
      logApp(`[ConversationService] branchConversation: invalid messageIndex ${messageIndex} (${buildResult.messageCount} messages)`)
      return null
    }

    const branchedConversation = buildResult.conversation

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

    if (
      !generatedTitle ||
      generatedTitle === normalizeConversationTitleText(seed.fallbackTitle, { maxChars: MAX_SESSION_TITLE_CHARS })
    ) {
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
      return this.persistCompactionCheckpointIfMissing(conversation, fullMessageHistory)
    }

    // Calculate how many messages to summarize
    const messagesToSummarize = fullMessageHistory.slice(0, messageCount - COMPACTION_KEEP_LAST)
    const messagesToKeep = fullMessageHistory.slice(messageCount - COMPACTION_KEEP_LAST)

    if (messagesToSummarize.length === 0) {
      return conversation
    }

    logApp(`[conversationService] compactOnLoad: compacting ${messagesToSummarize.length} messages for ${conversation.id}`)

    // Build a summary of the older messages
    const summaryInput = buildServerConversationCompactionSummaryInput(messagesToSummarize)

    let summaryContent: string
    const summarizationPrompt = buildServerConversationCompactionPrompt(summaryInput)
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
      id: generateMessageId(),
      role: "assistant",
      content: summaryContent,
      timestamp: messagesToSummarize[0]?.timestamp || Date.now(),
      isSummary: true,
      summarizedMessageCount: messagesToSummarize.length,
    }

    // Create compacted conversation (don't mutate original)
    const tokensBefore = this.estimateCompactionTokensFromText(summaryInput)
    const compactedConversation: Conversation = {
      ...conversation,
      messages: [summaryMessage, ...messagesToKeep],
      rawMessages: [...fullMessageHistory],
      compaction: buildServerConversationCompactionCheckpointMetadata({
        existing: conversation.compaction,
        fullMessageHistory,
        summaryMessage,
        summarizedMessageCount: messagesToSummarize.length,
        tokensBefore,
      }),
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
