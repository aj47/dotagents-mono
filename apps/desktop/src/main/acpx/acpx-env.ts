import path from 'node:path'
import { createRequire } from 'node:module'

const localRequire = createRequire(__filename)
type SpawnEnv = Record<string, string | undefined>

function parseNodePath(nodePath?: string): string[] {
  return (nodePath ?? '')
    .split(path.delimiter)
    .map(entry => entry.trim())
    .filter(Boolean)
}

export function resolveAcpxSupportNodePathEntries(
  resolvePackageJson: (specifier: string) => string = specifier => localRequire.resolve(specifier),
): string[] {
  const entries = new Set<string>()

  for (const packageName of ['zod']) {
    try {
      const packageJsonPath = resolvePackageJson(`${packageName}/package.json`)
      entries.add(path.dirname(path.dirname(packageJsonPath)))
    } catch {
      // Ignore optional support packages that are not locally resolvable.
    }
  }

  return [...entries]
}

export function buildAcpxSpawnEnv(
  baseEnv: SpawnEnv = process.env as SpawnEnv,
  resolvePackageJson?: (specifier: string) => string,
): SpawnEnv {
  const entries = new Set<string>(parseNodePath(baseEnv.NODE_PATH))

  for (const entry of resolveAcpxSupportNodePathEntries(resolvePackageJson)) {
    entries.add(entry)
  }

  if (entries.size === 0) {
    return { ...baseEnv }
  }

  return {
    ...baseEnv,
    NODE_PATH: [...entries].join(path.delimiter),
  }
}
