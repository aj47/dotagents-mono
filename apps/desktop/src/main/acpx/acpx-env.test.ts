import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { buildAcpxSpawnEnv, resolveAcpxSupportNodePathEntries } from './acpx-env'

describe('acpx-env', () => {
  it('adds a locally resolvable support package directory to NODE_PATH', () => {
    const env = buildAcpxSpawnEnv(
      { PATH: '/usr/bin' },
      specifier => {
        expect(specifier).toBe('zod/package.json')
        return '/tmp/app/node_modules/zod/package.json'
      },
    )

    expect(env.NODE_PATH).toBe('/tmp/app/node_modules')
  })

  it('preserves existing NODE_PATH entries and de-duplicates them', () => {
    const existing = ['/a/node_modules', '/b/node_modules'].join(path.delimiter)
    const env = buildAcpxSpawnEnv(
      { NODE_PATH: existing },
      () => '/b/node_modules/zod/package.json',
    )

    expect(env.NODE_PATH?.split(path.delimiter)).toEqual(['/a/node_modules', '/b/node_modules'])
  })

  it('returns no extra entries when support packages cannot be resolved', () => {
    const entries = resolveAcpxSupportNodePathEntries(() => {
      throw new Error('missing')
    })

    expect(entries).toEqual([])
  })
})
