import { randomUUID } from "crypto"
import { configStore } from "./config"
import { isDebugLLM, logLLM } from "./debug"
import { oauthStorage } from "./oauth-storage"

const DEFAULT_CHATGPT_WEB_BASE_URL = "https://chatgpt.com"
const DEFAULT_CHATGPT_WEB_MODEL = "gpt-5.4-mini"
const DEFAULT_CHATGPT_WEB_INSTRUCTIONS = "You are a helpful assistant."
const AUTH_JWT_CLAIM_PATH = "https://api.openai.com/auth"
const CHATGPT_CODEX_AUTHORIZE_URL = "https://auth.openai.com/oauth/authorize"
const CHATGPT_CODEX_TOKEN_URL = "https://auth.openai.com/oauth/token"
const CHATGPT_CODEX_CLIENT_ID = "app_EMoamEEZ73f0CkXaXp7hrann"
const CHATGPT_CODEX_SCOPE = "openid profile email offline_access"
const CHATGPT_CODEX_REDIRECT_URI = "http://localhost:1455/auth/callback"
const CHATGPT_CODEX_STORAGE_KEY = `${DEFAULT_CHATGPT_WEB_BASE_URL}/backend-api/codex/responses`

type ChatGptWebModelContext = "mcp" | "transcript"
type CodexReasoningEffort = "minimal" | "low" | "medium" | "high"

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
  outputTokenDetails?: {
    reasoningTokens?: number
  }
}

export interface ChatGptWebResponse {
  text: string
  toolCalls?: ChatGptWebToolCall[]
  usage?: ChatGptWebUsage
}

interface PreparedCodexTools {
  tools: Array<Record<string, unknown>>
  nameMap: Map<string, string>
}

interface ResolvedChatGptWebAuth {
  accessToken: string
  accountId?: string
  baseUrl: string
}

export interface ChatGptWebAuthStatus {
  authenticated: boolean
  accountId?: string
  email?: string
  planType?: string
  connectedAt?: number
  expiresAt?: number
  callbackUrl: string
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
    output_tokens_details?: {
      reasoning_tokens?: number
    }
  }
}

const CODEX_REASONING_MODEL_PATTERNS = ["gpt-5", "gpt-4.1", "o1", "o3", "o4"] as const

function isCodexReasoningModel(model: string): boolean {
  const normalized = model.trim().toLowerCase()
  return CODEX_REASONING_MODEL_PATTERNS.some(pattern => normalized.startsWith(pattern))
}

function normalizeCodexReasoningEffort(effort: unknown): CodexReasoningEffort | undefined {
  if (effort === "minimal" || effort === "low" || effort === "medium" || effort === "high") return effort
  if (effort === "xhigh") return "high"
  return undefined
}

export function getCodexReasoningOptions(model: string): { effort: CodexReasoningEffort } | undefined {
  if (!isCodexReasoningModel(model)) return undefined

  const override = configStore.get().openaiReasoningEffort
  if (override === "none") return undefined

  const effort = normalizeCodexReasoningEffort(override) || "medium"
  if (isDebugLLM()) {
    logLLM("Applying ChatGPT Codex reasoning effort", {
      model,
      effort,
      source: override ? "user-config" : "default",
    })
  }

  return { effort }
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

function extractChatGptAuthEmail(accessToken: string): string | undefined {
  const payload = decodeJwtPayload(accessToken)
  if (!payload) return undefined

  const profileClaim = payload["https://api.openai.com/profile"]
  if (!profileClaim || typeof profileClaim !== "object") return undefined

  const email = (profileClaim as Record<string, unknown>).email
  return typeof email === "string" && email.trim().length > 0 ? email.trim() : undefined
}

function extractChatGptPlanType(accessToken: string): string | undefined {
  const payload = decodeJwtPayload(accessToken)
  if (!payload) return undefined

  const authClaim = payload[AUTH_JWT_CLAIM_PATH]
  if (!authClaim || typeof authClaim !== "object") return undefined

  const planType = (authClaim as Record<string, unknown>).chatgpt_plan_type
  return typeof planType === "string" && planType.trim().length > 0 ? planType.trim() : undefined
}

function extractTokenExpiry(accessToken: string): number | undefined {
  const payload = decodeJwtPayload(accessToken)
  const exp = payload?.exp
  return typeof exp === "number" ? exp * 1000 : undefined
}

function encodeBase64Url(value: Buffer | string): string {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "")
}

function generatePkce() {
  const verifier = encodeBase64Url(randomUUID() + randomUUID())
  const challenge = encodeBase64Url(
    require("crypto").createHash("sha256").update(verifier).digest(),
  )
  return { verifier, challenge }
}

