import { readFileSync } from "fs"
import { describe, expect, it } from "vitest"

const rendererMainSource = readFileSync(new URL("./main.tsx", import.meta.url), "utf8")
const mainTipcSource = readFileSync(new URL("../../main/tipc.ts", import.meta.url), "utf8")

describe("image context menu", () => {
  it("passes right-clicked image sources to the main context menu", () => {
    expect(rendererMainSource).toContain('e.target.closest("img")')
    expect(rendererMainSource).toContain("imageTarget.currentSrc || imageTarget.src")
    expect(rendererMainSource).toContain("imageSrc,")
  })

  it("copies image bytes from the main-process context menu", () => {
    expect(mainTipcSource).toContain('label: "Copy Image"')
    expect(mainTipcSource).toContain("copyImageSourceToClipboard")
    expect(mainTipcSource).toContain("clipboard.writeImage(image)")
    expect(mainTipcSource).toContain("nativeImage.createFromDataURL")
    expect(mainTipcSource).toContain("nativeImage.createFromPath")
    expect(mainTipcSource).toContain("net.fetch(trimmed)")
  })
})
