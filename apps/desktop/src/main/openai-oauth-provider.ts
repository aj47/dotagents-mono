import crypto from "crypto"
import { shell } from "electron"
import { configStore } from "./config"
import { oauthStorage } from "./oauth-storage"
import { OAuthTokens, OpenAIOAuthUsageBucket, OpenAIOAuthUsageSnapshot } from "../shared/types"
import { OAuthCallbackServer } from "./oauth-callback-server"

const OPENAI_OAUTH_STORAGE_KEY = "provider://openai-oauth"
const OPENAI_AUTH_BASE_URL = "https://auth.openai.com"
const OPENAI_CHATGPT_BASE_URL = "https://chatgpt.com/backend-api"
const OPENAI_OAUTH_CLIENT_ID = "app_EMoamEEZ73f0CkXaXp7hrann"
const OPENAI_OAUTH_SCOPE = "openid profile email offline_access"
const OPENAI_OAUTH_ORIGINATOR = "codex_chatgpt_desktop"
const OPENAI_OAUTH_CALLBACK_PORT = 1455
const OPENAI_OAUTH_CALLBACK_PATH = "/auth/callback"
const OPENAI_OAUTH_TIMEOUT_MS = 5 * 60 * 1000
const OPENAI_OAUTH_REFRESH_BUFFER_MS = 60 * 1000

type OpenAIOAuthAccount = {
  email?: string
  accountId?: string
  planType?: string
}

type OpenAIOAuthSession = {
  accessToken: string
  accountId?: string
}

function getRedirectUri(): string {
  return `http://localhost:${OPENAI_OAUTH_CALLBACK_PORT}${OPENAI_OAUTH_CALLBACK_PATH}`
}

function generatePkcePair(): { codeVerifier: string; codeChallenge: string } {
  const codeVerifier = crypto.randomBytes(32).toString("base64url")
  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url")

  return { codeVerifier, codeChallenge }
}

function decodeJwtPayload(token?: string): Record<string, unknown> | null {
  if (!token) return null

  const parts = token.split(".")
  if (parts.length < 2) return null

  try {
    const payload = parts[1]
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/")
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4)
    return JSON.parse(Buffer.from(padded, "base64").toString("utf8")) as Record<string, unknown>
  } catch {
    return null
  }
}

function extractAccountFromIdToken(idToken?: string): OpenAIOAuthAccount {
  const claims = decodeJwtPayload(idToken)
  if (!claims) {
    return {}
  }

  const nestedClaims =
    claims["https://api.openai.com/auth"] &&
    typeof claims["https://api.openai.com/auth"] === "object" &&
    !Array.isArray(claims["https://api.openai.com/auth"])
      ? (claims["https://api.openai.com/auth"] as Record<string, unknown>)
      : undefined

  const accountId =
    (typeof claims.chatgpt_account_id === "string" ? claims.chatgpt_account_id : undefined) ||
    (typeof nestedClaims?.chatgpt_account_id === "string" ? nestedClaims.chatgpt_account_id : undefined)

  const planType =
    (typeof claims.chatgpt_plan_type === "string" ? claims.chatgpt_plan_type : undefined) ||
    (typeof nestedClaims?.chatgpt_plan_type === "string" ? nestedClaims.chatgpt_plan_type : undefined)

  return {
    email: typeof claims.email === "string" ? claims.email : undefined,
    accountId,
    planType,
  }
}

function mergeTokenResponse(previousTokens: OAuthTokens | null, payload: Record<string, unknown>): OAuthTokens {
  const expiresIn =
    typeof payload.expires_in === "number"
      ? payload.expires_in
      : typeof payload.expires_in === "string"
        ? Number(payload.expires_in)
        : undefined

  return {
    access_token: typeof payload.access_token === "string" ? payload.access_token : "",
    token_type: typeof payload.token_type === "string" ? payload.token_type : "Bearer",
    expires_in: Number.isFinite(expiresIn) ? expiresIn : undefined,
    refresh_token:
      typeof payload.refresh_token === "string"
        ? payload.refresh_token
        : previousTokens?.refresh_token,
    scope: typeof payload.scope === "string" ? payload.scope : previousTokens?.scope,
    expires_at:
      Number.isFinite(expiresIn) && expiresIn !== undefined
        ? Date.now() + expiresIn * 1000
        : previousTokens?.expires_at,
  }
}

