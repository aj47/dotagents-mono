import type {
  LocalSpeechModelProviderId,
  LocalSpeechModelStatus,
} from "@dotagents/shared/api-types"

const LOCAL_SPEECH_MODEL_STATUS_CHANNELS: Record<LocalSpeechModelProviderId, string> = {
  parakeet: "getParakeetModelStatus",
  kitten: "getKittenModelStatus",
  supertonic: "getSupertonicModelStatus",
}

const LOCAL_SPEECH_MODEL_DOWNLOAD_CHANNELS: Record<LocalSpeechModelProviderId, string> = {
  parakeet: "downloadParakeetModel",
  kitten: "downloadKittenModel",
  supertonic: "downloadSupertonicModel",
}

export function getLocalSpeechModelStatus(
  providerId: LocalSpeechModelProviderId,
): Promise<LocalSpeechModelStatus> {
  return window.electron.ipcRenderer.invoke(
    LOCAL_SPEECH_MODEL_STATUS_CHANNELS[providerId],
  ) as Promise<LocalSpeechModelStatus>
}

export async function downloadLocalSpeechModel(
  providerId: LocalSpeechModelProviderId,
): Promise<void> {
  await window.electron.ipcRenderer.invoke(
    LOCAL_SPEECH_MODEL_DOWNLOAD_CHANNELS[providerId],
  )
}
