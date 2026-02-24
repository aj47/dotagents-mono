import { existsSync } from "fs"
import { execSync } from "child_process"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const isWindows = process.platform === "win32"
const binaryName = isWindows ? "dotagents-rs.exe" : "dotagents-rs"
const desktopDir = join(__dirname, "..")
const binaryPath = join(desktopDir, "resources", "bin", binaryName)

if (existsSync(binaryPath)) {
  console.log(`✅ Rust binary found at ${binaryPath}`)
  process.exit(0)
}

console.log(`⚠️  Rust binary not found at ${binaryPath}`)
console.log("🔨 Building Rust binary...")

try {
  const buildScript = isWindows ? "pnpm build-rs:win" : "pnpm build-rs"
  execSync(buildScript, { cwd: desktopDir, stdio: "inherit" })

  if (existsSync(binaryPath)) {
    console.log("✅ Rust binary built successfully")
    process.exit(0)
  } else {
    console.error("❌ Failed to build Rust binary")
    console.error("Please run 'pnpm build-rs' manually from the apps/desktop directory")
    process.exit(1)
  }
} catch (error) {
  console.error("❌ Failed to build Rust binary:", error)
  process.exit(1)
}

