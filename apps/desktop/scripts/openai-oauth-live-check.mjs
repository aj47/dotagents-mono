import { app, safeStorage } from "electron"
import crypto from "crypto"
import fs from "fs"
import path from "path"

const DEFAULT_APP_ID = process.env.APP_ID?.trim() || "app.dotagents"
const OPENAI_OAUTH_STORAGE_KEY = "provider://openai-oauth"
const OPENAI_CHATGPT_BASE_URL = "https://chatgpt.com/backend-api"
const OPENAI_OAUTH_ORIGINATOR = "codex_chatgpt_desktop"

function parseArgs(argv) {
  const args = {
    model: process.env.OPENAI_OAUTH_MODEL || "gpt-5.4-mini",
    prompt: process.env.OPENAI_OAUTH_PROMPT || "Reply with exactly: openai oauth ok",
    accessToken: process.env.OPENAI_OAUTH_ACCESS_TOKEN || "",
    accountId: process.env.OPENAI_OAUTH_ACCOUNT_ID || "",
    showResponse: false,
  }

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]

    if (arg === "--model" && argv[i + 1]) {
      args.model = argv[i + 1]
      i += 1
      continue
    }

    if (arg === "--prompt" && argv[i + 1]) {
      args.prompt = argv[i + 1]
      i += 1
      continue
    }

    if (arg === "--access-token" && argv[i + 1]) {
      args.accessToken = argv[i + 1]
      i += 1
      continue
    }

    if (arg === "--account-id" && argv[i + 1]) {
      args.accountId = argv[i + 1]
      i += 1
      continue
    }

    if (arg === "--show-response") {
      args.showResponse = true
      continue
    }
  }

  return args
}

function getDataFolder() {
  return path.join(app.getPath("appData"), DEFAULT_APP_ID)
}

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) {
    return null
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8"))
}

function decryptOAuthStorage(encryptedData, encryptionKey) {
  const parsed = JSON.parse(encryptedData)

  if (parsed.method === "safeStorage") {
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error("Electron safeStorage is not available on this machine")
    }

    return safeStorage.decryptString(Buffer.from(parsed.data, "base64"))
  }

  if (parsed.method === "aes") {
    const iv = Buffer.from(parsed.iv, "hex")
    const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey, iv)
    decipher.setAuthTag(Buffer.from(parsed.authTag, "hex"))
    let decrypted = decipher.update(parsed.data, "hex", "utf8")
    decrypted += decipher.final("utf8")
    return decrypted
  }

  throw new Error(`Unknown OAuth storage encryption method: ${String(parsed.method)}`)
}

function loadOpenAIOAuthSession(dataFolder) {
  const oauthStoragePath = path.join(dataFolder, "oauth-storage.json")
  const oauthKeyPath = path.join(dataFolder, ".oauth-key")

  if (!fs.existsSync(oauthStoragePath)) {
    throw new Error(`OAuth storage file not found: ${oauthStoragePath}`)
  }

  if (!fs.existsSync(oauthKeyPath)) {
    throw new Error(`OAuth key file not found: ${oauthKeyPath}`)
  }

  const encryptedData = fs.readFileSync(oauthStoragePath, "utf8")
  const encryptionKey = fs.readFileSync(oauthKeyPath)
  const decryptedData = decryptOAuthStorage(encryptedData, encryptionKey)
  const allData = JSON.parse(decryptedData)
  const oauthConfig = allData?.[OPENAI_OAUTH_STORAGE_KEY]?.config
  const tokens = oauthConfig?.tokens

  if (!tokens?.access_token) {
    throw new Error("OpenAI OAuth access token not found in OAuth storage")
  }

  return tokens
}

function buildHeaders(accessToken, accountId) {
  return {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/json",
    "Content-Type": "application/json",
    originator: OPENAI_OAUTH_ORIGINATOR,
    ...(accountId ? { "chatgpt-account-id": accountId } : {}),
  }
}

