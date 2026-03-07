import { createHash } from "crypto"
import { execSync } from "child_process"
import {
  chmodSync,
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "fs"
import { dirname, join, resolve } from "path"
import { fileURLToPath } from "url"
import { createRequire } from "module"

import {
  buildLinuxReleaseManifest,
  getDebPackageArchitecture,
  normalizeLinuxArchitecture,
  parseLinuxArtifactName,
  type LinuxPackageFormat,
  type LinuxReleaseArch,
  type LinuxReleaseAsset,
} from "../src/shared/linux-artifacts"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const desktopDir = resolve(__dirname, "..")
const distDir = join(desktopDir, "dist")
const require = createRequire(import.meta.url)
const packageJson = require("../package.json")
const builderConfig = require("../electron-builder.config.cjs")

function usage(): never {
  console.log(`Usage: npx tsx scripts/build-linux.ts [options]

Options:
  --arch <current|x64|arm64>   Target Linux architecture (default: current)
  --publish <never|always>     Publish mode forwarded to AppImage build (default: never)
  --formats <AppImage,deb>     Comma-separated Linux artifact formats (default: AppImage,deb)
  --no-clean                   Preserve the existing dist directory
  --help                       Show this help message
`)
  process.exit(0)
}

function parseArgs(argv: string[]) {
  const parsed = {
    arch: "current",
    publish: "never",
    clean: true,
    formats: ["AppImage", "deb"] as LinuxPackageFormat[],
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === "--help") usage()
    if (arg === "--no-clean") {
      parsed.clean = false
      continue
    }
    if (arg === "--arch") {
      parsed.arch = argv[index + 1] ?? "current"
      index += 1
      continue
    }
    if (arg === "--publish") {
      parsed.publish = argv[index + 1] ?? "never"
      index += 1
      continue
    }
    if (arg === "--formats") {
      parsed.formats = (argv[index + 1] ?? "AppImage,deb")
        .split(",")
        .map(value => value.trim())
        .filter((value): value is LinuxPackageFormat => value === "AppImage" || value === "deb")
      index += 1
    }
  }

  return parsed
}

function run(command: string, env: NodeJS.ProcessEnv = {}) {
  execSync(command, {
    cwd: desktopDir,
    stdio: "inherit",
    env: {
      ...process.env,
      ...env,
    },
  })
}

function ensureCommand(command: string, description: string) {
  try {
    execSync(`command -v ${command}`, { stdio: "ignore", shell: "/bin/bash" })
  } catch {
    throw new Error(`${description} is required to build Linux packages (${command} not found in PATH).`)
  }
}

function getTargetArchitecture(rawArch: string): LinuxReleaseArch {
  if (rawArch === "current") {
    const currentArch = normalizeLinuxArchitecture(process.arch)
    if (!currentArch) {
      throw new Error(`Unsupported current architecture: ${process.arch}`)
    }
    return currentArch
  }

  const normalized = normalizeLinuxArchitecture(rawArch)
  if (!normalized) {
    throw new Error(`Unsupported Linux architecture argument: ${rawArch}`)
  }

  return normalized
}

function findNewestDirectory(candidates: string[]): string {
  const existing = candidates.filter(candidate => existsSync(candidate))
  if (existing.length === 0) {
    throw new Error(`Unable to locate unpacked Linux output. Looked for: ${candidates.join(", ")}`)
  }

  return existing.sort((left, right) => statSync(right).mtimeMs - statSync(left).mtimeMs)[0]
}

