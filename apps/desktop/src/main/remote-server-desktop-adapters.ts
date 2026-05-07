import crypto from "crypto"
import fs from "fs"
import os from "os"
import path from "path"
import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from "fastify"
import cors from "@fastify/cors"
import QRCode from "qrcode"
import { authorizeRemoteServerRequest } from "@dotagents/shared/operator-actions"
import type { RemoteServerControllerAdapters } from "@dotagents/shared/remote-server-controller-contracts"
import {
  buildDotAgentsConfigDeepLink,
  buildRemoteServerCorsOptions,
  formatConnectableRemoteHostWarning,
  redactSecretForDisplay,
  resolveConnectableRemoteServerPairingBaseUrl,
  resolveDotAgentsSecretReferenceFromStore,
  resolveRemoteServerApiKey,
} from "@dotagents/shared/remote-pairing"
import type { Config } from "../shared/types"
import {
  recordOperatorResponseAuditEvent,
  recordRejectedOperatorDeviceAttempt,
} from "./operator-audit-actions"
import { configStore, globalAgentsFolder } from "./config"
import { diagnosticsService } from "./diagnostics"

const DOTAGENTS_SECRETS_LOCAL_JSON = "secrets.local.json"

async function createHttpServer(options: {
  logLevel: string
  bodyLimitBytes: number
  corsOrigins: readonly string[]
}): Promise<FastifyInstance> {
  const server = Fastify({
    logger: { level: options.logLevel },
    bodyLimit: options.bodyLimitBytes,
  })

  await server.register(cors, buildRemoteServerCorsOptions(options.corsOrigins))
  return server
}

function addRequestHook(
  server: FastifyInstance,
  handler: (request: FastifyRequest, reply: FastifyReply) => Promise<void> | void,
): void {
  server.addHook("onRequest", handler)
}

function addResponseHook(
  server: FastifyInstance,
  handler: (request: FastifyRequest, reply: FastifyReply) => Promise<void> | void,
): void {
  server.addHook("onResponse", handler)
}

async function listenHttpServer(
  server: FastifyInstance,
  options: { port: number; host: string },
): Promise<void> {
  await server.listen({ port: options.port, host: options.host })
}

async function closeHttpServer(server: FastifyInstance): Promise<void> {
  await server.close()
}

function sendAuthFailure(
  reply: FastifyReply,
  response: { statusCode: number; error: string },
): void {
  reply.code(response.statusCode).send({ error: response.error })
}

function generateRemoteServerApiKey(): string {
  return crypto.randomBytes(32).toString("hex")
}

async function printTerminalQRCode(url: string, apiKey: string): Promise<boolean> {
  const qrValue = buildDotAgentsConfigDeepLink({ baseUrl: url, apiKey })

  try {
    const qrString = await QRCode.toString(qrValue, {
      type: "terminal",
      small: true,
      errorCorrectionLevel: "M"
    })

    console.log("\n" + "=".repeat(60))
    console.log("📱 Mobile App Connection QR Code")
    console.log("=".repeat(60))
    console.log("\nScan this QR code with the DotAgents mobile app to connect:\n")
    console.log(qrString)
    console.log("Server URL:", url)
    console.log("API Key:", redactSecretForDisplay(apiKey))
    console.log("\n" + "=".repeat(60) + "\n")

    diagnosticsService.logInfo("remote-server", "Terminal QR code printed for mobile app pairing")
    return true
  } catch (caughtError) {
    console.error("[Remote Server] Failed to generate terminal QR code:", caughtError)
    diagnosticsService.logError("remote-server", "Failed to generate terminal QR code", caughtError)
    return false
  }
}

function readDotAgentsSecretReference(value: string): string | undefined {
  return resolveDotAgentsSecretReferenceFromStore(value, () => {
    const secretsPath = path.join(globalAgentsFolder, DOTAGENTS_SECRETS_LOCAL_JSON)
    return JSON.parse(fs.readFileSync(secretsPath, "utf8"))
  })
}

function getResolvedRemoteServerApiKey(cfg: Pick<Config, "remoteServerApiKey"> = configStore.get()): string {
  return resolveRemoteServerApiKey(cfg, readDotAgentsSecretReference)
}

function getRemoteNetworkAddresses() {
  return Object.values(os.networkInterfaces()).flatMap((addrs) => addrs ?? [])
}

function writeTerminalInfo(message: string): void {
  console.log(message)
}

function writeTerminalWarning(message: string): void {
  console.warn(message)
}

function scheduleDelayedTask(delayMs: number, task: () => void): void {
  setTimeout(task, delayMs)
}

function scheduleTaskAfterReply(reply: FastifyReply, task: () => void): void {
  let hasRun = false

  const run = () => {
    if (hasRun) {
      return
    }
    hasRun = true

    scheduleDelayedTask(25, task)
  }

  reply.raw.once("finish", run)
  reply.raw.once("close", run)
}

interface PairingBaseUrlOptions {
  warn?: boolean
}

function getConnectableBaseUrlForMobilePairing(
  bind: string,
  port: number,
  options: PairingBaseUrlOptions = {},
): string | undefined {
  const { warn = true } = options
  const resolution = resolveConnectableRemoteServerPairingBaseUrl(bind, port, getRemoteNetworkAddresses())

  if (warn && resolution.warning) {
    console.warn(formatConnectableRemoteHostWarning(resolution.warning))
  }

  return resolution.baseUrl
}

export const remoteServerDesktopAdapters: RemoteServerControllerAdapters<
  FastifyRequest,
  FastifyReply,
  Config,
  FastifyInstance
> = {
  createHttpServer,
  addRequestHook,
  addResponseHook,
  listenHttpServer,
  closeHttpServer,
  authorizeRequest: authorizeRemoteServerRequest,
  generateApiKey: generateRemoteServerApiKey,
  resolveApiKeyReference: readDotAgentsSecretReference,
  resolveConfiguredApiKey: getResolvedRemoteServerApiKey,
  getNetworkAddresses: getRemoteNetworkAddresses,
  getConnectableBaseUrlForMobilePairing,
  printTerminalQRCode,
  scheduleDelayedTask,
  scheduleTaskAfterReply,
  sendAuthFailure,
  writeTerminalInfo,
  writeTerminalWarning,
  recordRejectedOperatorDeviceAttempt,
  recordOperatorResponseAuditEvent,
}
