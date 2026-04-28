import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const tipcPath = path.resolve(process.cwd(), 'apps/desktop/src/main/tipc.ts')
const tipcSource = fs.readFileSync(tipcPath, 'utf8')

test('dictation recording falls back to raw transcript when post-processing fails', () => {
  assert.match(
    tipcSource,
    /async function postProcessTranscriptSafely\(transcript: string, context: string\): Promise<string>/,
  )
  assert.match(
    tipcSource,
    /Transcript post-processing failed, using raw transcript instead/,
  )
  assert.match(
    tipcSource,
    /createRecording:[\s\S]*postProcessTranscriptSafely\(transcript, "createRecording"\)/,
  )
  assert.match(
    tipcSource,
    /createRecording:[\s\S]*postProcessTranscriptSafely\(json\.text, "createRecording"\)/,
  )
})

test('agent voice recordings apply transcript post-processing before queueing or processing', () => {
  assert.match(
    tipcSource,
    /createMcpRecording:[\s\S]*postProcessTranscriptSafely\(transcript, "createMcpRecording queued"\)[\s\S]*messageQueueService\.enqueue/,
  )
  assert.match(
    tipcSource,
    /createMcpRecording:[\s\S]*postProcessTranscriptSafely\(transcript, "createMcpRecording"\)[\s\S]*appendScreenshotToTranscript/,
  )
})