function buildChatGptWebAuthUrl(state: string, challenge: string): string {
  const url = new URL(CHATGPT_CODEX_AUTHORIZE_URL)
  url.searchParams.set("response_type", "code")
  url.searchParams.set("client_id", CHATGPT_CODEX_CLIENT_ID)
  url.searchParams.set("redirect_uri", CHATGPT_CODEX_REDIRECT_URI)
  url.searchParams.set("scope", CHATGPT_CODEX_SCOPE)
  url.searchParams.set("code_challenge", challenge)
  url.searchParams.set("code_challenge_method", "S256")
  url.searchParams.set("state", state)
  url.searchParams.set("id_token_add_organizations", "true")
  url.searchParams.set("codex_cli_simplified_flow", "true")
  url.searchParams.set("originator", "dotagents")
  return url.toString()
}

async function exchangeCodeForTokens(code: string, codeVerifier: string) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: CHATGPT_CODEX_CLIENT_ID,
    code,
    code_verifier: codeVerifier,
    redirect_uri: CHATGPT_CODEX_REDIRECT_URI,
  })

  const response = await fetch(CHATGPT_CODEX_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: body.toString(),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => "")
    throw new Error(`ChatGPT OAuth token exchange failed (${response.status}): ${errorText || response.statusText}`)
  }

  const data = await response.json() as {
    access_token?: string
    refresh_token?: string
    token_type?: string
    scope?: string
    expires_in?: number
  }

  if (!data.access_token || !data.refresh_token || typeof data.expires_in !== "number") {
    throw new Error("ChatGPT OAuth token exchange returned incomplete credentials")
  }

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    token_type: data.token_type || "Bearer",
    scope: data.scope,
    expires_in: data.expires_in,
    expires_at: Date.now() + data.expires_in * 1000,
  }
}

async function refreshStoredChatGptTokens(refreshToken: string) {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: CHATGPT_CODEX_CLIENT_ID,
  })

  const response = await fetch(CHATGPT_CODEX_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: body.toString(),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => "")
    throw new Error(`ChatGPT OAuth refresh failed (${response.status}): ${errorText || response.statusText}`)
  }

  const data = await response.json() as {
    access_token?: string
    refresh_token?: string
    token_type?: string
    scope?: string
    expires_in?: number
  }

  if (!data.access_token || typeof data.expires_in !== "number") {
    throw new Error("ChatGPT OAuth refresh returned incomplete credentials")
  }

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token || refreshToken,
    token_type: data.token_type || "Bearer",
    scope: data.scope,
    expires_in: data.expires_in,
    expires_at: Date.now() + data.expires_in * 1000,
  }
}

function persistChatGptWebMetadata(accessToken: string, connectedAt = Date.now()): void {
  const config = configStore.get()
  configStore.save({
    ...config,
    chatgptWebAccessToken: "",
    chatgptWebSessionToken: "",
    chatgptWebBaseUrl: DEFAULT_CHATGPT_WEB_BASE_URL,
    chatgptWebAccountId: extractChatGptAccountId(accessToken),
    chatgptWebAuthEmail: extractChatGptAuthEmail(accessToken),
    chatgptWebPlanType: extractChatGptPlanType(accessToken),
    chatgptWebConnectedAt: connectedAt,
  })
}

async function getStoredChatGptWebTokens() {
  const storedTokens = await oauthStorage.getTokens(CHATGPT_CODEX_STORAGE_KEY)
  if (storedTokens?.access_token) {
    const isExpired = storedTokens.expires_at ? Date.now() >= storedTokens.expires_at : false
    if (!isExpired) {
      return storedTokens
    }
    if (storedTokens.refresh_token) {
      const refreshed = await refreshStoredChatGptTokens(storedTokens.refresh_token)
      await oauthStorage.storeTokens(CHATGPT_CODEX_STORAGE_KEY, refreshed)
      persistChatGptWebMetadata(refreshed.access_token, configStore.get().chatgptWebConnectedAt || Date.now())
      return refreshed
    }
  }
  return null
}

export async function getChatGptWebAuthStatus(): Promise<ChatGptWebAuthStatus> {
  const tokens = await getStoredChatGptWebTokens()
  const config = configStore.get()
  const fallbackAccessToken = config.chatgptWebAccessToken?.trim()
  const accessToken = tokens?.access_token || fallbackAccessToken

  return {
    authenticated: !!accessToken,
    accountId: accessToken ? extractChatGptAccountId(accessToken) : config.chatgptWebAccountId,
    email: accessToken ? extractChatGptAuthEmail(accessToken) : config.chatgptWebAuthEmail,
    planType: accessToken ? extractChatGptPlanType(accessToken) : config.chatgptWebPlanType,
    connectedAt: config.chatgptWebConnectedAt,
    expiresAt: tokens?.expires_at || (accessToken ? extractTokenExpiry(accessToken) : undefined),
    callbackUrl: CHATGPT_CODEX_REDIRECT_URI,
  }
}

