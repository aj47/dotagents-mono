const CONVERSATION_ID_ALLOWED_CHARS = /^[a-zA-Z0-9_\-@.]+$/

// Exact reserved names that collide with internal storage files.
// Checked against the exact (lowercased) ID, so IDs like "index.v2" are allowed.
const FILE_RESERVED_IDS = new Set(["index", "metadata"])

// Windows reserved device names. Checked against both the exact lowercased ID and
// the stem before the first dot because Windows treats names like "con.txt" as reserved.
const WINDOWS_DEVICE_NAMES = new Set([
  "con",
  "prn",
  "aux",
  "nul",
  "com0",
  "com1",
  "com2",
  "com3",
  "com4",
  "com5",
  "com6",
  "com7",
  "com8",
  "com9",
  "lpt0",
  "lpt1",
  "lpt2",
  "lpt3",
  "lpt4",
  "lpt5",
  "lpt6",
  "lpt7",
  "lpt8",
  "lpt9",
])

export function generateConversationId(
  now: number = Date.now(),
  random: () => number = Math.random,
): string {
  return `conv_${now}_${random().toString(36).substr(2, 9)}`
}

function getConversationIdStorageError(conversationId: string): string | null {
  if (!conversationId || conversationId.trim().length === 0) {
    return "Invalid conversation ID: empty value not allowed"
  }
  if (conversationId === "." || conversationId === "..") {
    return "Invalid conversation ID: path traversal characters not allowed"
  }
  if (conversationId.endsWith(".") || conversationId.endsWith(" ")) {
    return "Invalid conversation ID: trailing dots or spaces not allowed"
  }

  const normalized = conversationId.toLowerCase()
  if (FILE_RESERVED_IDS.has(normalized)) {
    return "Invalid conversation ID: reserved name"
  }

  const stem = normalized.includes(".") ? normalized.slice(0, normalized.indexOf(".")) : normalized
  if (WINDOWS_DEVICE_NAMES.has(normalized) || WINDOWS_DEVICE_NAMES.has(stem)) {
    return "Invalid conversation ID: reserved name"
  }

  return null
}

export function sanitizeConversationId(conversationId: string): string {
  return conversationId.replace(/[^a-zA-Z0-9_\-@.]/g, "_")
}

export function getConversationIdValidationError(conversationId: string): string | null {
  if (!conversationId || conversationId.trim().length === 0) {
    return "Invalid conversation ID: empty value not allowed"
  }
  if (conversationId.includes("\0")) {
    return "Invalid conversation ID: null bytes not allowed"
  }
  if (conversationId.includes("..") || conversationId.includes("/") || conversationId.includes("\\")) {
    return "Invalid conversation ID: path traversal characters not allowed"
  }

  const storageError = getConversationIdStorageError(conversationId)
  if (storageError) {
    return storageError
  }

  if (!CONVERSATION_ID_ALLOWED_CHARS.test(conversationId)) {
    return "Invalid conversation ID format"
  }

  return null
}

export function assertSafeConversationId(conversationId: string): void {
  const validationError = getConversationIdValidationError(conversationId)
  if (validationError) {
    throw new Error(validationError)
  }
}

export function validateAndSanitizeConversationId(conversationId: string): string {
  if (!conversationId || conversationId.trim().length === 0) {
    throw new Error("Invalid conversation ID: empty value not allowed")
  }
  if (conversationId.includes("\0")) {
    throw new Error("Invalid conversation ID: null bytes not allowed")
  }
  if (conversationId.includes("..") || conversationId.includes("/") || conversationId.includes("\\")) {
    throw new Error("Invalid conversation ID: path traversal characters not allowed")
  }

  const sanitized = sanitizeConversationId(conversationId)
  const storageError = getConversationIdStorageError(sanitized)
  if (storageError) {
    throw new Error(storageError)
  }

  return sanitized
}
