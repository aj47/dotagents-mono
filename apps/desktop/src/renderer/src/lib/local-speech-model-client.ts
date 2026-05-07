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

export interface LocalSpeechModelAudioResult {
  audio: string
  sampleRate: number
}

export interface KittenLocalSpeechSampleRequest {
  text: string
  voiceId?: number
  speed?: number
}

export interface SupertonicLocalSpeechSampleRequest {
  text: string
  voice?: string
  lang?: string
  speed?: number
  steps?: number
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

export function synthesizeKittenLocalSpeechSample(
  request: KittenLocalSpeechSampleRequest,
): Promise<LocalSpeechModelAudioResult> {
  return window.electron.ipcRenderer.invoke(
    "synthesizeWithKitten",
    request,
  ) as Promise<LocalSpeechModelAudioResult>
}

export function synthesizeSupertonicLocalSpeechSample(
  request: SupertonicLocalSpeechSampleRequest,
): Promise<LocalSpeechModelAudioResult> {
  return window.electron.ipcRenderer.invoke(
    "synthesizeWithSupertonic",
    request,
  ) as Promise<LocalSpeechModelAudioResult>
}
