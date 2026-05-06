import {
  downloadOperatorLocalSpeechModelAction,
  getOperatorLocalSpeechModelStatusAction,
  getOperatorLocalSpeechModelStatusesAction,
  type LocalSpeechModelActionOptions,
} from "@dotagents/shared/local-speech-models"
import type {
  LocalSpeechModelProviderId,
  LocalSpeechModelStatus,
} from "@dotagents/shared/api-types"
import type { OperatorRouteActionResult } from "@dotagents/shared/remote-server-route-contracts"
import { diagnosticsService } from "./diagnostics"
import { getErrorMessage } from "@dotagents/shared/error-utils"

export type OperatorLocalSpeechActionResult = OperatorRouteActionResult

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

const localSpeechModelActionOptions: LocalSpeechModelActionOptions = {
  diagnostics: {
    logError: (...args) => diagnosticsService.logError(...args),
    getErrorMessage,
  },
  service: {
    getStatus: getLocalSpeechModelStatus,
    startDownload: startLocalSpeechModelDownload,
  },
}

export async function getOperatorLocalSpeechModelStatuses(): Promise<OperatorLocalSpeechActionResult> {
  return getOperatorLocalSpeechModelStatusesAction(localSpeechModelActionOptions)
}

export async function getOperatorLocalSpeechModelStatus(providerId: unknown): Promise<OperatorLocalSpeechActionResult> {
  return getOperatorLocalSpeechModelStatusAction(providerId, localSpeechModelActionOptions)
}

export async function downloadOperatorLocalSpeechModel(providerId: unknown): Promise<OperatorLocalSpeechActionResult> {
  return downloadOperatorLocalSpeechModelAction(providerId, localSpeechModelActionOptions)
}
