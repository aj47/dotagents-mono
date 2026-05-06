import { logUI } from "@renderer/lib/debug"
import {
  buildConversationImageMarkdownMessage,
  formatMediaBytesMb,
  getDataImageBytesFromUrl,
  MAX_CHAT_IMAGE_ATTACHMENTS,
  MAX_CHAT_IMAGE_FILE_BYTES,
  MAX_CHAT_TOTAL_EMBEDDED_IMAGE_BYTES,
} from "@dotagents/shared/conversation-media-assets"

export interface MessageImageAttachment {
  id: string
  name: string
  dataUrl: string
  sizeBytes: number
}

export const MAX_IMAGE_ATTACHMENTS = MAX_CHAT_IMAGE_ATTACHMENTS
export const MAX_IMAGE_SIZE_BYTES = MAX_CHAT_IMAGE_FILE_BYTES
export const MAX_TOTAL_EMBEDDED_IMAGE_BYTES = MAX_CHAT_TOTAL_EMBEDDED_IMAGE_BYTES
const MAX_IMAGE_DIMENSION_PX = 1280
const TARGET_EMBEDDED_IMAGE_BYTES = 220 * 1024
const MIN_JPEG_QUALITY = 0.45
const INITIAL_JPEG_QUALITY = 0.82

const estimateDataUrlSizeBytes = (dataUrl: string) => {
  return getDataImageBytesFromUrl(dataUrl) ?? 0
}

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error("Failed to decode image."))
    image.src = src
  })

const toDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error(`Failed to read image: ${file.name}`))
    reader.readAsDataURL(file)
  })

const toOptimizedDataUrl = async (file: File) => {
  const originalDataUrl = await toDataUrl(file)
  const originalEmbeddedSizeBytes = estimateDataUrlSizeBytes(originalDataUrl) || file.size

  // Keep GIFs unmodified so we don't drop animation.
  if (file.type === "image/gif") {
    return {
      dataUrl: originalDataUrl,
      sizeBytes: originalEmbeddedSizeBytes,
      optimized: false,
      originalSizeBytes: file.size,
    }
  }

  try {
    const image = await loadImage(originalDataUrl)

    let width = image.naturalWidth || 1
    let height = image.naturalHeight || 1
    const longestSide = Math.max(width, height)
    if (longestSide > MAX_IMAGE_DIMENSION_PX) {
      const scale = MAX_IMAGE_DIMENSION_PX / longestSide
      width = Math.max(1, Math.round(width * scale))
      height = Math.max(1, Math.round(height * scale))
    }

    const canvas = document.createElement("canvas")
    const context = canvas.getContext("2d")
    if (!context) {
      return {
        dataUrl: originalDataUrl,
        sizeBytes: originalEmbeddedSizeBytes,
        optimized: false,
        originalSizeBytes: file.size,
      }
    }

    let bestDataUrl = originalDataUrl
    let bestSizeBytes = originalEmbeddedSizeBytes
    let quality = INITIAL_JPEG_QUALITY

    for (let attempt = 0; attempt < 6; attempt++) {
      canvas.width = width
      canvas.height = height
      context.clearRect(0, 0, width, height)
      context.drawImage(image, 0, 0, width, height)

      const candidateDataUrl = canvas.toDataURL("image/jpeg", quality)
      const candidateSize = estimateDataUrlSizeBytes(candidateDataUrl)
      if (candidateSize > 0 && candidateSize < bestSizeBytes) {
        bestDataUrl = candidateDataUrl
        bestSizeBytes = candidateSize
      }

      if (bestSizeBytes <= TARGET_EMBEDDED_IMAGE_BYTES) {
        break
      }

      if (quality > MIN_JPEG_QUALITY) {
        quality = Math.max(MIN_JPEG_QUALITY, quality - 0.08)
      } else {
        const nextWidth = Math.max(1, Math.round(width * 0.85))
        const nextHeight = Math.max(1, Math.round(height * 0.85))
        if (nextWidth === width && nextHeight === height) {
          break
        }
        width = nextWidth
        height = nextHeight
      }
    }

    return {
      dataUrl: bestDataUrl,
      sizeBytes: bestSizeBytes,
      optimized: bestSizeBytes < originalEmbeddedSizeBytes,
      originalSizeBytes: file.size,
    }
  } catch {
    return {
      dataUrl: originalDataUrl,
      sizeBytes: originalEmbeddedSizeBytes,
      optimized: false,
      originalSizeBytes: file.size,
    }
  }
}

