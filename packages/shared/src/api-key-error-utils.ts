const MISSING_API_KEY_ERROR_REGEX = /api key is required(?: for)?(?:\s+[a-z0-9._-]+)?/i

export function isMissingApiKeyErrorMessage(message: string): boolean {
  return MISSING_API_KEY_ERROR_REGEX.test(message)
}

export function isEmptyResponseErrorMessage(message: string): boolean {
  const normalized = message.toLowerCase()
  return (
    normalized.includes("empty response") ||
    normalized.includes("empty content") ||
    normalized.includes("no text") ||
    normalized.includes("no content")
  )
}

export function isEmptyResponseError(error: unknown): boolean {
  return error instanceof Error && isEmptyResponseErrorMessage(error.message)
}

export function isRateLimitError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  const errorWithStatus = error as { statusCode?: number; status?: number }
  const statusCode = errorWithStatus.statusCode ?? errorWithStatus.status
  if (typeof statusCode === "number" && statusCode === 429) {
    return true
  }

  const message = error.message.toLowerCase()
  return message.includes("429") || message.includes("rate limit")
}

export function isRetryableLlmProviderError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  const message = error.message.toLowerCase()

  if (error.name === "AbortError" || message.includes("abort")) {
    return false
  }

  if (isLocalConfigurationErrorMessage(error.message)) {
    return false
  }

  if (isEmptyResponseError(error)) {
    return true
  }

  const errorWithStatus = error as {
    statusCode?: number
    isRetryable?: boolean
    status?: number
  }

  if (typeof errorWithStatus.isRetryable === "boolean") {
    return errorWithStatus.isRetryable
  }

  const statusCode = errorWithStatus.statusCode ?? errorWithStatus.status
  const hasStructuredStatusCode = typeof statusCode === "number"
  if (hasStructuredStatusCode) {
    if (statusCode === 408 || statusCode === 429) {
      return true
    }
    if (statusCode >= 400 && statusCode < 500) {
      return false
    }
  }

  if (!hasStructuredStatusCode && message.includes("stream error")) {
    const isKnownCodexTransient =
      message.includes("chatgpt codex stream error") ||
      message.includes("chatgpt codex response failed") ||
      message.includes("chatgpt codex response.failed")
    if (!isKnownCodexTransient) {
      return false
    }
  }

  return true
}

export function isLocalConfigurationErrorMessage(message: string): boolean {
  if (isMissingApiKeyErrorMessage(message)) {
    return true
  }

  const normalized = message.toLowerCase()
  return (
    normalized.includes("unknown provider:") ||
    normalized.includes("base url is required") ||
    normalized.includes("access token is required") ||
    normalized.includes("session token is required") ||
    normalized.includes("is not configured")
  )
}
