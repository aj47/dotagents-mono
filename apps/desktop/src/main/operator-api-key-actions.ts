import crypto from "crypto"
import {
  rotateOperatorRemoteServerApiKeyAction,
  type OperatorApiKeyActionOptions,
} from "@dotagents/shared/operator-actions"
import type { OperatorRouteActionResult } from "@dotagents/shared/remote-server-route-contracts"
import type { Config } from "../shared/types"
import { configStore } from "./config"
import { diagnosticsService } from "./diagnostics"

export type OperatorApiKeyActionResult = OperatorRouteActionResult

export function generateRemoteServerApiKey(): string {
  return crypto.randomBytes(32).toString("hex")
}

const apiKeyActionOptions: OperatorApiKeyActionOptions<Config> = {
  config: {
    get: () => configStore.get(),
    save: (config) => configStore.save(config),
  },
  diagnostics: diagnosticsService,
  generateApiKey: generateRemoteServerApiKey,
}

export function rotateOperatorRemoteServerApiKey(): OperatorApiKeyActionResult {
  return rotateOperatorRemoteServerApiKeyAction(apiKeyActionOptions)
}
