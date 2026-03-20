// @ts-check
import { execSync } from "child_process"
import { existsSync, readFileSync } from "fs"
import os from "os"
import { dirname, resolve } from "path"
import { fileURLToPath } from "url"

/**
 *
 * @param {string} command
 * @param {{cwd?: string}} options
 * @returns
 */
const run = (command, { cwd } = {}) => {
  console.log(`\n$ ${command}`)
  return execSync(command, {
    cwd,
    stdio: "inherit",
    env: {
      ...process.env,
    },
  })
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const desktopDir = resolve(__dirname, "..")
const repoRoot = resolve(desktopDir, "..", "..")

const stripWrappingQuotes = (value) => {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1)
  }

  return value
}

const parseEnvValue = (rawValue) => {
  const trimmedValue = rawValue.trim()
  const quotedMatch = trimmedValue.match(/^(["'])(.*)\1(?:\s+#.*)?$/)

  if (quotedMatch) {
    return quotedMatch[2]
  }

  return stripWrappingQuotes(trimmedValue.replace(/\s+#.*$/, "").trim())
}

const loadEnvFile = (filePath) => {
  if (!existsSync(filePath)) return false

  console.log(`🔐 Loading env from ${filePath}`)
  const lines = readFileSync(filePath, "utf8").split(/\r?\n/)

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line || line.startsWith("#")) continue

    const normalized = line.startsWith("export ") ? line.slice(7).trim() : line
    const equalsIndex = normalized.indexOf("=")
    if (equalsIndex <= 0) continue

    const key = normalized.slice(0, equalsIndex).trim()
    if (!key) continue

    const value = parseEnvValue(normalized.slice(equalsIndex + 1))
    if (process.env[key] === undefined) {
      process.env[key] = value
    }
  }

  return true
}

const loadReleaseEnv = () => {
  const explicitFile = process.env.DOTAGENTS_RELEASE_ENV_FILE
  const homeDir = os.homedir()
  const files = explicitFile
    ? [resolve(repoRoot, explicitFile)]
    : [
        resolve(homeDir, ".config", "dotagents", "release.env"),
        resolve(homeDir, ".dotagents", "release.env"),
        resolve(repoRoot, ".env"),
        resolve(repoRoot, ".env.local"),
        resolve(desktopDir, ".env"),
        resolve(desktopDir, ".env.local"),
      ]

  let loadedAny = false
  for (const filePath of files) {
    loadedAny = loadEnvFile(filePath) || loadedAny
  }

  if (!loadedAny) {
    console.warn("⚠️  No .env file found for desktop release builds")
  }

  if (!process.env.APPLE_DEVELOPER_ID && process.env.CSC_NAME) {
    process.env.APPLE_DEVELOPER_ID = process.env.CSC_NAME
  }

  if (process.platform === "darwin" && !process.env.ENABLE_HARDENED_RUNTIME) {
    process.env.ENABLE_HARDENED_RUNTIME = "true"
  }
}

const requireEnv = (name) => {
  if (!process.env[name]) {
    throw new Error(`Missing required release env: ${name}`)
  }
}

const resolvePublishMode = () => {
  if (process.env.DOTAGENTS_PUBLISH) {
    return process.env.DOTAGENTS_PUBLISH
  }

  return process.env.GH_TOKEN ? "always" : "never"
}

const validateMacReleaseEnv = () => {
  requireEnv("CSC_NAME")
  requireEnv("APPLE_DEVELOPER_ID")

  const hasApiKeyAuth =
    Boolean(process.env.APPLE_API_KEY) &&
    Boolean(process.env.APPLE_API_KEY_ID) &&
    Boolean(process.env.APPLE_API_ISSUER)

  if (hasApiKeyAuth) {
    return
  }

  requireEnv("APPLE_TEAM_ID")
  requireEnv("APPLE_ID")
  requireEnv("APPLE_APP_SPECIFIC_PASSWORD")
}

const preferApiKeyNotarization = () => {
  const hasApiKeyAuth =
    Boolean(process.env.APPLE_API_KEY) &&
    Boolean(process.env.APPLE_API_KEY_ID) &&
    Boolean(process.env.APPLE_API_ISSUER)

  if (!hasApiKeyAuth) {
    return
  }

  delete process.env.APPLE_ID
  delete process.env.APPLE_APP_SPECIFIC_PASSWORD
  console.log("🔐 Using App Store Connect API key for notarization")
}

loadReleaseEnv()
preferApiKeyNotarization()

const publishMode = resolvePublishMode()

console.log(`📦 Desktop release mode: publish=${publishMode}`)

run(`rm -rf dist`, { cwd: desktopDir })

run(`corepack pnpm --filter @dotagents/shared build`, { cwd: repoRoot })
run(`corepack pnpm --filter @dotagents/mcp-whatsapp build`, { cwd: repoRoot })
run(`corepack pnpm build-rs`, { cwd: desktopDir })

if (process.platform === "darwin") {
  validateMacReleaseEnv()
  run(`npx electron-vite build`, {
    cwd: desktopDir,
  })
  run(`npx electron-builder --mac --config electron-builder.config.cjs --publish=${publishMode}`, {
    cwd: desktopDir,
  })
} else if (process.platform === "linux") {
  run(`npx tsx scripts/build-linux.ts --arch current --publish ${publishMode}`, {
    cwd: desktopDir,
  })
} else {
  run(`npx tsx scripts/ensure-build-dirs.ts`, {
    cwd: desktopDir,
  })
  run(`npx electron-vite build`, {
    cwd: desktopDir,
  })
  run(`npx electron-builder --win --config electron-builder.config.cjs --publish=${publishMode}`, {
    cwd: desktopDir,
  })
}
