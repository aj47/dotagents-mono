function findFirstNestedMessage(values: unknown[], seen: WeakSet<object>): string | undefined {
  for (const value of values) {
    const nestedMessage = findNestedErrorMessage(value, seen)
    if (nestedMessage) {
      return nestedMessage
    }
  }

  return undefined
}

function isIncompleteErrorMessage(message: string): boolean {
  return /:\s*$/.test(message.trim())
}

function appendNestedErrorDetail(message: string, nestedMessage: string): string {
  const trimmedMessage = message.trimEnd()
  const trimmedNested = nestedMessage.trim()

  if (!trimmedMessage || !trimmedNested) {
    return trimmedMessage || trimmedNested
  }

  const lowerMessage = trimmedMessage.toLowerCase()
  const lowerNested = trimmedNested.toLowerCase()

  if (lowerMessage.includes(lowerNested)) {
    return trimmedMessage
  }

  const lastErrorMatch = trimmedMessage.match(/last error:\s*(.+)$/i)
  if (lastErrorMatch) {
    const lastErrorText = lastErrorMatch[1]?.trim().replace(/:\s*$/, "")
    if (lastErrorText) {
      const lowerLastErrorText = lastErrorText.toLowerCase()
      if (lowerNested.startsWith(lowerLastErrorText)) {
        const remainder = trimmedNested.slice(lastErrorText.length).replace(/^:\s*/, "")
        if (remainder) {
          return `${trimmedMessage} ${remainder}`
        }
        return trimmedMessage
      }
    }
  }

  const separator = /:\s*$/.test(trimmedMessage) ? " " : ": "
  return `${trimmedMessage}${separator}${trimmedNested}`
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
    const candidate = error as Error & {
      cause?: unknown
      errors?: unknown
      lastError?: unknown
    }
    const nestedMessage = findFirstNestedMessage(
      [candidate.cause, candidate.lastError, candidate.errors],
      seen,
    )

    if (error.message) {
      if (nestedMessage && isIncompleteErrorMessage(error.message)) {
        return appendNestedErrorDetail(error.message, nestedMessage)
      }

      return error.message
    }

    if (nestedMessage) {
      return nestedMessage
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
      lastError?: unknown
    }

    const nestedMessage = findFirstNestedMessage(
      [candidate.message, candidate.error, candidate.cause, candidate.lastError, candidate.errors],
      seen,
    )
    if (nestedMessage) {
      return nestedMessage
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
