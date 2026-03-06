function getErrorText(error: unknown, seen = new WeakSet<object>()): string {
  if (error === null || error === undefined) return ""

  if (error instanceof Error) {
    if (error.message) return error.message

    const causeText = getErrorText((error as Error & { cause?: unknown }).cause, seen)
    if (causeText) return causeText
  }

  if (typeof error === "string") return error

  if (Array.isArray(error)) {
    for (const item of error) {
      const itemText = getErrorText(item, seen)
      if (itemText) return itemText
    }
    return ""
  }

  if (error && typeof error === "object") {
    if (seen.has(error)) return ""
    seen.add(error)

    const candidate = error as {
      message?: unknown
      error?: unknown
      cause?: unknown
      errors?: unknown
    }

    for (const value of [candidate.message, candidate.error, candidate.cause, candidate.errors]) {
      const nestedText = getErrorText(value, seen)
      if (nestedText) return nestedText
    }
  }

  return ""
}

export function getSettingsSaveErrorMessage(error: unknown): string {
  const rawMessage = getErrorText(error).trim()
  const lowerMessage = rawMessage.toLowerCase()

  if (!rawMessage) {
    return "Couldn't save your settings. Please try again."
  }

  if (
    lowerMessage.includes("eacces") ||
    lowerMessage.includes("eperm") ||
    lowerMessage.includes("permission denied")
  ) {
    return "Couldn't save your settings because DotAgents doesn't have permission to write its config files."
  }

  if (lowerMessage.includes("enospc") || lowerMessage.includes("no space left")) {
    return "Couldn't save your settings because your disk is full. Free up some space and try again."
  }

  if (lowerMessage.includes("erofs") || lowerMessage.includes("read-only")) {
    return "Couldn't save your settings because the config location is read-only."
  }

  const details = rawMessage.replace(/^Failed to save settings to disk\.?\s*/i, "")
  return details
    ? `Couldn't save your settings. ${details}`
    : "Couldn't save your settings. Please try again."
}