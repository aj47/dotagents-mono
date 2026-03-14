import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import fs from "fs"
import fsPromises from "fs/promises"
import path from "path"
import { ConversationService, type SummarizeContentFn } from "./conversation-service"
import type { Conversation, ConversationMessage } from "./types"

// Mock the config module to return a temp directory as conversations folder
const testDir = path.join(process.cwd(), ".test-conversations-" + process.pid)

vi.mock("./config", () => ({
  getConversationsFolder: () => testDir,
  configStore: {
    get: () => ({}),
  },
}))

vi.mock("./debug", () => ({
  logApp: (..._args: unknown[]) => {},
}))

vi.mock("./conversation-id", () => ({
  assertSafeConversationId: (id: string) => {
    if (/[/\\]/.test(id)) throw new Error("Unsafe conversation ID")
  },
  validateAndSanitizeConversationId: (id: string) => {
    return id.replace(/[^a-zA-Z0-9_\-.@]/g, "_")
  },
}))

describe("ConversationService", () => {
  let service: ConversationService

  beforeEach(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true })
    }
    service = new ConversationService()
  })

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true })
    }
  })

  describe("CRUD operations", () => {
    it("creates a conversation with a first message", async () => {
      const conversation = await service.createConversation("Hello, world!")

      expect(conversation).toBeDefined()
      expect(conversation.id).toMatch(/^conv_/)
      expect(conversation.title).toBe("Hello, world!")
      expect(conversation.messages).toHaveLength(1)
      expect(conversation.messages[0].role).toBe("user")
      expect(conversation.messages[0].content).toBe("Hello, world!")
    })

    it("loads a saved conversation from disk", async () => {
      const created = await service.createConversation("Test message")

      const loaded = await service.loadConversation(created.id)

      expect(loaded).toBeDefined()
      expect(loaded!.id).toBe(created.id)
      expect(loaded!.title).toBe(created.title)
      expect(loaded!.messages).toHaveLength(1)
    })

    it("returns null when loading a non-existent conversation", async () => {
      const loaded = await service.loadConversation("non_existent_id")
      expect(loaded).toBeNull()
    })

    it("adds a message to an existing conversation", async () => {
      const created = await service.createConversation("User says hi")

      const updated = await service.addMessageToConversation(
        created.id,
        "Assistant says hello back",
        "assistant",
      )

      expect(updated).toBeDefined()
      expect(updated!.messages).toHaveLength(2)
      expect(updated!.messages[1].role).toBe("assistant")
      expect(updated!.messages[1].content).toBe("Assistant says hello back")
    })

    it("returns null when adding message to non-existent conversation", async () => {
      const result = await service.addMessageToConversation(
        "nonexistent",
        "Hello",
        "user",
      )
      expect(result).toBeNull()
    })

    it("deletes a conversation", async () => {
      const created = await service.createConversation("To be deleted")

      await service.deleteConversation(created.id)

      const loaded = await service.loadConversation(created.id)
      expect(loaded).toBeNull()
    })

    it("deletes all conversations", async () => {
      await service.createConversation("First conversation")
      await service.createConversation("Second conversation")

      await service.deleteAllConversations()

      const history = await service.getConversationHistory()
      expect(history).toHaveLength(0)
    })

    it("creates a conversation with a specific ID", async () => {
      const conversation = await service.createConversationWithId(
        "custom_id_123",
        "Custom ID message",
      )

      expect(conversation.id).toBe("custom_id_123")

      const loaded = await service.loadConversation("custom_id_123")
      expect(loaded).toBeDefined()
      expect(loaded!.messages[0].content).toBe("Custom ID message")
    })
  })

  describe("conversation history", () => {
    it("returns conversation history sorted by updatedAt", async () => {
      await service.createConversation("First")
      // Small delay to ensure different timestamps
      await new Promise((r) => setTimeout(r, 10))
      await service.createConversation("Second")

      const history = await service.getConversationHistory()

      expect(history).toHaveLength(2)
      // Most recent first
      expect(history[0].title).toBe("Second")
      expect(history[1].title).toBe("First")
    })

    it("returns empty array when no conversations exist", async () => {
      const history = await service.getConversationHistory()
      expect(history).toHaveLength(0)
    })

    it("updates history when a message is added", async () => {
      const created = await service.createConversation("Original")
      await service.addMessageToConversation(created.id, "New message", "assistant")

      const history = await service.getConversationHistory()
      expect(history).toHaveLength(1)
      expect(history[0].messageCount).toBe(2)
    })
  })

  describe("getMostRecentConversation", () => {
    it("returns the most recent conversation", async () => {
      await service.createConversation("Old conversation")
      await new Promise((r) => setTimeout(r, 10))
      await service.createConversation("New conversation")

      const recent = await service.getMostRecentConversation()
      expect(recent).toBeDefined()
      expect(recent!.title).toBe("New conversation")
    })

    it("returns null when no conversations exist", async () => {
      const recent = await service.getMostRecentConversation()
      expect(recent).toBeNull()
    })
  })

  describe("title generation", () => {
    it("truncates long messages to 50 characters", async () => {
      const longMessage = "A".repeat(100)
      const conversation = await service.createConversation(longMessage)

      expect(conversation.title).toBe("A".repeat(50) + "...")
    })

    it("does not add ellipsis for short messages", async () => {
      const conversation = await service.createConversation("Short")
      expect(conversation.title).toBe("Short")
    })
  })

  describe("idempotency", () => {
    it("deduplicates consecutive identical messages", async () => {
      const created = await service.createConversation("Hello")
      await service.addMessageToConversation(created.id, "Reply", "assistant")
      await service.addMessageToConversation(created.id, "Reply", "assistant")

      const loaded = await service.loadConversation(created.id)
      expect(loaded!.messages).toHaveLength(2) // Not 3
    })
  })

  describe("corrupt file recovery", () => {
    it("recovers a conversation from a truncated JSON file", async () => {
      // Create a valid conversation first
      const created = await service.createConversation("Valid message")
      const convPath = path.join(testDir, `${created.id}.json`)

      // Corrupt the file by appending garbage
      const validData = await fsPromises.readFile(convPath, "utf8")
      await fsPromises.writeFile(convPath, validData + "GARBAGE")

      // Load should recover
      const loaded = await service.loadConversation(created.id)
      expect(loaded).toBeDefined()
      expect(loaded!.id).toBe(created.id)
      expect(loaded!.messages[0].content).toBe("Valid message")
    })
  })

  describe("generateConversationIdPublic", () => {
    it("generates a valid conversation ID", () => {
      const id = service.generateConversationIdPublic()
      expect(id).toMatch(/^conv_\d+_[a-z0-9]+$/)
    })
  })

  describe("compaction", () => {
    it("does not compact when message count is below threshold", async () => {
      const mockSummarize: SummarizeContentFn = vi.fn()
      service.setSummarizeFn(mockSummarize)

      const created = await service.createConversation("Hello")

      const result = await service.loadConversationWithCompaction(created.id)
      expect(result).toBeDefined()
      expect(result!.messages).toHaveLength(1)
      expect(mockSummarize).not.toHaveBeenCalled()
    })

    it("compacts when message count exceeds threshold", async () => {
      const mockSummarize: SummarizeContentFn = vi.fn().mockResolvedValue("Summary of older messages")
      service.setSummarizeFn(mockSummarize)

      // Create a conversation with many messages
      const created = await service.createConversation("Message 0")
      for (let i = 1; i <= 25; i++) {
        await service.addMessageToConversation(
          created.id,
          `Message ${i}`,
          i % 2 === 0 ? "user" : "assistant",
        )
      }

      const result = await service.loadConversationWithCompaction(created.id)
      expect(result).toBeDefined()
      expect(mockSummarize).toHaveBeenCalled()
      // Should have summary message + 10 kept messages = 11
      expect(result!.messages).toHaveLength(11)
      expect(result!.messages[0].isSummary).toBe(true)
      expect(result!.rawMessages).toBeDefined()
      expect(result!.rawMessages!.length).toBe(26) // All original messages preserved
      expect(result!.compaction).toBeDefined()
      expect(result!.compaction!.rawHistoryPreserved).toBe(true)
    })

    it("skips compaction when no summarize function is set", async () => {
      // Don't call setSummarizeFn

      // Create a conversation with many messages
      const created = await service.createConversation("Message 0")
      for (let i = 1; i <= 25; i++) {
        await service.addMessageToConversation(
          created.id,
          `Message ${i}`,
          i % 2 === 0 ? "user" : "assistant",
        )
      }

      const result = await service.loadConversationWithCompaction(created.id)
      expect(result).toBeDefined()
      // No compaction - all original messages
      expect(result!.messages).toHaveLength(26)
      expect(result!.compaction).toBeUndefined()
    })

    it("returns original conversation when summarization fails", async () => {
      const mockSummarize: SummarizeContentFn = vi.fn().mockRejectedValue(new Error("LLM error"))
      service.setSummarizeFn(mockSummarize)

      // Create a conversation with many messages
      const created = await service.createConversation("Message 0")
      for (let i = 1; i <= 25; i++) {
        await service.addMessageToConversation(
          created.id,
          `Message ${i}`,
          i % 2 === 0 ? "user" : "assistant",
        )
      }

      const result = await service.loadConversationWithCompaction(created.id)
      expect(result).toBeDefined()
      // Should return original uncompacted
      expect(result!.messages).toHaveLength(26)
    })

    it("preserves compacted state on subsequent loads", async () => {
      const mockSummarize: SummarizeContentFn = vi.fn().mockResolvedValue("Summary")
      service.setSummarizeFn(mockSummarize)

      const created = await service.createConversation("Message 0")
      for (let i = 1; i <= 25; i++) {
        await service.addMessageToConversation(
          created.id,
          `Message ${i}`,
          i % 2 === 0 ? "user" : "assistant",
        )
      }

      // First compaction
      await service.loadConversationWithCompaction(created.id)
      expect(mockSummarize).toHaveBeenCalledTimes(1)

      // Second load should NOT re-compact
      const result2 = await service.loadConversationWithCompaction(created.id)
      expect(mockSummarize).toHaveBeenCalledTimes(1) // Still 1, not 2
      expect(result2!.messages[0].isSummary).toBe(true)
    })
  })
})
