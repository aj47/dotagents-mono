import { describe, expect, it } from "vitest"
import { pcmS16LeToFloat32ArrayBuffer, pcmS16LeToWav, validatePcmS16Le } from "./pcm-audio"

describe("Mentra PCM conversion", () => {
  it("converts signed little-endian samples to normalized float PCM", () => {
    const pcm = Buffer.alloc(8)
    pcm.writeInt16LE(-32_768, 0)
    pcm.writeInt16LE(-16_384, 2)
    pcm.writeInt16LE(0, 4)
    pcm.writeInt16LE(32_767, 6)

    const samples = new Float32Array(pcmS16LeToFloat32ArrayBuffer(pcm))
    expect(Array.from(samples)).toEqual([-1, -0.5, 0, 1])
  })

  it("wraps PCM in a valid 16 kHz mono WAV header", () => {
    const pcm = Buffer.from([0, 0, 255, 127])
    const wav = pcmS16LeToWav(pcm)

    expect(wav.toString("ascii", 0, 4)).toBe("RIFF")
    expect(wav.toString("ascii", 8, 12)).toBe("WAVE")
    expect(wav.readUInt16LE(22)).toBe(1)
    expect(wav.readUInt32LE(24)).toBe(16_000)
    expect(wav.readUInt16LE(34)).toBe(16)
    expect(wav.readUInt32LE(40)).toBe(pcm.length)
    expect(wav.subarray(44)).toEqual(pcm)
  })

  it("rejects empty and half-sample payloads", () => {
    expect(() => validatePcmS16Le(Buffer.alloc(0))).toThrow("empty")
    expect(() => validatePcmS16Le(Buffer.from([1]))).toThrow("complete 16-bit")
  })
})
