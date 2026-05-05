import crypto from "crypto"
import {
  createOperatorModelPresetAction,
  deleteOperatorModelPresetAction,
  getOperatorModelPresetsAction,
  updateOperatorModelPresetAction,
  type ModelPresetActionOptions,
} from "@dotagents/shared/model-presets"
import type { OperatorRouteActionResult } from "@dotagents/shared/remote-server-route-contracts"
import type { Config } from "../shared/types"
import { configStore } from "./config"
import { diagnosticsService } from "./diagnostics"

export type OperatorModelPresetActionResult = OperatorRouteActionResult

const modelPresetActionOptions: ModelPresetActionOptions<Config> = {
  config: {
    get: () => configStore.get(),
    save: (config) => configStore.save(config),
  },
  diagnostics: diagnosticsService,
  createPresetId: () => `custom-${crypto.randomUUID()}`,
  now: () => Date.now(),
}

export async function getOperatorModelPresets(secretMask: string): Promise<OperatorModelPresetActionResult> {
  return getOperatorModelPresetsAction(secretMask, modelPresetActionOptions)
}

export async function createOperatorModelPreset(
  body: unknown,
  secretMask: string,
): Promise<OperatorModelPresetActionResult> {
  return createOperatorModelPresetAction(body, secretMask, modelPresetActionOptions)
}

export async function updateOperatorModelPreset(
  presetId: string | undefined,
  body: unknown,
  secretMask: string,
): Promise<OperatorModelPresetActionResult> {
  return updateOperatorModelPresetAction(presetId, body, secretMask, modelPresetActionOptions)
}

export async function deleteOperatorModelPreset(
  presetId: string | undefined,
  secretMask: string,
): Promise<OperatorModelPresetActionResult> {
  return deleteOperatorModelPresetAction(presetId, secretMask, modelPresetActionOptions)
}
