import { beforeEach, describe, expect, it, vi } from "vitest"

const getParakeetModelStatusMock = vi.fn()
const downloadParakeetModelMock = vi.fn()
const getKittenModelStatusMock = vi.fn()
const downloadKittenModelMock = vi.fn()
const getSupertonicModelStatusMock = vi.fn()
const downloadSupertonicModelMock = vi.fn()

vi.mock("./parakeet-stt", () => ({
  getModelStatus: getParakeetModelStatusMock,
  downloadModel: downloadParakeetModelMock,
}))

vi.mock("./kitten-tts", () => ({
  getKittenModelStatus: getKittenModelStatusMock,
  downloadKittenModel: downloadKittenModelMock,
}))

vi.mock("./supertonic-tts", () => ({
  getSupertonicModelStatus: getSupertonicModelStatusMock,
  downloadSupertonicModel: downloadSupertonicModelMock,
}))

const localProviderManagementModule = import("./local-provider-management")

describe("local provider management", () => {
  beforeEach(() => {
    getParakeetModelStatusMock.mockReset()
    downloadParakeetModelMock.mockReset()
    getKittenModelStatusMock.mockReset()
    downloadKittenModelMock.mockReset()
    getSupertonicModelStatusMock.mockReset()
    downloadSupertonicModelMock.mockReset()
  })

  it("routes local provider status reads through one shared helper layer", async () => {
    getParakeetModelStatusMock.mockReturnValue({
      downloaded: true,
      downloading: false,
      progress: 1,
      path: "/tmp/parakeet",
    })
    getKittenModelStatusMock.mockReturnValue({
      downloaded: false,
      downloading: true,
      progress: 0.4,
    })
    getSupertonicModelStatusMock.mockReturnValue({
      downloaded: false,
      downloading: false,
      progress: 0,
      error: "missing runtime",
    })

    const {
      getManagedParakeetModelStatus,
      getManagedKittenModelStatus,
      getManagedSupertonicModelStatus,
    } = await localProviderManagementModule

    await expect(getManagedParakeetModelStatus()).resolves.toEqual({
      downloaded: true,
      downloading: false,
      progress: 1,
      path: "/tmp/parakeet",
    })
    await expect(getManagedKittenModelStatus()).resolves.toEqual({
      downloaded: false,
      downloading: true,
      progress: 0.4,
    })
    await expect(getManagedSupertonicModelStatus()).resolves.toEqual({
      downloaded: false,
      downloading: false,
      progress: 0,
      error: "missing runtime",
    })
  })

  it("routes local provider downloads through one shared helper layer", async () => {
    const parakeetProgressHandler = vi.fn()
    const kittenProgressHandler = vi.fn()
    const supertonicProgressHandler = vi.fn()

    downloadParakeetModelMock.mockImplementation(async (onProgress) => {
      onProgress?.(0.5)
    })
    downloadKittenModelMock.mockImplementation(async (onProgress) => {
      onProgress?.(0.75)
    })
    downloadSupertonicModelMock.mockImplementation(async (onProgress) => {
      onProgress?.(1)
    })

    const {
      downloadManagedParakeetModel,
      downloadManagedKittenModel,
      downloadManagedSupertonicModel,
    } = await localProviderManagementModule

    await expect(
      downloadManagedParakeetModel(parakeetProgressHandler),
    ).resolves.toEqual({ success: true })
    await expect(
      downloadManagedKittenModel(kittenProgressHandler),
    ).resolves.toEqual({ success: true })
    await expect(
      downloadManagedSupertonicModel(supertonicProgressHandler),
    ).resolves.toEqual({ success: true })

    expect(downloadParakeetModelMock).toHaveBeenCalledTimes(1)
    expect(downloadKittenModelMock).toHaveBeenCalledTimes(1)
    expect(downloadSupertonicModelMock).toHaveBeenCalledTimes(1)
    expect(parakeetProgressHandler).toHaveBeenCalledWith(0.5)
    expect(kittenProgressHandler).toHaveBeenCalledWith(0.75)
    expect(supertonicProgressHandler).toHaveBeenCalledWith(1)
  })
})
