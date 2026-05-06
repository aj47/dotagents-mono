const MISSING_API_KEY_ERROR_REGEX = /api key is required(?: for)?(?:\s+[a-z0-9._-]+)?/i

export function isMissingApiKeyErrorMessage(message: string): boolean {
  return MISSING_API_KEY_ERROR_REGEX.test(message)
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
