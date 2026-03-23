function normalizeMessage(message: string | undefined): string | undefined {
  const trimmed = message?.trim()
  return trimmed || undefined
}

function shouldAppendNestedErrorMessage(message: string): boolean {
  const normalized = message.trim().toLowerCase()

  if (!normalized) {
    return false
  }

  if (normalized.endsWith(":")) {
    return true
  }

  return [
    /^cannot connect to api\b/,
    /^failed after \d+ attempts\b/,
    /\brequest failed\b/,
    /\bstreaming request failed\b/,
    /\bfetch failed\b/,
    /\bnetwork error\b/,
    /\bconnection failed\b/,
    /^terminated$/,
    /^aborted$/,
    /\bunknown error\b/,
  ].some((pattern) => pattern.test(normalized))
}

function mergeNestedErrorMessage(
  message: string | undefined,
  nestedMessage: string | undefined,
): string | undefined {
  const normalizedMessage = normalizeMessage(message)
  const normalizedNestedMessage = normalizeMessage(nestedMessage)

  if (!normalizedMessage) {
    return normalizedNestedMessage
  }

  if (!normalizedNestedMessage) {
    return normalizedMessage
  }

  if (normalizedMessage === normalizedNestedMessage) {
    return normalizedMessage
  }

  if (normalizedMessage.includes(normalizedNestedMessage)) {
    return normalizedMessage
  }

  if (normalizedNestedMessage.includes(normalizedMessage)) {
    return normalizedNestedMessage
  }

  if (!shouldAppendNestedErrorMessage(normalizedMessage)) {
    return normalizedMessage
  }

  const separator = normalizedMessage.endsWith(":") ? " " : ": "
  return `${normalizedMessage}${separator}${normalizedNestedMessage}`
}

function findNestedErrorMessage(error: unknown, seen: WeakSet<object>): string | undefined {
  if (error === null || error === undefined) {
    return undefined
  }

  if (error && typeof error === "object") {
    if (seen.has(error)) {
      return undefined
    }

    seen.add(error)
  }

  if (error instanceof Error) {
    const nestedFromCause = findNestedErrorMessage((error as Error & { cause?: unknown }).cause, seen)
    const nestedFromErrors = findNestedErrorMessage((error as Error & { errors?: unknown }).errors, seen)

    const mergedMessage = mergeNestedErrorMessage(
      error.message,
      nestedFromCause || nestedFromErrors,
    )
    if (mergedMessage) {
      return mergedMessage
    }
  }

  if (typeof error === "string") {
    return error || undefined
  }

  if (Array.isArray(error)) {
    for (const item of error) {
      const nestedMessage = findNestedErrorMessage(item, seen)
      if (nestedMessage) {
        return nestedMessage
      }
    }
  }

  if (error && typeof error === "object") {
    const candidate = error as {
      message?: unknown
      error?: unknown
      cause?: unknown
      errors?: unknown
    }

    const messageField = findNestedErrorMessage(candidate.message, seen)
    const nestedField = [candidate.error, candidate.cause, candidate.errors]
      .map((value) => findNestedErrorMessage(value, seen))
      .find((value): value is string => Boolean(value))

    const mergedMessage = mergeNestedErrorMessage(messageField, nestedField)
    if (mergedMessage) {
      return mergedMessage
    }

    try {
      const serialized = JSON.stringify(error)
      if (serialized && serialized !== "{}") {
        return serialized
      }
    } catch {
      // Fall through to String(error) when serialization fails.
    }
  }

  const stringified = String(error)
  if (error instanceof Error && !error.message && stringified === error.name) {
    return undefined
  }

  return stringified && stringified !== "[object Object]" ? stringified : undefined
}

export function getErrorMessage(error: unknown, fallback = "Unknown error"): string {
  return findNestedErrorMessage(error, new WeakSet()) || fallback
}

export function normalizeError(error: unknown, fallback = "Unknown error"): Error {
  const message = getErrorMessage(error, fallback)

  if (error instanceof Error) {
    if (error.message === message) {
      return error
    }

    const normalized = new Error(message, { cause: error })
    normalized.name = error.name || normalized.name
    return normalized
  }

  return new Error(message)
}
