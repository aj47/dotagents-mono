export function getErrorMessage(error: unknown, fallback = "Unknown error"): string {
  if (error === null || error === undefined) {
    return fallback
  }

  if (error instanceof Error) {
    return error.message || fallback
  }

  if (typeof error === "string") {
    return error || fallback
  }

  if (error && typeof error === "object") {
    const candidate = error as {
      message?: unknown
      error?: unknown
    }

    if (typeof candidate.message === "string" && candidate.message) {
      return candidate.message
    }

    if (typeof candidate.error === "string" && candidate.error) {
      return candidate.error
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
  return stringified && stringified !== "[object Object]" ? stringified : fallback
}

export function normalizeError(error: unknown, fallback = "Unknown error"): Error {
  return error instanceof Error ? error : new Error(getErrorMessage(error, fallback))
}