export const buildMessageWithImages = (
  text: string,
  attachments: MessageImageAttachment[]
) => {
  const trimmed = text.trim()
  const totalBytes = attachments.reduce((sum, attachment) => sum + attachment.sizeBytes, 0)

  if (attachments.length > 0) {
    logUI("[Images] compose message", {
      textLength: trimmed.length,
      attachmentCount: attachments.length,
      totalBytes,
    })
  }

  return buildConversationImageMarkdownMessage(
    trimmed,
    attachments.map((attachment, index) => ({
      url: attachment.dataUrl,
      altText: attachment.name,
      fallbackAltText: `Image ${index + 1}`,
    }))
  )
}

export type ImageAttachmentInputFiles = FileList | File[]

export const getClipboardImageFiles = (clipboardData: DataTransfer | null): File[] => {
  if (!clipboardData) return []

  const itemFiles = Array.from(clipboardData.items ?? [])
    .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
    .map((item) => item.getAsFile())
    .filter((file): file is File => !!file)

  if (itemFiles.length > 0) return itemFiles

  return Array.from(clipboardData.files ?? [])
    .filter((file) => file.type.startsWith("image/"))
}

export const readImageAttachments = async (
  files: ImageAttachmentInputFiles | null,
  existingAttachments: MessageImageAttachment[] = []
) => {
  const startTime = performance.now()

  if (!files?.length) {
    logUI("[Images] no files selected")
    return { attachments: [] as MessageImageAttachment[], errors: [] as string[] }
  }

  const existingCount = existingAttachments.length
  const existingEmbeddedBytes = existingAttachments.reduce(
    (sum, attachment) => sum + attachment.sizeBytes,
    0
  )
  const selected = Array.from(files)
  const slotsRemaining = Math.max(0, MAX_IMAGE_ATTACHMENTS - existingCount)
  const errors: string[] = []

  if (slotsRemaining === 0) {
    return {
      attachments: [],
      errors: [`You can attach up to ${MAX_IMAGE_ATTACHMENTS} images per message.`],
    }
  }

  if (existingEmbeddedBytes >= MAX_TOTAL_EMBEDDED_IMAGE_BYTES) {
    return {
      attachments: [],
      errors: [
        `This message already reached the image budget (${formatMediaBytesMb(MAX_TOTAL_EMBEDDED_IMAGE_BYTES)}).`,
      ],
    }
  }

  const accepted = selected
    .filter((file) => {
      if (!file.type.startsWith("image/")) {
        errors.push(`${file.name} is not an image file.`)
        return false
      }

      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        const limitMb = Math.round(MAX_IMAGE_SIZE_BYTES / (1024 * 1024))
        errors.push(`${file.name} is larger than ${limitMb}MB.`)
        return false
      }

      return true
    })
    .slice(0, slotsRemaining)

  if (selected.length > slotsRemaining && slotsRemaining > 0) {
    errors.push(`Only ${slotsRemaining} image slot(s) remaining for this message.`)
  }

  const processedAttachments = await Promise.all(
    accepted.map(async (file, index) => {
      const optimized = await toOptimizedDataUrl(file)
      const fallbackName = `pasted-image-${index + 1}`
      const name = file.name || fallbackName
      return {
        id: `${Date.now()}-${index}-${name}`,
        name,
        sizeBytes: optimized.sizeBytes,
        dataUrl: optimized.dataUrl,
      }
    })
  )

  const attachments: MessageImageAttachment[] = []
  let runningBytes = existingEmbeddedBytes
  for (const attachment of processedAttachments) {
    if (runningBytes + attachment.sizeBytes > MAX_TOTAL_EMBEDDED_IMAGE_BYTES) {
      errors.push(
        `${attachment.name} exceeds the per-message image budget (${formatMediaBytesMb(MAX_TOTAL_EMBEDDED_IMAGE_BYTES)}).`
      )
      continue
    }
    attachments.push(attachment)
    runningBytes += attachment.sizeBytes
  }

  if (processedAttachments.length > 0 && attachments.length === 0) {
    errors.push(
      `Try fewer or smaller images. Total embedded image budget is ${formatMediaBytesMb(MAX_TOTAL_EMBEDDED_IMAGE_BYTES)}.`
    )
  }

  const totalOriginalBytes = accepted.reduce((sum, file) => sum + file.size, 0)
  const totalEmbeddedBytes = attachments.reduce((sum, attachment) => sum + attachment.sizeBytes, 0)

  logUI("[Images] processed selection", {
    selectedCount: selected.length,
    acceptedCount: accepted.length,
    existingCount,
    existingEmbeddedBytes,
    slotsRemaining,
    totalOriginalBytes,
    totalEmbeddedBytes,
    totalEmbeddedBytesAfterAdd: runningBytes,
    embeddedBudgetBytes: MAX_TOTAL_EMBEDDED_IMAGE_BYTES,
    durationMs: Math.round((performance.now() - startTime) * 10) / 10,
    errorCount: errors.length,
  })

  return { attachments, errors }
}