export async function loginChatGptWebOAuth(): Promise<ChatGptWebAuthStatus> {
  const { shell } = await import("electron")
  const { OAuthCallbackServer } = await import("./oauth-callback-server")
  const { verifier, challenge } = generatePkce()
  const state = randomUUID()
  const callbackServer = new OAuthCallbackServer(1455)

  await callbackServer.startServer()
  try {
    await shell.openExternal(buildChatGptWebAuthUrl(state, challenge))
    const callback = await callbackServer.waitForCallback(300000)
    if (callback.error) {
      throw new Error(callback.error_description || callback.error)
    }
    if (!callback.code || callback.state !== state) {
      throw new Error("Invalid ChatGPT OAuth callback state")
    }

    const tokens = await exchangeCodeForTokens(callback.code, verifier)
    await oauthStorage.storeTokens(CHATGPT_CODEX_STORAGE_KEY, tokens)
    persistChatGptWebMetadata(tokens.access_token)
    return await getChatGptWebAuthStatus()
  } finally {
    callbackServer.stop()
  }
}

export async function logoutChatGptWebOAuth(): Promise<void> {
  await oauthStorage.clearTokens(CHATGPT_CODEX_STORAGE_KEY)
  const config = configStore.get()
  configStore.save({
    ...config,
    chatgptWebAccessToken: "",
    chatgptWebSessionToken: "",
    chatgptWebAccountId: "",
    chatgptWebBaseUrl: DEFAULT_CHATGPT_WEB_BASE_URL,
    chatgptWebAuthEmail: "",
    chatgptWebPlanType: "",
    chatgptWebConnectedAt: undefined,
  })
}

async function resolveChatGptWebAuth(signal?: AbortSignal): Promise<ResolvedChatGptWebAuth> {
  const config = configStore.get()
  const baseUrl = normalizeChatGptWebBaseUrl(config.chatgptWebBaseUrl)
  const storedTokens = await getStoredChatGptWebTokens()
  const accessToken = storedTokens?.access_token || config.chatgptWebAccessToken?.trim()
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

function sanitizeToolName(name: string, suffix?: string): string {
  let sanitized = name.replace(/:/g, "__COLON__")
  sanitized = sanitized.replace(/[^a-zA-Z0-9_-]/g, "_")

  if (suffix) {
    const suffixStr = `_${suffix}`
    const maxBaseLength = 64 - suffixStr.length
    if (sanitized.length > maxBaseLength) {
      sanitized = sanitized.substring(0, maxBaseLength)
    }
    sanitized = `${sanitized}${suffixStr}`
  } else if (sanitized.length > 64) {
    sanitized = sanitized.substring(0, 64)
  }

  return sanitized
}

function restoreToolName(sanitizedName: string, toolNameMap: Map<string, string>): string {
  if (toolNameMap.has(sanitizedName)) {
    return toolNameMap.get(sanitizedName)!
  }

  if (sanitizedName.startsWith("proxy_")) {
    const cleaned = sanitizedName.slice(6)
    if (toolNameMap.has(cleaned)) {
      return toolNameMap.get(cleaned)!
    }
  }

  return sanitizedName.replace(/__COLON__/g, ":")
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

function buildCodexTools(tools: ChatGptWebTool[] | undefined): PreparedCodexTools | undefined {
  if (!tools?.length) return undefined

  const nameMap = new Map<string, string>()
  const collisionCount = new Map<string, number>()

  const preparedTools = tools.map((tool) => {
    let sanitizedName = sanitizeToolName(tool.name)

    if (nameMap.has(sanitizedName) && nameMap.get(sanitizedName) !== tool.name) {
      const count = (collisionCount.get(sanitizedName) || 0) + 1
      collisionCount.set(sanitizedName, count)
      sanitizedName = sanitizeToolName(tool.name, String(count))
    }

    nameMap.set(sanitizedName, tool.name)

    return {
      type: "function",
      name: sanitizedName,
      description: tool.description || `Tool: ${tool.name}`,
      parameters: normalizeToolInputSchema(tool.inputSchema),
      strict: false,
    }
  })

  return {
    tools: preparedTools,
    nameMap,
  }
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
    outputTokenDetails: {
      reasoningTokens: usage.output_tokens_details?.reasoning_tokens,
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

  const preparedTools = buildCodexTools(options.tools)
  if (preparedTools?.tools.length) {
    payload.tools = preparedTools.tools
    payload.tool_choice = "auto"
  }

  const reasoning = getCodexReasoningOptions(model)
  if (reasoning) {
    payload.reasoning = reasoning
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
              name: preparedTools ? restoreToolName(name, preparedTools.nameMap) : name,
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