function isTokenExpired(tokens: OAuthTokens | null): boolean {
  if (!tokens?.access_token) return true
  if (!tokens.expires_at) return false
  return Date.now() >= tokens.expires_at - OPENAI_OAUTH_REFRESH_BUFFER_MS
}

function persistAccountMetadata(account: OpenAIOAuthAccount, usage?: OpenAIOAuthUsageSnapshot): void {
  const config = configStore.get()
  configStore.save({
    ...config,
    ...(account.email !== undefined ? { openaiOauthEmail: account.email } : {}),
    ...(account.accountId !== undefined ? { openaiOauthAccountId: account.accountId } : {}),
    ...(account.planType !== undefined ? { openaiOauthPlanType: account.planType } : {}),
    openaiOauthConnectedAt: config.openaiOauthConnectedAt || Date.now(),
    ...(usage !== undefined ? { openaiOauthUsage: usage } : {}),
  })
}

function clearAccountMetadata(): void {
  const config = configStore.get()
  configStore.save({
    ...config,
    openaiOauthEmail: undefined,
    openaiOauthAccountId: undefined,
    openaiOauthPlanType: undefined,
    openaiOauthConnectedAt: undefined,
    openaiOauthUsage: undefined,
  })
}

function buildAuthorizationUrl(state: string, codeChallenge: string): string {
  const url = new URL(`${OPENAI_AUTH_BASE_URL}/oauth/authorize`)
  url.searchParams.set("response_type", "code")
  url.searchParams.set("client_id", OPENAI_OAUTH_CLIENT_ID)
  url.searchParams.set("redirect_uri", getRedirectUri())
  url.searchParams.set("scope", OPENAI_OAUTH_SCOPE)
  url.searchParams.set("code_challenge", codeChallenge)
  url.searchParams.set("code_challenge_method", "S256")
  url.searchParams.set("state", state)
  url.searchParams.set("id_token_add_organizations", "true")
  url.searchParams.set("codex_cli_simplified_flow", "true")
  url.searchParams.set("originator", OPENAI_OAUTH_ORIGINATOR)
  return url.toString()
}

