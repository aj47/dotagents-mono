import * as parakeetStt from "./parakeet-stt"

export type ManagedLocalProviderId = "parakeet" | "kitten" | "supertonic"

export interface ManagedLocalProviderModelStatus {
  downloaded: boolean
  downloading: boolean
  progress: number
  error?: string
  path?: string
}

export interface ManagedLocalProviderDownloadResult {
  success: true
}

export type ManagedLocalProviderProgressHandler = (progress: number) => void

interface ManagedLocalProviderDefinition {
  getStatus:
    | (() => ManagedLocalProviderModelStatus)
    | (() => Promise<ManagedLocalProviderModelStatus>)
  download: (onProgress?: ManagedLocalProviderProgressHandler) => Promise<void>
}

async function getManagedLocalProviderDefinition(
  providerId: ManagedLocalProviderId,
): Promise<ManagedLocalProviderDefinition> {
  switch (providerId) {
    case "parakeet":
      return {
        getStatus: () => parakeetStt.getModelStatus(),
        download: (onProgress) => parakeetStt.downloadModel(onProgress),
      }
    case "kitten": {
      const { getKittenModelStatus, downloadKittenModel } =
        await import("./kitten-tts")
      return {
        getStatus: () => getKittenModelStatus(),
        download: (onProgress) => downloadKittenModel(onProgress),
      }
    }
    case "supertonic": {
      const { getSupertonicModelStatus, downloadSupertonicModel } =
        await import("./supertonic-tts")
      return {
        getStatus: () => getSupertonicModelStatus(),
        download: (onProgress) => downloadSupertonicModel(onProgress),
      }
    }
    default: {
      const exhaustiveProviderId: never = providerId
      throw new Error(`Unsupported local provider ID: ${exhaustiveProviderId}`)
    }
  }
}

export async function getManagedLocalProviderModelStatus(
  providerId: ManagedLocalProviderId,
): Promise<ManagedLocalProviderModelStatus> {
  const definition = await getManagedLocalProviderDefinition(providerId)
  return await definition.getStatus()
}

export async function downloadManagedLocalProviderModel(
  providerId: ManagedLocalProviderId,
  onProgress?: ManagedLocalProviderProgressHandler,
): Promise<ManagedLocalProviderDownloadResult> {
  const definition = await getManagedLocalProviderDefinition(providerId)
  await definition.download(onProgress)
  return { success: true }
}

export async function getManagedParakeetModelStatus(): Promise<ManagedLocalProviderModelStatus> {
  return getManagedLocalProviderModelStatus("parakeet")
}

export async function downloadManagedParakeetModel(
  onProgress?: ManagedLocalProviderProgressHandler,
): Promise<ManagedLocalProviderDownloadResult> {
  return downloadManagedLocalProviderModel("parakeet", onProgress)
}

export async function getManagedKittenModelStatus(): Promise<ManagedLocalProviderModelStatus> {
  return getManagedLocalProviderModelStatus("kitten")
}

export async function downloadManagedKittenModel(
  onProgress?: ManagedLocalProviderProgressHandler,
): Promise<ManagedLocalProviderDownloadResult> {
  return downloadManagedLocalProviderModel("kitten", onProgress)
}

export async function getManagedSupertonicModelStatus(): Promise<ManagedLocalProviderModelStatus> {
  return getManagedLocalProviderModelStatus("supertonic")
}

export async function downloadManagedSupertonicModel(
  onProgress?: ManagedLocalProviderProgressHandler,
): Promise<ManagedLocalProviderDownloadResult> {
  return downloadManagedLocalProviderModel("supertonic", onProgress)
}
