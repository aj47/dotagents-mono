import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'

const settingsGeneralSource = readFileSync(new URL('../src/renderer/src/pages/settings-general.tsx', import.meta.url), 'utf8')
const settingsModelsSource = readFileSync(new URL('../src/renderer/src/pages/settings-models.tsx', import.meta.url), 'utf8')
const settingsProvidersSource = readFileSync(new URL('../src/renderer/src/pages/settings-providers.tsx', import.meta.url), 'utf8')
const appLayoutSource = readFileSync(new URL('../src/renderer/src/components/app-layout.tsx', import.meta.url), 'utf8')
const routerSource = readFileSync(new URL('../src/renderer/src/router.tsx', import.meta.url), 'utf8')
const tipcSource = readFileSync(new URL('../src/main/tipc.ts', import.meta.url), 'utf8')
const sttModelsSource = readFileSync(new URL('../../../packages/shared/src/stt-models.ts', import.meta.url), 'utf8')

test('speech-to-text general settings link model configuration to the models page', () => {
  assert.match(settingsGeneralSource, /label="Model Selection"/)
  assert.match(settingsGeneralSource, /label="Transcript Processing"/)
  assert.match(settingsGeneralSource, /navigate\("\/settings\/models"\)/)
  assert.match(settingsGeneralSource, /Open Models page/)
  assert.match(settingsGeneralSource, /Prompt, provider, and model live on the Models page\./)
})

test('router and navigation split models and providers into separate pages', () => {
  assert.match(routerSource, /path: "settings\/providers",[\s\S]*?lazy: \(\) => import\("\.\/pages\/settings-providers"\)/)
  assert.match(routerSource, /path: "settings\/models",[\s\S]*?lazy: \(\) => import\("\.\/pages\/settings-models"\)/)
  assert.match(appLayoutSource, /text: "Models"[\s\S]*?href: "\/settings\/models"/)
  assert.match(appLayoutSource, /text: "Providers"[\s\S]*?href: "\/settings\/providers"[\s\S]*?icon: Plug2/)
  assert.match(appLayoutSource, /typeof link\.icon === "string"[\s\S]*?<link\.icon className="h-4 w-4 shrink-0" \/>/)
})

test('models page consolidates transcript processing with its provider, model, and prompt controls', () => {
  assert.match(settingsModelsSource, /ControlGroup title="Choose a Provider for Each Job" collapsible/)
  assert.match(settingsModelsSource, /ControlGroup title="Transcript Processing" collapsible/)
  assert.match(settingsModelsSource, /ControlGroup title="Speech & Voice Models" collapsible/)
  assert.match(settingsModelsSource, /ControlGroup title="Agent Models"/)
  assert.match(settingsModelsSource, /ControlGroup title="Advanced Agent Models" collapsible/)
  assert.match(settingsModelsSource, /label="Speech-to-Text"/)
  assert.match(settingsModelsSource, /label="Text-to-Speech"/)
  assert.match(settingsModelsSource, /label="Provider"/)
  assert.match(settingsModelsSource, /label="Enabled"/)
  assert.match(settingsModelsSource, /label="Prompt"/)
  assert.match(settingsModelsSource, /label="Speech-to-Text model"/)
  assert.match(settingsModelsSource, /label="Transcript Processing model"/)
  assert.match(settingsModelsSource, /Text-to-Speech model and voice/)
  assert.match(settingsModelsSource, /onlyTranscriptionModels=\{true\}/)
  assert.match(settingsModelsSource, /\{transcriptProcessingEnabled && \(/)
  assert.match(settingsModelsSource, /showTranscriptCleanupModel=\{transcriptProcessingEnabled && transcriptProcessingProviderId === "openai"\}/)
  assert.doesNotMatch(settingsModelsSource, /label="Transcript Cleanup"/)
  assert.doesNotMatch(settingsGeneralSource, /label="Post-Processing"/)
})

test('providers page is focused on setup rather than model selection', () => {
  assert.match(settingsProvidersSource, /Provider Setup/)
  assert.match(settingsProvidersSource, /All model and voice[\s\S]*selection now lives on the Models page/)
  assert.match(settingsProvidersSource, /Groq model selection now lives on the Models page/)
  assert.match(settingsProvidersSource, /Gemini model selection now lives on the Models page/)
  assert.doesNotMatch(settingsProvidersSource, /ControlGroup title="Voice Models"/)
})

test('runtime transcription path derives the remote STT model from config', () => {
  assert.match(tipcSource, /function getRemoteSttModel\(config: Config\): string/)
  const runtimeModelMatches = [...tipcSource.matchAll(/form\.append\([\s\S]{0,60}"model",[\s\S]{0,30}getRemoteSttModel\(config\)/g)]
  assert.equal(runtimeModelMatches.length, 4)
})

test('shared STT model catalog includes current OpenAI and Groq transcription defaults', () => {
  assert.match(sttModelsSource, /openai: "whisper-1"/)
  assert.match(sttModelsSource, /groq: "whisper-large-v3-turbo"/)
  assert.match(sttModelsSource, /gpt-4o-transcribe/)
  assert.match(sttModelsSource, /gpt-4o-mini-transcribe/)
  assert.match(sttModelsSource, /whisper-large-v3/)
})