function buildDesktopEntry() {
  const desktop = builderConfig.linux?.desktop ?? {}
  const lines = [
    "[Desktop Entry]",
    `Name=${desktop.Name ?? builderConfig.productName}`,
    `Comment=${desktop.Comment ?? builderConfig.linux?.synopsis ?? packageJson.description}`,
    `GenericName=${desktop.GenericName ?? "AI Agent"}`,
    `Keywords=${desktop.Keywords ?? "ai;agent;assistant;mcp;automation;"}`,
    `Categories=${desktop.Categories ?? "Utility;Development;"}`,
    `StartupWMClass=${desktop.StartupWMClass ?? builderConfig.linux?.executableName ?? "dotagents"}`,
    `StartupNotify=${String(desktop.StartupNotify ?? false)}`,
    `Terminal=${String(desktop.Terminal ?? false)}`,
    `Type=${desktop.Type ?? "Application"}`,
    `Exec=/opt/${builderConfig.productName}/${builderConfig.linux?.executableName ?? "dotagents"} %U`,
    "Icon=dotagents",
    "MimeType=x-scheme-handler/dotagents;",
  ]

  return `${lines.join("\n")}\n`
}

function formatControlDescription(text: string) {
  return text
    .split(/\r?\n/)
    .flatMap(line => (line.trim().length === 0 ? [" ."] : [` ${line.trim()}`]))
    .join("\n")
}

function buildDebControl(targetArch: LinuxReleaseArch, installedSizeKb: number) {
  const debArch = getDebPackageArchitecture(targetArch)
  const depends = (builderConfig.deb?.depends ?? []).join(", ")
  const recommends = (builderConfig.deb?.recommends ?? []).join(", ")
  const description = formatControlDescription(builderConfig.linux?.description ?? packageJson.description)

  return [
    `Package: ${builderConfig.linux?.executableName ?? "dotagents"}`,
    `Version: ${packageJson.version}`,
    "Section: utils",
    "Priority: optional",
    `Architecture: ${debArch}`,
    `Maintainer: ${builderConfig.linux?.maintainer ?? "DotAgents <hi@techfren.net>"}`,
    `Installed-Size: ${Math.max(installedSizeKb, 1)}`,
    `Homepage: ${packageJson.homepage}`,
    depends ? `Depends: ${depends}` : "",
    recommends ? `Recommends: ${recommends}` : "",
    `Description: ${builderConfig.linux?.synopsis ?? packageJson.description}`,
    description,
  ]
    .filter(Boolean)
    .join("\n")
}

function calculateInstalledSizeKb(rootDir: string): number {
  const walk = (dir: string): number => {
    return readdirSync(dir, { withFileTypes: true }).reduce((total, entry) => {
      const entryPath = join(dir, entry.name)
      if (entry.isDirectory()) return total + walk(entryPath)
      return total + statSync(entryPath).size
    }, 0)
  }

  return Math.ceil(walk(rootDir) / 1024)
}

function createDebPackage(unpackedDir: string, targetArch: LinuxReleaseArch) {
  ensureCommand("dpkg-deb", "dpkg-deb")

  const stageDir = join(distDir, `.deb-stage-${targetArch}`)
  rmSync(stageDir, { recursive: true, force: true })

  const appInstallDir = join(stageDir, "opt", builderConfig.productName)
  const desktopFileDir = join(stageDir, "usr", "share", "applications")
  const iconDir = join(stageDir, "usr", "share", "icons", "hicolor", "512x512", "apps")
  const debianDir = join(stageDir, "DEBIAN")

  mkdirSync(join(stageDir, "opt"), { recursive: true })
  mkdirSync(desktopFileDir, { recursive: true })
  mkdirSync(iconDir, { recursive: true })
  mkdirSync(debianDir, { recursive: true })

  cpSync(unpackedDir, appInstallDir, { recursive: true })
  const chromeSandboxPath = join(appInstallDir, "chrome-sandbox")
  if (existsSync(chromeSandboxPath)) {
    chmodSync(chromeSandboxPath, 0o4755)
  }
  copyFileSync(join(desktopDir, "build", "icon.png"), join(iconDir, "dotagents.png"))
  writeFileSync(join(desktopFileDir, "dotagents.desktop"), buildDesktopEntry())

  copyFileSync(join(desktopDir, "build", "linux", "postinst.sh"), join(debianDir, "postinst"))
  copyFileSync(join(desktopDir, "build", "linux", "postrm.sh"), join(debianDir, "postrm"))
  chmodSync(join(debianDir, "postinst"), 0o755)
  chmodSync(join(debianDir, "postrm"), 0o755)

  const installedSizeKb = calculateInstalledSizeKb(stageDir)
  writeFileSync(join(debianDir, "control"), `${buildDebControl(targetArch, installedSizeKb)}\n`)

  const artifactName = `${builderConfig.productName}_${packageJson.version}_${getDebPackageArchitecture(targetArch)}.deb`
  const outputPath = join(distDir, artifactName)
  rmSync(outputPath, { force: true })

  run(`dpkg-deb --build --root-owner-group "${stageDir}" "${outputPath}"`)
  rmSync(stageDir, { recursive: true, force: true })

  return outputPath
}

