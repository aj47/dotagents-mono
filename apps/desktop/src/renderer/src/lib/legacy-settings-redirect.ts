export function getLegacySettingsRedirectPath(
  targetPath: string,
  requestUrl: string,
): string {
  const { search, hash } = new URL(requestUrl)
  const [targetBase, targetHash = ""] = targetPath.split("#", 2)
  const nextHash = hash || (targetHash ? `#${targetHash}` : "")
  return `${targetBase}${search}${nextHash}`
}
