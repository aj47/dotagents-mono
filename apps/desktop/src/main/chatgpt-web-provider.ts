import { randomUUID } from "crypto"
import { configStore } from "./config"

const DEFAULT_CHATGPT_WEB_BASE_URL = "https://chatgpt.com"
const DEFAULT_CHATGPT_WEB_MODEL = "gpt-5.4-mini"
const DEFAULT_CHATGPT_WEB_INSTRUCTIONS = "You are a helpful assistant."
const AUTH_JWT_CLAIM_PATH = "https://api.openai.com/auth"

type ChatGptWebModelContext = "mcp" | "transcript"

export interface ChatGptWebMessage {
  role: string
  content: string
}

export interface ChatGptWebTool {
  name: string
  description?: string
  inputSchema?: unknown
}

export interface ChatGptWebCompletionOptions {
  modelContext?: ChatGptWebModelContext
  signal?: AbortSignal
  onTextChunk?: (chunk: string, accumulated: string) => void
  tools?: ChatGptWebTool[]
}

export interface ChatGptWebToolCall {
  name: string
  arguments: Record<string, unknown>
}

export interface ChatGptWebUsage {
  inputTokens?: number
  outputTokens?: number
  totalTokens?: number
  inputTokenDetails?: {
    cacheReadTokens?: number
  }
}

export interface ChatGptWebResponse {
  text: string
  toolCalls?: ChatGptWebToolCall[]
  usage?: ChatGptWebUsage
}

interface ResolvedChatGptWebAuth {
  accessToken: string
  accountId?: string
  baseUrl: string
}

interface ChatGptWebCompletedEventResponse {
  output?: Array<{
    type?: string
    name?: string
    arguments?: string
    call_id?: string
    content?: Array<{ type?: string; text?: string; refusal?: string }>
  }>
  usage?: {
    input_tokens?: number
    output_tokens?: number
    total_tokens?: number
    input_tokens_details?: {
      cached_tokens?: number
    }
  }
}

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

async function resolveChatGptWebAuth(signal?: AbortSignal): Promise<ResolvedChatGptWebAuth> {
  const { configStore } = await import("./config")
  const config = configStore.get()
  const baseUrl = normalizeChatGptWebBaseUrl(config.chatgptWebBaseUrl)
  const accessToken = config.chatgptWebAccessToken?.trim()
  const configuredAccountId = config.chatgptWebAccountId?.trim()

  if (!accessToken) {
    throw new Error("ChatGPT Codex provider requires an access token")
  }

  return {
    accessToken,
    accountId: configuredAccountId || extractChatGptAccountId(accessToken),
    baseUrl,
  }
}

function getConfiguredChatGptWebModel(modelContext: ChatGptWebModelContext): string {
  const config = configStore.get()
  if (modelContext === "mcp") {
    return config.mcpToolsChatgptWebModel || DEFAULT_CHATGPT_WEB_MODEL
  }
  return config.transcriptPostProcessingChatgptWebModel || DEFAULT_CHATGPT_WEB_MODEL
}

function normalizeToolInputSchema(inputSchema: unknown): Record<string, unknown> {
  const fallback: Record<string, unknown> = { type: "object", properties: {}, required: [] }

  if (!inputSchema || typeof inputSchema !== "object" || Array.isArray(inputSchema)) {
    return fallback
  }

  const schema = { ...(inputSchema as Record<string, unknown>) }
  const schemaType = schema.type

  if (schemaType !== undefined && schemaType !== "object") {
    return fallback
  }
  schema.type = "object"

  if (!schema.properties || typeof schema.properties !== "object" || Array.isArray(schema.properties)) {
    schema.properties = {}
  }

  if (!Array.isArray(schema.required)) {
    schema.required = []
  }

  delete schema.anyOf
  delete schema.oneOf
  delete schema.allOf
  delete schema.not
  delete schema.enum

  return schema
}

function buildCodexInstructions(messages: ChatGptWebMessage[]): string {
  const instructions = messages
    .filter((message) => message.role === "system")
    .map((message) => message.content.trim())
    .filter(Boolean)
    .join("\n\n")

  return instructions || DEFAULT_CHATGPT_WEB_INSTRUCTIONS
}

function buildCodexInput(messages: ChatGptWebMessage[]): Array<Record<string, unknown>> {
  return messages
    .filter((message) => message.role !== "system")
    .map((message) => ({
      type: "message",
      role: message.role === "assistant" ? "assistant" : "user",
      content: message.content,
    }))
}

function buildCodexTools(tools: ChatGptWebTool[] | undefined): Array<Record<string, unknown>> | undefined {
  if (!tools?.length) return undefined

  return tools.map((tool) => ({
    type: "function",
    name: tool.name,
    description: tool.description || `Tool: ${tool.name}`,
    parameters: normalizeToolInputSchema(tool.inputSchema),
    strict: true,
  }))
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

function parseJsonObject(input: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(input)
    return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : {}
  } catch {
    return {}
  }
}

function extractCompletedMessageText(response: ChatGptWebCompletedEventResponse | undefined): string {
  if (!response?.output?.length) return ""

  return response.output
    .filter((item) => item.type === "message")
    .flatMap((item) => item.content || [])
    .map((content) => content.text || content.refusal || "")
    .join("")
    .trim()
}

