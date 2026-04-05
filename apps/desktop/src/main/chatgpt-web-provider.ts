import { randomUUID } from "crypto"
import { configStore } from "./config"

const DEFAULT_CHATGPT_WEB_BASE_URL = "https://chatgpt.com"
const DEFAULT_CHATGPT_WEB_MODEL = "gpt-4o"
const AUTH_JWT_CLAIM_PATH = "https://api.openai.com/auth"
const SESSION_AUTH_CACHE_TTL_MS = 5 * 60 * 1000

type ChatGptWebModelContext = "mcp" | "transcript"

export interface ChatGptWebMessage {
  role: string
  content: string
}

export interface ChatGptWebCompletionOptions {
  modelContext?: ChatGptWebModelContext
  signal?: AbortSignal
  onTextChunk?: (chunk: string, accumulated: string) => void
}

interface ResolvedChatGptWebAuth {
  accessToken: string
  accountId?: string
  baseUrl: string
}

let cachedSessionAuth:
  | {
      sessionToken: string
      baseUrl: string
      accessToken: string
      accountId?: string
      cachedAt: number
    }
  | undefined

function normalizeChatGptWebBaseUrl(baseUrl: string | undefined): string {
  const raw = (baseUrl || DEFAULT_CHATGPT_WEB_BASE_URL).trim()
  if (!raw) return DEFAULT_CHATGPT_WEB_BASE_URL

  let normalized = raw.replace(/\/+$/, "")
  if (normalized.endsWith("/backend-api")) {
    normalized = normalized.slice(0, -"/backend-api".length)
  }

  return normalized || DEFAULT_CHATGPT_WEB_BASE_URL
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".")
  if (parts.length !== 3) return null

  try {
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/")
    const padded = payload.padEnd(Math.ceil(payload.length / 4) * 4, "=")
    const decoded = Buffer.from(padded, "base64").toString("utf8")
    const parsed = JSON.parse(decoded)
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null
  } catch {
    return null
  }
}

function extractChatGptAccountId(accessToken: string): string | undefined {
  const payload = decodeJwtPayload(accessToken)
  if (!payload) return undefined

  const authClaim = payload[AUTH_JWT_CLAIM_PATH]
  if (!authClaim || typeof authClaim !== "object") return undefined

  const accountId = (authClaim as Record<string, unknown>).chatgpt_account_id
  return typeof accountId === "string" && accountId.trim().length > 0
    ? accountId.trim()
    : undefined
}

function getConfiguredChatGptWebModel(modelContext: ChatGptWebModelContext): string {
  const config = configStore.get()
  if (modelContext === "mcp") {
    return config.mcpToolsChatgptWebModel || DEFAULT_CHATGPT_WEB_MODEL
  }
  return config.transcriptPostProcessingChatgptWebModel || DEFAULT_CHATGPT_WEB_MODEL
}

async function resolveAccessTokenFromSessionToken(
  sessionToken: string,
  baseUrl: string,
  signal?: AbortSignal,
): Promise<{ accessToken: string; accountId?: string }> {
  if (
    cachedSessionAuth &&
    cachedSessionAuth.sessionToken === sessionToken &&
    cachedSessionAuth.baseUrl === baseUrl &&
    Date.now() - cachedSessionAuth.cachedAt < SESSION_AUTH_CACHE_TTL_MS
  ) {
    return {
      accessToken: cachedSessionAuth.accessToken,
      accountId: cachedSessionAuth.accountId,
    }
  }

  const sessionUrl = `${baseUrl}/api/auth/session`
  const response = await fetch(sessionUrl, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Cookie: `__Secure-next-auth.session-token=${sessionToken}; next-auth.session-token=${sessionToken}`,
    },
    signal,
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => "")
    throw new Error(`ChatGPT auth session failed (${response.status}): ${errorText || response.statusText}`)
  }

  const data = (await response.json()) as { accessToken?: string }
  const accessToken = data.accessToken?.trim()
  if (!accessToken) {
    throw new Error("ChatGPT auth session did not return an access token")
  }

  const accountId = extractChatGptAccountId(accessToken)
  cachedSessionAuth = {
    sessionToken,
    baseUrl,
    accessToken,
    accountId,
    cachedAt: Date.now(),
  }

  return { accessToken, accountId }
}

async function resolveChatGptWebAuth(signal?: AbortSignal): Promise<ResolvedChatGptWebAuth> {
  const config = configStore.get()
  const baseUrl = normalizeChatGptWebBaseUrl(config.chatgptWebBaseUrl)
  const directAccessToken = config.chatgptWebAccessToken?.trim()
  const configuredAccountId = config.chatgptWebAccountId?.trim()

  if (directAccessToken) {
    return {
      accessToken: directAccessToken,
      accountId: configuredAccountId || extractChatGptAccountId(directAccessToken),
      baseUrl,
    }
  }

  const sessionToken = config.chatgptWebSessionToken?.trim()
  if (!sessionToken) {
    throw new Error("ChatGPT Web provider requires either an access token or a session token")
  }

  const sessionAuth = await resolveAccessTokenFromSessionToken(sessionToken, baseUrl, signal)
  return {
    accessToken: sessionAuth.accessToken,
    accountId: configuredAccountId || sessionAuth.accountId,
    baseUrl,
  }
}

