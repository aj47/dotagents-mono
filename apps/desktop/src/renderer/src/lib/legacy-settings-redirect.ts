export function getLegacySettingsRedirectPath(
  targetPath: string,
  requestUrl: string,
  defaultSearchParams?: Record<string, string>
): string {
  const { search, hash } = new URL(requestUrl)
  const nextSearchParams = new URLSearchParams(search)

  if (defaultSearchParams) {
    for (const [key, value] of Object.entries(defaultSearchParams)) {
      if (!nextSearchParams.has(key)) {
        nextSearchParams.set(key, value)
      }
    }
  }

  const nextSearch = nextSearchParams.toString()
  return `${targetPath}${nextSearch ? `?${nextSearch}` : ""}${hash}`
}