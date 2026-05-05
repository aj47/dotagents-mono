import type { OperatorActionAuditContext } from "@dotagents/shared/operator-actions"
import {
  buildLocalSpeechModelDownloadErrorResponse,
  buildLocalSpeechModelDownloadResponse,
  buildLocalSpeechModelStatusesResponse,
  isLocalSpeechModelProviderId,
} from "@dotagents/shared/local-speech-models"
import { buildOperatorActionAuditContext } from "@dotagents/shared/operator-actions"
import type {
  LocalSpeechModelProviderId,
  LocalSpeechModelStatus,
} from "@dotagents/shared/api-types"
import type { OperatorRouteActionResult } from "@dotagents/shared/remote-server-route-contracts"
import { diagnosticsService } from "./diagnostics"
import { getErrorMessage } from "./error-utils"

export type OperatorLocalSpeechActionResult = OperatorRouteActionResult

function ok(body: unknown, auditContext?: OperatorActionAuditContext): OperatorLocalSpeechActionResult {
  return {
    statusCode: 200,
    body,
    ...(auditContext ? { auditContext } : {}),
  }
}

function error(statusCode: number, message: string, auditContext?: OperatorActionAuditContext): OperatorLocalSpeechActionResult {
  return {
    statusCode,
    body: { error: message },
    ...(auditContext ? { auditContext } : {}),
  }
}

export async function getLocalSpeechModelStatus(providerId: LocalSpeechModelProviderId): Promise<LocalSpeechModelStatus> {
  if (providerId === "parakeet") {
    const parakeetStt = await import("./parakeet-stt")
    return parakeetStt.getModelStatus()
  }
  if (providerId === "kitten") {
    const { getKittenModelStatus } = await import("./kitten-tts")
    return getKittenModelStatus()
  }

  const { getSupertonicModelStatus } = await import("./supertonic-tts")
  return getSupertonicModelStatus()
}

export async function getOperatorLocalSpeechModelStatuses(): Promise<OperatorLocalSpeechActionResult> {
  try {
    return ok(await buildLocalSpeechModelStatusesResponse(getLocalSpeechModelStatus))
  } catch (caughtError) {
    diagnosticsService.logError("operator-local-speech-actions", "Failed to build local speech model statuses", caughtError)
    return error(500, "Failed to build local speech model statuses")
  }
}

export async function getOperatorLocalSpeechModelStatus(providerId: unknown): Promise<OperatorLocalSpeechActionResult> {
  if (!isLocalSpeechModelProviderId(providerId)) {
    return error(400, `Invalid local speech model provider: ${providerId || "missing"}`)
  }

  try {
    return ok(await getLocalSpeechModelStatus(providerId))
  } catch (caughtError) {
    diagnosticsService.logError("operator-local-speech-actions", `Failed to build ${providerId} local speech model status`, caughtError)
    return error(500, `Failed to build ${providerId} local speech model status`)
  }
}

async function downloadLocalSpeechModel(providerId: LocalSpeechModelProviderId): Promise<void> {
  if (providerId === "parakeet") {
    const parakeetStt = await import("./parakeet-stt")
    await parakeetStt.downloadModel()
    return
  }
  if (providerId === "kitten") {
    const { downloadKittenModel } = await import("./kitten-tts")
    await downloadKittenModel()
    return
  }

  const { downloadSupertonicModel } = await import("./supertonic-tts")
  await downloadSupertonicModel()
}

export function startLocalSpeechModelDownload(providerId: LocalSpeechModelProviderId): void {
  void downloadLocalSpeechModel(providerId).catch((caughtError) => {
    diagnosticsService.logError("operator-local-speech-actions", `Failed to download ${providerId} local speech model`, caughtError)
  })
}

export async function downloadOperatorLocalSpeechModel(providerId: unknown): Promise<OperatorLocalSpeechActionResult> {
  if (!isLocalSpeechModelProviderId(providerId)) {
    return error(400, `Invalid local speech model provider: ${providerId || "missing"}`)
  }

  try {
    const status = await getLocalSpeechModelStatus(providerId)
    if (!status.downloaded && !status.downloading) {
      startLocalSpeechModelDownload(providerId)
    }

    const response = buildLocalSpeechModelDownloadResponse(providerId, status)
    return ok(response, buildOperatorActionAuditContext(response))
  } catch (caughtError) {
    const message = getErrorMessage(caughtError)
    const response = buildLocalSpeechModelDownloadErrorResponse(providerId, message)
    return ok(response, buildOperatorActionAuditContext(response))
  }
}
