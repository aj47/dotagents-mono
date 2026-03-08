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

describe("desktop follow-up input submit guardrails", () => {
  it("adds an immediate in-flight guard to the overlay composer", () => {
    expect(overlaySource).toContain("const [isSubmitting, setIsSubmitting] = useState(false)")
    expect(overlaySource).toContain("const submitInFlightRef = useRef(false)")
    expect(overlaySource).toContain('import { toast } from "sonner"')
    expect(overlaySource).toContain(
      "pending: sendMutation.isPending || isSubmitting || submitInFlightRef.current",
    )
    expect(overlaySource).toContain("await sendMutation.mutateAsync(message)")
    expect(overlaySource).toContain("console.error(\"Failed to submit overlay follow-up message:\", error)")
    expect(overlaySource).toContain("Failed to send follow-up message")
    expect(overlaySource).toContain("toast.error(")
    expect(overlaySource).toContain(
      "const isDisabled = isSubmitting || sendMutation.isPending || (isSessionActive && !isQueueEnabled)",
    )
  })

  it("adds the same immediate in-flight guard to the tile composer", () => {
    expect(tileSource).toContain("const [isSubmitting, setIsSubmitting] = useState(false)")
    expect(tileSource).toContain("const submitInFlightRef = useRef(false)")
    expect(tileSource).toContain('import { toast } from "sonner"')
    expect(tileSource).toContain(
      "pending: sendMutation.isPending || isSubmitting || submitInFlightRef.current",
    )
    expect(tileSource).toContain("await sendMutation.mutateAsync(message)")
    expect(tileSource).toContain("console.error(\"Failed to submit tile follow-up message:\", error)")
    expect(tileSource).toContain("Failed to send follow-up message")
    expect(tileSource).toContain("toast.error(")
    expect(tileSource).toMatch(/isInitializingSession \|\|\s+isSubmitting \|\|\s+sendMutation\.isPending/)
  })
})