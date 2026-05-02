import { existsSync, readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const packageJson = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
) as { scripts?: Record<string, string> }

const rootPackageJson = JSON.parse(
  readFileSync(new URL("../../../package.json", import.meta.url), "utf8"),
) as { scripts?: Record<string, string> }

const desktopReleaseArtifactsWorkflow = readFileSync(
  new URL("../../../.github/workflows/desktop-release-artifacts.yml", import.meta.url),
  "utf8",
)

const installScript = readFileSync(
  new URL("../../../scripts/install.sh", import.meta.url),
  "utf8",
)

const installPowerShellScript = readFileSync(
  new URL("../../../scripts/install.ps1", import.meta.url),
  "utf8",
)

const desktopBuilderConfig = readFileSync(
  new URL("../electron-builder.config.cjs", import.meta.url),
  "utf8",
)

const installationDoc = readFileSync(
  new URL("../../../docs-site/docs/getting-started/installation.md", import.meta.url),
  "utf8",
)

const desktopReleaseScript = readFileSync(
  new URL("../scripts/release.js", import.meta.url),
  "utf8",
)

const linuxBuildScript = readFileSync(
  new URL("../scripts/build-linux.ts", import.meta.url),
  "utf8",
)

const rootBuildReleaseScript = readFileSync(
  new URL("../../../scripts/build-release.sh", import.meta.url),
  "utf8",
)

const buildingDoc = readFileSync(
  new URL("../../../BUILDING.md", import.meta.url),
  "utf8",
)

describe("desktop package scripts", () => {
  it("uses pnpm instead of npm run inside package scripts", () => {
    const scriptEntries = Object.entries(packageJson.scripts ?? {})
    const npmRunPattern = /(^|[;&|()\s])npm run\b/

    for (const [name, command] of scriptEntries) {
      expect(command, `script ${name} should avoid npm run`).not.toMatch(npmRunPattern)
    }
  })

  it("keeps desktop releases local instead of relying on a GitHub Actions release workflow", () => {
    expect(existsSync(new URL("../../../.github/workflows/build-release.yml", import.meta.url))).toBe(false)
  })

  it("builds workspace packages required by packaged desktop runtime", () => {
    expect(rootPackageJson.scripts?.build).toContain("@dotagents/shared build")
    expect(rootPackageJson.scripts?.build).toContain("@dotagents/core build")
    expect(packageJson.scripts?.["build:workspace-deps"]).toContain("@dotagents/shared build")
    expect(packageJson.scripts?.["build:workspace-deps"]).toContain("@dotagents/core build")
    expect(packageJson.scripts?.["build:packaged-workspaces"]).toContain("build:workspace-deps")
    expect(packageJson.scripts?.["build:packaged-workspaces"]).toContain("@dotagents/mcp-whatsapp build")
    expect(packageJson.scripts?.["build:win:skip-types"]).toContain("build:packaged-workspaces")
    expect(packageJson.scripts?.["prebuild:linux"]).toContain("build:packaged-workspaces")
    expect(desktopReleaseArtifactsWorkflow).toContain("pnpm --filter @dotagents/shared build")
    expect(desktopReleaseArtifactsWorkflow).toContain("pnpm --filter @dotagents/core build")
    expect(desktopReleaseArtifactsWorkflow).toContain("pnpm --filter @dotagents/mcp-whatsapp build")
  })

  it("loads .env-based credentials in the local desktop release flow", () => {
    expect(desktopReleaseScript).toContain("DOTAGENTS_RELEASE_ENV_FILE")
    expect(desktopReleaseScript).toContain('.config", "dotagents", "release.env')
    expect(desktopReleaseScript).toContain("APPLE_API_KEY")
    expect(desktopReleaseScript).toContain("APPLE_API_KEY_ID")
    expect(desktopReleaseScript).toContain("APPLE_API_ISSUER")
    expect(desktopReleaseScript).toContain("const parseEnvValue")
    expect(desktopReleaseScript).toContain('replace(/\\s+#.*$/, "")')
    expect(desktopReleaseScript).toContain('delete process.env.APPLE_ID')
    expect(desktopReleaseScript).toContain('delete process.env.APPLE_APP_SPECIFIC_PASSWORD')
    expect(desktopReleaseScript).toContain("APPLE_APP_SPECIFIC_PASSWORD")
    expect(desktopReleaseScript).toContain("GH_TOKEN")
    expect(desktopReleaseScript.indexOf("loadReleaseEnv()")).toBeLessThan(
      desktopReleaseScript.indexOf("const publishMode = resolvePublishMode()"),
    )
    expect(rootBuildReleaseScript).toContain("load_release_env")
    expect(rootBuildReleaseScript).toContain('$HOME/.config/dotagents/release.env')
    expect(rootBuildReleaseScript).toContain("validate_macos_release_env")
    expect(rootBuildReleaseScript).toContain("APPLE_API_KEY")
    expect(rootBuildReleaseScript).toContain("APPLE_API_KEY_ID")
    expect(rootBuildReleaseScript).toContain("APPLE_API_ISSUER")
    expect(rootBuildReleaseScript).toContain("unset APPLE_ID")
    expect(rootBuildReleaseScript).toContain("unset APPLE_APP_SPECIFIC_PASSWORD")
    expect(buildingDoc).toContain("pnpm release")
    expect(buildingDoc).toContain("DOTAGENTS_RELEASE_ENV_FILE")
    expect(buildingDoc).toContain("~/.config/dotagents/release.env")
    expect(buildingDoc).toContain("source \"$HOME/.config/dotagents/release.env\"")
    expect(buildingDoc).toContain("legacy Apple ID vars are ignored")
  })

  it("ships cross-platform one-line installer entry points", () => {
    expect(installScript).toContain("DOTAGENTS_FROM_SOURCE")
    expect(installScript).toContain("select_release_asset_url")
    expect(installScript).toContain("DOTAGENTS_RELEASE_TAG")
    expect(installPowerShellScript).toContain("Install-Release")
    expect(installPowerShellScript).toContain("Invoke-RestMethod")
    expect(installationDoc).toContain("scripts/install.sh | bash")
    expect(installationDoc).toContain("scripts/install.ps1 | iex")
  })

  it("keeps notarization wired through electron-builder env vars", () => {
    expect(desktopBuilderConfig).toContain("process.env.APPLE_API_KEY")
    expect(desktopBuilderConfig).toContain("process.env.APPLE_API_KEY_ID")
    expect(desktopBuilderConfig).toContain("process.env.APPLE_API_ISSUER")
    expect(desktopBuilderConfig).toContain("process.env.APPLE_TEAM_ID")
    expect(desktopBuilderConfig).toContain("process.env.APPLE_ID")
    expect(desktopBuilderConfig).toContain("process.env.APPLE_APP_SPECIFIC_PASSWORD")
  })

  it("disables hardlinks for Linux electron-builder packaging", () => {
    expect(linuxBuildScript).toContain('USE_HARD_LINKS: "false"')
    expect(linuxBuildScript).toContain("electronBuilderLinuxEnv")
  })
})