function getLinuxUnpackedDir(targetArch: LinuxReleaseArch) {
  return findNewestDirectory([
    join(distDir, `linux-${targetArch}-unpacked`),
    join(distDir, `linux-${getDebPackageArchitecture(targetArch)}-unpacked`),
    join(distDir, "linux-unpacked"),
  ])
}

function getArtifactEntries(): LinuxReleaseAsset[] {
  if (!existsSync(distDir)) return []

  return readdirSync(distDir)
    .filter(fileName => fileName.endsWith(".deb") || fileName.endsWith(".AppImage"))
    .map(fileName => {
      const filePath = join(distDir, fileName)
      const sha256 = createHash("sha256").update(readFileSync(filePath)).digest("hex")
      return {
        name: fileName,
        sha256,
      }
    })
}

function writeReleaseMetadata() {
  const artifactEntries = getArtifactEntries()
  const manifest = {
    productName: builderConfig.productName,
    version: packageJson.version,
    generatedAt: new Date().toISOString(),
    artifacts: artifactEntries.map(entry => ({
      ...entry,
      ...parseLinuxArtifactName(entry.name),
    })),
    architectures: buildLinuxReleaseManifest(artifactEntries),
  }

  writeFileSync(join(distDir, "linux-release-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`)

  const checksumLines = artifactEntries
    .map(entry => `${entry.sha256}  ${entry.name}`)
    .sort((left, right) => left.localeCompare(right))
  writeFileSync(join(distDir, "SHA256SUMS"), `${checksumLines.join("\n")}\n`)
}

function main() {
  if (process.platform !== "linux") {
    throw new Error("build-linux.ts must be run on Linux hosts.")
  }

  const args = parseArgs(process.argv.slice(2))
  const targetArch = getTargetArchitecture(args.arch)
  const hostArch = getTargetArchitecture("current")

  if (targetArch !== hostArch && process.env.DOTAGENTS_ALLOW_LINUX_CROSS_ARCH !== "1") {
    throw new Error(
      `Cross-architecture Linux packaging is not enabled on this host (host=${hostArch}, target=${targetArch}). Use a matching build runner or set DOTAGENTS_ALLOW_LINUX_CROSS_ARCH=1 if your environment is configured for it.`,
    )
  }

  if (args.clean) {
    rmSync(distDir, { recursive: true, force: true })
  }

  const formats = new Set(args.formats)
  console.log(`\n[linux-build] Building DotAgents Linux artifacts for ${targetArch}`)
  console.log(`[linux-build] Formats: ${Array.from(formats).join(", ")}`)

  run("pnpm run prebuild:linux")
  run("npx electron-vite build")

  if (formats.has("AppImage")) {
    run(`npx electron-builder --linux AppImage --${targetArch} --config electron-builder.config.cjs --publish=${args.publish}`)
  }

  if (formats.has("deb")) {
    run(`npx electron-builder --linux dir --${targetArch} --config electron-builder.config.cjs --publish=never`)
    createDebPackage(getLinuxUnpackedDir(targetArch), targetArch)
  }

  writeReleaseMetadata()
  console.log("[linux-build] Linux artifacts and release metadata are ready in apps/desktop/dist")
}

main()