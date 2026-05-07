import type {
  LocalSpeechModelProviderId,
  LocalSpeechModelStatus,
} from "@dotagents/shared/api-types"
import { tipcClient } from "@renderer/lib/tipc-client"

const LOCAL_SPEECH_MODEL_STATUS_REQUESTS: Record<LocalSpeechModelProviderId, () => Promise<LocalSpeechModelStatus>> = {
  parakeet: () => tipcClient.getParakeetModelStatus() as Promise<LocalSpeechModelStatus>,
  kitten: () => tipcClient.getKittenModelStatus() as Promise<LocalSpeechModelStatus>,
  supertonic: () => tipcClient.getSupertonicModelStatus() as Promise<LocalSpeechModelStatus>,
}

const LOCAL_SPEECH_MODEL_DOWNLOAD_REQUESTS: Record<LocalSpeechModelProviderId, () => Promise<unknown>> = {
  parakeet: () => tipcClient.downloadParakeetModel(),
  kitten: () => tipcClient.downloadKittenModel(),
  supertonic: () => tipcClient.downloadSupertonicModel(),
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
  return LOCAL_SPEECH_MODEL_STATUS_REQUESTS[providerId]()
}

export async function downloadLocalSpeechModel(
  providerId: LocalSpeechModelProviderId,
): Promise<void> {
  await LOCAL_SPEECH_MODEL_DOWNLOAD_REQUESTS[providerId]()
}

export function synthesizeKittenLocalSpeechSample(
  request: KittenLocalSpeechSampleRequest,
): Promise<LocalSpeechModelAudioResult> {
  return tipcClient.synthesizeWithKitten(request) as Promise<LocalSpeechModelAudioResult>
}

export function synthesizeSupertonicLocalSpeechSample(
  request: SupertonicLocalSpeechSampleRequest,
): Promise<LocalSpeechModelAudioResult> {
  return tipcClient.synthesizeWithSupertonic(request) as Promise<LocalSpeechModelAudioResult>
}