async function exchangeToken(payload: URLSearchParams): Promise<Record<string, unknown>> {
  const response = await fetch(`${OPENAI_AUTH_BASE_URL}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "application/json",
    },
    body: payload.toString(),
  })

  const bodyText = await response.text()
  let parsed: Record<string, unknown> = {}

  try {
    parsed = bodyText ? (JSON.parse(bodyText) as Record<string, unknown>) : {}
  } catch {
    parsed = {}
  }

  if (!response.ok) {
    const errorMessage =
      (typeof parsed.error_description === "string" && parsed.error_description) ||
      (typeof parsed.error === "string" && parsed.error) ||
      bodyText ||
      `HTTP ${response.status}`
    throw new Error(`OpenAI OAuth token request failed: ${errorMessage}`)
  }

  return parsed
}

async function saveTokens(tokens: OAuthTokens): Promise<void> {
  await oauthStorage.storeTokens(OPENAI_OAUTH_STORAGE_KEY, tokens)
}

async function loadTokens(): Promise<OAuthTokens | null> {
  return oauthStorage.getTokens(OPENAI_OAUTH_STORAGE_KEY)
}

async function refreshTokens(existingTokens: OAuthTokens): Promise<OAuthTokens> {
  if (!existingTokens.refresh_token) {
    throw new Error("OpenAI OAuth refresh token is missing")
  }

  const payload = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: OPENAI_OAUTH_CLIENT_ID,
    refresh_token: existingTokens.refresh_token,
    scope: OPENAI_OAUTH_SCOPE,
  })

  const tokenResponse = await exchangeToken(payload)
  const mergedTokens = mergeTokenResponse(existingTokens, tokenResponse)
  await saveTokens(mergedTokens)
  persistAccountMetadata(extractAccountFromIdToken(typeof tokenResponse.id_token === "string" ? tokenResponse.id_token : undefined))
  return mergedTokens
}

export async function ensureOpenAIOAuthSession(): Promise<OpenAIOAuthSession> {
  let tokens = await loadTokens()

  if (!tokens?.access_token) {
    throw new Error("OpenAI OAuth is not connected")
  }

  if (isTokenExpired(tokens)) {
    tokens = await refreshTokens(tokens)
  }

  const config = configStore.get()
  return {
    accessToken: tokens.access_token,
    accountId: config.openaiOauthAccountId || undefined,
  }
}

function rewriteResponsesUrl(url: string): string {
  return url.replace(/\/responses(\?|$)/, "/codex/responses$1")
}

function extractInstructionText(content: unknown): string {
  if (typeof content === "string") {
    return content
  }

  if (Array.isArray(content)) {
    const parts = content
      .map(part => {
        if (typeof part === "string") {
          return part
        }

        if (!part || typeof part !== "object") {
          return ""
        }

        const text = (part as Record<string, unknown>).text
        return typeof text === "string" ? text : ""
      })
      .filter(Boolean)

    return parts.join("\n")
  }

  if (content && typeof content === "object") {
    const text = (content as Record<string, unknown>).text
    return typeof text === "string" ? text : ""
  }

  return ""
}

function normalizeOpenAIOAuthResponsesBody(body: unknown): unknown {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return body
  }

  const payload = { ...(body as Record<string, unknown>) }
  payload.store = false
  const existingInstructions = typeof payload.instructions === "string" ? payload.instructions : ""

  if (!Array.isArray(payload.input)) {
    if (payload.instructions === undefined) {
      payload.instructions = existingInstructions
    }
    return payload
  }

  const instructionParts: string[] = []
  const normalizedInput = payload.input.filter(item => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return true
    }

    const record = item as Record<string, unknown>
    const role = record.role

    if (role !== "system" && role !== "developer") {
      return true
    }

    const text = extractInstructionText(record.content)
    if (text) {
      instructionParts.push(text)
    }
    return false
  })

  const mergedInstructions = [existingInstructions, ...instructionParts].filter(Boolean).join("\n")
  payload.instructions = mergedInstructions
  payload.input = normalizedInput

  return payload
}

async function normalizeOpenAIOAuthRequestInit(init?: RequestInit): Promise<RequestInit | undefined> {
  if (!init?.body || typeof init.body !== "string") {
    return init
  }

  try {
    const parsed = JSON.parse(init.body) as unknown
    const normalized = normalizeOpenAIOAuthResponsesBody(parsed)
    return {
      ...init,
      body: JSON.stringify(normalized),
    }
  } catch {
    return init
  }
}

async function normalizeOpenAIOAuthRequest(input: Request): Promise<Request> {
  const contentType = input.headers.get("content-type") || ""

  if (!contentType.toLowerCase().includes("application/json")) {
    return new Request(rewriteResponsesUrl(input.url), input)
  }

  const rawBody = await input.clone().text()
  if (!rawBody) {
    return new Request(rewriteResponsesUrl(input.url), input)
  }

  try {
    const parsed = JSON.parse(rawBody) as unknown
    const normalized = normalizeOpenAIOAuthResponsesBody(parsed)
    return new Request(rewriteResponsesUrl(input.url), {
      method: input.method,
      headers: input.headers,
      body: JSON.stringify(normalized),
      redirect: input.redirect,
      signal: input.signal,
    })
  } catch {
    return new Request(rewriteResponsesUrl(input.url), input)
  }
}

export function createOpenAIOAuthFetch(): typeof fetch {
  return async (input, init) => {
    const normalizedInit = await normalizeOpenAIOAuthRequestInit(init)

    if (typeof input === "string") {
      return fetch(rewriteResponsesUrl(input), normalizedInit)
    }

    if (input instanceof URL) {
      return fetch(new URL(rewriteResponsesUrl(input.toString())), normalizedInit)
    }

    const request = await normalizeOpenAIOAuthRequest(input)
    return fetch(request, normalizedInit)
  }
}

export function getOpenAIOAuthBaseUrl(): string {
  return OPENAI_CHATGPT_BASE_URL
}

export function getOpenAIOAuthOriginator(): string {
  return OPENAI_OAUTH_ORIGINATOR
}

function normalizeResetValue(value: unknown): string | null {
  if (typeof value === "string") {
    return value
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date(value * 1000).toISOString()
  }

  return null
}

function normalizeResetAfterSeconds(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date(Date.now() + value * 1000).toISOString()
  }

  return null
}

function pushUsageBucket(
  buckets: OpenAIOAuthUsageBucket[],
  label: string,
  used: number | null,
  limit: number | null,
  unit?: string | null,
  resetsAt?: string | null,
): void {
  buckets.push({
    label,
    used,
    limit,
    unit: unit ?? null,
    resetsAt: resetsAt ?? null,
  })
}

function extractRateLimitBuckets(
  labelPrefix: string,
  rateLimit: unknown,
  buckets: OpenAIOAuthUsageBucket[],
): void {
  if (!rateLimit || typeof rateLimit !== "object" || Array.isArray(rateLimit)) {
    return
  }

  const record = rateLimit as Record<string, unknown>
  const windows: Array<{ key: "primary_window" | "secondary_window"; label: string }> = [
    { key: "primary_window", label: "Primary" },
    { key: "secondary_window", label: "Secondary" },
  ]

  for (const windowInfo of windows) {
    const windowValue = record[windowInfo.key]
    if (!windowValue || typeof windowValue !== "object" || Array.isArray(windowValue)) {
      continue
    }

    const windowRecord = windowValue as Record<string, unknown>
    const usedPercent = typeof windowRecord.used_percent === "number"
      ? windowRecord.used_percent
      : null
    const resetAt = normalizeResetValue(windowRecord.reset_at) || normalizeResetAfterSeconds(windowRecord.reset_after_seconds)

    if (usedPercent === null && !resetAt) {
      continue
    }

    pushUsageBucket(
      buckets,
      `${labelPrefix} ${windowInfo.label}`.trim(),
      usedPercent,
      usedPercent !== null ? 100 : null,
      "%",
      resetAt,
    )
  }
}

function tryExtractUsageBuckets(value: unknown, buckets: OpenAIOAuthUsageBucket[], path: string[] = []): void {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => tryExtractUsageBuckets(entry, buckets, [...path, String(index)]))
    return
  }

  if (!value || typeof value !== "object") {
    return
  }

  const record = value as Record<string, unknown>
  const used =
    typeof record.used === "number" ? record.used :
    typeof record.consumed === "number" ? record.consumed :
    typeof record.current === "number" ? record.current :
    undefined
  const limit =
    typeof record.limit === "number" ? record.limit :
    typeof record.max === "number" ? record.max :
    typeof record.total === "number" ? record.total :
    undefined

  if (used !== undefined || limit !== undefined) {
    buckets.push({
      label:
        (typeof record.label === "string" && record.label) ||
        (typeof record.name === "string" && record.name) ||
        path[path.length - 1] ||
        "Usage",
      used: used ?? null,
      limit: limit ?? null,
      unit:
        typeof record.unit === "string"
          ? record.unit
          : typeof record.units === "string"
            ? record.units
            : null,
      resetsAt:
        typeof record.resets_at === "string"
          ? record.resets_at
          : typeof record.reset_at === "string"
            ? record.reset_at
            : typeof record.renews_at === "string"
              ? record.renews_at
              : null,
    })
  }

  for (const [key, child] of Object.entries(record)) {
    if (["used", "consumed", "current", "limit", "max", "total", "label", "name", "unit", "units", "resets_at", "reset_at", "renews_at"].includes(key)) {
      continue
    }
    tryExtractUsageBuckets(child, buckets, [...path, key])
  }
}

function normalizeUsageSnapshot(payload: Record<string, unknown>): OpenAIOAuthUsageSnapshot {
  const buckets: OpenAIOAuthUsageBucket[] = []

  extractRateLimitBuckets("Usage", payload.rate_limit, buckets)

  if (Array.isArray(payload.additional_rate_limits)) {
    for (const additional of payload.additional_rate_limits) {
      if (!additional || typeof additional !== "object" || Array.isArray(additional)) {
        continue
      }

      const record = additional as Record<string, unknown>
      const label =
        (typeof record.display_label === "string" && record.display_label) ||
        (typeof record.limit_name === "string" && record.limit_name) ||
        (typeof record.metered_feature === "string" && record.metered_feature) ||
        "Additional"

      extractRateLimitBuckets(label, record.rate_limit, buckets)
    }
  }

  if (payload.credits && typeof payload.credits === "object" && !Array.isArray(payload.credits)) {
    const credits = payload.credits as Record<string, unknown>
    if (typeof credits.balance === "string" && credits.balance) {
      pushUsageBucket(buckets, "Credits", null, null, credits.balance, null)
    } else if (typeof credits.unlimited === "boolean") {
      pushUsageBucket(buckets, "Credits", credits.unlimited ? 1 : 0, 1, credits.unlimited ? "unlimited" : "limited", null)
    }
  }

  tryExtractUsageBuckets(payload, buckets)

  const uniqueBuckets = buckets.filter((bucket, index) => {
    return buckets.findIndex(candidate =>
      candidate.label === bucket.label &&
      candidate.used === bucket.used &&
      candidate.limit === bucket.limit &&
      candidate.unit === bucket.unit &&
      candidate.resetsAt === bucket.resetsAt,
    ) === index
  })

  return {
    fetchedAt: Date.now(),
    buckets: uniqueBuckets,
    raw: payload,
  }
}

export async function refreshOpenAIOAuthUsage(): Promise<OpenAIOAuthUsageSnapshot> {
  const session = await ensureOpenAIOAuthSession()
  const response = await fetch(`${OPENAI_CHATGPT_BASE_URL}/wham/usage`, {
    headers: {
      "Authorization": `Bearer ${session.accessToken}`,
      "Accept": "application/json",
      ...(session.accountId ? { "chatgpt-account-id": session.accountId } : {}),
    },
  })

  const bodyText = await response.text()
  let payload: Record<string, unknown> = {}

  try {
    payload = bodyText ? (JSON.parse(bodyText) as Record<string, unknown>) : {}
  } catch {
    payload = {}
  }

  if (!response.ok) {
    const errorMessage =
      (typeof payload.message === "string" && payload.message) ||
      (typeof payload.error_description === "string" && payload.error_description) ||
      bodyText ||
      `HTTP ${response.status}`
    throw new Error(`Failed to fetch OpenAI OAuth usage: ${errorMessage}`)
  }

  const usage = normalizeUsageSnapshot(payload)
  const account: OpenAIOAuthAccount = {
    email: configStore.get().openaiOauthEmail || undefined,
    accountId: session.accountId,
    planType: configStore.get().openaiOauthPlanType || undefined,
  }
  persistAccountMetadata(account, usage)
  return usage
}

export async function startOpenAIOAuthFlow(): Promise<OpenAIOAuthAccount> {
  const { codeVerifier, codeChallenge } = generatePkcePair()
  const state = crypto.randomBytes(16).toString("base64url")
  const callbackServer = new OAuthCallbackServer(OPENAI_OAUTH_CALLBACK_PORT)

  await callbackServer.startServer()

  try {
    const callbackPromise = callbackServer.waitForCallback(OPENAI_OAUTH_TIMEOUT_MS)
    await shell.openExternal(buildAuthorizationUrl(state, codeChallenge))
    const callbackResult = await callbackPromise

    if (callbackResult.error) {
      throw new Error(callbackResult.error_description || callbackResult.error)
    }

    if (!callbackResult.code) {
      throw new Error("No authorization code received from OpenAI OAuth")
    }

    if (callbackResult.state !== state) {
      throw new Error("OpenAI OAuth state mismatch")
    }

    const tokenResponse = await exchangeToken(new URLSearchParams({
      grant_type: "authorization_code",
      client_id: OPENAI_OAUTH_CLIENT_ID,
      code: callbackResult.code,
      code_verifier: codeVerifier,
      redirect_uri: getRedirectUri(),
    }))

    const tokens = mergeTokenResponse(null, tokenResponse)
    await saveTokens(tokens)

    const account = extractAccountFromIdToken(typeof tokenResponse.id_token === "string" ? tokenResponse.id_token : undefined)
    persistAccountMetadata(account)

    return account
  } finally {
    callbackServer.stop()
  }
}

export async function disconnectOpenAIOAuth(): Promise<void> {
  await oauthStorage.delete(OPENAI_OAUTH_STORAGE_KEY)
  clearAccountMetadata()
}

export async function getOpenAIOAuthConnectionState(): Promise<{
  connected: boolean
  email?: string
  accountId?: string
  planType?: string
}> {
  const tokens = await loadTokens()
  const config = configStore.get()

  return {
    connected: !!tokens?.access_token,
    email: config.openaiOauthEmail || undefined,
    accountId: config.openaiOauthAccountId || undefined,
    planType: config.openaiOauthPlanType || undefined,
  }
}
