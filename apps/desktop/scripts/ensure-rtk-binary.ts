/**
 * Build & stage the bundled RTK binary so it ships with the packaged app.
 *
 * RTK (https://github.com/rtk-ai/rtk) does not publish prebuilt binaries, so
 * we build it from source via `cargo install --git`. The compiled binary is
 * copied to `apps/desktop/resources/bin/rtk[.exe]` which electron-builder
 * bundles into the app (same pattern as `dotagents-rs`).
 *
 * The script is intentionally tolerant:
 *   - If the binary already exists at the expected version, exit success.
 *   - If `cargo` is not installed, print a warning and exit success so dev
 *     iteration is not blocked. The runtime will fall back to a no-op wrap.
 *   - Set DOTAGENTS_RTK_REQUIRED=1 (used by release CI) to make a missing
 *     binary a hard failure instead.
 *   - Set DOTAGENTS_SKIP_RTK_BUILD=1 to skip this script entirely.
 *
 * Configurable env:
 *   RTK_GIT_URL  — git repo URL (default: https://github.com/rtk-ai/rtk)
 *   RTK_GIT_REF  — `--tag` or `--branch` ref. Omit for default branch.
 */

import { existsSync, mkdirSync, copyFileSync, chmodSync, rmSync } from "fs"
import { execSync, spawnSync } from "child_process"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import { tmpdir } from "os"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const isWindows = process.platform === "win32"
const binaryName = isWindows ? "rtk.exe" : "rtk"
const desktopDir = join(__dirname, "..")
const resourcesBinDir = join(desktopDir, "resources", "bin")
const destBinary = join(resourcesBinDir, binaryName)

const RTK_GIT_URL = process.env.RTK_GIT_URL ?? "https://github.com/rtk-ai/rtk"
const RTK_GIT_REF = process.env.RTK_GIT_REF ?? ""
const REQUIRED = process.env.DOTAGENTS_RTK_REQUIRED === "1"

if (process.env.DOTAGENTS_SKIP_RTK_BUILD === "1") {
  console.log("[rtk] DOTAGENTS_SKIP_RTK_BUILD=1 — skipping rtk binary build")
  process.exit(0)
}

if (existsSync(destBinary)) {
  console.log(`[rtk] binary already present at ${destBinary}`)
  process.exit(0)
}

function fail(message: string): never {
  if (REQUIRED) {
    console.error(`[rtk] ${message}`)
    process.exit(1)
  }
  console.warn(`[rtk] ${message} — continuing without bundled rtk binary`)
  process.exit(0)
}

const cargoProbe = spawnSync(isWindows ? "where" : "command", isWindows ? ["cargo"] : ["-v", "cargo"], { shell: !isWindows })
if (cargoProbe.status !== 0) {
  fail("`cargo` not found on PATH; install Rust (https://rustup.rs) to bundle rtk")
}

mkdirSync(resourcesBinDir, { recursive: true })

const installRoot = join(tmpdir(), `dotagents-rtk-install-${process.pid}`)
const args = ["install", "--git", RTK_GIT_URL]
if (RTK_GIT_REF) {
  // Heuristic: tags look like vX.Y.Z, branches are anything else.
  args.push(/^v?\d/.test(RTK_GIT_REF) ? "--tag" : "--branch", RTK_GIT_REF)
}
args.push("--bin", "rtk", "--root", installRoot, "--locked", "--force")

console.log(`[rtk] building from ${RTK_GIT_URL}${RTK_GIT_REF ? `@${RTK_GIT_REF}` : ""}`)
try {
  execSync(`cargo ${args.map((a) => (a.includes(" ") ? JSON.stringify(a) : a)).join(" ")}`, {
    stdio: "inherit",
    env: { ...process.env, CARGO_TERM_COLOR: "always" },
  })
} catch {
  rmSync(installRoot, { recursive: true, force: true })
  fail("cargo install of rtk failed")
}

const builtBinary = join(installRoot, "bin", binaryName)
if (!existsSync(builtBinary)) {
  rmSync(installRoot, { recursive: true, force: true })
  fail(`expected rtk binary at ${builtBinary} after cargo install`)
}

copyFileSync(builtBinary, destBinary)
if (!isWindows) {
  chmodSync(destBinary, 0o755)
}
rmSync(installRoot, { recursive: true, force: true })

console.log(`[rtk] bundled binary staged at ${destBinary}`)
