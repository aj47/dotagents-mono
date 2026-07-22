export const MENTRA_PCM_SAMPLE_RATE = 16_000
export const MENTRA_PCM_CHANNELS = 1
export const MENTRA_PCM_BITS_PER_SAMPLE = 16

export function validatePcmS16Le(audio: Buffer): void {
  if (!audio.length) {
    throw new Error("Audio payload is empty")
  }
  if (audio.length % 2 !== 0) {
    throw new Error("PCM audio payload must contain complete 16-bit samples")
  }
}

export function pcmS16LeToFloat32ArrayBuffer(audio: Buffer): ArrayBuffer {
  validatePcmS16Le(audio)
  const samples = new Float32Array(audio.length / 2)
  for (let index = 0; index < samples.length; index += 1) {
    const sample = audio.readInt16LE(index * 2)
    samples[index] = sample < 0 ? sample / 32_768 : sample / 32_767
  }
  return samples.buffer
}

export function pcmS16LeToWav(
  audio: Buffer,
  sampleRate = MENTRA_PCM_SAMPLE_RATE,
  channels = MENTRA_PCM_CHANNELS,
): Buffer {
  validatePcmS16Le(audio)

  const header = Buffer.alloc(44)
  const bytesPerSample = MENTRA_PCM_BITS_PER_SAMPLE / 8
  const byteRate = sampleRate * channels * bytesPerSample
  const blockAlign = channels * bytesPerSample

  header.write("RIFF", 0, "ascii")
  header.writeUInt32LE(36 + audio.length, 4)
  header.write("WAVE", 8, "ascii")
  header.write("fmt ", 12, "ascii")
  header.writeUInt32LE(16, 16)
  header.writeUInt16LE(1, 20)
  header.writeUInt16LE(channels, 22)
  header.writeUInt32LE(sampleRate, 24)
  header.writeUInt32LE(byteRate, 28)
  header.writeUInt16LE(blockAlign, 32)
  header.writeUInt16LE(MENTRA_PCM_BITS_PER_SAMPLE, 34)
  header.write("data", 36, "ascii")
  header.writeUInt32LE(audio.length, 40)

  return Buffer.concat([header, audio])
}