function mapChatGptWebMessages(messages: ChatGptWebMessage[]): Array<Record<string, unknown>> {
  return messages.map((message) => {
    const originalRole = message.role === "assistant" ? "assistant" : message.role === "user" ? "user" : "user"
    const content = message.role === "system"
      ? `[SYSTEM]\n${message.content}`
      : message.content

    return {
      id: randomUUID(),
      author: { role: originalRole },
      content: {
        content_type: "text",
        parts: [content],
      },
      metadata: {},
    }
  })
}

function buildConversationPayload(messages: ChatGptWebMessage[], model: string): Record<string, unknown> {
  return {
    action: "next",
    messages: mapChatGptWebMessages(messages),
    parent_message_id: randomUUID(),
    model,
    conversation_mode: { kind: "primary_assistant" },
    history_and_training_disabled: false,
    timezone_offset_min: new Date().getTimezoneOffset(),
    websocket_request_id: randomUUID(),
  }
}

function extractAssistantTextFromEvent(event: unknown): string | undefined {
  if (!event || typeof event !== "object") return undefined

  const message = (event as Record<string, unknown>).message
  if (!message || typeof message !== "object") return undefined

  const author = (message as Record<string, unknown>).author
  const authorRole = author && typeof author === "object"
    ? (author as Record<string, unknown>).role
    : undefined
  if (authorRole !== "assistant") return undefined

  const content = (message as Record<string, unknown>).content
  if (!content || typeof content !== "object") return undefined

  const parts = (content as Record<string, unknown>).parts
  if (!Array.isArray(parts)) return undefined

  const joined = parts
    .filter((part) => typeof part === "string")
    .join("\n")
    .trim()

  return joined || undefined
}

function extractEventError(event: unknown): string | undefined {
  if (!event || typeof event !== "object") return undefined

  const record = event as Record<string, unknown>
  const error = record.error

  if (typeof error === "string" && error.trim().length > 0) {
    return error.trim()
  }

  if (error && typeof error === "object") {
    const message = (error as Record<string, unknown>).message
    if (typeof message === "string" && message.trim().length > 0) {
      return message.trim()
    }
  }

  return undefined
}

function findSseBoundary(buffer: string): { index: number; length: number } | null {
  const crlfIndex = buffer.indexOf("\r\n\r\n")
  const lfIndex = buffer.indexOf("\n\n")

  if (crlfIndex === -1 && lfIndex === -1) return null
  if (crlfIndex === -1) return { index: lfIndex, length: 2 }
  if (lfIndex === -1) return { index: crlfIndex, length: 4 }
  return crlfIndex < lfIndex
    ? { index: crlfIndex, length: 4 }
    : { index: lfIndex, length: 2 }
}

async function readConversationSse(
  response: Response,
  onTextChunk?: (chunk: string, accumulated: string) => void,
): Promise<string> {
  if (!response.body) {
    throw new Error("ChatGPT conversation response did not include a body")
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  let accumulated = ""

  while (true) {
    const { value, done } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })

    let boundary = findSseBoundary(buffer)
    while (boundary) {
      const rawEvent = buffer.slice(0, boundary.index)
      buffer = buffer.slice(boundary.index + boundary.length)

      const data = rawEvent
        .split(/\r?\n/)
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trim())
        .join("\n")
        .trim()

      if (!data || data === "[DONE]") {
        boundary = findSseBoundary(buffer)
        continue
      }

      try {
        const parsed = JSON.parse(data)
        const eventError = extractEventError(parsed)
        if (eventError) {
          throw new Error(eventError)
        }

        const nextAssistantText = extractAssistantTextFromEvent(parsed)
        if (nextAssistantText !== undefined) {
          const chunk = nextAssistantText.startsWith(accumulated)
            ? nextAssistantText.slice(accumulated.length)
            : nextAssistantText
          accumulated = nextAssistantText
          if (chunk && onTextChunk) {
            onTextChunk(chunk, accumulated)
          }
        }
      } catch (error) {
        if (error instanceof SyntaxError) {
          boundary = findSseBoundary(buffer)
          continue
        }
        if (error instanceof Error) {
          throw error
        }
      }

      boundary = findSseBoundary(buffer)
    }
  }

  return accumulated.trim()
}

export function isChatGptWebProvider(providerId?: string): providerId is "chatgpt-web" {
  return providerId === "chatgpt-web"
}

export function getCurrentChatGptWebModelName(modelContext: ChatGptWebModelContext = "mcp"): string {
  return getConfiguredChatGptWebModel(modelContext)
}

export async function makeChatGptWebCompletion(
  messages: ChatGptWebMessage[],
  options: ChatGptWebCompletionOptions = {},
): Promise<string> {
  const modelContext = options.modelContext || "mcp"
  const model = getConfiguredChatGptWebModel(modelContext)
  const auth = await resolveChatGptWebAuth(options.signal)
  const url = `${auth.baseUrl}/backend-api/conversation`

  const payload = buildConversationPayload(messages, model)
  const headers: Record<string, string> = {
    Authorization: `Bearer ${auth.accessToken}`,
    "Content-Type": "application/json",
    Accept: "text/event-stream",
  }

  if (auth.accountId) {
    headers["chatgpt-account-id"] = auth.accountId
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    signal: options.signal,
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => "")
    throw new Error(`ChatGPT conversation failed (${response.status}): ${errorText || response.statusText}`)
  }

  return await readConversationSse(response, options.onTextChunk)
}