function mapUsage(response: ChatGptWebCompletedEventResponse | undefined): ChatGptWebUsage | undefined {
  const usage = response?.usage
  if (!usage) return undefined

  return {
    inputTokens: usage.input_tokens,
    outputTokens: usage.output_tokens,
    totalTokens: usage.total_tokens,
    inputTokenDetails: {
      cacheReadTokens: usage.input_tokens_details?.cached_tokens,
    },
  }
}

export function isChatGptWebProvider(providerId?: string): providerId is "chatgpt-web" {
  return providerId === "chatgpt-web"
}

export function getCurrentChatGptWebModelName(modelContext: ChatGptWebModelContext = "mcp"): string {
  return getConfiguredChatGptWebModel(modelContext)
}

export async function makeChatGptWebResponse(
  messages: ChatGptWebMessage[],
  options: ChatGptWebCompletionOptions = {},
): Promise<ChatGptWebResponse> {
  const modelContext = options.modelContext || "mcp"
  const model = getConfiguredChatGptWebModel(modelContext)
  const auth = await resolveChatGptWebAuth(options.signal)
  const url = `${auth.baseUrl}/backend-api/codex/responses`

  const payload: Record<string, unknown> = {
    model,
    instructions: buildCodexInstructions(messages),
    store: false,
    stream: true,
    input: buildCodexInput(messages),
    text: { verbosity: "medium" },
    include: ["reasoning.encrypted_content"],
    parallel_tool_calls: true,
  }

  const codexTools = buildCodexTools(options.tools)
  if (codexTools?.length) {
    payload.tools = codexTools
    payload.tool_choice = "auto"
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${auth.accessToken}`,
    "Content-Type": "application/json",
    Accept: "text/event-stream",
    "OpenAI-Beta": "responses=experimental",
    originator: "dotagents",
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
    throw new Error(`ChatGPT Codex response failed (${response.status}): ${errorText || response.statusText}`)
  }

  if (!response.body) {
    throw new Error("ChatGPT Codex response did not include a body")
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  let accumulatedText = ""
  let completedResponse: ChatGptWebCompletedEventResponse | undefined
  const pendingToolArguments = new Map<string, string>()
  const completedToolCalls = new Map<string, ChatGptWebToolCall>()

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

      const event = parseJsonObject(data)
      const eventType = typeof event.type === "string" ? event.type : ""

      if (eventType === "response.output_text.delta") {
        const delta = typeof event.delta === "string" ? event.delta : ""
        if (delta) {
          accumulatedText += delta
          options.onTextChunk?.(delta, accumulatedText)
        }
      } else if (eventType === "response.function_call_arguments.delta") {
        const itemId = typeof event.item_id === "string" ? event.item_id : ""
        const delta = typeof event.delta === "string" ? event.delta : ""
        if (itemId && delta) {
          pendingToolArguments.set(itemId, (pendingToolArguments.get(itemId) || "") + delta)
        }
      } else if (eventType === "response.function_call_arguments.done") {
        const itemId = typeof event.item_id === "string" ? event.item_id : ""
        const argumentsText = typeof event.arguments === "string" ? event.arguments : ""
        if (itemId && argumentsText) {
          pendingToolArguments.set(itemId, argumentsText)
        }
      } else if (eventType === "response.output_item.done") {
        const item = event.item
        const toolItem =
          item && typeof item === "object"
            ? item as { type?: unknown; id?: unknown; name?: unknown; arguments?: unknown }
            : undefined
        if (toolItem?.type === "function_call") {
          const itemId = typeof toolItem.id === "string" ? toolItem.id : ""
          const name = typeof toolItem.name === "string" ? toolItem.name : ""
          const argumentsText =
            (itemId && pendingToolArguments.get(itemId)) ||
            (typeof toolItem.arguments === "string" ? toolItem.arguments : "{}")

          if (name) {
            completedToolCalls.set(itemId || `${name}-${completedToolCalls.size}`, {
              name,
              arguments: parseJsonObject(argumentsText),
            })
          }
        }
      } else if (eventType === "response.completed") {
        completedResponse = (event.response && typeof event.response === "object")
          ? event.response as ChatGptWebCompletedEventResponse
          : undefined
      } else if (eventType === "response.failed") {
        const err = event.response && typeof event.response === "object"
          ? (event.response as Record<string, unknown>).error
          : undefined
        const message = err && typeof err === "object" && typeof (err as Record<string, unknown>).message === "string"
          ? (err as Record<string, unknown>).message as string
          : "ChatGPT Codex response failed"
        throw new Error(message)
      } else if (eventType === "error") {
        const message = typeof event.message === "string" ? event.message : "ChatGPT Codex stream error"
        throw new Error(message)
      }

      boundary = findSseBoundary(buffer)
    }
  }

  const finalText = accumulatedText.trim() || extractCompletedMessageText(completedResponse)
  const toolCalls = Array.from(completedToolCalls.values())

  return {
    text: finalText,
    toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    usage: mapUsage(completedResponse),
  }
}

export async function makeChatGptWebCompletion(
  messages: ChatGptWebMessage[],
  options: ChatGptWebCompletionOptions = {},
): Promise<string> {
  const result = await makeChatGptWebResponse(messages, options)
  return result.text
}
