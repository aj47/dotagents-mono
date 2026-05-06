import { describe, expect, it } from 'vitest'

import {
  buildLinuxReleaseManifest,
  getDebPackageArchitecture,
  normalizeLinuxArchitecture,
  parseLinuxArtifactName,
  selectLinuxArtifact,
} from './linux-artifacts'

describe('linux-artifacts', () => {
  it('normalizes Linux architecture aliases', () => {
    expect(normalizeLinuxArchitecture('x86_64')).toBe('x64')
    expect(normalizeLinuxArchitecture('amd64')).toBe('x64')
    expect(normalizeLinuxArchitecture('aarch64')).toBe('arm64')
    expect(normalizeLinuxArchitecture('arm64')).toBe('arm64')
    expect(normalizeLinuxArchitecture('ppc64le')).toBeNull()
  })

  it('parses Linux artifact names by format and architecture', () => {
    expect(parseLinuxArtifactName('DotAgents_1.2.3_amd64.deb')).toEqual({
      architecture: 'x64',
      format: 'deb',
    })

    expect(parseLinuxArtifactName('DotAgents-1.2.3-arm64.AppImage')).toEqual({
      architecture: 'arm64',
      format: 'AppImage',
    })
  })

  it('maps release architectures to Debian package architectures', () => {
    expect(getDebPackageArchitecture('x64')).toBe('amd64')
    expect(getDebPackageArchitecture('arm64')).toBe('arm64')
  })

  it('selects the preferred architecture-matched artifact and falls back formats', () => {
    const assets = [
      { name: 'DotAgents_1.2.3_amd64.deb', url: 'deb-x64' },
      { name: 'DotAgents-1.2.3-x64.AppImage', url: 'app-x64' },
      { name: 'DotAgents_1.2.3_arm64.deb', url: 'deb-arm64' },
    ]

    expect(
      selectLinuxArtifact(assets, {
        architecture: 'x64',
        distro: { id: 'ubuntu' },
      })?.url,
    ).toBe('deb-x64')

    expect(
      selectLinuxArtifact(assets, {
        architecture: 'x64',
        distro: { id: 'fedora' },
      })?.url,
    ).toBe('app-x64')

    expect(
      selectLinuxArtifact(assets, {
        architecture: 'arm64',
        distro: { id: 'fedora' },
      })?.url,
    ).toBe('deb-arm64')
  })

  it('builds a manifest keyed by architecture and package format', () => {
    const deb = { name: 'DotAgents_1.2.3_amd64.deb', sha256: 'deb-sha' }
    const appImage = { name: 'DotAgents-1.2.3-x64.AppImage', sha256: 'app-sha' }

    expect(buildLinuxReleaseManifest([deb, appImage, { name: 'notes.txt' }])).toEqual({
      x64: {
        deb,
        AppImage: appImage,
      },
    })
  })
})
