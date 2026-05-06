function isGenericSaveSettingsMessage(message: string): boolean {
  return /^failed to save settings to disk[.:]?\s*$/i.test(message.trim())
}

function getNestedErrorText(values: unknown[], seen: WeakSet<object>): string {
  for (const value of values) {
    const nestedText = getErrorText(value, seen)
    if (nestedText) return nestedText
  }

  return ""
}

function getErrorText(error: unknown, seen = new WeakSet<object>()): string {
  if (error === null || error === undefined) return ""

  if (error instanceof Error) {
    if (seen.has(error)) return ""
    seen.add(error)

    const message = error.message.trim()
    const nestedText = getNestedErrorText(
      [
        (error as Error & { cause?: unknown }).cause,
        (error as Error & { errors?: unknown }).errors,
      ],
      seen,
    )

    if (message && (!isGenericSaveSettingsMessage(message) || !nestedText)) {
      return message
    }

    if (nestedText) return nestedText

    const wrappedErrorText = getErrorText((error as Error & { error?: unknown }).error, seen)
    if (wrappedErrorText) return wrappedErrorText

    return ""
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

    const messageText = getErrorText(candidate.message, seen)
    const nestedText = getNestedErrorText([candidate.error, candidate.cause, candidate.errors], seen)

    if (messageText && (!isGenericSaveSettingsMessage(messageText) || !nestedText)) {
      return messageText
    }

    if (nestedText) return nestedText
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
