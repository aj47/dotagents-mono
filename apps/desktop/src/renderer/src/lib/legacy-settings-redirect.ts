export function getLegacySettingsRedirectPath(targetPath: string, requestUrl: string): string {
  const { search, hash } = new URL(requestUrl)
  return `${targetPath}${search}${hash}`
}