import crypto from "crypto"
import {
  DEFAULT_MODEL_PRESET_ID,
} from "@dotagents/shared/providers"
import {
  buildCustomModelPresetFromRequest,
  buildModelPresetCreateAuditContext,
  buildModelPresetDeleteAuditContext,
  buildModelPresetMutationFailureAuditContext,
  buildModelPresetMutationResponse,
  buildModelPresetUpdatePatch,
  buildModelPresetUpdateAuditContext,
  buildModelPresetsResponse,
  getMergedModelPresetById,
  getModelPresetActivationUpdates,
  getSavedModelPresets,
  parseModelPresetCreateRequestBody,
  upsertModelPresetOverride,
  type ModelPresetMutationAuditContext,
} from "@dotagents/shared/model-presets"
import type { OperatorRouteActionResult } from "@dotagents/shared/remote-server-route-contracts"
import type { Config } from "../shared/types"
import { configStore } from "./config"
import { diagnosticsService } from "./diagnostics"
import { getErrorMessage } from "./error-utils"

export type OperatorModelPresetActionResult = OperatorRouteActionResult

function ok(body: unknown, auditContext?: ModelPresetMutationAuditContext): OperatorModelPresetActionResult {
  return {
    statusCode: 200,
    body,
    ...(auditContext ? { auditContext } : {}),
  }
}

function error(statusCode: number, message: string, auditContext?: ModelPresetMutationAuditContext): OperatorModelPresetActionResult {
  return {
    statusCode,
    body: { error: message },
    ...(auditContext ? { auditContext } : {}),
  }
}

export function getOperatorModelPresets(secretMask: string): OperatorModelPresetActionResult {
  try {
    return ok(buildModelPresetsResponse(configStore.get(), secretMask))
  } catch (caughtError) {
    diagnosticsService.logError("operator-model-preset-actions", "Failed to build model preset summaries", caughtError)
    return error(500, "Failed to build model preset summaries")
  }
}

export function createOperatorModelPreset(
  body: unknown,
  secretMask: string,
): OperatorModelPresetActionResult {
  try {
    const parsedRequest = parseModelPresetCreateRequestBody(body)
    if (parsedRequest.ok === false) {
      return error(parsedRequest.statusCode, parsedRequest.error)
    }

    const now = Date.now()
    const preset = buildCustomModelPresetFromRequest(
      `custom-${crypto.randomUUID()}`,
      parsedRequest.request,
      now,
    )

    const cfg = configStore.get()
    const nextConfig = {
      ...cfg,
      modelPresets: [...getSavedModelPresets(cfg), preset],
    }
    configStore.save(nextConfig)

    return ok(
      buildModelPresetMutationResponse(nextConfig, secretMask, { preset }),
      buildModelPresetCreateAuditContext(preset),
    )
  } catch (caughtError) {
    const message = getErrorMessage(caughtError)
    diagnosticsService.logError("operator-model-preset-actions", "Failed to create model preset", caughtError)
    return error(
      500,
      message || "Failed to create model preset",
      buildModelPresetMutationFailureAuditContext("model-preset-create", message),
    )
  }
}

export function updateOperatorModelPreset(
  presetId: string | undefined,
  body: unknown,
  secretMask: string,
): OperatorModelPresetActionResult {
  if (!presetId) {
    return error(400, "Missing preset ID")
  }

  try {
    const cfg = configStore.get()
    const existingPreset = getMergedModelPresetById(cfg, presetId)
    if (!existingPreset) {
      return error(404, "Model preset not found")
    }

    const patch = buildModelPresetUpdatePatch(body, existingPreset, secretMask)

    const nextPresets = upsertModelPresetOverride(cfg, presetId, patch)
    const updatedPreset = getMergedModelPresetById({ ...cfg, modelPresets: nextPresets }, presetId)
    if (!updatedPreset) {
      return error(404, "Model preset not found")
    }

    const updates: Partial<Config> = { modelPresets: nextPresets }
    if ((cfg.currentModelPresetId || DEFAULT_MODEL_PRESET_ID) === presetId) {
      Object.assign(updates, getModelPresetActivationUpdates(updatedPreset))
    }

    const nextConfig = { ...cfg, ...updates }
    configStore.save(nextConfig)

    return ok(
      buildModelPresetMutationResponse(nextConfig, secretMask, { preset: updatedPreset }),
      buildModelPresetUpdateAuditContext(presetId, patch),
    )
  } catch (caughtError) {
    const message = getErrorMessage(caughtError)
    diagnosticsService.logError("operator-model-preset-actions", "Failed to update model preset", caughtError)
    return error(
      500,
      message || "Failed to update model preset",
      buildModelPresetMutationFailureAuditContext("model-preset-update", message, presetId),
    )
  }
}

export function deleteOperatorModelPreset(
  presetId: string | undefined,
  secretMask: string,
): OperatorModelPresetActionResult {
  if (!presetId) {
    return error(400, "Missing preset ID")
  }

  try {
    const cfg = configStore.get()
    const preset = getMergedModelPresetById(cfg, presetId)
    if (!preset) {
      return error(404, "Model preset not found")
    }
    if (preset.isBuiltIn) {
      return error(400, "Built-in presets cannot be deleted")
    }

    const defaultPreset = getMergedModelPresetById(cfg, DEFAULT_MODEL_PRESET_ID)
    const updates: Partial<Config> = {
      modelPresets: getSavedModelPresets(cfg).filter((candidate) => candidate.id !== presetId),
    }
    if ((cfg.currentModelPresetId || DEFAULT_MODEL_PRESET_ID) === presetId && defaultPreset) {
      Object.assign(updates, getModelPresetActivationUpdates(defaultPreset))
    }

    const nextConfig = { ...cfg, ...updates }
    configStore.save(nextConfig)
    const switchedToDefault = (cfg.currentModelPresetId || DEFAULT_MODEL_PRESET_ID) === presetId

    return ok(
      buildModelPresetMutationResponse(nextConfig, secretMask, { deletedPresetId: presetId }),
      buildModelPresetDeleteAuditContext(presetId, switchedToDefault),
    )
  } catch (caughtError) {
    const message = getErrorMessage(caughtError)
    diagnosticsService.logError("operator-model-preset-actions", "Failed to delete model preset", caughtError)
    return error(
      500,
      message || "Failed to delete model preset",
      buildModelPresetMutationFailureAuditContext("model-preset-delete", message, presetId),
    )
  }
}
