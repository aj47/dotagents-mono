type StructuredRetryableError = Error & {
  statusCode?: number
  status?: number
  isRetryable?: boolean
}

export type RetryDisposition =
  | { kind: "non-retryable" }
  | { kind: "retry" }
  | { kind: "retry-immediately" }
  | { kind: "retry-indefinitely" }
  | { kind: "credential-cooldown" }
  | { kind: "account-rate-limit" }

function getStructuredStatusCode(error: StructuredRetryableError): number | undefined {
  return error.statusCode ?? error.status
}

function isAbortError(error: Error): boolean {
  return error.name === "AbortError" || error.message.toLowerCase().includes("abort")
}

export function isEmptyResponseError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  const message = error.message.toLowerCase()
  return (
    message.includes("empty response") ||
    message.includes("empty content") ||
    message.includes("no text") ||
    message.includes("no content")
  )
}

export function isCredentialCooldownError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  const message = error.message.toLowerCase()
  return message.includes("cooling down") && (
    message.includes("all credentials for model") ||
    message.includes("all credentials") ||
    message.includes("credentials for model")
  )
}

export function isAccountRateLimitError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  const message = error.message.toLowerCase()
  const statusCode = getStructuredStatusCode(error)
  const looksLikeRateLimit = statusCode === 429 || message.includes("rate limit") || message.includes("429")

  return looksLikeRateLimit && (
    message.includes("account's rate limit") ||
    message.includes("account rate limit") ||
    message.includes("organization's rate limit") ||
    message.includes("organization rate limit") ||
    message.includes("would exceed your account's rate limit") ||
    message.includes("would exceed your organization's rate limit")
  )
}

export function classifyRetryDisposition(error: unknown): RetryDisposition {
  if (!(error instanceof Error)) {
    return { kind: "non-retryable" }
  }

  if (isAbortError(error)) {
    return { kind: "non-retryable" }
  }

  if (isEmptyResponseError(error)) {
    return { kind: "retry-immediately" }
  }

  if (isCredentialCooldownError(error)) {
    return { kind: "credential-cooldown" }
  }

  if (isAccountRateLimitError(error)) {
    return { kind: "account-rate-limit" }
  }

  const errorWithStatus = error as StructuredRetryableError
  const statusCode = getStructuredStatusCode(errorWithStatus)
  const message = error.message.toLowerCase()

  if (typeof errorWithStatus.isRetryable === "boolean" && !errorWithStatus.isRetryable) {
    return { kind: "non-retryable" }
  }

  if (typeof statusCode === "number") {
    if (statusCode === 429) {
      return { kind: "retry-indefinitely" }
    }
    if ((statusCode >= 500 && statusCode < 600) || statusCode === 408 || statusCode === 504) {
      return { kind: "retry" }
    }
    if (statusCode >= 400 && statusCode < 500) {
      return { kind: "non-retryable" }
    }
  }

  if (typeof errorWithStatus.isRetryable === "boolean" && errorWithStatus.isRetryable) {
    return message.includes("rate limit") || message.includes("429")
      ? { kind: "retry-indefinitely" }
      : { kind: "retry" }
  }

  if (message.includes("rate limit") || message.includes("429")) {
    return { kind: "retry-indefinitely" }
  }

  if (
    message.includes("500") ||
    message.includes("502") ||
    message.includes("503") ||
    message.includes("504") ||
    message.includes("timeout") ||
    message.includes("network") ||
    message.includes("connection")
  ) {
    return { kind: "retry" }
  }

  return { kind: "non-retryable" }
}