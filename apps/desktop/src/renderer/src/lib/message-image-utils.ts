import { logUI } from "@renderer/lib/debug"

export interface MessageImageAttachment {
  id: string
  name: string
  dataUrl: string
  sizeBytes: number
}

export const MAX_IMAGE_ATTACHMENTS = 4
export const MAX_IMAGE_SIZE_BYTES = 4 * 1024 * 1024
export const MAX_TOTAL_EMBEDDED_IMAGE_BYTES = 900 * 1024
const MAX_IMAGE_DIMENSION_PX = 1280
const TARGET_EMBEDDED_IMAGE_BYTES = 220 * 1024
const MIN_JPEG_QUALITY = 0.45
const INITIAL_JPEG_QUALITY = 0.82

const formatMb = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(2)}MB`

const normalizeAttachmentErrorDetail = (value: string) => value.trim().replace(/\s+/g, " ")

export const getImageAttachmentFeedbackMessage = (errors: string[], addedCount = 0) => {
  const details = errors.map(normalizeAttachmentErrorDetail).filter(Boolean)

  if (details.length === 0) {
    return addedCount > 0
      ? "Some selected images couldn't be attached. Any added images are still here."
      : "Couldn't attach image. Please try again."
  }

  const intro = details.length > 1 || addedCount > 0
    ? "Some selected images couldn't be attached."
    : "Couldn't attach image."
  const suffix = addedCount > 0 ? " Any added images are still here." : ""
  return `${intro} ${details.join(" ")}${suffix}`.trim()
}

export const getImageAttachmentUnexpectedErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    const detail = normalizeAttachmentErrorDetail(error.message)
    return detail ? `Couldn't attach image. ${detail}` : "Couldn't attach image. Please try again."
  }

  if (typeof error === "string") {
    const detail = normalizeAttachmentErrorDetail(error)
    return detail ? `Couldn't attach image. ${detail}` : "Couldn't attach image. Please try again."
  }

  return "Couldn't attach image. Please try again."
}

const estimateDataUrlSizeBytes = (dataUrl: string) => {
  const base64 = dataUrl.split(",", 2)[1] ?? ""
  if (!base64) return 0
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0
  return Math.max(0, Math.floor((base64.length * 3) / 4) - padding)
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

const escapeMarkdownAlt = (value: string) =>
  value.replace(/[[\]\\]/g, "").trim()

export const buildMessageWithImages = (
  text: string,
  attachments: MessageImageAttachment[]
) => {
  const trimmed = text.trim()
  const totalBytes = attachments.reduce((sum, attachment) => sum + attachment.sizeBytes, 0)
  const imageMarkdown = attachments
    .map((attachment, index) => {
      const fallbackName = `Image ${index + 1}`
      const safeName = escapeMarkdownAlt(attachment.name || fallbackName) || fallbackName
      return `![${safeName}](${attachment.dataUrl})`
    })
    .join("\n\n")

  if (attachments.length > 0) {
    logUI("[Images] compose message", {
      textLength: trimmed.length,
      attachmentCount: attachments.length,
      totalBytes,
    })
  }

  return [trimmed, imageMarkdown].filter(Boolean).join("\n\n")
}

export const readImageAttachments = async (
  files: FileList | null,
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
        `This message already reached the image budget (${formatMb(MAX_TOTAL_EMBEDDED_IMAGE_BYTES)}).`,
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
      return {
        id: `${Date.now()}-${index}-${file.name}`,
        name: file.name,
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
        `${attachment.name} exceeds the per-message image budget (${formatMb(MAX_TOTAL_EMBEDDED_IMAGE_BYTES)}).`
      )
      continue
    }
    attachments.push(attachment)
    runningBytes += attachment.sizeBytes
  }

  if (processedAttachments.length > 0 && attachments.length === 0) {
    errors.push(
      `Try fewer or smaller images. Total embedded image budget is ${formatMb(MAX_TOTAL_EMBEDDED_IMAGE_BYTES)}.`
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
