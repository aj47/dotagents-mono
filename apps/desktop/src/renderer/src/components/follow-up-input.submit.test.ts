import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const overlaySource = readFileSync(
  new URL("./overlay-follow-up-input.tsx", import.meta.url),
  "utf8",
)

const tileSource = readFileSync(
  new URL("./tile-follow-up-input.tsx", import.meta.url),
  "utf8",
)

const textInputPanelSource = readFileSync(
  new URL("./text-input-panel.tsx", import.meta.url),
  "utf8",
)

const presentationSource = readFileSync(
  new URL("../../../../../../packages/shared/src/session-presentation.ts", import.meta.url),
  "utf8",
)

const mediaPresentationSource = readFileSync(
  new URL("../../../../../../packages/shared/src/conversation-media-assets.ts", import.meta.url),
  "utf8",
)

const messageImageUtilsSource = readFileSync(
  new URL("../lib/message-image-utils.ts", import.meta.url),
  "utf8",
)

describe("desktop follow-up input submit guardrails", () => {
  it("adds an immediate in-flight guard to the overlay composer", () => {
    expect(overlaySource).toContain("const [isSubmitting, setIsSubmitting] = useState(false)")
    expect(overlaySource).toContain("const submitInFlightRef = useRef(false)")
    expect(overlaySource).toContain(
      "pending: sendMutation.isPending || isSubmitting || submitInFlightRef.current",
    )
    expect(overlaySource).toContain("await sendMutation.mutateAsync(message)")
    expect(overlaySource).toContain("console.error(\"Failed to submit overlay follow-up message:\", error)")
    expect(overlaySource).toContain(
      "const isDisabled = inputPresentation.isDisabled || isSubmitting || sendMutation.isPending",
    )
    expect(overlaySource).toContain('inputPresentation.mode === "disabled"')
  })

  it("adds the same immediate in-flight guard to the tile composer", () => {
    expect(tileSource).toContain("const [isSubmitting, setIsSubmitting] = useState(false)")
    expect(tileSource).toContain("const submitInFlightRef = useRef(false)")
    expect(tileSource).toContain(
      "pending: sendMutation.isPending || isSubmitting || submitInFlightRef.current",
    )
    expect(tileSource).toContain("await sendMutation.mutateAsync(message)")
    expect(tileSource).toContain("console.error(\"Failed to submit tile follow-up message:\", error)")
    expect(tileSource).toContain("const isDisabled =")
    expect(tileSource).toContain('inputPresentation.mode === "initializing"')
    expect(tileSource).toContain('inputPresentation.mode === "disabled"')
  })

  it("centralizes placeholders and button labels through session presentation", () => {
    expect(overlaySource).toContain("getFollowUpInputPresentation")
    expect(tileSource).toContain("getFollowUpInputPresentation")
    expect(overlaySource).toContain("getChatComposerCopyState")
    expect(tileSource).toContain("getChatComposerCopyState")
    expect(overlaySource).toContain("getChatRuntimeCopyState")
    expect(tileSource).toContain("getChatRuntimeCopyState")
    expect(overlaySource).toContain("desktopComposerCopy.imageAttachment.accessibilityLabel")
    expect(tileSource).toContain("desktopComposerCopy.imageAttachment.accessibilityLabel")
    expect(overlaySource).toContain("desktopRuntimeCopy.killSwitch.sessionExecutionButtonTitle")
    expect(tileSource).toContain("desktopRuntimeCopy.killSwitch.sessionExecutionButtonTitle")
    expect(overlaySource).toContain("placeholder={inputPresentation.placeholder}")
    expect(tileSource).toContain("placeholder={inputPresentation.placeholder}")
    expect(overlaySource).toContain("title={inputPresentation.submitTitle}")
    expect(tileSource).toContain("title={inputPresentation.submitTitle}")
    expect(presentationSource).toContain('placeholder: "Queue next message..."')
    expect(presentationSource).toContain('placeholder: "Continue conversation..."')
    expect(presentationSource).toContain('submitTitle: "Queue next message"')
    expect(overlaySource).not.toContain('title="Attach image"')
    expect(tileSource).not.toContain('title="Attach image"')
    expect(overlaySource).not.toContain("CHAT_COMPOSER_PRESENTATION")
    expect(tileSource).not.toContain("CHAT_COMPOSER_PRESENTATION")
    expect(overlaySource).not.toContain("CHAT_RUNTIME_PRESENTATION")
    expect(tileSource).not.toContain("CHAT_RUNTIME_PRESENTATION")
    expect(overlaySource).not.toContain('title="Stop agent execution"')
    expect(tileSource).not.toContain('title="Stop agent execution"')
  })

  it("uses shared composer and attachment presentation for desktop follow-up surfaces", () => {
    expect(overlaySource).toContain("getChatComposerDesktopSurfaceState")
    expect(tileSource).toContain("getChatComposerDesktopSurfaceState")
    expect(overlaySource).toContain("getChatComposerDesktopSurfaceState().followUp")
    expect(tileSource).toContain("getChatComposerDesktopSurfaceState().followUp")
    expect(overlaySource).toContain("getChatImageAttachmentDesktopComposerPreviewRenderState")
    expect(tileSource).toContain("getChatImageAttachmentDesktopComposerPreviewRenderState")
    expect(overlaySource).toContain("const desktopImageAttachmentPreview = getChatImageAttachmentDesktopComposerPreviewRenderState()")
    expect(tileSource).toContain("const desktopImageAttachmentPreview = getChatImageAttachmentDesktopComposerPreviewRenderState()")
    expect(overlaySource).toContain("const desktopImageAttachmentSurface = desktopImageAttachmentPreview.surface")
    expect(tileSource).toContain("const desktopImageAttachmentSurface = desktopImageAttachmentPreview.surface")
    expect(overlaySource).toContain("desktopImageAttachmentPreview.removeButton.title")
    expect(tileSource).toContain("desktopImageAttachmentPreview.removeButton.title")
    expect(overlaySource).toContain("aria-label={desktopImageAttachmentPreview.removeButton.title}")
    expect(tileSource).toContain("aria-label={desktopImageAttachmentPreview.removeButton.title}")
    expect(presentationSource).toContain("overlayFormClassName")
    expect(presentationSource).toContain("tileFormClassName")
    expect(mediaPresentationSource).toContain("overlayPreviewClassName")
    expect(mediaPresentationSource).toContain("tilePreviewClassName")
    expect(mediaPresentationSource).toContain("getChatImageAttachmentDesktopComposerPreviewRenderState")
    expect(mediaPresentationSource).toContain("getChatImageAttachmentCopyState")
    expect(presentationSource).toContain("formatChatImageAttachmentErrorMessage")
    expect(presentationSource).toContain("getChatImageAttachmentDesktopComposerPreviewRenderState")
    expect(overlaySource).toContain('from "@dotagents/shared/session-presentation"')
    expect(tileSource).toContain('from "@dotagents/shared/session-presentation"')
    expect(textInputPanelSource).toContain('from "@dotagents/shared/session-presentation"')
    expect(overlaySource).not.toContain('from "@dotagents/shared/conversation-media-assets"')
    expect(tileSource).not.toContain('from "@dotagents/shared/conversation-media-assets"')
    expect(textInputPanelSource).not.toContain('from "@dotagents/shared/conversation-media-assets"')
    expect(overlaySource).not.toContain("CHAT_COMPOSER_SURFACE_PRESENTATION")
    expect(tileSource).not.toContain("CHAT_COMPOSER_SURFACE_PRESENTATION")
    expect(overlaySource).not.toContain("CHAT_IMAGE_ATTACHMENT_SURFACE_PRESENTATION")
    expect(tileSource).not.toContain("CHAT_IMAGE_ATTACHMENT_SURFACE_PRESENTATION")
    expect(overlaySource).not.toContain("CHAT_IMAGE_ATTACHMENT_PRESENTATION")
    expect(tileSource).not.toContain("CHAT_IMAGE_ATTACHMENT_PRESENTATION")
    expect(overlaySource).not.toContain("getChatImageAttachmentDesktopSurfaceState")
    expect(tileSource).not.toContain("getChatImageAttachmentDesktopSurfaceState")
    expect(overlaySource).not.toContain("getChatImageAttachmentCopyState")
    expect(tileSource).not.toContain("getChatImageAttachmentCopyState")
    expect(overlaySource).not.toContain("desktopImageAttachmentCopy")
    expect(tileSource).not.toContain("desktopImageAttachmentCopy")
    expect(overlaySource).not.toContain("flex flex-col gap-1.5 border-t bg-muted/30")
    expect(tileSource).not.toContain("flex flex-col gap-1.5 border-t bg-muted/20")
    expect(overlaySource).not.toContain('title="Remove image"')
    expect(tileSource).not.toContain('title="Remove image"')
  })

  it("uses the shared image attachment message builder for desktop follow-up submissions", () => {
    expect(messageImageUtilsSource).toContain("buildChatImageAttachmentMessage")
    expect(messageImageUtilsSource).toContain("return buildChatImageAttachmentMessage(trimmed, attachments)")
    expect(messageImageUtilsSource).toContain('from "@dotagents/shared/session-presentation"')
    expect(messageImageUtilsSource).not.toContain('from "@dotagents/shared/conversation-media-assets"')
    expect(messageImageUtilsSource).not.toContain("buildConversationImageMarkdownMessage(")
    expect(messageImageUtilsSource).not.toContain("fallbackAltText: `Image ${index + 1}`")
    expect(presentationSource).toContain("buildChatImageAttachmentMessage")
  })
})
