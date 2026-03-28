function findNestedErrorMessage(error: unknown, seen: WeakSet<object>): string | undefined {
  if (error == null) {
    return undefined
  }

  if (error && typeof error === "object") {
    if (seen.has(error)) {
      return undefined
    }

    seen.add(error)
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  if (error instanceof Error) {
    const nestedFromCause = findNestedErrorMessage((error as Error & { cause?: unknown }).cause, seen)
    if (nestedFromCause) {
      return nestedFromCause
    }

    const nestedFromErrors = findNestedErrorMessage((error as Error & { errors?: unknown }).errors, seen)
    if (nestedFromErrors) {
      return nestedFromErrors
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

    for (const value of [candidate.message, candidate.error, candidate.cause, candidate.errors]) {
      const nestedMessage = findNestedErrorMessage(value, seen)
      if (nestedMessage) {
        return nestedMessage
      }
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

  if (error instanceof Error && error.message === message) {
    return error
  }

  if (error instanceof Error) {
    const normalized = new Error(message, { cause: error })
    normalized.name = error.name || normalized.name
    return normalized
  }

  return new Error(message)
}
