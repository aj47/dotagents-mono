import fs from "fs"
import path from "path"

export const MENTRA_PHOTO_MAX_BYTES = 8 * 1024 * 1024
export const MENTRA_PHOTO_TTL_MS = 15 * 60 * 1000

const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/avif": ".avif",
}

export type StoredMentraPhoto = {
  requestId: string
  mimeType: keyof typeof MIME_EXTENSIONS
  fileName: string
  filePath: string
  size: number
  createdAt: number
}

export function isValidMentraPhotoRequestId(requestId: string): boolean {
  return /^[A-Za-z0-9_-]{1,128}$/.test(requestId)
}

export function isSupportedMentraPhotoMimeType(mimeType: string): mimeType is keyof typeof MIME_EXTENSIONS {
  return Object.hasOwn(MIME_EXTENSIONS, mimeType)
}

export class MentraPhotoStore {
  constructor(
    private readonly rootDir: string,
    private readonly ttlMs = MENTRA_PHOTO_TTL_MS,
  ) {}

  private metadataPath(requestId: string): string {
    return path.join(this.rootDir, `${requestId}.json`)
  }

  private assertRequestId(requestId: string): void {
    if (!isValidMentraPhotoRequestId(requestId)) {
      throw new Error("Invalid Mentra photo request ID")
    }
  }

  async save(requestId: string, mimeType: string, data: Buffer): Promise<StoredMentraPhoto> {
    this.assertRequestId(requestId)
    if (!isSupportedMentraPhotoMimeType(mimeType)) {
      throw new Error("Unsupported Mentra photo content type")
    }
    if (!data.length) {
      throw new Error("Mentra photo is empty")
    }
    if (data.length > MENTRA_PHOTO_MAX_BYTES) {
      throw new Error(`Mentra photo exceeds the ${MENTRA_PHOTO_MAX_BYTES}-byte limit`)
    }

    await fs.promises.mkdir(this.rootDir, { recursive: true })
    await this.delete(requestId)

    const fileName = `${requestId}${MIME_EXTENSIONS[mimeType]}`
    const filePath = path.join(this.rootDir, fileName)
    const createdAt = Date.now()
    const stored: StoredMentraPhoto = {
      requestId,
      mimeType,
      fileName,
      filePath,
      size: data.length,
      createdAt,
    }

    const temporaryPath = `${filePath}.${process.pid}.tmp`
    await fs.promises.writeFile(temporaryPath, data, { flag: "wx" })
    await fs.promises.rename(temporaryPath, filePath)
    await fs.promises.writeFile(this.metadataPath(requestId), JSON.stringify({
      requestId,
      mimeType,
      fileName,
      size: data.length,
      createdAt,
    }))

    return stored
  }

  async get(requestId: string): Promise<StoredMentraPhoto | null> {
    this.assertRequestId(requestId)
    try {
      const metadata = JSON.parse(
        await fs.promises.readFile(this.metadataPath(requestId), "utf8"),
      ) as Omit<StoredMentraPhoto, "filePath">
      if (
        metadata.requestId !== requestId
        || !isSupportedMentraPhotoMimeType(metadata.mimeType)
        || typeof metadata.fileName !== "string"
        || path.basename(metadata.fileName) !== metadata.fileName
        || typeof metadata.createdAt !== "number"
        || Date.now() - metadata.createdAt > this.ttlMs
      ) {
        await this.delete(requestId)
        return null
      }

      const filePath = path.join(this.rootDir, metadata.fileName)
      const stat = await fs.promises.stat(filePath)
      return { ...metadata, filePath, size: stat.size }
    } catch (error: any) {
      if (error?.code === "ENOENT") return null
      throw error
    }
  }

  async delete(requestId: string): Promise<void> {
    this.assertRequestId(requestId)
    await fs.promises.mkdir(this.rootDir, { recursive: true })
    const names = await fs.promises.readdir(this.rootDir)
    await Promise.all(names
      .filter((name) => name === `${requestId}.json` || name.startsWith(`${requestId}.`))
      .map((name) => fs.promises.rm(path.join(this.rootDir, name), { force: true })))
  }

  async cleanupExpired(now = Date.now()): Promise<void> {
    await fs.promises.mkdir(this.rootDir, { recursive: true })
    const names = await fs.promises.readdir(this.rootDir)
    const metadataNames = names.filter((name) => name.endsWith(".json"))
    await Promise.all(metadataNames.map(async (name) => {
      const requestId = name.slice(0, -5)
      if (!isValidMentraPhotoRequestId(requestId)) {
        await fs.promises.rm(path.join(this.rootDir, name), { force: true })
        return
      }
      try {
        const metadata = JSON.parse(await fs.promises.readFile(path.join(this.rootDir, name), "utf8"))
        if (typeof metadata.createdAt !== "number" || now - metadata.createdAt > this.ttlMs) {
          await this.delete(requestId)
        }
      } catch {
        await this.delete(requestId)
      }
    }))
  }
}
