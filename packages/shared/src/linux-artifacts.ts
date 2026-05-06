export type LinuxReleaseArch = "x64" | "arm64"
export type LinuxPackageFormat = "deb" | "AppImage"

interface LinuxDistroInfo {
  id?: string | null
  idLike?: string[]
}

export interface LinuxReleaseAsset {
  name: string
  url?: string
  sha256?: string
}

export type LinuxReleaseManifest = Partial<
  Record<LinuxReleaseArch, Partial<Record<LinuxPackageFormat, LinuxReleaseAsset>>>
>

const ARCHITECTURE_ALIASES: Record<string, LinuxReleaseArch> = {
  x64: "x64",
  amd64: "x64",
  "x86_64": "x64",
  arm64: "arm64",
  aarch64: "arm64",
}

const DEBIAN_FAMILY_IDS = new Set([
  "debian",
  "ubuntu",
  "linuxmint",
  "pop",
  "zorin",
  "elementary",
  "kali",
])

export function normalizeLinuxArchitecture(value: string | null | undefined): LinuxReleaseArch | null {
  if (!value) return null
  return ARCHITECTURE_ALIASES[value.trim().toLowerCase()] ?? null
}

export function getDebPackageArchitecture(architecture: LinuxReleaseArch): string {
  return architecture === "x64" ? "amd64" : "arm64"
}

function isDebianFamily(distro?: LinuxDistroInfo | null): boolean {
  if (!distro) return false

  const values = [distro.id, ...(distro.idLike ?? [])]
    .filter((value): value is string => Boolean(value))
    .map(value => value.toLowerCase())

  return values.some(value => DEBIAN_FAMILY_IDS.has(value))
}

function getPreferredLinuxPackageFormat(
  distro?: LinuxDistroInfo | null,
): LinuxPackageFormat {
  return isDebianFamily(distro) ? "deb" : "AppImage"
}

export function parseLinuxArtifactName(name: string): {
  architecture: LinuxReleaseArch | null
  format: LinuxPackageFormat | null
} {
  const format = name.endsWith(".deb") ? "deb" : name.endsWith(".AppImage") ? "AppImage" : null
  if (!format) {
    return { architecture: null, format: null }
  }

  const tokens = name
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)

  const architecture = tokens
    .map(token => normalizeLinuxArchitecture(token))
    .find((value): value is LinuxReleaseArch => value !== null) ?? null

  return { architecture, format }
}

export function selectLinuxArtifact(
  assets: LinuxReleaseAsset[],
  options: {
    architecture: LinuxReleaseArch
    distro?: LinuxDistroInfo | null
    preferredFormat?: LinuxPackageFormat
  },
): LinuxReleaseAsset | null {
  const preferredFormat = options.preferredFormat ?? getPreferredLinuxPackageFormat(options.distro)
  const fallbackFormat: LinuxPackageFormat = preferredFormat === "deb" ? "AppImage" : "deb"

  const matchingAssets = assets.filter(asset => {
    const parsed = parseLinuxArtifactName(asset.name)
    return parsed.architecture === options.architecture
  })

  const preferredAsset = matchingAssets.find(asset => parseLinuxArtifactName(asset.name).format === preferredFormat)
  if (preferredAsset) return preferredAsset

  return matchingAssets.find(asset => parseLinuxArtifactName(asset.name).format === fallbackFormat) ?? null
}

export function buildLinuxReleaseManifest(assets: LinuxReleaseAsset[]): LinuxReleaseManifest {
  return assets.reduce<LinuxReleaseManifest>((manifest, asset) => {
    const { architecture, format } = parseLinuxArtifactName(asset.name)
    if (!architecture || !format) return manifest

    manifest[architecture] = {
      ...manifest[architecture],
      [format]: asset,
    }

    return manifest
  }, {})
}
