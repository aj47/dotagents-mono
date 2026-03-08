export function getLegacySettingsRedirectPath(targetPath: string, requestUrl: string): string {
  const request = new URL(requestUrl)
  const target = new URL(targetPath, request.origin)
  const mergedSearchParams = new URLSearchParams(target.search)

  request.searchParams.forEach((value, key) => {
    if (!mergedSearchParams.has(key)) {
      mergedSearchParams.append(key, value)
    }
  })

  const search = mergedSearchParams.toString()
  return `${target.pathname}${search ? `?${search}` : ""}${request.hash}`
}