async function fetchJson(url, options) {
  const response = await fetch(url, options)
  const text = await response.text()

  let json = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = null
  }

  return { response, text, json }
}

function printStep(name, details) {
  console.log(`\n[${name}]`)
  console.log(details)
}

function summarizeModels(payload) {
  if (!Array.isArray(payload)) {
    return "Unexpected models payload shape"
  }

  const names = payload
    .map(entry => (entry && typeof entry === "object" ? entry.slug || entry.id : null))
    .filter(value => typeof value === "string")

  return `${names.length} models\n${names.slice(0, 20).join(", ")}`
}

function buildCodexRequestBody(model, prompt) {
  return {
    model,
    instructions: "You are a concise assistant.",
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: prompt,
          },
        ],
      },
    ],
    stream: false,
    store: false,
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  await app.whenReady()

  const dataFolder = getDataFolder()
  const config = readJsonIfExists(path.join(dataFolder, "config.json")) || {}
  let tokens = null
  let storageWarning = ""

  if (args.accessToken) {
    tokens = { access_token: args.accessToken }
  } else {
    try {
      tokens = loadOpenAIOAuthSession(dataFolder)
    } catch (error) {
      storageWarning =
        error instanceof Error
          ? error.message
          : String(error)
    }
  }

  if (!tokens?.access_token) {
    throw new Error(
      `${storageWarning || "OpenAI OAuth access token not found."}\n` +
      "Pass a token explicitly with --access-token or OPENAI_OAUTH_ACCESS_TOKEN."
    )
  }

  const accountId = args.accountId || config.openaiOauthAccountId || ""
  const model = config.mcpToolsOpenaiOauthModel || args.model

  printStep("Context", [
    `dataFolder=${dataFolder}`,
    `accountId=${accountId || "missing"}`,
    `model=${model}`,
    `expiresAt=${tokens.expires_at || "unknown"}`,
    ...(storageWarning ? [`storageWarning=${storageWarning}`] : []),
  ].join("\n"))

  const commonHeaders = buildHeaders(tokens.access_token, accountId)

  const modelsResult = await fetchJson(`${OPENAI_CHATGPT_BASE_URL}/codex/models`, {
    method: "GET",
    headers: {
      Authorization: commonHeaders.Authorization,
      Accept: commonHeaders.Accept,
      originator: commonHeaders.originator,
      ...(accountId ? { "chatgpt-account-id": accountId } : {}),
    },
  })
  printStep(
    "Models",
    `status=${modelsResult.response.status}\n${modelsResult.response.ok ? summarizeModels(modelsResult.json) : modelsResult.text}`,
  )

  const usageResult = await fetchJson(`${OPENAI_CHATGPT_BASE_URL}/wham/usage`, {
    method: "GET",
    headers: {
      Authorization: commonHeaders.Authorization,
      Accept: commonHeaders.Accept,
      ...(accountId ? { "chatgpt-account-id": accountId } : {}),
    },
  })
  printStep(
    "Usage",
    `status=${usageResult.response.status}\n${usageResult.response.ok ? JSON.stringify(usageResult.json, null, 2) : usageResult.text}`,
  )

  const requestBody = buildCodexRequestBody(model, args.prompt)
  printStep("Request Body", JSON.stringify(requestBody, null, 2))

  const responseResult = await fetchJson(`${OPENAI_CHATGPT_BASE_URL}/codex/responses`, {
    method: "POST",
    headers: commonHeaders,
    body: JSON.stringify(requestBody),
  })

  printStep(
    "Responses",
    `status=${responseResult.response.status}\n${args.showResponse ? responseResult.text : JSON.stringify(responseResult.json ?? responseResult.text, null, 2)}`,
  )

  if (!responseResult.response.ok) {
    process.exitCode = 1
  }
}

main()
  .catch(error => {
    console.error("\n[Failure]")
    console.error(error instanceof Error ? error.stack || error.message : String(error))
    process.exitCode = 1
  })
  .finally(() => {
    app.quit()
  })
